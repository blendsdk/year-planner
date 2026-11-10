import {
  buildClassicYearLayout,
  type PlannerItem,
  type RibbonFragment,
  type RibbonLayout,
  type RibbonRow,
} from "@blendsdk/year-planner-core";
import { describe, expect, it } from "vitest";
import { pointToDate } from "../geometry.js";
import {
  autoScrollDelta,
  beginGesture,
  cancelGesture,
  designRectBetween,
  endGesture,
  exceedsThreshold,
  type GestureContext,
  type GesturePoint,
  type GestureTarget,
  gestureContextChanged,
  intersectMarquee,
  moveGesture,
} from "./gesture.js";

const plain = { shift: false, mod: false };
const shift = { shift: true, mod: false };

const item = (id: string, startDate: string, endDateExclusive: string): PlannerItem => ({
  id,
  kind: "activity",
  layerId: "ribbon",
  period: { kind: "all-day", startDate, endDateExclusive },
  title: id,
  version: 1,
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
const handle = (edge: "start" | "end", date: string): GestureTarget => ({
  kind: "resize",
  itemId: "a",
  fragmentId: "a-0",
  edge,
  date,
});

const point = (clientX: number, clientY = 100): GesturePoint => ({ clientX, clientY });

const begin = (
  target: GestureTarget,
  date: string,
  ctx: GestureContext = context(),
  start = { x: 0, y: 0 },
) =>
  beginGesture({
    target,
    point: point(100),
    design: start,
    pointerId: 1,
    modifiers: plain,
    date,
    context: ctx,
  });

const move = (
  state: ReturnType<typeof beginGesture>,
  clientX: number,
  date: string | undefined,
  ctx: GestureContext = context(),
  design = { x: clientX - 100, y: 0 },
) =>
  moveGesture({
    state,
    point: point(clientX),
    design,
    date,
    context: ctx,
  });

const end = (
  state: ReturnType<typeof beginGesture>,
  date: string | undefined,
  ctx: GestureContext = context(),
  design = { x: 40, y: 0 },
) =>
  endGesture({
    state,
    design,
    date,
    context: ctx,
  });

const fragment = (
  itemId: string,
  rowIndex: number,
  lane: number,
  channel: RibbonFragment["channel"] = "ribbon",
): RibbonFragment => ({
  fragmentId: `${itemId}-${rowIndex}-${lane}`,
  itemId,
  rowId: `row-${rowIndex}`,
  rowIndex,
  sourcePeriod: { kind: "all-day", startDate: "2027-02-01", endDateExclusive: "2027-02-03" },
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

const ribbonLayout = (fragments: RibbonFragment[]): RibbonLayout => ({
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

describe("RD-07 gesture engine", () => {
  it("stays pending below the threshold", () => {
    const state = begin(cell("2027-02-01"), "2027-02-01");
    expect(state.phase).toBe("pending");
    const next = move(state, 102, "2027-02-01");
    expect(next.phase).toBe("pending");
  });

  it("activates at exactly the threshold", () => {
    const state = begin(cell("2027-02-01"), "2027-02-01");
    const next = move(state, 104, "2027-02-01");
    expect(next.phase).toBe("active");
    if (next.phase === "active") expect(next.gesture.kind).toBe("marquee");
  });

  it("computes a bounded edge auto-scroll delta", () => {
    const viewportRect = { left: 0, top: 0, width: 1200, height: 800 };
    expect(autoScrollDelta({ point: { clientX: 1195, clientY: 400 }, viewportRect })).toEqual({
      x: 12 * (27 / 32),
      y: 0,
    });
    expect(autoScrollDelta({ point: { clientX: 600, clientY: 400 }, viewportRect })).toEqual({
      x: 0,
      y: 0,
    });
  });

  it("maps a client point to the expected date with scroll and zoom", () => {
    const result = buildClassicYearLayout({ year: 2027 });
    if (!result.ok) throw new Error("layout failed");
    expect(
      pointToDate(
        result.layout,
        { clientX: 266.25, clientY: 36.5 },
        {
          zoom: 1.25,
          monthBandWidth: 70,
          scrollLeft: 200,
          scrollTop: 0,
          viewportRect: { left: 0, top: 0, width: 1200, height: 800 },
          headerHeight: 36,
        },
      ),
    ).toBe("2026-12-04");
  });

  it("maps through rendered ribbon row heights when provided", () => {
    const result = buildClassicYearLayout({ year: 2027 });
    if (!result.ok) throw new Error("layout failed");
    let top = 0;
    const rows: RibbonRow[] = result.layout.rows.map((row, index) => {
      const height = index === 0 ? 180 : 90;
      const entry = {
        rowId: row.rowId,
        rowIndex: index,
        top,
        height,
        laneCount: 1,
        visibleLaneCount: 1,
        overflowCount: 0,
        overflow: [],
        fragments: [],
      };
      top += height;
      return entry;
    });
    const ribbons: RibbonLayout = { ...ribbonLayout([]), rows };
    expect(
      pointToDate(
        result.layout,
        { clientX: 380, clientY: 236 },
        {
          zoom: 1,
          monthBandWidth: 70,
          scrollLeft: 0,
          scrollTop: 0,
          viewportRect: { left: 0, top: 0, width: 1200, height: 800 },
          headerHeight: 36,
        },
        ribbons,
      ),
    ).toBe("2027-01-01");
  });

  it("does not start a gesture on a blank target", () => {
    expect(begin({ kind: "none" }, "2027-02-01").phase).toBe("idle");
  });

  it("holds the last valid date when the pointer crosses a blank slot", () => {
    const state = begin(cell("2027-02-01"), "2027-02-01", context({ mode: "select" }));
    const active = move(state, 120, undefined, context({ mode: "select" }));
    expect(active.phase).toBe("active");
    if (active.phase !== "active") return;
    const completion = end(active, undefined, context({ mode: "select" }));
    expect(completion).toEqual({
      kind: "select",
      anchor: "2027-02-01",
      focus: "2027-02-01",
      modifiers: plain,
    });
  });

  it("builds a chronological cross-row range", () => {
    const state = begin(cell("2027-01-31"), "2027-01-31", context({ mode: "select" }));
    const active = move(state, 160, "2027-02-02", context({ mode: "select" }));
    const completion = end(active, "2027-02-02", context({ mode: "select" }));
    expect(completion).toMatchObject({
      kind: "select",
      anchor: "2027-01-31",
      focus: "2027-02-02",
    });
  });

  it("deduplicates marquee hits by item", () => {
    const result = intersectMarquee(
      ribbonLayout([fragment("a", 0, 0), fragment("a", 1, 0), fragment("b", 1, 1)]),
      { left: 0, top: 0, width: 50, height: 50 },
      { visible: new Set(["a", "b"]), showAnnotations: true, visibleLaneCount: () => 3 },
    );
    expect(result).toEqual(["a", "b"]);
  });

  it("excludes hidden, overflow and backdrop fragments from a marquee", () => {
    const result = intersectMarquee(
      ribbonLayout([
        fragment("hidden", 0, 0),
        fragment("overflow", 0, 5),
        fragment("backdrop", 0, 0, "highlight"),
        fragment("visible", 0, 1),
      ]),
      { left: 0, top: 0, width: 100, height: 100 },
      {
        visible: new Set(["visible", "overflow"]),
        showAnnotations: true,
        visibleLaneCount: () => 3,
      },
    );
    expect(result).toEqual(["visible"]);
  });

  it("uses the pointerup design point for the marquee rectangle", () => {
    const state = begin(cell("2027-02-01"), "2027-02-01");
    const active = move(state, 110, "2027-02-01", context(), { x: 10, y: 10 });
    const completion = end(active, "2027-02-01", context(), { x: 50, y: 40 });
    expect(completion).toEqual({
      kind: "marquee",
      rect: { left: 0, top: 0, width: 50, height: 40 },
      modifiers: plain,
    });
  });

  it("moves a 10-day item and preserves its duration", () => {
    const state = begin(proxy("2027-01-28"), "2027-01-28");
    const active = move(state, 140, "2027-02-02");
    const completion = end(active, "2027-02-02");
    expect(completion).toEqual({
      kind: "move",
      itemId: "a",
      proposedPeriod: {
        kind: "all-day",
        startDate: "2027-02-02",
        endDateExclusive: "2027-02-12",
      },
      fallbackDate: "2027-01-28",
    });
  });

  it("applies the pointer-down grab offset when moving", () => {
    const state = begin(proxy("2027-01-30"), "2027-01-30");
    const active = move(state, 140, "2027-02-03");
    const completion = end(active, "2027-02-03");
    expect(completion).toMatchObject({
      kind: "move",
      proposedPeriod: { startDate: "2027-02-01", endDateExclusive: "2027-02-11" },
    });
  });

  it("resizes the end to a one-day period", () => {
    const ctx = context({ items: new Map([["a", item("a", "2027-02-01", "2027-02-06")]]) });
    const state = begin(handle("end", "2027-02-01"), "2027-02-01", ctx);
    const active = move(state, 140, "2027-02-01", ctx);
    const completion = end(active, "2027-02-01", ctx);
    expect(completion).toMatchObject({
      kind: "resize",
      proposedPeriod: { startDate: "2027-02-01", endDateExclusive: "2027-02-02" },
    });
  });

  it("resizes the start to a one-day period", () => {
    const ctx = context({ items: new Map([["a", item("a", "2027-02-01", "2027-02-06")]]) });
    const state = begin(handle("start", "2027-02-05"), "2027-02-05", ctx);
    const active = move(state, 140, "2027-02-05", ctx);
    const completion = end(active, "2027-02-05", ctx);
    expect(completion).toMatchObject({
      kind: "resize",
      proposedPeriod: { startDate: "2027-02-05", endDateExclusive: "2027-02-06" },
    });
  });

  it("rejects a resize whose end is before its start", () => {
    const ctx = context({ items: new Map([["a", item("a", "2027-02-01", "2027-02-06")]]) });
    const state = begin(handle("end", "2027-01-31"), "2027-01-31", ctx);
    const active = move(state, 140, "2027-01-31", ctx);
    const completion = end(active, "2027-01-31", ctx);
    expect(completion).toMatchObject({ kind: "invalid", code: "INVALID_COMMAND" });
  });

  it("builds a chronological paint range from a reversed drag", () => {
    const state = begin(cell("2027-02-06"), "2027-02-06", context({ mode: "paint" }));
    const active = move(state, 140, "2027-02-02", context({ mode: "paint" }));
    const completion = end(active, "2027-02-02", context({ mode: "paint" }));
    expect(completion).toMatchObject({
      kind: "paint",
      operation: "union",
      startDate: "2027-02-02",
      endDateExclusive: "2027-02-07",
    });
  });

  it("cancels on a real context change but not an equal-content rerender", () => {
    expect(
      gestureContextChanged(
        { signature: "same", mode: "auto" },
        { signature: "same", mode: "auto" },
      ),
    ).toBe(false);
    expect(
      gestureContextChanged(
        { signature: "same", mode: "auto" },
        { signature: "same", mode: "select" },
      ),
    ).toBe(true);
    expect(
      gestureContextChanged({ signature: "one", mode: "auto" }, { signature: "two", mode: "auto" }),
    ).toBe(true);
  });

  it("restores the source item when a gesture is cancelled", () => {
    const state = begin(proxy("2027-01-28"), "2027-01-28");
    const active = move(state, 140, "2027-02-02");
    expect(cancelGesture(active)).toEqual({
      state: { phase: "idle" },
      restore: { itemId: "a", date: "2027-01-28" },
    });
  });

  it("computes a normalized design rectangle", () => {
    expect(designRectBetween({ x: 50, y: 40 }, { x: 10, y: 10 })).toEqual({
      left: 10,
      top: 10,
      width: 40,
      height: 30,
    });
  });

  it("treats a 4 px move as active and a 3.9 px move as pending", () => {
    expect(exceedsThreshold({ clientX: 0, clientY: 0 }, { clientX: 4, clientY: 0 }, 4)).toBe(true);
    expect(exceedsThreshold({ clientX: 0, clientY: 0 }, { clientX: 3.9, clientY: 0 }, 4)).toBe(
      false,
    );
  });

  it("keeps Shift modifiers on a completed selection", () => {
    const state = beginGesture({
      target: cell("2027-02-01"),
      point: point(100),
      design: { x: 0, y: 0 },
      pointerId: 1,
      modifiers: shift,
      date: "2027-02-01",
      context: context({ mode: "select" }),
    });
    const active = move(state, 140, "2027-02-04", context({ mode: "select" }));
    const completion = end(active, "2027-02-04", context({ mode: "select" }));
    expect(completion).toMatchObject({ kind: "select", modifiers: shift });
  });

  it("cancels and restores when the mode changes mid-gesture", () => {
    const before = { signature: "same", mode: "auto" as const };
    const after = { signature: "same", mode: "select" as const };
    expect(gestureContextChanged(before, after)).toBe(true);
    const active = move(begin(proxy("2027-01-28"), "2027-01-28"), 140, "2027-02-02");
    expect(cancelGesture(active)).toEqual({
      state: { phase: "idle" },
      restore: { itemId: "a", date: "2027-01-28" },
    });
  });

  it("paints from a resize handle in paint mode", () => {
    const ctx = context({ mode: "paint" });
    const state = begin(handle("end", "2027-02-01"), "2027-02-01", ctx);
    const active = move(state, 140, "2027-02-02", ctx);
    expect(end(active, "2027-02-02", ctx)).toMatchObject({
      kind: "paint",
      operation: "union",
      startDate: "2027-02-01",
      endDateExclusive: "2027-02-03",
    });
  });

  it("falls back to the parent item when a handle is clicked in select mode", () => {
    const ctx = context({ mode: "select" });
    const state = begin(handle("end", "2027-02-01"), "2027-02-01", ctx);
    expect(end(state, "2027-02-01", ctx)).toEqual({
      kind: "click",
      target: {
        kind: "item",
        itemId: "a",
        fragmentId: "a-0",
        date: "2027-02-01",
        annotation: false,
      },
      modifiers: plain,
    });
  });
});
