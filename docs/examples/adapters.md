# Design systems

The planner is design-system neutral. The adapters map a Fluent UI v9 or MUI
theme to planner CSS variables without importing either library at runtime.

## Fluent UI v9

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

## Live adapter stories

- [Fluent tokens](https://blendsdk.github.io/year-planner/storybook/?path=/story/year-planner-08-design-system-token-adapters--fluent-tokens)
- [MUI tokens](https://blendsdk.github.io/year-planner/storybook/?path=/story/year-planner-08-design-system-token-adapters--mui-tokens)
- [Fluent wrapper](https://blendsdk.github.io/year-planner/storybook/?path=/story/year-planner-08-design-system-token-adapters--fluent-wrapper)
- [MUI wrapper](https://blendsdk.github.io/year-planner/storybook/?path=/story/year-planner-08-design-system-token-adapters--mui-wrapper)
- [Fluent and MUI merged](https://blendsdk.github.io/year-planner/storybook/?path=/story/year-planner-08-design-system-token-adapters--fluent-and-mui-merged)
- [Dark surfaces](https://blendsdk.github.io/year-planner/storybook/?path=/story/year-planner-08-design-system-token-adapters--dark-surfaces)

The adapters are optional: the React package has no peer dependency on Fluent
or MUI. The token maps are plain functions, so they also work with a server-side
theme object.

## Read more

- [Theming tutorial](../tutorials/theming-and-adapters.md)
- [Theming reference](../theming.md)
- [Security](../security.md) — the adapters are token maps, not renderers.
