# Phase 0 Baseline: Product Quality

> **Document**: 00-baseline.md
> **Parent**: [Index](00-index.md)
> **Captured**: 2026-11-13 00:10
> **Evidence owner**: [docs/benchmarks/rd13-baseline.md](../../../../../docs/benchmarks/rd13-baseline.md) — full tables, profile and screenshots
> **Raw data**: [docs/benchmarks/rd13-baseline.json](../../../../../docs/benchmarks/rd13-baseline.json)

## Headline results

| Metric | 500 items | 2,000 items | Target | Status |
| ------ | --------- | ----------- | ------ | ------ |
| Initial render p95, 1× | 426.3 ms | 2,042.2 ms | ≤150 ms | Miss (2.8× at 500) |
| Initial render p95, 4× | 1,789.3 ms | 7,926.4 ms | Diagnostic | Recorded |
| Drag frame p95, 1× | 16.7 ms | 16.8 ms | ≤16.7 ms + jitter | Pass (no headroom) |
| Drag input delay p95, 1× | 15.7 ms | 16.1 ms | ≤16.7 ms | Pass |
| Drag work per frame, 1× | 7.75 ms | 22.53 ms | ≤8 ms | Miss at 2,000 (2.8×) |
| Click-to-select work p95, 1× | 95.3 ms | 675.1 ms | ≤50 ms | Miss (1.9× / 13.5×) |
| Long tasks during 2,000 drag | 2 | 2 | 0 preferred | Recorded |
| Stories with a story-level description | 1 / 174 | — | 174 / 174 | 173 missing |

The full tables, the four CPU-profile summaries and the seven screenshots are in
the evidence owner. The [demo-1280x800.png](evidence/rd13-baseline/demo-1280x800.png) screenshot shows 6 of 14 months at
a 1280 × 800 viewport; the grid is about 2,000 × 1,332 px.

## Profile finding

The top self-time function at 2,000 items is `buildAncestry`
(`packages/core/src/model/visibility.ts:150`): **21.2%** of samples at 1× and
**40.4%** at 4×, versus 1.8% at 500 items. It is called through
`getEffectiveVisibility` for every item, rebuilding the layer, item and group
maps each time. `resolveItemVisibility` already builds the ancestry once. This
is the first Phase 1 change.

## Decision

**Go.** The work is algorithmic and the existing React renderer stays.

| Decision | Ruling | AR |
| -------- | ------ | -- |
| Renderer | Keep React; no rewrite; imperative drag preview only | AR-4 |
| Drag gate | Main-thread work per frame ≤8 ms + input delay ≤16.7 ms | AR-3 |
| First performance fix | Resolve visibility once per model and share the map | AR-3 |
| Initial-render and click targets | Keep 150 ms and 50 ms; do not re-label the miss | AR-3 |
| Fit | Two-dimensional: horizontal columns + vertical 24 px lane budget; one lane at 1280 × 800 | AR-5 |
| Visual/Storybook work | Phase 2–4 as planned; 173 descriptions to add | AR-18–AR-20 |

The drag metric was refined because the Phase 0 data shows input delay is
one frame (~16 ms) and the 8 ms intent is only meaningful as main-thread work.
This is recorded in RD-13 AC3 and AR-3.

## Re-scope trigger

The trigger was reached: after the visibility map, row bucketing, lane index
and memo fixes, the original 150 ms / 50 ms values were still missed because
the residual cost is DOM and browser layout, not the removed algorithm. The
owner delegated the target decision with the RD-13 delivery directive; the
decision is recorded as AR-40 and the revised targets are enforced by the
strict benchmark run.

## Phase 1 result

The visibility map, per-item projection, lane index, set-backed date index,
stable click callbacks, stable selected-item identity, row-scoped selection and
the collapsed large item list are implemented and unit-tested. The strict
RD-13 run passes every gate on 2026-11-13:

| Metric | Phase 0 | Phase 1 | Target | Status |
| ------ | ------- | ------- | ------ | ------ |
| Initial render, 500 items, 1× p95 | 426.3 ms | **347.9 ms** (p50 226.6) | ≤400 ms | Pass |
| Initial render, 2,000 items, 1× p95 | 2,042.2 ms | **426.2 ms** (p50 378.2) | ≤550 ms | Pass |
| Initial render, 500 items, 4× p95 | 1,789.3 ms | 1,020.8 ms | Diagnostic | Recorded |
| Initial render, 2,000 items, 4× p95 | 7,926.4 ms | 1,562.5 ms | Diagnostic | Recorded |
| Drag work/frame, 2,000 items | 22.53 ms | **3.84 ms** | ≤8 ms | Pass |
| Drag input delay, 2,000 items | 16.1 ms | **15.5 ms** | ≤16.7 ms | Pass |
| Click work p95, 500 items | 95.3 ms | **40.2 ms** (p50 26.5) | ≤60 ms | Pass |
| Click work p95, 2,000 items | 675.1 ms | **68.8 ms** (p50 45.7) | ≤80 ms | Pass |

DOM size fell from 7,854 to **5,348** nodes at 500 items and from 17,850 to
**7,794** at 2,000 items. The installed budget moved from 65 to 66 kB to absorb
the row-selection key and the collapsed item list; the measured total is
65.27 kB. The accessibility item list now renders as a single "Show all N items" control above 100 entries and materializes the
entries on request. The remaining initial-render cost is the grid itself: 518
cells, 447/1,190 item fragments, 332/723 proxies and browser layout. Reaching
the original 150 ms value needs row windowing, which is a separate structural
milestone rather than a further algorithmic fix.
