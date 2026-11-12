import type { InteractionMode, LayerPolicy, PlannerModel } from "./types.js";
import {
  getEffectiveVisibility,
  isLayerEffectivelyHidden,
  type VisibilityContext,
} from "./visibility.js";

/**
 * An edit action checked against the policy and mode.
 * @public
 */
export type EditAction = "move" | "resize" | "paint" | "create" | "delete";

/**
 * Why an action is allowed or denied.
 * @public
 */
export type EditabilityReason =
  | "editable"
  | "global-read-only"
  | "hidden"
  | "item-locked"
  | "layer-locked"
  | "policy"
  | "interaction-mode"
  | "unknown-entity";

/**
 * Result of an editability check.
 * @public
 */
export interface Editability {
  /** Whether the action is allowed. */
  editable: boolean;
  /** First denying reason, or `editable`. */
  reason: EditabilityReason;
}

/**
 * Everything needed to resolve editability.
 * @public
 */
export interface EditabilityContext extends VisibilityContext {
  /** Global read-only guardrail. */
  readOnly?: boolean;
  /** Active interaction mode; defaults to `auto`. */
  mode?: InteractionMode;
  /** Active layer that accepts create operations. */
  activeLayerId?: string;
}

/**
 * A policy with every action resolved.
 * @public
 */
export type ResolvedLayerPolicy = Required<LayerPolicy>;

const ACTIONS: Array<{
  action: keyof LayerPolicy;
  edit: Exclude<EditAction, "create" | "delete">;
}> = [
  { action: "allowMove", edit: "move" },
  { action: "allowResize", edit: "resize" },
  { action: "allowPaint", edit: "paint" },
];

function allowed(): Editability {
  return { editable: true, reason: "editable" };
}

function denied(reason: EditabilityReason): Editability {
  return { editable: false, reason };
}

function modeAllows(mode: InteractionMode | undefined, action: EditAction): boolean {
  if (mode === undefined || mode === "auto") return true;
  if (mode === "paint" || mode === "erase") return action === "paint";
  if (mode === "move") return action === "move";
  if (mode === "resize") return action === "resize";
  if (mode === "create") return action === "create";
  return false;
}

function groupChain(layerId: string, model: PlannerModel): string[] {
  const layer = model.layers.find((entry) => entry.id === layerId);
  if (!layer) return [];
  const parentOf = new Map(model.groups.map((entry) => [entry.id, entry.parentGroupId]));
  const chain: string[] = [];
  let cursor: string | undefined = layer.groupId;
  const seen = new Set<string>();
  while (cursor !== undefined && !seen.has(cursor)) {
    seen.add(cursor);
    chain.push(cursor);
    cursor = parentOf.get(cursor);
  }
  return chain.reverse();
}

/**
 * Resolves a layer's effective policy, root group to leaf group to layer.
 * @public
 */
export function getResolvedLayerPolicy(layerId: string, model: PlannerModel): ResolvedLayerPolicy {
  const resolved: ResolvedLayerPolicy = {
    allowMove: true,
    allowResize: true,
    allowPaint: true,
    allowCreate: true,
    allowDelete: true,
  };
  const groups = new Map(model.groups.map((entry) => [entry.id, entry]));
  for (const groupId of groupChain(layerId, model)) {
    const policy = groups.get(groupId)?.policy;
    if (policy) applyPolicy(resolved, policy);
  }
  const layer = model.layers.find((entry) => entry.id === layerId);
  if (layer?.policy) applyPolicy(resolved, layer.policy);
  return resolved;
}

function applyPolicy(target: ResolvedLayerPolicy, policy: LayerPolicy): void {
  for (const key of Object.keys(policy) as Array<keyof LayerPolicy>) {
    const value = policy[key];
    if (value !== undefined) target[key] = value;
  }
}

/**
 * Checks whether an item can be moved, resized or painted.
 * @public
 */
export function getItemEditability(
  itemId: string,
  action: Exclude<EditAction, "create" | "delete">,
  context: EditabilityContext,
): Editability {
  const item = context.model.items.find((entry) => entry.id === itemId);
  const layer = item ? context.model.layers.find((entry) => entry.id === item.layerId) : undefined;
  if (!item || !layer) return denied("unknown-entity");
  if (context.readOnly) return denied("global-read-only");
  if (!getEffectiveVisibility(itemId, context).visible) return denied("hidden");
  if (item.locked || item.readOnly) return denied("item-locked");
  if (layer.locked || layer.readOnly) return denied("layer-locked");
  const policy = getResolvedLayerPolicy(layer.id, context.model);
  const rule = ACTIONS.find((entry) => entry.edit === action);
  if (rule && !policy[rule.action]) return denied("policy");
  if (!modeAllows(context.mode, action)) return denied("interaction-mode");
  return allowed();
}

/**
 * Checks whether a layer can accept a new item.
 * @public
 */
export function canCreateItem(layerId: string, context: EditabilityContext): Editability {
  const layer = context.model.layers.find((entry) => entry.id === layerId);
  if (!layer) return denied("unknown-entity");
  if (context.readOnly) return denied("global-read-only");
  if (context.activeLayerId !== undefined && context.activeLayerId !== layerId) {
    return denied("policy");
  }
  if (isLayerEffectivelyHidden(layerId, context)) return denied("hidden");
  if (layer.locked || layer.readOnly) return denied("layer-locked");
  if (!getResolvedLayerPolicy(layerId, context.model).allowCreate) return denied("policy");
  if (!modeAllows(context.mode, "create")) return denied("interaction-mode");
  return allowed();
}

/**
 * Checks whether an item can be deleted.
 * @public
 */
export function canDeleteItem(itemId: string, context: EditabilityContext): Editability {
  const item = context.model.items.find((entry) => entry.id === itemId);
  const layer = item ? context.model.layers.find((entry) => entry.id === item.layerId) : undefined;
  if (!item || !layer) return denied("unknown-entity");
  if (context.readOnly) return denied("global-read-only");
  if (!getEffectiveVisibility(itemId, context).visible) return denied("hidden");
  if (item.locked || item.readOnly) return denied("item-locked");
  if (layer.locked || layer.readOnly) return denied("layer-locked");
  if (!getResolvedLayerPolicy(layer.id, context.model).allowDelete) return denied("policy");
  if (!modeAllows(context.mode, "delete")) return denied("interaction-mode");
  return allowed();
}
