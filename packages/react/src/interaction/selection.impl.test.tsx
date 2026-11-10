import { addDays, type PlannerSelection, type RibbonLayout } from "@blendsdk/year-planner-core";
import { describe, expect, it } from "vitest";
import {
  addDate,
  applyDateDrag,
  applyItemMarquee,
  isDateSelected,
  isMod,
  normalizeDateRanges,
  rangeBetween,
  removeDate,
  type SelectionModifiers,
  toggleDate,
  visualItemOrder,
} from "./selection.js";

const range = (startDate: string, endDateExclusive: string) => ({
  startDate,
  endDateExclusive,
});

const day = (date: string) => range(date, addDays(date, 1));

const plain: SelectionModifiers = { shift: false, mod: false };

const ribbons = (
  fragments: Array<{ itemId: string; rowIndex: number; lane: number }>,
): RibbonLayout => ({
  rows: [],
  fragments: fragments.map(({ itemId, rowIndex, lane }) => ({
    fragmentId: `${itemId}-${rowIndex}`,
    itemId,
    rowId: `row-${rowIndex}`,
    rowIndex,
    sourcePeriod: { kind: "all-day", startDate: "2027-02-01", endDateExclusive: "2027-02-03" },
    clippedStart: "2027-02-01",
    clippedEndExclusive: "2027-02-03",
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
  })),
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

const selection = (overrides: Partial<PlannerSelection> = {}): PlannerSelection => ({
  dates: [],
  items: [],
  ...overrides,
});

const item = (id: string, startDate = "2027-02-01") => ({
  id,
  kind: "activity" as const,
  layerId: "ribbon",
  period: {
    kind: "all-day" as const,
    startDate,
    endDateExclusive: addDays(startDate, 2),
  },
  title: id,
  version: 1,
});

describe("selection policy internals", () => {
  it("drops empty and reversed ranges and keeps input order stable after sorting", () => {
    expect(
      normalizeDateRanges([
        range("2027-02-05", "2027-02-05"),
        range("2027-02-08", "2027-02-04"),
        range("2027-02-02", "2027-02-03"),
      ]),
    ).toEqual([range("2027-02-02", "2027-02-03")]);
  });

  it("merges a date adjacent to an existing range", () => {
    expect(addDate([range("2027-02-01", "2027-02-03")], "2027-02-03")).toEqual([
      range("2027-02-01", "2027-02-04"),
    ]);
  });

  it("trims a range at its start and end", () => {
    expect(removeDate([range("2027-02-01", "2027-02-04")], "2027-02-01")).toEqual([
      range("2027-02-02", "2027-02-04"),
    ]);
    expect(removeDate([range("2027-02-01", "2027-02-04")], "2027-02-03")).toEqual([
      range("2027-02-01", "2027-02-03"),
    ]);
  });

  it("does not add a disabled date", () => {
    expect(toggleDate([], "2027-02-03", (date) => date === "2027-02-03")).toEqual([]);
  });

  it("returns no range when every date in the span is disabled", () => {
    expect(rangeBetween("2027-02-01", "2027-02-03", () => true)).toEqual([]);
  });

  it("unions a mod date drag with existing ranges", () => {
    const next = applyDateDrag(
      selection({
        dates: [day("2027-02-01")],
        items: ["a"],
        anchorItemId: "a",
        anchorDate: "2027-02-01",
      }),
      "2027-02-04",
      "2027-02-05",
      { shift: false, mod: true },
    );
    expect(next.dates).toEqual([
      range("2027-02-01", "2027-02-02"),
      range("2027-02-04", "2027-02-06"),
    ]);
    expect(next.items).toEqual(["a"]);
  });

  it("uses the stored anchor for a Shift date drag", () => {
    const next = applyDateDrag(
      selection({ anchorDate: "2027-02-01", focusDate: "2027-02-02" }),
      "2027-02-04",
      "2027-02-05",
      { shift: true, mod: false },
    );
    expect(next.dates).toEqual([range("2027-02-01", "2027-02-06")]);
    expect(next.anchorDate).toBe("2027-02-01");
  });

  it("ignores unknown marquee IDs and preserves visual order", () => {
    const next = applyItemMarquee(selection({ items: ["b"] }), ["unknown", "a"], plain, [
      "a",
      "b",
      "c",
    ]);
    expect(next.items).toEqual(["a"]);
    expect(next.focusItemId).toBe("a");
  });

  it("breaks equal visual positions by item ID", () => {
    const layout = ribbons([
      { itemId: "b", rowIndex: 0, lane: 0 },
      { itemId: "a", rowIndex: 0, lane: 0 },
    ]);
    expect(visualItemOrder([item("b"), item("a")], layout, new Set(["a", "b"]))).toEqual([
      "a",
      "b",
    ]);
  });

  it("detects selected dates and platform modifiers", () => {
    expect(isDateSelected([range("2027-02-01", "2027-02-03")], "2027-02-02")).toBe(true);
    expect(isDateSelected([range("2027-02-01", "2027-02-03")], "2027-02-03")).toBe(false);
    expect(isMod({ ctrlKey: true })).toBe(true);
    expect(isMod({ metaKey: true })).toBe(true);
    expect(isMod({})).toBe(false);
  });
});
