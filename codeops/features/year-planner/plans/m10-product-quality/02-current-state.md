# Current State: Product Quality

> **Document**: 02-current-state.md
> **Parent**: [Index](00-index.md)

## Existing Implementation

### What Exists

- A complete classic year planner: 37 fixed day columns, Saturday-first,
  12–36 month windows with a 14-month default, continuous ribbons, print,
  accessibility, controlled state and commands.
- Two public packages at lockstep `0.2.0`; unpublished.
- A production benchmark harness at `tests/perf/bench.spec.ts` with initial
  render, drag, overflow and CPU-profile scenarios.
- A Storybook catalogue with 174 stories across 12 files.
- CSS-variable themes and theme units for row height, lane height and column
  widths.
- A release workflow and `0.2.0` bootstrap documentation.

### The size arithmetic

`packages/core/src/layout/classic-year.ts:146-152` sets the default design
units: month band 70 px, weekend 40 px, weekday 55 px, row height 90 px, header
36 px.

| Dimension | Calculation | Result |
| --------- | ----------- | ------ |
| Width | 37 columns (≈12 weekend × 40 + 25 weekday × 55) + two 70 px bands | ≈ **2,000 px** |
| Height | 14 rows × 90 px + 36 px header + 36 px footer | **1,332 px** |
| At zoom 0.75 | width × 0.75, height × 0.75 | ≈ **1,496 × 999 px** |
| 1280 × 800 host | available width 1,280; available height 800 | needs ≈ 0.64 × 0.60 |
| 1024 × 768 host | 12 months; 37 columns | needs ≈ 0.51 × 0.667 |

`packages/react/src/geometry.ts:13-20` clamps zoom to `[0.75, 1.5]`, so the
slider cannot reach the scale an embedded layout needs. This is the exact
reason the demo only fits at the minimum zoom.

Rows can also grow beyond `rowHeight`: `fragments.ts:183-193` uses
`max(rowHeight, visibleLaneCount × laneHeight + laneTop)`. A 14-month view with
three lanes is therefore taller than `14 × 90 + 72`; the fit must use the
actual ribbon row heights, not a naive multiplication. `laneTop` is not yet
exposed through the React option resolver.

### Relevant Files

| File | Purpose | Changes Needed |
| ---- | ------- | -------------- |
| `packages/core/src/layout/classic-year.ts` | Default units and 37-column layout | Keep the model; expose unit values through the theme |
| `packages/react/src/geometry.ts` | Zoom clamp and fragment scaling | Add fit-scale composition |
| `packages/react/src/theme.ts` | Theme units and presets | Add compact unit profile and font tokens |
| `packages/react/src/types.ts` | `DisplayConfig` and public props | Add `fit` and `onContextMenuRequest` types |
| `packages/react/src/YearPlanner.tsx` | Prop wiring and layout | Add ResizeObserver fit, context-menu dispatch |
| `packages/react/src/render/MonthRow.tsx` | Month/year label | Centre the two-line label |
| `packages/react/src/render/YearGrid.tsx` | Header row and grid geometry | Use fit-scaled units |
| `packages/react/src/styles.css` | Header and cell typography | Centre labels, tokenize font sizes |
| `packages/react/src/interaction/useInteraction.ts` | Pointer and keyboard flow | Right-click routing, transient preview |
| `packages/react/src/interaction/pointer.ts` | Pointer dispatch | Distinguish button 2 |
| `packages/react/src/render/ItemOverlay.tsx` | Item proxy overlay | Imperative preview escape hatch |
| `apps/demo/src/App.tsx` | Demo page | Bounded app shell and 12-month preset |
| `apps/storybook/stories/` | 174 stories | Demos, event log, descriptions |
| `tests/perf/bench.spec.ts` | Production benchmark | CPU throttle and click metric |
| `docs/benchmarks/` | RD-10 evidence | Add RD-13 baseline |
| `docs/releasing.md`, `docs/migration.md`, `docs/test-report.md` | Release narrative | Move to `0.3.0` / `0.3.1` |

### Code Analysis

**Fit.** `.yp-viewport` already scrolls (`styles.css:60-66`), but the grid uses
`width: max-content` and fixed design units. There is no container measurement,
no `ResizeObserver`, no `fit` prop and no compact profile. The theme exposes
units, so a host can hand-tune them, but the default does not adapt.

**Typography.** `.yp-heading` is 14 px/700 (`styles.css:159`); `.yp-month` is
18 px/700 with `padding-left: 13px` (`styles.css:168`). The label is two spans
stacked in a column (`MonthRow.tsx:123`) and is left-aligned. The stylesheet
contains more than twenty hard-coded `font-size` values, including 8, 9 and
10 px labels.

**Context menu.** A source search for `contextmenu`, `onContextMenu` and
`contextMenu` under `packages/react/src` returns nothing. Right-click is
unhandled; the browser menu appears, and no planner state changes. There is no
target discrimination and no keyboard path.

**Performance.** `docs/performance.md:12-21` records 414 ms at 500 items and
50,458 ms at 10,000 items for initial render, against a 150 ms budget. Drag is
16.7 ms at 500 and 16.8 ms at 2,000 — passing with no headroom. Overflow at
10,000 is 118 ms against 100 ms. The existing harness runs a production preview
at 1600 × 1200, five fresh loads for initial render, and 60-step drags with a
CPU profile. It does not apply CPU throttling and does not measure
click-to-select.

**Storybook.** 174 exported stories across 12 files; four `play` functions, all
in `Accessibility.stories.tsx`; two `description` entries. The catalogue proves
render states but does not show a first-time reader what a click does.

**Demo.** `apps/demo/src/App.tsx` renders the planner in a full-page `main`
with a zoom slider at 0.75–1.5 and a 14-month default. It does not model an
application region with a bounded height, so the page grows instead of the
planner scrolling.

**Release.** `docs/releasing.md` and `docs/migration.md` describe `0.2.0` as
the bootstrap and `0.2.1` as the provenance release. Nothing has been published.

## Gaps Identified

### Gap 1: The grid cannot fit an embedded region

**Current Behavior:** ≈2,000 × 1,332 px at default units; the zoom floor is
0.75, which still overflows a 1440 × 900 laptop with a sidebar.
**Required Behavior:** `display.fit: "contain"` measures the host region,
scales columns horizontally, chooses a vertical lane budget with 24 px cells
and 24 px item proxies, and scrolls inside the component when the floor is
reached.
**Fix Required:** Host-region observer, two-dimensional fit, compact/dense
profiles, `laneTop` plumbing, zoom composition and a bounded demo shell.

### Gap 2: Initial render is far above budget

**Current Behavior:** 414 ms p50 / 565 ms p95 at 500 items; 50,458 ms p95 at
10,000; superlinear.
**Required Behavior:** Unthrottled 500-item initial render p95 ≤150 ms;
2,000-item drag **input-delay** p95 ≤8 ms; click-to-select **work** p95 ≤50 ms.
4× CPU-throttled numbers are diagnostics.
**Fix Required:** Profile, fix algorithmic work (including the per-item
visibility pass), stabilize memo boundaries, move transient drag geometry out
of React state.

### Gap 3: Header typography is oversized and uncentred

**Current Behavior:** 18 px/700 month label, left-aligned; 14 px/700 day names;
hard-coded sizes.
**Required Behavior:** Centred two-line month/year label, smaller day names,
per-element CSS variables, tabular numerals.
**Fix Required:** CSS and token changes plus month-row markup alignment.

### Gap 4: No context menu

**Current Behavior:** Right-click does nothing; no request contract.
**Required Behavior:** Host-owned `onContextMenuRequest` for date, item and
annotation targets from pointer and keyboard; native fallback; no gesture.
**Fix Required:** Public types, pointer routing, keyboard dispatch, selection
semantics, adapter examples.

### Gap 5: Storybook is a catalogue, not a demo

**Current Behavior:** 174 stories, 4 play functions, 2 component descriptions
and zero story-level descriptions.
**Required Behavior:** Demos section with at least six play stories, event-log
playground, one-line description on every story.
**Fix Required:** Story structure, play functions, event panel, descriptions,
navigation.

### Gap 6: Release documents target an unpublished `0.2.0`

**Current Behavior:** `docs/releasing.md` and `docs/migration.md` describe the
`0.2.0` bootstrap and `0.2.1` provenance release.
**Required Behavior:** The intended first published version is `0.3.0`;
`0.3.1` is the provenance release. `0.2.0` remains unpublished history. The
“never published” fact is a release-time registry check, so AC8 stays
`partial` until the owner attests it.
**Fix Required:** Update the release, migration and test-report documents, the
release contract and the release checklist evidence.

## Dependencies

### Internal Dependencies

- RD-03 layout units and the 37-column model.
- RD-06 `DisplayConfig`, themes and CSS variables.
- RD-07 gesture engine, selection and keyboard navigation.
- RD-09 24 px target contract and focus behavior.
- RD-10 benchmark harness and reference host.
- RD-11 Storybook and docs site.
- RD-12 release workflow and versioning.

### External Dependencies

- Playwright 1.65 Chromium for measurement and screenshots.
- Browser `ResizeObserver`, `PerformanceObserver` and `requestAnimationFrame`.
- No new package.

## Risks and Concerns

| Risk | Likelihood | Impact | Mitigation |
| ---- | ---------- | ------ | ---------- |
| Initial-render target is not reachable without a structural change | Med | High | Phase 0 profile is a go/no-go gate with an explicit re-scope branch; fix the algorithm before considering a larger change |
| A 1280 × 800 fit needs cells or proxies below 24 px | Med | High | Two-dimensional fit with one visible lane at the floor; verify with a prototype and a proxy bounding-box test |
| Fit breaks print or E2E visual baselines | Med | Med | Fit is screen-only; rebaseline in Phase 2 and run the print matrix |
| Right-click interferes with the gesture engine | Med | Med | Route button 2 before gesture start; add pointer and keyboard tests |
| Four-times throttling makes measurements noisy | Med | Med | Five fresh loads, p95, same host, record raw samples |
| Story descriptions become stale | Med | Low | A quality contract checks every story has a non-empty description |
| Demo shell hides real integration problems | Low | Med | The demo uses the same public props as a host application |
| `0.3.0` release docs drift from the actual bootstrap | Low | High | Phase 5 updates the docs and runs `release:check` and the dry run |
