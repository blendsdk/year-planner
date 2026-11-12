import { type Diagnostic, diagnostic } from "../diagnostics.js";
import type { RibbonLayout, RibbonRow } from "./types.js";

/**
 * The supported print page size.
 * @public
 */
export type PrintPageSize = "A3";

/**
 * How rows are placed on print pages.
 * @public
 */
export type PrintMode = "paginate" | "fit";

/**
 * Print options accepted by `planRibbonPrint`.
 * @public
 */
export interface PrintOptions {
  /** Page size; A3 landscape is the only R1 baseline. */
  page?: PrintPageSize;
  /** Paginate by rows or fit everything on one page. */
  mode?: PrintMode;
  /** Maximum rows per page, 1-14; defaults to 14. */
  rowsPerPage?: number;
}

/**
 * One planned print page.
 * @public
 */
export interface PrintPage {
  /** Zero-based page index. */
  index: number;
  /** Layout row index of the first row on the page. */
  firstRowIndex: number;
  /** Rows placed on the page without splitting. */
  rows: RibbonRow[];
  /** Header, footer and row heights in design units. */
  contentHeight: number;
  /** Uniform scale that fits both A3 dimensions. */
  scale: number;
}

/**
 * A complete print plan.
 * @public
 */
export interface PrintPlan {
  /** Page size used by the plan. */
  page: PrintPageSize;
  /** Paginate or fit mode. */
  mode: PrintMode;
  /** Planned pages. */
  pages: PrintPage[];
  /** Global fit scale; `1` for paginate. */
  scale: number;
  /** True when fit mode should fall back to paginate. */
  requiresPaginate: boolean;
  /** Print warnings, including `PRINT_FIT_TOO_SMALL`. */
  diagnostics: Diagnostic[];
}

/**
 * A print plan or a validation failure.
 * @public
 */
export type PrintPlanResult =
  | {
      /** True when the plan was built. */
      ok: true;
      /** Pages, scale and diagnostics for this plan. */
      plan: PrintPlan;
    }
  | {
      /** False when print options are invalid. */
      ok: false;
      /** Validation diagnostics. */
      diagnostics: Diagnostic[];
    };

/**
 * Inner width of an A3 landscape sheet at 96 DPI with 6 mm side margins.
 * @public
 */
export const A3_LANDSCAPE_INNER_WIDTH = 1542;

/**
 * Inner height of an A3 landscape sheet at 96 DPI with 6 mm top/bottom margins.
 * @public
 */
export const A3_LANDSCAPE_INNER_HEIGHT = 1077;

/**
 * Design-size date text used by the classic renderer.
 * @public
 */
export const PRINT_DATE_TEXT_PX = 12;

/**
 * Minimum acceptable printed date text size in points.
 * @public
 */
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
 * @public
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
