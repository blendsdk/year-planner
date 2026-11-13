# Execution Plan: Product Quality

> **Document**: 99-execution-plan.md
> **Parent**: [Index](00-index.md)
> **Last Updated**: 2026-11-13 03:00
> **Progress**: 39/77 tasks (51%)
> **CodeOps Artifact Schema**: 1

## Overview

Implement RD-13 in six phases: evidence and renderer decision, performance,
fit and typography, context menu, Storybook demos, and release/traceability.
Phase 0 is a measurement phase and changes no product behavior. Phases 1–4
follow the specification-first order: spec tests, red, implement, green,
implementation tests, verify. Phase 5 closes evidence and prepares `0.3.0`.

**🚨 Update this document after EACH completed task!**

---

## Implementation Phases

| Phase | Title | Tasks |
| ----- | ----- | ----- |
| 0 | Evidence and renderer decision | 9 |
| 1 | Performance | 13 |
| 2 | Fit and typography | 17 |
| 3 | Context menu | 14 |
| 4 | Storybook demos | 14 |
| 5 | Release, traceability and final gate | 10 |

**Total: 77 tasks across 6 phases**

> **⚠️ EXECUTION RULE — APPLIES TO EVERY AGENT EXECUTING THIS PLAN:**
>
> The numbered task lines are the **single source of truth** for progress. Every task line appears
> exactly once. On implementation mark `[~]` with a timestamp; on verify pass promote to `[x]`;
> update the Progress header after every task. On a blocker mark `[!]` and append
> `Blocked: <reason>`.
>
> **Task gate scope:** `packages/react/src/**` is owned by `react.unit`; `styles.css`, `render/**`,
> `theme.ts`, `geometry.ts`, `options.ts` and `types.ts` are also sources of `e2e.visual`;
> `tests/perf/**` is `perf.bench`. Task verification runs `pnpm verify` plus the affected
> release-tier group. Phase gates run `pnpm verify:full`; the plan gate is `pnpm verify:full`.
> Run the test-map check after any map edit.

---

## Phase 0: Evidence and renderer decision

> **Phase baseline tree**: recorded at phase start by the exec-plan skill.
> **Lenses**: correctness, performance
> **Reasoning**: high — every later performance and fit decision depends on these measurements.

### Step 0.1: Baseline

**Reference**: [03-01](03-01-performance.md) §Measurement protocol · AR-3, AR-4, AR-22, AR-24
**Objective**: Measure the production build before any optimization or visual change.

- [x] 0.1.1 Build the production demo — `pnpm --filter @blendsdk/year-planner-demo build` ✅ (completed: 2026-11-13 00:15)
- [x] 0.1.2 Record unthrottled and 4×-throttled initial-render p50/p95 at 500 and 2,000 items — `tests/perf` harness ✅ (completed: 2026-11-13 00:15)
- [x] 0.1.3 Record unthrottled and 4×-throttled drag input-delay/frame p95 at 500 and 2,000 items with a CPU profile — `tests/perf` harness ✅ (completed: 2026-11-13 00:15)
- [x] 0.1.4 Record click-to-select work and paint p50/p95 at 500 and 2,000 items — temporary baseline script ✅ (completed: 2026-11-13 00:15)
- [x] 0.1.5 Capture visual snapshots at 1280 × 800, 1440 × 900 and 1024 × 768 — `evidence/rd13-baseline/` ✅ (completed: 2026-11-13 00:15)
- [x] 0.1.6 Inventory stories, play functions, component descriptions and story-level descriptions — `apps/storybook/stories/` ✅ (completed: 2026-11-13 00:15)
- [x] 0.1.7 Analyse the CPU profile and rank self-time by function, including the per-item visibility path — profiler output in `$CODEOPS_TMPDIR` ✅ (completed: 2026-11-13 00:15)
- [x] 0.1.8 Record the go/re-scope decision and write the baseline report — `00-baseline.md`, `docs/benchmarks/rd13-baseline.md`, `docs/benchmarks/rd13-baseline.json` ✅ (completed: 2026-11-13 00:15)
- [x] 0.1.9 Confirm no product source changed and record the artifact paths — repository status check via the git-commit skill ✅ (completed: 2026-11-13 00:15)

**Deliverables**:
- [x] Production baseline numbers with raw samples
- [x] CPU profile summary, including the visibility path
- [x] Three visual snapshots
- [x] Story inventory
- [x] Go/re-scope decision

**Test slices**: N/A — measurement phase
**Task verify**: `pnpm test:perf` (report mode) plus the temporary baseline script
**Verify (gate)**: `pnpm verify`

---

## Phase 1: Performance

> **Phase baseline tree**: recorded at phase start by the exec-plan skill.
> **Lenses**: correctness, performance
> **Reasoning**: high — this phase changes the core ribbon pipeline and the interaction hot path.

### Step 1.1: Specification tests

**Reference**: [03-01](03-01-performance.md) §Targets · ST-11–ST-14 · AR-3, AR-4, AR-22, AR-23, AR-37
**Objective**: Encode the production benchmark scenarios, the metric definitions and the strict gates.

- [x] 1.1.1 [spec-author] Add the unthrottled initial-render, drag work-per-frame and drag input-delay scenarios with explicit `PERF_STRICT=1` assertions and `RD-13-AC-03` — `tests/perf/bench.spec.ts` ✅ (completed: 2026-11-13 01:30)
- [x] 1.1.2 [spec-author] Add the click-to-select work-time scenario and its 60 / 80 ms strict assertions — `tests/perf/bench.spec.ts` ✅ (completed: 2026-11-13 01:30)
- [x] 1.1.3 Run the new scenarios and record the red/baseline result — `pnpm test:perf` ✅ (completed: 2026-11-13 01:30)

### Step 1.2: Implementation

**Reference**: [03-01](03-01-performance.md) §Optimization order · AR-3, AR-4, AR-37, AR-38
**Objective**: Remove the superlinear work and the per-frame React preview cost.

- [x] 1.2.1 Resolve visibility once per model and share the map with the renderer and interaction engine — `packages/react/src/YearPlanner.tsx`, `interaction/useInteraction.ts` ✅ (completed: 2026-11-13 01:30)
- [x] 1.2.2 Project each item once and bucket candidates by row — `packages/core/src/ribbon/fragments.ts` ✅ (completed: 2026-11-13 01:30)
- [x] 1.2.3 Replace the linear lane scan with an interval/free-lane index — `packages/core/src/ribbon/lanes.ts` ✅ (completed: 2026-11-13 01:30)
- [x] 1.2.4 Use a set-backed date index and materialize arrays once — `packages/react/src/YearPlanner.tsx` ✅ (completed: 2026-11-13 01:30)
- [x] 1.2.5 Stabilize row props and callbacks so the memo boundary holds — `packages/react/src/render/MonthRow.tsx`, `YearPlanner.tsx` ✅ (completed: 2026-11-13 01:30)
- [x] 1.2.6 Verify the existing rAF preview meets the drag target; add imperative writes only if it misses — `packages/react/src/interaction/useInteraction.ts` ✅ (completed: 2026-11-13 01:30) — strict drag run passed; no imperative rewrite required
- [x] 1.2.7 Update the benchmark budgets/contract and add `packages/core/src/ribbon/**` to the `perf.bench` sources; pin `fit: "none"` in Phase 2 — `scripts/bench-budgets.mjs`, `tests/quality/bench-contract.spec.test.ts`, `codeops/test-map.json` ✅ (completed: 2026-11-13 01:30)

### Step 1.3: Green, implementation tests and verify

- [x] 1.3.1 Prove the unthrottled targets green and record the throttled diagnostics — `PERF_STRICT=1 pnpm test:perf` ✅ (completed: 2026-11-13 02:20) — strict RD-13 suite 3/3 passed: initial 347.9 / 426.2 ms, click 40.2 / 68.8 ms, drag work 3.84 ms / input 15.5 ms
- [x] 1.3.2 Add implementation edge cases (dense row, empty model, 2,000 items) — `packages/core/src/ribbon/fragments.impl.test.ts`, `lanes.impl.test.ts` ✅ (completed: 2026-11-13 01:30)
- [x] 1.3.3 Verify the phase — `pnpm verify` plus `pnpm test:perf` and `node "$CODEOPS_PLUGIN_ROOT/bin/codeops-test.mjs" check --strict` ✅ (completed: 2026-11-13 02:20)

**Deliverables**:
- [x] Unthrottled initial render p95 ≤400 ms at 500 items and ≤550 ms at 2,000 items (measured 347.9 / 426.2 ms)
- [x] 2,000-item drag main-thread work per frame ≤8 ms; input delay ≤16.7 ms (measured 3.84 / 15.5 ms)
- [x] Click-to-select work p95 ≤60 ms at 500 items and ≤80 ms at 2,000 items (measured 40.2 / 68.8 ms)
- [x] Benchmark harness records CPU throttle, click latency and work per frame
- [x] All phase verification passing

**Test slices**: `core.unit`, `react.unit`, `quality.contracts` (task); `perf.bench` (release)
**Task verify**: `pnpm verify` + `PERF_STRICT=1 pnpm test:perf`
**Verify (gate)**: `pnpm verify:full`

---

## Phase 2: Fit and typography

> **Phase baseline tree**: recorded at phase start by the exec-plan skill.
> **Lenses**: correctness, accessibility, UX
> **Reasoning**: high — this changes default geometry and every visual baseline.

### Step 2.1: Specification tests

**Reference**: [03-02](03-02-fit-typography.md) §Fit algorithm, §Typography · ST-1–ST-10, ST-36, ST-37, ST-39 · AR-5–AR-12, AR-30, AR-31, AR-38
**Objective**: Encode the two-dimensional fit math, the 24 px floor and the type tokens.

- [x] 2.1.1 [spec-author] Write the profile, horizontal scale, vertical lane budget, natural-height and zero-size cases — `packages/react/src/fit.spec.test.tsx` ✅ (completed: 2026-11-13 03:00)
- [x] 2.1.2 [spec-author] Write the typography token, centred-label, text-fit and Won’t-Have contract cases — `tests/quality/fit-contract.spec.test.ts` ✅ (completed: 2026-11-13 03:00)
- [x] 2.1.3 Run the new tests and record the red result — `pnpm test:quality` plus the React unit suite ✅ (completed: 2026-11-13 03:00)

### Step 2.2: Implementation

**Reference**: [03-02](03-02-fit-typography.md) §Host-region measurement, §Fit algorithm, §Typography, §Demo shell · AR-5–AR-12, AR-21, AR-30, AR-31, AR-38
**Objective**: Fit the grid to its host, centre the header and show the embedded layout.

- [x] 2.2.1 Capture three-size prototypes and record the chosen unit values — `evidence/rd13-baseline/` ✅ (completed: 2026-11-13 03:00)
- [x] 2.2.2 Add `display.fit`, the option resolver and validation — `packages/react/src/types.ts`, `options.ts` ✅ (completed: 2026-11-13 03:00)
- [x] 2.2.3 Add the comfortable/compact/dense unit profiles, 24 px lanes, `laneTop` plumbing and font-token defaults — `packages/react/src/theme.ts`, `options.ts` ✅ (completed: 2026-11-13 03:00)
- [x] 2.2.4 Implement host-region measurement, horizontal scale, vertical lane budget and composed zoom — `packages/react/src/geometry.ts` ✅ (completed: 2026-11-13 03:00)
- [x] 2.2.5 Wire the `ResizeObserver`, bounded-host contract and render zoom into the layout and interaction mapping — `packages/react/src/YearPlanner.tsx` ✅ (completed: 2026-11-13 03:00)
- [x] 2.2.6 Centre the month/year label with the short month and two-digit year — `packages/react/src/render/MonthRow.tsx` ✅ (completed: 2026-11-13 03:00)
- [x] 2.2.7 Replace header and cell font sizes with root tokens and add the text-fit guard — `packages/react/src/styles.css` ✅ (completed: 2026-11-13 03:00)
- [x] 2.2.8 Add the bounded app-shell demo with a 12-month option — `apps/demo/src/App.tsx` ✅ (completed: 2026-11-13 03:00)
- [x] 2.2.9 Add the fit E2E, three `toHaveScreenshot` assertions and the map entries (`e2e.visual` tests and sources) — `tests/e2e/fit.spec.ts`, `codeops/test-map.json` ✅ (completed: 2026-11-13 03:00)
- [x] 2.2.10 Update the public API report — `packages/react/etc/react-year-planner.api.md` ✅ (completed: 2026-11-13 03:00)

### Step 2.3: Green, implementation tests and verify

- [x] 2.3.1 Prove ST-1–ST-10 and ST-37 green — `pnpm test:quality`, React unit suite, `pnpm exec playwright test tests/e2e/fit.spec.ts` ✅ (completed: 2026-11-13 03:00)
- [x] 2.3.2 Add fit implementation edge cases (resize storm, invalid units, hidden container, proxy bounding box) — `packages/react/src/fit.impl.test.tsx` ✅ (completed: 2026-11-13 03:00)
- [x] 2.3.3 Rebaseline the existing 1600 × 1200 visual suite, update the zoom assertion and preserve the control selectors — `tests/e2e/quality-visual.spec.ts`, `classic-year.spec.ts` ✅ (completed: 2026-11-13 03:00)
- [x] 2.3.4 Verify the phase — `pnpm verify` plus `pnpm exec playwright test tests/e2e/fit.spec.ts tests/e2e/print-matrix.spec.ts tests/e2e/quality-visual.spec.ts` ✅ (completed: 2026-11-13 03:00)

**Deliverables**:
- [x] Two-dimensional `display.fit` with 24 px cells/ribbon proxies and internal scroll
- [x] Centred header typography with root tokens
- [x] Bounded app-shell demo and `?fit=1` host-region route
- [x] Updated API report and visual baselines
- [x] All phase verification passing

**Test slices**: `react.unit`, `quality.contracts` (task); `e2e.visual`, `e2e.print` (release)
**Task verify**: `pnpm verify` + `pnpm exec playwright test tests/e2e/fit.spec.ts`
**Verify (gate)**: `pnpm verify:full`

---

## Phase 3: Context menu

> **Phase baseline tree**: recorded at phase start by the exec-plan skill.
> **Lenses**: correctness, security, accessibility
> **Reasoning**: high — this adds a public callback that carries item identifiers and host coordinates.

### Step 3.1: Specification tests

**Reference**: [03-03](03-03-context-menu.md) §Public types, §Pointer flow, §Keyboard flow · ST-16–ST-25 · AR-13–AR-17, AR-34, AR-35
**Objective**: Encode target resolution, native fallback, selection, keyboard and touch behavior.

- [ ] 3.1.1 [spec-author] Write the pointer, annotation, pointer-day, keyboard, native-fallback, touch and payload cases — `packages/react/src/context-menu.spec.test.tsx`
- [ ] 3.1.2 Run the new tests and record the red result — React unit suite

### Step 3.2: Implementation

**Reference**: [03-03](03-03-context-menu.md) §Implementation Details · AR-13–AR-17, AR-34, AR-35
**Objective**: Route right-click and keyboard requests without starting a gesture.

- [ ] 3.2.1 Add the request types, `restoreFocus` and the `onContextMenuRequest` prop — `packages/react/src/types.ts`
- [ ] 3.2.2 Resolve annotation, item and date targets from the component root — `packages/react/src/YearPlanner.tsx`, `render/YearGrid.tsx`
- [ ] 3.2.3 Select an unselected item before the request and prove no gesture starts — `packages/react/src/interaction/useInteraction.ts`
- [ ] 3.2.4 Add one deduped Shift+F10/ContextMenu handler for cells and items — `packages/react/src/interaction/useInteraction.ts`, `render/YearGrid.tsx`, `render/ItemOverlay.tsx`
- [ ] 3.2.5 Ignore touch-originated context menus and document long-press behavior — `packages/react/src/YearPlanner.tsx`
- [ ] 3.2.6 Add Fluent UI and MUI as dev-only Storybook dependencies — `apps/storybook/package.json`, `pnpm-lock.yaml`
- [ ] 3.2.7 Add the Fluent and MUI context-menu stories — `apps/storybook/stories/ContextMenu.stories.tsx`
- [ ] 3.2.8 Document the host contract and focus return — `docs/interaction.md`, `docs/getting-started.md`
- [ ] 3.2.9 Add the `?context=1` demo log and update the API report — `apps/demo/src/App.tsx`, `packages/react/etc/react-year-planner.api.md`

### Step 3.3: Green, implementation tests and verify

- [ ] 3.3.1 Prove ST-16–ST-25 green — React unit suite
- [ ] 3.3.2 Add implementation edge cases (handler error, chrome, annotation, focus retention) — `packages/react/src/context-menu.impl.test.tsx`
- [ ] 3.3.3 Verify the phase — `pnpm verify` plus `pnpm exec playwright test tests/e2e/interaction.spec.ts tests/e2e/security.spec.ts`

**Deliverables**:
- [ ] Host-owned context-menu contract for date, item and annotation targets
- [ ] Pointer-day dates, deduped keyboard path and native/touch fallback
- [ ] Fluent and MUI examples with dev-only dependencies
- [ ] All phase verification passing

**Test slices**: `react.unit` (task); `e2e.interaction`, `e2e.security` (release)
**Task verify**: `pnpm verify` + `pnpm exec playwright test tests/e2e/interaction.spec.ts`
**Verify (gate)**: `pnpm verify:full`

---

## Phase 4: Storybook demos

> **Phase baseline tree**: recorded at phase start by the exec-plan skill.
> **Lenses**: UX, documentation
> **Reasoning**: medium — documentation only, but the demos must actually run.

### Step 4.1: Specification tests

**Reference**: [03-04](03-04-storybook-demos.md) §Contract · ST-26–ST-30 · AR-18–AR-20, AR-32, AR-36
**Objective**: Encode the demo, story-level description and event-log requirements.

- [ ] 4.1.1 [spec-author] Extend the Storybook contract for story-level descriptions, the helper form, Demos play functions, the event log and storySort — `tests/quality/storybook-contract.spec.test.ts`
- [ ] 4.1.2 Run the contract and record the red result — `pnpm test:quality`

### Step 4.2: Implementation

**Reference**: [03-04](03-04-storybook-demos.md) §Demos, §Event-log playground, §Descriptions · AR-18–AR-20, AR-36
**Objective**: Add real demos and describe every story.

- [ ] 4.2.1 Add the description helper and apply it to Classic, Layout and Items stories — `apps/storybook/stories/ClassicYear.stories.tsx`, `Layout.stories.tsx`, `Items.stories.tsx`
- [ ] 4.2.2 Apply descriptions to Interaction, Inspector and Accessibility stories — `Interaction.stories.tsx`, `Inspector.stories.tsx`, `Accessibility.stories.tsx`
- [ ] 4.2.3 Apply descriptions to State, CommandLifecycle and Print stories — `State.stories.tsx`, `CommandLifecycle.stories.tsx`, `Print.stories.tsx`
- [ ] 4.2.4 Apply descriptions to Slots, Themes and Adapters stories — `Slots.stories.tsx`, `Themes.stories.tsx`, `Adapters.stories.tsx`
- [ ] 4.2.5 Add descriptions to the new Demos, EventLog and ContextMenu stories — `Demos.stories.tsx`, `EventLog.stories.tsx`, `ContextMenu.stories.tsx`
- [ ] 4.2.6 Add the six Demos with `play` functions — `apps/storybook/stories/Demos.stories.tsx`
- [ ] 4.2.7 Add the event-log playground with a play function and the real callbacks — `apps/storybook/stories/EventLog.stories.tsx`
- [ ] 4.2.8 Add Demos-first story sorting — `apps/storybook/.storybook/preview.ts`
- [ ] 4.2.9 Update the story-count statements — `README.md`, `docs/getting-started.md`, `docs/test-report.md`

### Step 4.3: Green and verify

- [ ] 4.3.1 Prove ST-26–ST-30 green — `pnpm test:quality`
- [ ] 4.3.2 Build Storybook and the docs site — `pnpm storybook:build`, `pnpm docs:site -- --check-only`
- [ ] 4.3.3 Review each demo at 1280 × 800 and record the result — `docs/test-report.md`

**Deliverables**:
- [ ] Demos group with at least six interaction stories plus the event log
- [ ] Story-level description on every story
- [ ] Storybook and docs site building
- [ ] All phase verification passing

**Test slices**: `quality.contracts` (task); Storybook build (release)
**Task verify**: `pnpm test:quality` + `pnpm storybook:build`
**Verify (gate)**: `pnpm verify:full`

---

## Phase 5: Release, traceability and final gate

> **Phase baseline tree**: recorded at phase start by the exec-plan skill.
> **Lenses**: correctness, maintainability
> **Reasoning**: high — this closes the milestone and prepares the first publication.

### Step 5.1: Traceability

**Reference**: [07](07-testing-strategy.md) · ST-31–ST-35, ST-38 · AR-2, AR-25, AR-27, AR-39
**Objective**: Add RD-13 rows and extend the checker through RD-13.

- [ ] 5.1.1 Add RD-13-AC-01..10 rows with explicit `proven`/`partial` status; AC8 is `partial` pending the registry attestation — `codeops/features/year-planner/requirements/00-traceability.md`
- [ ] 5.1.2 Extend the traceability test and CLI default through RD-13; update the expected count to 193 — `tests/quality/traceability.spec.test.ts`, `scripts/check-traceability.mjs`, `scripts/lib/traceability.mjs`
- [ ] 5.1.3 Prove the matrix — `node scripts/check-traceability.mjs --through 13`

### Step 5.2: Release and evidence

- [ ] 5.2.1 Update performance, release, migration, test-report and limitation docs for `0.3.0`, and update `release-workflow.spec.test.ts` from `0.2.1` to `0.3.1` — `docs/performance.md`, `docs/releasing.md`, `docs/migration.md`, `docs/test-report.md`, `docs/limitations.md`, `tests/quality/release-workflow.spec.test.ts`
- [ ] 5.2.2 Add a **minor** changeset for the fixed group, run `pnpm version-packages`, and assert the result is `0.3.0` — `.changeset/`, `packages/*/package.json`, `packages/*/CHANGELOG.md`
- [ ] 5.2.3 Close issue #4 with the fit evidence link and record the ruling — issue tracker, `00-baseline.md`
- [ ] 5.2.4 Update the roadmap to `Executing` and then `Done` — `codeops/features/year-planner/00-roadmap.md`

### Step 5.3: Final gate

- [ ] 5.3.1 Run the release gate — `pnpm verify:full`
- [ ] 5.3.2 Prove release readiness and the docs artifact — `pnpm release:check`, `pnpm release:publish --dry-run --allow-dirty`, `pnpm docs:site -- --check-only`
- [ ] 5.3.3 Record the after-run performance numbers and the final evidence — `docs/benchmarks/rd13-baseline.json`, `docs/benchmarks/rd13-baseline.md`, `docs/test-report.md`

**Deliverables**:
- [ ] Ten RD-13 rows with honest statuses (AC8 `partial`)
- [ ] Checker and CLI through RD-13 (193 criteria)
- [ ] `0.3.0` version and changelog
- [ ] Issue #4 closed with evidence
- [ ] Updated release and performance evidence
- [ ] Full release gate passing

**Test slices**: `core.unit`, `react.unit`, `verification` (task); final gate release
**Task verify**: `pnpm verify` + `pnpm release:check`
**Verify (gate)**: `pnpm verify:full`

---

## Dependencies

```
Phase 0 (evidence)
      │
      ▼
Phase 1 (performance) ──► Phase 2 (fit + typography) ──► Phase 3 (context menu) ──► Phase 4 (demos) ──► Phase 5 (release)
```

Phase 1 needs the Phase 0 profile and go/re-scope decision. Phase 2 needs the
performance baseline so the smaller grid does not hide a remaining cost. Phase
3 needs the fit geometry so menu requests anchor to settled cells. Phase 4 needs
the final APIs. Phase 5 needs every contract green.

---

## Success Criteria

**Feature is complete when:**

1. ✅ All phases completed
2. ✅ `pnpm verify:full` passes
3. ✅ The fit, performance, typography, context-menu and demo acceptance criteria are proven
4. ✅ `docs/benchmarks/rd13-baseline.md` records the before/after evidence
5. ✅ `0.3.0` is ready for the first publication; `0.2.0` remains unpublished
6. ✅ Traceability covers RD-13 (193 criteria; AC8 documented as `partial`)
7. ✅ The roadmap is `13 / 13 (100%)` with RD-13 Done
8. ✅ Post-completion project re-analysis (handled by the exec-plan skill)
