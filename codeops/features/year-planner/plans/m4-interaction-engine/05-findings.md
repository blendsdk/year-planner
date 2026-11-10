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
