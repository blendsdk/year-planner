import type {
  DateKey,
  MonthRowLayout,
  PlannerItem,
  PlannerLayer,
  RibbonLayout,
  YearLayout,
} from "@blendsdk/year-planner-core";
import type { ReactNode } from "react";
import { rowTemplate } from "../geometry.js";
import type { PlannerFormatters } from "../locale.js";
import type {
  AnnotationRenderContext,
  CellRenderContext,
  DateMeta,
  DateMetaContext,
  ItemRenderContext,
  OverflowRenderContext,
  TooltipRenderContext,
  YearPlannerComponents,
} from "../types.js";
import { MonthRow } from "./MonthRow.js";

/** Props for the scrollable year grid. */
export interface YearGridProps {
  layout: YearLayout;
  ribbons: RibbonLayout;
  formatters: PlannerFormatters;
  zoom: number;
  bandWidth: number;
  layers: ReadonlyMap<string, PlannerLayer>;
  items: ReadonlyMap<string, PlannerItem>;
  itemsByDate: ReadonlyMap<DateKey, readonly string[]>;
  activeDate: DateKey | undefined;
  activeItemId: string | undefined;
  selectedItemIds: ReadonlySet<string>;
  showISOWeekNumbers: boolean;
  showAnnotations: boolean;
  getDateMeta?: ((date: DateKey, context: DateMetaContext) => DateMeta | undefined) | undefined;
  renderCell?: ((context: CellRenderContext) => ReactNode) | undefined;
  renderItem?: ((context: ItemRenderContext) => ReactNode) | undefined;
  renderAnnotation?: ((context: AnnotationRenderContext) => ReactNode) | undefined;
  renderOverflow?: ((context: OverflowRenderContext) => ReactNode) | undefined;
  renderTooltip?: ((context: TooltipRenderContext) => ReactNode) | undefined;
  components: YearPlannerComponents;
  displayTimeZone: string;
  ariaLabel: string;
  ariaDescribedBy?: string | undefined;
  onFocusDate: (date: DateKey) => void;
  onMoveFocus: (date: DateKey, delta: number) => void;
  onSelectDate: (date: DateKey) => void;
  onSelectItem: (itemId: string) => void;
  onFocusItem: (itemId: string) => void;
}

function headerCells(weekdayNames: string[], components: YearPlannerComponents): ReactNode[] {
  const WeekdayHeader = components.WeekdayHeader;
  return Array.from({ length: 37 }, (_, index) => {
    const name = weekdayNames[index % 7] ?? "";
    return (
      // biome-ignore lint/a11y/useSemanticElements lint/suspicious/noArrayIndexKey: weekday headers are ARIA column headers in a fixed 37-slot CSS grid
      <div className="yp-heading" key={`heading-${index}`} role="columnheader" tabIndex={-1}>
        {WeekdayHeader ? <WeekdayHeader className="yp-heading-slot">{name}</WeekdayHeader> : name}
      </div>
    );
  });
}

/**
 * Renders the ARIA grid, sticky header/footer and every month row.
 */
export function YearGrid({
  layout,
  ribbons,
  formatters,
  zoom,
  bandWidth,
  layers,
  items,
  itemsByDate,
  activeDate,
  activeItemId,
  selectedItemIds,
  showISOWeekNumbers,
  showAnnotations,
  getDateMeta,
  renderCell,
  renderItem,
  renderAnnotation,
  renderOverflow,
  renderTooltip,
  components,
  displayTimeZone,
  ariaLabel,
  ariaDescribedBy,
  onFocusDate,
  onMoveFocus,
  onSelectDate,
  onSelectItem,
  onFocusItem,
}: YearGridProps): ReactNode {
  const Header = components.Header;
  const Footer = components.Footer;
  const weekdayNames = formatters.weekdayNames();
  const headings = headerCells(weekdayNames, components);
  const template = (row: MonthRowLayout) => rowTemplate(row, zoom, bandWidth);
  const firstRow = layout.rows[0];
  const headerTemplate = firstRow
    ? template(firstRow)
    : `${bandWidth * zoom}px repeat(37, 55px) ${bandWidth * zoom}px`;

  return (
    // biome-ignore lint/a11y/useSemanticElements: the CSS grid implements the ARIA grid layout
    <div
      className="yp-grid"
      role="grid"
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-rowcount={layout.rows.length + 2}
      aria-colcount={37}
      data-yp-part="grid"
    >
      {/* biome-ignore lint/a11y/useSemanticElements: CSS grid rows implement the ARIA grid pattern */}
      <div
        className="yp-row yp-header"
        role="row"
        tabIndex={-1}
        style={{ gridTemplateColumns: headerTemplate, height: layout.headerHeight }}
        data-yp-part="header"
      >
        <div className="yp-band" aria-hidden="true" />
        {Header ? <Header className="yp-row-slot">{headings}</Header> : headings}
        <div className="yp-band" aria-hidden="true" />
      </div>
      {layout.rows.map((row, index) => {
        const ribbonRow = ribbons.rows[index];
        if (!ribbonRow) return null;
        return (
          <MonthRow
            key={row.rowId}
            row={row}
            ribbonRow={ribbonRow}
            formatters={formatters}
            zoom={zoom}
            bandWidth={bandWidth}
            totalDayWidth={layout.totalDayWidth}
            layers={layers}
            items={items}
            itemsByDate={itemsByDate}
            activeDate={activeDate}
            activeItemId={activeItemId}
            selectedItemIds={selectedItemIds}
            showISOWeekNumbers={showISOWeekNumbers}
            showAnnotations={showAnnotations}
            getDateMeta={getDateMeta}
            renderCell={renderCell}
            renderItem={renderItem}
            renderAnnotation={renderAnnotation}
            renderOverflow={renderOverflow}
            renderTooltip={renderTooltip}
            components={components}
            displayTimeZone={displayTimeZone}
            onFocusDate={onFocusDate}
            onMoveFocus={onMoveFocus}
            onSelectDate={onSelectDate}
            onSelectItem={onSelectItem}
            onFocusItem={onFocusItem}
          />
        );
      })}
      {/* biome-ignore lint/a11y/useSemanticElements: CSS grid rows implement the ARIA grid pattern */}
      <div
        className="yp-row yp-footer"
        role="row"
        tabIndex={-1}
        style={{ gridTemplateColumns: headerTemplate, height: layout.headerHeight }}
        data-yp-part="footer"
      >
        <div className="yp-band" aria-hidden="true" />
        {Footer ? <Footer className="yp-row-slot">{headings}</Footer> : headings}
        <div className="yp-band" aria-hidden="true" />
      </div>
    </div>
  );
}
