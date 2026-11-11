import {
  addDays,
  type DateKey,
  diffDays,
  type PlannerItem,
  type PlannerLayer,
  type PlannerSelection,
  type SelectionDateRange,
} from "@blendsdk/year-planner-core";
import type { DateMeta } from "./types.js";

/** Inputs for one date cell's accessible name. */
export interface DateCellNameInput {
  /** ISO date key for the cell. */
  date: DateKey;
  /** Date already formatted for the active locale. */
  formattedDate: string;
  /** Number of effectively visible items touching the date. */
  itemCount: number;
  /** ISO week number when the cell shows one. */
  weekNumber?: number | undefined;
  /** Host presentation for the date. */
  meta?: DateMeta | undefined;
  /** Whether the date belongs to the current date selection. */
  selected: boolean;
}

/** Inputs for one item proxy's accessible name. */
export interface ItemNameInput {
  /** Item represented by the proxy. */
  item: PlannerItem;
  /** Layer that owns the item. */
  layer: PlannerLayer;
  /** Localized period text. */
  periodLabel: string;
  /** Text visible inside the proxy. */
  visibleLabel: string;
  /** Whether the item is selected. */
  selected: boolean;
  /** Whether the fragment is clipped at either edge. */
  clipped: boolean;
}

function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

function hexChannels(value: string): [number, number, number] | undefined {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})(?:[0-9a-f]{2})?$/i.exec(value.trim());
  if (!match?.[1]) return undefined;
  const hex =
    match[1].length === 3
      ? match[1]
          .split("")
          .map((character) => `${character}${character}`)
          .join("")
      : match[1];
  return [
    Number.parseInt(hex.slice(0, 2), 16),
    Number.parseInt(hex.slice(2, 4), 16),
    Number.parseInt(hex.slice(4, 6), 16),
  ];
}

/**
 * Returns the relative luminance of a hex colour.
 *
 * @param color - `#rgb`, `#rrggbb` or an eight-digit hex value.
 * @returns Luminance in the 0–1 range, or `undefined` for other colour syntaxes.
 */
export function relativeLuminance(color: string): number | undefined {
  const channels = hexChannels(color);
  if (!channels) return undefined;
  const [red, green, blue] = channels.map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

/**
 * Returns the WCAG contrast ratio between two hex colours.
 *
 * @param foreground - Text or graphical colour.
 * @param background - Adjacent background colour.
 * @returns A ratio from 1 to 21, or `0` when either value cannot be parsed.
 */
export function contrastRatio(foreground: string, background: string): number {
  const first = relativeLuminance(foreground);
  const second = relativeLuminance(background);
  if (first === undefined || second === undefined) return 0;
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Picks the candidate with the higher contrast against a background.
 *
 * Non-hex backgrounds fall back to the first candidate. Hosts can override the
 * result with the `--yp-ribbon-text` CSS variable when their theme uses a
 * colour syntax this helper cannot parse.
 *
 * @param background - Ribbon or header background.
 * @param candidates - Primary and inverse text colours.
 * @returns The candidate with the higher contrast ratio.
 *
 * @example
 * ```ts
 * readableTextColor("#76bfe5", ["#1b2329", "#ffffff"]); // "#1b2329"
 * ```
 */
export function readableTextColor(background: string, candidates: readonly string[]): string {
  const fallback = candidates[0] ?? "#000000";
  if (relativeLuminance(background) === undefined) return fallback;
  let best = fallback;
  let bestRatio = contrastRatio(best, background);
  for (const candidate of candidates.slice(1)) {
    const ratio = contrastRatio(candidate, background);
    if (ratio > bestRatio) {
      best = candidate;
      bestRatio = ratio;
    }
  }
  return best;
}

/**
 * Builds the accessible name for one date cell.
 *
 * The name carries the date, the visible item count and every state a sighted
 * user can read from the cell. A host `ariaLabel` replaces the whole name and
 * therefore owns its visible-text contract.
 *
 * @param input - Cell state and formatter output.
 * @returns A comma-separated accessible name.
 *
 * @example
 * ```ts
 * dateCellAccessibleName({
 *   date: "2027-01-04",
 *   formattedDate: "Jan 4, 2027",
 *   itemCount: 2,
 *   selected: false,
 * });
 * // "Jan 4, 2027, 2 items"
 * ```
 */
export function dateCellAccessibleName(input: DateCellNameInput): string {
  if (input.meta?.ariaLabel) return input.meta.ariaLabel;
  const parts = [input.formattedDate];
  if (input.weekNumber !== undefined) parts.push(`ISO week ${input.weekNumber}`);
  if (input.meta?.label) parts.push(input.meta.label);
  parts.push(plural(input.itemCount, "item", "items"));
  if (input.meta?.holiday) parts.push("holiday");
  if (input.selected) parts.push("selected");
  if (input.meta?.disabled) parts.push("unavailable");
  return parts.join(", ");
}

/**
 * Builds the accessible name for one item proxy.
 *
 * The visible label leads so the name always contains the text a screen-reader
 * user can see. Annotation labels stay in front of the title because they are
 * the visible text for annotation fragments.
 *
 * @param input - Item, layer and fragment state.
 * @returns A comma-separated accessible name.
 *
 * @example
 * ```ts
 * itemAccessibleName({
 *   item,
 *   layer,
 *   periodLabel: "Jan 28, 2027 - Feb 6, 2027",
 *   visibleLabel: "Winter booking",
 *   selected: true,
 *   clipped: false,
 * });
 * ```
 */
export function itemAccessibleName(input: ItemNameInput): string {
  const parts: string[] = [input.visibleLabel];
  if (input.item.title && input.item.title !== input.visibleLabel) parts.push(input.item.title);
  parts.push(input.periodLabel);
  parts.push(`layer ${input.layer.label ?? input.layer.name}`);
  if (input.layer.pattern && input.layer.pattern !== "solid") {
    parts.push(`${input.layer.pattern} pattern`);
  }
  if (input.item.status) parts.push(`status ${input.item.status}`);
  parts.push(input.selected ? "selected" : "not selected");
  if (input.clipped) parts.push("partially visible");
  return parts.join(", ");
}

/**
 * Expands selection ranges into a date lookup.
 *
 * Zero-day and reversed ranges contribute nothing. The result is read-only by
 * convention; callers must not mutate it.
 *
 * @param ranges - Canonical selection date ranges.
 * @returns Every selected date key.
 */
export function selectedDateSet(ranges: readonly SelectionDateRange[]): ReadonlySet<DateKey> {
  const dates = new Set<DateKey>();
  for (const range of ranges) {
    const days = diffDays(range.startDate, range.endDateExclusive);
    for (let offset = 0; offset < days; offset += 1) {
      dates.add(addDays(range.startDate, offset));
    }
  }
  return dates;
}

/**
 * Summarises a selection for the polite live region.
 *
 * The message counts selected items and the total number of selected days.
 * Overlapping ranges are counted per range because canonical core selections
 * do not contain overlaps.
 *
 * @param selection - Current planner selection.
 * @returns A short announcement, or `Selection cleared`.
 */
export function selectionSummary(selection: PlannerSelection): string {
  const days = selection.dates.reduce(
    (total, range) => total + Math.max(0, diffDays(range.startDate, range.endDateExclusive)),
    0,
  );
  const items = selection.items.length;
  if (items === 0 && days === 0) return "Selection cleared";
  return `Selection: ${plural(items, "item", "items")}, ${plural(days, "day", "days")}`;
}
