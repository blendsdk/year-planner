import { describe, expect, it } from "vitest";
import {
  canCreateItem,
  canDeleteItem,
  getItemEditability,
  getResolvedLayerPolicy,
} from "./editability";
import type { PlannerItem, PlannerLayer, PlannerModel, VisibilityState } from "./types";
import {
  countVisibleItems,
  createInitialVisibility,
  createVisibilityPreset,
  getEffectiveVisibility,
  getGroupVisibility,
  getLayerChannel,
  isLayerEffectivelyHidden,
  resolveItemVisibility,
  serializeVisibility,
  visibilityReducer,
  visibleItems,
} from "./visibility";

const layer = (id: string, overrides: Partial<PlannerLayer> = {}): PlannerLayer => ({
  id,
  name: id,
  channel: "ribbon",
  color: "#1d4e89",
  ...overrides,
});

const item = (id: string, layerId: string, overrides: Partial<PlannerItem> = {}): PlannerItem => ({
  id,
  kind: "activity",
  layerId,
  period: { kind: "all-day", startDate: "2027-02-01", endDateExclusive: "2027-02-05" },
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

const model: PlannerModel = {
  groups: [{ id: "g", name: "G" }],
  layers: [layer("l", { groupId: "g" }), layer("bg", { channel: "background" })],
  items: [item("i", "l"), item("b", "bg")],
  resources: [],
};

describe("visibility internals", () => {
  it("returns unknown-entity for unknown ids and layers", () => {
    expect(getEffectiveVisibility("missing", { model, visibility: state() })).toEqual({
      visible: false,
      reason: "unknown-entity",
    });
    const broken: PlannerModel = { ...model, layers: [] };
    expect(getEffectiveVisibility("i", { model: broken, visibility: state() })).toEqual({
      visible: false,
      reason: "unknown-entity",
    });
    expect(isLayerEffectivelyHidden("missing", { model, visibility: state() })).toBe(true);
  });

  it("round-trips layer channels and visibility maps", () => {
    expect(getLayerChannel("bg", { model, visibility: state() })).toBe("background");
    expect(getLayerChannel("missing", { model, visibility: state() })).toBeUndefined();
    const map = resolveItemVisibility({ model, visibility: state({ hiddenItemIds: ["i"] }) });
    expect(map.get("i")?.visible).toBe(false);
    expect(map.get("b")?.visible).toBe(true);
  });

  it("applies show/hide/toggle to layers and channels with deduplication", () => {
    const context = { model, visibility: state() };
    const hiddenLayer = visibilityReducer(context, state(), { type: "hideLayer", layerId: "l" });
    expect(hiddenLayer.hiddenLayerIds).toEqual(["l"]);
    expect(
      visibilityReducer(context, hiddenLayer, { type: "hideLayer", layerId: "l" }).hiddenLayerIds,
    ).toEqual(["l"]);
    expect(
      visibilityReducer(context, hiddenLayer, { type: "showLayer", layerId: "l" }).hiddenLayerIds,
    ).toEqual([]);
    const hiddenChannel = visibilityReducer(context, state(), {
      type: "hideChannel",
      channel: "background",
    });
    expect(hiddenChannel.hiddenChannels).toEqual(["background"]);
    expect(
      visibilityReducer(context, hiddenChannel, {
        type: "toggleChannel",
        channel: "background",
      }).hiddenChannels,
    ).toEqual([]);
  });

  it("serializes channels and merges a preset into defaults", () => {
    expect(
      serializeVisibility(state({ hiddenChannels: ["ribbon", "annotation", "ribbon"] })),
    ).toContain('"hiddenChannels":["annotation","ribbon"]');
    const seeded = createInitialVisibility(model, {
      hideItemIds: ["i"],
      hideChannels: ["background"],
    });
    expect(seeded.hiddenItemIds).toEqual(["i"]);
    expect(seeded.hiddenChannels).toEqual(["background"]);
    expect(createVisibilityPreset()).toEqual({
      hiddenGroupIds: [],
      hiddenLayerIds: [],
      hiddenItemIds: [],
      hiddenChannels: [],
    });
  });

  it("returns hidden for an empty group with no layers and visible for a layer-only group", () => {
    const empty: PlannerModel = {
      groups: [{ id: "empty", name: "Empty" }],
      layers: [layer("l", { groupId: "empty" })],
      items: [],
      resources: [],
    };
    expect(getGroupVisibility("empty", { model: empty, visibility: state() })).toBe("visible");
    expect(
      getGroupVisibility("empty", {
        model: empty,
        visibility: state({ hiddenLayerIds: ["l"] }),
      }),
    ).toBe("hidden");
    expect(getGroupVisibility("missing", { model: empty, visibility: state() })).toBe("hidden");
  });

  it("filters missing titles and statuses", () => {
    const noTitle: PlannerModel = {
      ...model,
      items: [
        {
          id: "i",
          kind: "activity",
          layerId: "l",
          period: { kind: "all-day", startDate: "2027-02-01", endDateExclusive: "2027-02-05" },
          version: 1,
        },
      ],
    };
    expect(
      visibleItems({ model: noTitle, visibility: state(), filter: { search: "alpha" } }),
    ).toHaveLength(0);
    expect(
      visibleItems({ model: noTitle, visibility: state(), filter: { statuses: ["done"] } }),
    ).toHaveLength(0);
  });

  it("counts zero when every item is hidden by a channel", () => {
    expect(
      countVisibleItems({ model, visibility: state({ hiddenChannels: ["ribbon", "background"] }) }),
    ).toBe(0);
  });
});

describe("editability internals", () => {
  it("returns safe defaults for unknown entities and layers", () => {
    expect(getResolvedLayerPolicy("missing", model)).toEqual({
      allowMove: true,
      allowResize: true,
      allowPaint: true,
      allowCreate: true,
      allowDelete: true,
    });
    expect(getItemEditability("missing", "move", { model, visibility: state() })).toEqual({
      editable: false,
      reason: "unknown-entity",
    });
    expect(canCreateItem("missing", { model, visibility: state() })).toEqual({
      editable: false,
      reason: "unknown-entity",
    });
    expect(canDeleteItem("missing", { model, visibility: state() })).toEqual({
      editable: false,
      reason: "unknown-entity",
    });
  });

  it("blocks create on a read-only or locked layer", () => {
    for (const overrides of [{ readOnly: true }, { locked: true }]) {
      const locked: PlannerModel = {
        ...model,
        layers: [
          layer("l", { groupId: "g", ...overrides }),
          layer("bg", { channel: "background" }),
        ],
      };
      expect(canCreateItem("l", { model: locked, visibility: state(), mode: "auto" })).toEqual({
        editable: false,
        reason: "layer-locked",
      });
    }
  });

  it("blocks delete for locked items and layers", () => {
    const itemLocked: PlannerModel = {
      ...model,
      items: [item("i", "l", { locked: true }), item("b", "bg")],
    };
    expect(canDeleteItem("i", { model: itemLocked, visibility: state(), mode: "auto" })).toEqual({
      editable: false,
      reason: "item-locked",
    });
    const layerLocked: PlannerModel = {
      ...model,
      layers: [layer("l", { groupId: "g", locked: true }), layer("bg", { channel: "background" })],
    };
    expect(canDeleteItem("i", { model: layerLocked, visibility: state(), mode: "auto" })).toEqual({
      editable: false,
      reason: "layer-locked",
    });
  });

  it("checks global read-only before every create/delete rule", () => {
    expect(canCreateItem("l", { model, visibility: state(), readOnly: true })).toEqual({
      editable: false,
      reason: "global-read-only",
    });
    expect(canDeleteItem("i", { model, visibility: state(), readOnly: true })).toEqual({
      editable: false,
      reason: "global-read-only",
    });
  });

  it("denies resize and paint under move mode", () => {
    expect(getItemEditability("i", "resize", { model, visibility: state(), mode: "move" })).toEqual(
      { editable: false, reason: "interaction-mode" },
    );
    expect(getItemEditability("i", "paint", { model, visibility: state(), mode: "move" })).toEqual({
      editable: false,
      reason: "interaction-mode",
    });
    expect(getItemEditability("i", "paint", { model, visibility: state(), mode: "erase" })).toEqual(
      { editable: true, reason: "editable" },
    );
  });
});

describe("visibility regressions from phase review", () => {
  it("ignores empty hidden layers when descendant items exist", () => {
    const mixed: PlannerModel = {
      groups: [{ id: "g", name: "G" }],
      layers: [layer("visible", { groupId: "g" }), layer("hidden", { groupId: "g" })],
      items: [item("i", "visible")],
      resources: [],
    };
    expect(
      getGroupVisibility("g", {
        model: mixed,
        visibility: state({ hiddenLayerIds: ["hidden"] }),
      }),
    ).toBe("visible");
  });

  it("uses layer states only when a group has no items", () => {
    const noItems: PlannerModel = {
      groups: [{ id: "g", name: "G" }],
      layers: [layer("visible", { groupId: "g" }), layer("hidden", { groupId: "g" })],
      items: [],
      resources: [],
    };
    expect(
      getGroupVisibility("g", {
        model: noItems,
        visibility: state({ hiddenLayerIds: ["hidden"] }),
      }),
    ).toBe("visible");
    expect(
      getGroupVisibility("g", {
        model: noItems,
        visibility: state({ hiddenLayerIds: ["visible", "hidden"] }),
      }),
    ).toBe("hidden");
  });

  it("supports showGroup and toggle add paths", () => {
    const context = { model, visibility: state() };
    expect(
      visibilityReducer(context, state({ hiddenGroupIds: ["g"] }), {
        type: "showGroup",
        groupId: "g",
      }).hiddenGroupIds,
    ).toEqual([]);
    expect(
      visibilityReducer(context, state({ hiddenItemIds: ["i"] }), {
        type: "toggleItem",
        itemId: "i",
      }).hiddenItemIds,
    ).toEqual([]);
    expect(
      visibilityReducer(context, state({ hiddenLayerIds: ["l"] }), {
        type: "toggleLayer",
        layerId: "l",
      }).hiddenLayerIds,
    ).toEqual([]);
    expect(
      visibilityReducer(context, state({ hiddenChannels: ["ribbon"] }), {
        type: "toggleChannel",
        channel: "ribbon",
      }).hiddenChannels,
    ).toEqual([]);
  });

  it("resolves partial policies per field from root to leaf", () => {
    const policies: PlannerModel = {
      groups: [
        { id: "root", name: "Root", policy: { allowMove: false } },
        { id: "leaf", name: "Leaf", parentGroupId: "root", policy: { allowResize: false } },
      ],
      layers: [layer("l", { groupId: "leaf", policy: { allowPaint: false } })],
      items: [item("i", "l")],
      resources: [],
    };
    expect(getResolvedLayerPolicy("l", policies)).toEqual({
      allowMove: false,
      allowResize: false,
      allowPaint: false,
      allowCreate: true,
      allowDelete: true,
    });
  });

  it("allows the matching mode and auto for move/resize", () => {
    expect(getItemEditability("i", "move", { model, visibility: state(), mode: "move" })).toEqual({
      editable: true,
      reason: "editable",
    });
    expect(
      getItemEditability("i", "resize", { model, visibility: state(), mode: "resize" }),
    ).toEqual({ editable: true, reason: "editable" });
    expect(getItemEditability("i", "resize", { model, visibility: state(), mode: "auto" })).toEqual(
      { editable: true, reason: "editable" },
    );
  });

  it("checks allowCreate and accepts an undefined active layer", () => {
    const denied: PlannerModel = {
      ...model,
      layers: [
        layer("l", { groupId: "g", policy: { allowCreate: false } }),
        layer("bg", { channel: "background" }),
      ],
    };
    expect(canCreateItem("l", { model: denied, visibility: state(), mode: "auto" })).toEqual({
      editable: false,
      reason: "policy",
    });
    expect(canCreateItem("l", { model, visibility: state(), mode: "auto" })).toEqual({
      editable: true,
      reason: "editable",
    });
  });

  it("does not throw on a non-string title during search", () => {
    const broken: PlannerModel = {
      ...model,
      items: [{ ...item("i", "l"), title: 42 as never }],
    };
    expect(
      visibleItems({ model: broken, visibility: state(), filter: { search: "alpha" } }),
    ).toHaveLength(0);
  });
});
