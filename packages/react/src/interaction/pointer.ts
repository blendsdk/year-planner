import type { DateKey } from "@blendsdk/year-planner-core";
import type { GestureTarget } from "./gesture.js";

const RESIZE_SELECTOR = '[data-yp-part="resize-start"], [data-yp-part="resize-end"]';
const HOST_SELECTOR =
  'button, a, input, select, textarea, [contenteditable="true"], [role="textbox"], [role="link"], [role="checkbox"], [role="button"]:not([data-yp-part="item-proxy"])';
const PROXY_SELECTOR = '[data-yp-part="item-proxy"]';
const FRAGMENT_SELECTOR = '[data-yp-part="item-fragment"]';
const CELL_SELECTOR = '[data-yp-part="day-cell"]';

function asElement(target: EventTarget | null): Element | null {
  return target instanceof Element ? target : null;
}

/**
 * Returns true when the event target belongs to host content rather than a
 * planner-owned proxy or resize handle.
 */
export function isHostInteractive(target: EventTarget | null): boolean {
  const element = asElement(target);
  if (!element) return false;
  if (element.closest(RESIZE_SELECTOR)) return false;
  return element.closest(HOST_SELECTOR) !== null;
}

/**
 * Classifies a pointer-down or click target using the documented hit priority:
 * resize handle, host control, item proxy, date cell, nothing.
 *
 * The pointer date comes from the coordinate mapper; the DOM supplies stable
 * identity attributes and the cell date.
 */
export function classifyTarget(
  target: EventTarget | null,
  date: DateKey | undefined,
): GestureTarget {
  const element = asElement(target);
  if (!element) return { kind: "none" };

  const handle = element.closest(RESIZE_SELECTOR);
  if (handle) {
    const owner = handle.closest(FRAGMENT_SELECTOR) ?? handle.closest(PROXY_SELECTOR);
    const itemId = owner?.getAttribute("data-item-id");
    if (!itemId || !date) return { kind: "none" };
    return {
      kind: "resize",
      itemId,
      edge: handle.getAttribute("data-yp-part") === "resize-start" ? "start" : "end",
      date,
    };
  }

  if (isHostInteractive(element)) return { kind: "host-control" };

  const proxy = element.closest(PROXY_SELECTOR);
  if (proxy) {
    const itemId = proxy.getAttribute("data-item-id");
    const fragment = proxy.closest(FRAGMENT_SELECTOR);
    if (!itemId || !date) return { kind: "none" };
    return {
      kind: "item",
      itemId,
      fragmentId: fragment?.getAttribute("data-fragment-id") ?? itemId,
      date,
      annotation: fragment?.getAttribute("data-yp-channel") === "annotation",
    };
  }

  const cell = element.closest(CELL_SELECTOR);
  const cellDate = cell?.getAttribute("data-date") ?? undefined;
  if (cellDate) return { kind: "cell", date: cellDate };

  return { kind: "none" };
}
