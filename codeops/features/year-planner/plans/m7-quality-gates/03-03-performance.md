# Performance: Quality Gates Plan

> **Document**: 03-03-performance.md
> **Parent**: [Index](00-index.md)

## Overview

RD-10 requires repeatable layout and pointer-frame measurements at 500, 2,000 and 10,000 items, and
GitHub issue #3 requires a production profile plus a measurable improvement without interaction
regressions. This specification defines the benchmark fixture, the Node and browser harness, the
budget table, the result artifacts and the render optimization to apply after the baseline.

The harness uses the existing Node, Vitest, Playwright and demo stack. It adds no package, external
service or dashboard. The optimization uses React primitives only: `memo`, `useMemo`, `useCallback`
and stable prop identities. It does not add virtualization, an external store or a new state
manager.

## Architecture

### Current Architecture

- `YearPlanner` owns gesture state through `useInteraction`; every preview update re-renders the
  whole planner.
- `YearGrid` maps every month row and forwards the full `previews` array to every `MonthRow`
  (`packages/react/src/render/YearGrid.tsx`).
- `MonthRow` maps the full `previews` array for every row and renders selection previews; item
  previews are skipped there (`packages/react/src/render/MonthRow.tsx`).
- `ItemOverlay` maps every row and renders item/range previews directly for every row; previews are
  not passed into `ItemLayer` (`packages/react/src/render/ItemOverlay.tsx`).
- `YearPlanner` creates `components={props.components ?? {}}` on every render, which breaks
  shallow memoization in every child that receives it.
- `CellLayer` renders 37 cells per row; at 36 months that is 1,332 cells per render.
- No benchmark fixture or script exists; `docs/test-report.md` records the benchmarks as not run.

### Proposed Changes

| Artifact | Change |
| -------- | ------ |
| `scripts/bench-data.mjs` | Deterministic seeded item/layer generator (Node 20-compatible) |
| `apps/demo/src/BenchDemo.tsx` | Benchmark route with URL-controlled items, window and density |
| `apps/demo/src/bench-data.ts` | Typed re-export of the generator for the demo |
| `apps/demo/src/App.tsx` | `?bench=1` route |
| `scripts/bench-layout.mjs` | Node core layout/ribbon benchmark |
| `scripts/bench.mjs` | Build, run Node + browser benchmarks, aggregate JSON/Markdown |
| `playwright.bench.config.ts` | Production preview and dev projects on separate ports |
| `tests/perf/bench.spec.ts` | Initial render, drag frames, overflow timing and CPU profiles |
| `packages/react/src/interaction/preview.ts` | Pure row-intersection helper |
| `packages/react/src/render/MonthRow.tsx` | `memo` with preview-content comparison |
| `packages/react/src/render/CellLayer.tsx` | `memo` with stable props |
| `packages/react/src/render/ItemOverlay.tsx` | `memo` with preview-content comparison |
| `packages/react/src/render/ItemLayer.tsx` | `memo` |
| `packages/react/src/render/PrintPages.tsx` | `memo`; skip rebuilds during gestures |
| `packages/react/src/render/ItemList.tsx` | `memo`; stable visible-item input |
| `packages/react/src/YearPlanner.tsx` | Stable `components` and item-selection callback |
| `docs/benchmarks/rd10-baseline.*` | Checked-in baseline numbers |
| `docs/benchmarks/rd10-after.*` | Checked-in post-optimization numbers |

## Implementation Details

### Benchmark fixture

`scripts/bench-data.mjs` exposes a plain ESM generator with a checked-in `scripts/bench-data.d.ts`
declaration. `apps/demo/src/bench-data.ts` is a typed re-export for the demo.

```ts
/** Builds a deterministic model for the benchmark route. */
export function buildBenchModel(input: {
  items: number;
  months: number;
  seed?: number;
}): { layers: PlannerLayer[]; items: PlannerItem[] };

/** Returns the fixed benchmark layers. */
export function benchLayers(): PlannerLayer[];
```

Rules:

- Seed defaults to `42`; the generator is a small LCG so every run produces identical data.
- Five layers: three ribbon layers (`bookings`, `maintenance`, `training`), one highlight layer and
  one annotation layer. Ribbon layers have `label` and a non-solid pattern so visual output is
  representative.
- Item `i` starts at `addDays(rangeStart, (i * 37) % totalDays)` and spans `1 + (i % 10)` days.
  The period is clipped to the window by the layout.
- Every item has a stable id, version `1`, title `Bench item N`, and a layer id chosen by
  `i % 5`. Activity items use the three ribbon layers; highlight items use the highlight layer;
  annotation items use the annotation layer with a valid `annotation` payload. Kinds always match
  the layer channel so validation does not reject the fixture.
- The generator validates its own count; it never emits overlapping ids or invalid periods.

`BenchDemo.tsx` reads the URL:

| Parameter | Values | Default |
| --------- | ------ | ------- |
| `items` | positive integer | `500` |
| `months` | `12`, `14`, `18`, `24`, `36` | `14` |
| `density` | `compact`, `expanded` | `compact` |
| `theme` | any preset | `classic-blue` |

After mount it sets:

```ts
window.__YP_BENCH__ = {
  ready: true,
  readyMs: performance.now() - startedAt,
  itemCount,
  months,
  domNodes: document.querySelectorAll("*").length,
};
```

The route is private to the demo. It is not exported from either package and does not affect the
published bundle.

### Node layout benchmark

`scripts/bench-layout.mjs` is plain ESM and imports the built core entry through a relative
`../packages/core/dist/index.js` specifier, so it runs on the declared Node >=20.19 range without a
root workspace dependency:

```bash
node scripts/bench-layout.mjs --items 500,2000,10000 --iterations 30 --out test-results/bench-layout.json
```

For each item count and density (`compact`, `expanded`, `overflow`):

1. Build the model with `buildBenchModel` from `scripts/bench-data.mjs`.
2. Validate it with the core `validatePlannerData`; fail on any `error` diagnostic.
3. Warm up twice.
4. Run `buildClassicYearLayout` and `buildRibbonLayout` thirty times (ten for 10k to bound runtime).
5. Record p50 and p95 wall-clock milliseconds, the sample count and the fragment/proxy counts.
   A p95 with fewer than five samples is rejected as `not-measured`.

`overflow` uses compact density with `compactMaxLanes: 1` so the overflow path is exercised. The
script writes JSON and exits non-zero only on a harness error or an invalid model; budget status is
reported, not used to fail the layout script.

### Browser benchmark

`playwright.bench.config.ts` uses `testDir: "./tests/perf"` and runs two projects against the
**production** demo build:

| Project | Server | Use |
| ------- | ------ | --- |
| `bench-preview` | `vite preview --port 4174` | Production numbers and budget assertions |
| `bench-dev` | `vite dev --port 4175` | One 500-item drag to quantify dev-only overhead |

`tests/perf/bench.spec.ts` measures:

| Test | Scenario | Measurement |
| ---- | -------- | ----------- |
| `RD-10-AC-11: initial render 500/2k/10k compact` | 14 months, compact, 5 repeat loads | median and p95 `readyMs`, DOM nodes |
| `RD-10-AC-11: initial render 12/14/18/24/36 months` | 500 items, 5 repeat loads | median and p95 `readyMs` |
| `RD-10-AC-11: compact drag 500/2k/10k` | 60-step drag across two months | rAF frame deltas, long tasks |
| `RD-10-AC-11: expanded drag 500 fragments` | expanded density, 500 visible fragments | rAF frame deltas, long tasks |
| `RD-10-AC-11: overflow open/close 10k` | compact, 10k items, 5 repeats | in-page `performance.mark/measure` around the popover mutation, median and p95 |
| `RD-10-AC-11: 36-month 500-item production drag` | 36 months, 500 items | frame deltas, long tasks, CPU profile |
| `issue-3: 500-item dev drag` | dev server | frame deltas, long tasks, CPU profile |

Frame collection is installed in the page before the drag:

```ts
window.__YP_FRAMES__ = { deltas: [], longTasks: [], inputDelays: [] };
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.startTime < dragStartedAt) continue;
    window.__YP_FRAMES__.longTasks.push({ start: entry.startTime, duration: entry.duration });
  }
});
observer.observe({ type: "longtask", buffered: false });
const dragStartedAt = performance.now();
grid.addEventListener("pointermove", (event) => {
  window.__YP_FRAMES__.inputDelays.push(performance.now() - event.timeStamp);
}, true);
let previous = performance.now();
const tick = (now) => {
  window.__YP_FRAMES__.deltas.push(now - previous);
  previous = now;
  if (running) requestAnimationFrame(tick);
};
requestAnimationFrame(tick);
```

The drag sends exactly one pointer move per animation frame and waits for the next frame before the
next move, so the sampled deltas represent pointer frames rather than idle compositor time. It
records `event.timeStamp` versus `performance.now()` in a capture-phase listener as input delay.
The test fails as `not-measured` when fewer than 55 frame samples or 55 pointer moves are present.
`longtask` uses `buffered: false` and is filtered to the drag window. It records p50, p95, maximum,
input-delay p95 and the count of frames over 16.7 ms and 50 ms.

CPU profiles use CDP:

```ts
const cdp = await page.context().newCDPSession(page);
await cdp.send("Profiler.enable");
await cdp.send("Profiler.start");
// drag
const { profile } = await cdp.send("Profiler.stop");
fs.writeFileSync(
  `test-results/bench/profiles/${runLabel}-issue-3-dev.cpuprofile`,
  JSON.stringify(profile),
);
```

The benchmark summary extracts the top self-time functions into the Markdown report. The raw
`.cpuprofile` files are uploaded as CI artifacts and are not checked in. `--out` changes only the
JSON/Markdown destination; profiles always stay under `test-results/bench/profiles`.

`scripts/bench.mjs` exits non-zero when any result exceeds the 2× regression ceiling, defined as
2× the corresponding RD budget (for example 500 ms for the 250 ms layout budget and 33.4 ms for the
16.7 ms frame budget). A 1×–2× miss is recorded but does not fail. It accepts `--out <directory>`:

- default `test-results/bench` for `verify:full` and CI, so a verification run never dirties the
  repository;
- `--out docs/benchmarks/rd10-baseline` and `--out docs/benchmarks/rd10-after` for the checked-in
  evidence files.

### Budgets and status

| Scenario | Budget | Source |
| -------- | ------ | ------ |
| 10k items, 14 rows, compact overflow, initial layout | ≤ 250 ms p95 | RD-10 |
| Pointer preview, compact 3-lane, 14 rows | ≤ 16.7 ms p95 frame and no long task > 50 ms | RD-10 + issue #3 |
| Pointer preview, expanded 500 visible fragments | ≤ 16.7 ms p95 frame | RD-10 |
| Overflow open/close with 10k compact items | ≤ 100 ms | RD-10 |
| 12/14/18/24/36-month initial render | ≤ 150 ms p95 | RD-10 |
| React package ESM + CSS | ≤ 60 kB gzip (RD-10 AC12); core+React+adapters+CSS total ≤65 kB (RD-09 guard) | AR-2 |

The harness marks each result `pass`, `miss` or `not-measured`. A `miss` is written to
`docs/benchmarks/rd10-after.md` and `docs/test-report.md` with the actual value; it is never rounded
down or hidden. `pnpm test:perf` measures every RD budget on the named reference host and fails only
on a harness error or a **2×** regression-ceiling breach. `PERF_STRICT=1 pnpm test:perf` adds the
issue #3 oracle (after p95 ≤0.9× baseline or ≤16.7 ms, three repeats, no long-task or input-delay
regression) and is the Phase 5 red/green command. CI runs `pnpm bench` as an artifact job
with the same ceiling. `pnpm test:perf` builds the packages and the demo first so it can run alone:

```bash
pnpm build && pnpm --filter @blendsdk/year-planner-demo build
playwright test -c playwright.bench.config.ts --project=bench-preview
```

### Reference environment

Local reference:

| Item | Value |
| ---- | ----- |
| CPU | Intel Core i5-3470S, 4 vCPU, 3.6 GHz max |
| Memory | 14 GiB total (5.7 GiB available at planning time) |
| OS | Ubuntu 26.04 LTS |
| Node | 24.21.0 |
| pnpm | 12.9.1 |
| Browser | Playwright 1.65.0 Chromium |

CI records the `ubuntu-latest` runner values in `test-results/environment.txt`. No result from one
environment is presented as a claim about another.

### Issue #3 baseline and optimization

**Step 1 — baseline before any render change.** Run
`pnpm bench --out docs/benchmarks/rd10-baseline`, and capture the two CPU profiles. The baseline must
include the dev/production split for the 500-item drag and the 36-month/500-item production case.

**Step 2 — apply only the profile-supported optimizations.**

1. Stabilize `components` in `YearPlanner` with `useMemo`, and wrap the inline item-selection
   callback in `useCallback`.
2. Wrap `MonthRow` in `memo`. Compare `previews` by length, `previewKey`, validity and layer
   identity, and reuse the previous preview object when those are unchanged, so a row whose
   previews did not change skips rendering even when the parent passes a new array.
3. Wrap `CellLayer` in `memo` with default shallow comparison. Pass `activeDate` only to the row
   that contains it; other rows receive `undefined` and keep the same identity.
4. Wrap `ItemOverlay` in `memo` with the same preview comparison, and wrap `ItemLayer` in `memo`.
   Wrap `PrintPages` and `ItemList` in `memo` with stable derived props so a gesture does not rebuild
   the print tree or re-sort the visible item list.
5. Add `previewIntersectsRow(preview, row)` and use it to skip preview elements that do not intersect
   the row. `SelectionPreview` already clips; the helper saves element creation and prevents a
   non-intersecting row from receiving a changed array. This is a pure helper with unit tests.
6. Re-run the same benchmark commands with
   `pnpm bench --out docs/benchmarks/rd10-after`.

**Step 3 — decide from the numbers.** The issue #3 oracle is: after p95 is at most 0.9× the
baseline p95 **or** at most 16.7 ms, measured with three production runs on the same host and build,
with no long-task or input-delay regression. If memoization meets that oracle, stop. If it does not,
the profile must identify the next hotspot. Virtualization or an external gesture store is not
pre-approved; that would reopen AR-14 and require the complexity gate.

**Step 4 — prove no behavior change.** Run the full React, interaction, accessibility, visual and
E2E suites. The optimization must not change the DOM contract, focus, selection, preview geometry or
command behavior.

## Code Examples

### Preview comparison

`previewValidity` returns `undefined` for selection and marquee previews and the preview's `valid`
flag for item and range previews. `previewKey` already covers the ranges and item/variant identity;
the comparator adds validity and the layer id.

```ts
/** Returns true when two preview lists are identical by stable content. */
export function samePreviewEntries(
  previous: readonly PreviewLayer[],
  next: readonly PreviewLayer[],
): boolean {
  if (previous === next) return true;
  if (previous.length !== next.length) return false;
  return previous.every((entry, index) => {
    const other = next[index];
    return (
      entry.key === other?.key &&
      entry.preview.kind === other?.preview.kind &&
      previewKey(entry.preview) === previewKey(other.preview) &&
      previewValidity(entry.preview) === previewValidity(other.preview)
    );
  });
}
```

### Row intersection

```ts
/** Returns true when a gesture preview can paint on the given month row. */
export function previewIntersectsRow(preview: GesturePreview, row: MonthRowLayout): boolean;
```

## Error Handling

| Error Case | Handling Strategy | AR Ref |
| ---------- | ----------------- | ------ |
| Invalid benchmark model | Fail the harness with the validation diagnostics; never measure invalid data | AR-11 |
| Browser or preview server fails | Fail with the server log; do not report partial numbers as a baseline | AR-10 |
| A budget misses | Record the actual value and `miss` status; `test:perf` reports it and fails only at the 2× ceiling, while `PERF_STRICT=1` fails the issue #3 oracle | AR-13 |
| CPU profile cannot be captured | Record `not-measured` with the CDP error; do not fabricate a profile | AR-28 |
| Benchmark data not deterministic | Fail the determinism test before recording | AR-29 |
| Production and dev servers collide | Fixed ports 4174/4175 with strictPort; fail loudly | AR-10 |
| Memoization changes behavior | Full behavioral suite blocks completion; revert the change | AR-14 |

> **Traceability:** AR-10 through AR-14, AR-28 and AR-29 own the decisions in this document.

## Testing Requirements

- Determinism: two `buildBenchModel` calls with the same input are deep-equal.
- Validity: 500/2k/10k models validate with no error diagnostics.
- Harness: a missing fixture or invalid count fails with a clear message.
- Budget reporting: `test:perf` names every RD budget miss and fails only at the 2× ceiling or on a
  harness error.
- Optimization: `previewIntersectsRow` covers selection ranges, item previews, marquee exclusion,
  empty previews and rows on both sides of a cross-month range.
- Render count: a `DayCell`/`ItemFragment` slot counter shows that a preview update re-renders only
  intersecting rows, not all 12–36 rows.
- Regression: the full interaction, accessibility, visual and print suites pass after optimization.
