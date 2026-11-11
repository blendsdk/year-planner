import {
  type CommandOutcome,
  eraseItems,
  type PlannerCommand,
  type PlannerItem,
  type PlannerLayer,
  type PlannerPeriod,
  paintItems,
  validateAllDayPeriod,
  validateTimedPeriod,
} from "@blendsdk/year-planner-core";
import type { PlannerState } from "../state.js";
import type { LocalCommandResult } from "./types.js";

let fallbackCounter = 0;

/** Returns a stable new item ID from the host factory or a UUID/fallback. */
export function createPlannerId(interaction?: { createId?: () => string }): string {
  return interaction?.createId?.() ?? defaultId();
}

/** Returns a UUID when available, otherwise a monotonic fallback. */
export function defaultId(): string {
  const cryptoObject = globalThis.crypto;
  if (cryptoObject && typeof cryptoObject.randomUUID === "function") {
    return cryptoObject.randomUUID();
  }
  fallbackCounter += 1;
  return `yp-${fallbackCounter}`;
}

/** Returns the item IDs a command must lock while it is pending. */
export function commandItemIds(command: PlannerCommand): string[] {
  if (command.type === "create") return [command.item.id];
  if (command.type === "paint") return Object.keys(command.expectedVersions);
  return [command.itemId];
}

/** Returns true for a half-open all-day period. */
export function isAllDay(period: PlannerPeriod): period is PlannerPeriod & { kind: "all-day" } {
  return period.kind === "all-day";
}

/** Returns true when the period passes the core date/range validation. */
export function isValidPeriod(period: PlannerPeriod): boolean {
  if (period.kind === "all-day") return validateAllDayPeriod(period).length === 0;
  if (period.kind === "timed") return validateTimedPeriod(period).length === 0;
  return false;
}

/** Item kinds accepted by a create command. */
export const ITEM_KINDS = ["highlight", "activity", "reservation", "annotation"] as const;

/** Finds a layer in a model. */
export function layerFor(
  model: { layers: PlannerLayer[] },
  layerId: string | undefined,
): PlannerLayer | undefined {
  return layerId ? model.layers.find((layer) => layer.id === layerId) : undefined;
}

/**
 * Applies an accepted host replacement set to an item array.
 *
 * Unaffected items keep their position. Removed IDs disappear; updated items
 * replace the source at its position, and new items append.
 */
export function applyHostOutcome(items: PlannerItem[], outcome: CommandOutcome): PlannerItem[] {
  if (!outcome.accepted) return items;
  const updated = outcome.updatedItems;
  const removed = outcome.removedItemIds;
  if (!updated && !removed) return items;
  const updatedById = new Map((updated ?? []).map((item) => [item.id, item]));
  const removedIds = new Set(removed ?? []);
  const next: PlannerItem[] = [];
  for (const item of items) {
    if (removedIds.has(item.id)) continue;
    const replacement = updatedById.get(item.id);
    if (replacement) {
      next.push(replacement);
      updatedById.delete(item.id);
    } else {
      next.push(item);
    }
  }
  for (const replacement of updatedById.values()) next.push(replacement);
  return next;
}

/**
 * Applies one command to a local model without mutating the input.
 *
 * This is the single reducer used by no-host mode, accepted uncontrolled host
 * responses and the pure paint/erase path. It returns `undefined` when the
 * command cannot be applied (unknown item/layer or a failed paint).
 */
export function localCommandItems(
  state: PlannerState,
  command: PlannerCommand,
  createId: () => string,
): LocalCommandResult | undefined {
  switch (command.type) {
    case "create":
      return {
        updatedItems: [{ ...command.item, version: 1 }],
        removedItemIds: [],
      };
    case "update": {
      const source = state.model.items.find((item) => item.id === command.itemId);
      if (!source) return undefined;
      return {
        updatedItems: [{ ...source, ...command.patch, id: source.id, version: source.version + 1 }],
        removedItemIds: [],
      };
    }
    case "move":
    case "resize": {
      const source = state.model.items.find((item) => item.id === command.itemId);
      if (!source) return undefined;
      return {
        updatedItems: [{ ...source, period: command.proposedPeriod, version: source.version + 1 }],
        removedItemIds: [],
      };
    }
    case "delete":
      return { updatedItems: [], removedItemIds: [command.itemId] };
    case "paint": {
      const layer = layerFor(state.model, command.layerId);
      if (!layer || !isAllDay(command.period)) return undefined;
      const context = {
        model: state.model,
        visibility: state.visibility,
        filter: state.filter,
        activeLayerId: command.layerId,
        createId,
        expectedVersions: command.expectedVersions,
      };
      const result =
        command.operation === "union"
          ? paintItems(context, command.layerId, command.period, command.defaults)
          : eraseItems(context, command.layerId, command.period);
      if (!result.ok) return undefined;
      return { updatedItems: result.updatedItems, removedItemIds: result.removedItemIds };
    }
  }
}
