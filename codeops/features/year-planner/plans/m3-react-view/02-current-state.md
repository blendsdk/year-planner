# Current State: M3 React View

> **Document**: 02-current-state.md
> **Parent**: [Index](00-index.md)

## Existing Implementation

### What Exists

| Module | Capability |
|---|---|
| `packages/core/src/model/**` | Validated entity model, visibility, editability, paint/erase |
| `packages/core/src/ribbon/**` | Fragments, lanes, overflow, signature, hit index, print plan |
| `packages/core/src/layout/classic-year.ts` | Rows, 37 day slots, prefix widths, mirrored bands |
| `packages/react/src/YearPlanner.tsx` | Minimal date grid with roving focus, themes and A3 print CSS |
| `packages/react/src/styles.css` | Three theme classes and basic grid styles |
| `apps/demo` | Year/theme/zoom demo |
| `apps/storybook` | One classic-year story |

### Relevant Files

| File | Purpose | Changes Needed |
|---|---|---|
| `packages/react/src/YearPlanner.tsx` | Current minimal grid | Replace with the full view composition |
| `packages/react/src/styles.css` | Flat stylesheet | Rewrite with `@layer`, tokens, fragments, inspector, print |
| `packages/react/src/index.ts` | Public barrel | Export props, theme, provider, handle, contracts |
| `packages/react/package.json` | Exports/deps | Add adapter subpaths; no design-system peer |
| `packages/react/vite.config.ts` | Single-entry build | Add adapter entries |
| `packages/core/src/index.ts` | Core barrel | Export contracts |
| `apps/demo/src/App.tsx` | Minimal demo | Show items, inspector, overflow and print windows |
| `tests/e2e/classic-year.spec.ts` | M1 visual/print | Extend for RD-06 rendering and print pages |

## Gaps Identified

### Gap 1: No canonical selection/command contracts

**Current Behavior:** M2 validates and renders data but has no
`PlannerSelection`, `PlannerCommand`, `CommandContext`, `CommandOutcome` or
`ValidationResult`.
**Required Behavior:** RD-04's shared contracts, consumed by RD-06–RD-08.
**Fix Required:** Add type-only `contracts.ts` in core.

### Gap 2: No item/annotation rendering

**Current Behavior:** Only date cells are rendered.
**Required Behavior:** Ribbon/highlight/annotation fragments, proxies,
overflow, tooltips and slots.
**Fix Required:** Add geometry helpers and render components.

### Gap 3: No state layer

**Current Behavior:** No controlled/uncontrolled items, visibility, selection or
filter.
**Required Behavior:** Controlled wins; defaults seed local state; handle methods
dispatch the same changes.
**Fix Required:** Add state hooks and the request pipeline.

### Gap 4: No theming contract

**Current Behavior:** Three hardcoded classes, no tokens, provider, `cssVars`,
`unstyled` or print theme.
**Required Behavior:** 24 tokens, `--yp-*`, five presets, optional provider.
**Fix Required:** Add `theme.ts`, `provider.tsx` and a layered stylesheet.

### Gap 5: No inspector, tooltip or overflow UI

**Current Behavior:** Nothing.
**Required Behavior:** Component-owned inspector with actions, tooltip contract,
per-row overflow popover.
**Fix Required:** Add render components.

### Gap 6: No real multi-page print output

**Current Behavior:** Single grid with a fixed 0.72 scale.
**Required Behavior:** A3 pages matching `planRibbonPrint`, preserving month
labels, weekends, ribbons and ISO weeks.
**Fix Required:** Add a hidden print tree with per-page scale and breaks.

### Gap 7: No adapters or localization

**Current Behavior:** `Arial`, hardcoded English abbreviations, no time zone.
**Required Behavior:** `Intl` Gregorian labels, `displayTimeZone`, Fluent/MUI
token adapters.
**Fix Required:** Add `locale.ts` formatting and adapter modules.

## Dependencies

- Core M2 exports: `validatePlannerData`, `createInitialVisibility`,
  `visibilityReducer`, `getEffectiveVisibility`, `getItemEditability`,
  `canCreateItem`, `canDeleteItem`, `paintItems`, `eraseItems`,
  `buildRibbonLayout`, `createRibbonHitIndex`, `planRibbonPrint`,
  `buildClassicYearLayout`.
- Existing React 19, Testing Library, jsdom, Playwright, API Extractor.
- No new runtime dependency.

## Risks and Concerns

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| RD-06 props reference RD-08 behavior | High | Medium | Contracts first; minimal pipeline; explicit deferral ledger |
| Print PDFs differ across browsers | Medium | Medium | Chromium baseline; page count/size assertions only |
| CSS rewrite breaks M1 visual snapshots | High | Low | Intentionally regenerate snapshots and review dimensions |
| React coverage drops with many branches | High | Medium | Spec + impl tests per component; 80% gate |
| Inspector command semantics become arbitrary | Medium | Medium | Fixed simple transforms recorded in AR-21 |
| SSR hydration mismatch | Medium | High | Explicit locale/zone, no browser globals in render, SSR test |
| Package size grows past 60 kB | Low | Medium | Palette-only CSS; no runtime dependency; size check |

## Gaps Owned by Later RDs

| Gap | Owner |
|---|---|
| Pointer selection, marquee, drag, resize, paint gestures | RD-07 |
| Full command lifecycle, rollback, stale responses, controlled undo | RD-08 |
| Full axe/screen-reader audit, live announcements | RD-09 |
| Performance benchmarks and security gate suite | RD-10 |
| Complete Storybook/theming documentation | RD-11 |
| Release and publishing | RD-12 |
