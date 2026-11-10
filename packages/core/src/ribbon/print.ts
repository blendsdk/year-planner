import { type Diagnostic, diagnostic } from "../diagnostics.js";
import type { RibbonLayout, RibbonRow } from "./types.js";

/** The supported print page size. */
export type PrintPageSize = "A3";

/** How rows are placed on print pages. */
export type PrintMode = "paginate" | "fit";

/** Print options accepted by `planRibbonPrint`. */
export interface PrintOptions {
  page?: PrintPageSize;
  mode?: PrintMode;
  rowsPerPage?: number;
}

/** One planned print page. */
export interface PrintPage {
  index: number;
  firstRowIndex: number;
  rows: RibbonRow[];
  contentHeight: number;
  scale: number;
}

/** A complete print plan. */
export interface PrintPlan {
  page: PrintPageSize;
  mode: PrintMode;
  pages: PrintPage[];
  scale: number;
  requiresPaginate: boolean;
  diagnostics: Diagnostic[];
}

/** A print plan or a validation failure. */
export type PrintPlanResult =
  | { ok: true; plan: PrintPlan }
  | { ok: false; diagnostics: Diagnostic[] };

/** Inner width of an A3 landscape sheet at 96 DPI with 6 mm side margins. */
export const A3_LANDSCAPE_INNER_WIDTH = 1542;

/** Inner height of an A3 landscape sheet at 96 DPI with 6 mm top/bottom margins. */
export const A3_LANDSCAPE_INNER_HEIGHT = 1077;

/** Design-size date text used by the classic renderer. */
export const PRINT_DATE_TEXT_PX = 12;

/** Minimum acceptable printed date text size in points. */
export const PRINT_MIN_DATE_TEXT_PT = 7;

const DEFAULT_ROWS_PER_PAGE = 14;

function invalid(message: string): PrintPlanResult {
  return { ok: false, diagnostics: [diagnostic("INVALID_PRINT_OPTIONS", message)] };
}

function contentHeight(ribbon: RibbonLayout, rows: RibbonRow[]): number {
  return (
    ribbon.headerHeight + ribbon.footerHeight + rows.reduce((total, row) => total + row.height, 0)
  );
}

function pageScale(ribbon: RibbonLayout, height: number): number {
  const widthScale = ribbon.totalWidth > 0 ? A3_LANDSCAPE_INNER_WIDTH / ribbon.totalWidth : 1;
  const heightScale = height > 0 ? A3_LANDSCAPE_INNER_HEIGHT / height : 1;
  return Math.min(1, widthScale, heightScale);
}

function makePage(ribbon: RibbonLayout, rows: RibbonRow[], index: number): PrintPage {
  const height = contentHeight(ribbon, rows);
  return {
    index,
    firstRowIndex: rows[0]?.rowIndex ?? 0,
    rows,
    contentHeight: height,
    scale: pageScale(ribbon, height),
  };
}

/**
 * Plans A3 pages for ribbon rows.
 *
 * Paginate chunks strictly by `rowsPerPage` and scales each page to fit both
 * dimensions. Fit places every row on one page and warns when the date text
 * would print below 7 pt.
 *
 * @param ribbon - Ribbon output from `buildRibbonLayout`.
 * @param options - Page size, mode and rows per page.
 * @returns A print plan or validation diagnostics.
 */
export function planRibbonPrint(ribbon: RibbonLayout, options: PrintOptions = {}): PrintPlanResult {
  const page = options.page ?? "A3";
  if (page !== "A3") return invalid(`Unsupported page size: ${String(page)}`);
  const mode = options.mode ?? "paginate";
  if (mode !== "paginate" && mode !== "fit")
    return invalid(`Unsupported print mode: ${String(mode)}`);
  const rowsPerPage = options.rowsPerPage ?? DEFAULT_ROWS_PER_PAGE;
  if (!Number.isInteger(rowsPerPage) || rowsPerPage < 1 || rowsPerPage > 14) {
    return invalid(`rowsPerPage must be an integer 1-14: ${rowsPerPage}`);
  }

  if (mode === "paginate") {
    const pages: PrintPage[] = [];
    for (let index = 0; index < ribbon.rows.length; index += rowsPerPage) {
      pages.push(makePage(ribbon, ribbon.rows.slice(index, index + rowsPerPage), pages.length));
    }
    return {
      ok: true,
      plan: {
        page,
        mode,
        pages,
        scale: 1,
        requiresPaginate: false,
        diagnostics: [],
      },
    };
  }

  const single = makePage(ribbon, ribbon.rows, 0);
  const printedSize = PRINT_DATE_TEXT_PX * single.scale * 0.75;
  const requiresPaginate = printedSize < PRINT_MIN_DATE_TEXT_PT;
  return {
    ok: true,
    plan: {
      page,
      mode,
      pages: [single],
      scale: single.scale,
      requiresPaginate,
      diagnostics: requiresPaginate
        ? [
            diagnostic(
              "PRINT_FIT_TOO_SMALL",
              "Fit mode would print date text below 7 pt; use paginate",
              "warning",
            ),
          ]
        : [],
    },
  };
}
