# Requirements: M1 Foundation and Core

> **Document**: 01-requirements.md
> **Parent**: [Index](00-index.md)
> **Source**: [RD-01](../../requirements/RD-01-foundation.md), [RD-02](../../requirements/RD-02-temporal-core.md), [RD-03](../../requirements/RD-03-classic-year-layout.md)

## Scope of this plan (delta view)

### In this plan

- RD-01 foundation: monorepo, two packages, TS6, Vite/Vitest/Storybook/Turbo/
  pnpm/Biome/Changesets, ESM exports, CI, license/governance, clean consumer.
- RD-02 temporal core: DateKey, half-open periods, date math, ISO weeks,
  interval algebra, timed projection helper, diagnostics.
- RD-03 classic layout: 12–36 month rows, 37 fixed day columns, prefix widths,
  month/weekday labels, ISO week placement, context tint, dynamic window API.
- Minimal React grid enabler: HTML/CSS Grid rendering of the layout, classic
  blue/yellow themes, print CSS and a fresh-consumer check (AR #2).

### Deferred / out of this plan

- RD-04 layers/visibility/annotations — next plan.
- RD-05 ribbons/lanes/overflow — next plan.
- RD-06 full view/theming/customization/inspector — next plan; M1 ships only a
  minimal grid.
- RD-07 interactions, RD-08 commands, RD-09 full accessibility audit, RD-10 full
  quality suite, RD-11 docs site, RD-12 release — later plans.
- SVG renderer decision (M0 spike evidence only; no production switch).

## Plan-local decisions

| Decision | Chosen | AR Ref |
|---|---|---|
| Plan scope | RD-01–03 + minimal grid | AR #1, #2 |
| Verify command | `pnpm verify` / `pnpm verify:full` | AR #4 |
| Storybook scope | Minimal grid/theme/print stories | AR #7 |
| Renderer | HTML/CSS Grid; M0 spike separate | AR #10 |

## Acceptance Criteria

1. [ ] `pnpm install`, `pnpm typecheck`, `pnpm test`, `pnpm build` succeed.
2. [ ] Date and interval spec tests pass under UTC and at least two non-UTC TZs.
3. [ ] 2016/2017 classic layout has 14 rows, 37 columns, correct Jan 2016/2017
   column boundaries and ISO weeks.
4. [ ] 12/14/18/24/36-month windows render the correct row count; invalid
   windows are rejected.
5. [ ] A fresh Vite consumer installs both packed packages and renders the grid.
6. [ ] A3 print of the 2016 blue and 2017 yellow grids has no clipped row.
7. [ ] All created public APIs have TSDoc and the API report exists.
