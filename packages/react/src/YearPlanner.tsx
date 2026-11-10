import {
  addDays,
  buildClassicYearLayout,
  type ClassicYearLayoutOptions,
  isoWeekOf,
  type MonthRowLayout,
} from "@blendsdk/year-planner-core";
import type { CSSProperties, KeyboardEvent, ReactNode } from "react";
import { useState } from "react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];

/** Visual theme preset for the classic year view. */
export type YearPlannerTheme = "classic-blue" | "classic-yellow" | "modern";

/** Display options for the minimal M1 grid. */
export interface YearPlannerDisplay {
  theme?: YearPlannerTheme;
  showISOWeekNumbers?: boolean;
  zoom?: number;
}

/** Print options for the minimal M1 grid. */
export interface YearPlannerPrint {
  mode?: "paginate" | "fit";
}

/** Props for the minimal M1 classic year grid. */
export interface YearPlannerProps extends ClassicYearLayoutOptions {
  display?: YearPlannerDisplay;
  print?: YearPlannerPrint;
  className?: string;
  style?: CSSProperties;
}

function monthLabel(row: MonthRowLayout): string {
  const name = MONTHS[row.monthIndex] ?? "";
  return row.kind === "current" ? `${name} '${String(row.year).slice(-2)}` : `${name} ${row.year}`;
}

function weekdayHeader(): ReactNode {
  return Array.from({ length: 37 }, (_, index) => {
    const day = WEEKDAYS[index % 7] ?? "";
    return (
      <div className="yp-heading" key={`heading-${day}-${index}`} role="columnheader">
        {day}
      </div>
    );
  });
}

/**
 * Minimal classic year grid.
 *
 * M1 renders the 12-36 month layout with date numbers, ISO weeks, mirrored
 * month labels and classic themes. Ribbons, lanes and interactions arrive in
 * later plans and are not claimed here.
 */
export function YearPlanner({
  display,
  print,
  className = "",
  style,
  ...layoutOptions
}: YearPlannerProps) {
  const [activeDate, setActiveDate] = useState<string | undefined>(undefined);
  const result = buildClassicYearLayout(layoutOptions);
  const theme = display?.theme ?? "classic-blue";
  const zoom = display?.zoom ?? 1;
  const band = 70 * zoom;
  const rowHeight = 90 * zoom;
  const widths = result.ok
    ? (result.layout.rows[0]?.columns.map((column) => `${column.width * zoom}px`) ?? [])
    : [];
  const template = result.ok
    ? `${band}px ${widths.join(" ")} ${band}px`
    : `${band}px repeat(37, 55px) ${band}px`;

  if (!result.ok) {
    return (
      <div className={`yp-root yp-theme-${theme} ${className}`} data-yp-part="root" style={style}>
        <div className="yp-empty" role="status">
          {result.diagnostics[0]?.message ?? "Unable to render the year planner."}
        </div>
      </div>
    );
  }

  const layout = result.layout;
  const firstValidDate = layout.rows
    .flatMap((row) => row.columns)
    .find((column) => column.date)?.date;
  const active =
    activeDate &&
    layout.rows.some((row) => row.columns.some((column) => column.date === activeDate))
      ? activeDate
      : firstValidDate;

  const moveFocus = (event: KeyboardEvent<HTMLDivElement>, date: string) => {
    const deltas: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    };
    const delta = deltas[event.key];
    if (delta === undefined) return;
    event.preventDefault();
    const target = addDays(date, delta);
    setActiveDate(target);
    const element = document.querySelector<HTMLElement>(`[data-date="${target}"]`);
    element?.focus();
  };

  return (
    <div
      className={`yp-root yp-theme-${theme} ${print?.mode === "fit" ? "yp-print-fit" : ""} ${className}`}
      data-yp-part="root"
      data-yp-theme={theme}
      style={style}
    >
      <div
        className="yp-grid"
        role="grid"
        aria-label={`Year planner ${layout.highlightYear}`}
        aria-rowcount={layout.rows.length}
        aria-colcount={37}
      >
        <div className="yp-row yp-header" role="row" style={{ gridTemplateColumns: template }}>
          <div className="yp-band" aria-hidden="true" />
          {weekdayHeader()}
          <div className="yp-band" aria-hidden="true" />
        </div>
        {layout.rows.map((row) => (
          <div
            className="yp-row"
            role="row"
            key={row.rowId}
            data-row-id={row.rowId}
            style={{ gridTemplateColumns: template, height: rowHeight }}
          >
            <div
              className={`yp-month ${row.kind === "context" ? "yp-context" : ""}`}
              aria-label={monthLabel(row)}
            >
              <span>{MONTHS[row.monthIndex]}</span>
              <span>{row.kind === "current" ? `'${String(row.year).slice(-2)}` : row.year}</span>
            </div>
            {row.columns.map((column) => {
              const showWeek =
                display?.showISOWeekNumbers !== false &&
                column.date !== undefined &&
                (Number(column.date.slice(8, 10)) === 1 || column.columnIndex % 7 === 2);
              return (
                <div
                  className={[
                    "yp-cell",
                    column.isWeekend ? "yp-weekend" : "",
                    column.isContextMonth ? "yp-context" : "",
                    column.date ? "yp-valid" : "yp-outside",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  key={`${row.rowId}-${column.columnIndex}`}
                  role="gridcell"
                  data-date={column.date}
                  aria-label={column.date ?? undefined}
                  aria-hidden={column.date ? undefined : true}
                  tabIndex={column.date ? (column.date === active ? 0 : -1) : undefined}
                  onFocus={() => column.date && setActiveDate(column.date)}
                  onKeyDown={(event) => column.date && moveFocus(event, column.date)}
                >
                  {column.date && (
                    <>
                      <span className="yp-day-number">{Number(column.date.slice(8, 10))}</span>
                      {showWeek && (
                        <span className="yp-week-number">{isoWeekOf(column.date).week}</span>
                      )}
                    </>
                  )}
                </div>
              );
            })}
            <div
              className={`yp-month ${row.kind === "context" ? "yp-context" : ""}`}
              aria-hidden="true"
            >
              <span>{MONTHS[row.monthIndex]}</span>
              <span>{row.kind === "current" ? `'${String(row.year).slice(-2)}` : row.year}</span>
            </div>
          </div>
        ))}
        <div className="yp-row yp-footer" role="row" style={{ gridTemplateColumns: template }}>
          <div className="yp-band" aria-hidden="true" />
          {weekdayHeader()}
          <div className="yp-band" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
