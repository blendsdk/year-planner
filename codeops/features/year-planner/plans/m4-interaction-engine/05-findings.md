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
