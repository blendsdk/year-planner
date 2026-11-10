# Preflight Report: RD-07 Interaction Engine Plan

> **Status**: ✅ PREFLIGHT PASSED WITH NOTES — 34 findings, 13 critical/major resolved, 21 minor/observations resolved or accepted
> **Iteration**: 1 (post-creation scan; corrections applied before execution)
> **Artifact**: Implementation plan at `codeops/features/year-planner/plans/m4-interaction-engine/` (10 documents)
> **Codebase Grounded**: 20 source files examined, 46 references verified
> **Artifact hash at scan start**: `eaa1ec39260a978fc0c4aa3fba558006bea69f9da760391002472e67cc777afc`
> **Last Updated**: 2026-11-10 19:32

> **SAME-SESSION REVIEW:** This plan was created in the current session. Three
> independent general-purpose subagents performed the clustered scan against the
> repository; same-agent bias risk remains elevated. A fresh-session audit is
> recommended before release, not before execution.

## Codebase Context

**Repository:** `blendsdk/year-planner` — ESM-only React year planner monorepo.

**Tech Stack:** TypeScript 6, React 19, Vite 7.3.8, Vitest 3.2.7, Storybook 10,
Playwright, pnpm/Turbo, Biome, API Extractor/TypeDoc.

**Architecture:** `packages/core` owns temporal/layout/model/ribbon/print logic;
`packages/react` owns the view, state, command pipeline, inspector, theming and
print tree. `apps/demo` and `apps/storybook` consume the workspace packages.
`tests/e2e` runs Playwright against the demo.

**Key files examined:**

| File | Relevant fact |
| --- | --- |
| `packages/core/src/contracts.ts:8-30` | `SelectionDateRange` and `PlannerSelection` shape |
| `packages/core/src/model/editability.ts:111-128` | editability needs model, visibility, filter, readOnly, mode, active layer |
| `packages/core/src/ribbon/fragments.ts:62-76, 240` | stable `RibbonLayout.signature` |
| `packages/react/src/YearPlanner.tsx:211-402` | current plain click, focus and handle |
| `packages/react/src/render/CellLayer.tsx:96-125` | cell click/key handlers |
| `packages/react/src/render/ItemLayer.tsx:150-248` | proxy/handle markup and handlers |
| `packages/react/src/geometry.ts:71-113` | design mapping currently uses `layout.rowHeight` |
| `packages/react/src/commands.ts:206-559` | existing validated command pipeline and history |
| `packages/react/vitest.config.ts:8` | test include patterns |
| `playwright.config.ts` | three desktop projects; no touch project |

**Reference verification:** 46 references mapped — 46 verified, 0 unverifiable.

## Summary by Dimension

| # | Dimension | Findings | Highest severity |
|---|-----------|----------|------------------|
| 1 | Ambiguities | 4 | 🟠 MAJOR |
| 2 | Implicit Assumptions | 3 | 🟠 MAJOR |
| 3 | Logical Contradictions | 5 | 🔴 CRITICAL |
| 4 | Completeness Gaps | 6 | 🟠 MAJOR |
| 5 | Dependency Issues | 2 | 🟠 MAJOR |
| 6 | Feasibility Concerns | 4 | 🟠 MAJOR |
| 7 | Testability | 5 | 🟠 MAJOR |
| 8 | Security Blind Spots | 3 | 🟠 MAJOR |
| 9 | Edge Cases | 4 | 🟡 MINOR |
| 10 | Scope Creep Indicators | 1 | 🟡 MINOR |
| 11 | Ordering & Sequencing | 2 | 🔴 CRITICAL |
| 12 | Consistency | 4 | 🟡 MINOR |
| 13 | Codebase Alignment | 5 | 🟠 MAJOR |

## Summary by Severity

| Severity | Count | Status |
|----------|-------|--------|
| CRITICAL | 1 | Resolved |
| MAJOR | 12 | Resolved |
| MINOR | 15 | Resolved or accepted |
| OBSERVATION | 6 | Resolved or accepted |

---

## Critical and Major Findings

### PF-001: Phase gates require tests implemented in later phases 🔴 CRITICAL

**Dimension:** 3, 11
**Location:** `99-execution-plan.md` phase deliverables; `07-testing-strategy.md` test ownership
**Codebase Evidence:** `YearPlanner.tsx:211-402` has no pointer hook; touch/keyboard arrive in later tasks.

**Problem:** Phase 2's ST group included capture, cancellation, disabled navigation and touch, which are implemented in Phases 3–4. Phase 3's group included double-click and touch-action from Phase 4. The phase gates could never pass.

**Options:** (A) reassign every ST to its implementing phase; (B) move all implementation into Phase 2; (C) weaken the gates.

**Recommendation:** Option A — smallest correction, keeps spec-first ordering.

**Decision:** AI — delegated by `--auto-design`. Applied: ST groups remapped to Phases 1–5 and the execution plan rewritten to 33 tasks with reachable gates.

---

### PF-002: Click ownership can emit selection twice and host buttons select a date 🟠 MAJOR

**Dimension:** 3, 13
**Location:** `03-02` threshold, `03-03` click ownership, ST-49/50/51
**Codebase Evidence:** `CellLayer.tsx:111` and `ItemLayer.tsx:187-190` already select on native click; `apps/demo/src/App.tsx` renders Fluent/MUI buttons inside cells.

**Problem:** A sub-4 px pointer sequence would run both the gesture click intent and the native click. A host button click would bubble to the cell handler.

**Options:** (A) pointer sequence owns selection and suppresses every following click; (B) remove the gesture click intent and keep native clicks; (C) keep both and de-duplicate by value.

**Recommendation:** Option A with a host-interactive guard — deterministic and preserves programmatic clicks.

**Decision:** AI — delegated. Applied to `03-02`/`03-03` and ST-49/50/51.

---

### PF-003: `GestureContext` cannot decide "move if editable" 🟠 MAJOR

**Dimension:** 2, 6, 8
**Location:** `03-02` GestureContext and activation matrix; ST-84
**Codebase Evidence:** `editability.ts:111-128` requires model, visibility, filter, readOnly, mode and active layer.

**Problem:** The FSM had only items and `isDisabled`, so locked/read-only/policy-denied items could start a preview and fail later.

**Options:** (A) pass the whole editability context; (B) pass an `isEditable(itemId, action)` callback; (C) start previews and rely on the pipeline.

**Recommendation:** Option B — smallest sufficient interface, no duplicated policy.

**Decision:** AI — delegated. Applied: `GestureContext.isEditable`, computed by the view with core precedence; ST-84 asserts no gesture and an imperative `READ_ONLY`.

---

### PF-004: Cancellation uses raw identity and breaks controlled hosts 🟠 MAJOR

**Dimension:** 2, 6
**Location:** `03-02` cancellation table; AR-21
**Codebase Evidence:** `fragments.ts:62-76, 240` already exposes a stable `RibbonLayout.signature` covering layout, items, visibility, filter and fragments.

**Problem:** A controlled host recreating equal arrays on every render would cancel every drag.

**Options:** (A) compare `ribbons.signature` + mode; (B) deep-equal every input; (C) never cancel on re-render.

**Recommendation:** Option A — existing, cheap, content-based.

**Decision:** AI — delegated. Applied: signature + mode cancellation; ST-40 covers equal-content re-render vs real change.

---

### PF-005: Marquee lacks the pointerup design point and screen conversion 🟠 MAJOR

**Dimension:** 3, 4
**Location:** `03-02` FSM and `03-03` preview
**Codebase Evidence:** `geometry.ts` has design coordinates but no design→screen helper; `Marquee` is a fixed overlay.

**Problem:** Press-release without a final move would use a stale rectangle; the fixed marquee had no conversion contract.

**Options:** (A) add design start/current to state and `designRectToScreen`; (B) derive the rectangle from DOM rects; (C) require a final pointermove.

**Recommendation:** Option A — deterministic and matches the design-plane model.

**Decision:** AI — delegated. Applied: `startDesign`, `endGesture` design point, `designRectBetween`, `designRectToScreen`; ST-33.

---

### PF-006: Date mapping ignores rendered ribbon row heights 🟠 MAJOR

**Dimension:** 13
**Location:** `03-02` coordinates; ST-27
**Codebase Evidence:** `geometry.ts:108` divides by `layout.rowHeight`; `MonthRow.tsx:112` renders `ribbonRow.height`, which can exceed `layout.rowHeight` in expanded density or lane overflow.

**Problem:** Drags and marquees map to the wrong month row below a tall row.

**Options:** (A) map through `ribbonRow.top/height`; (B) force every row to `layout.rowHeight`; (C) use `elementFromPoint`.

**Recommendation:** Option A — uses the rendered geometry.

**Decision:** AI — delegated. Applied: pointer mapping takes the ribbon layout; ST-27 covers expanded density.

---

### PF-007: Keyboard handlers can hijack host controls; Delete/Escape ownership is split 🟠 MAJOR

**Dimension:** 3, 8, 13
**Location:** `03-03` keyboard matrix; task 4.2.1
**Codebase Evidence:** `CellLayer.tsx:68-76` renders host content inside cells; `Overflow.tsx` handles Escape; `apps/demo` proves host buttons.

**Problem:** Delete/Ctrl+A/Arrow in a host input could mutate the planner; Delete had both cell and root owners; multi-select Delete was undefined.

**Options:** (A) grid root owns Delete/Escape/Ctrl+A, with a shared host-interactive guard; (B) each cell owns all keys; (C) remove keyboard editing.

**Recommendation:** Option A; Delete targets `focusItemId`, else the sole selected item, else a diagnostic no-op.

**Decision:** AI — delegated. Applied to matrix, `03-03` and ST-52/77.

---

### PF-008: Anchor/focus matrix omits cross-kind clearing and fallbacks 🟠 MAJOR

**Dimension:** 1, 2
**Location:** `03-01` matrix; ST-4/9/11
**Codebase Evidence:** `contracts.ts:19-30` has four anchor/focus fields.

**Problem:** "anchor kept" did not say which pair; Shift item with no anchor and item-anchor clearing were undefined.

**Options:** (A) one explicit matrix with all four fields and fallbacks; (B) separate date/item matrices; (C) leave it to implementation.

**Recommendation:** Option A.

**Decision:** AI — delegated. Applied: explicit matrix, fallbacks, and ST-4/9/11/21.

---

### PF-009: ST-34 asserted two fragments for a one-row period 🟠 MAJOR

**Dimension:** 7, 13
**Location:** `07-testing-strategy.md` ST-34; RD-07 AC7
**Codebase Evidence:** February 2027 has 28 days; `[Feb 2, Feb 12)` is wholly inside the February row.

**Problem:** A correct implementation would fail the oracle.

**Options:** (A) expect one February fragment; (B) change the move target to cross a month; (C) render a phantom fragment.

**Recommendation:** Option A for the AC7 example, plus a separate cross-month and year-boundary case.

**Decision:** AI — delegated. Applied: ST-34 one fragment; ST-53 cross-month; ST-54 year boundary.

---

### PF-010: Touch AC12 is not proven with real touch 🟠 MAJOR

**Dimension:** 7
**Location:** ST-96; `03-04` E2E
**Codebase Evidence:** `playwright.config.ts` has three desktop projects and no `hasTouch`.

**Problem:** Synthetic pointer events prove gating but not scroll-first behavior.

**Options:** (A) add one Chromium touch project and CDP swipe; (B) record AC12 as manual; (C) add a full touch browser matrix.

**Recommendation:** Option A — minimal real-browser evidence; RD-10 owns the full matrix.

**Decision:** AI — delegated. Applied: `devices["Pixel 5"]` touch project, CDP touch swipe, ST-96.

---

### PF-011: `doubleClick: "none"` was unobservable 🟠 MAJOR

**Dimension:** 7
**Location:** ST-88; `03-03` double-click
**Codebase Evidence:** `YearPlanner.tsx:246-252` opens the inspector whenever selection is non-empty, so single click already opens it.

**Problem:** `none` could not be distinguished from the default.

**Options:** (A) define inspect as open + focus and `none` as no focus; (B) drop the Should Have; (C) change single-click behavior.

**Recommendation:** Option A — small, observable and preserves single-click.

**Decision:** AI — delegated. Applied: default focuses the inspector; `none` does not; ST-88.

---

### PF-012: ST-26 (date mapping) was not concrete 🟠 MAJOR

**Dimension:** 7
**Location:** ST-26
**Codebase Evidence:** `classic-year.ts` prefix widths; 2027 first row starts 2026-12-01 at design x=135.

**Problem:** "matches the prefix-width column" could re-use the implementation helper and pass by construction.

**Options:** (A) give exact viewport, scroll, zoom and point; (B) compare against a second implementation; (C) skip.

**Recommendation:** Option A. Applied: `scrollLeft=200`, zoom 1.25, point `(266.25, 36.5)` → `2026-12-04`.

**Decision:** AI — delegated.

---

### PF-013: API report and verify workflow would fail phase gates 🟠 MAJOR

**Dimension:** 5, 13
**Location:** `99` tasks 1.3.2/4.3.2; `03-04` API section
**Codebase Evidence:** `package.json:27` runs `api-report:ci` inside `verify`; `api-report` regenerates.

**Problem:** The plan regenerated reports after verify; `focusItemId` is in the core report and `doubleClick` in the React report, but the plan said both reports.

**Options:** (A) run `pnpm api-report` before `verify` in Phases 1 and 4; (B) exclude API checks from verify; (C) commit reports late.

**Recommendation:** Option A.

**Decision:** AI — delegated. Applied: task/verify wording and report targets corrected.

---

## Minor and Observation Findings

| ID | Severity | Dimension | Finding | Resolution |
|---|---|---|---|---|
| PF-014 | 🟡 MINOR | 1, 4 | Ctrl/Cmd+Shift guard covered clicks only, not drags/keys | Added guard at every policy/key entry; ST-13 |
| PF-015 | 🟡 MINOR | 3 | AR-25 said selection rejects disabled ranges, but the policy splits them | AR-25/03-01 clarified: selection splits; edit ranges reject; ST-22/79 |
| PF-016 | 🟡 MINOR | 2, 4 | Builder defaults and paint expected versions incomplete | `createPlannerId`, `paintDefaults`, locked/read-only exclusion; ST-59/61/62 |
| PF-017 | 🟡 MINOR | 4 | One-day resize, start handle and year-boundary cases untested | Added ST-36/37/54 |
| PF-018 | 🟡 MINOR | 1, 4 | Persistent vs transient selection preview ambiguous | Separate `selection` vs `selection-preview`; ST-66 |
| PF-019 | 🟡 MINOR | 11 | Integration spec listed but no task created it | Added to task 4.3.1 |
| PF-020 | 🟡 MINOR | 13 | Stale "inert/later slice" comments and demo copy | Tasks 4.2.1, 4.2.2, 5.2.1 |
| PF-021 | 🟡 MINOR | 13 | Out-of-window dates were treated as disabled | Unknown dates are not disabled for edit validation; ST-70 |
| PF-022 | 🟡 MINOR | 7, 10 | AC15 announcement deferred but claimed | Minimal polite live region added; ST-81; RD-09 still refines |
| PF-023 | 🟡 MINOR | 9 | Lost capture and pending cancel not asserted | ST-43/44; `onLostPointerCapture` wiring |
| PF-024 | 🟡 MINOR | 1, 7 | Some ST expectations were not derivable; controlled selection untested | ST-4/9/11/89/90 and matrix fallbacks |
| PF-025 | 🟡 MINOR | 7 | ST-29 mixed blank pointerdown with "last valid date" | Split into ST-28 (blank down) and ST-29 (valid down then blank) |
| PF-026 | 🟡 MINOR | 6 | Create fallback to `activeLayerId` untested | ST-62 |
| PF-027 | 🟡 MINOR | 4 | Heading hit-test priority has no FSM transition | Accepted note: headings stay presentation-only; AR-37; RD-09 owns navigation |
| PF-028 | 🔵 OBS | 12 | `DateInterval` vs `SelectionDateRange` not reconciled | Added equivalence note in 03-01 |
| PF-029 | 🔵 OBS | 13 | Duplicate `commands.ts` module names | Renamed new module `interaction/builders.ts` |
| PF-030 | 🔵 OBS | 13 | Move/resize preview below item proxies would be hidden | Preview layering rule: date below items, move/resize above with `pointer-events:none` |
| PF-031 | 🔵 OBS | 13 | Task 1.2.1 edited `core/index.ts` redundantly | Removed; barrel already re-exports contracts |
| PF-032 | 🔵 OBS | 9 | Non-editable resize-handle click did nothing | Handle falls back to item click selection; ST-68 |
| PF-033 | 🔵 OBS | 12 | Host rejection traced to the process AR | Re-cited AR-26 and RD-08 ownership |
| PF-034 | 🔵 OBS | 9 | Preview/marquee overlays could intercept pointers | `pointer-events: none` required; ST-67 |

## Resolution Provenance

All technical findings were resolved under `--auto-design` with the root
invocation `yp-rd07-2026-11-10T19-32Z`. No finding required a reserved product,
scope, security-policy or compatibility decision. PF-027 is an accepted
observation recorded as AR-37 because RD-07's own FSM has no heading
transition; the plan does not claim heading navigation.

## Verification After Corrections

| Check | Result |
|---|---|
| Plan documents present | 10/10 |
| `00-index.md` Implements line | `year-planner/RD-07` |
| Ambiguity Register | 37/37 resolved |
| Execution plan | 33 numbered tasks, phases 6/6/8/6/7 |
| ST cases | 98, grouped by implementing phase |
| ST ordering | spec tests → red → implementation → green → impl tests → verify in every phase |
| Raw git commands in plan docs | none |
| Task size | every task lists ≤5 files |
| Codebase references | 46 verified |
| Unresolved critical/major | 0 |

## Pass Verdict

**✅ PREFLIGHT PASSED WITH NOTES**

All critical and major findings are resolved. Minor findings are resolved except
PF-027, which is explicitly accepted as AR-37 and does not block execution. The
plan is ready for the exec-plan workflow.
