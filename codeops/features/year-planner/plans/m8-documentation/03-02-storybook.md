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
- There is no viewport addon, no base-path configuration and no PRT-01 story.

### Proposed Changes

| Change | File |
| ------ | ---- |
| Add `@storybook/addon-viewport` 10.6.6 and register it | `apps/storybook/package.json`, `.storybook/main.ts` |
| Add named viewports (mobile, tablet, desktop A3 width) | `.storybook/preview.ts` |
| Add `viteFinal` with `base: process.env.STORYBOOK_BASE ?? "/"` | `.storybook/main.ts` |
| Add the PRT-01 fixture | `stories/fixtures.ts` |
| Add the exact 2017-yellow PRT-01 print story | `stories/Print.stories.tsx` |

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
| Classic, high contrast, unstyled, Fluent/MUI wrappers | `Themes` and `Adapters` | Keep |
| Empty state, inspector, tooltip | `Items` → `NoItems`; `Inspector`; `Slots` → `CustomTooltip` | Keep |
| PRT-01 exact 2017-yellow print | — | **Add `Prt01TwoThousandSeventeen`** |
| A3 print preview | `Print` → `PaginateFourteenMonths`, `FitFourteenMonths` | Keep; document in the story description |

### PRT-01 story contract

The story is named `Prt01TwoThousandSeventeen` in `Print.stories.tsx` and uses:

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

### Base path

`viteFinal` sets the Vite `base` from `STORYBOOK_BASE`. The default is `/`, so
`pnpm storybook` and `pnpm storybook:build` behave as today. `docs:site` sets
`/year-planner/`, so every asset URL in the built `index.html` starts with the
repository path and the site works from `https://<owner>.github.io/year-planner/`.

### Story-count contract

The docs contract parses `^export const \w+: Story` from every
`apps/storybook/stories/*.stories.tsx` file and requires the same count in
`docs/getting-started.md`. The current count is 171 across 12 files; the PRT-01
story makes it 172.

### Error Handling

| Error Case | Handling Strategy | AR Ref |
| ---------- | ----------------- | ------ |
| A required RD-11 state has no story | Storybook contract test fails and names the state and file | AR-6 |
| Duplicate story IDs | `storybook:build` fails; the contract also rejects duplicate `title` values | AR-6 |
| Base path leaks into local builds | `STORYBOOK_BASE` defaults to `/`; only `docs:site` overrides it | AR-7 |
| The printed count drifts | Contract recomputes from the story files | AR-19 |

> **Traceability:** every structural decision above is recorded in
> [00-ambiguity-register.md](00-ambiguity-register.md).

## Testing Requirements

- `tests/quality/storybook-contract.spec.test.ts` owns ST-9 through ST-12.
- `pnpm storybook:build` is the build proof and runs inside `pnpm verify`.
- `pnpm docs:site` proves the base-path build in the docs-site phase.
