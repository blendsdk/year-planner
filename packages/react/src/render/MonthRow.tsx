import type {
  DateKey,
  MonthRowLayout,
  PlannerSelection,
  RibbonRow,
} from "@blendsdk/year-planner-core";
import { type KeyboardEvent, memo, type ReactNode } from "react";
import { rowTemplate, scaledRowHeight } from "../geometry.js";
import { type PreviewLayer, samePreviewEntries } from "../interaction/preview.js";
import type { PlannerFormatters } from "../locale.js";
import type {
  CellRenderContext,
  DateMeta,
  DateMetaContext,
  YearPlannerComponents,
} from "../types.js";
import { CellLayer } from "./CellLayer.js";
import { SelectionPreview } from "./SelectionPreview.js";

/**
 * Props for one interactive month row.
 */
export interface MonthRowProps {
  row: MonthRowLayout;
  ribbonRow: RibbonRow;
  formatters: PlannerFormatters;
  zoom: number;
  bandWidth: number;
  totalDayWidth: number;
  itemsByDate: ReadonlyMap<DateKey, readonly string[]>;
  activeDate: DateKey | undefined;
  selectedDates: ReadonlySet<DateKey>;
  selection: PlannerSelection;
  /** Serialized selection content that intersects this row. */
  selectionKey: string;
  previews: readonly PreviewLayer[];
  showISOWeekNumbers: boolean;
  getDateMeta?: ((date: DateKey, context: DateMetaContext) => DateMeta | undefined) | undefined;
  renderCell?: ((context: CellRenderContext) => ReactNode) | undefined;
  components: YearPlannerComponents;
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
}

/** Compares every row prop, treating previews as equal by render content. */
function monthRowPropsEqual(previous: MonthRowProps, next: MonthRowProps): boolean {
  if (
    previous.row !== next.row ||
    previous.ribbonRow !== next.ribbonRow ||
    previous.formatters !== next.formatters ||
    previous.zoom !== next.zoom ||
    previous.bandWidth !== next.bandWidth ||
    previous.totalDayWidth !== next.totalDayWidth ||
    previous.itemsByDate !== next.itemsByDate ||
    previous.activeDate !== next.activeDate ||
    previous.selectionKey !== next.selectionKey ||
    previous.showISOWeekNumbers !== next.showISOWeekNumbers ||
    previous.getDateMeta !== next.getDateMeta ||
    previous.renderCell !== next.renderCell ||
    previous.components !== next.components ||
    previous.onFocusDate !== next.onFocusDate ||
    previous.onCellKeyDown !== next.onCellKeyDown ||
    previous.onSelectDate !== next.onSelectDate
  ) {
    return false;
  }
  return samePreviewEntries(previous.previews, next.previews);
}

/**
 * Renders one month row with bands, date cells and selection previews. Item
 * fragments live in the overlay sibling so the ARIA row owns only grid cells.
 * Rows whose previews did not change skip rendering during a gesture.
 */
export const MonthRow = memo(function MonthRow({
  row,
  ribbonRow,
  formatters,
  zoom,
  bandWidth,
  totalDayWidth,
  itemsByDate,
  activeDate,
  selectedDates,
  selection,
  selectionKey: _selectionKey,
  previews,
  showISOWeekNumbers,
  getDateMeta,
  renderCell,
  components,
  onFocusDate,
  onCellKeyDown,
  onSelectDate,
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
      <div className={`yp-month ${row.kind === "context" ? "yp-context" : ""}`} aria-hidden="true">
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
      {previews.map((entry) =>
        entry.preview.kind === "selection" ? (
          <SelectionPreview
            key={entry.key}
            ranges={entry.preview.ranges}
            row={row}
            zoom={zoom}
            bandWidth={bandWidth}
            totalDayWidth={totalDayWidth}
            height={scaledRowHeight(ribbonRow.height, zoom)}
            variant="selection-preview"
          />
        ) : null,
      )}
      <CellLayer
        row={row}
        itemsByDate={itemsByDate}
        formatters={formatters}
        activeDate={activeDate}
        selectedDates={selectedDates}
        showISOWeekNumbers={showISOWeekNumbers}
        getDateMeta={getDateMeta}
        renderCell={renderCell}
        components={components}
        onFocusDate={onFocusDate}
        onCellKeyDown={onCellKeyDown}
        onSelectDate={onSelectDate}
      />
      <div className={`yp-month ${row.kind === "context" ? "yp-context" : ""}`} aria-hidden="true">
        {MonthLabel ? <MonthLabel className="yp-month-slot">{label}</MonthLabel> : label}
      </div>
    </div>
  );
}, monthRowPropsEqual);
