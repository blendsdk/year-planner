import type { Diagnostic } from "@blendsdk/year-planner-core";
import { diagnostic } from "@blendsdk/year-planner-core";
import { clampZoom } from "./geometry.js";
import { isValidLocale, isValidTimeZone } from "./locale.js";
import type { YearPlannerTheme } from "./theme.js";
import type { DisplayConfig } from "./types.js";

/**
 * Validated display options used by the renderer.
 */
export interface ResolvedDisplayOptions {
  density: "compact" | "expanded";
  compactMaxLanes: number;
  laneHeight: number;
  displayTimeZone: string;
  locale: string;
  zoom: number;
  showISOWeekNumbers: boolean;
  showAnnotations: boolean;
}

function push(
  diagnostics: Diagnostic[],
  code: Parameters<typeof diagnostic>[0],
  message: string,
): void {
  diagnostics.push(diagnostic(code, message));
}

/**
 * Validates host display options and falls back before any core call that would
 * throw. Returns one diagnostic per invalid option.
 */
export function resolveDisplayOptions(
  display: DisplayConfig | undefined,
  theme: YearPlannerTheme,
): { options: ResolvedDisplayOptions; diagnostics: Diagnostic[] } {
  const diagnostics: Diagnostic[] = [];
  const rawZoom = display?.zoom ?? 1;
  const zoom = clampZoom(rawZoom);
  if (rawZoom !== zoom) push(diagnostics, "INVALID_RANGE", "Zoom is clamped to 0.75-1.5");

  const density = display?.density ?? "compact";
  const validDensity = density === "compact" || density === "expanded";
  if (!validDensity) push(diagnostics, "INVALID_COMMAND", "Density must be compact or expanded");

  const rawLanes = display?.compactMaxLanes ?? 3;
  const compactMaxLanes = Number.isInteger(rawLanes) && rawLanes >= 1 ? rawLanes : 3;
  if (compactMaxLanes !== rawLanes) {
    push(diagnostics, "INVALID_COMMAND", "compactMaxLanes must be a positive integer");
  }

  const themeLaneHeight = Number(theme.laneHeight);
  const laneHeight = Number.isFinite(themeLaneHeight) && themeLaneHeight > 0 ? themeLaneHeight : 24;

  const rawZone = display?.displayTimeZone ?? "UTC";
  const displayTimeZone = isValidTimeZone(rawZone) ? rawZone : "UTC";
  if (displayTimeZone !== rawZone)
    push(diagnostics, "INVALID_TIMEZONE", "Display time zone is invalid");

  const rawLocale = display?.locale ?? "en-US";
  const locale = isValidLocale(rawLocale) ? rawLocale : "en-US";
  if (locale !== rawLocale) push(diagnostics, "INVALID_LOCALE", "Locale is invalid");

  if (display?.connectorMode === "edge-path") {
    push(
      diagnostics,
      "INVALID_RENDERER_OPTION",
      "edge-path connectors are not available in the HTML renderer",
    );
  }

  return {
    options: {
      density: validDensity ? density : "compact",
      compactMaxLanes,
      laneHeight,
      displayTimeZone,
      locale,
      zoom,
      showISOWeekNumbers: display?.showISOWeekNumbers !== false,
      showAnnotations: display?.showAnnotations !== false,
    },
    diagnostics,
  };
}
