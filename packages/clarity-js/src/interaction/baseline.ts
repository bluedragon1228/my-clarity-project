import { Event } from "@clarity-types/data";
import { BaselineData, BaselineState } from "@clarity-types/interaction";
import { time } from "@src/core/time";
import encode from "./encode";

export let state: BaselineState = null;
let buffer: BaselineData = null;
let update: boolean = false;

export function start(): void {
    reset();
}

export function reset(): void {
    state = update ? { time: time(), event: Event.Baseline, data: buffer } : state;
    buffer = { scrollX: 0, scrollY: 0, pointerX: 0, pointerY: 0 };
    update = false;
}

export function track(event: Event, x: number, y: number): void {
    switch (event) {
        case Event.Scroll:
            buffer.scrollX = x;
            buffer.scrollY = y;
            break;
        default:
            buffer.pointerX = x;
            buffer.pointerY = y;
            break;
    }
    update = true;
}

export function compute(): void {
    if (update) { encode(Event.Baseline); }
}

export function end(): void {
    reset();
}