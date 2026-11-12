# Theming

> **Scope**: CSS variables, presets, the theme factory, the provider and the
> Fluent UI v9 / MUI adapters.

Themes are CSS variables with a `--yp-` prefix. The stylesheet declares four
ordered cascade layers, so a host override can win without `!important`:

```css
@layer year-planner.base, year-planner.theme, year-planner.components, year-planner.overrides;
```

## CSS variables

| Variable | Meaning |
| -------- | ------- |
| `--yp-surface` | Page and month-row background |
| `--yp-surface-muted` | Context months and muted cells |
| `--yp-text-primary` | Primary labels |
| `--yp-text-muted` | Secondary labels and ISO weeks |
| `--yp-border` | Grid and cell borders |
| `--yp-ribbon` | Default ribbon colour |
| `--yp-highlight` | Highlight and weekend accent |
| `--yp-selection-outline` | Selection outline |
| `--yp-font-family`, `--yp-font-size`, `--yp-font-weight` | Typography |

Geometry tokens are design-pixel numbers: `rowHeight`, `laneHeight`,
`monthBandWidth`, `weekendWidth` and `weekdayWidth`. A `"<n>px"` string is
normalized. An explicit `units` prop wins over theme geometry. Setting geometry
only through arbitrary `cssVars` changes CSS but not the JavaScript layout; use a
theme token or `units` when the layout must change.

## Presets

`display.theme` accepts `classic-blue`, `classic-yellow`, `modern`,
`high-contrast` and `print`. `classic-blue` is the default; `print` removes
screen-only decoration.

```tsx
<YearPlanner year={2027} display={{ theme: "classic-yellow" }} />
```

## createTheme

`createTheme` merges a partial token object over `classic-blue` and returns a
complete theme. `cssVars` and `style` override individual variables per instance.

```tsx
import { createTheme, YearPlanner, YearPlannerProvider } from "@blendsdk/react-year-planner";

const theme = createTheme({ ribbon: "#8358c6", rowHeight: 96 });

<YearPlannerProvider theme={theme}>
  <YearPlanner year={2027} />
</YearPlannerProvider>;
```

## Fluent UI v9

The Fluent adapter maps a Fluent v9 theme object to planner variables. It imports
neither design system and declares no peer dependency; missing tokens are omitted
so preset defaults remain.

```tsx
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { YearPlanner } from "@blendsdk/react-year-planner";
import { fluentThemeToCssVars } from "@blendsdk/react-year-planner/adapters/fluent";

<FluentProvider theme={webLightTheme}>
  <YearPlanner year={2027} cssVars={fluentThemeToCssVars(webLightTheme)} />
</FluentProvider>;
```

The same `cssVars` can be applied through `YearPlannerProvider` when the host
wants one theme for several planners.

## MUI

```tsx
import { createTheme as createMuiTheme, ThemeProvider } from "@mui/material";
import { YearPlanner } from "@blendsdk/react-year-planner";
import { muiThemeToCssVars } from "@blendsdk/react-year-planner/adapters/mui";

const muiTheme = createMuiTheme({ palette: { primary: { main: "#1976d2" } } });

<ThemeProvider theme={muiTheme}>
  <YearPlanner year={2027} cssVars={muiThemeToCssVars(muiTheme)} />
</ThemeProvider>;
```

| Fluent / MUI input | Planner variables |
| ------------------ | ----------------- |
| neutral background / `background.default` | `--yp-surface` |
| neutral background 2 / `background.paper` | `--yp-surface-muted`, `--yp-context` |
| foreground 1 / `text.primary` | `--yp-text-primary` |
| foreground 2 / `text.secondary` | `--yp-text-muted` |
| stroke 1 / `divider` | `--yp-border` |
| brand / `primary.main` | `--yp-ribbon`, `--yp-selection-outline` |
| yellow palette / `warning` | `--yp-highlight` |

## Contrast

The classic, modern and high-contrast presets meet the documented contrast
checks for text, focus and selection. `unstyled` removes decorative fills and
shadows but keeps structure, focus and print geometry. Contrast evidence and the
manual-audit status are in [accessibility.md](accessibility.md).
