import {
  addDays,
  type PlannerItem,
  type PlannerSelection,
  type RibbonFragment,
  type RibbonLayout,
} from "@blendsdk/year-planner-core";
import { describe, expect, it } from "vitest";
import {
  applyDateClick,
  applyDateDrag,
  applyItemClick,
  applyItemMarquee,
  clearSelection,
  normalizeDateRanges,
  removeDate,
  selectAllVisible,
  visualItemOrder,
} from "./selection.js";

const range = (startDate: string, endDateExclusive: string) => ({
  startDate,
  endDateExclusive,
});

const day = (date: string) => range(date, addDays(date, 1));

const selection = (overrides: Partial<PlannerSelection> = {}): PlannerSelection => ({
  dates: [],
  items: [],
  ...overrides,
});

const item = (id: string, startDate = "2027-02-01"): PlannerItem => ({
  id,
  kind: "activity",
  layerId: "ribbon",
  period: { kind: "all-day", startDate, endDateExclusive: addDays(startDate, 2) },
  title: id,
  version: 1,
});

const fragment = (
  itemId: string,
  rowIndex: number,
  lane: number,
  startDate = "2027-02-01",
): RibbonFragment => ({
  fragmentId: `${itemId}-${rowIndex}`,
  itemId,
  rowId: `row-${rowIndex}`,
  rowIndex,
  sourcePeriod: {
    kind: "all-day",
    startDate,
    endDateExclusive: addDays(startDate, 2),
  },
  clippedStart: startDate,
  clippedEndExclusive: addDays(startDate, 2),
  startColumn: 0,
  endColumnExclusive: 2,
  x: 0,
  width: 100,
  lane,
  y: lane * 18,
  height: 18,
  isStartClipped: false,
  isEndClipped: false,
  channel: "ribbon",
});

const ribbons = (fragments: RibbonFragment[]): RibbonLayout => ({
  rows: [],
  fragments,
  density: "compact",
  compactMaxLanes: 3,
  laneHeight: 18,
  laneTop: 18,
  headerHeight: 28,
  footerHeight: 28,
  monthBandWidth: 70,
  totalDayWidth: 2000,
  totalWidth: 2140,
  height: 1000,
  signature: "test",
});

const plain = { shift: false, mod: false };
const shift = { shift: true, mod: false };
const mod = { shift: false, mod: true };
const reserved = { shift: true, mod: true };

describe("RD-07 selection policy", () => {
  it("replaces dates and clears items on a plain date click", () => {
    const next = applyDateClick(
      selection({ dates: [day("2027-01-05")], items: ["a"] }),
      "2027-02-01",
      plain,
    );
    expect(next).toEqual({
      dates: [day("2027-02-01")],
      items: [],
      anchorDate: "2027-02-01",
      focusDate: "2027-02-01",
      anchorItemId: undefined,
      focusItemId: undefined,
    });
  });

  it("replaces items and clears dates on a plain item click", () => {
    const next = applyItemClick(
      selection({
        dates: [day("2027-01-05")],
        anchorDate: "2027-01-05",
        focusDate: "2027-01-05",
        items: ["a"],
        anchorItemId: "a",
        focusItemId: "a",
      }),
      "b",
      plain,
      ["a", "b"],
    );
    expect(next).toEqual({
      dates: [],
      items: ["b"],
      anchorItemId: "b",
      focusItemId: "b",
      anchorDate: undefined,
      focusDate: undefined,
    });
  });

  it("extends from the existing anchor on Shift date click", () => {
    const next = applyDateClick(
      selection({
        dates: [range("2027-02-01", "2027-02-04")],
        anchorDate: "2027-02-01",
        focusDate: "2027-02-03",
        items: ["a"],
        anchorItemId: "a",
        focusItemId: "a",
      }),
      "2027-02-05",
      shift,
    );
    expect(next.dates).toEqual([range("2027-02-01", "2027-02-06")]);
    expect(next.anchorDate).toBe("2027-02-01");
    expect(next.focusDate).toBe("2027-02-05");
    expect(next.items).toEqual([]);
    expect(next.anchorItemId).toBeUndefined();
    expect(next.focusItemId).toBeUndefined();
  });

  it("falls back to the focus date when Shift has no anchor", () => {
    const next = applyDateClick(selection({ focusDate: "2027-02-02" }), "2027-02-04", shift);
    expect(next.dates).toEqual([range("2027-02-02", "2027-02-05")]);
    expect(next.anchorDate).toBe("2027-02-02");
    expect(next.focusDate).toBe("2027-02-04");
  });

  it("adds a date and keeps items on a mod date click", () => {
    const next = applyDateClick(
      selection({ dates: [day("2027-02-01")], items: ["a"], anchorDate: "2027-02-01" }),
      "2027-02-03",
      mod,
    );
    expect(next.dates).toEqual([range("2027-02-01", "2027-02-02"), day("2027-02-03")]);
    expect(next.items).toEqual(["a"]);
    expect(next.anchorDate).toBe("2027-02-01");
    expect(next.focusDate).toBe("2027-02-03");
  });

  it("splits a range when the toggled date is inside it", () => {
    const next = applyDateClick(
      selection({
        dates: [range("2027-02-01", "2027-02-06")],
        anchorDate: "2027-02-01",
        focusDate: "2027-02-03",
      }),
      "2027-02-03",
      mod,
    );
    expect(next.dates).toEqual([
      range("2027-02-01", "2027-02-03"),
      range("2027-02-04", "2027-02-06"),
    ]);
    expect(next.anchorDate).toBe("2027-02-01");
    expect(next.focusDate).toBe("2027-02-03");
  });

  it("clears the date anchor when the last date is removed", () => {
    const next = applyDateClick(
      selection({
        dates: [day("2027-02-03")],
        anchorDate: "2027-02-03",
        focusDate: "2027-02-03",
        items: ["a"],
      }),
      "2027-02-03",
      mod,
    );
    expect(next.dates).toEqual([]);
    expect(next.anchorDate).toBeUndefined();
    expect(next.focusDate).toBe("2027-02-03");
    expect(next.items).toEqual(["a"]);
  });

  it("selects an inclusive item range in visual order on Shift click", () => {
    const next = applyItemClick(
      selection({
        dates: [day("2027-02-01")],
        anchorDate: "2027-02-01",
        focusDate: "2027-02-01",
        items: ["b"],
        anchorItemId: "b",
        focusItemId: "b",
      }),
      "d",
      shift,
      ["a", "b", "c", "d"],
    );
    expect(next.items).toEqual(["b", "c", "d"]);
    expect(next.dates).toEqual([]);
    expect(next.anchorItemId).toBe("b");
    expect(next.focusItemId).toBe("d");
  });

  it("uses the clicked item as the Shift anchor when none exists", () => {
    const next = applyItemClick(selection(), "c", shift, ["a", "b", "c"]);
    expect(next.items).toEqual(["c"]);
    expect(next.anchorItemId).toBe("c");
    expect(next.focusItemId).toBe("c");
  });

  it("toggles an item and keeps dates on a mod item click", () => {
    const next = applyItemClick(
      selection({
        dates: [day("2027-02-01")],
        items: ["a"],
        anchorItemId: "a",
        anchorDate: "2027-02-01",
      }),
      "c",
      mod,
      ["a", "b", "c"],
    );
    expect(next.items).toEqual(["a", "c"]);
    expect(next.dates).toEqual([day("2027-02-01")]);
    expect(next.anchorItemId).toBe("a");
    expect(next.focusItemId).toBe("c");
    expect(next.anchorDate).toBe("2027-02-01");
  });

  it("clears the item anchor when the last item is removed", () => {
    const next = applyItemClick(
      selection({ items: ["a"], anchorItemId: "a", focusItemId: "a", dates: [day("2027-02-01")] }),
      "a",
      mod,
      ["a"],
    );
    expect(next.items).toEqual([]);
    expect(next.anchorItemId).toBeUndefined();
    expect(next.focusItemId).toBe("a");
    expect(next.dates).toEqual([day("2027-02-01")]);
  });

  it("ignores Ctrl/Cmd+Shift for clicks and drags", () => {
    const input = selection({ dates: [day("2027-02-01")], items: ["a"] });
    expect(applyDateClick(input, "2027-02-03", reserved)).toEqual(input);
    expect(applyDateDrag(input, "2027-02-01", "2027-02-05", reserved)).toEqual(input);
    expect(applyItemClick(input, "b", reserved, ["a", "b"])).toEqual(input);
  });

  it("selects all visible items and clears dates", () => {
    const next = selectAllVisible(
      selection({
        dates: [day("2027-02-01")],
        anchorDate: "2027-02-01",
        focusDate: "2027-02-01",
        items: ["b"],
        anchorItemId: "b",
      }),
      ["a", "b", "c"],
    );
    expect(next.items).toEqual(["a", "b", "c"]);
    expect(next.dates).toEqual([]);
    expect(next.anchorItemId).toBeUndefined();
    expect(next.focusItemId).toBe("c");
    expect(next.anchorDate).toBeUndefined();
    expect(next.focusDate).toBeUndefined();
    expect(next.anchorDate).toBeUndefined();
    expect(next.focusDate).toBeUndefined();
  });

  it("replaces items on a plain marquee and clears dates", () => {
    const next = applyItemMarquee(
      selection({
        dates: [day("2027-02-01")],
        anchorDate: "2027-02-01",
        focusDate: "2027-02-01",
        items: ["a"],
        anchorItemId: "a",
      }),
      ["b", "c"],
      plain,
      ["a", "b", "c"],
    );
    expect(next.items).toEqual(["b", "c"]);
    expect(next.dates).toEqual([]);
    expect(next.anchorItemId).toBeUndefined();
    expect(next.focusItemId).toBe("c");
    expect(next.anchorDate).toBeUndefined();
    expect(next.focusDate).toBeUndefined();
  });

  it("adds intersecting items on a Shift marquee and clears dates", () => {
    const next = applyItemMarquee(
      selection({
        dates: [day("2027-02-01")],
        anchorDate: "2027-02-01",
        focusDate: "2027-02-01",
        items: ["a", "b"],
        anchorItemId: "a",
        focusItemId: "b",
      }),
      ["c"],
      shift,
      ["a", "b", "c"],
    );
    expect(next.items).toEqual(["a", "b", "c"]);
    expect(next.dates).toEqual([]);
    expect(next.anchorItemId).toBeUndefined();
    expect(next.focusItemId).toBe("c");
    expect(next.anchorDate).toBeUndefined();
    expect(next.focusDate).toBeUndefined();
  });

  it("toggles intersecting items on a mod marquee and keeps dates", () => {
    const next = applyItemMarquee(
      selection({
        dates: [day("2027-02-01")],
        anchorDate: "2027-02-01",
        focusDate: "2027-02-01",
        items: ["a", "b"],
        anchorItemId: "a",
        focusItemId: "b",
      }),
      ["a", "c"],
      mod,
      ["a", "b", "c"],
    );
    expect(next.items).toEqual(["b", "c"]);
    expect(next.dates).toEqual([day("2027-02-01")]);
    expect(next.focusItemId).toBe("c");
    expect(next.anchorItemId).toBeUndefined();
    expect(next.anchorDate).toBe("2027-02-01");
    expect(next.focusDate).toBe("2027-02-01");
  });

  it("sorts and merges overlapping and adjacent ranges", () => {
    expect(
      normalizeDateRanges([
        range("2027-02-05", "2027-02-08"),
        range("2027-02-01", "2027-02-03"),
        range("2027-02-02", "2027-02-05"),
        range("2027-02-10", "2027-02-10"),
      ]),
    ).toEqual([range("2027-02-01", "2027-02-08")]);
  });

  it("splits a range when removing a middle date", () => {
    expect(removeDate([range("2027-02-01", "2027-02-06")], "2027-02-03")).toEqual([
      range("2027-02-01", "2027-02-03"),
      range("2027-02-04", "2027-02-06"),
    ]);
  });

  it("orders visible items by start, row, lane and ID", () => {
    const layout = ribbons([
      fragment("b", 0, 2),
      fragment("a", 1, 1),
      fragment("c", 5, 0, "2027-01-30"),
      fragment("hidden", 0, 0, "2027-01-01"),
    ]);
    expect(
      visualItemOrder(
        [item("a"), item("b"), item("c", "2027-01-30"), item("hidden", "2027-01-01")],
        layout,
        new Set(["a", "b", "c"]),
      ),
    ).toEqual(["c", "b", "a"]);
  });

  it("clears every selection field", () => {
    expect(clearSelection()).toEqual({
      dates: [],
      items: [],
      anchorDate: undefined,
      focusDate: undefined,
      anchorItemId: undefined,
      focusItemId: undefined,
    });
  });

  it("splits a date drag around a disabled date", () => {
    const next = applyDateDrag(
      selection(),
      "2027-02-01",
      "2027-02-05",
      plain,
      (date) => date === "2027-02-03",
    );
    expect(next.dates).toEqual([
      range("2027-02-01", "2027-02-03"),
      range("2027-02-04", "2027-02-06"),
    ]);
    expect(next.focusDate).toBe("2027-02-05");
  });

  it("ignores plain and mod clicks on a disabled date", () => {
    const input = selection({ dates: [day("2027-02-01")], items: ["a"] });
    const isDisabled = (date: string) => date === "2027-02-03";
    expect(applyDateClick(input, "2027-02-03", plain, isDisabled)).toEqual(input);
    expect(applyDateClick(input, "2027-02-03", mod, isDisabled)).toEqual(input);
  });

  it("adds a date from an empty selection and sets the anchor", () => {
    const next = applyDateClick(selection(), "2027-02-03", mod);
    expect(next.dates).toEqual([day("2027-02-03")]);
    expect(next.anchorDate).toBe("2027-02-03");
    expect(next.focusDate).toBe("2027-02-03");
  });

  it("clears a mod drag anchor when every date is disabled", () => {
    const next = applyDateDrag(selection(), "2027-02-01", "2027-02-03", mod, () => true);
    expect(next.dates).toEqual([]);
    expect(next.anchorDate).toBeUndefined();
  });

  it("ignores a click for an item missing from visual order", () => {
    const input = selection({ dates: [day("2027-02-01")], items: ["a"] });
    expect(applyItemClick(input, "missing", plain, ["a"])).toEqual(input);
  });

  it("orders equal start/row items by lane", () => {
    const layout = ribbons([fragment("b", 0, 1), fragment("a", 0, 0)]);
    expect(visualItemOrder([item("a"), item("b")], layout, new Set(["a", "b"]))).toEqual([
      "a",
      "b",
    ]);
  });

  it("uses a timed item start and its first fragment position", () => {
    const layout = ribbons([
      fragment("multi", 2, 0),
      fragment("multi", 0, 2),
      fragment("other", 1, 0),
    ]);
    const timed = {
      ...item("multi", "2027-02-02"),
      period: {
        kind: "timed" as const,
        start: "2027-02-02T08:00:00Z",
        endExclusive: "2027-02-02T10:00:00Z",
        timeZone: "UTC",
      },
    };
    expect(
      visualItemOrder([item("other", "2027-02-01"), timed], layout, new Set(["multi", "other"])),
    ).toEqual(["other", "multi"]);
  });

  it("falls back to the clicked item when the Shift anchor is not visible", () => {
    const next = applyItemClick(selection({ items: ["a"], anchorItemId: "missing" }), "c", shift, [
      "a",
      "c",
    ]);
    expect(next.items).toEqual(["c"]);
    expect(next.anchorItemId).toBe("c");
    expect(next.focusItemId).toBe("c");
  });

  it("keeps the earliest fragment when a later fragment shares the row and a lower lane", () => {
    const layout = ribbons([fragment("a", 0, 2), fragment("a", 0, 1), fragment("b", 0, 3)]);
    expect(visualItemOrder([item("a"), item("b")], layout, new Set(["a", "b"]))).toEqual([
      "a",
      "b",
    ]);
  });

  it("omits focus when a marquee or select-all set has no items", () => {
    expect(applyItemMarquee(selection(), [], mod, []).focusItemId).toBeUndefined();
    expect(applyItemMarquee(selection(), [], plain, []).focusItemId).toBeUndefined();
    expect(selectAllVisible(selection(), []).focusItemId).toBeUndefined();
  });

  it("shrinks a reversed drag to a chronological range", () => {
    const next = applyDateDrag(selection(), "2027-02-05", "2027-02-01", plain);
    expect(next.dates).toEqual([range("2027-02-01", "2027-02-06")]);
    expect(next.anchorDate).toBe("2027-02-05");
    expect(next.focusDate).toBe("2027-02-01");
  });

  it("handles a reversed Shift item range", () => {
    const next = applyItemClick(selection({ items: ["d"], anchorItemId: "d" }), "b", shift, [
      "a",
      "b",
      "c",
      "d",
    ]);
    expect(next.items).toEqual(["b", "c", "d"]);
    expect(next.anchorItemId).toBe("d");
    expect(next.focusItemId).toBe("b");
  });

  it("ignores a reserved marquee", () => {
    const input = selection({ dates: [day("2027-02-01")], items: ["a"] });
    expect(applyItemMarquee(input, ["b"], reserved, ["a", "b"])).toEqual(input);
  });

  it("ignores a Shift click on a disabled date", () => {
    const input = selection({ anchorDate: "2027-02-01", focusDate: "2027-02-02" });
    expect(applyDateClick(input, "2027-02-03", shift, (date) => date === "2027-02-03")).toEqual(
      input,
    );
  });

  it("orders same-start items by the earliest fragment row even when a later row is seen first", () => {
    const layout = ribbons([
      fragment("multi", 1, 0),
      fragment("multi", 0, 0),
      fragment("other", 0, 1),
    ]);
    expect(
      visualItemOrder([item("multi"), item("other")], layout, new Set(["multi", "other"])),
    ).toEqual(["multi", "other"]);
  });
});
