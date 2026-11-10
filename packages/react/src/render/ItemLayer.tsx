import type { PlannerItem, PlannerLayer, RibbonRow } from "@blendsdk/year-planner-core";
import type { CSSProperties, ReactNode } from "react";
import { scaleFragment } from "../geometry.js";
import type { PlannerFormatters } from "../locale.js";
import { safeItemStyle } from "../safeStyle.js";
import type { ItemRenderContext, YearPlannerComponents } from "../types.js";

/** Props for the item/fragment layer of one month row. */
export interface ItemLayerProps {
  row: RibbonRow;
  layers: ReadonlyMap<string, PlannerLayer>;
  items: ReadonlyMap<string, PlannerItem>;
  formatters: PlannerFormatters;
  zoom: number;
  showAnnotations: boolean;
  selectedItemIds: ReadonlySet<string>;
  activeItemId: string | undefined;
  components: YearPlannerComponents;
  renderItem?: ((context: ItemRenderContext) => ReactNode) | undefined;
  onSelectItem: (itemId: string) => void;
  onFocusItem: (itemId: string) => void;
}

function itemLabel(item: PlannerItem): string {
  return item.title ?? item.id;
}

/**
 * Renders visible fragments for one row.
 *
 * Backdrop channels never take focus or pointer events. Ribbon, annotation and
 * foreground fragments expose a focusable proxy and sibling resize handles.
 */
export function ItemLayer({
  row,
  layers,
  items,
  formatters,
  zoom,
  showAnnotations,
  selectedItemIds,
  activeItemId,
  components,
  renderItem,
  onSelectItem,
  onFocusItem,
}: ItemLayerProps): ReactNode {
  const ItemFragment = components.ItemFragment;
  const counts = new Map<string, number>();
  for (const fragment of row.fragments) {
    counts.set(fragment.itemId, (counts.get(fragment.itemId) ?? 0) + 1);
  }
  const indices = new Map<string, number>();
  return row.fragments.map((fragment) => {
    const item = items.get(fragment.itemId);
    const layer = item ? layers.get(item.layerId) : undefined;
    if (!item || !layer) return null;
    if (fragment.channel === "annotation" && !showAnnotations) return null;
    const scaled = scaleFragment(fragment, zoom);
    const selected = selectedItemIds.has(item.id);
    const index = indices.get(item.id) ?? 0;
    indices.set(item.id, index + 1);
    const label = itemLabel(item);
    const periodLabel = formatters.formatPeriod(item.period, "UTC");
    const sharedStyle: CSSProperties = {
      left: scaled.x,
      top: scaled.y,
      width: Math.max(1, scaled.width),
      height: Math.max(1, scaled.height),
      ...safeItemStyle(item.style),
      ...(item.color ? { background: item.color } : {}),
      ...(item.textColor ? { color: item.textColor } : {}),
      ...(layer.opacity !== undefined ? { opacity: layer.opacity } : {}),
    };

    if (fragment.channel === "background" || fragment.channel === "highlight") {
      return (
        <div
          key={fragment.fragmentId}
          data-yp-part="item-fragment"
          data-item-id={item.id}
          data-yp-channel={fragment.channel}
          data-yp-layer={layer.id}
          className={`yp-fragment yp-fragment-${fragment.channel} yp-pattern-${layer.pattern ?? "solid"}`}
          style={{ ...sharedStyle, top: 0, height: row.height * zoom }}
          aria-hidden="true"
        />
      );
    }

    const context: ItemRenderContext = {
      item,
      fragment,
      fragmentIndex: index,
      fragmentCount: counts.get(item.id) ?? 1,
      selected,
      readOnly:
        item.readOnly === true ||
        item.locked === true ||
        layer.locked === true ||
        layer.readOnly === true,
    };
    return (
      <div
        key={fragment.fragmentId}
        data-yp-part="item-fragment"
        data-item-id={item.id}
        data-fragment-index={index}
        data-yp-channel={fragment.channel}
        data-yp-layer={layer.id}
        data-yp-selected={selected ? "true" : "false"}
        className={`yp-fragment yp-fragment-${fragment.channel} yp-pattern-${layer.pattern ?? "solid"}`}
        style={sharedStyle}
      >
        {/* biome-ignore lint/a11y/useSemanticElements: the proxy must contain non-interactive host content and remain a div */}
        <div
          role="button"
          tabIndex={item.id === activeItemId ? 0 : -1}
          aria-pressed={selected}
          aria-label={`${label}, ${periodLabel}`}
          data-yp-part="item-proxy"
          data-item-id={item.id}
          className="yp-proxy"
          onFocus={() => onFocusItem(item.id)}
          onClick={(event) => {
            event.stopPropagation();
            onSelectItem(item.id);
          }}
          onKeyDown={(event) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            onSelectItem(item.id);
          }}
        >
          {ItemFragment ? (
            <ItemFragment className="yp-item-slot">
              <span className="yp-item-label">{label}</span>
              {renderItem?.(context)}
            </ItemFragment>
          ) : (
            <>
              <span className="yp-item-label">{label}</span>
              {renderItem?.(context)}
            </>
          )}
        </div>
        <button
          type="button"
          data-yp-part="resize-start"
          tabIndex={-1}
          aria-label="Resize start"
          className="yp-resize-handle yp-resize-start"
        />
        <button
          type="button"
          data-yp-part="resize-end"
          tabIndex={-1}
          aria-label="Resize end"
          className="yp-resize-handle yp-resize-end"
        />
      </div>
    );
  });
}
