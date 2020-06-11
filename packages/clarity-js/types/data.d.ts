export type Target = (number | Node);
export type Token = (string | number | number[] | string[]);
export type DecodedToken = (any | any[]);

/* Enum */

export const enum Event {
    /* Data */
    Metric = 0,
    Dimension = 1,
    Upload = 2,
    Upgrade = 3,
    Baseline = 4,
    Timeline = 5,
    Discover = 6,
    Mutation = 7,
    Region = 8,
    Document = 9,
    Click = 10,
    Scroll = 11,
    Resize = 12,
    MouseMove = 13,
    MouseDown = 14,
    MouseUp = 15,
    MouseWheel = 16,
    DoubleClick = 17,
    TouchStart = 18,
    TouchEnd = 19,
    TouchMove = 20,
    TouchCancel = 21,
    Selection = 22,
    Page = 23,
    Tag = 24,
    Ping = 25,
    Unload = 26,
    Input = 27,
    Visibility = 28,
    Navigation = 29,
    Connection = 30,
    ScriptError = 31,
    ImageError = 32,
    Log = 33
}

export const enum Metric {
    ClientTimestamp = 0,
    Playback = 1,
    TotalBytes = 2,
    LayoutCost = 3,
    TotalCost = 4,
    InvokeCount = 5,
    ThreadBlockedTime = 6,
    LongTaskCount = 7,
    LargestPaint = 8,
    CumulativeLayoutShift = 9,
    FirstInputDelay = 10
}

export const enum Dimension {
    UserAgent = 0,
    Url = 1,
    Referrer = 2,
    PageTitle = 3,
    NetworkHosts = 4,
    Tags = 5
}

export const enum Code {
    RunTask = 0,
    CssRules = 1,
    MutationObserver = 2,
    PerformanceObserver = 3
}

export const enum Severity {
    Info = 0,
    Warning = 1,
    Error = 2,
    Fatal = 3
}

export const enum Upload {
    Async = 0,
    Beacon = 1
}

export const enum BooleanFlag {
    False = 0,
    True = 1
}

/* Helper Interfaces */

export interface Payload {
    e: Token[];
    d: Token[][];
}

export interface EncodedPayload {
    e: string;
    d: string;
}

export interface Metadata {
    projectId: number;
    userId: number;
    sessionId: number;
    pageNum: number;
}

export interface TargetMetadata {
    id: number;
    region: number;
    hash: number;
    node: Node;
}

export interface Envelope extends Metadata {
    sequence: number;
    start: number;
    duration: number;
    version: string;
    upload: Upload;
    end: BooleanFlag;
}

export interface Transit {
    [key: number]: {
        data: string;
        attempts: number;
    };
}

export interface BaselineState {
    time: number;
    event: number;
    data: BaselineData;
}

/* Event Data */
export interface BaselineData {
    visible: BooleanFlag;
    docWidth: number;
    docHeight: number;
    screenWidth: number;
    screenHeight: number;
}

export interface DimensionData {
    [key: number]: string[];
}

export interface MetricData {
    [key: number]: number;
}

export interface PingData {
    gap: number;
}

export interface TagData {
    key: string;
    value: string[];
}

export interface UpgradeData {
    key: string;
}

export interface UploadData {
    sequence: number;
    attempts: number;
    status: number;
}