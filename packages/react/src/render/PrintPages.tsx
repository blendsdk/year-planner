import type {
  MonthRowLayout,
  PlannerItem,
  PlannerLayer,
  RibbonLayout,
  RibbonRow,
  YearLayout,
} from "@blendsdk/year-planner-core";
import { isoWeekOf } from "@blendsdk/year-planner-core";
import { type CSSProperties, memo, type ReactNode } from "react";
import { readableTextColor } from "../a11y.js";
import { rowTemplate } from "../geometry.js";
import type { PlannerFormatters } from "../locale.js";
import { safeCssColor } from "../safeStyle.js";

/**
 * Props for the hidden print tree.
 */
export interface PrintPagesProps {
  layout: YearLayout;
  ribbons: RibbonLayout;
  pages: { rows: RibbonRow[]; scale: number }[];
  formatters: PlannerFormatters;
  layers: ReadonlyMap<string, PlannerLayer>;
  items: ReadonlyMap<string, PlannerItem>;
  bandWidth: number;
  showISOWeekNumbers: boolean;
  showAnnotations: boolean;
  weekdayNames: string[];
  textPrimary: string;
  textInverse: string;
}

function printRow(
  layoutRow: MonthRowLayout,
  ribbonRow: RibbonRow,
  formatters: PlannerFormatters,
  layers: ReadonlyMap<string, PlannerLayer>,
  items: ReadonlyMap<string, PlannerItem>,
  bandWidth: number,
  showISOWeekNumbers: boolean,
  showAnnotations: boolean,
  textPrimary: string,
  textInverse: string,
): ReactNode {
  return (
    <div
      className="yp-print-row yp-row"
      key={layoutRow.rowId}
      data-print-row-id={layoutRow.rowId}
      style={{
        gridTemplateColumns: rowTemplate(layoutRow, 1, bandWidth),
        height: ribbonRow.height,
      }}
    >
      <div className={`yp-print-month ${layoutRow.kind === "context" ? "yp-context" : ""}`}>
        <span>{formatters.monthName(layoutRow.monthIndex)}</span>
        <span>
          {layoutRow.kind === "current" ? `'${String(layoutRow.year).slice(-2)}` : layoutRow.year}
        </span>
      </div>
      {layoutRow.columns.map((column) => {
        const date = column.date;
        const showWeek = Boolean(
          date &&
            showISOWeekNumbers &&
            (Number(date.slice(8, 10)) === 1 || column.columnIndex % 7 === 2),
        );
        return (
          <div
            className={[
              "yp-print-cell",
              column.isWeekend ? "yp-print-weekend" : "",
              column.isContextMonth ? "yp-print-context" : "",
              date ? "" : "yp-print-outside",
            ]
              .filter(Boolean)
              .join(" ")}
            key={`${layoutRow.rowId}-${column.columnIndex}`}
            data-print-date={date}
          >
            {date && (
              <>
                <span className="yp-print-day">
                  {formatters.formatNumber(Number(date.slice(8, 10)))}
                </span>
                {showWeek && <span className="yp-print-week">{isoWeekOf(date).week}</span>}
              </>
            )}
          </div>
        );
      })}
      <div
        className="yp-print-item-layer"
        style={{ left: bandWidth, width: layoutRow.prefixWidths[37] }}
      >
        {ribbonRow.fragments.map((fragment) => {
          const item = items.get(fragment.itemId);
          const layer = item ? layers.get(item.layerId) : undefined;
          if (!item || !layer) return null;
          if (fragment.channel === "annotation" && !showAnnotations) return null;
          if (fragment.channel === "ribbon" && fragment.lane >= ribbonRow.visibleLaneCount)
            return null;
          const annotationBackground =
            fragment.channel === "annotation" ? item.annotation?.background : undefined;
          const background =
            safeCssColor(item.color) ??
            safeCssColor(annotationBackground) ??
            safeCssColor(layer.color);
          const textColor =
            safeCssColor(item.textColor) ??
            (background
              ? readableTextColor(background, [textPrimary, textInverse, "#ffffff"])
              : undefined);
          const style: CSSProperties = {
            left: fragment.x,
            top:
              fragment.channel === "background" || fragment.channel === "highlight"
                ? 0
                : fragment.y,
            width: Math.max(1, fragment.width),
            height:
              fragment.channel === "background" || fragment.channel === "highlight"
                ? ribbonRow.height
                : fragment.height,
            ...(background ? { background } : {}),
            ...(textColor ? { color: textColor } : {}),
          };
          const label =
            fragment.channel === "annotation"
              ? (item.annotation?.label ?? item.title ?? item.id)
              : (item.title ?? item.id);
          return (
            <div
              key={fragment.fragmentId}
              className={`yp-print-fragment yp-print-${fragment.channel}`}
              data-print-item-id={item.id}
              style={style}
            >
              {fragment.channel === "ribbon" || fragment.channel === "annotation" ? label : null}
            </div>
          );
        })}
      </div>
      <div className={`yp-print-month ${layoutRow.kind === "context" ? "yp-context" : ""}`}>
        <span>{formatters.monthName(layoutRow.monthIndex)}</span>
        <span>
          {layoutRow.kind === "current" ? `'${String(layoutRow.year).slice(-2)}` : layoutRow.year}
        </span>
      </div>
    </div>
  );
}

/**
 * Renders the hidden A3 print tree. Each planned page gets its own uniform scale
 * and a forced page break; the screen view is unaffected.
 */
export const PrintPages = memo(function PrintPages({
  layout,
  ribbons,
  pages,
  formatters,
  layers,
  items,
  bandWidth,
  showISOWeekNumbers,
  showAnnotations,
  weekdayNames,
  textPrimary,
  textInverse,
}: PrintPagesProps): ReactNode {
  if (pages.length === 0) return null;
  const layoutById = new Map(layout.rows.map((row) => [row.rowId, row]));
  const firstRow = layout.rows[0];
  const headingTemplate = firstRow
    ? rowTemplate(firstRow, 1, bandWidth)
    : `${bandWidth}px repeat(37, 55px) ${bandWidth}px`;
  return (
    <div className="yp-print-pages" data-yp-part="print-pages" aria-hidden="true">
      {pages.map((page, pageIndex) => {
        const pageRows = page.rows
          .map((row) => layoutById.get(row.rowId))
          .filter((row): row is MonthRowLayout => row !== undefined);
        return (
          <section
            className="yp-print-page"
            data-yp-part="print-page"
            data-print-page-index={pageIndex}
            key={`print-page-${page.rows[0]?.rowId ?? page.scale}`}
            style={{ "--yp-print-scale": page.scale } as CSSProperties}
          >
            <div
              className="yp-print-surface"
              style={{ width: ribbons.totalWidth }}
              data-print-page-width={ribbons.totalWidth}
            >
              <div
                className="yp-print-row yp-row"
                style={{
                  gridTemplateColumns: headingTemplate,
                  height: ribbons.headerHeight,
                }}
              >
                <div className="yp-print-month" />
                {Array.from({ length: 37 }, (_, index) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: fixed 37-column weekday header
                  <div className="yp-print-heading" key={`print-heading-${index}`}>
                    {weekdayNames[index % 7] ?? ""}
                  </div>
                ))}
                <div className="yp-print-month" />
              </div>
              {pageRows.map((layoutRow, index) => {
                const ribbonRow = page.rows[index];
                if (!ribbonRow) return null;
                return printRow(
                  layoutRow,
                  ribbonRow,
                  formatters,
                  layers,
                  items,
                  bandWidth,
                  showISOWeekNumbers,
                  showAnnotations,
                  textPrimary,
                  textInverse,
                );
              })}
              <div
                className="yp-print-row yp-row"
                style={{
                  gridTemplateColumns: headingTemplate,
                  height: ribbons.footerHeight,
                }}
              >
                <div className="yp-print-month" />
                {Array.from({ length: 37 }, (_, index) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: fixed 37-column weekday footer
                  <div className="yp-print-heading" key={`print-footer-heading-${index}`}>
                    {weekdayNames[index % 7] ?? ""}
                  </div>
                ))}
                <div className="yp-print-month" />
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
});
