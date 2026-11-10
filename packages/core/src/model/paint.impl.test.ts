import { describe, expect, it } from "vitest";
import { eraseItems, type PaintContext, paintItems } from "./paint";
import type { PlannerItem, PlannerLayer, PlannerModel, VisibilityState } from "./types";

const layer = (id: string, overrides: Partial<PlannerLayer> = {}): PlannerLayer => ({
  id,
  name: id,
  channel: "highlight",
  color: "#1d4e89",
  ...overrides,
});

const highlight = (
  id: string,
  startDate: string,
  endDateExclusive: string,
  overrides: Partial<PlannerItem> = {},
): PlannerItem => ({
  id,
  kind: "highlight",
  layerId: "highlights",
  period: { kind: "all-day", startDate, endDateExclusive },
  title: "H",
  version: 1,
  ...overrides,
});

const state = (overrides: Partial<VisibilityState> = {}): VisibilityState => ({
  hiddenGroupIds: [],
  hiddenLayerIds: [],
  hiddenItemIds: [],
  ...overrides,
});

function context(items: PlannerItem[], overrides: Partial<PaintContext> = {}): PaintContext {
  let count = 0;
  const nextId = (): string => {
    count += 1;
    return `new-${count}`;
  };
  const model: PlannerModel = {
    groups: [],
    layers: [layer("highlights")],
    items,
    resources: [],
  };
  return {
    model,
    visibility: state(),
    activeLayerId: "highlights",
    createId: nextId,
    mode: "auto",
    ...overrides,
  };
}

describe("paint internals", () => {
  it("merges the range with several matching highlights", () => {
    const result = paintItems(
      context([
        highlight("a", "2027-06-10", "2027-06-14"),
        highlight("b", "2027-06-13", "2027-06-18"),
      ]),
      "highlights",
      { kind: "all-day", startDate: "2027-06-13", endDateExclusive: "2027-06-20" },
      { kind: "highlight", title: "H" },
    );
    expect(result.removedItemIds).toEqual(["a", "b"]);
    expect(result.updatedItems).toHaveLength(1);
    expect(result.updatedItems[0]?.period).toEqual({
      kind: "all-day",
      startDate: "2027-06-10",
      endDateExclusive: "2027-06-20",
    });
  });

  it("does not touch items outside the range, other layers or other kinds", () => {
    const model: PlannerModel = {
      groups: [],
      layers: [layer("highlights"), layer("other")],
      items: [
        highlight("outside", "2027-07-01", "2027-07-03"),
        highlight("other-layer", "2027-06-10", "2027-06-14", { layerId: "other" }),
        highlight("activity", "2027-06-10", "2027-06-14", { kind: "activity" }),
      ],
      resources: [],
    };
    const result = eraseItems({ ...context([]), model }, "highlights", {
      kind: "all-day",
      startDate: "2027-06-12",
      endDateExclusive: "2027-06-13",
    });
    expect(result.updatedItems).toHaveLength(0);
    expect(result.removedItemIds).toHaveLength(0);
  });

  it("creates a minimal item when defaults are empty", () => {
    const result = paintItems(
      context([]),
      "highlights",
      { kind: "all-day", startDate: "2027-06-12", endDateExclusive: "2027-06-13" },
      { kind: "highlight" },
    );
    expect(result.updatedItems[0]).toEqual({
      id: "new-1",
      kind: "highlight",
      layerId: "highlights",
      period: { kind: "all-day", startDate: "2027-06-12", endDateExclusive: "2027-06-13" },
      version: 1,
    });
  });

  it("rejects a zero-length range", () => {
    const result = eraseItems(context([highlight("a", "2027-06-10", "2027-06-14")]), "highlights", {
      kind: "all-day",
      startDate: "2027-06-12",
      endDateExclusive: "2027-06-12",
    });
    expect(result.ok).toBe(false);
    expect(result.diagnostics.map((entry) => entry.code)).toContain("INVALID_RANGE");
  });

  it("accepts matching expected versions and rejects a hidden item version", () => {
    const item = highlight("a", "2027-06-10", "2027-06-14");
    const accepted = eraseItems(context([item], { expectedVersions: { a: 1 } }), "highlights", {
      kind: "all-day",
      startDate: "2027-06-12",
      endDateExclusive: "2027-06-13",
    });
    expect(accepted.ok).toBe(true);
    const hidden = eraseItems(
      context([item], {
        visibility: state({ hiddenItemIds: ["a"] }),
        expectedVersions: { a: 999 },
      }),
      "highlights",
      { kind: "all-day", startDate: "2027-06-12", endDateExclusive: "2027-06-13" },
    );
    expect(hidden.ok).toBe(true);
    expect(hidden.updatedItems).toHaveLength(0);
  });

  it("rejects a layer hidden by its group and a policy denial", () => {
    const hiddenLayer: PlannerModel = {
      groups: [{ id: "g", name: "G" }],
      layers: [layer("highlights", { groupId: "g" })],
      items: [highlight("a", "2027-06-10", "2027-06-14")],
      resources: [],
    };
    const hidden = eraseItems(
      {
        ...context([]),
        model: hiddenLayer,
        visibility: state({ hiddenGroupIds: ["g"] }),
      },
      "highlights",
      { kind: "all-day", startDate: "2027-06-12", endDateExclusive: "2027-06-13" },
    );
    expect(hidden.ok).toBe(false);
    expect(hidden.diagnostics.map((entry) => entry.code)).toContain("NOT_EDITABLE");

    const deniedLayer: PlannerModel = {
      ...hiddenLayer,
      layers: [layer("highlights", { policy: { allowPaint: false } })],
    };
    const denied = eraseItems({ ...context([]), model: deniedLayer }, "highlights", {
      kind: "all-day",
      startDate: "2027-06-12",
      endDateExclusive: "2027-06-13",
    });
    expect(denied.ok).toBe(false);
    expect(denied.diagnostics.map((entry) => entry.code)).toContain("NOT_EDITABLE");
  });

  it("rejects non-paint modes", () => {
    for (const mode of ["select", "inspect", "move", "resize", "create"] as const) {
      const result = eraseItems(
        context([highlight("a", "2027-06-10", "2027-06-14")], { mode }),
        "highlights",
        { kind: "all-day", startDate: "2027-06-12", endDateExclusive: "2027-06-13" },
      );
      expect(result.ok).toBe(false);
      expect(result.diagnostics.map((entry) => entry.code)).toContain("NOT_EDITABLE");
    }
  });

  it("rejects an unknown layer and a foreground channel", () => {
    const unknown = eraseItems(context([]), "missing", {
      kind: "all-day",
      startDate: "2027-06-12",
      endDateExclusive: "2027-06-13",
    });
    expect(unknown.diagnostics.map((entry) => entry.code)).toContain("INVALID_PAINT_TARGET");
    const foreground = eraseItems(
      {
        ...context([]),
        model: {
          groups: [],
          layers: [layer("highlights", { channel: "foreground" })],
          items: [],
          resources: [],
        },
      },
      "highlights",
      { kind: "all-day", startDate: "2027-06-12", endDateExclusive: "2027-06-13" },
    );
    expect(foreground.diagnostics.map((entry) => entry.code)).toContain("INVALID_PAINT_CHANNEL");
  });
});
