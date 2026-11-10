import { describe, expect, it } from "vitest";
import { buildClassicYearLayout } from "../layout/classic-year";
import type { PlannerItem, PlannerLayer, PlannerModel } from "../model/types";
import { buildRibbonLayout } from "./fragments";
import { createRibbonHitIndex, hitTestRibbon } from "./hit-index";

const layout = (() => {
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
): PlannerItem => ({
  id,
  kind: "activity",
  layerId,
  period: { kind: "all-day", startDate, endDateExclusive },
  title: id,
  version: 1,
});

function build(items: PlannerItem[], layers: PlannerLayer[] = [layer("ribbon")]) {
  const model: PlannerModel = { groups: [], layers, items, resources: [] };
  return buildRibbonLayout(layout, {
    model,
    visibility: { hiddenGroupIds: [], hiddenLayerIds: [], hiddenItemIds: [] },
  });
}

describe("hit index internals", () => {
  it("returns an empty index for an empty ribbon", () => {
    const index = createRibbonHitIndex(build([]));
    expect(index.entries).toHaveLength(0);
    expect(index.byFragmentId.size).toBe(0);
    expect(index.byItemId.size).toBe(0);
    expect(hitTestRibbon(index, 0, 0)).toBeUndefined();
  });

  it("lists every fragment of a cross-month item under one item ID", () => {
    const index = createRibbonHitIndex(
      build([item("cross", "ribbon", "2027-01-28", "2027-02-07")]),
    );
    expect(index.byItemId.get("cross")).toHaveLength(2);
    expect(index.byFragmentId.size).toBe(2);
    expect(index.entries[0]?.rowId).toBe("2027-01");
    expect(index.entries[1]?.rowId).toBe("2027-02");
  });

  it("uses half-open x bounds and absolute y bounds", () => {
    const index = createRibbonHitIndex(build([item("a", "ribbon", "2027-02-01", "2027-02-04")]));
    const entry = index.entries[0];
    if (!entry) throw new Error("missing entry");
    expect(hitTestRibbon(index, entry.x, entry.y)?.itemId).toBe("a");
    expect(hitTestRibbon(index, entry.x + entry.width - 0.01, entry.y)?.itemId).toBe("a");
    expect(hitTestRibbon(index, entry.x + entry.width, entry.y)).toBeUndefined();
    expect(hitTestRibbon(index, entry.x, entry.y - 0.01)).toBeUndefined();
    expect(hitTestRibbon(index, entry.x, entry.y + entry.height)).toBeUndefined();
  });

  it("orders same-row shapes by lane so the topmost ribbon wins", () => {
    const index = createRibbonHitIndex(
      build(
        [
          item("bottom", "bg", "2027-02-01", "2027-02-04"),
          item("top", "ribbon", "2027-02-01", "2027-02-04"),
        ],
        [layer("bg", { channel: "background" }), layer("ribbon")],
      ),
    );
    const background = index.byItemId.get("bottom")?.[0];
    const ribbon = index.byItemId.get("top")?.[0];
    if (!background || !ribbon) throw new Error("missing entries");
    expect(background.y).toBeLessThan(ribbon.y);
    expect(hitTestRibbon(index, ribbon.x, ribbon.y)?.itemId).toBe("top");
  });
});
