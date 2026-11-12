import type { PlannerSelection } from "../contracts.js";

/**
 * Returns an empty selection with every required list present.
 * @public
 */
export function emptySelection(): PlannerSelection {
  return { dates: [], items: [] };
}

/**
 * Returns unique selected item IDs in first-seen order.
 *
 * @param selection - Selection to inspect.
 * @returns Deduplicated item IDs; an empty array for `undefined`.
 * @public
 */
export function selectionItemIds(selection: PlannerSelection | undefined): string[] {
  if (!selection) return [];
  return [...new Set(selection.items)];
}
