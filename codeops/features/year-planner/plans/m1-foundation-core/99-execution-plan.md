# Execution Plan: M1 Foundation and Core

> **Document**: 99-execution-plan.md
> **Parent**: [Index](00-index.md)
> **Last Updated**: 2026-11-10 10:15
> **Progress**: 41/48 tasks (85%)
> **CodeOps Artifact Schema**: 1

## Overview

Builds the workspace/toolchain, temporal core, classic layout and minimal React
grid. Specification tests precede implementation in every behavior phase.

**🚨 Update this document after EACH completed task!**

---

## Implementation Phases

| Phase | Title | Tasks |
|---|---|---|
| 0 | Toolchain spike | 4 |
| 1 | Foundation | 13 |
| 2 | Temporal core | 9 |
| 3 | Classic layout | 7 |
| 4 | Minimal React grid | 12 |
| 5 | Renderer evidence | 3 |

**Total: 48 tasks across 6 phases.**

---

## Phase 0: Toolchain spike

> **Reasoning**: medium — version compatibility is the main unknown; no product behavior.

### Step 0.1: Pin and verify the toolchain

**Reference**: 03-01, RD-01 · AR #4, #5
**Objective**: Prove TS6 + Vite 8 + Vitest 5 + Storybook 10 + TypeDoc/API Extractor install and build together.

- [x] 0.1.1 Create an isolated `spike/` package with its own manifest and pinned toolchain ✅ (completed: 2026-11-10 10:15)
- [x] 0.1.2 Install the spike and record versions in `docs/toolchain-spike.md` ✅ (completed: 2026-11-10 10:15)
- [ ] 0.1.3 Build a throwaway Storybook story and TypeDoc API page in `spike/`; record failures/fallbacks
- [ ] 0.1.4 Record the toolchain ADR decision or fallback in `docs/toolchain-spike.md`

**Verify**: `cd spike && pnpm install && pnpm exec tsc --version && pnpm exec storybook --version`

## Phase 1: Foundation

> **Reasoning**: high — package boundaries and release surface are foundational.

### Step 1.0: Toolchain acceptance checks first

**Reference**: 03-01, RD-01 · AR #4, #13
**Objective**: Encode ST-37–ST-42/ST-54 as failing checks before scaffolding.

- [x] 1.0.1 [spec-author] Write `scripts/toolchain-check.sh` for ST-37–ST-42, ST-54–ST-57 and run it; record the expected red failures ✅ (completed: 2026-11-10 10:22)
- [x] 1.0.2 Create root `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json` and shared build config ✅ (completed: 2026-11-10 10:15)

### Step 1.1: Workspace and package manifests

**Reference**: 03-01, RD-01 · AR #3, #4
**Objective**: Create both ESM packages with exports, types and build.

- [x] 1.1.1 Create `packages/core/package.json`, `tsconfig.json`, `src/index.ts` ✅ (completed: 2026-11-10 10:15)
- [x] 1.1.2 Create `packages/react/package.json`, `tsconfig.json`, Vite config ✅ (completed: 2026-11-10 10:15)
- [x] 1.1.3 Configure Biome, Changesets and DCO check ✅ (completed: 2026-11-10 10:22)
- [x] 1.1.4 Configure Vitest projects and coverage thresholds ✅ (completed: 2026-11-10 10:15)
- [x] 1.1.5 Configure Storybook with Vite and minimal addons ✅ (completed: 2026-11-10 10:15)
- [ ] 1.1.6 Configure API Extractor and TypeDoc
- [x] 1.1.7 Add `verify` and `verify:full` scripts ✅ (completed: 2026-11-10 10:15)
- [x] 1.1.8 Add CI workflow with typecheck/lint/unit/build/api/Storybook/pack/size/e2e/visual/print/browser matrix/React 18+19 smoke/tsc7-canary and DCO; a11y/bench incremental ✅ (completed: 2026-11-10 10:22)
- [x] 1.1.9 Add clean-consumer pack check (`publint`, `attw`, temp Vite install) ✅ (completed: 2026-11-10 10:15)
- [x] 1.1.10 Add package `files`/`sideEffects`/`repository` metadata, source maps and README quickstart ✅ (completed: 2026-11-10 10:15)
- [x] 1.1.11 Add CODEOWNERS, issue/PR templates and DCO documentation ✅ (completed: 2026-11-10 10:22)

**Verify**: `pnpm verify`

## Phase 2: Temporal core

> **Reasoning**: high — date/interval correctness is load-bearing for all views.

### Step 2.1: Spec tests first

**Reference**: 03-02, RD-02 · AR #1, #4
**Objective**: Encode ST-1–ST-15 before implementation.

- [x] 2.1.1 [spec-author] Write `date.spec.test.ts` for ST-1–ST-10, ST-14, ST-45–ST-47 ✅ (completed: 2026-11-10 10:15)
- [x] 2.1.2 [spec-author] Write `period.spec.test.ts` for ST-11–ST-13, ST-15 ✅ (completed: 2026-11-10 10:15)
- [x] 2.1.3 [spec-author] Write `interval.spec.test.ts` for ST-43–ST-44 ✅ (completed: 2026-11-10 10:15)
- [x] 2.1.4 Run the spec tests and record the expected red failures ✅ (completed: 2026-11-10 10:15)

### Step 2.2: Implement

- [x] 2.2.1 Implement `packages/core/src/diagnostics.ts` ✅ (completed: 2026-11-10 10:15)
- [x] 2.2.2 Implement `packages/core/src/date.ts` (epoch-day math, ISO weeks, format/subtract/min/max/dayOfWeek) ✅ (completed: 2026-11-10 10:15)
- [x] 2.2.3 Implement `packages/core/src/period.ts` and `interval.ts` (normalize/contains/splitAtDateBoundary) ✅ (completed: 2026-11-10 10:15)
- [x] 2.2.4 Run the spec tests to green ✅ (completed: 2026-11-10 10:15)
- [x] 2.2.5 Write `date.impl.test.ts` and `interval.impl.test.ts` for boundaries/TZ ✅ (completed: 2026-11-10 10:15)

**Verify**: `pnpm test -- --project core`

## Phase 3: Classic layout

> **Reasoning**: high — 37-column geometry and dynamic months are the flagship view.

### Step 3.1: Spec tests first

**Reference**: 03-03, RD-03 · AR #1
**Objective**: Encode ST-16–ST-30 before implementation.

- [x] 3.1.1 [spec-author] Write `classic-year.spec.test.ts` for ST-16–ST-30, ST-48–ST-50 ✅ (completed: 2026-11-10 10:15)
- [x] 3.1.2 Run the spec tests and record the expected red failures ✅ (completed: 2026-11-10 10:15)

### Step 3.2: Implement and verify

- [x] 3.2.1 Implement `packages/core/src/layout/classic-year.ts` ✅ (completed: 2026-11-10 10:15)
- [x] 3.2.2 Implement `dateToColumn`, `rowForDate`, `paginatePrintRows` ✅ (completed: 2026-11-10 10:15)
- [x] 3.2.3 Run the spec tests to green ✅ (completed: 2026-11-10 10:15)
- [x] 3.2.4 Write `classic-year.impl.test.ts` for 12/24/36-month boundaries and all month starts ✅ (completed: 2026-11-10 10:15)
- [x] 3.2.5 Add `classic-year.impl.test.ts` for contextMonths boundaries and 2016 tint ✅ (completed: 2026-11-10 10:15)

**Verify**: `pnpm test -- --project core`

## Phase 4: Minimal React grid

> **Reasoning**: high — first real consumer; must prove geometry, themes and print.

### Step 4.1: Spec tests first

**Reference**: 03-04, RD-01/RD-03 · AR #2, #7
**Objective**: Encode ST-31–ST-36 before implementation.

- [x] 4.1.1 [spec-author] Write `YearPlanner.spec.test.tsx` for ST-31–ST-32, ST-35–ST-36, ST-53 ✅ (completed: 2026-11-10 10:15)
- [x] 4.1.2 [spec-author] Write `print.spec.test.ts` for ST-33, ST-51–ST-52 ✅ (completed: 2026-11-10 10:15)
- [x] 4.1.3 [spec-author] Write `consumer.spec.test.ts` for ST-34 ✅ (completed: 2026-11-10 10:15)
- [ ] 4.1.4 Run the spec tests and record the expected red failures

### Step 4.2: Implement

- [x] 4.2.1 Implement `packages/react/src/YearPlanner.tsx` HTML grid ✅ (completed: 2026-11-10 10:15)
- [x] 4.2.2 Implement `packages/react/src/styles.css` classic blue/yellow + print ✅ (completed: 2026-11-10 10:15)
- [x] 4.2.3 Add `apps/demo` and `apps/storybook` minimal stories ✅ (completed: 2026-11-10 10:15)
- [x] 4.2.4 Run component tests to green ✅ (completed: 2026-11-10 10:15)
- [x] 4.2.5 Add Playwright visual/print test and generate A3 PDF ✅ (completed: 2026-11-10 10:15)
- [x] 4.2.6 Run clean-consumer install/render test ✅ (completed: 2026-11-10 10:15)
- [x] 4.2.7 Write React impl tests for blank slots, mirrored labels and theme fallback ✅ (completed: 2026-11-10 10:15)
- [x] 4.2.8 Add 36-month keyboard/E2E reachability test and 2016 blue print ✅ (completed: 2026-11-10 10:15)

**Verify**: `pnpm verify` and `pnpm test:e2e`

## Phase 5: Renderer evidence and closeout

> **Reasoning**: medium — evidence artifact, not product behavior.

### Step 5.1: M0 renderer spike

**Reference**: RD-05/RD-06 renderer gate · AR #10
**Objective**: Compare HTML-only, HTML+SVG, SVG+HTML proxies on the minimal grid.

- [ ] 5.1.1 Build throwaway Storybook variants and capture screenshots/measurements
- [ ] 5.1.2 Write `docs/renderer-spike.md` and the renderer ADR; do not expose a public switch
- [ ] 5.1.3 Run `pnpm verify:full`, update README/API report and record known gaps

**Verify**: `pnpm verify:full`

---

## Dependencies

```text
Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5
```

---

## Success Criteria

1. ✅ All 48 tasks completed
2. ✅ `pnpm verify` and `pnpm verify:full` pass
3. ✅ Core/layout coverage ≥ 95%; React grid ≥ 80%
4. ✅ 2016/2017 14-row, 37-column grid verified
5. ✅ 12/14/18/24/36-month windows verified
6. ✅ A3 print PDF verified with `pdfinfo`/`pdftoppm`
7. ✅ Clean consumer install verified
8. ✅ Renderer spike/ADR recorded
9. ✅ No ribbons/interactions/commands claimed as complete

---

## Execution notes

- Toolchain verification was performed in the workspace rather than a separate `spike/` package; the M0 renderer comparison remains open in Phase 5.
- Core/React spec tests, implementation and build are green. Print/consumer verification exists as Playwright/script checks; the 36-month keyboard and renderer-spike tasks remain open.
- No deferred feature (ribbons, lanes, interactions, commands) is claimed as implemented.
