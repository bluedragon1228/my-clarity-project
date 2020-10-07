import { Data, version } from "clarity-js";
import { BaselineEvent, CustomEvent, DecodedPayload, DecodedVersion, DimensionEvent } from "../types/data";
import { LimitEvent, MetricEvent, PingEvent, SummaryEvent, UpgradeEvent, UploadEvent, VariableEvent } from "../types/data";
import { ImageErrorEvent, LogEvent, ScriptErrorEvent } from "../types/diagnostic";
import { ClickEvent, InputEvent, PointerEvent, ResizeEvent, ScrollEvent, TimelineEvent } from "../types/interaction";
import { SelectionEvent, UnloadEvent, VisibilityEvent } from "../types/interaction";
import { BoxEvent, DocumentEvent, DomEvent, RegionEvent } from "../types/layout";
import { ConnectionEvent, NavigationEvent } from "../types/performance";

import * as data from "./data";
import * as diagnostic from "./diagnostic";
import * as interaction from "./interaction";
import * as layout from "./layout";
import * as performance from "./performance";

export function decode(input: string): DecodedPayload {
    let json: Data.Payload = JSON.parse(input);
    let envelope = data.envelope(json.e);
    let timestamp = Date.now();
    let payload: DecodedPayload = { timestamp, envelope };

    // Sort encoded events by time to simplify summary computation
    // It's possible for individual events to be out of order, dependent on how they are buffered on the client
    // E.g. scroll events are queued internally before they are sent over the wire.
    // By comparison, events like resize & click are sent out immediately.
    let encoded: Data.Token[][] = json.p ? json.a.concat(json.p) : json.a;
    encoded = encoded.sort((a: Data.Token[], b: Data.Token[]): number => (a[0] as number) - (b[0] as number));

    // Check if the incoming version is compatible with the current running code
    // We do an exact match for the major version and minor version.
    // For patch, we are backward and forward compatible with up to version change.
    let jsonVersion = parseVersion(payload.envelope.version);
    let codeVersion = parseVersion(version);

    if (jsonVersion.major !== codeVersion.major ||
        jsonVersion.minor !== codeVersion.minor ||
        Math.abs(jsonVersion.patch - codeVersion.patch) > 1) {
        throw new Error(`Invalid version. Actual: ${payload.envelope.version} | Expected: ${version} (+/- 1) | ${input.substr(0, 250)}`);
    }

    /* Reset components before decoding to keep them stateless */
    layout.reset();

    for (let entry of encoded) {
        switch (entry[1]) {
            case Data.Event.Baseline:
                if (payload.baseline === undefined) { payload.baseline = []; }
                payload.baseline.push(data.decode(entry) as BaselineEvent);
                break;
            case Data.Event.Ping:
                if (payload.ping === undefined) { payload.ping = []; }
                payload.ping.push(data.decode(entry) as PingEvent);
                break;
            case Data.Event.Limit:
                if (payload.limit === undefined) { payload.limit = []; }
                payload.limit.push(data.decode(entry) as LimitEvent);
                break;
            case Data.Event.Upgrade:
                if (payload.upgrade === undefined) { payload.upgrade = []; }
                payload.upgrade.push(data.decode(entry) as UpgradeEvent);
                break;
            case Data.Event.Metric:
                if (payload.metric === undefined) { payload.metric = []; }
                let metric = data.decode(entry) as MetricEvent;
                // It's not possible to accurately include the byte count of the payload within the same payload
                // The value we get from clarity-js lags behind by a payload. To work around that,
                // we increment the bytes from the incoming payload at decode time.
                metric.data[Data.Metric.TotalBytes] = input.length;
                payload.metric.push(metric);
                break;
            case Data.Event.Dimension:
                if (payload.dimension === undefined) { payload.dimension = []; }
                payload.dimension.push(data.decode(entry) as DimensionEvent);
                break;
            case Data.Event.Summary:
                if (payload.summary === undefined) { payload.summary = []; }
                payload.summary.push(data.decode(entry) as SummaryEvent);
                break;
            case Data.Event.Custom:
                if (payload.custom === undefined) { payload.custom = []; }
                payload.custom.push(data.decode(entry) as CustomEvent);
                break;
            case Data.Event.Variable:
                if (payload.variable === undefined) { payload.variable = []; }
                payload.variable.push(data.decode(entry) as VariableEvent);
                break;
            case Data.Event.Upload:
                if (payload.upload === undefined) { payload.upload = []; }
                payload.upload.push(data.decode(entry) as UploadEvent);
                break;
            case Data.Event.MouseDown:
            case Data.Event.MouseUp:
            case Data.Event.MouseMove:
            case Data.Event.MouseWheel:
            case Data.Event.DoubleClick:
            case Data.Event.TouchStart:
            case Data.Event.TouchCancel:
            case Data.Event.TouchEnd:
            case Data.Event.TouchMove:
                if (payload.pointer === undefined) { payload.pointer = []; }
                payload.pointer.push(interaction.decode(entry) as PointerEvent);
                break;
            case Data.Event.Click:
                if (payload.click === undefined) { payload.click = []; }
                let clickEntry = interaction.decode(entry) as ClickEvent;
                payload.click.push(clickEntry);
                break;
            case Data.Event.Scroll:
                if (payload.scroll === undefined) { payload.scroll = []; }
                payload.scroll.push(interaction.decode(entry) as ScrollEvent);
                break;
            case Data.Event.Resize:
                if (payload.resize === undefined) { payload.resize = []; }
                payload.resize.push(interaction.decode(entry) as ResizeEvent);
                break;
            case Data.Event.Selection:
                if (payload.selection === undefined) { payload.selection = []; }
                payload.selection.push(interaction.decode(entry) as SelectionEvent);
                break;
            case Data.Event.Timeline:
                if (payload.timeline === undefined) { payload.timeline = []; }
                payload.timeline.push(interaction.decode(entry) as TimelineEvent);
                break;
            case Data.Event.Input:
                if (payload.input === undefined) { payload.input = []; }
                payload.input.push(interaction.decode(entry) as InputEvent);
                break;
            case Data.Event.Unload:
                if (payload.unload === undefined) { payload.unload = []; }
                payload.unload.push(interaction.decode(entry) as UnloadEvent);
                break;
            case Data.Event.Visibility:
                if (payload.visibility === undefined) { payload.visibility = []; }
                payload.visibility.push(interaction.decode(entry) as VisibilityEvent);
                break;
            case Data.Event.Box:
                if (payload.box === undefined) { payload.box = []; }
                payload.box.push(layout.decode(entry) as BoxEvent);
                break;
            case Data.Event.Region:
                if (payload.region === undefined) { payload.region = []; }
                payload.region.push(layout.decode(entry) as RegionEvent);
                break;
            case Data.Event.Discover:
            case Data.Event.Mutation:
                if (payload.dom === undefined) { payload.dom = []; }
                payload.dom.push(layout.decode(entry) as DomEvent);
                break;
            case Data.Event.Document:
                if (payload.doc === undefined) { payload.doc = []; }
                payload.doc.push(layout.decode(entry) as DocumentEvent);
                break;
            case Data.Event.ScriptError:
                if (payload.script === undefined) { payload.script = []; }
                payload.script.push(diagnostic.decode(entry) as ScriptErrorEvent);
                break;
            case Data.Event.ImageError:
                if (payload.image === undefined) { payload.image = []; }
                payload.image.push(diagnostic.decode(entry) as ImageErrorEvent);
                break;
            case Data.Event.Log:
                if (payload.log === undefined) { payload.log = []; }
                payload.log.push(diagnostic.decode(entry) as LogEvent);
                break;
            case Data.Event.Connection:
                if (payload.connection === undefined) { payload.connection = []; }
                payload.connection.push(performance.decode(entry) as ConnectionEvent);
                break;
            case Data.Event.Navigation:
                if (payload.navigation === undefined) { payload.navigation = []; }
                payload.navigation.push(performance.decode(entry) as NavigationEvent);
                break;
            default:
                console.error(`No handler for Event: ${JSON.stringify(entry)}`);
                break;
        }
    }

    return payload;
}


function parseVersion(ver: string): DecodedVersion {
    let output: DecodedVersion = { major: 0, minor: 0, patch: 0, beta: 0 };
    let parts = ver.split(".");
    if (parts.length === 3) {
        let subparts = parts[2].split("-b");
        output.major = parseInt(parts[0], 10);
        output.minor = parseInt(parts[1], 10);
        if (subparts.length === 2) {
            output.patch = parseInt(subparts[0], 10);
            output.beta = parseInt(subparts[1], 10);
        } else { output.patch = parseInt(parts[2], 10); }
    }
    return output;
}
