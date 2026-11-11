# Execution Plan: Quality Gates, Performance, Security and Browsers

> **Document**: 99-execution-plan.md
> **Parent**: [Index](00-index.md)
> **Last Updated**: 2026-11-11 19:29
> **Progress**: 54/92 tasks (59%)
> **CodeOps Artifact Schema**: 1

## Overview

Implement RD-10 and issue #3 in seven phases: traceability/API, browser and print matrix,
timezone/SSR/flaky policy, performance harness, issue #3 optimization, security/dependency gates,
and CI evidence. Every feature phase follows the specification-first order: write spec tests, prove
red, implement, prove green, add implementation tests, verify.

**🚨 Update this document after EACH completed task!**

---

## Implementation Phases

| Phase | Title | Tasks |
| ----- | ----- | ----- |
| 1 | Traceability, coverage and quality contracts | 19 |
| 2 | Browser, mobile, visual and print matrix | 13 |
| 3 | Timezone, SSR and flaky policy | 9 |
| 4 | Performance harness and baseline | 13 |
| 5 | Issue #3 optimization | 11 |
| 6 | Security, privacy and dependency gates | 14 |
| 7 | CI evidence and documentation | 13 |

**Total: 92 tasks across 7 phases**

> **⚠️ EXECUTION RULE — APPLIES TO EVERY AGENT EXECUTING THIS PLAN:**
>
> The task checkboxes in the phase sections below are the **single source of truth** for progress.
> Every task line appears exactly once. On implementation mark `[~]` with a timestamp; on verify
> pass promote to `[x]`; update the Progress header after every task. On a blocker mark `[!]` and
> append `Blocked: <reason>`.

---

## Phase 1: Traceability, coverage and public API

> **Phase baseline tree**: recorded at phase start by the exec-plan skill.
> **Lenses**: correctness, maintainability, api-surface
> **Reasoning**: high — a wrong AC mapping or export contract silently weakens every later gate.

### Step 1.1: Specification tests

**Reference**: [03-01](03-01-traceability-api.md) · ST-1–ST-8 · AR-3, AR-4, AR-24
**Objective**: Prove the current matrix, title IDs and public-export contract are incomplete before
changing them.

- [x] 1.1.1 [spec-author] Write ST-1–ST-5 checker tests with `RD-10-AC-02` and `through: 9` until the RD-10 tests exist — `tests/quality/traceability.spec.test.ts` ✅ (completed: 2026-11-11 16:00)
- [x] 1.1.2 [spec-author] Write the public runtime export smoke test with `RD-10-AC-03` — `tests/quality/public-api.spec.test.ts` ✅ (completed: 2026-11-11 16:00)
- [x] 1.1.3 [spec-author] Write the coverage, API-report and size contract test with `RD-10-AC-03` and `RD-10-AC-12` — `tests/quality/coverage-contract.spec.test.ts` ✅ (completed: 2026-11-11 16:00)
- [x] 1.1.4 [spec-author] Write the RD-01 repository/process contract tests — `tests/quality/repo-contract.spec.test.ts` ✅ (completed: 2026-11-11 16:00)
- [x] 1.1.5 Add the root quality Vitest project and `test:quality` script (test infrastructure) — `vitest.quality.config.ts`, `package.json` ✅ (completed: 2026-11-11 16:00)
- [x] 1.1.6 Run the new tests and record the red result — `pnpm test:quality` ✅ (completed: 2026-11-11 16:00)

### Step 1.2: Implementation

**Reference**: [03-01](03-01-traceability-api.md) · AR-3, AR-4
**Objective**: Add the checker, full matrix and title IDs; restore green.

- [x] 1.2.1 Implement the parser/checker/CLI with status, file and title validation — `scripts/lib/traceability.mjs`, `scripts/check-traceability.mjs` ✅ (completed: 2026-11-11 16:00)
- [x] 1.2.2 Expand the canonical AC matrix for RD-01..RD-09 — `codeops/features/year-planner/requirements/00-traceability.md` ✅ (completed: 2026-11-11 16:00)
- [x] 1.2.3 Add `RD-02/RD-03` AC IDs to spec-test titles ✅ (completed: 2026-11-11 16:00)
- [x] 1.2.4 Add `RD-04/RD-05` AC IDs to spec-test titles ✅ (completed: 2026-11-11 16:00)
- [x] 1.2.5 Add `RD-06/RD-07` AC IDs to spec-test titles ✅ (completed: 2026-11-11 16:00)
- [x] 1.2.6 Add `RD-08/RD-09` AC IDs to spec-test titles ✅ (completed: 2026-11-11 16:00)
- [x] 1.2.7 Add the public API golden list and runtime smoke implementation — `tests/quality/public-api.golden.json` ✅ (completed: 2026-11-11 16:00)
- [x] 1.2.8 Split the size check into React entry+CSS (60 kB) and total (65 kB) and add the `RD-10-AC-12` title — `scripts/check-size.mjs`, `tests/quality/coverage-contract.spec.test.ts` ✅ (completed: 2026-11-11 16:00)
- [x] 1.2.9 Add the root tools typecheck and demo typecheck — `tsconfig.tools.json`, `apps/demo/tsconfig.json`, `package.json` ✅ (completed: 2026-11-11 16:00)
- [x] 1.2.10 Wire `test:quality` and `typecheck:tools` into `verify` and CI — `package.json`, `.github/workflows/ci.yml` ✅ (completed: 2026-11-11 16:00)

### Step 1.3: Green, implementation tests and verify

- [x] 1.3.1 Prove green for ST-1–ST-8 — `pnpm test:quality` ✅ (completed: 2026-11-11 16:00)
- [x] 1.3.2 Write checker implementation tests for malformed RDs, duplicates and slash expansion — `tests/quality/traceability.impl.test.ts` ✅ (completed: 2026-11-11 16:00)
- [x] 1.3.3 Verify the phase — `pnpm verify` ✅ (completed: 2026-11-11 16:00)

**Deliverables**:
- [x] Deterministic traceability checker with precise failure output ✅ (completed: 2026-11-11 16:05)
- [x] RD-01..RD-09 matrix and title IDs (RD-10 joins in Phase 7) ✅ (completed: 2026-11-11 16:05)
- [x] Both size measurements with the React 60 kB and total 65 kB guards ✅ (completed: 2026-11-11 16:05)
- [x] Public runtime export smoke and coverage floor test ✅ (completed: 2026-11-11 16:05)
- [x] All phase verification passing ✅ (completed: 2026-11-11 16:05)

**Verify**: `pnpm verify`

---

## Phase 2: Browser, mobile, visual and print matrix

> **Phase baseline tree**: recorded at phase start by the exec-plan skill.
> **Lenses**: correctness, maintainability
> **Reasoning**: high — baselines and print page counts are visual oracles; a wrong fixture hides a regression.

### Step 2.1: Specification tests

**Reference**: [03-02](03-02-test-matrix.md) · ST-11–ST-18 · AR-6–AR-9
**Objective**: Write the window, overflow, theme, print, mobile and React 19 tests before adding the
fixtures and baselines.

- [x] 2.1.1 [spec-author] Write the 12/18/24/36 window, overflow, high-contrast and print visual tests with `RD-10-AC-04` — `tests/e2e/quality-visual.spec.ts` ✅ (completed: 2026-11-11 17:50)
- [x] 2.1.2 [spec-author] Write the 12/18 month and PRT-01 print tests with `RD-10-AC-06` — `tests/e2e/print-matrix.spec.ts` ✅ (completed: 2026-11-11 17:50)
- [x] 2.1.3 [spec-author] Write the mobile Chromium/WebKit smoke with `RD-10-AC-04` — `tests/e2e/mobile.spec.ts` ✅ (completed: 2026-11-11 17:50)
- [x] 2.1.4 [spec-author] Write the React 19 render smoke with `RD-10-AC-04` — `packages/react/src/react19.spec.test.tsx` ✅ (completed: 2026-11-11 17:50)
- [x] 2.1.5 Run the new tests and record the red result — `pnpm exec playwright test tests/e2e/quality-visual.spec.ts tests/e2e/print-matrix.spec.ts tests/e2e/mobile.spec.ts && pnpm --filter @blendsdk/react-year-planner exec vitest run src/react19.spec.test.tsx` ✅ (completed: 2026-11-11 17:50)

### Step 2.2: Implementation

**Reference**: [03-02](03-02-test-matrix.md) · AR-6–AR-9, AR-27
**Objective**: Add the missing window options, print fixture, mobile projects, shared PDF helper and
reviewed baselines.

- [x] 2.2.1 Add 12/18-month options and the PRT-01 print fixture — `apps/demo/src/App.tsx` ✅ (completed: 2026-11-11 17:50)
- [x] 2.2.2 Add the mobile projects, explicit zero retries and `trace: "retain-on-failure"` — `playwright.config.ts` ✅ (completed: 2026-11-11 17:50)
- [x] 2.2.3 Extract the shared PDF reader and page assertions — `tests/e2e/pdf.ts` ✅ (completed: 2026-11-11 17:50)
- [x] 2.2.4 Generate and review the Chromium, Firefox and WebKit baselines — `tests/e2e/*-snapshots/` ✅ (completed: 2026-11-11 17:50)
- [x] 2.2.5 Add `test:a11y`, `test:visual`, `test:print` and `test:mobile` aliases and tag the axe spec with `RD-10-AC-07` — `package.json`, `tests/e2e/accessibility.spec.ts` ✅ (completed: 2026-11-11 17:50)
- [x] 2.3.1 Prove green for ST-11–ST-18 — `pnpm exec playwright test` ✅ (completed: 2026-11-11 17:50)
- [x] 2.3.2 Add print page-count, row-bounds and `pdftotext` cases for 12 and 18 months — `packages/react/src/print.impl.test.tsx`, `tests/e2e/print-matrix.spec.ts` ✅ (completed: 2026-11-11 17:50)
- [x] 2.3.3 Verify the phase — `pnpm verify` ✅ (completed: 2026-11-11 17:50)

**Deliverables**:
- [x] 12/14/18/24/36 visual baselines on three desktop engines ✅ (completed: 2026-11-11 18:10)
- [x] Compact/expanded overflow and high-contrast baselines ✅ (completed: 2026-11-11 18:10)
- [x] 12/14/18/24/36 and PRT-01 print evidence ✅ (completed: 2026-11-11 18:10)
- [x] Mobile Chromium and WebKit smoke projects ✅ (completed: 2026-11-11 18:10)
- [x] All phase verification passing ✅ (completed: 2026-11-11 18:10)

**Verify**: `pnpm verify`

---

## Phase 3: Timezone, SSR and flaky policy

> **Phase baseline tree**: recorded at phase start by the exec-plan skill.
> **Lenses**: correctness, maintainability
> **Reasoning**: high — timezone and hydration defects are environment-dependent and easy to miss locally.

### Step 3.1: Specification tests

**Reference**: [03-02](03-02-test-matrix.md), [03-05](03-05-ci-evidence.md) · ST-9, ST-41, ST-42, ST-45 · AR-5, AR-20, AR-22
**Objective**: Prove the locale-sensitive hydration and explicit zero-retry policy are enforced.

- [x] 3.1.1 [spec-author] Add the differing client-locale hydration case with `RD-10-AC-15` — `packages/react/src/YearPlanner.hydration.spec.test.tsx` ✅ (completed: 2026-11-11 18:32)
- [x] 3.1.2 [spec-author] Add the Playwright config contract test — `tests/quality/playwright-config.spec.test.ts` ✅ (completed: 2026-11-11 18:32)
- [x] 3.1.3 Run the new tests and record red or justify an already-green case — `pnpm test:quality && pnpm --filter @blendsdk/react-year-planner test` ✅ (completed: 2026-11-11 18:32)

### Step 3.2: Implementation

**Reference**: [03-02](03-02-test-matrix.md) · AR-5, AR-20, AR-22
**Objective**: Add the timezone script, the locale hydration behavior and the flaky policy.

- [x] 3.2.1 Add the three-timezone core script and `test:timezones` — `scripts/test-timezones.sh`, `package.json` ✅ (completed: 2026-11-11 18:32)
- [x] 3.2.2 Prove explicit `display.locale` wins and the client locale is ignored; change production code only if the test fails, and record the behavior fix — `packages/react/src/YearPlanner.hydration.spec.test.tsx` ✅ (completed: 2026-11-11 18:32)
- [x] 3.2.3 Set `retries: 0`, add `test:flaky` and document the policy — `playwright.config.ts`, `package.json`, `CONTRIBUTING.md` ✅ (completed: 2026-11-11 18:32)
- [x] 3.3.1 Prove green for ST-9, ST-41, ST-42 and ST-45 — `pnpm test:quality && pnpm test:timezones && pnpm --filter @blendsdk/react-year-planner test` ✅ (completed: 2026-11-11 18:32)
- [x] 3.3.2 Add invalid-locale and invalid-timezone SSR/hydration implementation cases with `RD-10-AC-15` — `packages/react/src/YearPlanner.ssr.spec.test.tsx` ✅ (completed: 2026-11-11 18:32)
- [x] 3.3.3 Verify the phase — `pnpm verify` ✅ (completed: 2026-11-11 18:32)

**Deliverables**:
- [x] `pnpm test:timezones` passes under all three zones ✅ (completed: 2026-11-11 19:20)
- [x] Locale-differing hydration has no warning ✅ (completed: 2026-11-11 19:20)
- [x] Zero-retry policy is explicit and documented ✅ (completed: 2026-11-11 19:20)
- [x] All phase verification passing ✅ (completed: 2026-11-11 19:20)

**Verify**: `pnpm verify`

---

## Phase 4: Performance harness and baseline

> **Phase baseline tree**: recorded at phase start by the exec-plan skill.
> **Lenses**: correctness, perf
> **Reasoning**: max — the baseline defines the issue #3 oracle and the release budget evidence.

### Step 4.1: Specification tests

**Reference**: [03-03](03-03-performance.md) · ST-29–ST-38 · AR-10–AR-13, AR-29
**Objective**: Define every benchmark scenario and budget assertion before building the harness.

- [x] 4.1.1 [spec-author] Write the initial-render, drag, overflow and profile tests with `RD-10-AC-11` — `tests/perf/bench.spec.ts` ✅ (completed: 2026-11-11 19:29)
- [x] 4.1.2 [spec-author] Write the benchmark contract test for commands, scenarios and result fields — `tests/quality/bench-contract.spec.test.ts` ✅ (completed: 2026-11-11 19:29)
- [x] 4.1.3 Add the benchmark Playwright config, `test:perf` and `bench` scripts (test infrastructure) — `playwright.bench.config.ts`, `package.json` ✅ (completed: 2026-11-11 19:29)
- [x] 4.1.4 Run the new tests and record the red result — `pnpm test:perf && pnpm test:quality` ✅ (completed: 2026-11-11 19:29)

### Step 4.2: Implementation

**Reference**: [03-03](03-03-performance.md) · AR-10–AR-13, AR-28, AR-29
**Objective**: Build the deterministic fixture, Node layout harness, production/dev browser
harness and baseline artifacts.

- [x] 4.2.1 Add the deterministic ESM benchmark data, its declaration and the demo route — `scripts/bench-data.mjs`, `scripts/bench-data.d.ts`, `apps/demo/src/bench-data.ts`, `apps/demo/src/BenchDemo.tsx`, `apps/demo/src/App.tsx` ✅ (completed: 2026-11-11 19:29)
- [x] 4.2.2 Add the Node layout/ribbon benchmark — `scripts/bench-layout.mjs` ✅ (completed: 2026-11-11 19:29)
- [x] 4.2.3 Add the production/dev orchestrator and wire the scripts — `scripts/bench.mjs`, `package.json` ✅ (completed: 2026-11-11 19:29)
- [x] 4.2.4 Run the baseline with `pnpm bench --out docs/benchmarks/rd10-baseline` and capture the CPU profiles — `docs/benchmarks/rd10-baseline.json`, `docs/benchmarks/rd10-baseline.md` ✅ (completed: 2026-11-11 19:29)
- [x] 4.2.5 Record the baseline commands, environment and values — `docs/test-report.md` ✅ (completed: 2026-11-11 19:29)
- [x] 4.3.1 Prove the harness runs every scenario and records `pass`/`miss` — `pnpm bench` ✅ (completed: 2026-11-11 19:29)
- [x] 4.3.2 Write the ST-38 determinism/validity spec and the impl edge cases — `tests/quality/bench-data.spec.test.ts`, `tests/quality/bench-data.impl.test.ts` ✅ (completed: 2026-11-11 19:29)
- [x] 4.3.3 Run the full benchmark suite and inspect the artifact — `pnpm bench` ✅ (completed: 2026-11-11 19:29)
- [x] 4.3.4 Verify the phase — `pnpm verify` ✅ (completed: 2026-11-11 19:29)

**Deliverables**:
- [x] One command produces layout, render, drag, overflow and profile evidence ✅ (completed: 2026-11-11 19:35)
- [x] Baseline JSON/Markdown checked in with named hardware/browser ✅ (completed: 2026-11-11 19:35)
- [x] Dev/production split for the 500-item drag ✅ (completed: 2026-11-11 19:35)
- [x] All phase verification passing ✅ (completed: 2026-11-11 19:35)

**Verify**: `pnpm verify`

---

## Phase 5: Issue #3 optimization

> **Phase baseline tree**: recorded at phase start by the exec-plan skill.
> **Lenses**: correctness, perf
> **Reasoning**: max — render memoization touches the interaction hot path and must not change behavior.

### Step 5.1: Specification test

**Reference**: [03-03](03-03-performance.md) · ST-34, ST-36, ST-39 · AR-13, AR-14
**Objective**: Lock the drag budget and the preview-intersection contract before changing render
behavior.

- [ ] 5.1.1 [spec-author] Add the preview-intersection cases and the issue #3 oracle (≤0.9× baseline or ≤16.7 ms, three repeats) — `packages/react/src/interaction/preview.spec.test.tsx`, `tests/perf/bench.spec.ts`
- [ ] 5.1.2 Run the strict issue #3 oracle against the baseline and record the red result — `PERF_STRICT=1 pnpm test:perf && pnpm --filter @blendsdk/react-year-planner exec vitest run src/interaction/preview.spec.test.tsx`

### Step 5.2: Implementation

**Reference**: [03-03](03-03-performance.md) · AR-14, AR-28
**Objective**: Apply the profile-supported memoization and preview isolation, then re-measure.

- [ ] 5.2.1 Stabilize the `components` object and item-selection callback — `packages/react/src/YearPlanner.tsx`
- [ ] 5.2.2 Memoize `MonthRow` and `CellLayer`; pass `activeDate` only to its row — `packages/react/src/render/MonthRow.tsx`, `CellLayer.tsx`
- [ ] 5.2.3 Memoize `ItemOverlay`, `ItemLayer`, `PrintPages` and `ItemList`; compare previews by key, validity and ranges and reuse unchanged objects — `packages/react/src/render/ItemOverlay.tsx`, `ItemLayer.tsx`, `PrintPages.tsx`, `ItemList.tsx`
- [ ] 5.2.4 Add `previewIntersectsRow`, filter previews per row before memoized children and reuse the existing clipping helper — `packages/react/src/interaction/preview.ts`, `packages/react/src/render/YearGrid.tsx`
- [ ] 5.2.5 Re-run the same benchmark with `pnpm bench --out docs/benchmarks/rd10-after` — `docs/benchmarks/rd10-after.json`, `docs/benchmarks/rd10-after.md`
- [ ] 5.2.6 Record the before/after delta, remaining hotspot and any budget miss — `docs/test-report.md`
- [ ] 5.3.1 Prove the strict issue #3 oracle and the preview cases, recording any budget miss — `PERF_STRICT=1 pnpm test:perf && pnpm --filter @blendsdk/react-year-planner exec vitest run src/interaction/preview.spec.test.tsx`
- [ ] 5.3.2 Add boundary and empty-preview implementation tests — `packages/react/src/interaction/preview.impl.test.tsx`
- [ ] 5.3.3 Verify the phase with the behavioral suites — `pnpm verify:full`

**Deliverables**:
- [ ] Measurable production drag improvement against the baseline
- [ ] 36-month/500-item profile recorded
- [ ] No DOM, focus, selection, preview or command regression
- [ ] All phase verification passing

**Verify**: `pnpm verify:full`

---

## Phase 6: Security, privacy and dependency gates

> **Phase baseline tree**: recorded at phase start by the exec-plan skill.
> **Lenses**: correctness, security
> **Reasoning**: max — hidden-data and injection defects are release-blocking and the dependency upgrade changes the test toolchain.

### Step 6.1: Specification tests

**Reference**: [03-04](03-04-security-privacy.md) · ST-21–ST-28 · AR-15–AR-19
**Objective**: Prove hidden data, XSS, network calls, audit and licenses are covered before changing
the code or dependencies.

- [ ] 6.1.1 [spec-author] Write the valid hidden/XSS/network component tests with `RD-10-AC-08`, `RD-10-AC-09` and `RD-10-AC-10`; include the print hidden assertion — `packages/react/src/security.spec.test.tsx`, `packages/react/src/print.spec.test.tsx`
- [ ] 6.1.2 [spec-author] Write the style/class/diagnostic and seeded parser-fuzz cases — `packages/react/src/security.impl.test.tsx`, `packages/core/src/fuzz.spec.test.ts`
- [ ] 6.1.3 [spec-author] Write the browser request-log, hidden-data and CSP E2E tests with `RD-10-AC-08`, `RD-10-AC-10` and `RD-10-AC-13` — `tests/e2e/security.spec.ts`
- [ ] 6.1.4 [spec-author] Write the audit/license/CI least-privilege contract tests with `RD-10-AC-16` — `tests/quality/audit-contract.spec.test.ts`, `tests/quality/ci-contract.spec.test.ts`
- [ ] 6.1.5 [spec-author] Add the hidden sentinel and visible control to the `?security=1` fixture — `apps/demo/src/App.tsx`
- [ ] 6.1.6 Run the new component and E2E tests; record the red result and justify any already-green case — `pnpm --filter @blendsdk/react-year-planner test && pnpm exec playwright test tests/e2e/security.spec.ts`

### Step 6.2: Implementation

**Reference**: [03-04](03-04-security-privacy.md) · AR-15–AR-19
**Objective**: Fix any leak, upgrade Vitest, add the audit/license gates and update the security notes.

- [ ] 6.2.1 Upgrade Vitest and coverage to 4.1.12; fix configuration drift — `package.json`, `pnpm-lock.yaml`, package Vitest configs
- [ ] 6.2.2 Fix any hidden-data, XSS or network finding exposed by ST-21–ST-25
- [ ] 6.2.3 Fix any print/filter leak exposed by the ST-21 assertion — `packages/react/src/print.spec.test.tsx`
- [ ] 6.2.4 Add the license generator and checked-in notices — `scripts/write-licenses.mjs`, `THIRD_PARTY_NOTICES.md`
- [ ] 6.2.5 Add `test:audit`/`test:licenses`, run the audit and record the result — `package.json`, `docs/security.md`
- [ ] 6.3.1 Prove green for ST-21–ST-28 — `pnpm test:quality && pnpm --filter @blendsdk/react-year-planner test && pnpm exec playwright test tests/e2e/security.spec.ts && pnpm test:audit && pnpm test:licenses`
- [ ] 6.3.2 Add implementation tests for safe-style edges and diagnostics redaction — `packages/react/src/security.impl.test.tsx`
- [ ] 6.3.3 Verify the phase — `pnpm verify`

**Deliverables**:
- [ ] Hidden item absent from DOM, ARIA, tooltip, item list, inspector, print and overflow
- [ ] XSS payloads inert and no network request
- [ ] `pnpm audit --audit-level high` clean
- [ ] Current `THIRD_PARTY_NOTICES.md`
- [ ] All phase verification passing

**Verify**: `pnpm verify`

---

## Phase 7: CI evidence and documentation

> **Phase baseline tree**: recorded at phase start by the exec-plan skill.
> **Lenses**: correctness, maintainability
> **Reasoning**: high — the report and artifacts are the release evidence; missing fields are a gate failure.

### Step 7.1: Specification tests

**Reference**: [03-05](03-05-ci-evidence.md) · ST-44–ST-48 · AR-21, AR-22
**Objective**: Define the CI jobs, artifact paths, reporters and report fields before editing the
workflow.

- [ ] 7.1.1 [spec-author] Write the CI and report contract test with `RD-10-AC-01` and `RD-10-AC-05` — `tests/quality/ci-contract.spec.test.ts`
- [ ] 7.1.2 [spec-author] Write the package-script contract test with `RD-10-AC-12` and `RD-10-AC-14` — `tests/quality/package-scripts.spec.test.ts`
- [ ] 7.1.3 Run the new tests and record the red result — `pnpm test:quality`

### Step 7.2: Implementation

**Reference**: [03-05](03-05-ci-evidence.md) · AR-21, AR-22
**Objective**: Publish the evidence and update the curated reports.

- [ ] 7.2.1 Add the Playwright reporters, environment capture and `test:environment` script — `playwright.config.ts`, `scripts/ci-environment.mjs`, `package.json`
- [ ] 7.2.2 Add the timezone, security and performance jobs and artifact uploads — `.github/workflows/ci.yml`
- [ ] 7.2.3 Wire `verify` and `verify:full` to the new gates — `package.json`
- [ ] 7.2.4 Update the report, security notes, contributing guide and command docs — `docs/test-report.md`, `docs/security.md`, `CONTRIBUTING.md`, `README.md`
- [ ] 7.2.5 Extend the clean consumer with a packed-types `tsc --noEmit` and a tree-shake assertion — `scripts/clean-consumer.sh`
- [ ] 7.2.6 Run the full gate and record actual counts, versions, both size measurements and gaps — `pnpm verify:full`
- [ ] 7.2.7 Add the RD-10 matrix rows, switch the checker `through` to 10 and prove the full traceability set — `codeops/features/year-planner/requirements/00-traceability.md`, `tests/quality/traceability.spec.test.ts`
- [ ] 7.3.1 Prove green for ST-1 and ST-44–ST-48 — `pnpm test:quality`
- [ ] 7.3.2 Add environment-capture implementation tests for missing browsers and parseable output — `tests/quality/environment.impl.test.ts`
- [ ] 7.3.3 Final full verification — `pnpm verify:full && pnpm test:consumer`

**Deliverables**:
- [ ] CI publishes the report and raw artifacts
- [ ] Test report records commands, counts, versions, both size measurements, budget results, audit and gaps
- [ ] `verify:full` includes timezone, audit, performance and benchmark gates
- [ ] All final verification passing

**Verify**: `pnpm verify:full && pnpm test:consumer`

---

## Dependencies

```text
Phase 1 (traceability/API)
    ↓
Phase 2 (browser/visual/print)
    ↓
Phase 3 (timezone/SSR/flaky)
    ↓
Phase 4 (performance harness + baseline)
    ↓
Phase 5 (issue #3 optimization)
    ↓
Phase 6 (security/dependencies)
    ↓
Phase 7 (CI evidence/report)
```

Phase 6 can start after Phase 1 because its security tests do not depend on the performance harness.
The plan keeps the linear order so the baseline is captured before the render changes.

## Success Criteria

**Feature is complete when:**

1. ✅ All 92 tasks completed and the Progress header reads 100%.
2. ✅ `pnpm verify:full` passes on a clean checkout, including timezone, performance and bench.
3. ✅ `pnpm test:consumer` passes.
4. ✅ `pnpm audit --audit-level high` exits clean; the license report is current.
5. ✅ `pnpm bench` records 500/2k/10k results and issue #3 before/after evidence.
6. ✅ The test report contains commands, counts, browser versions, budgets, known gaps and the
   both size measurements; no unmeasured claim is made.
7. ✅ No dead code, no lowered coverage threshold and no weakened test.
8. ✅ No WCAG conformance claim while the manual AT audit is parked.
9. ✅ Code reviewed by the security/performance/correctness reviewers where assigned.
10. ✅ Roadmap updated to Done with the plan linked.
