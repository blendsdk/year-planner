# Theming and design-system adapters

> **Time**: about 10 minutes. **Prerequisites**: a rendered planner.

The planner is styled with CSS variables. You can change a preset, build a
theme object, override tokens per instance, or map a Fluent UI v9 / MUI theme
into planner variables.

## Use a preset

```tsx
<YearPlanner year={2027} display={{ theme: "fluent-marigold" }} />
```

The presets are 19 Material 2014 families, 35 Fluent UI v9 families and the
`high-contrast` and `print` utilities. `material-teal` is the default; the full
list is in the [theming reference](../theming.md#presets).

## Build a theme

`createTheme` merges partial tokens over `material-teal` and returns a complete
theme. It changes both the CSS variables and the JavaScript geometry when the
token is a geometry token.

```tsx
import { createTheme, YearPlanner } from "@blendsdk/react-year-planner";

const brand = createTheme({
  surface: "#ffffff",
  ribbon: "#1d4e89",
  highlight: "#f6bd60",
  fontFamily: "Inter, system-ui, sans-serif",
  rowHeight: 96,
});

<YearPlanner year={2027} display={{ theme: brand }} />;
```

The `units` prop wins over theme geometry when you need explicit design pixels:

```tsx
<YearPlanner year={2027} units={{ rowHeight: 104, weekday: 58 }} />
```

## Override one instance

`cssVars` is the smallest override:

```tsx
<YearPlanner
  year={2027}
  cssVars={{
    "--yp-surface": "#fbfcfe",
    "--yp-border": "#b7c4ce",
    "--yp-selection-outline": "#0b6bcb",
  }}
/>
```

Cascade layers keep the host override last:

```css
@layer year-planner.base, year-planner.theme, year-planner.components, year-planner.overrides;
```

## Fluent UI v9

The adapter imports neither Fluent UI nor React; it accepts a structural theme
subset and returns planner variables.

```tsx
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { fluentThemeToCssVars } from "@blendsdk/react-year-planner/adapters/fluent";

<FluentProvider theme={webLightTheme}>
  <YearPlanner year={2027} cssVars={fluentThemeToCssVars(webLightTheme)} />
</FluentProvider>;
```

## MUI

```tsx
import { createTheme as createMuiTheme, ThemeProvider } from "@mui/material";
import { muiThemeToCssVars } from "@blendsdk/react-year-planner/adapters/mui";

const muiTheme = createMuiTheme({ palette: { primary: { main: "#1976d2" } } });

<ThemeProvider theme={muiTheme}>
  <YearPlanner year={2027} cssVars={muiThemeToCssVars(muiTheme)} />
</ThemeProvider>;
```

## What not to do

- Do not use `transform: scale` to fit the grid. Text becomes blurry and hit
  targets shrink. Use `display.fit` or the explicit units.
- Do not put geometry only in `cssVars`: the JavaScript layout uses the theme
  tokens and `units`, not arbitrary CSS.
- Do not rely on colour alone for status. Pair a colour with a label, icon or
  pattern.

## See it live

- [Theme gallery](../examples/themes.md)
- [Design-system adapters](../examples/adapters.md)
- [Theming reference](../theming.md)
