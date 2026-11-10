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
      const endIndex = row.columns.findIndex(
        (column) => column.date !== undefined && column.date >= endDateExclusive,
      );
      const end = endIndex === -1 ? row.columns.length : endIndex;
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

function periodRange(period: PlannerPeriod): SelectionDateRange[] {
  return period.kind === "all-day"
    ? [{ startDate: period.startDate, endDateExclusive: period.endDateExclusive }]
    : [];
}

/**
 * Maps a completed gesture intent to a renderable preview.
 *
 * Invalid completions render nothing; the diagnostic is emitted on commit and
 * the original item stays visible.
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
    default:
      return undefined;
  }
}
