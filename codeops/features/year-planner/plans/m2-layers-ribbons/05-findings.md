# M2 Findings Ledger

> **Document**: 05-findings.md
> **Parent**: [Index](00-index.md)
> **Review date**: 2026-11-10
> **Reviewer**: independent phase-reviewer (correctness, maintainability, standards, security)
> **Scope**: `packages/core/src/model/**`, `packages/core/src/ribbon/**`, M2 tests and plan
> **Verdict after fixes**: ✅ no open critical or major findings

## Findings and rulings

| ID | Severity | Finding | Ruling | Resolution |
|---|---|---|---|---|
| C1 | 🔴 Critical | Duplicate IDs were diagnosed but not removed consistently; duplicate groups could survive and duplicate items could produce duplicate fragments | Fix | Validators now return the accepted map values exactly once; duplicate group/layer/item/resource tests added |
| M1 | 🟠 Major | Empty hidden layers could force a group to `mixed` | Fix | Group state uses descendant items when present; empty groups use layer states only |
| M2 | 🟠 Major | Null entries and non-array collections could throw and blank the model | Fix | Collection and entity guards added; null/non-array regression tests |
| M3 | 🟠 Major | Optional scalar fields were not validated; a numeric title could throw in search | Fix | Item/layer scalar and flag validation added; search is defensive |
| M4 | 🟠 Major | Unknown policy keys, including `__proto__`, could reach the resolved policy | Fix | Policy key allowlist in validation and application; pollution test added |
| N1 | 🟡 Minor | Create reported `policy` before `hidden`/`layer-locked` | Fix | Hidden and lock checks now precede the active-layer target check |
| N2 | 🟡 Minor | `{a: undefined}` and `{}` compared unequal | Fix | Equality compares the union of keys; test updated |
| N3 | 🟡 Minor | Ribbon/layout signatures omitted geometry and slot units | Fix | Signatures include x/width/y/height and layout unit values; unit-change test |
| N4 | 🟡 Minor | Hit index indexed fragments with a missing row at y=0 | Fix | Missing-row fragments are skipped; regression test |
| N5 | 🟡 Minor | Invalid density could behave compact; invalid zone silently dropped items | Fix | Both throw `RangeError`; tests added |
| N6 | 🟡 Minor | `assignLanes` and `LaneCandidate` leaked through the public barrel | Fix | `lanes.js` removed from the barrel; fragments import it directly |
| N7 | 🟡 Minor | Public fields lacked property docs; complex internals lacked comments | Fix | Property docs added to the new public interfaces; internal algorithm comments retained |
| N8 | 🟡 Minor | `PaintDefaults.annotation` duplicated a type; `prepare` returned an unused layer | Fix | Uses `PlannerAnnotationStyle`; `prepare` returns only `affected` |
| N9 | 🟡 Minor | `Diagnostic.periods` was `unknown[]` instead of `PlannerPeriod[]` | Fix | Type aligned with RD-04; M2 still never populates it |
| N10 | 🟡 Minor | Cycle de-duplication used a delimiter that IDs could contain | Fix | Cycle key uses `JSON.stringify`; pipe-ID case covered by key change |
| N11 | 🟡 Minor | Missing regression assertions | Fix | Duplicate, tri-state, malformed-input, policy, mode, clipping, signature and paint cases added |
| N12 | 🟡 Minor | Foreground fragments sort below ribbons in the hit index | Accepted risk | RD-07 owns interaction z-order and preview hit-testing; the M2 index is a geometric map, not a z-order contract. Revisit when RD-07 defines the preview layer |

## Verification after fixes

| Check | Result |
|---|---|
| Core tests | **203 passed** |
| Core coverage | **99.43% lines / 96.06% branches / 100% functions** |
| `pnpm verify` | PASS |
| `pnpm verify:full` | PASS (Playwright 7 passed, 2 skipped; clean consumer) |
| API Extractor | PASS |
| TypeDoc | PASS |

## Review conclusion

The duplicate-ID invariant, non-blanking validation and policy boundary are now
covered by regression tests. No critical or major finding remains open. N12 is a
minor, renderer-owner decision recorded above.
