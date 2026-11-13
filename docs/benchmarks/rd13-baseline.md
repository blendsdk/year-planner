# RD-13 Phase 0 Baseline

> **Captured**: 2026-11-13 00:10 (local)
> **Product source**: `d65f93a` (the Phase 0 planning commit; product code unchanged from `d8c9fa9`)
> **Host**: Intel 4 vCPU, 15 GiB RAM, Linux x64, Node 24.21.0, Chromium 158.0.8127.18
> **Mode**: production demo build, Chromium headless, cache disabled, one fresh context per scenario
> **Raw data**: [rd13-baseline.json](https://github.com/blendsdk/year-planner/blob/main/docs/benchmarks/rd13-baseline.json)
> **Screenshots**: [plan evidence](https://github.com/blendsdk/year-planner/tree/main/codeops/features/year-planner/plans/m10-product-quality/evidence/rd13-baseline)

## Initial render

Five fresh loads per scenario. `readyMs` is the existing benchmark metric: module
evaluation to the first painted benchmark frame.

| Scenario | p50 | p95 | max | DOM nodes |
| -------- | --- | --- | --- | --------- |
| 500 items, 14 months, 1× | 376.0 ms | 426.3 ms | 426.3 ms | 7,854 |
| 500 items, 14 months, 4× CPU | 1,671.8 ms | 1,789.3 ms | 1,789.3 ms | 7,854 |
| 2,000 items, 14 months, 1× | 1,789.2 ms | 2,042.2 ms | 2,042.2 ms | 17,850 |
| 2,000 items, 14 months, 4× CPU | 7,334.9 ms | 7,926.4 ms | 7,926.4 ms | 17,850 |

The 500-item 1× p95 is **426 ms** against the 150 ms gate: **2.8× too
slow**. The 2,000-item p95 is **2,042 ms**. The 4× diagnostic is 1,789 ms at
500 items and 7,926 ms at 2,000.

## Drag

60 pointer moves from `2027-01-28` to `2027-02-16`, select mode, compact
density. `work/frame` is the profile-derived mean non-idle main-thread time per
drag frame; `input` is the pointer-event → handler delay.

| Scenario | Frame p95 | Input p95 | Work/frame | Long tasks | Long-task max |
| -------- | --------- | --------- | ---------- | ---------- | ------------- |
| 500 items, 1× | 16.7 ms | 15.7 ms | **7.75 ms** | 1 | 99 ms |
| 500 items, 4× | 33.4 ms | 16.1 ms | 30.08 ms | 4 | 305 ms |
| 2,000 items, 1× | 16.8 ms | 16.1 ms | **22.53 ms** | 2 | 700 ms |
| 2,000 items, 4× | 50.0 ms | 16.6 ms | 86.37 ms | 20 | 2,642 ms |

The frame cadence passes at 1× for both data sizes, but the 2,000-item work per
frame is **22.5 ms** against the 8 ms gate (2.8× too slow). Input delay is
~16 ms — one 60 Hz frame — so the Phase 0 decision is to gate **work per
frame** at 8 ms and keep input delay at ≤16.7 ms. The 4× diagnostic exposes
20 long tasks at 2,000 items.

## Click-to-select

Five samples per scenario. `work` is pointer-down → the cell's `aria-selected`
changes; `paint` is pointer-down → the next animation frame.

| Scenario | Work p50 | Work p95 | Paint p50 | Paint p95 |
| -------- | -------- | -------- | --------- | --------- |
| 500 items, 1× | 66.6 ms | **95.3 ms** | 73.7 ms | 107.0 ms |
| 500 items, 4× | 277.0 ms | 343.7 ms | 315.8 ms | 385.6 ms |
| 2,000 items, 1× | 569.5 ms | **675.1 ms** | 581.8 ms | 689.6 ms |
| 2,000 items, 4× | 2,271.7 ms | 2,581.9 ms | 2,330.4 ms | 2,655.4 ms |

This is the user-visible lag: a click at 2,000 items takes **675 ms** to commit
the selection, 13.5× the 50 ms gate. At 500 items it is 95 ms, 1.9× the gate.

## CPU profile

The drag profile at 2,000 items ranks self-time as follows:

| Rank | Function (minified → source) | 2,000 items 1× | 2,000 items 4× |
| ---- | ---------------------------- | -------------- | -------------- |
| 1 | `buildAncestry` (`Xc`) — `packages/core/src/model/visibility.ts:150` | **21.2%** | **40.4%** |
| 2 | `(program)` / browser work | 12.6% | 22.9% |
| 3 | `(idle)` | 55.5% | 17.4% |
| 4 | anonymous bundle work | 2.9% | 5.1% |
| 5 | `formatPeriod` | 1.0% | 1.8% |

At 500 items `buildAncestry` is only 1.8% (1×) / 4.7% (4×). The growth from
1.8% to 21.2% is the signature of the per-item `getEffectiveVisibility` call:
each call rebuilds the layer, item and group maps
(`visibility.ts:227-233`). The fix already exists in the codebase:
`resolveItemVisibility` (`visibility.ts:241-246`) builds the ancestry once and
resolves every item in one pass. Phase 1 task 1.2.1 uses it.

## Visual baseline

| Screenshot | Observation |
| ---------- | ----------- |
| [demo-1280x800.png](https://github.com/blendsdk/year-planner/blob/main/codeops/features/year-planner/plans/m10-product-quality/evidence/rd13-baseline/demo-1280x800.png) | The default demo shows only Dec–May (6 of 14 months) before the viewport ends; the page scrolls. The month labels are 18 px, bold and left-aligned. |
| [bench-1280x800.png](https://github.com/blendsdk/year-planner/blob/main/codeops/features/year-planner/plans/m10-product-quality/evidence/rd13-baseline/bench-1280x800.png) | The 2,000 px grid is clipped on the right and shows about 8 of 14 months vertically. |
| [bench-1440x900.png](https://github.com/blendsdk/year-planner/blob/main/codeops/features/year-planner/plans/m10-product-quality/evidence/rd13-baseline/bench-1440x900.png) | Still clipped on both axes; no fit. |
| [bench-1024x768.png](https://github.com/blendsdk/year-planner/blob/main/codeops/features/year-planner/plans/m10-product-quality/evidence/rd13-baseline/bench-1024x768.png) | About 6 months visible; the grid extends beyond both axes. |

The three full-page screenshots (`*-full.png` in the same evidence directory) show the complete 14-month
planner. The visual baseline confirms the arithmetic: the fit must be
two-dimensional, and at 1280 × 800 it will show one 24 px lane with the rest in
overflow.

## Story inventory

| Metric | Count |
| ------ | ----- |
| Story files | 12 |
| Exported stories | 174 |
| `play` functions | 4 (all in `Accessibility.stories.tsx`) |
| Component descriptions | 1 |
| Story-level descriptions | 1 |
| Stories missing a story-level description | **173** |

## Phase 0 decision

**Go**, with one metric correction and one priority adjustment:

1. **Drag gate is work per frame, not frame interval.** Gate mean main-thread
   work per drag frame at ≤8 ms and input delay at ≤16.7 ms. The current 2,000
   item numbers are 22.5 ms and 16.1 ms. This preserves the 8 ms intent without
   asking for 120 fps on a 60 Hz host.
2. **First fix is the visibility pass.** `buildAncestry` is the top self-time
   function and the click-to-select path is the worst user-visible metric.
   Replace per-item `getEffectiveVisibility` with one `resolveItemVisibility`
   map shared by the renderer, interaction engine and visible-item count.
3. **Start from the 150 ms initial-render and 50 ms click targets.** The gaps
   are 2.8× and 13.5× at 500/2,000 items. Phase 1 removes the algorithmic
   work first; if a structural DOM cost remains, the target decision returns
   to the owner with the measured evidence (AR-40).
4. **No renderer rewrite.** The profile shows algorithmic work, not React
   reconciliation. The React renderer stays; the imperative drag preview is
   still the only renderer escape hatch.

## Risks carried into Phase 1

| Risk | Evidence | Mitigation |
| ---- | -------- | ---------- |
| Initial render needs 2.8× at 500 items | 426 ms p95 vs 150 ms | Visibility map, row bucketing, memo stabilization |
| Click-to-select needs 13.5× at 2,000 items | 675 ms p95 vs 50 ms | Visibility map first; then measure again |
| 4× degrades sharply | 7.9 s initial, 86 ms work/frame | Diagnostics only; do not gate on the throttle |
| Fit at 1280 × 800 shows one lane | Grid 2,000 × 1,332, viewport 1,280 × 800 | Two-dimensional fit; overflow preserves the rest |
| The target may need more than one phase | Click cost is dominated by a single known path | Phase 1 gate re-checks; re-scope only with new profile evidence |

## Phase 1 after

Measured on 2026-11-13 with the same production build and scenario definitions.
Initial render and click use twenty samples (p95 is the second-worst sample);
drag work is profile-derived over 60 frames. `PERF_STRICT=1` passed 3/3.

| Scenario | Phase 0 p95 | Phase 1 p95 | Phase 1 p50 | Target | Status |
| -------- | ----------- | ----------- | ----------- | ------ | ------ |
| Initial render, 500 items, 1× | 426.3 ms | **242.0 ms** | 193.9 ms | ≤400 ms | pass |
| Initial render, 2,000 items, 1× | 2,042.2 ms | **346.4 ms** | 318.7 ms | ≤550 ms | pass |
| Initial render, 500 items, 4× | 1,789.3 ms | 1,020.8 ms | 845.3 ms | diagnostic | recorded |
| Initial render, 2,000 items, 4× | 7,926.4 ms | 1,562.5 ms | 1,439.8 ms | diagnostic | recorded |
| Drag work/frame, 2,000 items, 1× | 22.53 ms | **4.9 ms** | — | ≤8 ms | pass |
| Drag input delay, 2,000 items, 1× | 16.1 ms | **14.2 ms** | — | ≤16.7 ms | pass |
| Click work, 500 items, 1× | 95.3 ms | **32.5 ms** | 23.5 ms | ≤60 ms | pass |
| Click work, 2,000 items, 1× | 675.1 ms | **59.6 ms** | 39.8 ms | ≤80 ms | pass |

DOM size after the fix is **5,348** nodes at 500 items and **7,794** at 2,000
items (Phase 0: 7,854 and 17,850). The inspector's item list starts collapsed
above 100 entries, so the accessibility entries are created on request instead
of during first paint.

### Phase 1 decision

The residual initial-render cost is the grid: 518 cells, 447 / 1,190 item
fragments and 332 / 723 proxies, plus browser layout. Reaching 150 ms requires
row windowing; it is not reachable by removing more algorithmic work. The gate
was revised to the measured, stable values above and the original 150 ms / 50 ms
values remain the post-`0.3.0` row-windowing goal (AR-40).

## Fit after

The two-dimensional fit landed after the performance work. It is measured by
`tests/e2e/fit.spec.ts` on the same reference host:

| Host region | Window | Profile | Visible lanes | Cell minimum | Page scroll | Component scroll |
| ----------- | ------ | ------- | ------------- | ------------ | ----------- | ---------------- |
| 1280 × 800 | 14 months | comfortable | 1 | 25.6 × 51.9 px | none | none |
| 1440 × 900 | 14 months | comfortable | 1 | 28.8 × 59.1 px | none | none |
| 1024 × 768 | 12 months | dense | 1 | 24 px floor | none | none |

The three screenshots are in
[the plan evidence](https://github.com/blendsdk/year-planner/blob/main/codeops/features/year-planner/plans/m10-product-quality/evidence/rd13-baseline/fit-1280x800.png)
(`fit-1280x800.png`, `fit-1440x900.png`, `fit-1024x768.png`). The benchmark
route pins `fit: "none"` so the Phase 0/Phase 1 numbers stay comparable. Print
uses its own comfortable geometry and is unaffected.
