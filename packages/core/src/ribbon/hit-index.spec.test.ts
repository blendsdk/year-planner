import { describe, expect, it } from "vitest";
import { buildClassicYearLayout } from "../layout/classic-year";
import type { PlannerModel } from "../model/types";
import { buildRibbonLayout } from "./fragments";
import { createRibbonHitIndex, hitTestRibbon } from "./hit-index";

const layout = (() => {
  const result = buildClassicYearLayout({ year: 2027 });
  if (!result.ok) throw new Error("layout");
  return result.layout;
})();

const model: PlannerModel = {
  groups: [],
  layers: [
    { id: "ribbon", name: "Ribbon", channel: "ribbon", color: "#1d4e89" },
    { id: "bg", name: "Background", channel: "background", color: "#e3f7fc" },
  ],
  items: [
    {
      id: "r1",
      kind: "activity",
      layerId: "ribbon",
      period: { kind: "all-day", startDate: "2027-02-01", endDateExclusive: "2027-02-04" },
      title: "R1",
      version: 1,
    },
    {
      id: "b1",
      kind: "highlight",
      layerId: "bg",
      period: { kind: "all-day", startDate: "2027-02-01", endDateExclusive: "2027-02-04" },
      title: "B1",
      version: 1,
    },
  ],
  resources: [],
};

const ribbons = buildRibbonLayout(layout, {
  model,
  visibility: { hiddenGroupIds: [], hiddenLayerIds: [], hiddenItemIds: [] },
});

describe("RD-05 hit index", () => {
  it("maps the February ribbon fragment to absolute bounds", () => {
    const index = createRibbonHitIndex(ribbons);
    const entry = index.byItemId.get("r1")?.[0];
    expect(entry).toMatchObject({
      fragmentId: "2027-02:r1:2",
      itemId: "r1",
      rowId: "2027-02",
      x: 80,
      y: 198,
      width: 165,
      height: 18,
    });
    expect(hitTestRibbon(index, 80, 198)?.itemId).toBe("r1");
    expect(hitTestRibbon(index, 244.9, 198)?.itemId).toBe("r1");
    expect(hitTestRibbon(index, 245, 198)).toBeUndefined();
    expect(hitTestRibbon(index, 80, 216)?.itemId).toBe("b1");
    expect(hitTestRibbon(index, 80, 197.9)?.itemId).toBe("b1");
  });

  it("returns the topmost shape over a full-row background", () => {
    const index = createRibbonHitIndex(ribbons);
    expect(hitTestRibbon(index, 80, 198)?.itemId).toBe("r1");
    expect(hitTestRibbon(index, 80, 185)?.itemId).toBe("b1");
    expect(index.byItemId.get("r1")).toHaveLength(1);
    expect(index.byItemId.get("b1")).toHaveLength(1);
    expect(index.byFragmentId.size).toBe(2);
  });
});
