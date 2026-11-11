import type {
  MonthRowLayout,
  PlannerItem,
  PlannerLayer,
  RibbonLayout,
} from "@blendsdk/year-planner-core";
import type { KeyboardEvent, ReactNode } from "react";
import { scaledRowHeight } from "../geometry.js";
import type { PreviewLayer } from "../interaction/preview.js";
import type { PlannerFormatters } from "../locale.js";
import { safeCssColor } from "../safeStyle.js";
import type {
  AnnotationRenderContext,
  ItemRenderContext,
  OverflowRenderContext,
  TooltipRenderContext,
  YearPlannerComponents,
} from "../types.js";
import { ItemLayer } from "./ItemLayer.js";
import { Overflow } from "./Overflow.js";
import { SelectionPreview } from "./SelectionPreview.js";

/** Props for the item overlay that sits above the ARIA grid. */
export interface ItemOverlayProps {
  layout: { rows: readonly MonthRowLayout[]; headerHeight: number; totalDayWidth: number };
  ribbons: RibbonLayout;
  layers: ReadonlyMap<string, PlannerLayer>;
  items: ReadonlyMap<string, PlannerItem>;
  formatters: PlannerFormatters;
  zoom: number;
  bandWidth: number;
  selectedItemIds: ReadonlySet<string>;
  pendingItemIds: ReadonlySet<string>;
  activeFragmentId: string | undefined;
  activeRowId: string | undefined;
  previews: readonly PreviewLayer[];
  showAnnotations: boolean;
  components: YearPlannerComponents;
  displayTimeZone: string;
  textPrimary: string;
  textInverse: string;
  globalReadOnly: boolean;
  errorDescriptionId?: string | undefined;
  errorItemId?: string | undefined;
  renderItem?: ((context: ItemRenderContext) => ReactNode) | undefined;
  renderAnnotation?: ((context: AnnotationRenderContext) => ReactNode) | undefined;
  renderOverflow?: ((context: OverflowRenderContext) => ReactNode) | undefined;
  renderTooltip?: ((context: TooltipRenderContext) => ReactNode) | undefined;
  onSelectItem: (
    itemId: string,
    event: {
      shiftKey?: boolean;
      ctrlKey?: boolean;
      metaKey?: boolean;
      target?: EventTarget | null;
    },
  ) => void;
  onFocusItem: (itemId: string) => void;
  onItemKeyDown: (itemId: string, event: KeyboardEvent<HTMLElement>) => void;
  onDoubleClickItem: (itemId: string) => void;
}

/**
 * Renders item fragments, gesture previews and overflow above the ARIA grid.
 *
 * The overlay is a sibling of `role="grid"`, not a child. This keeps the grid
 * row contract valid while item proxies stay focusable buttons.
 */
export function ItemOverlay({
  layout,
  ribbons,
  layers,
  items,
  formatters,
  zoom,
  bandWidth,
  selectedItemIds,
  pendingItemIds,
  activeFragmentId,
  activeRowId,
  previews,
  showAnnotations,
  components,
  displayTimeZone,
  textPrimary,
  textInverse,
  globalReadOnly,
  errorDescriptionId,
  errorItemId,
  renderItem,
  renderAnnotation,
  renderOverflow,
  renderTooltip,
  onSelectItem,
  onFocusItem,
  onItemKeyDown,
  onDoubleClickItem,
}: ItemOverlayProps): ReactNode {
  const rows = layout.rows;
  let top = layout.headerHeight;
  return (
    <>
      {rows.map((row, index) => {
        const ribbonRow = ribbons.rows[index];
        if (!ribbonRow) return null;
        const height = scaledRowHeight(ribbonRow.height, zoom);
        const rowTop = top;
        top += height;
        return (
          <div
            key={row.rowId}
            className="yp-item-layer"
            data-yp-part="item-layer"
            data-yp-row-id={row.rowId}
            style={{
              top: rowTop,
              left: bandWidth * zoom,
              width: layout.totalDayWidth * zoom,
              height,
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
              errorDescriptionId={errorDescriptionId}
              errorItemId={errorItemId}
              activeFragmentId={activeFragmentId}
              components={components}
              renderItem={renderItem}
              renderAnnotation={renderAnnotation}
              renderTooltip={renderTooltip}
              displayTimeZone={displayTimeZone}
              textPrimary={textPrimary}
              textInverse={textInverse}
              globalReadOnly={globalReadOnly}
              onSelectItem={onSelectItem}
              onFocusItem={onFocusItem}
              onItemKeyDown={onItemKeyDown}
              onDoubleClickItem={onDoubleClickItem}
            />
            {previews.map((entry) =>
              entry.preview.kind !== "selection" && entry.preview.kind !== "marquee" ? (
                <SelectionPreview
                  key={entry.key}
                  ranges={entry.preview.ranges}
                  row={row}
                  zoom={zoom}
                  bandWidth={0}
                  totalDayWidth={layout.totalDayWidth}
                  height={height}
                  variant="gesture-preview"
                  previewKind={entry.preview.variant}
                  itemId={entry.preview.kind === "item" ? entry.preview.itemId : undefined}
                  layerId={entry.preview.layerId}
                  color={
                    entry.preview.layerId
                      ? safeCssColor(layers.get(entry.preview.layerId)?.color)
                      : undefined
                  }
                  valid={entry.preview.valid}
                />
              ) : null,
            )}
            <Overflow
              row={row}
              ribbonRow={ribbonRow}
              items={items}
              formatters={formatters}
              displayTimeZone={displayTimeZone}
              renderOverflow={renderOverflow}
              active={row.rowId === activeRowId}
              onSelectItem={(itemId) => onSelectItem(itemId, {})}
              onFocusItem={onFocusItem}
            />
          </div>
        );
      })}
    </>
  );
}
