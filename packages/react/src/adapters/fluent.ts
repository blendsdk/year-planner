/**
 * A minimal structural subset of a Fluent UI v9 theme.
 */
export interface FluentLikeTheme {
  colorNeutralBackground1?: string;
  colorNeutralBackground2?: string;
  colorNeutralForeground1?: string;
  colorNeutralForeground2?: string;
  colorNeutralStroke1?: string;
  colorBrandBackground?: string;
  colorPaletteYellowBackground2?: string;
  fontFamilyBase?: string;
  fontSizeBase300?: string;
  fontWeightRegular?: string | number;
}

function set(vars: Record<string, string>, name: string, value: string | number | undefined): void {
  if (value === undefined || value === "") return;
  vars[`--yp-${name}`] = String(value);
}

/**
 * Maps Fluent UI v9 theme tokens to planner CSS variables.
 *
 * The function accepts a plain object; it does not import or require
 * `@fluentui/react-components`. Missing tokens are omitted.
 *
 * @param theme - Fluent theme or token subset.
 * @returns Planner CSS variables.
 *
 * @example
 * ```ts
 * <YearPlanner cssVars={fluentThemeToCssVars(theme)} />
 * ```
 * @public
 */
export function fluentThemeToCssVars(theme: FluentLikeTheme): Record<`--yp-${string}`, string> {
  const vars: Record<string, string> = {};
  set(vars, "surface", theme.colorNeutralBackground1);
  set(vars, "surface-muted", theme.colorNeutralBackground2);
  set(vars, "context", theme.colorNeutralBackground2);
  set(vars, "text-primary", theme.colorNeutralForeground1);
  set(vars, "text-muted", theme.colorNeutralForeground2);
  set(vars, "border", theme.colorNeutralStroke1);
  set(vars, "ribbon", theme.colorBrandBackground);
  set(vars, "selection-outline", theme.colorBrandBackground);
  set(vars, "highlight", theme.colorPaletteYellowBackground2);
  set(vars, "font-family", theme.fontFamilyBase);
  set(vars, "font-size", theme.fontSizeBase300);
  set(vars, "font-weight", theme.fontWeightRegular);
  return vars as Record<`--yp-${string}`, string>;
}
