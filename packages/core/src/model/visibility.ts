import type {
  PlannerFilter,
  PlannerItem,
  PlannerLayer,
  PlannerModel,
  RenderChannel,
  VisibilityState,
} from "./types.js";

/** Why an item is visible or hidden. */
export type VisibilityReason =
  | "visible"
  | "group"
  | "layer"
  | "item"
  | "filter"
  | "channel"
  | "unknown-entity";

/** Result of resolving one item's effective visibility. */
export interface EffectiveVisibility {
  /** Whether the item is effectively visible. */
  visible: boolean;
  /** First hiding reason, or `visible`. */
  reason: VisibilityReason;
}

/** Everything needed to resolve visibility. */
export interface VisibilityContext {
  /** Validated planner model. */
  model: PlannerModel;
  /** Hidden group, layer, item and channel state. */
  visibility: VisibilityState;
  /** Optional host filter. */
  filter?: PlannerFilter;
}

/** Visibility state transitions. */
export type VisibilityAction =
  | { type: "showItem"; itemId: string }
  | { type: "hideItem"; itemId: string }
  | { type: "toggleItem"; itemId: string }
  | { type: "showLayer"; layerId: string }
  | { type: "hideLayer"; layerId: string }
  | { type: "toggleLayer"; layerId: string }
  | { type: "showGroup"; groupId: string }
  | { type: "hideGroup"; groupId: string }
  | { type: "toggleGroup"; groupId: string }
  | { type: "showChannel"; channel: RenderChannel }
  | { type: "hideChannel"; channel: RenderChannel }
  | { type: "toggleChannel"; channel: RenderChannel }
  | { type: "reset" };

/** Options for a serializable visibility preset. */
export interface VisibilityPresetOptions {
  /** Group IDs to hide. */
  hideGroupIds?: string[];
  /** Layer IDs to hide. */
  hideLayerIds?: string[];
  /** Item IDs to hide. */
  hideItemIds?: string[];
  /** Render channels to hide. */
  hideChannels?: RenderChannel[];
}

interface Ancestry {
  layerById: ReadonlyMap<string, PlannerLayer>;
  itemById: ReadonlyMap<string, PlannerItem>;
  parentOf: ReadonlyMap<string, string | undefined>;
}

function buildAncestry(model: PlannerModel): Ancestry {
  return {
    layerById: new Map(model.layers.map((entry) => [entry.id, entry])),
    itemById: new Map(model.items.map((entry) => [entry.id, entry])),
    parentOf: new Map(model.groups.map((entry) => [entry.id, entry.parentGroupId])),
  };
}

function isGroupHidden(groupId: string, visibility: VisibilityState, ancestry: Ancestry): boolean {
  const hidden = new Set(visibility.hiddenGroupIds);
  let cursor: string | undefined = groupId;
  const seen = new Set<string>();
  while (cursor !== undefined && !seen.has(cursor)) {
    if (hidden.has(cursor)) return true;
    seen.add(cursor);
    cursor = ancestry.parentOf.get(cursor);
  }
  return false;
}

function itemLayer(item: PlannerItem, ancestry: Ancestry): PlannerLayer | undefined {
  return ancestry.layerById.get(item.layerId);
}

function matchesFilter(item: PlannerItem, filter: PlannerFilter | undefined): boolean {
  if (!filter) return true;
  if (filter.layerIds && filter.layerIds.length > 0 && !filter.layerIds.includes(item.layerId)) {
    return false;
  }
  if (filter.resourceIds && filter.resourceIds.length > 0) {
    const matches = item.assignments?.some((assignment) =>
      filter.resourceIds?.includes(assignment.resourceId),
    );
    if (!matches) return false;
  }
  if (filter.statuses && filter.statuses.length > 0) {
    if (item.status === undefined || !filter.statuses.includes(item.status)) return false;
  }
  const search = filter.search?.trim().toLowerCase();
  if (
    search &&
    !(typeof item.title === "string" ? item.title : "").toLowerCase().includes(search)
  ) {
    return false;
  }
  return true;
}

function evaluate(
  item: PlannerItem,
  context: VisibilityContext,
  ancestry: Ancestry,
): EffectiveVisibility {
  const layer = itemLayer(item, ancestry);
  if (!layer) return { visible: false, reason: "unknown-entity" };
  if (layer.groupId !== undefined && isGroupHidden(layer.groupId, context.visibility, ancestry)) {
    return { visible: false, reason: "group" };
  }
  if (context.visibility.hiddenLayerIds.includes(layer.id)) {
    return { visible: false, reason: "layer" };
  }
  if (context.visibility.hiddenItemIds.includes(item.id)) {
    return { visible: false, reason: "item" };
  }
  if (!matchesFilter(item, context.filter)) {
    return { visible: false, reason: "filter" };
  }
  if (context.visibility.hiddenChannels?.includes(layer.channel)) {
    return { visible: false, reason: "channel" };
  }
  return { visible: true, reason: "visible" };
}

/** Returns one item's effective visibility. */
export function getEffectiveVisibility(
  itemId: string,
  context: VisibilityContext,
): EffectiveVisibility {
  const ancestry = buildAncestry(context.model);
  const item = ancestry.itemById.get(itemId);
  if (!item) return { visible: false, reason: "unknown-entity" };
  return evaluate(item, context, ancestry);
}

/** Resolves visibility for every item in the model. */
export function resolveItemVisibility(
  context: VisibilityContext,
): ReadonlyMap<string, EffectiveVisibility> {
  const ancestry = buildAncestry(context.model);
  return new Map(context.model.items.map((item) => [item.id, evaluate(item, context, ancestry)]));
}

/** Returns the effectively visible items, in model order. */
export function visibleItems(context: VisibilityContext): PlannerItem[] {
  const ancestry = buildAncestry(context.model);
  return context.model.items.filter((item) => evaluate(item, context, ancestry).visible);
}

/** Counts effectively visible items. */
export function countVisibleItems(context: VisibilityContext): number {
  return visibleItems(context).length;
}

/** Returns whether a layer is hidden by its group, itself or its channel. */
export function isLayerEffectivelyHidden(layerId: string, context: VisibilityContext): boolean {
  const ancestry = buildAncestry(context.model);
  const layer = ancestry.layerById.get(layerId);
  if (!layer) return true;
  if (layer.groupId !== undefined && isGroupHidden(layer.groupId, context.visibility, ancestry)) {
    return true;
  }
  if (context.visibility.hiddenLayerIds.includes(layerId)) return true;
  return context.visibility.hiddenChannels?.includes(layer.channel) ?? false;
}

/** Returns a layer's render channel, if the layer exists. */
export function getLayerChannel(
  layerId: string,
  context: VisibilityContext,
): RenderChannel | undefined {
  return context.model.layers.find((entry) => entry.id === layerId)?.channel;
}

/** Returns a group's tri-state visibility. */
export function getGroupVisibility(
  groupId: string,
  context: VisibilityContext,
): "visible" | "hidden" | "mixed" {
  const ancestry = buildAncestry(context.model);
  if (!ancestry.parentOf.has(groupId)) return "hidden";
  if (isGroupHidden(groupId, context.visibility, ancestry)) return "hidden";
  const descendantLayers = context.model.layers.filter((layer) => {
    let cursor: string | undefined = layer.groupId;
    const seen = new Set<string>();
    while (cursor !== undefined && !seen.has(cursor)) {
      if (cursor === groupId) return true;
      seen.add(cursor);
      cursor = ancestry.parentOf.get(cursor);
    }
    return false;
  });
  if (descendantLayers.length === 0) return "hidden";
  const layerIds = new Set(descendantLayers.map((layer) => layer.id));
  const descendantItems = context.model.items.filter((item) => layerIds.has(item.layerId));
  if (descendantItems.length === 0) {
    return descendantLayers.some((layer) => !isLayerEffectivelyHidden(layer.id, context))
      ? "visible"
      : "hidden";
  }
  const states = descendantItems.map((item) => evaluate(item, context, ancestry).visible);
  const anyVisible = states.some(Boolean);
  const anyHidden = states.some((state) => !state);
  if (anyVisible && anyHidden) return "mixed";
  return anyVisible ? "visible" : "hidden";
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

/** Creates an empty visibility preset with every list present. */
export function createVisibilityPreset(options: VisibilityPresetOptions = {}): VisibilityState {
  return {
    hiddenGroupIds: unique(options.hideGroupIds ?? []),
    hiddenLayerIds: unique(options.hideLayerIds ?? []),
    hiddenItemIds: unique(options.hideItemIds ?? []),
    hiddenChannels: unique(options.hideChannels ?? []),
  };
}

/** Seeds visibility from `defaultVisible: false` and merges a preset. */
export function createInitialVisibility(
  model: PlannerModel,
  preset: VisibilityPresetOptions = {},
): VisibilityState {
  const base = createVisibilityPreset({
    hideGroupIds: model.groups
      .filter((entry) => entry.defaultVisible === false)
      .map((entry) => entry.id),
    hideLayerIds: model.layers
      .filter((entry) => entry.defaultVisible === false)
      .map((entry) => entry.id),
    hideItemIds: preset.hideItemIds ?? [],
    hideChannels: preset.hideChannels ?? [],
  });
  return createVisibilityPreset({
    hideGroupIds: [...base.hiddenGroupIds, ...(preset.hideGroupIds ?? [])],
    hideLayerIds: [...base.hiddenLayerIds, ...(preset.hideLayerIds ?? [])],
    hideItemIds: [...base.hiddenItemIds, ...(preset.hideItemIds ?? [])],
    hideChannels: [...(base.hiddenChannels ?? []), ...(preset.hideChannels ?? [])],
  });
}

function toggle<T>(list: T[], id: T, visible: boolean): T[] {
  return visible ? unique([...list, id]) : list.filter((entry) => entry !== id);
}

/** Applies a visibility action without mutating the input state. */
export function visibilityReducer(
  context: VisibilityContext,
  state: VisibilityState,
  action: VisibilityAction,
): VisibilityState {
  const current = createVisibilityPreset({
    hideGroupIds: state.hiddenGroupIds,
    hideLayerIds: state.hiddenLayerIds,
    hideItemIds: state.hiddenItemIds,
    hideChannels: state.hiddenChannels ?? [],
  });
  const channels = current.hiddenChannels ?? [];
  switch (action.type) {
    case "showItem":
    case "hideItem":
    case "toggleItem": {
      const hidden = current.hiddenItemIds.includes(action.itemId);
      const show = action.type === "showItem" || (action.type === "toggleItem" && hidden);
      return { ...current, hiddenItemIds: toggle(current.hiddenItemIds, action.itemId, !show) };
    }
    case "showLayer":
    case "hideLayer":
    case "toggleLayer": {
      const hidden = current.hiddenLayerIds.includes(action.layerId);
      const show = action.type === "showLayer" || (action.type === "toggleLayer" && hidden);
      return { ...current, hiddenLayerIds: toggle(current.hiddenLayerIds, action.layerId, !show) };
    }
    case "showGroup":
    case "hideGroup":
    case "toggleGroup": {
      if (action.type === "showGroup") {
        return {
          ...current,
          hiddenGroupIds: current.hiddenGroupIds.filter((id) => id !== action.groupId),
        };
      }
      if (action.type === "hideGroup") {
        return { ...current, hiddenGroupIds: unique([...current.hiddenGroupIds, action.groupId]) };
      }
      const groupState = getGroupVisibility(action.groupId, { ...context, visibility: current });
      return {
        ...current,
        hiddenGroupIds:
          groupState === "hidden"
            ? current.hiddenGroupIds.filter((id) => id !== action.groupId)
            : unique([...current.hiddenGroupIds, action.groupId]),
      };
    }
    case "showChannel":
    case "hideChannel":
    case "toggleChannel": {
      const hidden = channels.includes(action.channel);
      const show = action.type === "showChannel" || (action.type === "toggleChannel" && hidden);
      return {
        ...current,
        hiddenChannels: toggle(channels, action.channel, !show),
      };
    }
    case "reset":
      return createVisibilityPreset();
  }
}

/** Serializes visibility with sorted, deduplicated lists. */
export function serializeVisibility(state: VisibilityState): string {
  return JSON.stringify({
    hiddenGroupIds: unique(state.hiddenGroupIds).sort(),
    hiddenLayerIds: unique(state.hiddenLayerIds).sort(),
    hiddenItemIds: unique(state.hiddenItemIds).sort(),
    hiddenChannels: unique(state.hiddenChannels ?? []).sort(),
  });
}
