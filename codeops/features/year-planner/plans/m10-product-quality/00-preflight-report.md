# Preflight Report: Product Quality

> **Status**: ✅ PREFLIGHT PASSED WITH NOTES — 43 findings resolved, 3 accepted notes
> **Iteration**: 2 (re-scan after fixes)
> **Artifact**: RD-13 plus the implementation plan at `codeops/features/year-planner/plans/m10-product-quality/` (10 documents)
> **Artifact hash**: `93dbd2e86affab9eb683944b03c164a2a704d1035729348f5e55b881cf4cab4e` (RD-13 plus the plan documents at the Phase 0 snapshot)
> **Codebase Grounded**: package manifests, layout/ribbon code, React renderer, interaction engine, Storybook contract, performance harness and release docs
> **Last Updated**: 2026-11-13 00:35

> **SAME-SESSION REVIEW:** RD-13 and the plan were created in the current
> session. Two independent auditors re-checked the load-bearing claims against
> the repository. Consider a fresh-session review before the implementation
> phases that change the renderer.

## Audit scope

| Item | Value |
| ---- | ----- |
| Audit target | `codeops/features/year-planner/requirements/RD-13-product-quality.md` and the 10 plan documents |
| Context documents | RD-12, RD-10, RD-06, RD-07, RD-09, AGENTS.md, `codeops/test-map.json`, `tests/quality/**`, `tests/e2e/**`, `tests/perf/bench.spec.ts`, `packages/core/src/**`, `packages/react/src/**`, `apps/storybook/**`, `docs/**` |
| Modification set | RD-13 and the plan documents only |
| Scope mode | Strict |
| Original goal | Fit, performance, typography, host-owned context menus and demonstrable Storybook coverage before the first publication |
| Smallest viable design | Keep React and the existing layout; add `display.fit`, `onContextMenuRequest`, CSS tokens, algorithmic performance fixes, demos and an event log |

## Codebase Context Summary

**Stack:** ESM-only pnpm monorepo, TypeScript 6, React 19, Vite 7, Vitest 4,
Playwright 1.65, Node 24, pnpm 12.9.1. **Architecture:** pure core package plus
a React renderer, interaction engine, command pipeline and quality contracts.
**Verified constraints:** default units 70/40/55/90/36; 37 columns; ≈2,000 ×
1,332 px; zoom floor 0.75; no `contextmenu` handler; item proxies are 24 px
only if lane height is 24; 174 stories, 4 play functions, 1 component
description, 1 story description; 500-item initial render p95 ≈666 ms
(unthrottled), 2,000-item drag frame p95 ≈16.8 ms; 183 traced criteria through
RD-12; the packages are unpublished `0.2.0`.

## Summary by Severity

| Severity | Count | Status |
| -------- | ----- | ------ |
| CRITICAL | 4 | All resolved |
| MAJOR | 19 | All resolved |
| MINOR | 16 | All resolved |
| OBSERVATION | 4 | Accepted |

## Critical and Major Findings

### PF-001: The fit observer measured a content-sized root [CRITICAL]

**Location:** `03-02-fit-typography.md` §Host-region measurement
**Evidence:** `.yp-root` has no height (`styles.css:4-42`); the root grows with the grid.
**Problem:** Observing the root measured the content height, so vertical fit never engaged.
**Resolution:** Measure the nearest bounded host region (or the viewport), document the bounded-region contract in `docs/getting-started.md`, and add an E2E assertion.

### PF-002: The natural-height model ignored ribbon growth and 24 px proxies [CRITICAL]

**Location:** `03-02-fit-typography.md` §Unit profiles, §Fit algorithm
**Evidence:** `fragments.ts:183-193` uses `max(rowHeight, lanes × laneHeight + laneTop)`; the proposed compact/dense lanes were 20/16 px, below the 24 px interactive floor.
**Problem:** The 14-month 1280 × 800 target was arithmetically impossible, and the fit claimed a 24 px floor while shrinking item proxies.
**Resolution:** Two-dimensional fit; lane height is 24 px in every profile; the vertical budget chooses 1–3 lanes; at 1280 × 800 the fit shows one lane and routes the rest to overflow; the natural size uses actual ribbon row heights and the 1 px border.

### PF-003: The 8 ms drag target was a frame-delta metric [CRITICAL]

**Location:** `03-01-performance.md` §Targets
**Evidence:** `bench.spec.ts:84-127` records rAF deltas; the 60 Hz floor is 16.7 ms.
**Problem:** A p95 of 8 ms is physically impossible for frame intervals and would fail every existing drag scenario.
**Resolution:** The 8 ms target is **input delay** (pointer event → handler); the frame cadence keeps the 16.7 ms budget; the harness records both.

### PF-004: The 4×-throttled 150 ms target had no achievable baseline or no-go branch [CRITICAL]

**Location:** `03-01-performance.md` §Targets, §Phase 0 go/no-go
**Evidence:** 500-item p95 is 666 ms unthrottled; 4× makes it slower.
**Problem:** The plan conflated “measurable” with “achievable” and had no re-scope path.
**Resolution:** The gate is the unthrottled 150 ms p95; 4× results are diagnostics; Phase 0 records a go/re-scope decision before Phase 1.

### PF-005: Profile selection did not choose the largest readable result [MAJOR]

**Location:** `03-02-fit-typography.md` §Fit algorithm
**Evidence:** The first-fit-at-scale-1 rule picked dense even when a larger profile could fit.
**Problem:** The result could be smaller than necessary on large screens.
**Resolution:** The fit evaluates horizontal scale and vertical lane budget per profile; the dense profile is the small-region fallback.

### PF-006: The context-menu listener on the grid root could not see item proxies [MAJOR]

**Location:** `03-03-context-menu.md` §Pointer flow
**Evidence:** `.yp-grid` and `.yp-item-overlay` are siblings (`YearGrid.tsx:180-300`).
**Problem:** Item and annotation right-clicks never reached a listener on `.yp-grid`.
**Resolution:** A single `contextmenu` listener on `.yp-root`.

### PF-007: Annotation targets resolved as items [MAJOR]

**Location:** `03-03-context-menu.md` §Pointer flow
**Evidence:** Annotation fragments render the same `item-proxy` and `data-item-id` (`ItemLayer.tsx:209-230`).
**Problem:** The item branch won before the annotation branch, so `kind: "annotation"` was unreachable.
**Resolution:** Resolve the annotation fragment first or reuse `classifyTarget`; add an annotation-proxy ST.

### PF-008: Item and annotation request dates were undefined [MAJOR]

**Location:** `03-03-context-menu.md` §Public types
**Evidence:** Proxies carry no `data-date`; a multi-day item spans many days.
**Problem:** The `date` field had no rule and the test could not assert a definite value.
**Resolution:** `date` is the day under the pointer; `classifyTarget`/`pointToDate` supplies it.

### PF-009: The Storybook description helper broke the required-story contract [MAJOR]

**Location:** `03-04-storybook-demos.md` §Descriptions
**Evidence:** `storybook-contract.spec.test.ts:28` parses `^export const (\w+): Story`.
**Problem:** Dropping `: Story` made every converted required story invisible; the helper also replaced `docs` instead of merging.
**Resolution:** Keep `export const X: Story = story(...)`, deep-merge `parameters.docs`, and make the contract helper-aware.

### PF-010: The Storybook app lacked Fluent UI and MUI [MAJOR]

**Location:** `03-04-storybook-demos.md` §Context-menu examples
**Evidence:** `apps/storybook/package.json` has no design-system packages; only the demo does.
**Problem:** The examples would not build.
**Resolution:** Add the packages as **dev-only** dependencies of the private Storybook app; the library stays dependency-free.

### PF-011: The default `fit: "contain"` broke existing visual baselines [MAJOR]

**Location:** `03-02-fit-typography.md` §Public API; `99-execution-plan.md` Phase 2
**Evidence:** `quality-visual.spec.ts` captures 1600 × 1200 snapshots; `classic-year.spec.ts` asserts a 135 px row at zoom 1.5.
**Problem:** The new default changes every existing screenshot and the zoom assertion.
**Resolution:** Rebaseline the 1600 × 1200 suite, update the composed-scale assertion, preserve the control selectors, and pin the benchmark route to `fit: "none"`.

### PF-012: New performance targets were recorded, not gated [MAJOR]

**Location:** `03-01-performance.md` §Targets; `tests/perf/bench.spec.ts`
**Evidence:** `expectWithinCeiling` only fails above 2×; `expectWithinBaseline` returns early without a baseline.
**Problem:** A 200 ms render or a 30 ms drag would still pass.
**Resolution:** Add explicit `PERF_STRICT=1` `toBeLessThanOrEqual` assertions for the new absolute targets.

### PF-013: The public API report and `options.ts` were missing [MAJOR]

**Location:** `99-execution-plan.md` Phases 2–3
**Evidence:** `verify` runs `api-report:ci`; the checked-in report lists the current `DisplayConfig` and props; `resolveDisplayOptions` has a closed shape.
**Problem:** The first `pnpm verify` after the type change fails.
**Resolution:** Add `options.ts` to the fit tasks and update `packages/react/etc/react-year-planner.api.md` in both phases.

### PF-014: The RD-13 Reference/API navigation rename was dropped [MAJOR]

**Location:** `03-04-storybook-demos.md` §Navigation
**Evidence:** RD-13 asks for Demos/Reference/API; the RD-11 contract hard-codes existing titles.
**Problem:** The requirement and the plan disagreed.
**Resolution:** Record the deviation: Demos first; the existing `Year Planner/NN` catalogue is the Reference surface; retitling is not required.

### PF-015: Fit scale and `zoom` could double-scale geometry [MAJOR]

**Location:** `03-02-fit-typography.md` §Fit algorithm
**Evidence:** `rowTemplate` multiplies by `zoom`; `designX` subtracts `monthBandWidth × zoom`.
**Problem:** Rebuilding units with the fit scale and passing the same scale as `zoom` scales twice and mis-maps pointer coordinates.
**Resolution:** Keep the layout in profile design units; pass one composed `renderZoom` to both rendering and interaction; add a pointer-mapping test.

### PF-016: The click metric had a frame floor [MAJOR]

**Location:** `03-01-performance.md` §Measurement protocol
**Evidence:** Waiting two frames adds 16.7–33 ms before any planner work.
**Problem:** A 50 ms p95 could fail for measurement reasons.
**Resolution:** Gate the pointer-down → selection-commit work time; report paint separately; five samples.

### PF-017: The O(n²) visibility path was missing from the hypotheses [MAJOR]

**Location:** `03-01-performance.md` §Candidate hot paths
**Evidence:** `YearPlanner.tsx:302-313` resolves visibility per item; `visibility.ts:143-148,227-233` rebuilds maps per call.
**Problem:** The plan pre-committed to per-row projection, which is linear for a fixed 14 rows.
**Resolution:** Add the visibility path to the candidates and to Phase 1 task 1.2.1.

### PF-018: AC8’s “0.2.0 was never published” cannot be proven offline [MAJOR]

**Location:** `RD-13` AC8; `07-testing-strategy.md` ST-31
**Evidence:** “Never published” is a registry fact; the suite adds no network call.
**Problem:** The AC cannot be `proven` at plan close.
**Resolution:** Mark AC8 `partial`; record a manual `npm view` attestation in the test report.

### PF-019: ST-36 was assigned to a Node test and the existing visual suite was not rebaselined [MAJOR]

**Location:** `07-testing-strategy.md` ST-36; Phase 2
**Evidence:** `fit-contract.spec.test.ts` is Vitest and cannot take screenshots; the existing visual suite is not in the Phase 2 gate.
**Problem:** The visual regression claim had no gate.
**Resolution:** Add three Playwright `toHaveScreenshot` assertions, rebaseline the existing suite, and map ST-36 to the E2E file.

### PF-020: The description tasks missed the three new story files [MAJOR]

**Location:** `99-execution-plan.md` Phase 4
**Evidence:** The new Demos/EventLog/ContextMenu files are created outside the description tasks.
**Problem:** ST-27 fails on the new files.
**Resolution:** Add task 4.2.5 for the new story files.

### PF-021: The event log referenced a non-existent `onCommandOutcome` [MAJOR]

**Location:** `03-04-storybook-demos.md` §Event-log playground
**Evidence:** `types.ts:422-430` exposes `onChangeRequest`, `onChangeCommitted`, `onChangeRejected`.
**Problem:** The story would not type-check.
**Resolution:** Use the real callbacks and assert them in the contract.

### PF-022: The release contract hard-codes `0.2.1` [MAJOR]

**Location:** `99-execution-plan.md` Phase 5
**Evidence:** `release-workflow.spec.test.ts:128-138` requires `"0.2.1"` in `docs/releasing.md`.
**Problem:** Moving to `0.3.1` fails `pnpm verify`.
**Resolution:** Update the contract and the docs in task 5.2.1.

### PF-023: `laneTop` and the actual row height were not plumbed [MAJOR]

**Location:** `03-02-fit-typography.md` §Fit algorithm
**Evidence:** `YearPlanner.tsx:206-214` passes `laneHeight` but not `laneTop`; the core default is 18.
**Problem:** The profile lane tops could not be applied, and the natural-height model was wrong.
**Resolution:** Add `laneTop` to the resolved options and use actual ribbon row heights.

### PF-024: The 1024 × 768 height ratio was wrong [MINOR]

**Location:** `02-current-state.md` §The size arithmetic
**Evidence:** 12 comfortable rows are 1,152 px; `768/1,152 = 0.667`, not 0.54.
**Resolution:** Corrected the table and added the lane-dependent height.

### PF-025: Test-map gaps [MINOR]

**Location:** `codeops/test-map.json`; Phase 2/3
**Evidence:** `e2e.visual.tests` omits `tests/e2e/fit.spec.ts`; sources omit `geometry.ts`/`options.ts`; `perf.bench.sources` omits `packages/core/src/ribbon/**`.
**Resolution:** Add the entries and run `codeops-test check --strict` in the phase tasks.

### PF-026: The benchmark route was not pinned to `fit: "none"` [MINOR]

**Location:** `03-01-performance.md`; `BenchDemo.tsx`
**Evidence:** The route passes no `fit`, so the Phase 2 default would change the measured geometry.
**Resolution:** Pin `fit: "none"` and record the fit mode in every result.

### PF-027: The event-log story contradicted the Demos play rule [MINOR]

**Location:** `03-04-storybook-demos.md` §Demos
**Evidence:** The event log was listed as a demo but had no play function.
**Resolution:** Give it a play function that triggers one selection.

### PF-028: Keyboard dispatch could raise duplicate requests [MINOR]

**Location:** `03-03-context-menu.md` §Keyboard flow
**Evidence:** Cell, item and grid handlers can all see the key; the browser may also fire `contextmenu`.
**Resolution:** One root handler, a short-lived keyboard flag, and `restoreFocus` in the request.

### PF-029: Touch long-press behavior was contradictory [MINOR]

**Location:** `03-03-context-menu.md` §Error Handling
**Evidence:** Android fires `contextmenu` on long-press.
**Resolution:** Ignore touch-originated context menus; document native long-press.

### PF-030: Zero-size initial geometry was undefined [MINOR]

**Location:** `03-02-fit-typography.md` §Host-region measurement
**Evidence:** “Keep the last valid scale” has no value on first mount.
**Resolution:** Initial geometry is comfortable at scale 1; the first valid observation applies.

### PF-031: The dense band could overflow the year label [MINOR]

**Location:** `03-02-fit-typography.md` §Typography
**Evidence:** A 4-digit year at 13 px does not fit a 36 px band.
**Resolution:** Use the short month and a two-digit year in the band; keep the full year in the accessible name; add a text-fit assertion.

### PF-032: Font-token fallbacks contradicted AC4 [MINOR]

**Location:** `03-02-fit-typography.md` §Typography
**Evidence:** `var(--yp-font-size-month, 13px)` still contains a hard-coded fallback.
**Resolution:** Declare the tokens once in the theme root and use them without fallbacks in header selectors.

### PF-033: Issue #4 had no closure task [MINOR]

**Location:** `RD-13` Must Have; `99-execution-plan.md`
**Evidence:** The plan said the issue closes with the plan but had no task.
**Resolution:** Add Phase 5 task 5.2.3 and ST-38.

### PF-034: The `0.3.0` changeset level was unspecified [MINOR]

**Location:** `99-execution-plan.md` task 5.2.2
**Evidence:** A changeset encodes patch/minor; a patch yields `0.2.1`.
**Resolution:** Require a **minor** changeset and assert the resulting version is `0.3.0`.

### PF-035: The Won’t-Have constraints had no negative tests [MINOR]

**Location:** `07-testing-strategy.md`
**Evidence:** No test forbids `transform: scale`, a built-in menu dependency, automatic month reduction or a column-count change.
**Resolution:** Add ST-39 and the `fit-contract` assertions.

### PF-036: The description count conflated component and story levels [OBSERVATION]

**Location:** `03-04-storybook-demos.md`
**Evidence:** `Print.stories.tsx` uses `description.component`, not `description.story`.
**Resolution:** State “1 component description, 1 story description”; 173 stories need a story-level description, and the contract checks that level.

### PF-037: The index linked two documents that did not exist yet [OBSERVATION]

**Location:** `00-index.md` §Document Index
**Evidence:** `00-preflight-report.md` and `00-baseline.md` are created later.
**Resolution:** Mark both as pending; the baseline is a Phase 0 deliverable.

### PF-038: The performance evidence chain was not wired [MINOR]

**Location:** `03-01-performance.md`; `bench.spec.ts`
**Evidence:** `baselineP95` hard-codes `rd10-baseline.json`; the plan writes `rd13-baseline.json`; the bench route did not pin fit.
**Resolution:** Record fit mode, keep the RD-10 baseline for the existing oracle, add the RD-13 baseline for the new scenarios, and add a Phase 5 after-run record.

### PF-039: Storybook process/evidence gaps [MINOR]

**Location:** `03-04-storybook-demos.md`
**Evidence:** `storySort` was claimed tested but was not; the manual review had no evidence file; Phase 4 had no implementation-test step.
**Resolution:** Assert `storySort` in the contract, record the review in `docs/test-report.md`, and reword the phase overview.

### PF-040: The context-menu E2E/security proof was unowned [MINOR]

**Location:** `03-03-context-menu.md` §Testing Requirements
**Evidence:** The security spec runs against the demo; the Storybook menus are not there.
**Resolution:** Add a `?context=1` demo request log and an E2E assertion; treat the Storybook menus as documentation, not a security proof.

### PF-041: `fit` was called “additive” while changing the default [MINOR]

**Location:** `03-02-fit-typography.md` §Public API
**Evidence:** A default-on `contain` changes existing hosts.
**Resolution:** Document the new default and the `fit: "none"` opt-out in the migration guide and changelog.

### PF-042: Tabular numerals were already applied [OBSERVATION]

**Location:** `03-02-fit-typography.md` §Typography
**Evidence:** `.yp-root` already sets `font-variant-numeric: tabular-nums`.
**Resolution:** Replace the implementation claim with a computed-style test.

### PF-043: Story-count statements would drift [OBSERVATION]

**Location:** Phase 4
**Evidence:** README, getting-started and the test report hard-code 174 stories/12 files.
**Resolution:** Update them in task 4.2.9 alongside the docs contract.

## Accepted notes

| # | Note | Owner / revisit |
|---|------|-----------------|
| PF-N1 | The live `0.3.0` bootstrap, trusted publisher, repository visibility and branch protection remain owner actions. | User; `docs/releasing.md` |
| PF-N2 | AC8’s “0.2.0 was never published” is a registry fact; it stays `partial` until the owner records `npm view`. | User; Phase 5 evidence |
| PF-N3 | The manual NVDA/VoiceOver audit remains parked; no WCAG conformance claim. | User; before any conformance statement |

## Iteration 2 verification

| Check | Result |
| ----- | ------ |
| Plan file and link integrity | 10 plan docs + RD-13; every relative link resolves except the two marked pending |
| Numbered task count | 77, matching the phase table (9+13+17+14+14+10) |
| Register gate | `✅ GATE PASSED — 39 resolved, 0 open` |
| Fit arithmetic | 1280 × 800 uses comfortable columns at ~35 px with one 24 px lane; 1024 × 768 uses dense 26/24 at one lane; both fit within the border |
| Performance metrics | Unthrottled gate + 4× diagnostic; drag input delay ≤8 ms; click work ≤50 ms; frame cadence 16.7 ms |
| Context-menu feasibility | Root listener, annotation-first resolution, pointer-day date, deduped keyboard, touch ignore |
| Storybook feasibility | Helper keeps `: Story`; dev-only Fluent/MUI dependencies; story-level descriptions; Demos play functions |
| Release path | `0.3.0` minor changeset; `0.3.1` provenance; `0.2.0` unpublished; release contract updated |
| Traceability | 183 current criteria; 10 RD-13 ACs; 193 expected; AC8 `partial` |
| Codebase alignment | No phantom file; all named code paths exist; no new runtime dependency |

## Iteration 2 addendum — post-Phase 0

The Phase 0 baseline (2026-11-13 00:10) confirmed the visibility-path finding and
refined one metric:

- The 2,000-item drag input delay is ~16 ms (one 60 Hz frame), so the 8 ms gate
  is now **main-thread work per frame ≤8 ms**; input delay stays ≤16.7 ms.
  RD-13 AC3 and AR-3 record the change.
- The story inventory is **1 component description + 1 story description**;
  173 stories need a story-level description. PF-036 is corrected.
- The top self-time function at 2,000 items is `buildAncestry`
  (`visibility.ts:150`), 21.2% at 1× and 40.4% at 4×. Phase 1 task 1.2.1 is
  confirmed as the first fix.
- No critical or major finding reopened. The plan remains
  **✅ PASSED WITH NOTES**.

**Verdict:** ✅ PASSED WITH NOTES — every critical and major finding is resolved
in RD-13 and the plan; the three notes are release-operation constraints.
