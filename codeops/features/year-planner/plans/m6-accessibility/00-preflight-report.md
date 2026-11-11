# Preflight Report: Accessibility and Keyboard Experience Plan

> **Status**: ✅ PREFLIGHT PASSED WITH NOTES — 14 findings resolved, 2 observations accepted
> **Iteration**: 2 (re-scan after plan fixes)
> **Artifact**: Implementation plan at `codeops/features/year-planner/plans/m6-accessibility/`
> **Codebase Grounded**: 19 source files, 9 test files, 5 config/docs files examined; 44 references verified
> **Last Updated**: 2026-11-11 11:42
> **Same-session review**: ⚠️ The plan and this review were produced in the same session. Findings were checked directly against the current source; a fresh-session audit is still advisable before release.

## Codebase Context Summary

**Tech Stack:** TypeScript 6, React 19, Vite 7, Vitest 3, Playwright 1.65, Storybook 10, pnpm 12, Biome 2.6, axe-core 4.14 (root devDependency).

**Architecture:** A pure core package (`packages/core`) owns dates, intervals, layout and ribbon geometry. The React package renders the layout with function components and CSS layers: `YearPlanner` owns state/commands, `YearGrid` owns ARIA grid semantics, `MonthRow` composes cells/items/overflow, `Inspector` renders details and feedback. Interaction is a hook (`useInteraction`) over a pure gesture/selection core.

**Key Files Examined:** `packages/react/src/YearPlanner.tsx`, `YearGrid.tsx`, `MonthRow.tsx`, `CellLayer.tsx`, `ItemLayer.tsx`, `Inspector.tsx`, `Overflow.tsx`, `useInteraction.ts`, `theme.ts`, `styles.css`, `types.ts`, `state.ts`, `options.ts`, `packages/core/src/contracts.ts`, `ribbon/types.ts`, `tests/e2e/classic-year.spec.ts`, `commands.spec.ts`, `apps/demo/src/App.tsx`, `InteractionDemo.tsx`, `CommandsDemo.tsx`, `package.json`, `playwright.config.ts`.

**Key Observations:**
- `YearPlanner.tsx` is already 816 lines; adding announcement/status logic inline would cross the split threshold materially.
- The proxy focus ring is drawn inside the ribbon fragment (`styles.css:318-321`), where `#0b6bcb` on `#76bfe5` is only 2.60:1.
- `axe-core` is already installed; no new dependency is needed for the scan.
- The baseline axe scan reproduces exactly two serious rule families: `color-contrast` (130 nodes) and `label-content-name-mismatch` (73 nodes).
- `docs/index.md` does not exist; the plan referenced it.
- `styles.spec.test.tsx` exists, not `styles.spec.test.ts`.

## Summary by Dimension

| # | Dimension | Findings | Highest Severity |
|---|-----------|----------|-----------------|
| 1 | Ambiguities | 1 | 🟡 MINOR |
| 2 | Implicit Assumptions | 1 | 🟠 MAJOR |
| 3 | Logical Contradictions | 1 | 🟡 MINOR |
| 4 | Completeness Gaps | 3 | 🟠 MAJOR |
| 5 | Dependency Issues | 0 | — |
| 6 | Feasibility Concerns | 1 | 🟠 MAJOR |
| 7 | Testability | 2 | 🟡 MINOR |
| 8 | Security Blind Spots | 0 | — |
| 9 | Edge Cases | 2 | 🟡 MINOR |
| 10 | Scope Creep Indicators | 0 | — |
| 11 | Ordering & Sequencing | 1 | 🟡 MINOR |
| 12 | Consistency | 2 | 🟡 MINOR |
| 13 | Codebase Alignment | 2 | 🟠 MAJOR |

## Summary by Severity

| Severity | Count | Status |
|----------|-------|--------|
| CRITICAL | 0 | — |
| MAJOR | 4 | all resolved |
| MINOR | 10 | all resolved |
| OBSERVATION | 2 | accepted |

---

## Findings

### PF-001: Announcement and status logic would grow an already oversized file 🟠 MAJOR

**Dimension:** 2 — Implicit Assumptions / 6 — Feasibility
**Location:** `03-03-announcements-status.md` §Implementation Details; `99-execution-plan.md` Phase 4
**Codebase Evidence:** `packages/react/src/YearPlanner.tsx` is 816 lines. It already owns layout, state, focus, pipeline, imperative handle and rendering. The plan adds four effects, a mapping, a status bar and three live regions inline.
**The Problem:** The plan assumes the new logic fits in `YearPlanner.tsx` without a split. The coding standard asks for files under ~700 lines and clear single responsibility. Inline growth would make the most complex file harder to review and test.

**Options:**

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| A | Extract `commandStatusView` to `announcements.ts`, the effects to `useAnnouncements.ts`, and the bar to `render/StatusBar.tsx` | Keeps YearPlanner near its current size; pure mapping is unit-testable; hook is testable | Three small files instead of one |
| B | Keep everything inline | Fewer files | Violates the split standard; harder tests |

**Recommendation:** Option A — the three units have clear responsibilities and reuse existing patterns.
**User Decision:** Resolved — technical correction under the milestone `--auto-design` delegation. No product change.

### PF-002: Proxy focus ring fails 3:1 on ribbon backgrounds 🟠 MAJOR

**Dimension:** 4 — Completeness Gaps
**Location:** `03-05-visual-accessibility.md` §Contrast
**Codebase Evidence:** `packages/react/src/styles.css:318-321` draws `outline: 2px solid var(--yp-focus-ring); outline-offset: -2px` inside the proxy. On classic-blue ribbon `#76bfe5`, `#0b6bcb` is 2.60:1; modern is 2.71:1; high-contrast is 2.44:1.
**The Problem:** The plan tests the ring against the surface but not against the ribbon fragment where most proxies sit. WCAG 2.2 focus appearance needs a 3:1 contrast change; the current inner ring misses it.

**Options:**

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| A | Draw the ring outside the fragment with a 2 px surface halo | Ring contrasts with the halo in every theme; works on ribbon and cell backgrounds | Slightly larger focus footprint |
| B | Use a theme-specific focus ring colour for ribbons | Minimal shape change | Adds a token/theme branch; still fails for host themes |
| C | Keep the inner ring | No visual change | Fails the 3:1 target |

**Recommendation:** Option A — one CSS rule works for all presets and host themes.
**User Decision:** Resolved — technical correction under `--auto-design`. Added to the CSS task and ST coverage.

### PF-003: Nested region and grid share the same accessible name 🟡 MINOR

**Dimension:** 4 — Completeness Gaps
**Location:** `03-01-semantics.md` §Grid and region
**Codebase Evidence:** `YearPlanner.tsx:740` passes `ariaLabel` to the grid. The plan adds the same value to the root region.
**The Problem:** A screen reader entering the region hears “Year planner 2027” and then the grid repeats the identical name. The hierarchy is unclear.

**Options:**

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| A | Region keeps the label; grid appends “grid” | Distinct hierarchy; small change | One label string changes |
| B | Keep duplicates | No change | Repetitive and ambiguous |

**Recommendation:** Option A — “Year planner 2027” region, “Year planner 2027 grid” grid.
**User Decision:** Resolved — technical correction under `--auto-design`.

### PF-004: Phantom `docs/index.md` reference 🟡 MINOR

**Dimension:** 13 — Codebase Alignment (Phantom References)
**Location:** `99-execution-plan.md` task 6.1.5
**Codebase Evidence:** `docs/` contains `commands.md`, `interaction.md`, `react-view.md`, `security.md`, `test-report.md` and ADRs, but no `index.md`.
**The Problem:** The executor would look for a file that does not exist.

**Options:**

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| A | Link the new document from `README.md` and update `docs/test-report.md` | Real files | None |
| B | Create `docs/index.md` | New navigation page | New surface outside RD-09 |

**Recommendation:** Option A.
**User Decision:** Resolved — corrected paths in the plan.

### PF-005: Phantom `styles.spec.test.ts` path 🟡 MINOR

**Dimension:** 13 — Codebase Alignment (Phantom References)
**Location:** `07-testing-strategy.md` test file table; `99-execution-plan.md` task 5.1.1
**Codebase Evidence:** The file is `packages/react/src/styles.spec.test.tsx`.
**The Problem:** Wrong extension would create a duplicate test file or fail the task.
**Recommendation:** Use `styles.spec.test.tsx`.
**User Decision:** Resolved — path corrected.

### PF-006: Lane-height test change lacks a supersession record 🟡 MINOR

**Dimension:** 3 — Logical Contradictions / 7 — Testability
**Location:** `99-execution-plan.md` task 5.1.4; `03-05-visual-accessibility.md` §Target size
**Codebase Evidence:** `packages/react/src/theme.spec.test.tsx:21` asserts `laneHeight: 18`.
**The Problem:** The plan tells the executor to change an existing spec-test expectation. Without an explicit supersession record, this looks like fitting the test to the implementation, which the spec-first rule forbids.

**Options:**

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| A | Record that RD-09 target size supersedes the old default and ST-39 is the new oracle | Honest traceability | One extra note |
| B | Keep 18 and exempt compact mode | No test change | Fails the 24 px target |

**Recommendation:** Option A — add the note to `03-05` and `07`, and update the constant as a requirements supersession.
**User Decision:** Resolved — technical correction under `--auto-design`.

### PF-007: `ItemList` prop name mismatch 🟡 MINOR

**Dimension:** 12 — Consistency
**Location:** `03-04-item-list-inspector.md` §New Component
**Codebase Evidence:** The interface lists `asideRef` but the prose and tasks use `itemListRef`/`listRef`.
**The Problem:** The executor cannot tell which prop to implement.
**Recommendation:** Rename to `listRef`.
**User Decision:** Resolved — corrected.

### PF-008: axe matrix omits compact/expanded and AC3 states 🟡 MINOR

**Dimension:** 4 — Completeness Gaps / 7 — Testability
**Location:** `07-testing-strategy.md` ST-44; `99-execution-plan.md` task 6.1.2
**Codebase Evidence:** RD-09 technical testing requires “compact/expanded, overflow, error and 36-month states.” The demo has no density control; AC3 is reachable at `?ac3=1`.
**The Problem:** The plan’s six states omit expanded density and AC3, so the stated matrix does not cover the RD text.

**Options:**

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| A | Add a density control to the demo and scan compact, expanded, AC3 plus the six states | Full RD coverage | Slightly slower scan |
| B | Use Storybook for density | No demo change | More cross-app test plumbing |

**Recommendation:** Option A — the demo is already the E2E fixture.
**User Decision:** Resolved — matrix and task updated.

### PF-009: AC14 says “axe/html validation” but no HTML validator exists 🟡 MINOR

**Dimension:** 4 — Completeness Gaps
**Location:** `07-testing-strategy.md` ST-47; `03-01-semantics.md` §Testing Requirements
**Codebase Evidence:** `package.json` has no `html-validate`, `htmlhint` or equivalent. Adding one is a new dependency.
**The Problem:** The plan cannot claim HTML validation as written.

**Options:**

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| A | Use axe `nested-interactive` plus an explicit DOM scan for interactive descendants inside proxies | No dependency; directly tests AC14 | Not a full HTML validator |
| B | Add an HTML validator dependency | Full validation | New dependency/harness; complexity escalation |

**Recommendation:** Option A — the AC14 risk is nested controls, which axe and the existing warning effect already target. Record the equivalence.
**User Decision:** Resolved — technical correction; no dependency added.

### PF-010: Error status bar survives Dismiss 🟡 MINOR

**Dimension:** 9 — Edge Cases
**Location:** `03-03-announcements-status.md` §Visible status bar
**Codebase Evidence:** `pipeline.dismiss` clears feedback/notices (`commands/pipeline.ts:713-718`) but not `lastSettled`. The status bar would stay red after the user dismisses the error.
**The Problem:** Dismiss appears not to work; the visible error persists.

**Options:**

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| A | Hide an error-level status when `pipeline.feedback` is undefined | Matches Dismiss semantics; no pipeline change | Status disappears only for errors |
| B | Clear `lastSettled` in the pipeline | One source of truth | Changes command lifecycle tests and semantics |

**Recommendation:** Option A — smallest visible behaviour fix.
**User Decision:** Resolved — added to the status derivation.

### PF-011: Inspector-action focus policy is undefined 🟡 MINOR

**Dimension:** 1 — Ambiguities
**Location:** `03-02-focus-keyboard.md` §Focus restoration; `07-testing-strategy.md` ST-18
**Codebase Evidence:** Inspector move/resize buttons request commands but do not set `pendingFocus`; gesture commits do restore focus (`useInteraction.ts:223-272`, `commit.ts`).
**The Problem:** AC5 says focus returns after a successful command. The plan tests gestures only. If every inspector action steals focus back to the proxy, repeated “Move later” presses become impractical.

**Options:**

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| A | Gestures and structural changes restore the item; inspector action buttons keep focus on themselves; Delete falls back because the item is gone | Repeated actions stay usable; AC5’s intent is met for structural commits | Not a literal focus move after every inspector click |
| B | Always move focus to the proxy after acceptance | Literal AC5 reading | Repeated actions require re-navigation |

**Recommendation:** Option A — document it as the explicit focus policy and test the Delete fallback plus gesture restoration.
**User Decision:** Resolved — AR-17 added; ST-18 and the docs updated.

### PF-012: Task 2.1.6 has an ambiguous file target 🟡 MINOR

**Dimension:** 12 — Consistency
**Location:** `99-execution-plan.md` task 2.1.6
**Codebase Evidence:** The task says “`inspector.impl.test.tsx` (extend) or `accessibility.impl.test.tsx`”.
**The Problem:** The executor must choose. Pick one.
**Recommendation:** Extend `packages/react/src/accessibility.impl.test.tsx` for the new accessibility edges; keep `inspector.impl.test.tsx` for existing inspector internals.
**User Decision:** Resolved — corrected.

### PF-013: Snapshot task lacks the update command 🟡 MINOR

**Dimension:** 11 — Ordering & Sequencing
**Location:** `99-execution-plan.md` task 5.1.7
**Codebase Evidence:** Visual snapshots are driven by `tests/e2e/classic-year.spec.ts` and stored in `tests/e2e/classic-year.spec.ts-snapshots/`.
**The Problem:** “Update the affected visual snapshots” is not executable without the command.
**Recommendation:** Add `pnpm exec playwright test tests/e2e/classic-year.spec.ts --update-snapshots` and require a diff review.
**User Decision:** Resolved — command added.

### PF-014: Storybook coverage is under-specified 🟡 MINOR

**Dimension:** 4 — Completeness Gaps
**Location:** `99-execution-plan.md` task 6.1.4
**Codebase Evidence:** `apps/storybook/stories/` has state-per-file stories; the project mandate says every meaningful state is part of done.
**The Problem:** “Add accessibility stories for all new states” does not name the states, so the executor can under-deliver.
**Recommendation:** Name at least 12 stories in the task: default blue, yellow, high contrast, selected item, date range, holiday/disabled, overflow, hidden item, item list, 36 months, expanded density, skip-link focus, accepted and rejected status.
**User Decision:** Resolved — task expanded.

### PF-015: Empty-layout root has no region semantics 🔵 OBSERVATION

**Dimension:** 9 — Edge Cases
**Location:** `03-01-semantics.md` §Grid and region
**Codebase Evidence:** `YearPlanner.tsx:647-661` renders the empty state without a role.
**The Problem:** A failed layout loses the labelled region. This is not an RD acceptance state but is cheap to align.
**Recommendation:** Add the region and label to the empty root too.
**User Decision:** Accepted — added to task 1.1.6.

### PF-016: `styles.css` is already over the split threshold 🔵 OBSERVATION

**Dimension:** 2 — Implicit Assumptions
**Location:** `03-05-visual-accessibility.md`
**Codebase Evidence:** `styles.css` is 886 lines.
**The Problem:** The plan adds roughly 100 lines. Splitting the public CSS file would change the package build and copy step.
**Recommendation:** Keep one public stylesheet; note the size as accepted debt. A future CSS split belongs to a dedicated refactor.
**User Decision:** Accepted — no change.

### PF-017: Manual NVDA/VoiceOver evidence is not reachable on this host 🟡 MINOR

**Dimension:** 4 — Completeness Gaps
**Location:** `01-requirements.md` §Deferred; `03-05`/`07` manual protocol
**Codebase Evidence:** Linux host; `orca` and `xvfb-run` are present; NVDA requires Windows and VoiceOver requires macOS.
**The Problem:** RD-09 AC10 cannot be completed here. The plan records an Orca smoke check and a manual protocol but must not claim AC10.
**Recommendation:** Keep AC10 as an explicit evidence gap owned by the user; publish no conformance statement. Accepted risk per AR-12.
**User Decision:** Accepted — recorded, not waived.

---

## Iteration 2 Re-scan

The plan was corrected for PF-001..PF-014:

- `YearPlanner` now delegates announcements to `useAnnouncements.ts` and the visible bar to `StatusBar.tsx`.
- Proxy focus uses an outer ring with a surface halo; `03-05` records the measured ribbon ratios.
- The grid label appends “grid”; the root keeps the region label.
- `docs/index.md` and `styles.spec.test.ts` references are corrected.
- The lane-height change is recorded as an RD-09 supersession with ST-39 as the new oracle.
- `ItemList` uses `listRef`.
- The axe matrix adds compact, expanded and AC3 states; the demo gains a density control.
- AC14 uses axe `nested-interactive` plus a DOM scan instead of an uninstalled HTML validator.
- Error status hides when feedback is dismissed.
- Inspector-action focus policy is recorded as AR-17.
- Task 2.1.6 and the snapshot command are exact.
- Storybook task names 14 states.

Re-scan result: no new 🔴/🟠 findings. The two observations remain accepted. **PASSED WITH NOTES.**
