import type { RibbonLayout } from "./types.js";

/** One fragment's absolute hit bounds. */
export interface RibbonHitEntry {
  fragmentId: string;
  itemId: string;
  rowId: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Lookup tables for fragment and item hit-testing. */
export interface RibbonHitIndex {
  entries: RibbonHitEntry[];
  byFragmentId: ReadonlyMap<string, RibbonHitEntry>;
  byItemId: ReadonlyMap<string, RibbonHitEntry[]>;
}

/**
 * Builds absolute-coordinate hit bounds for every fragment.
 *
 * Entries are sorted by absolute y, then lane, then x so the last match is the
 * topmost shape.
 *
 * @param ribbon - Ribbon output from `buildRibbonLayout`.
 * @returns Entries plus fragment and item lookup maps.
 */
export function createRibbonHitIndex(ribbon: RibbonLayout): RibbonHitIndex {
  const rows = new Map(ribbon.rows.map((row) => [row.rowId, row]));
  const sorted = ribbon.fragments
    .map((fragment) => {
      const row = rows.get(fragment.rowId);
      return {
        entry: {
          fragmentId: fragment.fragmentId,
          itemId: fragment.itemId,
          rowId: fragment.rowId,
          x: fragment.x,
          y: (row?.top ?? 0) + fragment.y,
          width: fragment.width,
          height: fragment.height,
        },
        lane: fragment.lane,
      };
    })
    .sort((left, right) => {
      if (left.entry.y !== right.entry.y) return left.entry.y - right.entry.y;
      if (left.lane !== right.lane) return left.lane - right.lane;
      return left.entry.x - right.entry.x;
    });
  const entries = sorted.map((item) => item.entry);
  const byFragmentId = new Map(entries.map((entry) => [entry.fragmentId, entry]));
  const byItemId = new Map<string, RibbonHitEntry[]>();
  for (const entry of entries) {
    const list = byItemId.get(entry.itemId) ?? [];
    list.push(entry);
    byItemId.set(entry.itemId, list);
  }
  return { entries, byFragmentId, byItemId };
}

/**
 * Returns the topmost fragment whose half-open bounds contain the point.
 *
 * @param index - Hit index from `createRibbonHitIndex`.
 * @param x - Day-plane x coordinate.
 * @param y - Absolute y coordinate.
 * @returns The matching entry, or `undefined`.
 */
export function hitTestRibbon(
  index: RibbonHitIndex,
  x: number,
  y: number,
): RibbonHitEntry | undefined {
  for (let position = index.entries.length - 1; position >= 0; position -= 1) {
    const entry = index.entries[position];
    if (!entry) continue;
    if (x >= entry.x && x < entry.x + entry.width && y >= entry.y && y < entry.y + entry.height) {
      return entry;
    }
  }
  return undefined;
}
