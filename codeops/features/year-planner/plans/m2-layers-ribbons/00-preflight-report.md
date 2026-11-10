# Preflight Report — M2 Layers and Ribbons Plan

> **CodeOps Artifact Schema**: 1
> **Audit target**: `codeops/features/year-planner/plans/m2-layers-ribbons/`
> **Context**: RD-04, RD-05, renderer ADR 0001, M1 implementation
> **Created**: 2026-11-10 13:10
> **Iterations**: 3 independent plan audits
> **Verdict**: ✅ **PASSED** — all critical/major findings resolved; executable

---

## Audit summary

| Pass | Result | Main findings |
|---|---|---|
| 1 | ❌ BLOCKED | 2 critical (paint locking, A3 paginate scale) + 18 major (coverage, lane sort, module order, diagnostics, print width, policy resolution) |
| 2 | ❌ BLOCKED | C1 resolved; 2 critical/8 major remained (wrapped connectors, early page close, totalWidth, Phase 4 signature/connector order, paint mode, create/delete visibility, updatedItems set, clipping flags, vague STs, duration units) |
| 3 | ❌ BLOCKED | 4 open (AR-29 early split, step 10 wording, missing this report) + 1 new major (timed highlight targets) + 5 minor |
| Final | ✅ **PASS** | All corrected: strict rowsPerPage, full affected set, timed targets skipped, connector deferral, reducer/reset and diagnostic rules pinned |

## Resolved critical findings

| Finding | Resolution |
|---|---|
| Paint silently skipped locked targets | Global/layer guardrails reject with `NOT_EDITABLE`; per-item hidden/locked/read-only items are skipped and left unchanged (AR-28). ST-37/ST-68 pin it. |
| Paginate at scale 1 cannot fit A3 | Every page gets a uniform scale from width and height; `totalWidth` pinned to 1,995; 14 rows scale to ~0.773. ST-59/ST-61/ST-79 assert the fit. |

## Resolved major findings

| Area | Resolution |
|---|---|
| Wrapped connectors | `edge-path` deferred to RD-06 with the SVG shape plane (AR-21); no option or descriptor in M2; ST-57 asserts the deferral |
| Paginate page count | Strict `rowsPerPage` chunking, no early close; 12–14/15–28/29–36 keep 1/2/3 pages |
| `totalWidth` | `2 * monthBandWidth + totalDayWidth` = 1,995 classic |
| Phase order | Ribbon types before lanes; signature in `fragments.ts` / Phase 4; Phase 5 is hit index only |
| Paint mode gate | `auto`/`paint`/`erase` only; direct paint under `select` returns `NOT_EDITABLE` |
| Create/delete guardrails | Effective visibility, `locked || readOnly`, mode and active-layer target checked |
| Paint result set | `updatedItems` carries all new + affected non-matching items, matching RD-04's full affected set |
| Clipping flags | Exact Jan/Feb/middle/single/outside expectations in ST-73 |
| Test concreteness | Reducer state table, editability matrix, create/delete matrix, exact lanes, 14-row fit fixture |
| Duration units | Projected source duration in days |
| Diagnostics | `periods` never populated; item messages redacted; 16 typed codes incl. `INVALID_GROUP` |
| Timed targets | Paint/erase skip timed highlight items; they are never converted to all-day (AR-34) |

## Resolved minor findings

| Finding | Resolution |
|---|---|
| Code count | 16 codes listed and used |
| Missing report | This document |
| Margin wording | 6 mm per side (12 mm total) |
| `unknown-entity` | Documented additive reason; six RD-04 reasons remain the valid-data contract |
| Reset semantics | `reset` returns the empty preset, not the initial defaults |
| Phase labels | Phase 4 owns the signature; Phase 5 is hit index only |

## Readiness proof

| Check | Result |
|---|---|
| Required documents exist | ✅ 00, AR, PF, 01, 02, 03-01–03-05, 07, 99 |
| `00-index.md` declares both RDs | ✅ `year-planner/RD-04, year-planner/RD-05` |
| Ambiguity register open items | ✅ 0 open; 34 resolved |
| Spec tests precede implementation | ✅ every phase is spec → red → implement → green → impl → verify |
| Unresolved critical/major findings | ✅ none |
| New dependency or support surface | ✅ none |
| Scope | ✅ core only; RD-06/07/08 behavior not planned |

## Accepted notes (non-blocking)

- The 14-month `fit` mode warns because the classic grid is width-bound at
  6.96 pt. RD-06 owns the final print typography decision; this plan reports the
  constraint instead of hiding it.
- Gutter connectors are a should-have and are deferred to RD-06 (AR-21).
- RD-04 AC9's React `visibility`/`onVisibilityChange` wiring is RD-06; the core
  reducer and preset are delivered here.

## Next step

Execute with `exec-plan` under `--auto-commit --auto-design`, starting at
Phase 1.
