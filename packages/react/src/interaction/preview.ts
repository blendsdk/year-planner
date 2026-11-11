import type {
  DateKey,
  MonthRowLayout,
  PlannerPeriod,
  SelectionDateRange,
  YearLayout,
} from "@blendsdk/year-planner-core";
import type { GestureCompletion } from "./gesture.js";
import { rangeBetween } from "./selection.js";

/** One preview rectangle clipped to one month row. */
export interface PreviewFragment {
  /** Stable preview identity. */
  key: string;
  /** Month row that contains the fragment. */
  rowId: string;
  /** First previewed date. */
  startDate: DateKey;
  /** First date after the previewed range. */
  endDateExclusive: DateKey;
  /** Day-plane x position in design units. */
  x: number;
  /** Fragment width in design units. */
  width: number;
}

/**
 * Projects date ranges into zoom-scaled row fragments.
 *
 * Blank slots are never included; the x/width use the same prefix widths as
 * ribbon fragments so previews align with the grid.
 */
export function projectPreviewRangesForRow(
  ranges: readonly SelectionDateRange[],
  row: MonthRowLayout,
  zoom: number,
): PreviewFragment[] {
  const fragments: PreviewFragment[] = [];
  for (const range of ranges) {
    {
      let startDate = range.startDate;
      if (row.firstDate > startDate) startDate = row.firstDate;
      let endDateExclusive = range.endDateExclusive;
      if (row.endDateExclusive < endDateExclusive) endDateExclusive = row.endDateExclusive;
      if (startDate >= endDateExclusive) continue;
      const startIndex = row.columns.findIndex((column) => column.date === startDate);
      if (startIndex === -1) continue;
      let lastDefined = -1;
      for (let index = row.columns.length - 1; index >= 0; index -= 1) {
        if (row.columns[index]?.date !== undefined) {
          lastDefined = index;
          break;
        }
      }
      if (lastDefined === -1) continue;
      const endIndex = row.columns.findIndex(
        (column) => column.date !== undefined && column.date >= endDateExclusive,
      );
      const end = endIndex === -1 ? lastDefined + 1 : Math.min(endIndex, lastDefined + 1);
      const x = row.prefixWidths[startIndex];
      const endX = row.prefixWidths[end];
      if (x === undefined || endX === undefined) continue;
      const width = endX - x;
      if (width <= 0) continue;
      fragments.push({
        key: `${row.rowId}:${startDate}:${endDateExclusive}`,
        rowId: row.rowId,
        startDate,
        endDateExclusive,
        x: x * zoom,
        width: width * zoom,
      });
    }
  }
  return fragments;
}

/** Projects ranges across every row of a layout. */
export function projectPreviewRanges(
  ranges: readonly SelectionDateRange[],
  layout: YearLayout,
  zoom: number,
): PreviewFragment[] {
  return layout.rows.flatMap((row) => projectPreviewRangesForRow(ranges, row, zoom));
}

/** A preview of a selection, marquee, item or range gesture. */
export type GesturePreview =
  | { kind: "selection"; ranges: SelectionDateRange[] }
  | {
      kind: "marquee";
      rect: { left: number; top: number; width: number; height: number };
    }
  | {
      kind: "item";
      variant: "move" | "resize";
      itemId: string;
      layerId: string | undefined;
      ranges: SelectionDateRange[];
      valid: boolean;
    }
  | {
      kind: "range";
      variant: "paint" | "erase" | "create";
      layerId: string | undefined;
      ranges: SelectionDateRange[];
      valid: boolean;
    };

function rangeKey(ranges: readonly SelectionDateRange[]): string {
  return ranges.map((range) => `${range.startDate}>${range.endDateExclusive}`).join("|");
}

/** Returns a stable key for a preview layer. */
export function previewKey(preview: GesturePreview): string {
  if (preview.kind === "selection") return `selection:${rangeKey(preview.ranges)}`;
  if (preview.kind === "marquee") {
    const { left, top, width, height } = preview.rect;
    return `marquee:${left}:${top}:${width}:${height}`;
  }
  if (preview.kind === "item") {
    return `item:${preview.variant}:${preview.itemId}:${rangeKey(preview.ranges)}`;
  }
  return `range:${preview.variant}:${preview.layerId ?? ""}:${rangeKey(preview.ranges)}`;
}

/** Returns the validity flag for preview kinds that carry one. */
function previewValidity(preview: GesturePreview): boolean | undefined {
  return preview.kind === "item" || preview.kind === "range" ? preview.valid : undefined;
}

/**
 * Returns true when two preview lists render the same content.
 *
 * Gesture previews are rebuilt on every pointer frame, so reference equality
 * would defeat row memoization. The key already encodes the ranges and item
 * identity; validity and kind complete the render-relevant content.
 */
export function samePreviewEntries(
  previous: readonly PreviewLayer[],
  next: readonly PreviewLayer[],
): boolean {
  if (previous === next) return true;
  if (previous.length !== next.length) return false;
  return previous.every((entry, index) => {
    const other = next[index];
    if (!other || entry.key !== other.key) return false;
    if (entry.preview.kind !== other.preview.kind) return false;
    if (previewKey(entry.preview) !== previewKey(other.preview)) return false;
    return previewValidity(entry.preview) === previewValidity(other.preview);
  });
}

/**
 * Returns true when a preview can paint on the given month row.
 *
 * Marquee previews are viewport rectangles and are rendered once by the grid,
 * so they never belong to a row. Selection, item and range previews intersect
 * a row when any of their ranges overlaps the row's date span.
 */
export function previewIntersectsRow(preview: GesturePreview, row: MonthRowLayout): boolean {
  if (preview.kind === "marquee") return false;
  return preview.ranges.some(
    (range) => range.startDate < row.endDateExclusive && range.endDateExclusive > row.firstDate,
  );
}

/** Narrows a preview list to the entries that can paint on one row. */
export function previewsForRow(
  previews: readonly PreviewLayer[],
  row: MonthRowLayout,
): readonly PreviewLayer[] {
  return previews.filter((entry) => previewIntersectsRow(entry.preview, row));
}

/** A preview plus its stable render identity. */
export interface PreviewLayer {
  /** Unique key for the preview layer. */
  key: string;
  /** Preview content. */
  preview: GesturePreview;
}

function periodRange(period: PlannerPeriod): SelectionDateRange[] {
  return period.kind === "all-day"
    ? [{ startDate: period.startDate, endDateExclusive: period.endDateExclusive }]
    : [];
}

/**
 * Maps a completed gesture intent to a renderable preview.
 *
 * Invalid completions render a red, non-committing preview when they carry a
 * proposed range; the diagnostic is emitted on commit and the original item
 * stays visible.
 */
export function previewFromCompletion(
  completion: GestureCompletion,
  layerId: string | undefined,
  isDisabled?: (date: DateKey) => boolean,
): GesturePreview | undefined {
  switch (completion.kind) {
    case "select":
      return {
        kind: "selection",
        ranges: rangeBetween(completion.anchor, completion.focus, isDisabled),
      };
    case "marquee":
      return { kind: "marquee", rect: completion.rect };
    case "move":
    case "resize":
      return {
        kind: "item",
        variant: completion.kind,
        itemId: completion.itemId,
        layerId,
        ranges: periodRange(completion.proposedPeriod),
        valid: true,
      };
    case "paint":
      return {
        kind: "range",
        variant: completion.operation === "subtract" ? "erase" : "paint",
        layerId,
        ranges: [
          {
            startDate: completion.startDate,
            endDateExclusive: completion.endDateExclusive,
          },
        ],
        valid: true,
      };
    case "create":
      return {
        kind: "range",
        variant: "create",
        layerId,
        ranges: [
          {
            startDate: completion.startDate,
            endDateExclusive: completion.endDateExclusive,
          },
        ],
        valid: true,
      };
    case "invalid": {
      const detail = completion.detail;
      if (!detail) return undefined;
      if (detail.proposedPeriod) {
        return {
          kind: "item",
          variant: detail.variant === "resize" ? "resize" : "move",
          itemId: detail.itemId ?? "",
          layerId,
          ranges: periodRange(detail.proposedPeriod),
          valid: false,
        };
      }
      if (detail.proposedRange) {
        return {
          kind: "range",
          variant:
            detail.variant === "erase" ? "erase" : detail.variant === "create" ? "create" : "paint",
          layerId,
          ranges: [detail.proposedRange],
          valid: false,
        };
      }
      return undefined;
    }
    default:
      return undefined;
  }
}
