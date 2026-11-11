# Execution Plan: Accessibility and Keyboard Experience

> **Document**: 99-execution-plan.md
> **Parent**: [Index](00-index.md)
> **Last Updated**: 2026-11-11 13:55
> **Progress**: 55/55 tasks (100%)
> **CodeOps Artifact Schema**: 1

## Overview

Implement RD-09 in seven phases: semantics, item list, focus, announcements, visual accessibility,
automated evidence and closure. Every feature phase follows the specification-first order: write
spec tests, prove red, implement, prove green, add implementation tests, verify.

**🚨 Update this document after EACH completed task!**

---

## Implementation Phases

| Phase | Title | Tasks |
| ----- | ----- | ----- |
| 1 | Semantics and accessible names | 9 |
| 2 | Item list and inspector | 7 |
| 3 | Focus and keyboard | 9 |
| 4 | Announcements and status | 9 |
| 5 | Visual accessibility | 9 |
| 6 | Automated evidence, stories and docs | 7 |
| 7 | Closure and review | 5 |

**Total: 55 tasks across 7 phases** (task count confirmed during execution; the header tracks the
authoritative checkbox total)

> **⚠️ EXECUTION RULE — APPLIES TO EVERY AGENT EXECUTING THIS PLAN:**
>
> The task checkboxes in the phase sections below are the **single source of truth** for progress.
> Every task line appears exactly once. On implementation mark `[~]` with a timestamp; on verify
> pass promote to `[x]`; update the Progress header after every task. On a blocker mark `[!]` and
> append `Blocked: <reason>`.

---

## Phase 1: Semantics and accessible names

> **Phase baseline tree**: recorded at phase start by the exec-plan skill.
> **Reasoning**: high — ARIA names and selected state affect every assistive-technology path.

### Step 1.1: Labels, roles and selected state

**Reference**: [03-01](03-01-semantics.md) · AR-2, AR-3, AR-15
**Objective**: Add `a11y.ts`, compose cell and proxy names, expose `aria-selected`, label the root
region and add the generated keyboard-help description.

- [x] 1.1.1 [spec-author] Write spec tests for ST-1..ST-7, ST-9 and ST-10 — `packages/react/src/a11y.spec.test.tsx`, `packages/react/src/accessibility.spec.test.tsx` ✅ (completed: 2026-11-11 11:08)
- [x] 1.1.2 Run the new tests and record the red result — `pnpm --filter @blendsdk/react-year-planner test` ✅ (completed: 2026-11-11 11:08)
- [x] 1.1.3 Implement `dateCellAccessibleName`, `itemAccessibleName` and `selectedDateSet` — `packages/react/src/a11y.ts` ✅ (completed: 2026-11-11 11:08)
- [x] 1.1.4 Wire cell names, `aria-selected`, selected-date set and hidden visual spans — `packages/react/src/render/CellLayer.tsx`, `MonthRow.tsx`, `YearGrid.tsx` ✅ (completed: 2026-11-11 11:08)
- [x] 1.1.5 Wire rich proxy names, clipping state and annotation labels — `packages/react/src/render/ItemLayer.tsx` ✅ (completed: 2026-11-11 11:08)
- [x] 1.1.6 Add the root region (success and empty states), generated help text and combined `aria-describedby` — `packages/react/src/YearPlanner.tsx` ✅ (completed: 2026-11-11 11:08)
- [x] 1.1.7 Prove green for ST-1..ST-7, ST-9 and ST-10 ✅ (completed: 2026-11-11 11:08)
- [x] 1.1.8 Write implementation tests for multi-fragment names, timed items, context months and injection-safe text — `packages/react/src/a11y.impl.test.ts`, `packages/react/src/accessibility.impl.test.tsx` ✅ (completed: 2026-11-11 11:08)
- [x] 1.1.9 Verify the phase — `pnpm --filter @blendsdk/react-year-planner typecheck && pnpm --filter @blendsdk/react-year-planner test` ✅ (completed: 2026-11-11 11:08)

**Deliverables**:
- [x] `a11y.ts` with documented public helpers
- [x] Selected state and complete names in the rendered grid
- [x] Root region and keyboard help
- [x] All phase verification passing

**Verify**: `pnpm verify`

---

## Phase 2: Item list and inspector

> **Phase baseline tree**: recorded at phase start by the exec-plan skill.
> **Reasoning**: high — the item list is the parallel keyboard path and must survive host slots.

### Step 2.1: Planner-owned item list

**Reference**: [03-04](03-04-item-list-inspector.md) · AR-1, AR-13
**Objective**: Add the always-rendered item list, hidden filtering, overflow markers and focus
plumbing.

- [x] 2.1.1 [spec-author] Write spec tests for ST-30..ST-35 — `packages/react/src/accessibility.spec.test.tsx` ✅ (completed: 2026-11-11 11:10)
- [x] 2.1.2 Prove red for ST-30..ST-35 ✅ (completed: 2026-11-11 11:10)
- [x] 2.1.3 Implement `ItemList` with sorting, filtering, names, overflow markers and empty state — `packages/react/src/render/ItemList.tsx` ✅ (completed: 2026-11-11 11:10)
- [x] 2.1.4 Integrate the list into the inspector shell and add `itemListId`/`itemListRef` — `packages/react/src/render/Inspector.tsx`, `packages/react/src/YearPlanner.tsx` ✅ (completed: 2026-11-11 11:10)
- [x] 2.1.5 Prove green for ST-30..ST-35 ✅ (completed: 2026-11-11 11:10)
- [x] 2.1.6 Write implementation tests for custom inspector bodies, empty lists and hidden selections — `packages/react/src/accessibility.impl.test.tsx` ✅ (completed: 2026-11-11 11:10)
- [x] 2.1.7 Verify the phase — `pnpm --filter @blendsdk/react-year-planner typecheck && pnpm --filter @blendsdk/react-year-planner test` ✅ (completed: 2026-11-11 11:10)

**Deliverables**:
- [x] `ItemList.tsx` with JSDoc for every exported symbol
- [x] Inspector renders the list even with `renderInspector`
- [x] Hidden items absent from list and overflow
- [x] All phase verification passing

**Verify**: `pnpm verify`

---

## Phase 3: Focus and keyboard

> **Phase baseline tree**: recorded at phase start by the exec-plan skill.
> **Reasoning**: high — roving focus and fallback decide whether keyboard users can operate the grid.

### Step 3.1: One tab stop per composite

**Reference**: [03-02](03-02-focus-keyboard.md) · AR-9, AR-10, AR-14
**Objective**: Resolve the active date, add Home/End, rove the overflow buttons and implement the
skip link.

- [x] 3.1.1 [spec-author] Write spec tests for ST-11..ST-20 — `packages/react/src/interaction/row.spec.test.ts`, `packages/react/src/accessibility.spec.test.tsx` ✅ (completed: 2026-11-11 11:12)
- [x] 3.1.2 Prove red for ST-11..ST-20 ✅ (completed: 2026-11-11 11:12)
- [x] 3.1.3 Implement `rowForDate` and `rowEdgeDate` — `packages/react/src/interaction/row.ts` ✅ (completed: 2026-11-11 11:12)
- [x] 3.1.4 Resolve `effectiveActiveDate` through `nearestEnabledDate` and add Home/End — `packages/react/src/YearPlanner.tsx`, `packages/react/src/interaction/useInteraction.ts` ✅ (completed: 2026-11-11 11:12)
- [x] 3.1.5 Rove the overflow tab stop and focus the first entry on open — `packages/react/src/render/MonthRow.tsx`, `Overflow.tsx` ✅ (completed: 2026-11-11 11:12)
- [x] 3.1.6 Add the skip link and the one-shot item-list focus path — `packages/react/src/YearPlanner.tsx` ✅ (completed: 2026-11-11 11:12)
- [x] 3.1.7 Prove green for ST-11..ST-20 ✅ (completed: 2026-11-11 11:12)
- [x] 3.1.8 Write implementation tests for disabled row edges, missing rows and the inspector-action focus policy — `packages/react/src/interaction/row.impl.test.ts`, `packages/react/src/accessibility.impl.test.tsx` ✅ (completed: 2026-11-11 11:12)
- [x] 3.1.9 Verify the phase — `pnpm --filter @blendsdk/react-year-planner typecheck && pnpm --filter @blendsdk/react-year-planner test` ✅ (completed: 2026-11-11 11:12)

**Deliverables**:
- [x] Exactly one cell, proxy and overflow button in the tab order
- [x] Home/End and skip link working
- [x] Focus fallback announced
- [x] All phase verification passing

**Verify**: `pnpm verify`

---

## Phase 4: Announcements and status

> **Phase baseline tree**: recorded at phase start by the exec-plan skill.
> **Reasoning**: high — live regions must announce once and stay visible without double speech.

### Step 4.1: Visible status and split live regions

**Reference**: [03-03](03-03-announcements-status.md) · AR-7, AR-8, AR-13
**Objective**: Add the status mapping, visible bar, polite/assertive announcers, selection and
visibility announcements, and proxy error association.

- [x] 4.1.1 [spec-author] Write spec tests for ST-21..ST-29 — `packages/react/src/announcements.spec.test.ts`, `packages/react/src/accessibility.spec.test.tsx` ✅ (completed: 2026-11-11 11:15)
- [x] 4.1.2 Prove red for ST-21..ST-29 ✅ (completed: 2026-11-11 11:15)
- [x] 4.1.3 Implement `commandStatusView` and the outcome mapping — `packages/react/src/announcements.ts` ✅ (completed: 2026-11-11 11:15)
- [x] 4.1.4 Implement the visible status bar component — `packages/react/src/render/StatusBar.tsx` ✅ (completed: 2026-11-11 11:15)
- [x] 4.1.5 Implement pending/settlement/selection/visibility announcements and the error-dismiss rule — `packages/react/src/useAnnouncements.ts` ✅ (completed: 2026-11-11 11:15)
- [x] 4.1.6 Render the status bar and hidden live regions; pass the feedback id through the grid to the proxy — `packages/react/src/YearPlanner.tsx`, `YearGrid.tsx`, `MonthRow.tsx`, `ItemLayer.tsx`, `Inspector.tsx` ✅ (completed: 2026-11-11 11:15)
- [x] 4.1.7 Prove green for ST-21..ST-29 ✅ (completed: 2026-11-11 11:15)
- [x] 4.1.8 Write implementation tests for unknown codes, empty diagnostics and repeated settlements — `packages/react/src/announcements.impl.test.ts` ✅ (completed: 2026-11-11 11:15)
- [x] 4.1.9 Verify the phase — `pnpm --filter @blendsdk/react-year-planner typecheck && pnpm --filter @blendsdk/react-year-planner test` ✅ (completed: 2026-11-11 11:15)

**Deliverables**:
- [x] Visible pending/accepted/rejected/timeout/stale/aborted/not-applied text
- [x] One announcement per transition/settlement
- [x] Error association on the affected proxy
- [x] All phase verification passing

**Verify**: `pnpm verify`

---

## Phase 5: Visual accessibility

> **Phase baseline tree**: recorded at phase start by the exec-plan skill.
> **Reasoning**: high — contrast and target-size changes affect every theme and visual snapshot.

### Step 5.1: Contrast, cues and target size

**Reference**: [03-05](03-05-visual-accessibility.md) · AR-4, AR-5, AR-6, AR-11
**Objective**: Compute ribbon text, adjust theme defaults, add non-colour cues and media queries,
and update visual evidence.

- [x] 5.1.1 [spec-author] Write spec tests for ST-36..ST-43 — `packages/react/src/a11y.spec.test.ts`, `packages/react/src/styles.spec.test.tsx`, `packages/react/src/theme.spec.test.tsx` ✅ (completed: 2026-11-11 11:30)
- [x] 5.1.2 Prove red for ST-36..ST-43 ✅ (completed: 2026-11-11 11:30)
- [x] 5.1.3 Implement luminance and readable-text selection; set `--yp-ribbon-text` — `packages/react/src/theme.ts`, `packages/react/src/YearPlanner.tsx` ✅ (completed: 2026-11-11 11:30)
- [x] 5.1.4 Set lane height 24 (theme, CSS default, options fallback, empty ribbons) and modern border `#7b8a99`; record the RD-09 supersession in the theme test — `packages/react/src/theme.ts`, `packages/react/src/options.ts`, `packages/react/src/styles.css`, `packages/react/src/theme.spec.test.tsx`, `packages/react/src/theme.impl.test.tsx` ✅ (completed: 2026-11-11 11:30)
- [x] 5.1.5 Add ribbon/header colours, the proxy focus halo, selected/holiday cues, 24 px targets, forced colours, reduced motion and print rules — `packages/react/src/styles.css` ✅ (completed: 2026-11-11 11:30)
- [x] 5.1.6 Prove green for ST-36..ST-43 ✅ (completed: 2026-11-11 11:30)
- [x] 5.1.7 Update and inspect the visual snapshots — `pnpm exec playwright test tests/e2e/classic-year.spec.ts --update-snapshots` ✅ (completed: 2026-11-11 11:30)
- [x] 5.1.8 Write implementation tests for non-hex colours and host overrides — `packages/react/src/a11y.impl.test.ts`, `packages/react/src/theme.impl.test.tsx` ✅ (completed: 2026-11-11 11:30)
- [x] 5.1.9 Verify the phase — `pnpm verify` ✅ (completed: 2026-11-11 11:30)

**Deliverables**:
- [x] Contrast-safe ribbon and border colours in all presets
- [x] 24 px targets and non-colour cues
- [x] Forced colours, reduced motion and print rules
- [x] Updated visual snapshots
- [x] All phase verification passing

**Verify**: `pnpm verify`

---

## Phase 6: Automated evidence, stories and docs

> **Phase baseline tree**: recorded at phase start by the exec-plan skill.
> **Reasoning**: medium — verification and documentation; no new product surface.

### Step 6.1: Browser evidence and Storybook

**Reference**: [07-testing-strategy](07-testing-strategy.md) · AR-12, AR-16
**Objective**: Add the axe matrix, keyboard E2E flows, accessibility stories and documentation.

- [x] 6.1.1 Add the axe helper and the compact, expanded, blue, yellow, high-contrast, overflow, error, AC3 and 36-month scan matrix — `tests/e2e/accessibility.spec.ts` ✅ (completed: 2026-11-11 12:05)
- [x] 6.1.2 Add keyboard-only, skip-link, hidden-item and nested-interactive browser tests; add the demo density control and hide/show controls; move item proxies to the grid-sibling overlay required by axe — `tests/e2e/accessibility.spec.ts`, `apps/demo/src/App.tsx`, `apps/demo/src/InteractionDemo.tsx`, `packages/react/src/render/ItemOverlay.tsx` ✅ (completed: 2026-11-11 12:05)
- [x] 6.1.3 Run the browser evidence and fix any serious/critical findings — `pnpm exec playwright test tests/e2e/accessibility.spec.ts` ✅ (completed: 2026-11-11 12:05)
- [x] 6.1.4 Add at least 14 stories: blue, yellow, high contrast, selected item, date range, holiday/disabled, overflow, hidden item, item list, 36 months, expanded density, skip-link focus, accepted status and rejected status — `apps/storybook/stories/Accessibility.stories.tsx` ✅ (completed: 2026-11-11 12:05)
- [x] 6.1.5 Record the keyboard map, evidence status and manual NVDA/VoiceOver protocol — `docs/accessibility.md`, `README.md`, `docs/test-report.md` ✅ (completed: 2026-11-11 12:05)
- [x] 6.1.6 Record the Orca smoke-check result where the host supports it — `docs/test-report.md` ✅ (completed: 2026-11-11 12:05)
- [x] 6.1.7 Verify the phase — `pnpm storybook:build && pnpm exec playwright test tests/e2e/accessibility.spec.ts` ✅ (completed: 2026-11-11 12:05)

**Deliverables**:
- [x] axe matrix green in Chromium
- [x] Keyboard evidence green
- [x] Accessibility stories built
- [x] Documentation and manual protocol recorded

**Verify**: `pnpm storybook:build && pnpm exec playwright test tests/e2e/accessibility.spec.ts`

---

## Phase 7: Closure and review

> **Phase baseline tree**: recorded at phase start by the exec-plan skill.
> **Reasoning**: medium — final gate and plan bookkeeping.

### Step 7.1: Full gate and closure

**Reference**: [01-requirements](01-requirements.md) · AR-12
**Objective**: Run the full gate, update counts, close the plan and record the review verdict.

- [x] 7.1.1 Run `pnpm verify:full` and record the exact counts ✅ (completed: 2026-11-11 13:55)
- [x] 7.1.2 Update `docs/test-report.md` and the roadmap progress ✅ (completed: 2026-11-11 13:55)
- [x] 7.1.3 Run the post-phase quality review and close findings ✅ (completed: 2026-11-11 13:55)
- [x] 7.1.4 Mark the execution plan complete and record the manual-evidence gap ✅ (completed: 2026-11-11 13:55)
- [x] 7.1.5 Re-run the changed verification after any review fix ✅ (completed: 2026-11-11 13:55)

**Deliverables**:
- [x] Full verification evidence
- [x] Review verdict PASS or findings closed
- [x] Plan and roadmap updated
- [x] Manual AT evidence gap recorded

**Verify**: `pnpm verify:full`

---

## Dependencies

```
Phase 1 (semantics)
    ↓
Phase 2 (item list)
    ↓
Phase 3 (focus, skip link)
    ↓
Phase 4 (announcements, status)
    ↓
Phase 5 (visual)
    ↓
Phase 6 (evidence, stories, docs)
    ↓
Phase 7 (closure)
```

---

## Success Criteria

1. ✅ All phases completed
2. ✅ All verification passing (`pnpm verify:full`)
3. ✅ No warnings or errors
4. ✅ No dead code
5. ✅ Security: hidden data absent from ARIA, labels escaped, no HTML injection
6. ✅ Documentation updated
7. ✅ Code reviewed
8. ✅ Post-completion project re-analysis handled by the exec-plan skill
