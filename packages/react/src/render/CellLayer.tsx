import { type DateKey, isoWeekOf, type MonthRowLayout } from "@blendsdk/year-planner-core";
import { type CSSProperties, type KeyboardEvent, type ReactNode, useId } from "react";
import { dateCellAccessibleName } from "../a11y.js";
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
  selectedDates: ReadonlySet<DateKey>;
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
  selectedDates,
  showISOWeekNumbers,
  getDateMeta,
  renderCell,
  components,
  onFocusDate,
  onCellKeyDown,
  onSelectDate,
}: CellLayerProps): ReactNode {
  const DayCell = components.DayCell;
  const idPrefix = useId();
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
    const weekNumber = showWeek && date ? isoWeekOf(date).week : undefined;
    const selected = Boolean(date && selectedDates.has(date));
    const labelId = `${idPrefix}-${column.columnIndex}-label`;
    const contentId = `${idPrefix}-${column.columnIndex}-content`;
    const label = date
      ? dateCellAccessibleName({
          date,
          formattedDate: formatters.formatDate(date),
          itemCount: itemIds.length,
          weekNumber,
          meta,
          selected,
        })
      : undefined;
    const content = date ? (
      <>
        <span className="yp-day-number" aria-hidden={meta?.ariaLabel ? "true" : undefined}>
          {formatters.formatNumber(day as number)}
        </span>{" "}
        {weekNumber !== undefined && (
          <>
            <span className="yp-week-number" aria-hidden={meta?.ariaLabel ? "true" : undefined}>
              {weekNumber}
            </span>{" "}
          </>
        )}
        {meta?.label && (
          <span className="yp-cell-label" aria-hidden={meta?.ariaLabel ? "true" : undefined}>
            {meta.label}
          </span>
        )}
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
        aria-label={meta?.ariaLabel ? label : undefined}
        aria-labelledby={date && !meta?.ariaLabel ? `${labelId} ${contentId}` : undefined}
        aria-selected={date ? (selected ? "true" : "false") : undefined}
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
        {date && (
          <span id={labelId} className="yp-sr-only">
            {label}
          </span>
        )}
        <span id={contentId}>
          {DayCell ? (
            <DayCell className="yp-day-cell-slot" style={style ?? {}}>
              {content}
            </DayCell>
          ) : (
            content
          )}
        </span>
      </div>
    );
  });
}
