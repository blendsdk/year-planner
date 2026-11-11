/** The visual tokens owned by the planner theme. */
export type YearPlannerTokenName =
  | "surface"
  | "surfaceMuted"
  | "weekend"
  | "context"
  | "border"
  | "textPrimary"
  | "textMuted"
  | "textInverse"
  | "focusRing"
  | "selectionFill"
  | "selectionOutline"
  | "highlight"
  | "ribbon"
  | "annotation"
  | "foreground"
  | "rowHeight"
  | "laneHeight"
  | "monthBandWidth"
  | "weekendWidth"
  | "weekdayWidth"
  | "fontFamily"
  | "fontSize"
  | "fontWeight"
  | "printScale";

/** A complete planner theme. Geometry values are design pixels. */
export type YearPlannerTheme = Record<YearPlannerTokenName, string | number>;

/** The built-in visual presets. */
export type YearPlannerThemeName =
  | "classic-blue"
  | "classic-yellow"
  | "modern"
  | "high-contrast"
  | "print";

const SHARED = {
  rowHeight: 90,
  laneHeight: 24,
  monthBandWidth: 70,
  weekendWidth: 40,
  weekdayWidth: 55,
  fontFamily: "Arial, Helvetica, sans-serif",
  fontSize: 14,
  fontWeight: 400,
  printScale: 0.72,
} as const;

const CLASSIC_BLUE: YearPlannerTheme = Object.freeze({
  surface: "#ffffff",
  surfaceMuted: "#f7fafb",
  weekend: "#e3f7fc",
  context: "#eaf4f5",
  border: "#71818b",
  textPrimary: "#1b2329",
  textMuted: "#4a5a63",
  textInverse: "#ffffff",
  focusRing: "#0b6bcb",
  selectionFill: "rgba(11, 107, 203, 0.18)",
  selectionOutline: "#0b6bcb",
  highlight: "#ffd166",
  ribbon: "#76bfe5",
  annotation: "#f6bd60",
  foreground: "#243b53",
  ...SHARED,
});

const CLASSIC_YELLOW: YearPlannerTheme = Object.freeze({
  ...CLASSIC_BLUE,
  surface: "#fffef2",
  surfaceMuted: "#fbfbe6",
  weekend: "#ffffbe",
  context: "#e9e8ee",
  border: "#858783",
  textPrimary: "#24251d",
  textMuted: "#5d5e55",
  textInverse: "#24251d",
  focusRing: "#7a6a00",
  selectionFill: "rgba(246, 243, 104, 0.35)",
  selectionOutline: "#7a6a00",
  highlight: "#f6f368",
  ribbon: "#f6f368",
  annotation: "#e0a800",
  foreground: "#3b3a2a",
});

const MODERN: YearPlannerTheme = Object.freeze({
  ...CLASSIC_BLUE,
  surface: "#ffffff",
  surfaceMuted: "#f5f7fa",
  weekend: "#eef2f6",
  context: "#f5f7fa",
  border: "#7b8a99",
  textPrimary: "#102a43",
  textMuted: "#52606d",
  textInverse: "#ffffff",
  focusRing: "#2680c2",
  selectionFill: "rgba(38, 128, 194, 0.18)",
  selectionOutline: "#2680c2",
  highlight: "#f0b429",
  ribbon: "#243b53",
  annotation: "#9f7aea",
  foreground: "#243b53",
});

const HIGH_CONTRAST: YearPlannerTheme = Object.freeze({
  ...CLASSIC_BLUE,
  surface: "#ffffff",
  surfaceMuted: "#ffffff",
  weekend: "#fff7a8",
  context: "#f2f2f2",
  border: "#000000",
  textPrimary: "#000000",
  textMuted: "#1a1a1a",
  textInverse: "#ffffff",
  focusRing: "#0000ff",
  selectionFill: "rgba(0, 0, 255, 0.25)",
  selectionOutline: "#0000ff",
  highlight: "#ffff00",
  ribbon: "#000000",
  annotation: "#ff00ff",
  foreground: "#000000",
});

const PRINT: YearPlannerTheme = Object.freeze({
  ...CLASSIC_BLUE,
  surface: "#ffffff",
  surfaceMuted: "#ffffff",
  weekend: "#f2f2f2",
  context: "#fafafa",
  border: "#000000",
  textPrimary: "#000000",
  textMuted: "#333333",
  textInverse: "#ffffff",
  focusRing: "#000000",
  selectionFill: "rgba(0, 0, 0, 0.12)",
  selectionOutline: "#000000",
  highlight: "#f2c94c",
  ribbon: "#2f5d8a",
  annotation: "#b8860b",
  foreground: "#111111",
  printScale: 1,
});

/** Frozen built-in themes. */
export const yearPlannerPresets: Record<YearPlannerThemeName, YearPlannerTheme> = Object.freeze({
  "classic-blue": CLASSIC_BLUE,
  "classic-yellow": CLASSIC_YELLOW,
  modern: MODERN,
  "high-contrast": HIGH_CONTRAST,
  print: PRINT,
});

const GEOMETRY_TOKENS = new Set<YearPlannerTokenName>([
  "rowHeight",
  "laneHeight",
  "monthBandWidth",
  "weekendWidth",
  "weekdayWidth",
  "fontSize",
]);

function normalizeGeometry(
  key: YearPlannerTokenName,
  value: string | number,
  fallback: string | number,
): string | number {
  if (!GEOMETRY_TOKENS.has(key)) return value;
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
  if (typeof value === "string") {
    const match = /^(\d+(?:\.\d+)?)px$/.exec(value.trim());
    if (match) {
      const parsed = Number(match[1]);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
  }
  return fallback;
}

/**
 * Merges a partial theme over `classic-blue`.
 *
 * Geometry tokens accept a positive number or a `"<n>px"` string; other strings
 * silently fall back to the preset value because a theme factory has no
 * diagnostic channel.
 *
 * @param theme - Partial token overrides.
 * @returns A complete theme.
 *
 * @example
 * ```ts
 * const theme = createTheme({ ribbon: "#8358c6" });
 * ```
 */
export function createTheme(theme: Partial<YearPlannerTheme> = {}): YearPlannerTheme {
  const merged: YearPlannerTheme = { ...CLASSIC_BLUE, ...theme };
  for (const key of Object.keys(merged) as YearPlannerTokenName[]) {
    merged[key] = normalizeGeometry(key, merged[key], CLASSIC_BLUE[key]);
  }
  return merged;
}

/** Returns a frozen preset by name, or `undefined` for a host theme name. */
export function getPresetTheme(name: string): YearPlannerTheme | undefined {
  if (!Object.hasOwn(yearPlannerPresets, name)) return undefined;
  return yearPlannerPresets[name as YearPlannerThemeName];
}

const UNITLESS = new Set<YearPlannerTokenName>(["fontWeight", "printScale"]);

/** Resolves a preset name, provider theme or classic default. */
export function resolveTheme(
  name: string | undefined,
  providerTheme: YearPlannerTheme | undefined,
): { theme: YearPlannerTheme; themeName: string } {
  const preset = name ? getPresetTheme(name) : undefined;
  if (preset) return { theme: preset, themeName: name as string };
  return {
    theme: providerTheme ?? CLASSIC_BLUE,
    themeName: name ?? "classic-blue",
  };
}

function kebab(name: string): string {
  return name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

/**
 * Converts a theme to CSS custom properties.
 *
 * Geometry and font-size tokens become `px`; font weight and print scale stay
 * unitless.
 *
 * @param theme - Complete theme.
 * @returns A map of `--yp-*` custom properties.
 */
export function themeToCssVars(theme: YearPlannerTheme): Record<`--yp-${string}`, string> {
  const vars: Record<string, string> = {};
  for (const key of Object.keys(theme) as YearPlannerTokenName[]) {
    const value = theme[key];
    const cssValue = typeof value === "number" && !UNITLESS.has(key) ? `${value}px` : String(value);
    vars[`--yp-${kebab(key)}`] = cssValue;
  }
  return vars as Record<`--yp-${string}`, string>;
}
