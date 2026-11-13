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

`display.theme` accepts 56 built-in presets:

- **19 Material 2014 families**: `material-red`, `material-pink`, `material-purple`,
  `material-deep-purple`, `material-indigo`, `material-blue`, `material-light-blue`,
  `material-cyan`, `material-teal`, `material-green`, `material-light-green`,
  `material-lime`, `material-yellow`, `material-amber`, `material-orange`,
  `material-deep-orange`, `material-brown`, `material-grey` and `material-blue-grey`.
- **35 Fluent UI v9 families**: `fluent-red`, `fluent-green`, `fluent-dark-orange`,
  `fluent-yellow`, `fluent-berry`, `fluent-light-green`, `fluent-marigold`,
  `fluent-dark-red`, `fluent-cranberry`, `fluent-pumpkin`, `fluent-peach`,
  `fluent-gold`, `fluent-brass`, `fluent-brown`, `fluent-forest`, `fluent-seafoam`,
  `fluent-dark-green`, `fluent-light-teal`, `fluent-teal`, `fluent-steel`,
  `fluent-blue`, `fluent-royal-blue`, `fluent-cornflower`, `fluent-navy`,
  `fluent-lavender`, `fluent-purple`, `fluent-grape`, `fluent-lilac`,
  `fluent-pink`, `fluent-magenta`, `fluent-plum`, `fluent-beige`, `fluent-mink`,
  `fluent-platinum` and `fluent-anchor`.
- **Two monochrome utilities**: `high-contrast` and `print`.

`material-teal` is the default. `print` removes screen-only colour and sets the
print scale to 1.

```tsx
<YearPlanner year={2027} display={{ theme: "fluent-marigold" }} />
```

The old `classic-blue`, `classic-yellow` and `modern` names were removed without
aliases. Passing one of those strings is treated like any unknown host theme
name: the supplied class is kept, and the provider theme or the default supplies
the tokens. `material-blue`, `material-yellow`, `fluent-blue` and
`fluent-yellow` are the replacement families; see [Migration](migration.md).

## createTheme

`createTheme` merges a partial token object over `material-teal` and returns a
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

`YearPlannerProvider` accepts theme tokens, not the adapter CSS-variable map. To
theme several planners, pass the same `cssVars` to each planner, or map the
adapter tokens into a `Partial<YearPlannerTheme>` and pass that as `theme`.

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

Every built-in preset meets the documented contrast checks for text, focus and
selection on all four base cell surfaces. `unstyled` removes decorative fills and
shadows but keeps structure, focus and print geometry. Contrast evidence and the
manual-audit status are in [accessibility.md](accessibility.md).
