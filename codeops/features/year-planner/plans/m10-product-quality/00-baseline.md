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

If Phase 1 still misses the 500-item 150 ms p95 or the 2,000-item 50 ms click
p95 after the visibility map, row bucketing and memo fixes, the executor stops
and brings the measured options back to the owner. The plan does not lower the
target silently.
