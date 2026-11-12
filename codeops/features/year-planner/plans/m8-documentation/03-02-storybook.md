# Storybook: Documentation, Storybook and API Reference

> **Document**: 03-02-storybook.md
> **Parent**: [Index](00-index.md)

## Overview

Storybook is the public component site. RD-11 requires every meaningful state to
have a story and names the states the site must contain. The current 12 files
and 171 stories already cover most of that list; this component closes the
remaining named gaps and makes the site buildable under the repository base path.

## Architecture

### Current Architecture

- `apps/storybook/.storybook/main.ts` lists `stories/**/*.stories.@(ts|tsx)` and
  MDX, with `addon-docs`, `addon-a11y` and `addon-themes`.
- `preview.ts` imports the package CSS and sets `layout: fullscreen`.
- `apps/storybook/package.json` builds with `storybook build -o storybook-static`.
- There is no named viewport configuration, no PRT-01 story and no provider wrapper story.

### Proposed Changes

| Change | File |
| ------ | ---- |
| Configure named viewports with the built-in `storybook/viewport` | `.storybook/preview.ts` |
| Add the PRT-01 fixture | `stories/fixtures.ts` |
| Add the exact 2017-yellow PRT-01 print story | `stories/Print.stories.tsx` |
| Add `FluentWrapper` and `MuiWrapper` provider stories | `stories/Adapters.stories.tsx` |
| Keep Storybook's relative asset URLs; no base override | `.storybook/main.ts` (no change) |

## Implementation Details

### RD-11 state coverage

| RD-11 requirement | Existing story | Action |
| ----------------- | -------------- | ------ |
| 2016 classic-blue | `Classic Year/Grid` → `Blue2016` | Keep |
| 2017 classic-yellow | `Classic Year/Grid` → `Yellow2017` | Keep |
| 2027 overlaps | `Year Planner/03 Items…` → `ThreeOverlappingLanes` | Keep |
| 12/14/18/24/36 months | `Year Planner/02 Layouts…` → five stories | Keep |
| Cross-month and cross-year ribbons | `Items` → `CrossMonthBooking`, `CrossYearBooking` | Keep |
| Three overlapping ribbons and compact overflow | `Items` → `ThreeOverlappingLanes`, `CompactOverflow` | Keep |
| Visibility, group, layer and item controls | `State` → `ControlledVisibility`, `HiddenGroupByDefault`, `HiddenItemByDefault` | Keep |
| Select, multi-select, marquee, paint/erase, move/resize | `Interaction` → mode and marquee stories | Keep |
| Keyboard focus and inspector | `Accessibility` → `SkipLinkFocused`, `SelectedItem`; `Inspector` → thirteen stories | Keep |
| Classic, high contrast, unstyled, Fluent/MUI wrappers | `Themes`; `Adapters` → `FluentTokens`, `MuiTokens`, `ProviderWithCustomTheme` | Keep; **add `FluentWrapper` and `MuiWrapper`** |
| Empty state, inspector, tooltip | `Items` → `NoItems`; `Inspector`; `Slots` → `CustomTooltip` | Keep |
| PRT-01 exact 2017-yellow print | — | **Add `Prt01TwoThousandSeventeen`** |
| A3 print preview | `Print` → `PaginateFourteenMonths`, `FitFourteenMonths` | Keep; document in the story description |

### PRT-01 story contract

The story is named `Prt01TwoThousandSeventeen` under the existing
`Year Planner/06 Print Planning` meta title and uses:

```tsx
args: {
  year: 2017,
  items: prt01Items,
  display: { theme: "classic-yellow", showISOWeekNumbers: true },
  print: { page: "A3", mode: "paginate" },
}
```

The fixture `prt01Items` contains the booking `2017-02-06` → `2017-02-10` and the
annotation `2017-02-01` → `2017-02-02`, matching the demo and the RD-10 print
evidence. The story description states that it is the print sample and that the
browser print preview shows the A3 page tree.

### Wrapper stories

`FluentWrapper` and `MuiWrapper` render `YearPlannerProvider` around a
`YearPlanner` whose `cssVars` come from `fluentThemeToCssVars` or
`muiThemeToCssVars`, so the published site shows the intended provider-level
integration without adding `@fluentui/react-components` or `@mui/material` to
the Storybook app. Real design-system buttons remain the demo's AC3 route and
the copy-paste examples in `docs/theming.md`.

### Base path

Storybook 10 emits relative `./` asset URLs for the manager and preview, which
already work under `https://<owner>.github.io/year-planner/`. No `viteFinal`
base override is added; an absolute base would make local static builds less
portable and does not rewrite the manager template. The docs-site check resolves
the relative URLs on disk instead of requiring a `/year-planner/` prefix.

### Story-count contract

The docs contract parses `^export const \w+: Story` from every
`apps/storybook/stories/*.stories.tsx` file and requires the same count in
`README.md`, `docs/getting-started.md` and `docs/test-report.md`. The current
count is 171 across 12 files; PRT-01 and the two wrapper stories make it 174.

### Error Handling

| Error Case | Handling Strategy | AR Ref |
| ---------- | ----------------- | ------ |
| A required RD-11 state has no story | Storybook contract test fails and names the state and file | AR-6 |
| Duplicate story IDs | `storybook:build` fails; the contract also rejects duplicate `title` values | AR-6 |
| The viewport configuration is missing | Contract asserts `parameters.viewport` in `preview.ts`; Storybook 10 provides the feature | AR-23 |
| The relative asset URLs break under a subpath | `docs:site --check-only` resolves every relative URL on disk | AR-25 |
| The printed count drifts | Contract recomputes from the story files and checks all three docs | AR-19 |

> **Traceability:** every structural decision above is recorded in
> [00-ambiguity-register.md](00-ambiguity-register.md).

## Testing Requirements

- `tests/quality/storybook-contract.spec.test.ts` owns ST-9 through ST-12.
- `pnpm storybook:build` is the build proof and runs inside `pnpm verify`.
- `pnpm docs:site` proves the base-path build in the docs-site phase.
