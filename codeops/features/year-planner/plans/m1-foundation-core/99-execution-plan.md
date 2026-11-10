# Execution Plan: M1 Foundation and Core

> **Document**: 99-execution-plan.md
> **Parent**: [Index](00-index.md)
> **Last Updated**: 2026-11-10 09:26
> **Progress**: 0/40 tasks (0%)
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
| 1 | Foundation | 10 |
| 2 | Temporal core | 8 |
| 3 | Classic layout | 6 |
| 4 | Minimal React grid | 9 |
| 5 | Renderer evidence | 3 |

**Total: 40 tasks across 6 phases.**

---

## Phase 0: Toolchain spike

> **Reasoning**: medium — version compatibility is the main unknown; no product behavior.

### Step 0.1: Pin and verify the toolchain

**Reference**: 03-01, RD-01 · AR #4, #5
**Objective**: Prove TS6 + Vite 8 + Vitest 5 + Storybook 10 + TypeDoc/API Extractor install and build together.

- [ ] 0.1.1 Create root `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`
- [ ] 0.1.2 Install pinned toolchain and record versions in `docs/toolchain-spike.md`
- [ ] 0.1.3 Build a throwaway Storybook story and TypeDoc API page; record failures/fallbacks
- [ ] 0.1.4 Record the renderer/toolchain ADR decision or fallback in `docs/toolchain-spike.md`

**Verify**: `pnpm install && pnpm typecheck && pnpm storybook:build`

## Phase 1: Foundation

> **Reasoning**: high — package boundaries and release surface are foundational.

### Step 1.1: Workspace and package manifests

**Reference**: 03-01, RD-01 · AR #3, #4
**Objective**: Create both ESM packages with exports, types and build.

- [ ] 1.1.1 Create `packages/core/package.json`, `tsconfig.json`, `src/index.ts`
- [ ] 1.1.2 Create `packages/react/package.json`, `tsconfig.json`, Vite config
- [ ] 1.1.3 Configure Biome, Changesets and DCO check
- [ ] 1.1.4 Configure Vitest projects and coverage thresholds
- [ ] 1.1.5 Configure Storybook with Vite and minimal addons
- [ ] 1.1.6 Configure API Extractor and TypeDoc
- [ ] 1.1.7 Add `verify` and `verify:full` scripts
- [ ] 1.1.8 Add CI workflow with typecheck/lint/test/build/api/size/DCO
- [ ] 1.1.9 Add clean-consumer pack check (`publint`, `attw`, temp Vite install)
- [ ] 1.1.10 Add package `files`/`sideEffects`/`repository` metadata and README quickstart

**Verify**: `pnpm verify`

## Phase 2: Temporal core

> **Reasoning**: high — date/interval correctness is load-bearing for all views.

### Step 2.1: Spec tests first

**Reference**: 03-02, RD-02 · AR #1, #4
**Objective**: Encode ST-1–ST-15 before implementation.

- [ ] 2.1.1 [spec-author] Write `date.spec.test.ts` for ST-1–ST-10, ST-14
- [ ] 2.1.2 [spec-author] Write `period.spec.test.ts` for ST-11–ST-15
- [ ] 2.1.3 Run the spec tests and record the expected red failures

### Step 2.2: Implement

- [ ] 2.2.1 Implement `packages/core/src/diagnostics.ts`
- [ ] 2.2.2 Implement `packages/core/src/date.ts` (epoch-day math, ISO weeks)
- [ ] 2.2.3 Implement `packages/core/src/period.ts` and `interval.ts`
- [ ] 2.2.4 Run the spec tests to green
- [ ] 2.2.5 Write `date.impl.test.ts` and `interval.impl.test.ts` for boundaries/TZ

**Verify**: `pnpm test -- --project core`

## Phase 3: Classic layout

> **Reasoning**: high — 37-column geometry and dynamic months are the flagship view.

### Step 3.1: Spec tests first

**Reference**: 03-03, RD-03 · AR #1
**Objective**: Encode ST-16–ST-30 before implementation.

- [ ] 3.1.1 [spec-author] Write `classic-year.spec.test.ts` for ST-16–ST-30
- [ ] 3.1.2 Run the spec tests and record the expected red failures

### Step 3.2: Implement and verify

- [ ] 3.2.1 Implement `packages/core/src/layout/classic-year.ts`
- [ ] 3.2.2 Implement `dateToColumn`, `rowForDate`, `paginatePrintRows`
- [ ] 3.2.3 Run the spec tests to green
- [ ] 3.2.4 Write `classic-year.impl.test.ts` for 12/24/36-month boundaries and all month starts

**Verify**: `pnpm test -- --project core`

## Phase 4: Minimal React grid

> **Reasoning**: high — first real consumer; must prove geometry, themes and print.

### Step 4.1: Spec tests first

**Reference**: 03-04, RD-01/RD-03 · AR #2, #7
**Objective**: Encode ST-31–ST-36 before implementation.

- [ ] 4.1.1 [spec-author] Write `YearPlanner.spec.test.tsx` for ST-31–ST-32, ST-35–ST-36
- [ ] 4.1.2 Run the component tests and record the expected red failures

### Step 4.2: Implement

- [ ] 4.2.1 Implement `packages/react/src/YearPlanner.tsx` HTML grid
- [ ] 4.2.2 Implement `packages/react/src/styles.css` classic blue/yellow + print
- [ ] 4.2.3 Add `apps/demo` and `apps/storybook` minimal stories
- [ ] 4.2.4 Run component tests to green
- [ ] 4.2.5 Add Playwright visual/print test and generate A3 PDF
- [ ] 4.2.6 Run clean-consumer install/render test
- [ ] 4.2.7 Write React impl tests for blank slots, mirrored labels and theme fallback

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

1. ✅ All 40 tasks completed
2. ✅ `pnpm verify` and `pnpm verify:full` pass
3. ✅ Core/layout coverage ≥ 90%; React grid ≥ 80%
4. ✅ 2016/2017 14-row, 37-column grid verified
5. ✅ 12/14/18/24/36-month windows verified
6. ✅ A3 print PDF verified with `pdfinfo`/`pdftoppm`
7. ✅ Clean consumer install verified
8. ✅ Renderer spike/ADR recorded
9. ✅ No ribbons/interactions/commands claimed as complete
