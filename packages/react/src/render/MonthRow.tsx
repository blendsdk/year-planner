import type {
  DateKey,
  MonthRowLayout,
  PlannerItem,
  PlannerLayer,
  RibbonRow,
} from "@blendsdk/year-planner-core";
import type { ReactNode } from "react";
import { rowTemplate, scaledRowHeight } from "../geometry.js";
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
import { CellLayer } from "./CellLayer.js";
import { ItemLayer } from "./ItemLayer.js";
import { Overflow } from "./Overflow.js";

/** Props for one interactive month row. */
export interface MonthRowProps {
  row: MonthRowLayout;
  ribbonRow: RibbonRow;
  formatters: PlannerFormatters;
  zoom: number;
  bandWidth: number;
  totalDayWidth: number;
  layers: ReadonlyMap<string, PlannerLayer>;
  items: ReadonlyMap<string, PlannerItem>;
  itemsByDate: ReadonlyMap<DateKey, readonly string[]>;
  activeDate: DateKey | undefined;
  activeItemId: string | undefined;
  selectedItemIds: ReadonlySet<string>;
  pendingItemIds: ReadonlySet<string>;
  showISOWeekNumbers: boolean;
  showAnnotations: boolean;
  getDateMeta?: ((date: DateKey, context: DateMetaContext) => DateMeta | undefined) | undefined;
  renderCell?: ((context: CellRenderContext) => ReactNode) | undefined;
  renderItem?: ((context: ItemRenderContext) => ReactNode) | undefined;
  components: YearPlannerComponents;
  displayTimeZone: string;
  renderAnnotation?: ((context: AnnotationRenderContext) => ReactNode) | undefined;
  renderOverflow?: ((context: OverflowRenderContext) => ReactNode) | undefined;
  renderTooltip?: ((context: TooltipRenderContext) => ReactNode) | undefined;
  onFocusDate: (date: DateKey) => void;
  onMoveFocus: (date: DateKey, delta: number) => void;
  onSelectDate: (date: DateKey) => void;
  onSelectItem: (itemId: string) => void;
  onFocusItem: (itemId: string) => void;
}

/**
 * Renders one month row with bands, date cells and the absolutely positioned
 * fragment layer. The grid row and item layer share the same geometry.
 */
export function MonthRow({
  row,
  ribbonRow,
  formatters,
  zoom,
  bandWidth,
  totalDayWidth,
  layers,
  items,
  itemsByDate,
  activeDate,
  activeItemId,
  selectedItemIds,
  pendingItemIds,
  showISOWeekNumbers,
  showAnnotations,
  getDateMeta,
  renderCell,
  renderItem,
  components,
  displayTimeZone,
  renderAnnotation,
  renderOverflow,
  renderTooltip,
  onFocusDate,
  onMoveFocus,
  onSelectDate,
  onSelectItem,
  onFocusItem,
}: MonthRowProps): ReactNode {
  const MonthLabel = components.MonthLabel;
  const label = (
    <>
      <span>{formatters.monthName(row.monthIndex)}</span>
      <span>{row.kind === "current" ? `'${String(row.year).slice(-2)}` : row.year}</span>
    </>
  );
  return (
    // biome-ignore lint/a11y/useSemanticElements: CSS grid rows implement the ARIA grid pattern
    <div
      className="yp-row yp-month-row"
      role="row"
      tabIndex={-1}
      data-row-id={row.rowId}
      data-yp-kind={row.kind}
      style={{
        gridTemplateColumns: rowTemplate(row, zoom, bandWidth),
        height: scaledRowHeight(ribbonRow.height, zoom),
      }}
    >
      {/* biome-ignore lint/a11y/useSemanticElements: month bands are row headers in the ARIA grid */}
      <div
        className={`yp-month ${row.kind === "context" ? "yp-context" : ""}`}
        role="rowheader"
        tabIndex={-1}
        aria-label={`${formatters.monthName(row.monthIndex)} ${row.year}`}
      >
        {MonthLabel ? <MonthLabel className="yp-month-slot">{label}</MonthLabel> : label}
      </div>
      <CellLayer
        row={row}
        itemsByDate={itemsByDate}
        formatters={formatters}
        activeDate={activeDate}
        showISOWeekNumbers={showISOWeekNumbers}
        getDateMeta={getDateMeta}
        renderCell={renderCell}
        components={components}
        onFocusDate={onFocusDate}
        onMoveFocus={onMoveFocus}
        onSelectDate={onSelectDate}
      />
      <div
        className="yp-item-layer"
        data-yp-part="item-layer"
        style={{
          left: bandWidth * zoom,
          width: totalDayWidth * zoom,
          height: scaledRowHeight(ribbonRow.height, zoom),
        }}
      >
        <ItemLayer
          row={ribbonRow}
          layers={layers}
          items={items}
          formatters={formatters}
          zoom={zoom}
          showAnnotations={showAnnotations}
          selectedItemIds={selectedItemIds}
          pendingItemIds={pendingItemIds}
          activeItemId={activeItemId}
          components={components}
          renderItem={renderItem}
          renderAnnotation={renderAnnotation}
          renderTooltip={renderTooltip}
          displayTimeZone={displayTimeZone}
          onSelectItem={onSelectItem}
          onFocusItem={onFocusItem}
        />
        <Overflow
          row={row}
          ribbonRow={ribbonRow}
          items={items}
          renderOverflow={renderOverflow}
          onSelectItem={onSelectItem}
          onFocusItem={onFocusItem}
        />
      </div>
      <div className={`yp-month ${row.kind === "context" ? "yp-context" : ""}`} aria-hidden="true">
        {MonthLabel ? <MonthLabel className="yp-month-slot">{label}</MonthLabel> : label}
      </div>
    </div>
  );
}
