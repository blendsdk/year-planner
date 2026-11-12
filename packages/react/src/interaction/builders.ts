import {
  type DateKey,
  getEffectiveVisibility,
  type PaintDefaults,
  type PlannerCommand,
  type PlannerFilter,
  type PlannerItem,
  type PlannerModel,
  type VisibilityState,
} from "@blendsdk/year-planner-core";
import type { InteractionConfig } from "../types.js";

/**
 * Input for a paint/erase command builder.
 * @public
 */
export interface BuildPaintInput {
  model: PlannerModel;
  visibility: VisibilityState;
  filter: PlannerFilter;
  layerId: string;
  startDate: DateKey;
  endDateExclusive: DateKey;
  operation: "union" | "subtract";
  defaults: PaintDefaults;
}

/**
 * Builds a paint/erase command for an active highlight layer.
 *
 * Expected versions cover the same visible, unlocked, editable items the core
 * paint reducer may change. Returns `undefined` when the layer cannot accept
 * paint.
 * @public
 */
export function buildPaintCommand(input: BuildPaintInput): PlannerCommand | undefined {
  const layer = input.model.layers.find((entry) => entry.id === input.layerId);
  if (!layer) return undefined;
  if (layer.channel !== "highlight") return undefined;
  const context = {
    model: input.model,
    visibility: input.visibility,
    filter: input.filter,
  };
  const expectedVersions: Record<string, number> = {};
  for (const item of input.model.items) {
    if (
      item.layerId !== input.layerId ||
      item.kind !== "highlight" ||
      item.period.kind !== "all-day" ||
      item.locked === true ||
      item.readOnly === true
    ) {
      continue;
    }
    if (
      item.period.startDate < input.endDateExclusive &&
      input.startDate < item.period.endDateExclusive &&
      getEffectiveVisibility(item.id, context).visible
    ) {
      expectedVersions[item.id] = item.version;
    }
  }
  return {
    type: "paint",
    layerId: input.layerId,
    period: {
      kind: "all-day",
      startDate: input.startDate,
      endDateExclusive: input.endDateExclusive,
    },
    operation: input.operation,
    defaults: input.defaults,
    expectedVersions,
  };
}

/**
 * Input for a create command item builder.
 * @public
 */
export interface BuildCreateInput {
  interaction: InteractionConfig | undefined;
  activeLayerId: string | undefined;
  startDate: DateKey;
  endDateExclusive: DateKey;
  createId: () => string;
}

/**
 * Builds a complete version-1 item for a create gesture.
 *
 * `createDefaults.layerId` wins over `activeLayerId`; kind defaults to
 * `activity`. Returns `undefined` when neither layer is available.
 * @public
 */
export function buildCreateItem(input: BuildCreateInput): PlannerItem | undefined {
  const layerId = input.interaction?.createDefaults?.layerId ?? input.activeLayerId;
  if (!layerId) return undefined;
  return {
    id: input.createId(),
    kind: input.interaction?.createDefaults?.kind ?? "activity",
    layerId,
    period: {
      kind: "all-day",
      startDate: input.startDate,
      endDateExclusive: input.endDateExclusive,
    },
    title: "New item",
    version: 1,
  };
}

/**
 * Default paint payload for a gesture when the host supplies none.
 * @public
 */
export function defaultPaintDefaults(interaction: InteractionConfig | undefined): PaintDefaults {
  return interaction?.paintDefaults ?? { kind: "highlight" };
}
