/** A minimal structural subset of an MUI theme. */
export interface MuiLikeTheme {
  palette?: {
    primary?: { main?: string };
    background?: { default?: string; paper?: string };
    text?: { primary?: string; secondary?: string };
    divider?: string;
  };
  typography?: { fontFamily?: string; fontSize?: number };
}

function set(vars: Record<string, string>, name: string, value: string | number | undefined): void {
  if (value === undefined || value === "") return;
  vars[`--yp-${name}`] = String(value);
}

/**
 * Maps an MUI palette/typography subset to planner CSS variables.
 *
 * The function accepts a plain object; it does not import or require
 * `@mui/material`. Missing values are omitted.
 *
 * @param theme - MUI theme or palette subset.
 * @returns Planner CSS variables.
 */
export function muiThemeToCssVars(theme: MuiLikeTheme): Record<`--yp-${string}`, string> {
  const vars: Record<string, string> = {};
  const palette = theme.palette;
  set(vars, "surface", palette?.background?.default);
  set(vars, "surface-muted", palette?.background?.paper);
  set(vars, "context", palette?.background?.paper);
  set(vars, "text-primary", palette?.text?.primary);
  set(vars, "text-muted", palette?.text?.secondary);
  set(vars, "border", palette?.divider);
  set(vars, "ribbon", palette?.primary?.main);
  set(vars, "selection-outline", palette?.primary?.main);
  set(vars, "font-family", theme.typography?.fontFamily);
  set(
    vars,
    "font-size",
    typeof theme.typography?.fontSize === "number"
      ? `${theme.typography.fontSize}px`
      : theme.typography?.fontSize,
  );
  return vars as Record<`--yp-${string}`, string>;
}
