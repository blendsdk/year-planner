# Themes

The package ships 56 presets: 19 Material 2014 families, 35 Fluent UI v9
families and two monochrome utilities. The planner uses CSS variables, so a host
can override one token without forking the stylesheet.

| Group | Presets | Use |
| --- | --- | --- |
| Material 2014 | `material-red` … `material-blue-grey` | Familiar Material colour families; `material-teal` is the default |
| Fluent UI v9 | `fluent-red` … `fluent-anchor` | Fluent palette families; `fluent-marigold` is the print reference |
| Utility | `high-contrast` | Black, white and grey only, with maximum separation |
| Utility | `print` | Monochrome screen and print surfaces, print scale 1 |

The complete family list is in the [theming reference](../theming.md#presets).
Every palette preset uses light surfaces and the same geometry; switching a
preset changes colour only. The removed `classic-blue`, `classic-yellow` and
`modern` names have no aliases; see [Migration](../migration.md).

<img class="screenshot" src="/screenshots/year-grid.png" alt="The material-teal theme on a fitted 14-month grid" />

## Live theme stories

- [Material teal](https://blendsdk.github.io/year-planner/storybook/?path=/story/year-planner-01-themes-and-display--material-teal)
- [Fluent marigold](https://blendsdk.github.io/year-planner/storybook/?path=/story/year-planner-01-themes-and-display--fluent-marigold)
- [High contrast](https://blendsdk.github.io/year-planner/storybook/?path=/story/year-planner-01-themes-and-display--high-contrast)
- [Print theme](https://blendsdk.github.io/year-planner/storybook/?path=/story/year-planner-01-themes-and-display--print-theme)
- [CSS-variable override](https://blendsdk.github.io/year-planner/storybook/?path=/story/year-planner-01-themes-and-display--css-variable-override)
- [Provider theme](https://blendsdk.github.io/year-planner/storybook/?path=/story/year-planner-01-themes-and-display--provider-theme)

The Themes story exposes the whole catalogue through its theme control, grouped
by Material, Fluent and utility names in the demo selectors.

## Token example

```tsx
const theme = createTheme({
  surface: "#ffffff",
  surfaceMuted: "#f4f7f9",
  ribbon: "#1d4e89",
  highlight: "#f6bd60",
  border: "#424242",
  fontFamily: "Inter, system-ui, sans-serif",
});

<YearPlanner year={2027} display={{ theme }} />;
```

## Contrast

Text, focus rings and meaningful graphical objects meet WCAG 2.2 AA against
their backgrounds in every preset. The unit suite measures all 56 presets
against every base cell surface. The automated axe matrix covers representative
palette and utility themes at the desktop and expanded densities; the manual
NVDA/VoiceOver audit is still parked, so the project makes no conformance claim
beyond the automated checks.

## Read more

- [Theming tutorial](../tutorials/theming-and-adapters.md)
- [Theming reference](../theming.md)
- [Classic year layout](../classic-year-layout.md)
- [Accessibility](../accessibility.md)
