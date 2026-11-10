# Execution Plan: RD-07 Interaction Engine

> **Document**: 99-execution-plan.md
> **Parent**: [Index](00-index.md)
> **Last Updated**: 2026-11-10 20:04
> **Progress**: 6/33 tasks (18%)
> **CodeOps Artifact Schema**: 1

## Overview

Delivers RD-07 in five phases: selection policy, gesture engine, pointer
wiring/commands/previews, keyboard/focus/touch/undo, then integration,
Storybook, E2E, docs and closeout. Specification tests precede implementation in
every behavior phase, and each phase's ST cases are implemented by that phase.

**🚨 Update this document after EACH completed task!**

---

## Implementation Phases

| Phase | Title | Tasks |
|---|---|---|
| 1 | Selection policy and item focus | 6 |
| 2 | Gesture engine, coordinates and marquee | 6 |
| 3 | Pointer wiring, commands and previews | 8 |
| 4 | Keyboard, focus, touch and undo | 6 |
| 5 | Integration, Storybook, E2E and closeout | 7 |

**Total: 33 tasks across 5 phases** (no fabricated hour estimates — scope is
bounded by the task-size criteria).

> **⚠️ EXECUTION RULE — APPLIES TO EVERY AGENT EXECUTING THIS PLAN:**
>
> 1. **On implementation:** mark the task `[~]` with a timestamp —
>    `- [~] 1.1.1 Task description ⏳ (implemented: YYYY-MM-DD HH:MM)`
> 2. **On verify pass:** promote it to `[x]` —
>    `- [x] 1.1.1 Task description ✅ (completed: YYYY-MM-DD HH:MM)`
> 3. **Update the Progress header** and Last Updated stamp after EVERY task —
>    never batch updates. Only `[x]` counts as complete.
> 4. **Resume** by scanning top-to-bottom: first `[~]`, else first `[ ]`.
> 5. **On blocker:** mark `[!]` and append `Blocked: <short reason>`.
>
> Timestamps come from `date '+%Y-%m-%d %H:%M'` — never invented.

---

## Phase 1: Selection policy and item focus

> **Phase baseline tree**: 19e0f23e7c6d365c34c10f735fbff045f51ffea1
> **Reasoning**: high — the modifier matrix and the additive public field are
> hard to reverse once tests and docs depend on them.

**Reference**: [03-01](03-01-selection-policy.md) · AR-3, AR-4, AR-5, AR-6, AR-7, AR-25
**Objective**: one pure selection algebra for clicks, drags, marquee and keys.

### Step 1.1: Specification tests

- [x] 1.1.1 [spec-author] Write selection spec tests for ST-1–ST-22 — `packages/react/src/interaction/selection.spec.test.tsx` ✅ (completed: 2026-11-10 20:04)
- [x] 1.1.2 Run the selection spec tests and record the expected red failures — `docs/m4-red-phase.md` ✅ (completed: 2026-11-10 20:04)

### Step 1.2: Implementation

- [x] 1.2.1 Add optional `focusItemId` to `PlannerSelection`; the core barrel already re-exports contracts, so no index edit is needed — `packages/core/src/contracts.ts` ✅ (completed: 2026-11-10 20:04)
- [x] 1.2.2 Implement range normalization, add/remove/toggle, click/drag/item/marquee policy, visual order, no-anchor fallbacks, disabled-date splitting and Ctrl/Cmd+Shift guards — `packages/react/src/interaction/selection.ts` ✅ (completed: 2026-11-10 20:04)

### Step 1.3: Implementation tests and verify

- [x] 1.3.1 Write edge-case tests for adjacent merge, empty input, tie-breaks, anchor clearing and mod+shift drags — `packages/react/src/interaction/selection.impl.test.tsx` ✅ (completed: 2026-11-10 20:04)
- [x] 1.3.2 Run `pnpm api-report` then `pnpm verify` so the core report includes `focusItemId` before the API gate runs ✅ (completed: 2026-11-10 20:04)

**Deliverables**:
- [x] ST-1–ST-22 pass ✅ (completed: 2026-11-10 20:04)
- [x] `focusItemId` is optional and additive in the core API report; the React report imports `PlannerSelection` ✅ (completed: 2026-11-10 20:04)
- [x] No React/DOM import in the selection policy ✅ (completed: 2026-11-10 20:04)

**Verify**: `pnpm verify:full`

---
## Phase 2: Gesture engine, coordinates and marquee

> **Phase baseline tree**: recorded by the executor at phase start.
> **Reasoning**: high — the FSM, coordinate mapping and cancellation matrix are
> the highest-risk correctness surface.

**Reference**: [03-02](03-02-gesture-engine.md) · AR-8–AR-15, AR-21, AR-25, AR-32, AR-33
**Objective**: a pure, testable gesture state machine and hit geometry.

### Step 2.1: Specification tests

- [ ] 2.1.1 [spec-author] Write gesture/geometry spec tests for ST-23–ST-41 — `packages/react/src/interaction/gesture.spec.test.tsx`
- [ ] 2.1.2 Run the gesture spec tests and record the expected red failures — `docs/m4-red-phase.md`

### Step 2.2: Implementation

- [ ] 2.2.1 Implement the FSM, activation matrix, threshold, move/resize math, marquee intersection, design rect conversion, auto-scroll delta and signature-based cancellation — `packages/react/src/interaction/gesture.ts`
- [ ] 2.2.2 Implement target classification, editability callback support, design-unit mapping and ribbon-row-height date mapping — `packages/react/src/interaction/pointer.ts`, `packages/react/src/geometry.ts`

### Step 2.3: Implementation tests and verify

- [ ] 2.3.1 Write gesture edge tests for threshold boundaries, tie-breaks, blank slots, expanded rows and cancellation signatures — `packages/react/src/interaction/gesture.impl.test.tsx`
- [ ] 2.3.2 Run `pnpm verify`

**Deliverables**:
- [ ] ST-23–ST-41 pass
- [ ] FSM and geometry modules import no React or DOM
- [ ] Expanded/lane-grown rows map to the correct date; no phantom dates

**Verify**: `pnpm verify:full`

---

## Phase 3: Pointer wiring, commands and previews

> **Phase baseline tree**: recorded by the executor at phase start.
> **Reasoning**: high — DOM capture, click ownership and command emission cross
> the boundary between UI events and persistent data.

**Reference**: [03-03](03-03-commands-previews-focus.md), [03-04](03-04-integration-docs.md) · AR-9–AR-17, AR-27, AR-33, AR-35
**Objective**: wire pointer gestures to selection/commands and render previews.

### Step 3.1: Specification tests

- [ ] 3.1.1 [spec-author] Write pointer/command/preview spec tests for ST-42–ST-70 — `packages/react/src/interaction/pointer.spec.test.tsx`
- [ ] 3.1.2 Run the pointer spec tests and record the expected red failures — `docs/m4-red-phase.md`

### Step 3.2: Implementation

- [ ] 3.2.1 Implement preview projection, persistent selection overlays, transient previews, fixed marquee and `pointer-events: none` layering — `packages/react/src/interaction/preview.ts`, `packages/react/src/render/SelectionPreview.tsx`, `packages/react/src/render/Marquee.tsx`
- [ ] 3.2.2 Extract shared paint/create builders with `createPlannerId`, paint defaults and locked-item exclusion; switch the inspector to them — `packages/react/src/interaction/builders.ts`, `packages/react/src/render/Inspector.tsx`
- [ ] 3.2.3 Implement the pointer hook (capture, lost capture, rAF, one-shot click suppression, host-control guard) and wire pointers/previews through the grid, row and main component — `packages/react/src/interaction/useInteraction.ts`, `packages/react/src/render/YearGrid.tsx`, `packages/react/src/render/MonthRow.tsx`, `packages/react/src/YearPlanner.tsx`
- [ ] 3.2.4 Wire cell and item/handle pointer targets and modifier-aware click callbacks — `packages/react/src/render/CellLayer.tsx`, `packages/react/src/render/ItemLayer.tsx`

### Step 3.3: Implementation tests and verify

- [ ] 3.3.1 Write pointer edge tests for capture fallback, lost capture, click suppression, host controls, rAF coalescing and preview cleanup — `packages/react/src/interaction/pointer.impl.test.tsx`
- [ ] 3.3.2 Run `pnpm verify`

**Deliverables**:
- [ ] ST-42–ST-70 pass
- [ ] Cross-month selection renders exactly two transient previews and persistent selection survives pointerup
- [ ] No canonical item mutation during a drag; a host button/input keeps its events

**Verify**: `pnpm verify:full`

---

## Phase 4: Keyboard, focus, touch and undo

> **Phase baseline tree**: recorded by the executor at phase start.
> **Reasoning**: high — focus restoration, disabled dates and read-only safety
> are user-visible correctness and accessibility contracts.

**Reference**: [03-03](03-03-commands-previews-focus.md) · AR-18–AR-26, AR-34
**Objective**: complete the keyboard matrix, focus lifecycle, touch policy and
undo/redo evidence.

### Step 4.1: Specification tests

- [ ] 4.1.1 [spec-author] Write keyboard/focus/touch/undo spec tests for ST-71–ST-90 — `packages/react/src/interaction/keyboard.spec.test.tsx`
- [ ] 4.1.2 Run the keyboard spec tests and record the expected red failures — `docs/m4-red-phase.md`

### Step 4.2: Implementation

- [ ] 4.2.1 Implement modifier-aware cell/proxy keys, grid-root Ctrl/Cmd+A/Escape/Delete ownership, host-control key guards, double-click focus semantics and refresh the stale touch/marquee comments — `packages/react/src/render/CellLayer.tsx`, `packages/react/src/render/ItemLayer.tsx`, `packages/react/src/render/YearGrid.tsx`, `packages/react/src/types.ts`
- [ ] 4.2.2 Implement focus restoration/pruning, selection sync, polite live-region fallback, touch gating and `touch-action`; update the stale interaction comments — `packages/react/src/YearPlanner.tsx`, `packages/react/src/interaction/useInteraction.ts`, `packages/react/src/render/YearGrid.tsx`, `packages/react/src/styles.css`, `packages/react/src/commands.ts`

### Step 4.3: Implementation tests and verify

- [ ] 4.3.1 Write keyboard/focus edge tests and controlled/uncontrolled composition tests — `packages/react/src/interaction/keyboard.impl.test.tsx`, `packages/react/src/interaction.integration.spec.test.tsx`
- [ ] 4.3.2 Run `pnpm api-report` then `pnpm verify` so the React report includes `doubleClick`

**Deliverables**:
- [ ] ST-71–ST-90 pass
- [ ] Focus never falls to the document after commit/hide/repack; fallback is announced
- [ ] Undo/redo covered for every command type; controlled mode has no local history

**Verify**: `pnpm verify:full`

---

## Phase 5: Integration, Storybook, E2E and closeout

> **Phase baseline tree**: recorded by the executor at phase start.
> **Reasoning**: medium — integration and evidence, with no new core algorithm.

**Reference**: [03-04](03-04-integration-docs.md) · AR-28, AR-30, AR-31, AR-35, AR-36
**Objective**: prove the behavior in a real browser, document it and close the
milestone.

### Step 5.1: Integration tests

- [ ] 5.1.1 Add the interaction demo, Storybook interaction stories, Playwright interaction tests and the Chromium touch project — `apps/demo/src/InteractionDemo.tsx`, `apps/demo/src/App.tsx`, `apps/storybook/stories/Interaction.stories.tsx`, `tests/e2e/interaction.spec.ts`, `playwright.config.ts`
- [ ] 5.1.2 Run the interaction E2E tests and record any red/gap findings — `docs/m4-red-phase.md`

### Step 5.2: Integration fixes

- [ ] 5.2.1 Fix demo selectors/copy, preview/focus/touch gaps, host-control cases and intentional visual changes — `apps/demo/src/**`, `packages/react/src/**`, `tests/e2e/interaction.spec.ts`
- [ ] 5.2.2 Run the interaction E2E suite green in Chromium, Firefox, WebKit and the touch project

### Step 5.3: Documentation and closeout

- [ ] 5.3.1 Write the interaction guide and update README/react-view/security/test-report — `docs/interaction.md`, `docs/react-view.md`, `docs/security.md`, `docs/test-report.md`, `README.md`
- [ ] 5.3.2 Add the changeset and regenerate API reports — `.changeset/rd07-interaction.md`, `packages/core/etc/year-planner-core.api.md`, `packages/react/etc/react-year-planner.api.md`
- [ ] 5.3.3 Run `pnpm verify:full`, watch CI, update the roadmap and close the plan

**Deliverables**:
- [ ] ST-91–ST-98 pass
- [ ] Storybook static build includes interaction stories
- [ ] CI `verify` + `browsers` green
- [ ] Roadmap RD-07 Done and plan 33/33

**Verify**: `pnpm verify:full`

---

## Dependencies

```text
Phase 1 Selection policy
    ↓
Phase 2 Gesture engine
    ↓
Phase 3 Pointer wiring and previews
    ↓
Phase 4 Keyboard, focus, touch and undo
    ↓
Phase 5 Integration, stories, docs and closeout
```

---

## Success Criteria

**Feature is complete when:**

1. ✅ All phases completed and every ST case passes
2. ✅ `pnpm verify:full` passes
3. ✅ No warnings/errors; no dead code or unused parameters
4. ✅ Security: hidden/locked items not hit-testable; no phantom dates; typed commands only
5. ✅ Documentation and Storybook updated; API reports current
6. ✅ RD-06 tests and behavior remain green
7. ✅ CI `verify` and `browsers` jobs green
8. ✅ Roadmap and plan progress reconciled
