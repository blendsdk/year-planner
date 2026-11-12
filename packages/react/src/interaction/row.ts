import type { DateKey, MonthRowLayout, YearLayout } from "@blendsdk/year-planner-core";

/**
 * Finds the month row that contains a date.
 *
 * @param layout - Built classic year layout.
 * @param date - ISO date key.
 * @returns The containing row, or `undefined` outside the window.
 * @public
 */
export function rowForDate(layout: YearLayout, date: DateKey): MonthRowLayout | undefined {
  return layout.rows.find((row) => date >= row.firstDate && date < row.endDateExclusive);
}

/**
 * Returns the first or last enabled date in the row that contains `date`.
 *
 * Disabled candidates are skipped inward so Home and End always land on a date
 * the user can act on.
 *
 * @param layout - Built classic year layout.
 * @param date - Any date in the target row.
 * @param edge - `start` for Home, `end` for End.
 * @param isDisabled - Host disabled-date predicate.
 * @returns The edge date, or `undefined` when the row has no enabled date.
 */
export function rowEdgeDate(
  layout: YearLayout,
  date: DateKey,
  edge: "start" | "end",
  isDisabled: (date: DateKey) => boolean,
): DateKey | undefined {
  const row = rowForDate(layout, date);
  if (!row) return undefined;
  const candidates = row.columns
    .map((column) => column.date)
    .filter((candidate): candidate is DateKey => candidate !== undefined);
  const ordered = edge === "start" ? candidates : [...candidates].reverse();
  for (const candidate of ordered) {
    if (!isDisabled(candidate)) return candidate;
  }
  return undefined;
}
