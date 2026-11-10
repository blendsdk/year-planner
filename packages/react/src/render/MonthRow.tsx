import type {
  DateKey,
  MonthRowLayout,
  PlannerItem,
  PlannerLayer,
  PlannerSelection,
  RibbonRow,
} from "@blendsdk/year-planner-core";
import type { KeyboardEvent, ReactNode } from "react";
import { rowTemplate, scaledRowHeight } from "../geometry.js";
import type { GesturePreview } from "../interaction/preview.js";
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
import { SelectionPreview } from "./SelectionPreview.js";

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
  activeFragmentId: string | undefined;
  selectedItemIds: ReadonlySet<string>;
  pendingItemIds: ReadonlySet<string>;
  selection: PlannerSelection;
  preview: GesturePreview | undefined;
  showISOWeekNumbers: boolean;
  showAnnotations: boolean;
  getDateMeta?: ((date: DateKey, context: DateMetaContext) => DateMeta | undefined) | undefined;
  renderCell?: ((context: CellRenderContext) => ReactNode) | undefined;
  renderItem?: ((context: ItemRenderContext) => ReactNode) | undefined;
  components: YearPlannerComponents;
  displayTimeZone: string;
  globalReadOnly: boolean;
  renderAnnotation?: ((context: AnnotationRenderContext) => ReactNode) | undefined;
  renderOverflow?: ((context: OverflowRenderContext) => ReactNode) | undefined;
  renderTooltip?: ((context: TooltipRenderContext) => ReactNode) | undefined;
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
  activeFragmentId,
  selectedItemIds,
  pendingItemIds,
  selection,
  preview,
  showISOWeekNumbers,
  showAnnotations,
  getDateMeta,
  renderCell,
  renderItem,
  components,
  displayTimeZone,
  globalReadOnly,
  renderAnnotation,
  renderOverflow,
  renderTooltip,
  onFocusDate,
  onCellKeyDown,
  onSelectDate,
  onSelectItem,
  onItemKeyDown,
  onDoubleClickItem,
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
      <SelectionPreview
        ranges={selection.dates}
        row={row}
        zoom={zoom}
        bandWidth={bandWidth}
        totalDayWidth={totalDayWidth}
        height={scaledRowHeight(ribbonRow.height, zoom)}
        variant="selection"
      />
      {preview?.kind === "selection" && (
        <SelectionPreview
          ranges={preview.ranges}
          row={row}
          zoom={zoom}
          bandWidth={bandWidth}
          totalDayWidth={totalDayWidth}
          height={scaledRowHeight(ribbonRow.height, zoom)}
          variant="selection-preview"
        />
      )}
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
        onCellKeyDown={onCellKeyDown}
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
          activeFragmentId={activeFragmentId}
          components={components}
          renderItem={renderItem}
          renderAnnotation={renderAnnotation}
          renderTooltip={renderTooltip}
          displayTimeZone={displayTimeZone}
          globalReadOnly={globalReadOnly}
          onSelectItem={onSelectItem}
          onFocusItem={onFocusItem}
          onItemKeyDown={onItemKeyDown}
          onDoubleClickItem={onDoubleClickItem}
        />
        {preview && preview.kind !== "selection" && preview.kind !== "marquee" && (
          <SelectionPreview
            ranges={preview.ranges}
            row={row}
            zoom={zoom}
            bandWidth={bandWidth}
            totalDayWidth={totalDayWidth}
            height={scaledRowHeight(ribbonRow.height, zoom)}
            variant="gesture-preview"
            itemId={preview.kind === "item" ? preview.itemId : undefined}
            layerId={preview.layerId}
            color={preview.layerId ? layers.get(preview.layerId)?.color : undefined}
            valid={preview.valid}
          />
        )}
        <Overflow
          row={row}
          ribbonRow={ribbonRow}
          items={items}
          formatters={formatters}
          displayTimeZone={displayTimeZone}
          renderOverflow={renderOverflow}
          onSelectItem={(itemId) => onSelectItem(itemId, {})}
          onFocusItem={onFocusItem}
        />
      </div>
      <div className={`yp-month ${row.kind === "context" ? "yp-context" : ""}`} aria-hidden="true">
        {MonthLabel ? <MonthLabel className="yp-month-slot">{label}</MonthLabel> : label}
      </div>
    </div>
  );
}
