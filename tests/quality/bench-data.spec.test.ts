import { validatePlannerData } from "@blendsdk/year-planner-core";
import { describe, expect, it } from "vitest";
import { benchLayers, buildBenchModel } from "../../scripts/bench-data.mjs";

describe("RD-10-AC-11: benchmark data determinism", () => {
  it("produces identical models for the same seed", () => {
    expect(buildBenchModel({ items: 500, months: 14 })).toEqual(
      buildBenchModel({ items: 500, months: 14 }),
    );
  });

  it("validates 500, 2,000 and 10,000 item models", () => {
    for (const items of [500, 2000, 10000]) {
      const model = buildBenchModel({ items, months: 14 });
      expect(model.items).toHaveLength(items);
      const validation = validatePlannerData({ items: model.items, layers: model.layers });
      expect(validation.ok, `${items} items`).toBe(true);
      expect(validation.diagnostics).toEqual([]);
    }
  });

  it("matches every item kind to its layer channel", () => {
    const { items, layers } = buildBenchModel({ items: 50, months: 12 });
    const channelById = new Map(layers.map((layer) => [layer.id, layer.channel]));
    for (const item of items) {
      const channel = channelById.get(item.layerId);
      if (channel === "highlight") expect(item.kind).toBe("highlight");
      else if (channel === "annotation") expect(item.kind).toBe("annotation");
      else expect(item.kind).toBe("activity");
    }
  });

  it("keeps five stable layers", () => {
    expect(benchLayers().map((layer) => layer.id)).toEqual([
      "bookings",
      "maintenance",
      "training",
      "highlight",
      "notes",
    ]);
  });
});
