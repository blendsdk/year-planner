# Preflight Report — Year Planner for React Requirements

> **CodeOps Artifact Schema**: 1
> **Audit target**: `codeops/features/year-planner/requirements/` (README, 00-ambiguity-register, 00-traceability, RD-01..RD-12)
> **Context**: handoff package (read-only), repository scaffold, roadmap, no implementation code
> **Created**: 2026-11-10
> **Iterations**: 7 independent subagent passes + deterministic link/structure checks
> **Verdict**: ✅ **PASSED WITH NOTES** — all critical/major findings resolved; remaining minor observations accepted

---

## Audit summary

| Pass | Result | Main findings |
|---|---|---|
| 1 | ❌ BLOCKED | 5 critical/major contract gaps: paint/erase model, batch scope, read-only model, create/delete lifecycle, version/revision inconsistency; 19 further major/minor |
| 2 | ❌ BLOCKED | 8 major: print pagination, public API exactness, circular type dependency, layer flags, paint attributes/versions, modifier matrix, AR-18 scope, update/redo coverage |
| 3 | ❌ BLOCKED | 1 critical (hidden items mutated by paint/erase), 3 major (paint defaults/outcomes, `getDateMeta`, version transition) |
| 4 | ❌ BLOCKED | 3 major: paint AC wording, title preservation, duplicate paint layer source |
| 5 | ❌ BLOCKED | 2 major: revision wording, uncontrolled `update` undo |
| 6 | ❌ BLOCKED | 2 major: `CommandOutcome.revision` optionality, inspector command path |
| 7 | ✅ **PASS** | No remaining critical/major; all requested fixes verified |

Independent auditors reviewed the set against the handoff and cross-RD consistency.
No implementation code exists, so codebase-alignment checks apply to the scaffold
and planned paths only. Toolchain compatibility (TS6 + Vite 8 + Storybook 10 +
TypeDoc/API Extractor + GH Pages) remains an M0 spike, not a requirements finding.

## Resolved critical/major contracts

| Area | Resolution | RDs |
|---|---|---|
| Paint/erase model | One item = one period; erase splits into new items; paint merges only equal attributes; hidden/locked items skipped | RD-04, RD-07, RD-08 |
| Batch scope | Batch multi-move and `bulk` deferred; AR-18 corrected | AR, RD-07, RD-08, RD-11 |
| Editability | Global `readOnly`, visibility, item/layer `locked`/`readOnly`, layer/group policy precedence | RD-04, RD-07 |
| Paint lifecycle | `PaintDefaults`, `expectedVersions`, required `updatedItems` + `removedItemIds`, `INVALID_PAINT_TARGET` | RD-04, RD-06, RD-08 |
| Versions | Per-item numeric `version`; host increments on acceptance; local reducer increments; undo/redo restore; residuals version 1 | RD-04, RD-08 |
| Selection | Canonical `DateInterval`/`PlannerSelection`; full modifier matrix; anchor/focus transitions; Mod+Shift reserved | RD-04, RD-07 |
| Dynamic months | Month 0–11; 12–36 hard bounds; `highlightYear` rule; 24/36 tests; view years 1601–9998 | RD-03, RD-05, RD-10, RD-11 |
| Print | 14 rows/page default; 1/2/3 pages for 12–14/15–28/29–36; PRT-01 exact; 24/36 tests | RD-05, RD-10, RD-11 |
| Timed periods | `displayTimeZone` default UTC; display projection; timed editing rejected | RD-02, RD-06, RD-07, RD-08 |
| Public API | Exact props, handle, slots, theme tokens, `getDateMeta`, `requestCommand`, defaults, forwardRef | RD-04, RD-06 |
| Accessibility | WCAG target, roving tabindex, proxy/handle separation, inspector, hidden counts, 36-month coverage | RD-06, RD-09 |
| Security/privacy | Hidden data absent from DOM/ARIA/tooltips/inspector/print; CSP documented; XSS tests | RD-04, RD-06, RD-09, RD-10 |
| SSR | Explicit `locale`/Gregorian calendar/`displayTimeZone`; SSR AC | RD-06, RD-10 |
| Quality gate | `verify` vs `verify:full`; 16.7 ms/60 Hz budgets; size check; browser matrix | RD-01, RD-10, RD-12 |
| Traceability | `00-traceability.md` maps handoff cases and new cases to spec-test IDs | README, RD-10, traceability |
| M0 renderer gate | Owner, criteria, artifact, ADR, fallback; release checklist | RD-05, RD-12 |

## Remaining notes (accepted, non-blocking)

- Wording-level variations remain across RDs (e.g., “severity” vs `level`,
  `CommandEnvelope` naming, minor ordering of prose). They do not change
  behavior or testability.
- `DEFERRED.md` and the traceability matrix will be finalized during planning;
  the requirement-level lists are present.
- The M0 renderer/toolchain spike is still required before RD-05/RD-06
  implementation; this is an explicit gate, not an unresolved requirement.
- No performance, accessibility-conformance or booking-correctness claim is
  validated yet; the requirements explicitly prohibit such claims without
  evidence.

## Deterministic checks

| Check | Result |
|---|---|
| RD count | 12 |
| Required RD sections | All present |
| Ambiguity register | 79 rows, 79 resolved, 0 open (AR #79 runtime Vite/Vitest fallback) |
| Roadmap rows | 12 RDs |
| Internal links | No broken links |
| Acceptance numbering | Sequential in every RD |
| Handoff cases | 21 full + PRT-01 exact; RES-01/REC-01 P1 out of R1 |

## Next step

Proceed to `make-plan` for the first implementation slice (RD-01 + RD-02), and
schedule the M0 renderer/toolchain spike before RD-05/RD-06.
