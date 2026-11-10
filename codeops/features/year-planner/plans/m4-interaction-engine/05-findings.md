# RD-07 Findings Ledger

> **Document**: 05-findings.md
> **Parent**: [Index](00-index.md)
> **Scope**: post-phase quality review

## Phase 1 — Selection policy

| Finding | Phase | Severity | Area | Ruling |
|---|---|---|---|---|
| RV-001-1 | 1 | MAJOR | selection/disabled-click | fixed |
| RV-001-2 | 1 | MAJOR | selection/visual-order-coverage | fixed |
| RV-001-3 | 1 | MAJOR | selection/vacuous-assertions | fixed |
| RV-001-4 | 1 | MAJOR | selection/interval-dry | fixed |
| RV-001-5 | 1 | MINOR | selection/mod-drag-empty-anchor | fixed |
| RV-001-6 | 1 | MINOR | selection/unknown-item | fixed |
| RV-001-7 | 1 | MINOR | selection/coverage | fixed |
| RV-001-8 | 1 | MINOR | docs/red-evidence | fixed |
| RV-001-9 | 1 | MINOR | tests/reserved-keyboard | fixed in ST-72 |
| RV-001-10 | 1 | MINOR | docs/drag-snapshot | fixed |
| RV-001-11 | 1 | MINOR | plan/baseline-tree | fixed |

### Notes

- `RV-001-1`: plain and mod clicks now ignore disabled dates; spec cases added.
- `RV-001-4`: normalization, subtraction, containment and empty selection now
  delegate to the tested core interval helpers.
- `RV-001-6`: an item outside visual order no longer changes selection.
- `RV-001-8`: the red phase stays an unresolved-import failure, matching the
  project's existing milestone evidence, and now links to the corrective task.
- `RV-001-9`: the reserved modifier keyboard case is part of ST-72.
- `RV-001-10`: ST-11's expected value was corrected before promotion to
  match the RD-07 anchor/focus rule (the toggled item remains focused while its
  anchor clears); the spec oracle and implementation now agree.

## Phase 2 — Gesture engine

| Finding | Phase | Severity | Area | Ruling |
|---|---|---|---|---|
| RV-002-1 | 2 | MAJOR | gesture/handle-paint-mode | fixed |
| RV-002-2 | 2 | MAJOR | gesture/handle-click-fallback | fixed |
| RV-002-3 | 2 | MAJOR | pointer/fragment-id | fixed |
| RV-002-4 | 2 | MAJOR | gesture/coverage | fixed |
| RV-002-5 | 2 | MAJOR | geometry/pointToDesign | fixed |
| RV-002-6 | 2 | MINOR | tests/mode-matrix | fixed |
| RV-002-7 | 2 | MINOR | tests/expanded-row-fixture | fixed |
| RV-002-8 | 2 | MINOR | tests/auto-scroll-ramp | fixed |
| RV-002-9 | 2 | MINOR | tests/cancel-mode-combined | fixed |
| RV-002-10 | 2 | MINOR | render/annotation-handles | fixed |
| RV-002-11 | 2 | MINOR | gesture/dry | fixed |
| RV-002-12 | 2 | MINOR | gesture/dead-branches | fixed |
| RV-002-13 | 2 | MINOR | gesture/unused-point | fixed |
| RV-002-14 | 2 | MINOR | gesture/auto-scroll-clamp | fixed |
| RV-002-15 | 2 | MINOR | pointer/host-selector | fixed |
| RV-002-16 | 2 | MINOR | geometry/empty-rows | fixed |
| RV-002-17 | 2 | MINOR | tests/unused-import | fixed |
| RV-002-18 | 2 | MINOR | plan/gesture-drift | fixed |
| RV-002-19 | 2 | MINOR | gesture/dead-wrapper | fixed |
| RV-002-20 | 2 | MINOR | gesture/fabricated-fragment-id | fixed |
| RV-002-21 | 2 | MINOR | render/annotation-handle-test | fixed |
| RV-002-22 | 2 | MINOR | pointer/aria-host-roles | fixed |

## Phase 3 — Pointer wiring, commands and previews

| Finding | Phase | Severity | Area | Ruling |
|---|---|---|---|---|
| RV-003-1 | 3 | CRITICAL | preview/trailing-blank-width | fixed |
| RV-003-2 | 3 | MAJOR | preview/double-band-offset | fixed |
| RV-003-3 | 3 | MAJOR | inspector/builder-migration | fixed |
| RV-003-4 | 3 | MAJOR | marquee/modifiers | fixed |
| RV-003-5 | 3 | MAJOR | preview/invalid-affordance | fixed |
| RV-003-6 | 3 | MAJOR | tests/overstated-st-coverage | fixed |
| RV-003-7 | 3 | MINOR | pointer/pointer-id-and-release | fixed |
| RV-003-8 | 3 | MINOR | pointer/suppress-click-leak | accepted |
| RV-003-9 | 3 | MINOR | types/unsafe-casts | fixed |
| RV-003-10 | 3 | MINOR | preview/css-color | fixed |
| RV-003-11 | 3 | MINOR | preview/data-kind | fixed |
| RV-003-12 | 3 | MINOR | types/stale-inert-comments | fixed in phase 4 task |
| RV-003-13 | 3 | MINOR | useInteraction/file-size | fixed |
| RV-003-14 | 3 | MINOR | types/shared-click-event | fixed |
| RV-003-15 | 3 | MINOR | tests/touch-and-capture | fixed |
| RV-003-16 | 3 | MINOR | double-click/duplicate-selection | fixed |
| RV-003-17 | 3 | OBS | preview/dead-helpers | accepted |
| RV-003-18 | 3 | OBS | commit/expected-version-fallback | fixed |
| RV-003-19 | 3 | OBS | create/focus | fixed |
| RV-003-20 | 3 | OBS | rejection/focus | fixed |
| RV-003-21 | 3 | OBS | builder/title-localization | accepted |

## Phase 4 — Keyboard, focus, touch and undo

| Finding | Phase | Severity | Area | Ruling |
|---|---|---|---|---|
| RV-004-1 | 4 | CRITICAL | focus/delete-body-fallback | fixed |
| RV-004-2 | 4 | MAJOR | delete/wrong-target | fixed |
| RV-004-3 | 4 | MAJOR | focus/nearest-enabled | fixed |
| RV-004-4 | 4 | MAJOR | tests/missing-integration-spec | fixed |
| RV-004-5 | 4 | MAJOR | tests/touch-not-touch | fixed |
| RV-004-6 | 4 | MAJOR | tests/redo-clearing | fixed |
| RV-004-7 | 4 | MINOR | focus/reannouncement | fixed |
| RV-004-8 | 4 | MINOR | touch/action-auto | fixed |
| RV-004-9 | 4 | MINOR | commit/rejected-focus | fixed |
| RV-004-10 | 4 | MINOR | focus/visible-set-duplication | accepted |
| RV-004-11 | 4 | MINOR | tests/unused-import | fixed |
| RV-004-12 | 4 | MINOR | docs/stale-pointer-comment | fixed |
| RV-004-13 | 4 | MINOR | tests/duplicate-harness | accepted |
| RV-004-14 | 4 | MINOR | tests/act-warnings | fixed |
| RV-004-15 | 4 | MINOR | types/unsafe-cast | fixed |
| RV-004-16 | 4 | MINOR | plan/phase-4-file-claim | fixed |
| RV-004-17 | 4 | MINOR | tests/spec-gaps | fixed |
