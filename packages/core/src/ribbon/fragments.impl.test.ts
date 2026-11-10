import { describe, expect, it } from "vitest";
import { buildClassicYearLayout } from "../layout/classic-year";
import type { PlannerItem, PlannerLayer, PlannerModel, VisibilityState } from "../model/types";
import { buildRibbonLayout } from "./fragments";

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
) {
  const model: PlannerModel = { groups: [], layers, items, resources: [] };
  return buildRibbonLayout(layout2027, { model, visibility }, options);
}

describe("ribbon internals", () => {
  it("returns empty rows for an empty model", () => {
    const ribbons = build([]);
    expect(ribbons.rows).toHaveLength(14);
    expect(ribbons.fragments).toHaveLength(0);
    expect(ribbons.height).toBe(1260);
    expect(ribbons.rows.every((row) => row.laneCount === 0 && row.height === 90)).toBe(true);
  });

  it("rejects invalid lane options", () => {
    expect(() => build([], { compactMaxLanes: 0 })).toThrow(RangeError);
    expect(() => build([], { laneHeight: 0 })).toThrow(RangeError);
    expect(() => build([], { laneTop: -1 })).toThrow(RangeError);
  });

  it("applies the visibility filter and records the filter in the signature", () => {
    const items = [
      item("a", "ribbon", "2027-02-01", "2027-02-03"),
      item("b", "ribbon", "2027-02-01", "2027-02-03"),
    ];
    const model: PlannerModel = { groups: [], layers: [layer("ribbon")], items, resources: [] };
    const filtered = buildRibbonLayout(
      layout2027,
      { model, visibility: state(), filter: { statuses: ["confirmed"] } },
      {},
    );
    expect(filtered.fragments).toHaveLength(0);
    const unfiltered = buildRibbonLayout(layout2027, { model, visibility: state() }, {});
    expect(filtered.signature).not.toBe(unfiltered.signature);
  });

  it("fills the lowest free lane after a gap", () => {
    const ribbons = build([
      item("a", "ribbon", "2027-02-01", "2027-02-04"),
      item("b", "ribbon", "2027-02-02", "2027-02-06"),
      item("c", "ribbon", "2027-02-05", "2027-02-08"),
    ]);
    const lane = (id: string) => ribbons.fragments.find((fragment) => fragment.itemId === id)?.lane;
    expect(lane("a")).toBe(0);
    expect(lane("b")).toBe(1);
    expect(lane("c")).toBe(0);
  });

  it("clips an item across three month rows", () => {
    const ribbons = build([item("long", "ribbon", "2026-12-20", "2027-02-05")]);
    expect(
      ribbons.fragments
        .filter((fragment) => fragment.itemId === "long")
        .map((fragment) => fragment.rowId),
    ).toEqual(["2026-12", "2027-01", "2027-02"]);
  });

  it("computes cumulative row tops with an expanded row", () => {
    const items = Array.from({ length: 20 }, (_, index) =>
      item(`item-${index}`, "ribbon", "2027-02-01", "2027-02-04"),
    );
    const ribbons = build(items, { density: "expanded" });
    const february = ribbons.rows.find((row) => row.rowId === "2027-02");
    expect(february?.top).toBe(180);
    expect(ribbons.rows.find((row) => row.rowId === "2027-03")?.top).toBe(180 + 378);
  });

  it("grows a background fragment with the row", () => {
    const layers = [layer("ribbon"), layer("bg", { channel: "background" })];
    const items = [
      item("background", "bg", "2027-02-01", "2027-02-04"),
      ...Array.from({ length: 20 }, (_, index) =>
        item(`item-${index}`, "ribbon", "2027-02-01", "2027-02-04"),
      ),
    ];
    const ribbons = build(items, { density: "expanded" }, layers);
    const february = ribbons.rows.find((row) => row.rowId === "2027-02");
    expect(february?.fragments.find((fragment) => fragment.itemId === "background")?.height).toBe(
      378,
    );
  });

  it("honours a custom compact maximum", () => {
    const items = Array.from({ length: 20 }, (_, index) =>
      item(`item-${index}`, "ribbon", "2027-02-01", "2027-02-04"),
    );
    const ribbons = build(items, { compactMaxLanes: 2 });
    const february = ribbons.rows.find((row) => row.rowId === "2027-02");
    expect(february?.visibleLaneCount).toBe(2);
    expect(february?.overflowCount).toBe(18);
  });

  it("keeps the signature stable across a key-order change in the filter", () => {
    const items = [item("a", "ribbon", "2027-02-01", "2027-02-03")];
    const model: PlannerModel = { groups: [], layers: [layer("ribbon")], items, resources: [] };
    const first = buildRibbonLayout(
      layout2027,
      { model, visibility: state(), filter: { layerIds: ["ribbon"], statuses: ["x"] } },
      {},
    );
    const second = buildRibbonLayout(
      layout2027,
      { model, visibility: state(), filter: { statuses: ["x"], layerIds: ["ribbon"] } },
      {},
    );
    expect(first.signature).toBe(second.signature);
  });
});

describe("ribbon option and signature regressions", () => {
  it("marks a single-row fragment as not clipped", () => {
    const ribbons = build([item("single", "ribbon", "2027-02-01", "2027-02-05")]);
    const fragment = ribbons.fragments.find((entry) => entry.itemId === "single");
    expect(fragment?.isStartClipped).toBe(false);
    expect(fragment?.isEndClipped).toBe(false);
  });

  it("rejects an unknown density and display zone", () => {
    expect(() => build([], { density: "aggregated" as never })).toThrow(RangeError);
    expect(() => build([], { displayTimeZone: "Mars/Olympus" })).toThrow(RangeError);
  });

  it("changes the layout and ribbon signature when slot units change", () => {
    const result = buildClassicYearLayout({ year: 2027, units: { weekday: 60 } });
    if (!result.ok) throw new Error("layout");
    const model: PlannerModel = {
      groups: [],
      layers: [layer("ribbon")],
      items: [item("a", "ribbon", "2027-02-01", "2027-02-03")],
      resources: [],
    };
    const standard = buildRibbonLayout(layout2027, { model, visibility: state() }, {});
    const wider = buildRibbonLayout(result.layout, { model, visibility: state() }, {});
    expect(wider.signature).not.toBe(standard.signature);
  });
});
