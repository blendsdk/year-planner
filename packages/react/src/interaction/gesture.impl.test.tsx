import type { PlannerItem, RibbonLayout } from "@blendsdk/year-planner-core";
import { describe, expect, it } from "vitest";
import {
  autoScrollDelta,
  beginGesture,
  cancelGesture,
  designRectBetween,
  designRectToScreen,
  endGesture,
  type GestureContext,
  type GestureTarget,
  intersectMarquee,
  moveGesture,
} from "./gesture.js";
import { classifyTarget, isHostInteractive } from "./pointer.js";

const plain = { shift: false, mod: false };

const item = (
  id: string,
  startDate: string,
  endDateExclusive: string,
  overrides: Partial<PlannerItem> = {},
): PlannerItem => ({
  id,
  kind: "activity",
  layerId: "ribbon",
  period: { kind: "all-day", startDate, endDateExclusive },
  title: id,
  version: 1,
  ...overrides,
});

const context = (overrides: Partial<GestureContext> = {}): GestureContext => ({
  mode: "auto",
  marquee: "items",
  threshold: 4,
  items: new Map([["a", item("a", "2027-01-28", "2027-02-07")]]),
  isDisabled: () => false,
  isEditable: () => true,
  ...overrides,
});

const cell = (date: string): GestureTarget => ({ kind: "cell", date });
const proxy = (date: string): GestureTarget => ({
  kind: "item",
  itemId: "a",
  fragmentId: "a-0",
  date,
  annotation: false,
});

const begin = (target: GestureTarget, date: string, ctx = context(), design = { x: 0, y: 0 }) =>
  beginGesture({
    target,
    point: { clientX: 100, clientY: 100 },
    design,
    pointerId: 1,
    modifiers: plain,
    date,
    context: ctx,
  });

const move = (
  state: ReturnType<typeof begin>,
  clientX: number,
  date: string | undefined,
  ctx = context(),
  design = { x: clientX - 100, y: 0 },
) =>
  moveGesture({
    state,
    point: { clientX, clientY: 100 },
    design,
    date,
    context: ctx,
  });

const end = (state: ReturnType<typeof begin>, date: string | undefined, ctx = context()) =>
  endGesture({
    state,
    point: { clientX: 150, clientY: 100 },
    design: { x: 50, y: 0 },
    date,
    context: ctx,
  });

const fragment = (
  itemId: string,
  rowIndex: number,
  lane: number,
  channel: "ribbon" | "annotation" | "highlight" = "ribbon",
) => ({
  fragmentId: `${itemId}-${rowIndex}-${lane}`,
  itemId,
  rowId: `row-${rowIndex}`,
  rowIndex,
  sourcePeriod: {
    kind: "all-day" as const,
    startDate: "2027-02-01",
    endDateExclusive: "2027-02-03",
  },
  clippedStart: "2027-02-01",
  clippedEndExclusive: "2027-02-03",
  startColumn: 0,
  endColumnExclusive: 2,
  x: 0,
  y: rowIndex * 18 + lane * 18,
  width: 100,
  height: 18,
  lane,
  isStartClipped: false,
  isEndClipped: false,
  channel,
});

const ribbons = (fragments: ReturnType<typeof fragment>[]): RibbonLayout => ({
  rows: [],
  fragments,
  density: "compact",
  compactMaxLanes: 3,
  laneHeight: 18,
  laneTop: 18,
  headerHeight: 36,
  footerHeight: 28,
  monthBandWidth: 70,
  totalDayWidth: 2000,
  totalWidth: 2140,
  height: 1000,
  signature: "test",
});

function element(html: string): Element {
  const container = document.createElement("div");
  container.innerHTML = html;
  return container.firstElementChild as Element;
}

describe("gesture engine internals", () => {
  it("returns a click for a pending press and nothing for idle", () => {
    const pending = begin(cell("2027-02-01"), "2027-02-01");
    expect(end(pending, "2027-02-01")).toEqual({
      kind: "click",
      target: cell("2027-02-01"),
      modifiers: plain,
    });
    expect(end({ phase: "idle" }, "2027-02-01")).toEqual({ kind: "none" });
  });

  it("does not activate item moves in inspect or select mode", () => {
    const inspect = move(
      begin(proxy("2027-01-28"), "2027-01-28", context({ mode: "inspect" })),
      140,
      "2027-01-28",
      context({ mode: "inspect" }),
    );
    expect(inspect.phase).toBe("idle");
    const select = move(
      begin(proxy("2027-01-28"), "2027-01-28", context({ mode: "select" })),
      140,
      "2027-01-28",
      context({ mode: "select" }),
    );
    expect(select.phase).toBe("idle");
  });

  it("ignores annotation and host-control targets", () => {
    const annotation = begin(
      {
        kind: "item",
        itemId: "a",
        fragmentId: "a-0",
        date: "2027-02-01",
        annotation: true,
      },
      "2027-02-01",
    );
    expect(move(annotation, 140, "2027-02-01").phase).toBe("idle");
    expect(begin({ kind: "host-control" }, "2027-02-01").phase).toBe("idle");
  });

  it("does not resize in select mode", () => {
    const state = begin(
      { kind: "resize", itemId: "a", edge: "end", date: "2027-02-01" },
      "2027-02-01",
      context({ mode: "select" }),
    );
    expect(move(state, 140, "2027-02-01", context({ mode: "select" })).phase).toBe("idle");
  });

  it("paints through an item proxy in paint mode", () => {
    const ctx = context({ mode: "paint" });
    const state = begin(proxy("2027-02-01"), "2027-02-01", ctx);
    const active = move(state, 140, "2027-02-02", ctx);
    expect(active.phase).toBe("active");
    if (active.phase === "active") expect(active.gesture.kind).toBe("paint");
    expect(end(active, "2027-02-02", ctx)).toMatchObject({
      kind: "paint",
      operation: "union",
    });
  });

  it("emits a subtract paint command in erase mode", () => {
    const ctx = context({ mode: "erase" });
    const state = begin(cell("2027-02-01"), "2027-02-01", ctx);
    const active = move(state, 140, "2027-02-02", ctx);
    expect(end(active, "2027-02-02", ctx)).toMatchObject({
      kind: "paint",
      operation: "subtract",
    });
  });

  it("creates a range in create mode", () => {
    const ctx = context({ mode: "create" });
    const state = begin(cell("2027-02-01"), "2027-02-01", ctx);
    const active = move(state, 140, "2027-02-02", ctx);
    expect(end(active, "2027-02-02", ctx)).toMatchObject({
      kind: "create",
      startDate: "2027-02-01",
      endDateExclusive: "2027-02-03",
    });
  });

  it("rejects a timed move and a disabled range", () => {
    const timed = context({
      items: new Map([
        [
          "a",
          item("a", "2027-01-28", "2027-02-07", {
            period: {
              kind: "timed",
              start: "2027-01-28T08:00:00Z",
              endExclusive: "2027-01-28T10:00:00Z",
              timeZone: "UTC",
            },
          }),
        ],
      ]),
    });
    const timedState = begin(proxy("2027-01-28"), "2027-01-28", timed);
    const timedActive = move(timedState, 140, "2027-01-29", timed);
    expect(end(timedActive, "2027-01-29", timed)).toMatchObject({
      kind: "invalid",
      code: "TIMED_EDITING_UNSUPPORTED",
    });

    const disabled = context({
      mode: "create",
      isDisabled: (date) => date === "2027-02-02",
    });
    const state = begin(cell("2027-02-01"), "2027-02-01", context({ mode: "create" }));
    const active = move(state, 140, "2027-02-03", disabled);
    expect(end(active, "2027-02-03", disabled)).toMatchObject({
      kind: "invalid",
      code: "INVALID_COMMAND",
    });
  });

  it("rejects a resize that contains a disabled date", () => {
    const ctx = context({
      items: new Map([["a", item("a", "2027-02-01", "2027-02-06")]]),
      isDisabled: (date) => date === "2027-02-04",
    });
    const state = begin(
      { kind: "resize", itemId: "a", edge: "end", date: "2027-02-04" },
      "2027-02-04",
      ctx,
    );
    const active = move(state, 140, "2027-02-04", ctx);
    expect(end(active, "2027-02-04", ctx)).toMatchObject({ kind: "invalid" });
  });

  it("cancels a pending gesture and restores its date", () => {
    expect(cancelGesture(begin(cell("2027-02-01"), "2027-02-01"))).toEqual({
      state: { phase: "idle" },
      restore: { date: "2027-02-01" },
    });
  });

  it("computes negative edge scroll on the left and top", () => {
    const delta = autoScrollDelta({
      point: { clientX: 5, clientY: 5 },
      viewportRect: { left: 0, top: 0, width: 1200, height: 800 },
    });
    expect(delta.x).toBeLessThan(0);
    expect(delta.y).toBeLessThan(0);
    expect(Math.abs(delta.x)).toBeLessThanOrEqual(12);
  });

  it("converts a design rectangle to screen coordinates", () => {
    expect(
      designRectToScreen(
        { left: 10, top: 20, width: 30, height: 40 },
        {
          zoom: 1.5,
          monthBandWidth: 70,
          scrollLeft: 100,
          scrollTop: 50,
          viewportRect: { left: 0, top: 0, width: 1200, height: 800 },
          headerHeight: 36,
        },
      ),
    ).toEqual({ left: 20, top: 16, width: 45, height: 60 });
  });

  it("excludes annotations when annotations are hidden", () => {
    const layout = ribbons([fragment("note", 0, 0, "annotation")]);
    const options = {
      visible: new Set(["note"]),
      showAnnotations: false,
      visibleLaneCount: () => 3,
    };
    expect(intersectMarquee(layout, { left: 0, top: 0, width: 20, height: 20 }, options)).toEqual(
      [],
    );
    expect(
      intersectMarquee(
        layout,
        { left: 0, top: 0, width: 20, height: 20 },
        {
          ...options,
          showAnnotations: true,
        },
      ),
    ).toEqual(["note"]);
  });

  it("uses the per-row visible lane count", () => {
    const layout = ribbons([fragment("a", 0, 3)]);
    expect(
      intersectMarquee(
        layout,
        { left: 0, top: 0, width: 100, height: 100 },
        {
          visible: new Set(["a"]),
          showAnnotations: true,
          visibleLaneCount: () => 3,
        },
      ),
    ).toEqual([]);
  });

  it("classifies host controls, handles, proxies and cells", () => {
    const hostButton = element('<button data-testid="host">Host</button>');
    expect(isHostInteractive(hostButton)).toBe(true);
    expect(classifyTarget(hostButton, "2027-02-01")).toEqual({ kind: "host-control" });

    const handle = element(
      '<div data-yp-part="item-fragment" data-item-id="a"><button data-yp-part="resize-start"></button></div>',
    ).firstElementChild as Element;
    expect(isHostInteractive(handle)).toBe(false);
    expect(classifyTarget(handle, "2027-02-01")).toEqual({
      kind: "resize",
      itemId: "a",
      edge: "start",
      date: "2027-02-01",
    });

    const proxy = element('<div data-yp-part="item-proxy" data-item-id="a"></div>');
    expect(classifyTarget(proxy, "2027-02-01")).toMatchObject({
      kind: "item",
      itemId: "a",
      annotation: false,
    });

    const cellElement = element('<div data-yp-part="day-cell" data-date="2027-02-01"></div>');
    expect(classifyTarget(cellElement, undefined)).toEqual({
      kind: "cell",
      date: "2027-02-01",
    });
    expect(classifyTarget(document.body, undefined)).toEqual({ kind: "none" });
    expect(classifyTarget(null, undefined)).toEqual({ kind: "none" });
    const handleWithoutOwner = element('<button data-yp-part="resize-start"></button>');
    expect(classifyTarget(handleWithoutOwner, "2027-02-01")).toEqual({ kind: "none" });
    const proxyWithoutDate = element('<div data-yp-part="item-proxy" data-item-id="a"></div>');
    expect(classifyTarget(proxyWithoutDate, undefined)).toEqual({ kind: "none" });
    const annotation = element(
      '<div data-yp-part="item-fragment" data-yp-channel="annotation" data-item-id="a"><div data-yp-part="item-proxy" data-item-id="a"></div></div>',
    ).firstElementChild as Element;
    expect(classifyTarget(annotation, "2027-02-01")).toMatchObject({ annotation: true });
  });

  it("does not classify a host button inside a proxy as an editable item", () => {
    const proxy = element(
      '<div data-yp-part="item-proxy" data-item-id="a"><button data-testid="inner">x</button></div>',
    );
    const button = proxy.firstElementChild as Element;
    expect(classifyTarget(button, "2027-02-01")).toEqual({ kind: "host-control" });
  });

  it("uses the handle edge and date from the DOM", () => {
    const handle = element(
      '<div data-yp-part="item-fragment" data-item-id="a"><button data-yp-part="resize-end"></button></div>',
    ).firstElementChild as Element;
    expect(classifyTarget(handle, "2027-02-03")).toMatchObject({ edge: "end", date: "2027-02-03" });
  });

  it("cancels pending item/resize gestures and active non-item gestures", () => {
    const itemPending = begin(proxy("2027-01-28"), "2027-01-28");
    expect(cancelGesture(itemPending)).toEqual({
      state: { phase: "idle" },
      restore: { itemId: "a", date: "2027-01-28" },
    });
    const resizePending = begin(
      { kind: "resize", itemId: "a", edge: "end", date: "2027-02-01" },
      "2027-02-01",
    );
    expect(cancelGesture(resizePending)).toEqual({
      state: { phase: "idle" },
      restore: { itemId: "a", date: "2027-02-01" },
    });
    const paint = begin(cell("2027-02-01"), "2027-02-01", context({ mode: "paint" }));
    const active = move(paint, 140, "2027-02-02", context({ mode: "paint" }));
    expect(cancelGesture(active).restore).toEqual({ date: "2027-02-02" });
    expect(cancelGesture({ phase: "idle" })).toEqual({ state: { phase: "idle" } });
  });

  it("does not move when editability denies or the item disappears", () => {
    const denied = context({ isEditable: () => false });
    const pending = begin(proxy("2027-01-28"), "2027-01-28", denied);
    expect(move(pending, 140, "2027-01-29", denied).phase).toBe("idle");

    const missing = context({ items: new Map() });
    const missingPending = begin(proxy("2027-01-28"), "2027-01-28", missing);
    expect(move(missingPending, 140, "2027-01-29", missing).phase).toBe("idle");
  });

  it("rejects a move whose proposed range contains a disabled date", () => {
    const disabled = context({ isDisabled: (date) => date === "2027-02-03" });
    const state = begin(proxy("2027-01-28"), "2027-01-28", disabled);
    const active = move(state, 140, "2027-02-02", disabled);
    expect(end(active, "2027-02-02", disabled)).toMatchObject({
      kind: "invalid",
      code: "INVALID_COMMAND",
    });
  });

  it("handles an item disappearing before the move completes", () => {
    const state = begin(proxy("2027-01-28"), "2027-01-28");
    const active = move(state, 140, "2027-01-29");
    expect(end(active, "2027-01-29", context({ items: new Map() }))).toMatchObject({
      kind: "invalid",
      code: "INVALID_COMMAND",
    });
  });

  it("keeps a blocked active gesture stable on further moves", () => {
    const timed = context({
      items: new Map([
        [
          "a",
          item("a", "2027-01-28", "2027-02-07", {
            period: {
              kind: "timed",
              start: "2027-01-28T08:00:00Z",
              endExclusive: "2027-01-28T10:00:00Z",
              timeZone: "UTC",
            },
          }),
        ],
      ]),
    });
    const active = move(begin(proxy("2027-01-28"), "2027-01-28", timed), 140, "2027-01-29", timed);
    const again = move(active, 160, "2027-01-30", timed);
    if (active.phase !== "active" || again.phase !== "active") throw new Error("expected active");
    expect(again.gesture).toEqual(active.gesture);
  });
});
