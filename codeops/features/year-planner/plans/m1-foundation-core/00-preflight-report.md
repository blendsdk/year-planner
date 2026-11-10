# Preflight Report — M1 Foundation and Core Plan

> **CodeOps Artifact Schema**: 1
> **Audit target**: `codeops/features/year-planner/plans/m1-foundation-core/`
> **Context**: RD-01, RD-02, RD-03, RD-06 minimal-grid enabler; requirements preflight report
> **Created**: 2026-11-10
> **Iterations**: 2 independent plan audits + scoped verification
> **Verdict**: ✅ **PASSED WITH NOTES** — all critical/major findings resolved

---

## Audit summary

| Pass | Result | Main findings |
|---|---|---|
| 1 | ❌ BLOCKED | 7 major: highlightYear default, missing RD-02 APIs, acceptance coverage, CI scope, 36-month keyboard, contextMonths validation, spec-first gaps |
| 2 | ❌ BLOCKED | 3 blockers: spec tasks missing new ST cases, traceability/coverage gaps, toolchain spec runner ordering |
| 3 | ❌ BLOCKED | 1 critical: missing root workspace task; 3 major: ST-26 keyboard ownership, dayOfWeek convention, tsc7 canary |
| Final | ✅ **PASS** | Root workspace task, ST ownership, dayOfWeek, tsc7 canary verified |

## Resolved major findings

| Area | Resolution |
|---|---|
| `highlightYear` | `year` preset → year; explicit range → start year; ST-48 |
| RD-02 API/diagnostics | Added format/subtract/min/max/dayOfWeek/normalize/contains/splitAtDateBoundary + INVALID_INSTANT/TIMED_PROJECTION_FAILED |
| Acceptance coverage | Added ST-43–ST-57 for AC5/6/12, leap years, security, tint, contextMonths, print, keyboard, React/CI |
| CI | Browser matrix, e2e/visual/print/pack/Storybook/React 18+19/tsc7-canary; a11y/bench incremental |
| 36-month keyboard | React/E2E ST-53 + task 4.2.8 |
| contextMonths | INVALID_CONTEXT_MONTHS + ST-49 + task 3.2.5 |
| Spec-first | Toolchain check before scaffold; interval/print/consumer spec tasks before implementation; red phases explicit |
| Root workspace | Task 1.0.2 creates root manifests before package tasks |
| Day-of-week | Saturday-first helper used consistently |
| Print | 2016 blue + 2017 yellow, 15/28/29/36 pagination |

## Accepted notes (non-blocking)

- `scripts/toolchain-check.sh` is a shell acceptance check rather than a Vitest
  file; ST-37–42/54–57 are executed by it and by the later Vitest smoke.
- `verify:full` is wired incrementally; M1 uses the subset available at each
  phase and records the gap in the test report.
- Plan task timestamps are filled during execution, not invented now.

## Next step

Execute the plan with `exec-plan` under the `--ask-commit` default, starting at
Phase 0.
