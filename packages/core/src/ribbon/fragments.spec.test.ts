import { describe, expect, it } from "vitest";
import { buildClassicYearLayout } from "../layout/classic-year";
import type { PlannerItem, PlannerLayer, PlannerModel, VisibilityState } from "../model/types";
import { buildRibbonLayout } from "./fragments";
import type { RibbonLayout } from "./types";

const layout2027 = (() => {
  const result = buildClassicYearLayout({ year: 2027 });
  if (!result.ok) throw new Error("layout");
  return result.layout;
})();

const layer = (id: string, overrides: Partial<PlannerLayer> = {}): PlannerLayer => ({
  id,
  name: id,
  channel: "ribbon",
  color: "#1d4e89",
  ...overrides,
});

const item = (
  id: string,
  layerId: string,
  startDate: string,
  endDateExclusive: string,
  overrides: Partial<PlannerItem> = {},
): PlannerItem => ({
  id,
  kind: "activity",
  layerId,
  period: { kind: "all-day", startDate, endDateExclusive },
  title: id,
  version: 1,
  ...overrides,
});

const state = (overrides: Partial<VisibilityState> = {}): VisibilityState => ({
  hiddenGroupIds: [],
  hiddenLayerIds: [],
  hiddenItemIds: [],
  ...overrides,
});

function build(
  items: PlannerItem[],
  options: Parameters<typeof buildRibbonLayout>[2] = {},
  layers: PlannerLayer[] = [layer("ribbon")],
  visibility: VisibilityState = state(),
  layout = layout2027,
): RibbonLayout {
  const model: PlannerModel = { groups: [], layers, items, resources: [] };
  return buildRibbonLayout(layout, { model, visibility }, options);
}

const fragmentsOf = (ribbons: RibbonLayout, itemId: string) =>
  ribbons.fragments.filter((fragment) => fragment.itemId === itemId);

describe("RD-05 fragment projection", () => {
  it("splits a cross-month item into clipped row fragments with one identity", () => {
    const ribbons = build([item("hl-cross-month", "ribbon", "2027-01-28", "2027-02-07")]);
    const fragments = fragmentsOf(ribbons, "hl-cross-month");
    expect(fragments).toHaveLength(2);
    expect(fragments.map((fragment) => fragment.rowId)).toEqual(["2027-01", "2027-02"]);
    expect(fragments[0]).toMatchObject({
      clippedStart: "2027-01-28",
      clippedEndExclusive: "2027-02-01",
      isStartClipped: false,
      isEndClipped: true,
    });
    expect(fragments[1]).toMatchObject({
      clippedStart: "2027-02-01",
      clippedEndExclusive: "2027-02-07",
      isStartClipped: true,
      isEndClipped: false,
    });
    expect(fragments[0]?.width).toBe(190);
    expect(fragments[1]?.width).toBe(315);
  });

  it("measures one-day and eight-day widths from the actual slots", () => {
    const oneDay = build([item("one", "ribbon", "2027-02-01", "2027-02-02")]);
    expect(fragmentsOf(oneDay, "one")[0]?.width).toBe(55);
    const eightDays = build([item("eight", "ribbon", "2027-02-01", "2027-02-09")]);
    expect(fragmentsOf(eightDays, "eight")[0]?.width).toBe(410);
  });

  it("places three overlapping items in three lanes", () => {
    const ribbons = build([
      item("a", "ribbon", "2027-02-01", "2027-02-03"),
      item("b", "ribbon", "2027-02-01", "2027-02-03"),
      item("c", "ribbon", "2027-02-01", "2027-02-03"),
    ]);
    expect(fragmentsOf(ribbons, "a")[0]?.lane).toBe(0);
    expect(fragmentsOf(ribbons, "b")[0]?.lane).toBe(1);
    expect(fragmentsOf(ribbons, "c")[0]?.lane).toBe(2);
  });

  it("splits a cross-year item across December and January", () => {
    const ribbons = build([item("hl-cross-year", "ribbon", "2026-12-28", "2027-01-04")]);
    const fragments = fragmentsOf(ribbons, "hl-cross-year");
    expect(fragments.map((fragment) => fragment.rowId)).toEqual(["2026-12", "2027-01"]);
    expect(fragments[0]?.isEndClipped).toBe(true);
    expect(fragments[1]?.isStartClipped).toBe(true);
  });

  it("omits items outside the window without changing the source period", () => {
    const outside = item("outside", "ribbon", "2025-01-01", "2025-01-10");
    const ribbons = build([outside]);
    expect(fragmentsOf(ribbons, "outside")).toHaveLength(0);
    expect(outside.period).toEqual({
      kind: "all-day",
      startDate: "2025-01-01",
      endDateExclusive: "2025-01-10",
    });
  });

  it("projects a timed item into the dates it touches", () => {
    const timed = item("timed", "ribbon", "2027-02-01", "2027-02-02", {
      period: {
        kind: "timed",
        start: "2027-02-01T04:30:00Z",
        endExclusive: "2027-02-01T06:00:00Z",
        timeZone: "America/New_York",
      },
    });
    const ribbons = build([timed], { displayTimeZone: "America/New_York" });
    const fragments = fragmentsOf(ribbons, "timed");
    expect(fragments.map((fragment) => fragment.rowId)).toEqual(["2027-01", "2027-02"]);
    expect(fragments[0]?.clippedStart).toBe("2027-01-31");
    expect(fragments[1]?.clippedStart).toBe("2027-02-01");
    expect(fragments[0]?.sourcePeriod.kind).toBe("timed");
  });

  it("sets continuation flags for a middle fragment", () => {
    const ribbons = build([item("middle", "ribbon", "2027-01-20", "2027-03-20")]);
    const february = fragmentsOf(ribbons, "middle").find(
      (fragment) => fragment.rowId === "2027-02",
    );
    expect(february?.isStartClipped).toBe(true);
    expect(february?.isEndClipped).toBe(true);
  });
});

describe("RD-05 lanes and overflow", () => {
  it("repacks lanes after hiding one of three layers", () => {
    const layers = [layer("l1"), layer("l2"), layer("l3")];
    const items = [
      item("a", "l1", "2027-02-01", "2027-02-03"),
      item("b", "l2", "2027-02-01", "2027-02-03"),
      item("c", "l3", "2027-02-01", "2027-02-03"),
    ];
    const before = build(items, {}, layers);
    expect(
      [0, 1, 2].map((index) => fragmentsOf(before, ["a", "b", "c"][index] ?? "")[0]?.lane),
    ).toEqual([0, 1, 2]);
    const after = build(items, {}, layers, state({ hiddenLayerIds: ["l2"] }));
    expect(fragmentsOf(after, "a")[0]?.lane).toBe(0);
    expect(fragmentsOf(after, "c")[0]?.lane).toBe(1);
    expect(after.fragments.find((fragment) => fragment.itemId === "b")).toBeUndefined();
  });

  it("shows three lanes and seventeen overflow items in compact mode", () => {
    const items = Array.from({ length: 20 }, (_, index) =>
      item(`item-${String(index).padStart(2, "0")}`, "ribbon", "2027-02-01", "2027-02-04"),
    );
    const ribbons = build(items);
    const february = ribbons.rows.find((row) => row.rowId === "2027-02");
    expect(february?.laneCount).toBe(20);
    expect(february?.visibleLaneCount).toBe(3);
    expect(february?.overflowCount).toBe(17);
    expect(february?.overflow).toHaveLength(17);
    expect(february?.overflow[0]?.title).toBe("item-03");
    expect(february?.height).toBe(90);
  });

  it("renders every lane and grows the row in expanded mode", () => {
    const items = Array.from({ length: 20 }, (_, index) =>
      item(`item-${String(index).padStart(2, "0")}`, "ribbon", "2027-02-01", "2027-02-04"),
    );
    const ribbons = build(items, { density: "expanded" });
    const february = ribbons.rows.find((row) => row.rowId === "2027-02");
    expect(february?.visibleLaneCount).toBe(20);
    expect(february?.overflowCount).toBe(0);
    expect(february?.height).toBe(378);
  });

  it("never lists a hidden item in overflow", () => {
    const items = Array.from({ length: 20 }, (_, index) =>
      item(`item-${String(index).padStart(2, "0")}`, "ribbon", "2027-02-01", "2027-02-04"),
    );
    const ribbons = build(items, {}, [layer("ribbon")], state({ hiddenItemIds: ["item-19"] }));
    const february = ribbons.rows.find((row) => row.rowId === "2027-02");
    expect(february?.overflowCount).toBe(16);
    expect(february?.overflow.some((entry) => entry.itemId === "item-19")).toBe(false);
  });

  it("lets touching intervals share a lane", () => {
    const ribbons = build([
      item("a", "ribbon", "2027-02-01", "2027-02-03"),
      item("b", "ribbon", "2027-02-03", "2027-02-05"),
    ]);
    expect(fragmentsOf(ribbons, "a")[0]?.lane).toBe(0);
    expect(fragmentsOf(ribbons, "b")[0]?.lane).toBe(0);
  });

  it("sorts longer items first at the same start", () => {
    const ribbons = build([
      item("short", "ribbon", "2027-02-01", "2027-02-03"),
      item("long", "ribbon", "2027-02-01", "2027-02-10"),
    ]);
    expect(fragmentsOf(ribbons, "long")[0]?.lane).toBe(0);
    expect(fragmentsOf(ribbons, "short")[0]?.lane).toBe(1);
  });

  it("reuses the previous row lane when free and falls back when occupied", () => {
    const items = [
      item("a", "ribbon", "2027-01-28", "2027-02-07"),
      item("c", "ribbon", "2027-02-01", "2027-02-12"),
    ];
    const ribbons = build(items);
    expect(fragmentsOf(ribbons, "c").find((fragment) => fragment.rowId === "2027-02")?.lane).toBe(
      0,
    );
    expect(fragmentsOf(ribbons, "a").find((fragment) => fragment.rowId === "2027-02")?.lane).toBe(
      1,
    );
    const hidden = build(items, {}, [layer("ribbon")], state({ hiddenItemIds: ["c"] }));
    expect(fragmentsOf(hidden, "a").find((fragment) => fragment.rowId === "2027-02")?.lane).toBe(0);
  });

  it("orders lanes by sortOrder, displayPriority and item ID", () => {
    const layers = [
      layer("l0", { sortOrder: 0 }),
      layer("l1", { sortOrder: 1 }),
      layer("l2", { sortOrder: 2 }),
    ];
    const byOrder = build(
      [
        item("c", "l2", "2027-02-01", "2027-02-03"),
        item("a", "l0", "2027-02-01", "2027-02-03"),
        item("b", "l1", "2027-02-01", "2027-02-03"),
      ],
      {},
      layers,
    );
    expect(fragmentsOf(byOrder, "a")[0]?.lane).toBe(0);
    expect(fragmentsOf(byOrder, "b")[0]?.lane).toBe(1);
    expect(fragmentsOf(byOrder, "c")[0]?.lane).toBe(2);
    const priorities = build(
      [
        item("low", "p1", "2027-02-01", "2027-02-03"),
        item("high", "p5", "2027-02-01", "2027-02-03"),
      ],
      {},
      [layer("p1", { displayPriority: 1 }), layer("p5", { displayPriority: 5 })],
    );
    expect(fragmentsOf(priorities, "high")[0]?.lane).toBe(0);
    const ids = build([
      item("b", "ribbon", "2027-02-01", "2027-02-03"),
      item("a", "ribbon", "2027-02-01", "2027-02-03"),
    ]);
    expect(fragmentsOf(ids, "a")[0]?.lane).toBe(0);
  });

  it("partitions background, annotation and foreground channels without lanes", () => {
    const layers = [
      layer("bg", { channel: "background" }),
      layer("notes", { channel: "annotation" }),
      layer("fg", { channel: "foreground" }),
    ];
    const backgrounds = Array.from({ length: 10 }, (_, index) =>
      item(`bg-${index}`, "bg", "2027-02-01", "2027-02-03"),
    );
    const bg = build(backgrounds, {}, layers);
    const februaryBg = bg.rows.find((row) => row.rowId === "2027-02");
    expect(februaryBg?.laneCount).toBe(0);
    expect(februaryBg?.overflowCount).toBe(0);
    expect(februaryBg?.fragments).toHaveLength(10);

    const annotation = build(
      [
        item("holiday", "notes", "2027-02-01", "2027-02-02", {
          kind: "annotation",
        }),
        item("preview", "fg", "2027-02-01", "2027-02-03"),
      ],
      {},
      layers,
    );
    const february = annotation.rows.find((row) => row.rowId === "2027-02");
    expect(february?.laneCount).toBe(0);
    expect(february?.fragments.find((fragment) => fragment.itemId === "holiday")?.height).toBe(14);
    expect(february?.fragments.find((fragment) => fragment.itemId === "preview")?.height).toBe(90);
  });

  it("exposes overflow titles and periods", () => {
    const items = Array.from({ length: 5 }, (_, index) =>
      item(`item-${index}`, "ribbon", "2027-02-01", "2027-02-04", {
        title: `Title ${index}`,
      }),
    );
    const ribbons = build(items, { compactMaxLanes: 2 });
    const february = ribbons.rows.find((row) => row.rowId === "2027-02");
    expect(february?.overflowCount).toBe(3);
    expect(february?.overflow.map((entry) => entry.title)).toEqual([
      "Title 2",
      "Title 3",
      "Title 4",
    ]);
    expect(february?.overflow[0]?.period).toEqual({
      kind: "all-day",
      startDate: "2027-02-01",
      endDateExclusive: "2027-02-04",
    });
  });
});

describe("RD-05 signature and connector surface", () => {
  it("is stable for identical inputs and changes with version, visibility and window", () => {
    const items = [item("a", "ribbon", "2027-02-01", "2027-02-03")];
    const first = build(items);
    const second = build(items);
    expect(first.signature).toBe(second.signature);
    const versioned = build([{ ...items[0], version: 2 } as PlannerItem]);
    expect(versioned.signature).not.toBe(first.signature);
    const hidden = build(items, {}, [layer("ribbon")], state({ hiddenItemIds: ["a"] }));
    expect(hidden.signature).not.toBe(first.signature);
    const layout2026 = buildClassicYearLayout({ year: 2026 });
    if (!layout2026.ok) throw new Error("layout");
    const otherWindow = build(items, {}, [layer("ribbon")], state(), layout2026.layout);
    expect(otherWindow.signature).not.toBe(first.signature);
  });

  it("exposes no connector option or descriptor", () => {
    const ribbons = build([item("a", "ribbon", "2027-02-01", "2027-02-03")]);
    expect(Object.keys(ribbons)).not.toContain("connectors");
  });

  it("reports the total width from the mirrored month bands", () => {
    const ribbons = build([]);
    expect(ribbons.totalDayWidth).toBe(1855);
    expect(ribbons.monthBandWidth).toBe(70);
    expect(ribbons.totalWidth).toBe(1995);
  });
});
