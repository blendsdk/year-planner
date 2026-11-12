# Performance: Product Quality

> **Document**: 03-01-performance.md
> **Parent**: [Index](00-index.md)

## Overview

The initial-render curve is superlinear: the RD-10 record is 414 ms p50 at 500
items and 50,458 ms p95 at 10,000 items. The current 500-item p95 is 666 ms.
Twenty times the data produces roughly ninety times the p95 time. React
reconciliation scales with rendered nodes, not with the square of the item
count, so the first job is to locate the algorithmic work before changing the
renderer. The supported target is 2,000 items; 10,000 remains a documented
stress case.

## Architecture

### Current Architecture

- `packages/core` is pure TypeScript with no React or DOM dependency.
- `packages/react/src/YearPlanner.tsx` builds the layout, ribbon fragments,
  item index and print plan in memoized blocks.
- `tests/perf/bench.spec.ts` runs a production preview at 1600 × 1200, five
  fresh loads per initial-render scenario, 60-step drags, and an optional CPU
  profile.
- `docs/benchmarks/rd10-baseline.json` holds the RD-10 baseline.
- `scripts/bench-budgets.mjs` sets the shared budgets; `PERF_STRICT=1` turns on
  the 2× ceiling checks.

### Candidate hot paths (to confirm in Phase 0)

| Candidate | Evidence | Why it may be superlinear |
| --------- | -------- | ------------------------- |
| Per-item visibility resolution | `YearPlanner.tsx:302-313` calls `resolveEffectiveVisibility(item.id, …)` per item; `visibility.ts:143-148,227-233` rebuilds layer/item/group maps per call | O(n²) in the item count |
| Per-row projection of every item | `fragments.ts:252-256` calls `projectPeriod` for every item for every row | O(rows × items); linear for a fixed 14 rows but expensive in absolute terms |
| Linear lane assignment | `lanes.ts:42-75` scans lanes from zero for each candidate | Worst case O(n²) inside a dense row |
| Day expansion of every fragment | `YearPlanner.tsx:260-273` expands each fragment day by day and uses `list.includes` | O(fragment days × items per date) |
| Memo identity churn | `MonthRow.tsx:58-70` compares many props; callbacks and maps must stay stable | A failed memo re-renders 518 cells |
| Transient drag state in React | `useInteraction.ts:335-350` rAF-throttles, but each frame still updates preview state | A preview render per pointer frame; the row and overlay blocks are already memoized |
| Fixture construction | `scripts/bench-data.mjs` generates the model inside the measured window | Linear, but included in `readyMs` |

The candidates are hypotheses. Phase 0 records a CPU profile and attributes
self-time before any fix is chosen.

### Proposed Changes

| Change | File |
| ------ | ---- |
| Resolve visibility once per model and share the map | `packages/react/src/YearPlanner.tsx`, `interaction/useInteraction.ts` |
| Project each item once and bucket candidates by row | `packages/core/src/ribbon/fragments.ts` |
| Replace the linear lane scan with an interval/free-lane index | `packages/core/src/ribbon/lanes.ts` |
| Deduplicate item IDs per date with a set-backed index | `packages/react/src/YearPlanner.tsx` |
| Stabilize row props and callbacks | `packages/react/src/render/MonthRow.tsx`, `YearPlanner.tsx` |
| Imperative drag preview with one commit on pointer-up | `packages/react/src/interaction/useInteraction.ts`, `render/ItemOverlay.tsx` |
| CPU-throttle and click-to-select scenarios with explicit strict assertions | `tests/perf/bench.spec.ts` |
| Pin the benchmark route to `fit: "none"` | `apps/demo/src/BenchDemo.tsx` |
| Baseline evidence | `docs/benchmarks/rd13-baseline.md`, `rd13-baseline.json` |

## Implementation Details

### Measurement protocol

1. Build the demo with `pnpm --filter @blendsdk/year-planner-demo build`.
2. Serve `apps/demo/dist` with a static server; use the production bundle only.
3. Initial render, **unthrottled**: five fresh loads at 500 and 2,000 items,
   14 months; record `window.__YP_BENCH__.readyMs`, p50/p95/max and DOM node
   count.
4. Initial render, **4× CPU throttle** (CDP `Emulation.setCPUThrottlingRate`):
   the same five loads, recorded as a diagnostic.
5. Drag, unthrottled: 60 pointer moves from `2027-01-28` to `2027-02-16`;
   record frame deltas, input delays and long tasks; save a `.cpuprofile`.
6. Drag, 4× throttle: the same path as a diagnostic.
7. Click-to-select: record the `pointerdown` timestamp and the selection commit
   timestamp in the page; gate the **work time**, and also report the
   pointer-to-next-frame time. Five samples per item count.
8. Store raw JSON in `docs/benchmarks/rd13-baseline.json`; keep profiler output
   in `$CODEOPS_TMPDIR` and summarize the top self-time functions in the
   baseline report.

### Targets

| Metric | Metric definition | Target | Gate |
| ------ | ----------------- | ------ | ---- |
| Initial render, 500 items | `readyMs` p95, production, unthrottled | ≤150 ms | Explicit `PERF_STRICT=1` assertion |
| Initial render, 2,000 items | `readyMs` p95, production, unthrottled | Diagnostic | Baseline report |
| Drag, 2,000 items | Input delay p95 (pointer event → handler) | ≤8 ms | Explicit `PERF_STRICT=1` assertion |
| Drag frame cadence | rAF delta p95 | ≤16.7 ms + jitter | Existing ceiling |
| Click-to-select | Pointer-down → selection commit p95 | ≤50 ms | Explicit `PERF_STRICT=1` assertion |
| Initial render, 4× throttle | `readyMs` p95, diagnostic | Record only | Baseline report |
| Drag, 4× throttle | Input delay and frame p95, diagnostic | Record only | Baseline report |
| Overflow, 10,000 items | Existing open/close metric | ≤100 ms | Existing budget |
| 10,000-item initial render | `readyMs` p95, stress | Record only | Baseline report |

The 8 ms drag target is **input delay**, not the rAF interval. The rAF interval
cannot go below one 60 Hz frame (16.7 ms), so a frame-delta target of 8 ms
would be physically impossible. The frame cadence keeps its existing 16.7 ms
budget.

### Optimization order

1. **Attribute cost.** Use the CPU profile to rank self-time by function.
2. **Resolve visibility once.** Build one visibility map per model and pass it
   to `YearPlanner`, `useInteraction` and the visible-item count. The current
   per-item call rebuilds the layer/item/group maps, which is O(n²).
3. **Remove repeated projection.** Project once per layout and bucket
   candidates by row.
4. **Make lane assignment sub-quadratic.** Track the last occupied interval per
   lane or use a free-lane heap; preserve the deterministic ordering.
5. **Tighten the date index.** Use a `Set` per date and materialize the array
   once, instead of `includes` on every fragment day.
6. **Stabilize React props.** Keep callbacks in refs or `useCallback` with
   stable dependencies; do not recreate `itemsByDate` or formatters.
7. **Move transient previews out of React state.** Write preview geometry to
   nodes through refs during the gesture; commit selection and command state on
   pointer-up.
8. **Re-measure after fit.** The fit changes geometry and node sizes, not node
   counts; the 2,000-item numbers must still meet the target with the benchmark
   route pinned to `fit: "none"` for comparability.

### Phase 0 go/no-go

Phase 0 records the current p95 and the profile, then writes one of:

- **Go:** the profile shows removable algorithmic work and the 150 ms / 8 ms /
  50 ms targets are plausible; Phase 1 proceeds.
- **Re-scope:** the profile shows a structural blocker; the renderer decision
  returns to the owner with measured options before Phase 1 starts.

The plan does not silently lower the target if the first attempt misses it.

### Error Handling

| Error Case | Handling Strategy | AR Ref |
| ---------- | ----------------- | ------ |
| The profile shows React reconciliation as the dominant cost | Keep the React renderer; apply the imperative preview and memo fixes; re-measure before considering a larger change | AR-4 |
| The 500-item target is not reachable without a structural change | Record the gap and the evidence; bring the renderer decision back to the owner with measured options | AR-4 |
| 4× throttle makes the harness time out | Keep the production gate unthrottled; use the 4× run as a diagnostic for 500/2,000 only | AR-22 |
| The click metric is noisy | Report p50 and p95 over five samples; gate the work time, not a single paint sample | AR-23 |
| An optimization changes visual output | Compare the three baseline screenshots and the E2E visual suite | AR-24 |
| The benchmark route drifts with the fit default | Pin `fit: "none"` and record the fit mode in every result | AR-38 |

> **Traceability:** every design choice above is recorded in
> [00-ambiguity-register.md](00-ambiguity-register.md).

## Testing Requirements

- The new benchmark scenarios live in `tests/perf/bench.spec.ts`; the test map
  already owns that file under `perf.bench`. Add `packages/core/src/ribbon/**`
  to the group sources.
- The performance targets are phase proofs: `PERF_STRICT=1` adds explicit
  `toBeLessThanOrEqual` assertions for the new absolute targets, while report
  mode records status.
- The quality contract `tests/quality/bench-contract.spec.test.ts` asserts that
  every scenario has a budget and that the strict assertions exist.
- The E2E visual suite and the three baseline screenshots guard against a
  visual regression from a performance change.
