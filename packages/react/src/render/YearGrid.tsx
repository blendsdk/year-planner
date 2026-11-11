import type {
  DateKey,
  MonthRowLayout,
  PlannerItem,
  PlannerLayer,
  PlannerSelection,
  RibbonLayout,
  YearLayout,
} from "@blendsdk/year-planner-core";
import type { KeyboardEvent, PointerEvent, ReactNode } from "react";
import { rowTemplate } from "../geometry.js";
import { type PreviewLayer, previewsForRow } from "../interaction/preview.js";
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
import { ItemOverlay } from "./ItemOverlay.js";
import { Marquee } from "./Marquee.js";
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
  activeRowId: string | undefined;
  selectedDates: ReadonlySet<DateKey>;
  errorDescriptionId?: string | undefined;
  errorItemId?: string | undefined;
  activeFragmentId: string | undefined;
  selectedItemIds: ReadonlySet<string>;
  selection: PlannerSelection;
  previews: readonly PreviewLayer[];
  touchAction: "none" | "auto";
  pendingItemIds: ReadonlySet<string>;
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
  textPrimary: string;
  textInverse: string;
  globalReadOnly: boolean;
  ariaLabel: string;
  ariaDescribedBy?: string | undefined;
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
  onSelectItem: (
    itemId: string,
    event: {
      shiftKey?: boolean;
      ctrlKey?: boolean;
      metaKey?: boolean;
      target?: EventTarget | null;
    },
  ) => void;
  onItemKeyDown: (itemId: string, event: KeyboardEvent<HTMLElement>) => void;
  onDoubleClickItem: (itemId: string) => void;
  onGridKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  onPointerDown: (event: PointerEvent<HTMLElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLElement>) => void;
  onPointerCancel: (event: PointerEvent<HTMLElement>) => void;
  onLostPointerCapture: (event: PointerEvent<HTMLElement>) => void;
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
 * Renders the ARIA grid, sticky header/footer and the item overlay.
 *
 * The item overlay is a sibling of `role="grid"`. Keeping item buttons outside
 * the grid preserves the row/gridcell contract while the overlay still aligns
 * to the same row geometry.
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
  activeRowId,
  selectedDates,
  errorDescriptionId,
  errorItemId,
  activeFragmentId,
  selectedItemIds,
  selection,
  previews,
  touchAction,
  pendingItemIds,
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
  textPrimary,
  textInverse,
  globalReadOnly,
  ariaLabel,
  ariaDescribedBy,
  onFocusDate,
  onCellKeyDown,
  onSelectDate,
  onSelectItem,
  onItemKeyDown,
  onDoubleClickItem,
  onGridKeyDown,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onLostPointerCapture,
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
    <div className="yp-grid-surface" data-yp-part="grid-surface">
      {/* biome-ignore lint/a11y/useSemanticElements: the CSS grid implements the ARIA grid layout */}
      <div
        className="yp-grid"
        role="grid"
        style={{ touchAction }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onLostPointerCapture={onLostPointerCapture}
        onKeyDown={onGridKeyDown}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-rowcount={layout.rows.length + 2}
        aria-colcount={37}
        aria-multiselectable="true"
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
          // Only the row that owns the active date receives it, so a focus
          // change never re-renders every month row.
          const rowActiveDate =
            activeDate && activeDate >= row.firstDate && activeDate < row.endDateExclusive
              ? activeDate
              : undefined;
          return (
            <MonthRow
              key={row.rowId}
              row={row}
              ribbonRow={ribbonRow}
              formatters={formatters}
              zoom={zoom}
              bandWidth={bandWidth}
              totalDayWidth={layout.totalDayWidth}
              itemsByDate={itemsByDate}
              activeDate={rowActiveDate}
              selectedDates={selectedDates}
              selection={selection}
              previews={previewsForRow(previews, row)}
              showISOWeekNumbers={showISOWeekNumbers}
              getDateMeta={getDateMeta}
              renderCell={renderCell}
              components={components}
              onFocusDate={onFocusDate}
              onCellKeyDown={onCellKeyDown}
              onSelectDate={onSelectDate}
            />
          );
        })}
        {previews.map((entry) =>
          entry.preview.kind === "marquee" ? (
            <Marquee
              key={entry.key}
              rect={entry.preview.rect}
              zoom={zoom}
              bandWidth={bandWidth}
              headerHeight={layout.headerHeight}
            />
          ) : null,
        )}
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
      {/* biome-ignore lint/a11y/noStaticElementInteractions: the overlay is a presentation wrapper; its children are real buttons */}
      <div
        className="yp-item-overlay"
        data-yp-part="item-overlay"
        role="presentation"
        style={{ touchAction }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onLostPointerCapture={onLostPointerCapture}
        onKeyDown={onGridKeyDown}
      >
        <ItemOverlay
          layout={layout}
          ribbons={ribbons}
          layers={layers}
          items={items}
          formatters={formatters}
          zoom={zoom}
          bandWidth={bandWidth}
          selectedItemIds={selectedItemIds}
          pendingItemIds={pendingItemIds}
          activeFragmentId={activeFragmentId}
          activeRowId={activeRowId}
          previews={previews}
          showAnnotations={showAnnotations}
          components={components}
          displayTimeZone={displayTimeZone}
          textPrimary={textPrimary}
          textInverse={textInverse}
          globalReadOnly={globalReadOnly}
          errorDescriptionId={errorDescriptionId}
          errorItemId={errorItemId}
          renderItem={renderItem}
          renderAnnotation={renderAnnotation}
          renderOverflow={renderOverflow}
          renderTooltip={renderTooltip}
          onSelectItem={onSelectItem}
          onFocusItem={onFocusItem}
          onItemKeyDown={onItemKeyDown}
          onDoubleClickItem={onDoubleClickItem}
        />
      </div>
    </div>
  );
}
