import { describe, expect, it } from "vitest";
import {
  canCreateItem,
  canDeleteItem,
  getItemEditability,
  getResolvedLayerPolicy,
} from "./editability";
import type {
  LayerGroup,
  PlannerFilter,
  PlannerItem,
  PlannerLayer,
  PlannerModel,
  Resource,
  VisibilityState,
} from "./types";
import {
  countVisibleItems,
  createInitialVisibility,
  getEffectiveVisibility,
  getGroupVisibility,
  resolveItemVisibility,
  serializeVisibility,
  visibilityReducer,
  visibleItems,
} from "./visibility";

const group = (id: string, parentGroupId?: string, defaultVisible?: boolean): LayerGroup => ({
  id,
  name: id,
  ...(parentGroupId === undefined ? {} : { parentGroupId }),
  ...(defaultVisible === undefined ? {} : { defaultVisible }),
});

const layer = (
  id: string,
  groupId?: string,
  overrides: Partial<PlannerLayer> = {},
): PlannerLayer => ({
  id,
  name: id,
  channel: "ribbon",
  color: "#1d4e89",
  ...(groupId === undefined ? {} : { groupId }),
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

const resource = (id: string): Resource => ({ id, name: id, type: "person" });

const visibility = (overrides: Partial<VisibilityState> = {}): VisibilityState => ({
  hiddenGroupIds: [],
  hiddenLayerIds: [],
  hiddenItemIds: [],
  ...overrides,
});

const opsModel: PlannerModel = {
  groups: [group("ops"), group("logistics", "ops")],
  layers: [layer("bookings", "logistics"), layer("maintenance", "logistics"), layer("notes")],
  items: [
    item("booking-jan-a", "bookings"),
    item("maintenance-1", "maintenance"),
    item("note-1", "notes"),
  ],
  resources: [resource("alice"), resource("bob")],
};

const filter = (overrides: Partial<PlannerFilter>): PlannerFilter => overrides;

describe("RD-04-AC-01/02/03: visibility precedence", () => {
  it("hides descendants of a hidden group without changing canonical items", () => {
    const state = visibility({ hiddenGroupIds: ["ops"] });
    const context = { model: opsModel, visibility: state };
    const canonical = JSON.parse(JSON.stringify(opsModel.items));
    expect(getEffectiveVisibility("booking-jan-a", context)).toEqual({
      visible: false,
      reason: "group",
    });
    expect(getEffectiveVisibility("maintenance-1", context).reason).toBe("group");
    expect(opsModel.items).toEqual(canonical);
  });

  it("does not let showItem override a hidden group", () => {
    const state = visibilityReducer(
      { model: opsModel, visibility: visibility({ hiddenGroupIds: ["ops"] }) },
      visibility({ hiddenGroupIds: ["ops"] }),
      { type: "showItem", itemId: "booking-jan-a" },
    );
    expect(getEffectiveVisibility("booking-jan-a", { model: opsModel, visibility: state })).toEqual(
      {
        visible: false,
        reason: "group",
      },
    );
  });

  it("does not let showItem override a hidden layer", () => {
    const state = visibilityReducer(
      { model: opsModel, visibility: visibility({ hiddenLayerIds: ["bookings"] }) },
      visibility({ hiddenLayerIds: ["bookings"] }),
      { type: "showItem", itemId: "booking-jan-a" },
    );
    expect(getEffectiveVisibility("booking-jan-a", { model: opsModel, visibility: state })).toEqual(
      {
        visible: false,
        reason: "layer",
      },
    );
  });

  it("reports item, channel and filter reasons in precedence order", () => {
    expect(
      getEffectiveVisibility("booking-jan-a", {
        model: opsModel,
        visibility: visibility({ hiddenItemIds: ["booking-jan-a"] }),
      }),
    ).toEqual({ visible: false, reason: "item" });
    expect(
      getEffectiveVisibility("booking-jan-a", {
        model: opsModel,
        visibility: visibility({ hiddenChannels: ["ribbon"] }),
      }),
    ).toEqual({ visible: false, reason: "channel" });
    expect(
      getEffectiveVisibility("booking-jan-a", {
        model: opsModel,
        visibility: visibility(),
        filter: filter({ statuses: ["confirmed"] }),
      }),
    ).toEqual({ visible: false, reason: "filter" });
  });

  it("reports mixed for a group with one visible and one hidden child", () => {
    const model: PlannerModel = {
      groups: [group("mixed"), group("empty")],
      layers: [layer("l1", "mixed"), layer("l2", "mixed"), layer("l3", "empty")],
      items: [item("i1", "l1"), item("i2", "l2")],
      resources: [],
    };
    expect(
      getGroupVisibility("mixed", {
        model,
        visibility: visibility({ hiddenItemIds: ["i2"] }),
      }),
    ).toBe("mixed");
  });

  it("toggles visible, hidden and mixed groups deterministically", () => {
    const context = { model: opsModel, visibility: visibility() };
    const visible = visibilityReducer(context, visibility(), {
      type: "toggleGroup",
      groupId: "ops",
    });
    expect(visible.hiddenGroupIds).toEqual(["ops"]);
    const hidden = visibilityReducer(context, visibility({ hiddenGroupIds: ["ops"] }), {
      type: "toggleGroup",
      groupId: "ops",
    });
    expect(hidden.hiddenGroupIds).toEqual([]);
    const model: PlannerModel = {
      groups: [group("mixed")],
      layers: [layer("l1", "mixed"), layer("l2", "mixed")],
      items: [item("i1", "l1"), item("i2", "l2")],
      resources: [],
    };
    const mixed = visibilityReducer(
      { model, visibility: visibility({ hiddenItemIds: ["i2"] }) },
      visibility({ hiddenItemIds: ["i2"] }),
      { type: "toggleGroup", groupId: "mixed" },
    );
    expect(mixed.hiddenGroupIds).toEqual(["mixed"]);
    expect(mixed.hiddenItemIds).toEqual(["i2"]);
  });

  it("RD-04-AC-08: filters by status, layer, resource and trimmed search without mutating input", () => {
    const model: PlannerModel = {
      ...opsModel,
      items: [
        item("alpha", "bookings", {
          title: "Alpha",
          status: "confirmed",
          assignments: [{ resourceId: "alice" }],
        }),
        item("beta", "maintenance", {
          title: "Beta",
          status: "tentative",
          assignments: [{ resourceId: "bob" }],
        }),
      ],
    };
    const snapshot = JSON.parse(JSON.stringify(model.items));
    expect(
      visibleItems({ model, visibility: visibility(), filter: { statuses: ["confirmed"] } }).map(
        (entry) => entry.id,
      ),
    ).toEqual(["alpha"]);
    expect(
      visibleItems({ model, visibility: visibility(), filter: { search: "  alpha  " } }).map(
        (entry) => entry.id,
      ),
    ).toEqual(["alpha"]);
    expect(
      visibleItems({ model, visibility: visibility(), filter: { search: "   " } }),
    ).toHaveLength(2);
    expect(
      visibleItems({
        model,
        visibility: visibility(),
        filter: { layerIds: ["bookings"], resourceIds: ["alice"] },
      }).map((entry) => entry.id),
    ).toEqual(["alpha"]);
    expect(
      visibleItems({
        model,
        visibility: visibility(),
        filter: { layerIds: ["bookings"], resourceIds: ["bob"] },
      }),
    ).toHaveLength(0);
    expect(model.items).toEqual(snapshot);
  });

  it("creates initial visibility from defaults and serializes deterministically", () => {
    const model: PlannerModel = {
      groups: [group("hidden-group", undefined, false)],
      layers: [layer("hidden-layer", undefined, { defaultVisible: false }), layer("shown")],
      items: [],
      resources: [],
    };
    const state = createInitialVisibility(model);
    expect(state.hiddenGroupIds).toEqual(["hidden-group"]);
    expect(state.hiddenLayerIds).toEqual(["hidden-layer"]);
    expect(serializeVisibility({ ...state, hiddenItemIds: ["b", "a", "a"] })).toBe(
      serializeVisibility({ ...state, hiddenItemIds: ["a", "b"] }),
    );
  });

  it("counts only effectively visible items", () => {
    const context = {
      model: opsModel,
      visibility: visibility({ hiddenItemIds: ["note-1"] }),
    };
    expect(countVisibleItems(context)).toBe(2);
    expect(visibleItems(context).map((entry) => entry.id)).toEqual([
      "booking-jan-a",
      "maintenance-1",
    ]);
    expect(resolveItemVisibility(context).get("note-1")).toEqual({
      visible: false,
      reason: "item",
    });
  });
});

describe("RD-04-AC-05: tri-state and reducer matrix", () => {
  it("returns visible/hidden for empty groups and hidden ancestors", () => {
    const model: PlannerModel = {
      groups: [group("empty"), group("empty-hidden"), group("child", "empty-hidden")],
      layers: [layer("l1", "empty"), layer("l2", "empty-hidden"), layer("l3", "child")],
      items: [],
      resources: [],
    };
    expect(getGroupVisibility("empty", { model, visibility: visibility() })).toBe("visible");
    expect(
      getGroupVisibility("empty-hidden", {
        model,
        visibility: visibility({ hiddenLayerIds: ["l2", "l3"] }),
      }),
    ).toBe("hidden");
    expect(
      getGroupVisibility("child", {
        model,
        visibility: visibility({ hiddenGroupIds: ["empty-hidden"] }),
      }),
    ).toBe("hidden");
  });

  it("applies every reducer action to the expected state", () => {
    const context = { model: opsModel, visibility: visibility() };
    const start = visibility({
      hiddenLayerIds: ["layer-a"],
      hiddenItemIds: ["item-a"],
      hiddenChannels: ["ribbon"],
    });
    const cases: Array<[Parameters<typeof visibilityReducer>[2], Partial<VisibilityState>]> = [
      [{ type: "showItem", itemId: "item-a" }, { hiddenItemIds: [] }],
      [{ type: "hideItem", itemId: "item-b" }, { hiddenItemIds: ["item-a", "item-b"] }],
      [{ type: "toggleItem", itemId: "item-a" }, { hiddenItemIds: [] }],
      [{ type: "showLayer", layerId: "layer-a" }, { hiddenLayerIds: [] }],
      [{ type: "hideLayer", layerId: "layer-b" }, { hiddenLayerIds: ["layer-a", "layer-b"] }],
      [{ type: "toggleLayer", layerId: "layer-a" }, { hiddenLayerIds: [] }],
      [{ type: "showChannel", channel: "ribbon" }, { hiddenChannels: [] }],
      [
        { type: "hideChannel", channel: "annotation" },
        { hiddenChannels: ["ribbon", "annotation"] },
      ],
      [{ type: "toggleChannel", channel: "ribbon" }, { hiddenChannels: [] }],
      [{ type: "hideGroup", groupId: "ops" }, { hiddenGroupIds: ["ops"] }],
      [{ type: "toggleGroup", groupId: "ops" }, { hiddenGroupIds: [] }],
      [
        { type: "reset" },
        { hiddenGroupIds: [], hiddenLayerIds: [], hiddenItemIds: [], hiddenChannels: [] },
      ],
    ];
    for (const [action, expected] of cases) {
      const next = visibilityReducer(context, start, action);
      expect(next).toMatchObject(expected);
      expect(start.hiddenItemIds).toEqual(["item-a"]);
    }
    const deduped = visibilityReducer(context, visibility({ hiddenItemIds: ["item-a"] }), {
      type: "hideItem",
      itemId: "item-a",
    });
    expect(deduped.hiddenItemIds).toEqual(["item-a"]);
  });
});

describe("RD-04-AC-14: editability precedence", () => {
  const editContext = (overrides: Partial<Parameters<typeof getItemEditability>[2]> = {}) => ({
    model: opsModel,
    visibility: visibility(),
    mode: "auto" as const,
    ...overrides,
  });

  it("lets global read-only win over every action", () => {
    for (const action of ["move", "resize", "paint"] as const) {
      expect(getItemEditability("booking-jan-a", action, editContext({ readOnly: true }))).toEqual({
        editable: false,
        reason: "global-read-only",
      });
    }
  });

  it("honours item, layer and policy guardrails", () => {
    const model: PlannerModel = {
      ...opsModel,
      items: opsModel.items.map((entry) =>
        entry.id === "booking-jan-a" ? { ...entry, locked: true } : entry,
      ),
      layers: opsModel.layers.map((entry) =>
        entry.id === "bookings" || entry.id === "maintenance"
          ? { ...entry, readOnly: true }
          : entry,
      ),
    };
    expect(
      getItemEditability("booking-jan-a", "move", {
        model,
        visibility: visibility(),
        mode: "auto",
      }),
    ).toEqual({ editable: false, reason: "item-locked" });
    expect(
      getItemEditability("maintenance-1", "move", {
        model,
        visibility: visibility(),
        mode: "auto",
      }),
    ).toEqual({ editable: false, reason: "layer-locked" });
  });

  it("resolves nested policies per field and lets the layer override", () => {
    const model: PlannerModel = {
      groups: [group("root"), { ...group("leaf", "root"), policy: { allowResize: false } }],
      layers: [layer("l", "leaf", { policy: { allowMove: false, allowPaint: false } })],
      items: [item("i", "l")],
      resources: [],
    };
    expect(getResolvedLayerPolicy("l", model)).toEqual({
      allowMove: false,
      allowResize: false,
      allowPaint: false,
      allowCreate: true,
      allowDelete: true,
    });
    expect(
      getItemEditability("i", "move", { model, visibility: visibility(), mode: "auto" }),
    ).toEqual({
      editable: false,
      reason: "policy",
    });
    expect(
      getItemEditability("i", "resize", { model, visibility: visibility(), mode: "auto" }),
    ).toEqual({
      editable: false,
      reason: "policy",
    });
    expect(
      getItemEditability("i", "paint", { model, visibility: visibility(), mode: "auto" }),
    ).toEqual({
      editable: false,
      reason: "policy",
    });
  });

  it("blocks hidden items and applies the interaction mode", () => {
    expect(
      getItemEditability("booking-jan-a", "move", {
        ...editContext(),
        visibility: visibility({ hiddenItemIds: ["booking-jan-a"] }),
      }),
    ).toEqual({ editable: false, reason: "hidden" });
    expect(getItemEditability("booking-jan-a", "paint", editContext({ mode: "paint" }))).toEqual({
      editable: true,
      reason: "editable",
    });
    expect(getItemEditability("booking-jan-a", "move", editContext({ mode: "paint" }))).toEqual({
      editable: false,
      reason: "interaction-mode",
    });
    expect(getItemEditability("booking-jan-a", "move", editContext({ mode: "select" }))).toEqual({
      editable: false,
      reason: "interaction-mode",
    });
  });

  it("applies the editability matrix", () => {
    const cases: Array<{
      setup: Partial<PlannerModel> & { item?: Partial<PlannerItem>; layer?: Partial<PlannerLayer> };
      action: "move" | "resize" | "paint";
      reason: string;
    }> = [
      { setup: { item: { locked: true } }, action: "move", reason: "item-locked" },
      { setup: { item: { readOnly: true } }, action: "resize", reason: "item-locked" },
      { setup: { item: { locked: true } }, action: "paint", reason: "item-locked" },
      { setup: { layer: { locked: true } }, action: "paint", reason: "layer-locked" },
      { setup: { layer: { readOnly: true } }, action: "move", reason: "layer-locked" },
      { setup: { layer: { policy: { allowMove: false } } }, action: "move", reason: "policy" },
      { setup: { layer: { policy: { allowResize: false } } }, action: "resize", reason: "policy" },
      { setup: { layer: { policy: { allowPaint: false } } }, action: "paint", reason: "policy" },
    ];
    for (const entry of cases) {
      const model: PlannerModel = {
        ...opsModel,
        items: opsModel.items.map((value) =>
          value.id === "booking-jan-a" ? { ...value, ...entry.setup.item } : value,
        ),
        layers: opsModel.layers.map((value) =>
          value.id === "bookings" ? { ...value, ...entry.setup.layer } : value,
        ),
      };
      expect(
        getItemEditability("booking-jan-a", entry.action, {
          model,
          visibility: visibility(),
          mode: "auto",
        }),
      ).toEqual({ editable: false, reason: entry.reason });
    }
  });

  it("checks create/delete visibility, locks, policy, mode and active layer", () => {
    expect(
      canCreateItem("bookings", {
        ...editContext(),
        mode: "create",
        activeLayerId: "bookings",
      }),
    ).toEqual({ editable: true, reason: "editable" });
    expect(
      canCreateItem("bookings", {
        ...editContext(),
        mode: "create",
        activeLayerId: "maintenance",
      }),
    ).toEqual({ editable: false, reason: "policy" });
    expect(
      canCreateItem("bookings", {
        ...editContext(),
        mode: "inspect",
        activeLayerId: "bookings",
      }),
    ).toEqual({ editable: false, reason: "interaction-mode" });
    expect(
      canCreateItem("bookings", {
        ...editContext(),
        visibility: visibility({ hiddenLayerIds: ["bookings"] }),
        mode: "auto",
        activeLayerId: "bookings",
      }),
    ).toEqual({ editable: false, reason: "hidden" });
    expect(canDeleteItem("booking-jan-a", { ...editContext(), mode: "create" })).toEqual({
      editable: false,
      reason: "interaction-mode",
    });
    expect(
      canDeleteItem("booking-jan-a", {
        ...editContext(),
        visibility: visibility({ hiddenItemIds: ["booking-jan-a"] }),
      }),
    ).toEqual({ editable: false, reason: "hidden" });
    const noDelete: PlannerModel = {
      ...opsModel,
      layers: opsModel.layers.map((value) =>
        value.id === "bookings" ? { ...value, policy: { allowDelete: false } } : value,
      ),
    };
    expect(canDeleteItem("booking-jan-a", { ...editContext(), model: noDelete })).toEqual({
      editable: false,
      reason: "policy",
    });
    expect(canDeleteItem("booking-jan-a", editContext())).toEqual({
      editable: true,
      reason: "editable",
    });
  });
});
