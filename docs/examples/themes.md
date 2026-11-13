# Themes

Five presets ship in the package. The planner uses CSS variables, so a host can
override one token without forking the stylesheet.

| Preset | Use |
| --- | --- |
| `classic-blue` | Default; high legibility on white |
| `classic-yellow` | Warm print-like surfaces |
| `modern` | Softer neutrals for product UI |
| `high-contrast` | Maximum separation for low-vision use |
| `print` | Removes screen-only decoration for A3 output |

<img class="screenshot" src="/screenshots/year-grid.png" alt="The classic-blue theme on a fitted 14-month grid" />

## Live theme stories

- [Classic blue](https://blendsdk.github.io/year-planner/storybook/?path=/story/year-planner-01-themes-and-display--classic-blue)
- [Classic yellow](https://blendsdk.github.io/year-planner/storybook/?path=/story/year-planner-01-themes-and-display--classic-yellow)
- [Modern](https://blendsdk.github.io/year-planner/storybook/?path=/story/year-planner-01-themes-and-display--modern)
- [High contrast](https://blendsdk.github.io/year-planner/storybook/?path=/story/year-planner-01-themes-and-display--high-contrast)
- [Print theme](https://blendsdk.github.io/year-planner/storybook/?path=/story/year-planner-01-themes-and-display--print-theme)
- [CSS-variable override](https://blendsdk.github.io/year-planner/storybook/?path=/story/year-planner-01-themes-and-display--css-variable-override)
- [Provider theme](https://blendsdk.github.io/year-planner/storybook/?path=/story/year-planner-01-themes-and-display--provider-theme)

## Token example

```tsx
const theme = createTheme({
  surface: "#ffffff",
  surfaceMuted: "#f4f7f9",
  ribbon: "#1d4e89",
  highlight: "#f6bd60",
  border: "#71818b",
  fontFamily: "Inter, system-ui, sans-serif",
});

<YearPlanner year={2027} display={{ theme }} />;
```

## Contrast

Text, focus rings and meaningful graphical objects meet WCAG 2.2 AA against
their backgrounds in every preset. The automated axe matrix covers the themes at
the desktop and expanded densities; the manual NVDA/VoiceOver audit is still
parked, so the project makes no conformance claim beyond the automated checks.

## Read more

- [Theming tutorial](../tutorials/theming-and-adapters.md)
- [Theming reference](../theming.md)
- [Accessibility](../accessibility.md)
