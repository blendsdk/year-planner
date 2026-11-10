# Execution Plan: M3 React View

> **Document**: 99-execution-plan.md
> **Parent**: [Index](00-index.md)
> **Last Updated**: 2026-11-10 15:18
> **Progress**: 13/46 tasks (28%)
> **CodeOps Artifact Schema**: 1

## Overview

Delivers RD-06: contracts/theme, view shell, items and slots, state/commands,
inspector, print/adapters, then integration, docs and closeout. Specification
tests precede implementation in every behavior phase.

**🚨 Update this document after EACH completed task!**

---

## Implementation Phases

| Phase | Title | Tasks |
|---|---|---|
| 1 | Contracts and theme | 6 |
| 2 | View shell and state | 7 |
| 3 | Items, annotations and slots | 7 |
| 4 | Command pipeline | 6 |
| 5 | Inspector | 6 |
| 6 | Print and adapters | 6 |
| 7 | Integration, docs and closeout | 8 |

**Total: 46 tasks across 7 phases.**

> **⚠️ EXECUTION RULE:** the checkboxes below are the single source of truth.
> Mark `[~]` with an implemented timestamp, promote to `[x]` only after verify,
> and update this header after every task.

---

## Phase 1: Contracts and theme

> **Phase baseline tree**: recorded by the executor at phase start.
> **Reasoning**: high — public types and tokens become a published API.

**Reference**: [03-01](03-01-contracts-theme.md) · AR #2, #4, #5
**Objective**: Add canonical selection/command contracts, diagnostic codes, theme
tokens, presets, provider and the layered CSS foundation.

### Step 1.1: Specification tests

- [x] 1.1.1 [spec-author] Write contract/theme spec tests for ST-1–ST-4 — `packages/core/src/contracts.spec.test.ts`, `packages/react/src/theme.spec.test.tsx` ✅ (completed: 2026-11-10 15:08)
- [x] 1.1.2 Run the spec tests and record the expected red failures — `docs/m3-red-phase.md` ✅ (completed: 2026-11-10 15:08)

### Step 1.2: Implementation

- [x] 1.2.1 Add type-only selection/command contracts, runtime selection helpers and RD-06 diagnostic codes — `packages/core/src/contracts.ts`, `packages/core/src/model/selection.ts`, `packages/core/src/diagnostics.ts`, `packages/core/src/index.ts` ✅ (completed: 2026-11-10 15:08)
- [x] 1.2.2 Implement theme tokens, frozen presets, `createTheme`, `getPresetTheme`, provider and layered CSS; move the old preset-string type out of the grid — `packages/react/src/theme.ts`, `packages/react/src/provider.tsx`, `packages/react/src/styles.css`, `packages/react/src/YearPlanner.tsx`, `packages/react/src/index.ts` ✅ (completed: 2026-11-10 15:08)

### Step 1.3: Implementation tests and verify

- [x] 1.3.1 Write contract/theme edge-case tests — `packages/core/src/contracts.impl.test.ts`, `packages/react/src/theme.impl.test.tsx` ✅ (completed: 2026-11-10 15:08)
- [x] 1.3.2 Run `pnpm verify` and regenerate the API reports ✅ (completed: 2026-11-10 15:08)

**Deliverables**:
- [ ] ST-1–ST-4 pass
- [ ] Every token maps to `--yp-*`; presets change visuals only
- [ ] Core and React barrels export the new contracts/theme

**Verify**: `pnpm verify`

---

## Phase 2: View shell and state

> **Phase baseline tree**: recorded by the executor at phase start.
> **Reasoning**: high — geometry, SSR and controlled state are the product frame.

**Reference**: [03-02](03-02-view-shell.md), [03-04](03-04-state-commands.md) · AR #6, #7, #8, #10, #11, #12, #13, #24
**Objective**: Replace the M1 grid with the full props/handle, scroll/zoom
shell, localized labels, SSR-safe effects and controlled state hooks.

### Step 2.1: Specification tests

- [x] 2.1.1 [spec-author] Write shell/state spec tests for ST-5–ST-27 and ST-84, including node SSR and hydration — `packages/react/src/YearPlanner.spec.test.tsx`, `packages/react/src/YearPlanner.ssr.spec.test.tsx`, `packages/react/src/YearPlanner.hydration.spec.test.tsx` ✅ (completed: 2026-11-10 15:18)
- [x] 2.1.2 Run the spec tests and record the expected red failures — `docs/m3-red-phase.md` ✅ (completed: 2026-11-10 15:18)

### Step 2.2: Implementation

- [x] 2.2.1 Implement zoom geometry, pointer mapping, locale formatting and scroll/observer helpers — `packages/react/src/geometry.ts`, `packages/react/src/locale.ts` ✅ (completed: 2026-11-10 15:18)
- [x] 2.2.2 Implement the root, viewport, sticky grid, rows, handle and `"use client"` entry — `packages/react/src/YearPlanner.tsx`, `packages/react/src/render/YearGrid.tsx`, `packages/react/src/index.ts` ✅ (completed: 2026-11-10 15:18)
- [x] 2.2.3 Implement controlled/uncontrolled state and visibility/filter/selection hooks — `packages/react/src/state.ts` ✅ (completed: 2026-11-10 15:18)

### Step 2.3: Implementation tests and verify

- [x] 2.3.1 Write shell/state edge-case tests — `packages/react/src/YearPlanner.impl.test.tsx`, `packages/react/src/state.impl.test.tsx` ✅ (completed: 2026-11-10 15:18)
- [x] 2.3.2 Run `pnpm verify` ✅ (completed: 2026-11-10 15:18)

**Deliverables**:
- [ ] ST-5–ST-27 and ST-84 pass
- [ ] SSR render, hydration, invalid locale/zone and invalid option paths are safe
- [ ] Controlled state never mutates props

**Verify**: `pnpm verify`

---

## Phase 3: Items, annotations and slots

> **Phase baseline tree**: recorded by the executor at phase start.
> **Reasoning**: high — the visible value of the slice and the accessibility contract.

**Reference**: [03-03](03-03-items-slots.md) · AR #9, #14, #15, #16, #22, #25
**Objective**: Render fragments, proxies, annotations, channel backdrops,
overflow, tooltips, `getDateMeta` and all slots.

### Step 3.1: Specification tests

- [ ] 3.1.1 [spec-author] Write item/slot spec tests for ST-28–ST-47 — `packages/react/src/items.spec.test.tsx`
- [ ] 3.1.2 Run the spec tests and record the expected red failures — `docs/m3-red-phase.md`

### Step 3.2: Implementation

- [ ] 3.2.1 Implement the fragment/item layer, proxy and resize handles — `packages/react/src/render/ItemLayer.tsx`
- [ ] 3.2.2 Implement overflow, tooltip and focus behavior — `packages/react/src/render/Overflow.tsx`, `packages/react/src/render/Tooltip.tsx`
- [ ] 3.2.3 Implement cells, `getDateMeta` composition and render/structural slots — `packages/react/src/render/CellLayer.tsx`, `packages/react/src/render/slots.tsx`

### Step 3.3: Implementation tests and verify

- [ ] 3.3.1 Write item/slot edge-case tests — `packages/react/src/items.impl.test.tsx`
- [ ] 3.3.2 Run `pnpm verify`

**Deliverables**:
- [ ] ST-28–ST-47 pass
- [ ] Proxies contain no nested interactive controls; one roving tab stop per proxy group
- [ ] Hidden items never reach DOM, slots, tooltip or overflow

**Verify**: `pnpm verify`

---

## Phase 4: Command pipeline

> **Phase baseline tree**: recorded by the executor at phase start.
> **Reasoning**: high — data mutation and host trust boundary.

**Reference**: [03-04](03-04-state-commands.md) · AR #18, #19, #20, #25
**Objective**: Implement local checks, host validation/request, timeout,
uncontrolled apply, feedback hooks and undo/redo.

### Step 4.1: Specification tests

- [ ] 4.1.1 [spec-author] Write command spec tests for ST-48–ST-61 — `packages/react/src/commands.spec.test.tsx`
- [ ] 4.1.2 Run the spec tests and record the expected red failures — `docs/m3-red-phase.md`

### Step 4.2: Implementation

- [ ] 4.2.1 Implement local checks, command shapes and diagnostic mapping — `packages/react/src/commands.ts`
- [ ] 4.2.2 Implement host flow, timeout, uncontrolled apply, undo/redo and confirm — `packages/react/src/commands.ts`, `packages/react/src/state.ts`

### Step 4.3: Implementation tests and verify

- [ ] 4.3.1 Write command edge-case tests — `packages/react/src/commands.impl.test.tsx`
- [ ] 4.3.2 Run `pnpm verify`

**Deliverables**:
- [ ] ST-48–ST-61 pass
- [ ] Controlled props never mutate; paint apply deduplicates non-matching items
- [ ] Every failure path yields a typed diagnostic

**Verify**: `pnpm verify`

---

## Phase 5: Inspector

> **Phase baseline tree**: recorded by the executor at phase start.
> **Reasoning**: medium — presentation over the verified pipeline.

**Reference**: [03-05](03-05-inspector.md) · AR #17, #21, #22
**Objective**: Add the default inspector, selected/overflow details, actions,
feedback, retry/dismiss and keyboard behavior.

### Step 5.1: Specification tests

- [ ] 5.1.1 [spec-author] Write inspector spec tests for ST-62–ST-72 — `packages/react/src/inspector.spec.test.tsx`
- [ ] 5.1.2 Run the spec tests and record the expected red failures — `docs/m3-red-phase.md`

### Step 5.2: Implementation

- [ ] 5.2.1 Implement the inspector shell, selected-item details and actions — `packages/react/src/render/Inspector.tsx`
- [ ] 5.2.2 Implement overflow list, feedback, retry/dismiss and focus — `packages/react/src/render/Inspector.tsx`, `packages/react/src/YearPlanner.tsx`

### Step 5.3: Implementation tests and verify

- [ ] 5.3.1 Write inspector edge-case tests — `packages/react/src/inspector.impl.test.tsx`
- [ ] 5.3.2 Run `pnpm verify`

**Deliverables**:
- [ ] ST-62–ST-72 pass
- [ ] Inspector keyboard reachable and replaceable
- [ ] Actions use only `requestCommand`

**Verify**: `pnpm verify`

---

## Phase 6: Print and adapters

> **Phase baseline tree**: recorded by the executor at phase start.
> **Reasoning**: medium — deterministic from the M2 plan and pure mapping.

**Reference**: [03-06](03-06-print-integrations.md) · AR #23, #26
**Objective**: Render real A3 pages and add Fluent/MUI token adapters with
subpath exports.

### Step 6.1: Specification tests

- [ ] 6.1.1 [spec-author] Write print/adapter spec tests for ST-73–ST-79, ST-82 and ST-83 — `packages/react/src/print.spec.test.tsx`, `packages/react/src/adapters.spec.test.tsx`
- [ ] 6.1.2 Run the spec tests and record the expected red failures — `docs/m3-red-phase.md`

### Step 6.2: Implementation

- [ ] 6.2.1 Implement the hidden print tree, page scales and print CSS — `packages/react/src/render/PrintPages.tsx`, `packages/react/src/styles.css`
- [ ] 6.2.2 Implement Fluent/MUI adapters, subpath exports, optional peers and adapter size accounting — `packages/react/src/adapters/fluent.ts`, `packages/react/src/adapters/mui.ts`, `packages/react/package.json`, `packages/react/vite.config.ts`, `scripts/check-size.mjs`

### Step 6.3: Implementation tests and verify

- [ ] 6.3.1 Write print/adapter edge-case tests — `packages/react/src/print.impl.test.tsx`, `packages/react/src/adapters.impl.test.tsx`
- [ ] 6.3.2 Run `pnpm verify`

**Deliverables**:
- [ ] ST-73–ST-79, ST-82 and ST-83 pass
- [ ] 1/2/3 A3 pages for 14/24/36 months
- [ ] Adapter subpaths build and typecheck

**Verify**: `pnpm verify`

---

## Phase 7: Integration, docs and closeout

> **Phase baseline tree**: recorded by the executor at phase start.
> **Reasoning**: medium — proves composition, updates evidence and closes RD-06.

**Reference**: [00-index](00-index.md), [07-testing-strategy](07-testing-strategy.md) · AR #1, #26
**Objective**: Prove the full pipeline, update demo/Storybook/E2E/docs and run
the independent phase review.

### Step 7.1: Integration and closeout

- [ ] 7.1.1 Add the full validate → visibility → ribbons → render integration test — `packages/react/src/integration.spec.test.tsx`
- [ ] 7.1.2 Update the demo with items, inspector, overflow and 14/24/36-month print controls — `apps/demo/src/App.tsx`
- [ ] 7.1.3 Update the Storybook story with themes, items and inspector — `apps/storybook/stories/ClassicYear.stories.tsx`
- [ ] 7.1.4 Update E2E visuals/print, CSS scoping, CSP and 14/24/36 A3 PDF evidence — `tests/e2e/classic-year.spec.ts`
- [ ] 7.1.5 Add theming/CSP/React-view docs, the pre-1.0 migration note and update README/test report — `docs/react-view.md`, `docs/security.md`, `README.md`, `docs/test-report.md`, `.changeset/`
- [ ] 7.1.6 Update roadmap, plan status and API reports — `codeops/features/year-planner/00-roadmap.md`, `codeops/00-roadmap.md`, `packages/*/etc/*.api.md`
- [ ] 7.1.7 Run `pnpm verify:full` and record PDF evidence — `docs/test-report.md`
- [ ] 7.1.8 Run the independent phase review, record findings and clean temporary artifacts — `05-findings.md`

**Deliverables**:
- [ ] Full core/React pipeline test passes
- [ ] `pnpm verify:full` passes
- [ ] 1/2/3-page A3 PDFs proven; CSS scoping and CSP tests pass
- [ ] API reports/docs current
- [ ] No deferred RD-07/RD-08 behavior claimed

**Verify**: `pnpm verify:full`

---

## Dependencies

```text
Phase 1
    ↓
Phase 2
    ↓
Phase 3
    ↓
Phase 4
    ↓
Phase 5
    ↓
Phase 6
    ↓
Phase 7
```

---

## Success Criteria

1. ✅ All 46 tasks completed
2. ✅ `pnpm verify` and `pnpm verify:full` pass
3. ✅ React coverage ≥ 80%; core coverage ≥ 95%
4. ✅ API reports and adapter subpaths committed
5. ✅ 14/24/36-month A3 PDFs prove 1/2/3 pages
6. ✅ RD-06 AC1–AC18 covered; AC3 is partial per AR-27 (not fully claimed)
7. ✅ Roadmap and test report reflect the real state
