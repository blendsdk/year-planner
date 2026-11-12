import { addDays, dayOfWeek, daysInMonth, parseDateKey } from "../date.js";
import { type Diagnostic, diagnostic } from "../diagnostics.js";

/**
 * One calendar day column in a month row.
 * @public
 */
export interface DayColumnLayout {
  /** Zero-based column within the 37-column row. */
  columnIndex: number;
  /** Calendar date for a real day; omitted for filler columns before or after the month. */
  date?: string;
  /** Whether the column is a weekend day. */
  isWeekend: boolean;
  /** Whether the column belongs to a context month. */
  isContextMonth: boolean;
  /** Horizontal offset in design pixels. */
  x: number;
  /** Column width in design pixels. */
  width: number;
}

/**
 * One month row in the classic year layout.
 * @public
 */
export interface MonthRowLayout {
  /** Stable row identifier. */
  rowId: string;
  /** Zero-based row index in the layout. */
  rowIndex: number;
  /** Calendar year of the month in this row; context rows may sit outside the view year. */
  year: number;
  /** Zero-based month index (0 = January). */
  monthIndex: number;
  /** Whether the row is a context month or the current year. */
  kind: "context" | "current";
  /** First date represented by the row. */
  firstDate: string;
  /** Exclusive end date of the row. */
  endDateExclusive: string;
  /** Column index where the first day is placed. */
  firstColumn: number;
  /** Number of calendar days in the month. */
  daysInMonth: number;
  /** Columns in the row, including leading blanks. */
  columns: DayColumnLayout[];
  /** Cumulative widths used for hit testing and painting. */
  prefixWidths: number[];
  /** Row height in design pixels. */
  height: number;
}

/**
 * The pure classic-year layout.
 * @public
 */
export interface YearLayout {
  /** Month rows in render order. */
  rows: MonthRowLayout[];
  /** Total width of the 37 day columns in design pixels. */
  totalDayWidth: number;
  /** Height of the month-row body in design pixels. */
  bodyHeight: number;
  /** Height of the weekday header in design pixels. */
  headerHeight: number;
  /** Height of the footer in design pixels. */
  footerHeight: number;
  /** Width of the month-label band in design pixels. */
  monthBandWidth: number;
  /** Height of one month row in design pixels. */
  rowHeight: number;
  /** Year marked as current; changes emphasis only. */
  highlightYear: number;
  /** Stable signature of the layout inputs; changes when a rebuild is needed. */
  signature: string;
}

/**
 * Design-unit dimensions for the classic layout.
 * @public
 */
export interface ClassicYearUnits {
  /** Width of the month-label band in design pixels. */
  monthBand: number;
  /** Width of one weekend day column in design pixels. */
  weekend: number;
  /** Width of one weekday column in design pixels. */
  weekday: number;
  /** Height of one month row in design pixels. */
  rowHeight: number;
  /** Height of the weekday header in design pixels. */
  headerHeight: number;
}

/**
 * Options for building a classic year layout.
 * @public
 */
export interface ClassicYearLayoutOptions {
  /** Year to render when no explicit range is supplied. */
  year?: number;
  /** Context months before and after the year; defaults to one on each side. */
  contextMonths?: {
    /** Context months before the year; defaults to 1. */
    before: number;
    /** Context months after the year; defaults to 1. */
    after: number;
  };
  /** Explicit window; wins over the year. */
  range?: {
    /** First month of the explicit window. */
    start: {
      /** Calendar year of the first month. */
      year: number;
      /** Zero-based month index (0 = January). */
      month: number;
    };
    /** Number of months in the window; 12-36. */
    monthCount: number;
  };
  /** Year marked as current; changes emphasis only. */
  highlightYear?: number;
  /** Layout overrides; wins over theme geometry. */
  units?: Partial<ClassicYearUnits>;
}

/**
 * Result of building a classic year layout: either a layout or its diagnostics.
 * @public
 */
export type ClassicYearLayoutResult =
  | {
      /** True when the layout was built. */
      ok: true;
      /** The built layout. */
      layout: YearLayout;
    }
  | {
      /** False when validation failed. */
      ok: false;
      /** Validation diagnostics. */
      diagnostics: Diagnostic[];
    };

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
 *
 * @example
 * ```ts
 * const result = buildClassicYearLayout({ year: 2027 });
 * if (result.ok) console.log(result.layout.rows.length); // 14
 * ```
 * @public
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
  const signature = [
    `${units.monthBand}:${units.weekend}:${units.weekday}:${units.rowHeight}:${units.headerHeight}`,
    ...rows.map((row) => `${row.rowId}:${row.firstDate}:${row.prefixWidths[37]}:${row.kind}`),
  ].join("|");

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

/**
 * Returns the zero-based day column for a valid date in the given row.
 * @public
 */
export function dateToColumn(row: MonthRowLayout, date: string): number {
  const parsed = parseDateKey(date);
  if (!parsed.ok) throw new RangeError(parsed.diagnostic.message);
  if (date < row.firstDate || date >= row.endDateExclusive) {
    throw new RangeError(`${date} is not in row ${row.rowId}`);
  }
  const day = Number(date.slice(8, 10));
  return row.firstColumn + day - 1;
}

/**
 * Returns the month row containing a date, if visible.
 * @public
 */
export function rowForDate(layout: YearLayout, date: string): MonthRowLayout | undefined {
  return layout.rows.find((row) => date >= row.firstDate && date < row.endDateExclusive);
}

/**
 * Returns a deterministic layout signature.
 * @public
 */
export function layoutSignature(layout: YearLayout): string {
  return layout.signature;
}

/**
 * Splits rows into print pages (default 14 rows per A3 page).
 * @public
 */
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

/**
 * Returns the first date of a month row plus the number of valid days.
 * @public
 */
export function rowDateRange(row: MonthRowLayout): {
  /** First date represented by the row. */
  start: string;
  /** Exclusive end date of the row. */
  endExclusive: string;
} {
  return { start: row.firstDate, endExclusive: row.endDateExclusive };
}

/**
 * Returns the date after `days` inside a row, clamped to the row end.
 * @public
 */
export function clampToRow(row: MonthRowLayout, date: string): string {
  if (date < row.firstDate) return row.firstDate;
  if (date >= row.endDateExclusive) return addDays(row.endDateExclusive, -1);
  return date;
}
