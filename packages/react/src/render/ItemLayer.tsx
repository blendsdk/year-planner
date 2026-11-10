import type {
  PlannerItem,
  PlannerLayer,
  RibbonFragment,
  RibbonRow,
} from "@blendsdk/year-planner-core";
import { type CSSProperties, type ReactNode, useEffect, useId, useState } from "react";
import { scaleFragment } from "../geometry.js";
import type { PlannerFormatters } from "../locale.js";
import { safeCssColor, safeItemStyle } from "../safeStyle.js";
import type {
  AnnotationRenderContext,
  ItemRenderContext,
  TooltipRenderContext,
  YearPlannerComponents,
} from "../types.js";
import { Tooltip, type TooltipState } from "./Tooltip.js";

/** Props for the item/fragment layer of one month row. */
export interface ItemLayerProps {
  row: RibbonRow;
  layers: ReadonlyMap<string, PlannerLayer>;
  items: ReadonlyMap<string, PlannerItem>;
  formatters: PlannerFormatters;
  zoom: number;
  showAnnotations: boolean;
  selectedItemIds: ReadonlySet<string>;
  pendingItemIds: ReadonlySet<string>;
  activeItemId: string | undefined;
  activeFragmentId: string | undefined;
  components: YearPlannerComponents;
  displayTimeZone: string;
  globalReadOnly: boolean;
  renderItem?: ((context: ItemRenderContext) => ReactNode) | undefined;
  renderAnnotation?: ((context: AnnotationRenderContext) => ReactNode) | undefined;
  renderTooltip?: ((context: TooltipRenderContext) => ReactNode) | undefined;
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
  pendingItemIds,
  activeItemId,
  activeFragmentId,
  components,
  displayTimeZone,
  globalReadOnly,
  renderItem,
  renderAnnotation,
  renderTooltip,
  onSelectItem,
  onFocusItem,
}: ItemLayerProps): ReactNode {
  const ItemFragment = components.ItemFragment;
  const [tooltip, setTooltip] = useState<TooltipState | undefined>(undefined);
  const tooltipId = useId();

  useEffect(() => {
    if (!tooltip) return;
    if (row.fragments.some((entry) => entry.itemId === tooltip.item.id)) return;
    setTooltip(undefined);
  }, [row.fragments, tooltip]);
  const counts = new Map<string, number>();
  for (const fragment of row.fragments) {
    counts.set(fragment.itemId, (counts.get(fragment.itemId) ?? 0) + 1);
  }
  const indices = new Map<string, number>();
  const fragments = row.fragments.map((fragment) => {
    const item = items.get(fragment.itemId);
    const layer = item ? layers.get(item.layerId) : undefined;
    if (!item || !layer) return null;
    if (fragment.channel === "annotation" && !showAnnotations) return null;
    if (fragment.channel === "ribbon" && fragment.lane >= row.visibleLaneCount) return null;
    const scaled = scaleFragment(fragment, zoom);
    const selected = selectedItemIds.has(item.id);
    const index = indices.get(item.id) ?? 0;
    indices.set(item.id, index + 1);
    const label = itemLabel(item);
    const periodLabel = formatters.formatPeriod(item.period, displayTimeZone);
    const annotationBackground =
      fragment.channel === "annotation" ? item.annotation?.background : undefined;
    const background =
      safeCssColor(item.color) ?? safeCssColor(annotationBackground) ?? safeCssColor(layer.color);
    const textColor = safeCssColor(item.textColor);
    const sharedStyle: CSSProperties = {
      left: scaled.x,
      top: scaled.y,
      width: Math.max(1, scaled.width),
      height: Math.max(1, scaled.height),
      ...safeItemStyle(item.style),
      ...(background ? { background } : {}),
      ...(textColor ? { color: textColor } : {}),
      ...(fragment.channel === "background" || fragment.channel === "highlight"
        ? { opacity: 0.45 * (layer.opacity ?? 1) }
        : layer.opacity !== undefined
          ? { opacity: layer.opacity }
          : {}),
      ...(fragment.channel === "annotation"
        ? { zIndex: 4 + (item.annotation?.priority ?? 0) }
        : {}),
      ...(fragment.channel === "foreground" ? { zIndex: 5 } : {}),
    };

    if (fragment.channel === "background" || fragment.channel === "highlight") {
      return (
        <div
          key={fragment.fragmentId}
          data-yp-part="item-fragment"
          data-item-id={item.id}
          data-yp-channel={fragment.channel}
          data-yp-layer={layer.id}
          data-yp-layer-label={layer.label ?? layer.name}
          className={`yp-fragment yp-fragment-${fragment.channel} yp-pattern-${layer.pattern ?? "solid"} ${item.className ?? ""}`}
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
        globalReadOnly ||
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
        data-yp-layer-label={layer.label ?? layer.name}
        data-yp-selected={selected ? "true" : "false"}
        data-yp-pending={pendingItemIds.has(item.id) ? "true" : "false"}
        className={`yp-fragment yp-fragment-${fragment.channel} yp-pattern-${layer.pattern ?? "solid"} ${item.className ?? ""}`}
        style={sharedStyle}
      >
        {/* biome-ignore lint/a11y/useSemanticElements: the proxy must contain non-interactive host content and remain a div */}
        <div
          role="button"
          tabIndex={fragment.fragmentId === activeFragmentId ? 0 : -1}
          aria-pressed={selected}
          aria-busy={pendingItemIds.has(item.id) ? "true" : undefined}
          aria-describedby={tooltip?.item.id === item.id ? tooltipId : undefined}
          aria-label={`${label}, ${layer.label ?? layer.name}, ${periodLabel}`}
          title={`${label} (${layer.label ?? layer.name})`}
          data-yp-part="item-proxy"
          data-item-id={item.id}
          className="yp-proxy"
          onFocus={(event) => {
            onFocusItem(item.id);
            const rect = event.currentTarget.getBoundingClientRect();
            setTooltip({ item, fragment, x: rect.left, y: rect.bottom + 4 });
          }}
          onMouseEnter={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            setTooltip({ item, fragment, x: rect.left, y: rect.bottom + 4 });
          }}
          onMouseLeave={() => setTooltip(undefined)}
          onBlur={() => setTooltip(undefined)}
          onClick={(event) => {
            event.stopPropagation();
            onSelectItem(item.id);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setTooltip(undefined);
              return;
            }
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onSelectItem(item.id);
              return;
            }
            const move =
              event.key === "ArrowRight" || event.key === "ArrowDown"
                ? 1
                : event.key === "ArrowLeft" || event.key === "ArrowUp"
                  ? -1
                  : 0;
            if (move === 0) return;
            event.preventDefault();
            const root = event.currentTarget.closest(".yp-root");
            const proxies = root?.querySelectorAll<HTMLElement>('[data-yp-part="item-proxy"]');
            if (!proxies) return;
            const list = Array.from(proxies);
            const position = list.indexOf(event.currentTarget);
            const target = list[(position + move + list.length) % list.length];
            target?.focus();
          }}
        >
          {ItemFragment ? (
            <ItemFragment className="yp-item-slot">
              <span className="yp-item-label">
                {annotationLabel(item, fragment, renderAnnotation, label)}
              </span>
              {fragment.channel !== "annotation" && renderItem?.(context)}
            </ItemFragment>
          ) : (
            <>
              <span className="yp-item-label">
                {annotationLabel(item, fragment, renderAnnotation, label)}
              </span>
              {fragment.channel !== "annotation" && renderItem?.(context)}
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
  return (
    <>
      {fragments}
      {tooltip && (
        <Tooltip
          id={tooltipId}
          state={tooltip}
          formatters={formatters}
          displayTimeZone={displayTimeZone}
          components={components}
          renderTooltip={renderTooltip}
        />
      )}
    </>
  );
}

function annotationLabel(
  item: PlannerItem,
  fragment: RibbonFragment,
  renderAnnotation: ((context: AnnotationRenderContext) => ReactNode) | undefined,
  fallback: string,
): ReactNode {
  if (fragment.channel !== "annotation") return fallback;
  if (renderAnnotation) return renderAnnotation({ item, fragment });
  return item.annotation?.label ?? fallback;
}
