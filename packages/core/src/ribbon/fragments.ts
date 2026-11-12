import { addDays, diffDays } from "../date.js";
import { dateToColumn, type MonthRowLayout, type YearLayout } from "../layout/classic-year.js";
import type { PlannerItem, PlannerLayer } from "../model/types.js";
import { serializeVisibility, type VisibilityContext, visibleItems } from "../model/visibility.js";
import type { AllDayPeriod, PlannerPeriod } from "../period.js";
import { projectTimedPeriod } from "../period.js";
import { assignLanes } from "./lanes.js";
import type {
  LaneCandidate,
  RibbonFragment,
  RibbonLayout,
  RibbonOptions,
  RibbonOverflowEntry,
  RibbonRow,
} from "./types.js";

const DEFAULTS = {
  density: "compact" as const,
  compactMaxLanes: 3,
  laneHeight: 18,
  laneTop: 18,
  displayTimeZone: "UTC",
};

function projectPeriod(period: PlannerPeriod, displayTimeZone: string): AllDayPeriod | undefined {
  if (period.kind === "all-day") return period;
  try {
    return projectTimedPeriod(period, displayTimeZone);
  } catch {
    return undefined;
  }
}

function filterKey(context: VisibilityContext): string {
  const filter = context.filter ?? {};
  return JSON.stringify({
    layerIds: [...(filter.layerIds ?? [])].sort(),
    resourceIds: [...(filter.resourceIds ?? [])].sort(),
    statuses: [...(filter.statuses ?? [])].sort(),
    search: filter.search?.trim().toLowerCase() ?? "",
  });
}

function periodKey(period: PlannerPeriod): string {
  return period.kind === "all-day"
    ? `d:${period.startDate}:${period.endDateExclusive}`
    : `t:${period.start}:${period.endExclusive}:${period.timeZone}`;
}

function buildSignature(
  layout: YearLayout,
  context: VisibilityContext,
  options: Required<
    Pick<
      RibbonOptions,
      "density" | "compactMaxLanes" | "laneHeight" | "laneTop" | "displayTimeZone"
    >
  >,
  items: PlannerItem[],
  fragments: RibbonFragment[],
): string {
  return JSON.stringify({
    layout: layout.signature,
    visibility: serializeVisibility(context.visibility),
    filter: filterKey(context),
    options,
    items: items
      .map((item) => `${item.id}:${item.version}:${item.layerId}:${periodKey(item.period)}`)
      .sort(),
    fragments: fragments
      .map(
        (fragment) =>
          `${fragment.fragmentId}:${fragment.clippedStart}:${fragment.clippedEndExclusive}:${fragment.startColumn}:${fragment.endColumnExclusive}:${fragment.lane}:${fragment.channel}:${fragment.x}:${fragment.width}:${fragment.y}:${fragment.height}`,
      )
      .sort(),
  });
}

function overflowEntries(
  rowFragments: RibbonFragment[],
  itemsById: ReadonlyMap<string, PlannerItem>,
  compactMaxLanes: number,
  density: RibbonLayout["density"],
): RibbonOverflowEntry[] {
  if (density === "expanded") return [];
  const entries: RibbonOverflowEntry[] = [];
  const seen = new Set<string>();
  for (const fragment of rowFragments) {
    if (fragment.channel !== "ribbon" || fragment.lane < compactMaxLanes) continue;
    if (seen.has(fragment.itemId)) continue;
    seen.add(fragment.itemId);
    const item = itemsById.get(fragment.itemId);
    if (!item) continue;
    entries.push({
      itemId: item.id,
      ...(item.title === undefined ? {} : { title: item.title }),
      period: item.period,
    });
  }
  return entries;
}

function sourceDays(period: AllDayPeriod): number {
  return diffDays(period.startDate, period.endDateExclusive);
}

/**
 * Projects every effectively visible item into clipped month-row fragments,
 * assigns deterministic lanes and computes compact overflow.
 *
 * @param layout - Classic year layout from the temporal core.
 * @param context - Model, visibility and optional filter.
 * @param options - Density, lane sizes and display time zone.
 * @returns Rows, fragments, overflow and a deterministic signature.
 *
 * @example
 * ```ts
 * const ribbons = buildRibbonLayout(layout, { model, visibility });
 * ```
 * @public
 */
export function buildRibbonLayout(
  layout: YearLayout,
  context: VisibilityContext,
  options: RibbonOptions = {},
): RibbonLayout {
  const density = options.density ?? DEFAULTS.density;
  const compactMaxLanes = options.compactMaxLanes ?? DEFAULTS.compactMaxLanes;
  const laneHeight = options.laneHeight ?? DEFAULTS.laneHeight;
  const laneTop = options.laneTop ?? DEFAULTS.laneTop;
  const displayTimeZone = options.displayTimeZone ?? DEFAULTS.displayTimeZone;
  if (!Number.isInteger(compactMaxLanes) || compactMaxLanes < 1) {
    throw new RangeError(`compactMaxLanes must be a positive integer: ${compactMaxLanes}`);
  }
  if (!Number.isFinite(laneHeight) || laneHeight <= 0) {
    throw new RangeError(`laneHeight must be positive: ${laneHeight}`);
  }
  if (!Number.isFinite(laneTop) || laneTop < 0) {
    throw new RangeError(`laneTop must be non-negative: ${laneTop}`);
  }
  if (density !== "compact" && density !== "expanded") {
    throw new RangeError(`density must be compact or expanded: ${String(density)}`);
  }
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: displayTimeZone }).format(0);
  } catch {
    throw new RangeError(`Invalid displayTimeZone: ${displayTimeZone}`);
  }
  const layerById = new Map(context.model.layers.map((entry) => [entry.id, entry]));
  const itemsById = new Map(context.model.items.map((entry) => [entry.id, entry]));
  const items = visibleItems(context);
  const rows: RibbonRow[] = [];
  const allFragments: RibbonFragment[] = [];
  let top = 0;
  let previousLanes: ReadonlyMap<string, number> = new Map();

  for (const row of layout.rows) {
    const rowFragments = buildRowFragments(row, items, layerById, displayTimeZone);
    const candidates: LaneCandidate[] = [];
    for (const fragment of rowFragments) {
      if (fragment.channel !== "ribbon") continue;
      const item = itemsById.get(fragment.itemId);
      const layer = layerById.get(item?.layerId ?? "");
      if (!item || !layer) continue;
      const projected = projectPeriod(item.period, displayTimeZone);
      if (!projected) continue;
      candidates.push({
        fragment,
        item,
        sortOrder: layer.sortOrder ?? 0,
        displayPriority: layer.displayPriority ?? 0,
        sourceDays: sourceDays(projected),
      });
    }
    const lanes = assignLanes(candidates, previousLanes);
    for (const fragment of rowFragments) {
      const lane = lanes.get(fragment.fragmentId);
      if (lane === undefined) continue;
      fragment.lane = lane;
      fragment.y = laneTop + lane * laneHeight;
      fragment.height = laneHeight;
    }
    const laneCount = rowFragments.reduce(
      (max, fragment) => (fragment.channel === "ribbon" ? Math.max(max, fragment.lane + 1) : max),
      0,
    );
    const visibleLaneCount =
      density === "expanded" ? laneCount : Math.min(laneCount, compactMaxLanes);
    const height = Math.max(layout.rowHeight, visibleLaneCount * laneHeight + laneTop);
    for (const fragment of rowFragments) {
      if (fragment.channel === "ribbon" || fragment.channel === "annotation") continue;
      fragment.height = height;
    }
    const overflow = overflowEntries(rowFragments, itemsById, compactMaxLanes, density);
    const rowIndex = row.rowIndex;
    rows.push({
      rowId: row.rowId,
      rowIndex,
      top,
      height,
      laneCount,
      visibleLaneCount,
      overflowCount:
        density === "expanded"
          ? 0
          : rowFragments.filter(
              (fragment) => fragment.channel === "ribbon" && fragment.lane >= compactMaxLanes,
            ).length,
      overflow,
      fragments: rowFragments,
    });
    allFragments.push(...rowFragments);
    previousLanes = new Map(
      rowFragments
        .filter((fragment) => fragment.channel === "ribbon")
        .map((fragment) => [fragment.itemId, fragment.lane]),
    );
    top += height;
  }

  const resolvedOptions = {
    density,
    compactMaxLanes,
    laneHeight,
    laneTop,
    displayTimeZone,
  };
  return {
    rows,
    fragments: allFragments,
    density,
    compactMaxLanes,
    laneHeight,
    laneTop,
    headerHeight: layout.headerHeight,
    footerHeight: layout.footerHeight,
    monthBandWidth: layout.monthBandWidth,
    totalDayWidth: layout.totalDayWidth,
    totalWidth: 2 * layout.monthBandWidth + layout.totalDayWidth,
    height: top,
    signature: buildSignature(layout, context, resolvedOptions, items, allFragments),
  };
}

function buildRowFragments(
  row: MonthRowLayout,
  items: PlannerItem[],
  layerById: ReadonlyMap<string, PlannerLayer>,
  displayTimeZone: string,
): RibbonFragment[] {
  const fragments: RibbonFragment[] = [];
  for (const item of items) {
    const layer = layerById.get(item.layerId);
    if (!layer) continue;
    const projected = projectPeriod(item.period, displayTimeZone);
    if (!projected) continue;
    const start = projected.startDate > row.firstDate ? projected.startDate : row.firstDate;
    const end =
      projected.endDateExclusive < row.endDateExclusive
        ? projected.endDateExclusive
        : row.endDateExclusive;
    if (start >= end) continue;
    const startColumn = dateToColumn(row, start);
    const endColumnExclusive = dateToColumn(row, addDays(end, -1)) + 1;
    const x = row.prefixWidths[startColumn];
    const endX = row.prefixWidths[endColumnExclusive];
    if (x === undefined || endX === undefined) continue;
    const width = endX - x;
    const fragment: RibbonFragment = {
      fragmentId: `${row.rowId}:${item.id}:${startColumn}`,
      itemId: item.id,
      rowId: row.rowId,
      rowIndex: row.rowIndex,
      sourcePeriod: item.period,
      clippedStart: start,
      clippedEndExclusive: end,
      startColumn,
      endColumnExclusive,
      x,
      width,
      lane: 0,
      y: 0,
      height: layer.channel === "annotation" ? 14 : row.height,
      isStartClipped: start !== projected.startDate,
      isEndClipped: end !== projected.endDateExclusive,
      channel: layer.channel,
    };
    fragments.push(fragment);
  }
  return fragments;
}
