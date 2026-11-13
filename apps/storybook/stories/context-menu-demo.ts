import type { PlannerContextMenuRequest } from "@blendsdk/react-year-planner";

/**
 * Readable one-line label for a context-menu request target.
 *
 * Used by the story demos for the menu header and the status bar, so a reader
 * can see exactly what the host received without opening the browser console.
 */
export function describeContextTarget(target: PlannerContextMenuRequest["target"]): string {
  if (target.kind === "date") return `date ${target.date}`;
  if (target.kind === "item") return `item ${target.itemId} · ${target.date}`;
  return `annotation ${target.annotationId} · ${target.date}`;
}
