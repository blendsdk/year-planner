import {
  type PlannerFilter,
  type PlannerItem,
  type PlannerModel,
  type PlannerSelection,
  resolveItemVisibility,
  type VisibilityState,
} from "@blendsdk/year-planner-core";
import type { ReactNode, RefObject } from "react";
import type { PlannerFormatters } from "../locale.js";

/**
 * Props for the planner-owned item list.
 */
export interface ItemListProps {
  /** Planner model with layers and items. */
  model: PlannerModel;
  /** Group, layer and item visibility. */
  visibility: VisibilityState;
  /** Active filter. */
  filter: PlannerFilter;
  /** Current selection, used for `aria-pressed`. */
  selection: PlannerSelection;
  /** Localized formatter set. */
  formatters: PlannerFormatters;
  /** Display time zone for timed items. */
  displayTimeZone: string;
  /** Item IDs with at least one rendered fragment in the current window. */
  renderedItemIds: ReadonlySet<string>;
  /** Items hidden by the active month row’s lane limit. */
  overflowItemIds: ReadonlySet<string>;
  /** Stable id used by the skip link. */
  listId: string;
  /** Focus target for the skip link. */
  listRef?: RefObject<HTMLElement | null> | undefined;
  /** Selects an item from the list. */
  onSelectItem: (itemId: string) => void;
  /** Focuses an item’s first visible proxy, or falls back to a date. */
  onFocusItem: (itemId: string) => void;
}

function periodStart(item: PlannerItem): string {
  return item.period.kind === "all-day" ? item.period.startDate : item.period.start.slice(0, 10);
}

function titleOf(item: PlannerItem): string {
  return item.title ?? item.id;
}

/**
 * Renders the keyboard-reachable list of effectively visible items.
 *
 * The list is independent of the grid cell count, so a 36-month window keeps
 * the same item-driven length. Hidden items never enter the list. Items hidden
 * by the active row’s lane limit are marked so the overflow path is explicit.
 *
 * @example
 * ```tsx
 * <ItemList
 *   model={model}
 *   visibility={visibility}
 *   filter={filter}
 *   selection={selection}
 *   formatters={formatters}
 *   displayTimeZone="UTC"
 *   overflowItemIds={overflowItemIds}
 *   listId="planner-items"
 *   onSelectItem={selectItem}
 *   onFocusItem={focusItem}
 * />
 * ```
 */
export function ItemList({
  model,
  visibility,
  filter,
  selection,
  formatters,
  displayTimeZone,
  renderedItemIds,
  overflowItemIds,
  listId,
  listRef,
  onSelectItem,
  onFocusItem,
}: ItemListProps): ReactNode {
  const selected = new Set(selection.items);
  const layerById = new Map(model.layers.map((layer) => [layer.id, layer]));
  const visibilityById = resolveItemVisibility({ model, visibility, filter });
  const visible = model.items
    .filter((item) => renderedItemIds.has(item.id) && visibilityById.get(item.id)?.visible === true)
    .sort((left, right) => {
      const byStart = periodStart(left).localeCompare(periodStart(right));
      if (byStart !== 0) return byStart;
      const byTitle = titleOf(left).localeCompare(titleOf(right));
      return byTitle !== 0 ? byTitle : left.id.localeCompare(right.id);
    });
  const headingId = `${listId}-heading`;

  return (
    <section
      id={listId}
      ref={listRef}
      tabIndex={-1}
      className="yp-inspector-items"
      data-yp-part="item-list"
      aria-labelledby={headingId}
    >
      <h3 id={headingId}>All visible items ({visible.length})</h3>
      {visible.length === 0 ? (
        <p className="yp-inspector-note">No visible items</p>
      ) : (
        <ul className="yp-item-list-entries">
          {visible.map((item) => {
            const layer = layerById.get(item.layerId);
            const layerName = layer?.label ?? layer?.name ?? item.layerId;
            const periodLabel = formatters.formatPeriod(item.period, displayTimeZone);
            const overflow = overflowItemIds.has(item.id);
            const title = titleOf(item);
            const label = `${title}, ${periodLabel}, ${layerName}${overflow ? ", hidden on this month" : ""}`;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  className="yp-item-list-entry"
                  data-yp-part="item-list-entry"
                  data-yp-item-id={item.id}
                  aria-pressed={selected.has(item.id)}
                  aria-label={label}
                  onClick={() => {
                    onSelectItem(item.id);
                    onFocusItem(item.id);
                  }}
                >
                  <span>{title}</span> <small>{periodLabel}</small>{" "}
                  <small className="yp-item-list-layer">{layerName}</small>
                  {overflow && (
                    <>
                      {" "}
                      <em className="yp-item-list-overflow">hidden on this month</em>
                    </>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
