/**
 * The visual tokens owned by the planner theme.
 * @public
 */
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

/**
 * A complete planner theme. Geometry values are design pixels.
 * @public
 */
export type YearPlannerTheme = Record<YearPlannerTokenName, string | number>;

/**
 * The built-in visual presets.
 *
 * The names are 19 Material 2014 families (`material-*`), 35 Fluent UI v9
 * families (`fluent-*`) and the two monochrome utilities.
 * @public
 */
export type YearPlannerThemeName =
  | "material-red"
  | "material-pink"
  | "material-purple"
  | "material-deep-purple"
  | "material-indigo"
  | "material-blue"
  | "material-light-blue"
  | "material-cyan"
  | "material-teal"
  | "material-green"
  | "material-light-green"
  | "material-lime"
  | "material-yellow"
  | "material-amber"
  | "material-orange"
  | "material-deep-orange"
  | "material-brown"
  | "material-grey"
  | "material-blue-grey"
  | "fluent-red"
  | "fluent-green"
  | "fluent-dark-orange"
  | "fluent-yellow"
  | "fluent-berry"
  | "fluent-light-green"
  | "fluent-marigold"
  | "fluent-dark-red"
  | "fluent-cranberry"
  | "fluent-pumpkin"
  | "fluent-peach"
  | "fluent-gold"
  | "fluent-brass"
  | "fluent-brown"
  | "fluent-forest"
  | "fluent-seafoam"
  | "fluent-dark-green"
  | "fluent-light-teal"
  | "fluent-teal"
  | "fluent-steel"
  | "fluent-blue"
  | "fluent-royal-blue"
  | "fluent-cornflower"
  | "fluent-navy"
  | "fluent-lavender"
  | "fluent-purple"
  | "fluent-grape"
  | "fluent-lilac"
  | "fluent-pink"
  | "fluent-magenta"
  | "fluent-plum"
  | "fluent-beige"
  | "fluent-mink"
  | "fluent-platinum"
  | "fluent-anchor"
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

/**
 * The four source colours one palette family contributes to a theme, in order:
 * muted, light, accent and strong.
 *
 * Material rows use shades 50, 100, 500 and 900. Fluent rows use the neutral
 * background, the family Background2, BorderActive and Foreground2 values.
 */
type PaletteRoles = readonly [muted: string, light: string, accent: string, strong: string];

/**
 * Material 2014 family names and their 50/100/500/900 shade blocks.
 *
 * Each family colour block is 24 hex characters: six per shade, in role order.
 * Yellow, amber and orange carry a black strong shade because their 900 shade
 * does not reach 3:1 on every cell surface. The compact form keeps the approved
 * catalogue inside the bundle-size budget.
 */
const MATERIAL_FAMILIES =
  "red,pink,purple,deep-purple,indigo,blue,light-blue,cyan,teal,green,light-green,lime,yellow,amber,orange,deep-orange,brown,grey,blue-grey";
const MATERIAL_COLORS =
  "ffebeeffcdd2f44336b71c1cfce4ecf8bbd0e91e63880e4ff3e5f5e1bee79c27b04a148cede7f6d1c4e9673ab7311b92e8eaf6c5cae93f51b51a237ee3f2fdbbdefb2196f30d47a1e1f5feb3e5fc03a9f401579be0f7fab2ebf200bcd4006064e0f2f1b2dfdb009688004d40e8f5e9c8e6c94caf501b5e20f1f8e9dcedc88bc34a33691ef9fbe7f0f4c3cddc39827717fffde7fff9c4ffeb3b000000fff8e1ffecb3ffc107000000fff3e0ffe0b2ff9800000000fbe9e7ffccbcff5722bf360cefebe9d7ccc87955483e2723fafafaf5f5f59e9e9e212121eceff1cfd8dc607d8b263238";

/**
 * Fluent UI v9 family names and their Background2/BorderActive/Foreground2
 * colour blocks. Fluent shares one neutral background (`#fafafa`) in every
 * family, so it is supplied once by the builder.
 */
const FLUENT_FAMILIES =
  "red,green,dark-orange,yellow,berry,light-green,marigold,dark-red,cranberry,pumpkin,peach,gold,brass,brown,forest,seafoam,dark-green,light-teal,teal,steel,blue,royal-blue,cornflower,navy,lavender,purple,grape,lilac,pink,magenta,plum,beige,mink,platinum,anchor";
const FLUENT_COLORS =
  "f1bbbcd13438751d1f9fd89f107c10094509f4bfabda3b017a2101fef7b2fde300817400edbbe7c239b36d2064a7e3a513a10e0b5a08f9e2aeeaa300835b00d69ca5750b1c420610eeacb2c50f1f6e0811efc4adca5010712d09ffddb3ff8c008f4e00ecdfa5c19c006c5700e0cea2986f0b553e06ddc3b08e562e50301abdd99b498205294903a8f0cd00cc6a00723b9ad29a0b6a0b063b06a6e9ed00b7c300666d9bd9db03838702494c94c8d4005b7000333fa9d3f20078d40043779abfdc004e8c002c4ec8d1fa4f6bed2c3c85a3b2e80027b4001665d2ccf87160e83f3682c6b1de5c2e91341a51d9a7e08817984c0d55e6bfedb146c263276df7c0e3e43ba680215deca5d1bf00776b0043d696c077004d43002bd7d4d47a7574444241cecccb5d5a58343231cdd6d869797e3b4447bcc3c7394146202427";

/**
 * Expands compact family blocks into named palette roles.
 *
 * @param families - Comma-separated kebab-case family names.
 * @param colors - Concatenated colour blocks, in the same order.
 * @param characters - Characters in one family block.
 * @param muted - Shared muted colour when the block omits it.
 * @returns One `[family, roles]` entry per name.
 */
function paletteEntries(
  families: string,
  colors: string,
  characters: number,
  muted?: string,
): Array<[string, PaletteRoles]> {
  return families.split(",").map((family, index): [string, PaletteRoles] => {
    const block = colors.slice(index * characters, (index + 1) * characters);
    const hex = (role: number): string => `#${block.slice(role * 6, role * 6 + 6)}`;
    if (muted !== undefined) return [family, [muted, hex(0), hex(1), hex(2)]];
    return [family, [hex(0), hex(1), hex(2), hex(3)]];
  });
}

/**
 * Converts a six-digit hex colour to an `rgba()` value.
 *
 * @param hex - Source colour.
 * @param alpha - Alpha from 0 to 1.
 * @returns The translucent colour, or transparent black for unparseable input.
 */
function withAlpha(hex: string, alpha: number): string {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!match) return `rgba(0, 0, 0, ${alpha})`;
  const red = Number.parseInt(match[1] as string, 16);
  const green = Number.parseInt(match[2] as string, 16);
  const blue = Number.parseInt(match[3] as string, 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

/**
 * Expands one palette family into the fixed 24-token theme shape.
 *
 * All palette presets use white page surfaces, a neutral context tint and the
 * same geometry. The accent drives ribbons and selection; the family's light
 * tint drives weekends, highlights and annotations.
 *
 * @param roles - Four source colours from the upstream palette.
 * @returns A frozen complete theme.
 */
function paletteTheme(roles: PaletteRoles): YearPlannerTheme {
  const [muted, light, accent, strong] = roles;
  return Object.freeze({
    surface: "#ffffff",
    surfaceMuted: muted,
    weekend: light,
    context: "#f5f5f5",
    border: "#424242",
    textPrimary: "#000000",
    textMuted: "#333333",
    textInverse: "#ffffff",
    focusRing: strong,
    selectionFill: withAlpha(accent, 0.18),
    selectionOutline: strong,
    highlight: light,
    ribbon: accent,
    annotation: light,
    foreground: strong,
    ...SHARED,
  });
}

const HIGH_CONTRAST: YearPlannerTheme = Object.freeze({
  surface: "#ffffff",
  surfaceMuted: "#ffffff",
  weekend: "#e6e6e6",
  context: "#f2f2f2",
  border: "#000000",
  textPrimary: "#000000",
  textMuted: "#1a1a1a",
  textInverse: "#ffffff",
  focusRing: "#000000",
  selectionFill: "rgba(0, 0, 0, 0.18)",
  selectionOutline: "#000000",
  highlight: "#d9d9d9",
  ribbon: "#000000",
  annotation: "#e6e6e6",
  foreground: "#000000",
  ...SHARED,
});

const PRINT: YearPlannerTheme = Object.freeze({
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
  highlight: "#e6e6e6",
  ribbon: "#000000",
  annotation: "#d9d9d9",
  foreground: "#000000",
  ...SHARED,
  printScale: 1,
});

/**
 * Builds the frozen preset catalogue from the static palette tables.
 *
 * The table keys already form the public family names. The final assertion is
 * safe because the catalogue specification test checks the exact 56 keys.
 */
function buildPresets(): Record<YearPlannerThemeName, YearPlannerTheme> {
  const presets: Record<string, YearPlannerTheme> = {};
  for (const [family, roles] of paletteEntries(MATERIAL_FAMILIES, MATERIAL_COLORS, 24)) {
    presets[`material-${family}`] = paletteTheme(roles);
  }
  for (const [family, roles] of paletteEntries(FLUENT_FAMILIES, FLUENT_COLORS, 18, "#fafafa")) {
    presets[`fluent-${family}`] = paletteTheme(roles);
  }
  presets["high-contrast"] = HIGH_CONTRAST;
  presets.print = PRINT;
  return Object.freeze(presets) as Record<YearPlannerThemeName, YearPlannerTheme>;
}

/**
 * Frozen built-in themes.
 *
 * The catalogue contains exactly the approved 54 palette families and the two
 * monochrome utilities. Every preset exposes the same 24 tokens and geometry.
 * @public
 */
export const yearPlannerPresets: Record<YearPlannerThemeName, YearPlannerTheme> = buildPresets();

const DEFAULT_THEME = yearPlannerPresets["material-teal"];

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
 * Merges a partial theme over `material-teal`.
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
 * @public
 */
export function createTheme(theme: Partial<YearPlannerTheme> = {}): YearPlannerTheme {
  const merged: YearPlannerTheme = { ...DEFAULT_THEME, ...theme };
  for (const key of Object.keys(merged) as YearPlannerTokenName[]) {
    merged[key] = normalizeGeometry(key, merged[key], DEFAULT_THEME[key]);
  }
  return merged;
}

/**
 * Returns a frozen preset by name, or `undefined` for a host theme name.
 * @public
 */
export function getPresetTheme(name: string): YearPlannerTheme | undefined {
  if (!Object.hasOwn(yearPlannerPresets, name)) return undefined;
  return yearPlannerPresets[name as YearPlannerThemeName];
}

const UNITLESS = new Set<YearPlannerTokenName>(["fontWeight", "printScale"]);

/**
 * Resolves a preset name, provider theme or the `material-teal` default.
 * @public
 */
export function resolveTheme(
  name: string | undefined,
  providerTheme: YearPlannerTheme | undefined,
): {
  /** Resolved theme tokens. */
  theme: YearPlannerTheme;
  /** Preset or host theme name that produced the tokens. */
  themeName: string;
} {
  const preset = name ? getPresetTheme(name) : undefined;
  if (preset) return { theme: preset, themeName: name as string };
  return {
    theme: providerTheme ?? DEFAULT_THEME,
    themeName: name ?? "material-teal",
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
 * @public
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
