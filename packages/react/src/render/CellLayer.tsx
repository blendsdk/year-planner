import { type DateKey, isoWeekOf, type MonthRowLayout } from "@blendsdk/year-planner-core";
import type { CSSProperties, KeyboardEvent, ReactNode } from "react";
import type { PlannerFormatters } from "../locale.js";
import { safeCssColor, safeMetaStyle } from "../safeStyle.js";
import type {
  CellRenderContext,
  DateMeta,
  DateMetaContext,
  YearPlannerComponents,
} from "../types.js";

/** Props for one month row's cell layer. */
export interface CellLayerProps {
  row: MonthRowLayout;
  itemsByDate: ReadonlyMap<DateKey, readonly string[]>;
  formatters: PlannerFormatters;
  activeDate: DateKey | undefined;
  showISOWeekNumbers: boolean;
  getDateMeta?: ((date: DateKey, context: DateMetaContext) => DateMeta | undefined) | undefined;
  renderCell?: ((context: CellRenderContext) => ReactNode) | undefined;
  components: YearPlannerComponents;
  onFocusDate: (date: DateKey) => void;
  onCellKeyDown: (date: DateKey, event: KeyboardEvent<HTMLElement>) => void;
  onSelectDate: (
    date: DateKey,
    event: {
      shiftKey?: boolean;
      ctrlKey?: boolean;
      metaKey?: boolean;
      target?: EventTarget | null;
    },
  ) => void;
}

/**
 * Renders dated and blank grid cells. The cell element, ARIA and hit surface are
 * planner-owned; `renderCell` and the `DayCell` slot only add inner content.
 */
export function CellLayer({
  row,
  itemsByDate,
  formatters,
  activeDate,
  showISOWeekNumbers,
  getDateMeta,
  renderCell,
  components,
  onFocusDate,
  onCellKeyDown,
  onSelectDate,
}: CellLayerProps): ReactNode {
  const DayCell = components.DayCell;
  return row.columns.map((column) => {
    const date = column.date;
    const itemIds = date ? (itemsByDate.get(date) ?? []) : [];
    const meta = date
      ? getDateMeta?.(date, {
          isWeekend: column.isWeekend,
          isContextMonth: column.isContextMonth,
          itemIds,
        })
      : undefined;
    const disabled = meta?.disabled === true;
    const day = date ? Number(date.slice(8, 10)) : undefined;
    const showWeek = Boolean(
      date &&
        showISOWeekNumbers &&
        (Number(date.slice(8, 10)) === 1 || column.columnIndex % 7 === 2),
    );
    const content = date ? (
      <>
        <span className="yp-day-number">{formatters.formatNumber(day as number)}</span>
        {showWeek && <span className="yp-week-number">{isoWeekOf(date).week}</span>}
        {meta?.label && <span className="yp-cell-label">{meta.label}</span>}
        {meta?.content}
        {renderCell?.({
          date,
          year: row.year,
          monthIndex: row.monthIndex,
          columnIndex: column.columnIndex,
          isWeekend: column.isWeekend,
          isContextMonth: column.isContextMonth,
          itemIds,
        })}
      </>
    ) : null;
    const classes = [
      "yp-cell",
      column.isWeekend ? "yp-weekend" : "",
      column.isContextMonth ? "yp-context" : "",
      date ? "yp-valid" : "yp-outside",
      meta?.holiday ? "yp-holiday" : "",
      meta?.className ?? "",
    ]
      .filter(Boolean)
      .join(" ");
    const style: CSSProperties | undefined = meta
      ? {
          ...safeMetaStyle(meta.style),
          ...(safeCssColor(meta.background) ? { background: safeCssColor(meta.background) } : {}),
          ...(safeCssColor(meta.color) ? { color: safeCssColor(meta.color) } : {}),
        }
      : undefined;
    return (
      // biome-ignore lint/a11y/useSemanticElements: CSS grid cells implement the ARIA grid pattern
      <div
        className={classes}
        key={`${row.rowId}-${column.columnIndex}`}
        role="gridcell"
        data-date={date}
        data-yp-part="day-cell"
        data-yp-holiday={meta?.holiday ? "true" : undefined}
        aria-label={date ? (meta?.ariaLabel ?? formatters.formatDate(date)) : undefined}
        aria-disabled={disabled ? "true" : undefined}
        aria-hidden={date ? undefined : true}
        tabIndex={date ? (disabled ? -1 : date === activeDate ? 0 : -1) : undefined}
        style={style}
        onFocus={() => date && onFocusDate(date)}
        onClick={(event) => date && !disabled && onSelectDate(date, event)}
        onKeyDown={(event) => {
          if (!date || disabled) return;
          onCellKeyDown(date, event);
        }}
      >
        {DayCell ? (
          <DayCell className="yp-day-cell-slot" style={style ?? {}}>
            {content}
          </DayCell>
        ) : (
          content
        )}
      </div>
    );
  });
}
