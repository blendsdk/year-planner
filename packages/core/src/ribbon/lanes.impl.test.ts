import { describe, expect, it } from "vitest";
import { buildClassicYearLayout } from "../layout/classic-year";
import type { PlannerItem, PlannerLayer, PlannerModel, VisibilityState } from "../model/types";
import { buildRibbonLayout } from "./fragments";

const layout2027 = (() => {
  const result = buildClassicYearLayout({ year: 2027 });
  if (!result.ok) throw new Error("layout");
  return result.layout;
})();

const layer: PlannerLayer = {
  id: "ribbon",
  name: "Ribbon",
  channel: "ribbon",
  color: "#1d4e89",
};

function item(
  id: string,
  startDate: string,
  endDateExclusive: string,
  overrides: Partial<PlannerItem> = {},
): PlannerItem {
  return {
    id,
    kind: "activity",
    layerId: layer.id,
    period: { kind: "all-day", startDate, endDateExclusive },
    title: id,
    version: 1,
    ...overrides,
  };
}

function build(
  items: PlannerItem[],
  visibility: VisibilityState = { hiddenGroupIds: [], hiddenLayerIds: [], hiddenItemIds: [] },
) {
  const model: PlannerModel = { groups: [], layers: [layer], items, resources: [] };
  return buildRibbonLayout(layout2027, { model, visibility }, { density: "expanded" });
}

function laneOf(
  ribbons: ReturnType<typeof build>,
  itemId: string,
  rowIndex?: number,
): number | undefined {
  const fragments = ribbons.fragments.filter((fragment) => fragment.itemId === itemId);
  const fragment =
    rowIndex === undefined ? fragments[0] : fragments.find((entry) => entry.rowIndex === rowIndex);
  return fragment?.lane;
}

describe("lane assignment", () => {
  it("uses the lowest free lane and reuses a lane once its interval ends", () => {
    const ribbons = build([
      item("a", "2027-01-01", "2027-01-10"),
      item("b", "2027-01-05", "2027-01-15"),
      item("c", "2027-01-12", "2027-01-20"),
    ]);
    expect(laneOf(ribbons, "a")).toBe(0);
    expect(laneOf(ribbons, "b")).toBe(1);
    expect(laneOf(ribbons, "c")).toBe(0);
  });

  it("assigns distinct lanes to fully overlapping items", () => {
    const ribbons = build([
      item("a", "2027-01-01", "2027-01-10"),
      item("b", "2027-01-01", "2027-01-10"),
      item("c", "2027-01-01", "2027-01-10"),
    ]);
    expect([laneOf(ribbons, "a"), laneOf(ribbons, "b"), laneOf(ribbons, "c")]).toEqual([0, 1, 2]);
  });

  it("keeps the same lane for an item that spans two month rows", () => {
    const ribbons = build([item("span", "2027-01-20", "2027-02-10")]);
    const january = laneOf(ribbons, "span", 1);
    const february = laneOf(ribbons, "span", 2);
    expect(january).toBe(0);
    expect(february).toBe(0);
  });

  it("is deterministic for a dense overlapping row", () => {
    const items = Array.from({ length: 40 }, (_, index) =>
      item(`item-${index}`, "2027-01-01", "2027-01-10"),
    );
    const first = build(items);
    const second = build(items);
    expect(items.map((entry) => laneOf(first, entry.id))).toEqual(
      items.map((entry) => laneOf(second, entry.id)),
    );
    expect(new Set(items.map((entry) => laneOf(first, entry.id))).size).toBe(40);
  });

  it("places an item in each month row it intersects exactly once", () => {
    const ribbons = build([item("long", "2027-01-15", "2027-04-10")]);
    const rows = ribbons.fragments.filter((fragment) => fragment.itemId === "long");
    expect(rows.map((fragment) => fragment.rowIndex)).toEqual([1, 2, 3, 4]);
  });

  it("omits an item outside the layout window", () => {
    const ribbons = build([item("outside", "2026-01-01", "2026-02-01")]);
    expect(ribbons.fragments).toHaveLength(0);
  });
});
