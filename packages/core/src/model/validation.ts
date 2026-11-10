import { type Diagnostic, type DiagnosticCode, diagnostic } from "../diagnostics.js";
import {
  type AllDayPeriod,
  projectTimedPeriod,
  type TimedPeriod,
  validateAllDayPeriod,
  validateTimedPeriod,
} from "../period.js";
import { isPlainObject } from "./equality.js";
import type {
  Assignment,
  ItemKind,
  LayerGroup,
  LayerPolicy,
  PlannerAnnotationStyle,
  PlannerDataInput,
  PlannerDataValidation,
  PlannerItem,
  PlannerLayer,
  PlannerModel,
  RenderChannel,
  Resource,
  ValidatePlannerDataOptions,
} from "./types.js";

const RENDER_CHANNELS: RenderChannel[] = [
  "background",
  "highlight",
  "ribbon",
  "annotation",
  "foreground",
];
const ITEM_KINDS: ItemKind[] = ["highlight", "activity", "reservation", "annotation"];
const PATTERNS: NonNullable<PlannerLayer["pattern"]>[] = ["solid", "hatch", "dots"];
const POLICY_KEYS: Array<keyof LayerPolicy> = [
  "allowMove",
  "allowResize",
  "allowPaint",
  "allowCreate",
  "allowDelete",
];

/** Returns an empty, valid planner model. */
export function emptyPlannerModel(): PlannerModel {
  return { groups: [], layers: [], items: [], resources: [] };
}

/**
 * Validates host data and returns a non-blanking normalized model.
 *
 * Invalid entities are removed and reported; valid entities are preserved in
 * input order. Diagnostic messages never include item titles, periods,
 * instants, zones or assignment resource IDs.
 *
 * @param input - Raw host collections.
 * @param options - Optional display time zone for timed-period validation.
 * @returns The normalized model, diagnostics and an `ok` flag.
 *
 * @example
 * ```ts
 * const { model, ok } = validatePlannerData({ items, layers });
 * ```
 */
export function validatePlannerData(
  input: PlannerDataInput,
  options: ValidatePlannerDataOptions = {},
): PlannerDataValidation {
  const diagnostics: Diagnostic[] = [];
  const groups = validateGroups(
    collection(input.groups, "groups", "INVALID_GROUP", diagnostics),
    diagnostics,
  );
  const groupIds = new Set(groups.map((entry) => entry.id));
  const layers = validateLayers(
    collection(input.layers, "layers", "INVALID_LAYER", diagnostics),
    groupIds,
    diagnostics,
  );
  const layerById = new Map(layers.map((entry) => [entry.id, entry]));
  const resources = validateResources(
    collection(input.resources, "resources", "INVALID_RESOURCE", diagnostics),
    diagnostics,
  );
  const resourceIds = new Set(resources.map((entry) => entry.id));
  const items = validateItems(
    [
      ...collection(input.items, "items", "INVALID_ITEM", diagnostics),
      ...collection(input.annotations, "annotations", "INVALID_ANNOTATION", diagnostics),
    ],
    layerById,
    resourceIds,
    options.displayTimeZone ?? "UTC",
    diagnostics,
  );
  return {
    ok: diagnostics.every((entry) => entry.level !== "error"),
    model: { groups, layers, items, resources },
    diagnostics,
  };
}

function push(
  diagnostics: Diagnostic[],
  code: DiagnosticCode,
  message: string,
  extra: { itemIds?: string[]; resourceIds?: string[] } = {},
): void {
  const entry: Diagnostic = { ...diagnostic(code, message), ...extra };
  diagnostics.push(entry);
}

function collection<T>(
  value: T[] | undefined,
  label: string,
  code: DiagnosticCode,
  diagnostics: Diagnostic[],
): T[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    push(diagnostics, code, `${label} must be an array`);
    return [];
  }
  return value;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isRenderChannel(value: unknown): value is RenderChannel {
  return typeof value === "string" && (RENDER_CHANNELS as string[]).includes(value);
}

function isItemKind(value: unknown): value is ItemKind {
  return typeof value === "string" && (ITEM_KINDS as string[]).includes(value);
}

function isPattern(value: unknown): value is NonNullable<PlannerLayer["pattern"]> {
  return typeof value === "string" && (PATTERNS as string[]).includes(value);
}

function isPolicy(value: unknown): value is LayerPolicy {
  if (!isPlainObject(value)) return false;
  const keys = Object.keys(value);
  if (!keys.every((key) => (POLICY_KEYS as string[]).includes(key))) return false;
  return POLICY_KEYS.every((key) => value[key] === undefined || typeof value[key] === "boolean");
}

function isValidTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format(0);
    return true;
  } catch {
    return false;
  }
}

function validateGroups(input: LayerGroup[], diagnostics: Diagnostic[]): LayerGroup[] {
  const byId = new Map<string, LayerGroup>();
  for (const group of input) {
    if (!isPlainObject(group)) {
      push(diagnostics, "INVALID_GROUP", "Group must be an object");
      continue;
    }
    if (!isNonEmptyString(group.id) || !isNonEmptyString(group.name)) {
      push(diagnostics, "INVALID_GROUP", "Group requires a non-empty id and name");
      continue;
    }
    if (group.policy !== undefined && !isPolicy(group.policy)) {
      push(diagnostics, "INVALID_GROUP", `Invalid group policy: ${group.id}`);
      continue;
    }
    if (group.defaultVisible !== undefined && typeof group.defaultVisible !== "boolean") {
      push(diagnostics, "INVALID_GROUP", `Invalid group visibility: ${group.id}`);
      continue;
    }
    if (byId.has(group.id)) {
      push(diagnostics, "DUPLICATE_ID", `Duplicate group id: ${group.id}`);
      continue;
    }
    byId.set(group.id, group);
  }

  for (const [id, group] of byId) {
    if (group.parentGroupId !== undefined && !byId.has(group.parentGroupId)) {
      push(diagnostics, "UNKNOWN_REFERENCE", `Group ${id} references an unknown parent`);
      byId.delete(id);
    }
  }

  const inCycle = new Set<string>();
  const seenCycles = new Set<string>();
  for (const group of byId.values()) {
    const path: string[] = [];
    let cursor: string | undefined = group.id;
    while (cursor !== undefined && byId.has(cursor)) {
      const at = path.indexOf(cursor);
      if (at >= 0) {
        const cycle = path.slice(at).sort();
        const key = JSON.stringify(cycle);
        if (!seenCycles.has(key)) {
          seenCycles.add(key);
          for (const id of cycle) inCycle.add(id);
          push(diagnostics, "GROUP_CYCLE", `Group cycle detected: ${cycle.join(", ")}`);
        }
        break;
      }
      path.push(cursor);
      cursor = byId.get(cursor)?.parentGroupId;
    }
  }

  const valid = new Map(byId);
  for (const id of inCycle) valid.delete(id);
  let changed = true;
  while (changed) {
    changed = false;
    for (const [id, group] of valid) {
      if (group.parentGroupId !== undefined && !valid.has(group.parentGroupId)) {
        valid.delete(id);
        changed = true;
      }
    }
  }
  return [...valid.values()];
}

function validateLayers(
  input: PlannerLayer[],
  groupIds: ReadonlySet<string>,
  diagnostics: Diagnostic[],
): PlannerLayer[] {
  const byId = new Map<string, PlannerLayer>();
  for (const layer of input) {
    if (!isPlainObject(layer)) {
      push(diagnostics, "INVALID_LAYER", "Layer must be an object");
      continue;
    }
    if (!isNonEmptyString(layer.id) || !isNonEmptyString(layer.name)) {
      push(diagnostics, "INVALID_LAYER", "Layer requires a non-empty id and name");
      continue;
    }
    if (byId.has(layer.id)) {
      push(diagnostics, "DUPLICATE_ID", `Duplicate layer id: ${layer.id}`);
      continue;
    }
    if (!isRenderChannel(layer.channel) || !isNonEmptyString(layer.color)) {
      push(diagnostics, "INVALID_LAYER", `Invalid layer channel or color: ${layer.id}`);
      continue;
    }
    if (
      layer.opacity !== undefined &&
      (!isFiniteNumber(layer.opacity) || layer.opacity < 0 || layer.opacity > 1)
    ) {
      push(diagnostics, "INVALID_LAYER", `Invalid layer opacity: ${layer.id}`);
      continue;
    }
    if (layer.pattern !== undefined && !isPattern(layer.pattern)) {
      push(diagnostics, "INVALID_LAYER", `Invalid layer pattern: ${layer.id}`);
      continue;
    }
    if (layer.policy !== undefined && !isPolicy(layer.policy)) {
      push(diagnostics, "INVALID_LAYER", `Invalid layer policy: ${layer.id}`);
      continue;
    }
    if (
      (layer.sortOrder !== undefined && !isFiniteNumber(layer.sortOrder)) ||
      (layer.displayPriority !== undefined && !isFiniteNumber(layer.displayPriority))
    ) {
      push(diagnostics, "INVALID_LAYER", `Invalid layer order value: ${layer.id}`);
      continue;
    }
    if (layer.groupId !== undefined && !groupIds.has(layer.groupId)) {
      push(diagnostics, "UNKNOWN_REFERENCE", `Layer ${layer.id} references an unknown group`);
      continue;
    }
    byId.set(layer.id, layer);
  }
  return [...byId.values()];
}

function validateResources(input: Resource[], diagnostics: Diagnostic[]): Resource[] {
  const byId = new Map<string, Resource>();
  for (const resource of input) {
    if (!isPlainObject(resource)) {
      push(diagnostics, "INVALID_RESOURCE", "Resource must be an object");
      continue;
    }
    if (
      !isNonEmptyString(resource.id) ||
      !isNonEmptyString(resource.name) ||
      !isNonEmptyString(resource.type)
    ) {
      push(diagnostics, "INVALID_RESOURCE", "Resource requires a non-empty id, name and type");
      continue;
    }
    if (byId.has(resource.id)) {
      push(diagnostics, "DUPLICATE_ID", `Duplicate resource id: ${resource.id}`);
      continue;
    }
    if (resource.capacity !== undefined && !isPlainObject(resource.capacity)) {
      push(diagnostics, "INVALID_RESOURCE", `Invalid resource capacity: ${resource.id}`);
      continue;
    }
    if (
      resource.capacity !== undefined &&
      (!isFiniteNumber(resource.capacity.quantity) ||
        resource.capacity.quantity <= 0 ||
        !isNonEmptyString(resource.capacity.unit))
    ) {
      push(diagnostics, "INVALID_RESOURCE", `Invalid resource capacity: ${resource.id}`);
      continue;
    }
    if (resource.timeZone !== undefined && !isValidTimeZone(resource.timeZone)) {
      push(diagnostics, "INVALID_TIMEZONE", `Invalid resource time zone: ${resource.id}`, {
        resourceIds: [resource.id],
      });
      continue;
    }
    byId.set(resource.id, resource);
  }
  return [...byId.values()];
}

function validateItems(
  input: PlannerItem[],
  layerById: ReadonlyMap<string, PlannerLayer>,
  resourceIds: ReadonlySet<string>,
  displayTimeZone: string,
  diagnostics: Diagnostic[],
): PlannerItem[] {
  const byId = new Map<string, PlannerItem>();
  for (const item of input) {
    if (!isPlainObject(item)) {
      push(diagnostics, "INVALID_ITEM", "Item must be an object");
      continue;
    }
    if (!isNonEmptyString(item.id) || !isItemKind(item.kind) || !isNonEmptyString(item.layerId)) {
      push(diagnostics, "INVALID_ITEM", "Item requires a non-empty id, kind and layerId");
      continue;
    }
    if (byId.has(item.id)) {
      push(diagnostics, "DUPLICATE_ID", `Duplicate item id: ${item.id}`);
      continue;
    }
    if (!Number.isInteger(item.version) || item.version < 1) {
      push(diagnostics, "INVALID_VERSION", `Invalid item version: ${item.id}`, {
        itemIds: [item.id],
      });
      continue;
    }
    if (
      (["title", "color", "textColor", "className", "status"] as const).some(
        (key) => item[key] !== undefined && typeof item[key] !== "string",
      )
    ) {
      push(diagnostics, "INVALID_ITEM", `Invalid item field: ${item.id}`, {
        itemIds: [item.id],
      });
      continue;
    }
    if (
      (item.locked !== undefined && typeof item.locked !== "boolean") ||
      (item.readOnly !== undefined && typeof item.readOnly !== "boolean")
    ) {
      push(diagnostics, "INVALID_ITEM", `Invalid item flag: ${item.id}`, {
        itemIds: [item.id],
      });
      continue;
    }
    const layer = layerById.get(item.layerId);
    if (!layer) {
      push(diagnostics, "UNKNOWN_REFERENCE", `Item ${item.id} references an unknown layer`, {
        itemIds: [item.id],
      });
      continue;
    }
    if (item.kind === "annotation" && layer.channel !== "annotation") {
      push(
        diagnostics,
        "INVALID_ANNOTATION",
        `Annotation item ${item.id} needs an annotation layer`,
        {
          itemIds: [item.id],
        },
      );
      continue;
    }
    if (item.kind !== "annotation" && layer.channel === "annotation") {
      push(diagnostics, "INVALID_ANNOTATION", `Item ${item.id} cannot use an annotation layer`, {
        itemIds: [item.id],
      });
      continue;
    }
    const periodDiagnostic = validateItemPeriod(item, displayTimeZone);
    if (periodDiagnostic) {
      diagnostics.push(periodDiagnostic);
      continue;
    }
    if (item.style !== undefined && !isStyle(item.style)) {
      push(diagnostics, "INVALID_STYLE", `Invalid style for item ${item.id}`, {
        itemIds: [item.id],
      });
      continue;
    }
    if (!areAssignmentsWellFormed(item.assignments)) {
      push(diagnostics, "INVALID_ITEM", `Invalid assignments for item ${item.id}`, {
        itemIds: [item.id],
      });
      continue;
    }
    if (hasUnknownResource(item.assignments, resourceIds)) {
      push(diagnostics, "UNKNOWN_REFERENCE", `Item ${item.id} references an unknown resource`, {
        itemIds: [item.id],
      });
      continue;
    }
    if (item.annotation !== undefined && !isAnnotationStyle(item.annotation)) {
      push(diagnostics, "INVALID_ITEM", `Invalid annotation style for item ${item.id}`, {
        itemIds: [item.id],
      });
      continue;
    }
    byId.set(item.id, item);
  }
  return [...byId.values()];
}

function validateItemPeriod(item: PlannerItem, displayTimeZone: string): Diagnostic | undefined {
  const period = item.period;
  if (!isPlainObject(period)) {
    return withItem("INVALID_ITEM", `Invalid period for item ${item.id}`, item.id);
  }
  let diagnostics: Diagnostic[] = [];
  if (period.kind === "all-day") {
    if (!isAllDayShape(period)) {
      return withItem("INVALID_ITEM", `Invalid period for item ${item.id}`, item.id);
    }
    diagnostics = validateAllDayPeriod(period);
  } else if (period.kind === "timed") {
    if (!isTimedShape(period)) {
      return withItem("INVALID_ITEM", `Invalid period for item ${item.id}`, item.id);
    }
    diagnostics = validateTimedPeriod(period);
    if (diagnostics.length === 0) {
      try {
        projectTimedPeriod(period, displayTimeZone);
      } catch {
        return withItem("TIMED_PROJECTION_FAILED", `Invalid period for item ${item.id}`, item.id);
      }
    }
  } else {
    return withItem("INVALID_ITEM", `Invalid period for item ${item.id}`, item.id);
  }
  const first = diagnostics[0];
  if (!first) return undefined;
  return withItem(first.code, `Invalid period for item ${item.id}`, item.id);
}

function withItem(code: DiagnosticCode, message: string, itemId: string): Diagnostic {
  return { ...diagnostic(code, message), itemIds: [itemId] };
}

function isAllDayShape(value: unknown): value is AllDayPeriod {
  return (
    isPlainObject(value) &&
    value.kind === "all-day" &&
    typeof value.startDate === "string" &&
    typeof value.endDateExclusive === "string"
  );
}

function isTimedShape(value: unknown): value is TimedPeriod {
  return (
    isPlainObject(value) &&
    value.kind === "timed" &&
    typeof value.start === "string" &&
    typeof value.endExclusive === "string" &&
    typeof value.timeZone === "string"
  );
}

function isStyle(value: unknown): value is Record<string, string | number> {
  if (!isPlainObject(value)) return false;
  return Object.values(value).every(
    (entry) => typeof entry === "string" || (typeof entry === "number" && Number.isFinite(entry)),
  );
}

function isAnnotationStyle(value: unknown): value is PlannerAnnotationStyle {
  if (!isPlainObject(value)) return false;
  if (value.label !== undefined && !isNonEmptyString(value.label)) return false;
  if (value.background !== undefined && !isNonEmptyString(value.background)) return false;
  if (value.priority !== undefined && !isFiniteNumber(value.priority)) return false;
  return true;
}

function areAssignmentsWellFormed(assignments: Assignment[] | undefined): boolean {
  if (assignments === undefined) return true;
  if (!Array.isArray(assignments)) return false;
  return assignments.every(
    (assignment) =>
      isPlainObject(assignment) &&
      isNonEmptyString(assignment.resourceId) &&
      (assignment.role === undefined || isNonEmptyString(assignment.role)) &&
      (assignment.quantity === undefined ||
        (isFiniteNumber(assignment.quantity) && assignment.quantity > 0)),
  );
}

function hasUnknownResource(
  assignments: Assignment[] | undefined,
  resourceIds: ReadonlySet<string>,
): boolean {
  if (assignments === undefined) return false;
  return assignments.some((assignment) => !resourceIds.has(assignment.resourceId));
}
