import { addDays, dayOfWeek, daysInMonth, parseDateKey } from "../date.js";
import { type Diagnostic, diagnostic } from "../diagnostics.js";

/** One calendar day column in a month row. */
export interface DayColumnLayout {
  columnIndex: number;
  date?: string;
  isWeekend: boolean;
  isContextMonth: boolean;
  x: number;
  width: number;
}

/** One month row in the classic year layout. */
export interface MonthRowLayout {
  rowId: string;
  rowIndex: number;
  year: number;
  monthIndex: number;
  kind: "context" | "current";
  firstDate: string;
  endDateExclusive: string;
  firstColumn: number;
  daysInMonth: number;
  columns: DayColumnLayout[];
  prefixWidths: number[];
  height: number;
}

/** The pure classic-year layout. */
export interface YearLayout {
  rows: MonthRowLayout[];
  totalDayWidth: number;
  bodyHeight: number;
  headerHeight: number;
  footerHeight: number;
  monthBandWidth: number;
  rowHeight: number;
  highlightYear: number;
  signature: string;
}

/** Design-unit dimensions for the classic layout. */
export interface ClassicYearUnits {
  monthBand: number;
  weekend: number;
  weekday: number;
  rowHeight: number;
  headerHeight: number;
}

/** Options for building a classic year layout. */
export interface ClassicYearLayoutOptions {
  year?: number;
  contextMonths?: { before: number; after: number };
  range?: { start: { year: number; month: number }; monthCount: number };
  highlightYear?: number;
  units?: Partial<ClassicYearUnits>;
}

export type ClassicYearLayoutResult =
  | { ok: true; layout: YearLayout }
  | { ok: false; diagnostics: Diagnostic[] };

const DEFAULT_UNITS: ClassicYearUnits = {
  monthBand: 70,
  weekend: 40,
  weekday: 55,
  rowHeight: 90,
  headerHeight: 36,
};

function addMonths(year: number, month: number, delta: number): { year: number; month: number } {
  const total = year * 12 + month + delta;
  return { year: Math.floor(total / 12), month: ((total % 12) + 12) % 12 };
}

function monthKey(year: number, month: number): string {
  return `${String(year).padStart(4, "0")}-${String(month + 1).padStart(2, "0")}`;
}

/**
 * Builds the classic 12-36 month layout with 37 fixed Saturday-first day
 * columns per month row. Pure data; no React or DOM.
 */
export function buildClassicYearLayout(options: ClassicYearLayoutOptions): ClassicYearLayoutResult {
  const units = { ...DEFAULT_UNITS, ...options.units };
  const diagnostics: Diagnostic[] = [];

  let start: { year: number; month: number };
  let monthCount: number;
  let highlightYear: number;

  if (options.range) {
    const { start: rangeStart, monthCount: count } = options.range;
    if (!Number.isInteger(rangeStart.month) || rangeStart.month < 0 || rangeStart.month > 11) {
      diagnostics.push(diagnostic("INVALID_MONTH", `Invalid month: ${rangeStart.month}`));
    }
    if (!Number.isInteger(count) || count < 12 || count > 36) {
      diagnostics.push(diagnostic("INVALID_MONTH_COUNT", `Month count must be 12-36: ${count}`));
    }
    const end = addMonths(rangeStart.year, rangeStart.month, count);
    if (end.year > 9999) {
      diagnostics.push(diagnostic("INVALID_RANGE", "Window exceeds 9999-12-31"));
      return { ok: false, diagnostics };
    }
    if (!Number.isInteger(rangeStart.year) || rangeStart.year < 1601 || rangeStart.year > 9998) {
      diagnostics.push(
        diagnostic("UNSUPPORTED_VIEW_YEAR", `View year outside 1601-9998: ${rangeStart.year}`),
      );
    }
    start = { year: rangeStart.year, month: rangeStart.month };
    monthCount = count;
    highlightYear = options.highlightYear ?? rangeStart.year;
  } else {
    if (
      !Number.isInteger(options.year) ||
      (options.year as number) < 1601 ||
      (options.year as number) > 9998
    ) {
      diagnostics.push(
        diagnostic(
          options.year === undefined ? "MISSING_RANGE" : "UNSUPPORTED_VIEW_YEAR",
          options.year === undefined
            ? "Either year or range is required"
            : `View year outside 1601-9998: ${options.year}`,
        ),
      );
      return { ok: false, diagnostics };
    }
    const before = options.contextMonths?.before ?? 1;
    const after = options.contextMonths?.after ?? 1;
    if (
      !Number.isInteger(before) ||
      !Number.isInteger(after) ||
      before < 0 ||
      after < 0 ||
      before > 12 ||
      after > 12 ||
      before + 12 + after < 12 ||
      before + 12 + after > 36
    ) {
      diagnostics.push(
        diagnostic(
          "INVALID_CONTEXT_MONTHS",
          `contextMonths must be integers 0-12 and total 12-36: ${before}/${after}`,
        ),
      );
      return { ok: false, diagnostics };
    }
    start = addMonths(options.year as number, 0, -before);
    monthCount = before + 12 + after;
    highlightYear = options.highlightYear ?? (options.year as number);
  }

  if (diagnostics.length > 0) return { ok: false, diagnostics };

  const rows: MonthRowLayout[] = [];
  for (let index = 0; index < monthCount; index += 1) {
    const current = addMonths(start.year, start.month, index);
    const next = addMonths(current.year, current.month, 1);
    const firstDate = `${monthKey(current.year, current.month)}-01`;
    const endDateExclusive = `${monthKey(next.year, next.month)}-01`;
    const firstColumn = dayOfWeek(firstDate);
    const count = daysInMonth(current.year, current.month);
    const prefixWidths: number[] = [0];
    const columns: DayColumnLayout[] = [];
    for (let columnIndex = 0; columnIndex < 37; columnIndex += 1) {
      const isWeekend = columnIndex % 7 < 2;
      const width = isWeekend ? units.weekend : units.weekday;
      const day = columnIndex - firstColumn + 1;
      const date =
        day >= 1 && day <= count
          ? `${monthKey(current.year, current.month)}-${String(day).padStart(2, "0")}`
          : undefined;
      columns.push({
        columnIndex,
        ...(date ? { date } : {}),
        isWeekend,
        isContextMonth: current.year !== highlightYear,
        x: prefixWidths[columnIndex] as number,
        width,
      });
      prefixWidths.push((prefixWidths[columnIndex] as number) + width);
    }
    rows.push({
      rowId: monthKey(current.year, current.month),
      rowIndex: index,
      year: current.year,
      monthIndex: current.month,
      kind: current.year === highlightYear ? "current" : "context",
      firstDate,
      endDateExclusive,
      firstColumn,
      daysInMonth: count,
      columns,
      prefixWidths,
      height: units.rowHeight,
    });
  }

  const totalDayWidth = rows[0]?.prefixWidths[37] ?? 0;
  const signature = rows
    .map((row) => `${row.rowId}:${row.firstDate}:${row.prefixWidths[37]}:${row.kind}`)
    .join("|");

  return {
    ok: true,
    layout: {
      rows,
      totalDayWidth,
      bodyHeight: rows.length * units.rowHeight,
      headerHeight: units.headerHeight,
      footerHeight: units.headerHeight,
      monthBandWidth: units.monthBand,
      rowHeight: units.rowHeight,
      highlightYear,
      signature,
    },
  };
}

/** Returns the zero-based day column for a valid date in the given row. */
export function dateToColumn(row: MonthRowLayout, date: string): number {
  const parsed = parseDateKey(date);
  if (!parsed.ok) throw new RangeError(parsed.diagnostic.message);
  if (date < row.firstDate || date >= row.endDateExclusive) {
    throw new RangeError(`${date} is not in row ${row.rowId}`);
  }
  const day = Number(date.slice(8, 10));
  return row.firstColumn + day - 1;
}

/** Returns the month row containing a date, if visible. */
export function rowForDate(layout: YearLayout, date: string): MonthRowLayout | undefined {
  return layout.rows.find((row) => date >= row.firstDate && date < row.endDateExclusive);
}

/** Returns a deterministic layout signature. */
export function layoutSignature(layout: YearLayout): string {
  return layout.signature;
}

/** Splits rows into print pages (default 14 rows per A3 page). */
export function paginatePrintRows(layout: YearLayout, rowsPerPage = 14): MonthRowLayout[][] {
  if (!Number.isInteger(rowsPerPage) || rowsPerPage < 1 || rowsPerPage > 14) {
    throw new RangeError(`rowsPerPage must be 1-14: ${rowsPerPage}`);
  }
  const pages: MonthRowLayout[][] = [];
  for (let index = 0; index < layout.rows.length; index += rowsPerPage) {
    pages.push(layout.rows.slice(index, index + rowsPerPage));
  }
  return pages;
}

/** Returns the first date of a month row plus the number of valid days. */
export function rowDateRange(row: MonthRowLayout): { start: string; endExclusive: string } {
  return { start: row.firstDate, endExclusive: row.endDateExclusive };
}

/** Returns the date after `days` inside a row, clamped to the row end. */
export function clampToRow(row: MonthRowLayout, date: string): string {
  if (date < row.firstDate) return row.firstDate;
  if (date >= row.endDateExclusive) return addDays(row.endDateExclusive, -1);
  return date;
}
