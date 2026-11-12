import { type Diagnostic, diagnostic } from "../diagnostics.js";
import { type DateInterval, normalize, subtract } from "../interval.js";
import { type AllDayPeriod, validateAllDayPeriod } from "../period.js";
import { type EditabilityContext, getResolvedLayerPolicy } from "./editability.js";
import { structuralEqual } from "./equality.js";
import type { PlannerAnnotationStyle, PlannerItem, PlannerLayer } from "./types.js";
import { getEffectiveVisibility, isLayerEffectivelyHidden } from "./visibility.js";

/**
 * Defaults used when paint creates or merges a highlight.
 * @public
 */
export interface PaintDefaults {
  /** Paint always creates highlight items. */
  kind: "highlight";
  /** Optional item title. */
  title?: string;
  /** Optional item color. */
  color?: string;
  /** Optional text color. */
  textColor?: string;
  /** Optional host class name. */
  className?: string;
  /** Optional flat style values. */
  style?: Record<string, string | number>;
  /** Optional status. */
  status?: string;
  /** Optional host metadata. */
  metadata?: unknown;
  /** Optional annotation badge data. */
  annotation?: PlannerAnnotationStyle;
}

/**
 * Everything needed to run a paint or erase operation.
 * @public
 */
export interface PaintContext extends EditabilityContext {
  /** Layer that accepts the paint or erase. */
  activeLayerId: string;
  /** Factory for new item identities; must never return a used ID. */
  createId: () => string;
  /** Optional optimistic-concurrency versions for affected items. */
  expectedVersions?: Record<string, number>;
}

/**
 * Result of a paint or erase operation.
 * @public
 */
export interface PaintResult {
  /** True when the operation was applied. */
  ok: boolean;
  /** New items plus affected non-matching items returned unchanged. */
  updatedItems: PlannerItem[];
  /** Source IDs removed by the operation. */
  removedItemIds: string[];
  /** Failure diagnostics; empty on success. */
  diagnostics: Diagnostic[];
}

const PAINT_CHANNELS: PlannerLayer["channel"][] = ["background", "highlight"];
const COMPARED_ATTRIBUTES = [
  "title",
  "kind",
  "status",
  "metadata",
  "style",
  "assignments",
  "annotation",
  "color",
  "textColor",
  "className",
] as const;

function failed(diagnostics: Diagnostic[]): PaintResult {
  return { ok: false, updatedItems: [], removedItemIds: [], diagnostics };
}

function guard(
  layer: PlannerLayer | undefined,
  layerId: string,
  context: PaintContext,
  diagnostics: Diagnostic[],
): boolean {
  if (layerId !== context.activeLayerId) {
    diagnostics.push(diagnostic("INVALID_PAINT_TARGET", "Paint target is not the active layer"));
    return false;
  }
  if (!layer) {
    diagnostics.push(diagnostic("UNKNOWN_REFERENCE", "Paint target does not exist"));
    return false;
  }
  if (!PAINT_CHANNELS.includes(layer.channel)) {
    diagnostics.push(diagnostic("INVALID_PAINT_CHANNEL", "Layer does not accept highlights"));
    return false;
  }
  if (context.readOnly) {
    diagnostics.push(diagnostic("NOT_EDITABLE", "The planner is read-only"));
    return false;
  }
  if (isLayerEffectivelyHidden(layerId, context)) {
    diagnostics.push(diagnostic("NOT_EDITABLE", "The paint layer is hidden"));
    return false;
  }
  if (layer.locked || layer.readOnly) {
    diagnostics.push(diagnostic("NOT_EDITABLE", "The paint layer is locked"));
    return false;
  }
  if (!getResolvedLayerPolicy(layerId, context.model).allowPaint) {
    diagnostics.push(diagnostic("NOT_EDITABLE", "The paint layer policy denies paint"));
    return false;
  }
  if (!modeAllowsPaint(context)) {
    diagnostics.push(diagnostic("NOT_EDITABLE", "The interaction mode does not allow paint"));
    return false;
  }
  return true;
}

function modeAllowsPaint(context: PaintContext): boolean {
  const mode = context.mode;
  return mode === undefined || mode === "auto" || mode === "paint" || mode === "erase";
}

function intersects(item: PlannerItem, range: AllDayPeriod): boolean {
  if (item.period.kind !== "all-day") return false;
  return (
    item.period.startDate < range.endDateExclusive && range.startDate < item.period.endDateExclusive
  );
}

function affectedItems(context: PaintContext, layerId: string, range: AllDayPeriod): PlannerItem[] {
  return context.model.items.filter((item) => {
    if (item.layerId !== layerId || item.kind !== "highlight" || item.period.kind !== "all-day") {
      return false;
    }
    if (!intersects(item, range)) return false;
    if (item.locked || item.readOnly) return false;
    return getEffectiveVisibility(item.id, context).visible;
  });
}

function matchesDefaults(item: PlannerItem, defaults: PaintDefaults): boolean {
  const record: Record<string, unknown> = { ...defaults };
  return COMPARED_ATTRIBUTES.every((key) => structuralEqual(item[key], record[key]));
}

function newHighlight(
  id: string,
  layerId: string,
  period: AllDayPeriod,
  defaults: PaintDefaults,
): PlannerItem {
  const item: PlannerItem = { id, kind: "highlight", layerId, period, version: 1 };
  if (defaults.title !== undefined) item.title = defaults.title;
  if (defaults.color !== undefined) item.color = defaults.color;
  if (defaults.textColor !== undefined) item.textColor = defaults.textColor;
  if (defaults.className !== undefined) item.className = defaults.className;
  if (defaults.style !== undefined) item.style = defaults.style;
  if (defaults.status !== undefined) item.status = defaults.status;
  if (defaults.metadata !== undefined) item.metadata = defaults.metadata;
  if (defaults.annotation !== undefined) item.annotation = defaults.annotation;
  return item;
}

function residualItem(item: PlannerItem, id: string, interval: DateInterval): PlannerItem {
  const {
    id: _id,
    period: _period,
    version: _version,
    locked: _locked,
    readOnly: _readOnly,
    ...rest
  } = item;
  return {
    ...rest,
    id,
    period: { kind: "all-day", ...interval },
    version: 1,
  };
}

function staleVersion(
  affected: PlannerItem[],
  expected: Record<string, number> | undefined,
  diagnostics: Diagnostic[],
): boolean {
  if (!expected) return false;
  for (const item of affected) {
    const version = expected[item.id];
    if (version !== undefined && version !== item.version) {
      diagnostics.push({
        ...diagnostic("STALE_VERSION", `Item ${item.id} changed since the command was created`),
        itemIds: [item.id],
      });
      return true;
    }
  }
  return false;
}

function prepare(
  context: PaintContext,
  layerId: string,
  range: AllDayPeriod,
): { ok: true; affected: PlannerItem[] } | { ok: false; result: PaintResult } {
  const diagnostics: Diagnostic[] = [];
  const layer = context.model.layers.find((entry) => entry.id === layerId);
  if (!guard(layer, layerId, context, diagnostics))
    return { ok: false, result: failed(diagnostics) };
  const rangeDiagnostics = validateAllDayPeriod(range);
  if (rangeDiagnostics.length > 0) return { ok: false, result: failed(rangeDiagnostics) };
  const affected = affectedItems(context, layerId, range);
  if (staleVersion(affected, context.expectedVersions, diagnostics)) {
    return { ok: false, result: failed(diagnostics) };
  }
  return { ok: true, affected };
}

/**
 * Applies a paint-union operation over an all-day range.
 * @public
 */
export function paintItems(
  context: PaintContext,
  layerId: string,
  period: AllDayPeriod,
  defaults: PaintDefaults,
): PaintResult {
  const prepared = prepare(context, layerId, period);
  if (!prepared.ok) return prepared.result;
  const effective: PaintDefaults = { ...defaults, kind: "highlight" };
  const matching = prepared.affected.filter((item) => matchesDefaults(item, effective));
  const intervals = normalize([period, ...matching.map((item) => item.period as AllDayPeriod)]);
  const created = intervals.map((interval) =>
    newHighlight(context.createId(), layerId, { kind: "all-day", ...interval }, effective),
  );
  const nonMatching = prepared.affected.filter((item) => !matching.includes(item));
  return {
    ok: true,
    updatedItems: [...created, ...nonMatching],
    removedItemIds: matching.map((item) => item.id),
    diagnostics: [],
  };
}

/**
 * Applies an erase operation over an all-day range.
 * @public
 */
export function eraseItems(
  context: PaintContext,
  layerId: string,
  period: AllDayPeriod,
): PaintResult {
  const prepared = prepare(context, layerId, period);
  if (!prepared.ok) return prepared.result;
  const updatedItems: PlannerItem[] = [];
  const removedItemIds: string[] = [];
  for (const item of prepared.affected) {
    if (item.period.kind !== "all-day") continue;
    const residuals = subtract(item.period, period);
    removedItemIds.push(item.id);
    for (const residual of residuals) {
      updatedItems.push(residualItem(item, context.createId(), residual));
    }
  }
  return { ok: true, updatedItems, removedItemIds, diagnostics: [] };
}
