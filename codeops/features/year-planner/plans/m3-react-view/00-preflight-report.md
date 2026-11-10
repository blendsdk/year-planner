# Preflight Report — M3 React View Plan

> **CodeOps Artifact Schema**: 1
> **Audit target**: `codeops/features/year-planner/plans/m3-react-view/`
> **Context**: RD-06, RD-04, RD-05, RD-07, RD-08, renderer ADR 0001, M2 implementation
> **Created**: 2026-11-10 15:05
> **Iterations**: 3 independent plan audits
> **Verdict**: ✅ **PASSED WITH NOTES** — no open critical or major findings; AC3 evidence is partial per AR-27

---

## Audit summary

| Pass | Result | Main findings |
|---|---|---|
| 1 | ❌ BLOCKED | 3 critical (type-only contracts with runtime helpers, 24-vs-25 tokens, cross-phase spec tests) + 20 major (config types, proxy/slot boundary, item style trust, CSP nonce, geometry tokens, paint mapping, SSR, AC3, CSS/CSP tests, test concreteness, DateMeta semantics, move amount, diagnostics, ST assignment, visibility mapping, inspector filtering, print fit/width, adapter build, create precedence, opacity/pattern, no-op props, API migration) |
| 2 | ❌ BLOCKED | 5 major after corrections: paint target code split, create-layer/active-layer conflict, hardcoded print width, geometry-token conversion, missing API aliases; 12 minor |
| 3 | ✅ **PASS** | All 5 majors and 12 minors corrected; no new contradictions found |

## Critical findings resolved

| Finding | Resolution |
|---|---|
| Type-only `contracts.ts` exported runtime helpers | Helpers moved to `packages/core/src/model/selection.ts`; contracts stay type-only |
| Token union had 24 names but docs required 25 | 24 tokens everywhere; units table distinguishes px/unitless/normalized strings |
| Spec tests depended on later phases | ST ownership re-partitioned: contracts/theme 1–4, shell 5–27, items 28–47, commands 48–61, inspector 62–72, print 73–79/82 |

## Major findings resolved

| Area | Resolution |
|---|---|
| Public config types | `InteractionConfig`, `DisplayConfig`, `PrintConfig`, aliases and exact fields defined |
| Handle visibility reason | Additive `unknown-entity` documented |
| Overflow context | Exact `{ row: MonthRowLayout, hiddenCount, items }` contract |
| Proxy/slot boundary | One roving tab stop; `ItemFragment` wraps proxy content; proxy/handles planner-owned; interactive `renderItem` warns |
| Item style trust | Trusted presentation fields + CSS property/value allowlist; metadata never read |
| CSP | Only `style-src-attr 'unsafe-inline'`; nonce claim removed |
| Geometry tokens | Numbers in design px; `"<n>px"` normalized; invalid falls back silently in the pure theme factory; tokens feed layout, `units` wins |
| Print theme | Weekend/context tints preserved |
| Paint mapping | Highlight-only; core→public code table; missing/non-highlight always `INVALID_PAINT_TARGET` |
| Paint apply | Remove-then-insert for local and host outcomes; mixed-attribute test |
| Pointer mapping | Typed `pointToFragment`/`pointToDate` with `ViewGeometry`; tested at three zooms |
| Invalid options | All core-throwing options validated with fallbacks and diagnostics |
| SSR | Node `renderToString` + jsdom hydration test; `"use client"` entry |
| AC3 | Partial evidence with host button fixtures + adapters; actual Fluent/MUI examples RD-11 (AR-27) |
| CSS/CSP tests | Static scope/no-`!important` test + Playwright CSP header test |
| Test concreteness | Exact px, codes, counts and command fields |
| DateMeta | `label`, `ariaLabel`, `holiday`, `disabled` semantics defined |
| Inspector move | ±7 days to match RD-07 AC11 |
| Diagnostics | One table with RD-08 alignment |
| ST-61 | Assigned to Phase 4 commands |
| defaultVisibility | Field mapping documented |
| Inspector context | Visible selected items only |
| Print fit/width | No auto-fallback; rows re-stacked; surface uses `ribbon.totalWidth`; non-default units test |
| Adapter build/size | Vite entries, export objects, optional peers, size-check update |
| Create layer | `createDefaults.layerId` then `activeLayerId`; check uses chosen layer |
| Layer identity | Opacity, pattern classes and labels tested |
| RD-07 no-ops | `touchEditing`/`marquee` accepted no-ops until RD-07 |
| API migration | Token/preset rename, Display/Print aliases, `units` retained, changeset/migration note |

## Accepted notes (non-blocking)

- **AC3 partial**: actual Fluent UI v9 and MUI Button components are not
  installed. The plan proves the structural contract with host `<button>`
  fixtures and adapter mappings. RD-11 owns example stories (Should Have).
- **RD-06 command scope**: the plan implements the request pipeline needed by
  AC15–AC17. RD-07 owns pointer gestures; RD-08 owns rollback, stale-response
  cancellation and controlled-host history.
- **Pre-1.0 API break**: `YearPlannerTheme` changes from a preset string to a
  token object. `YearPlannerThemeName`, `YearPlannerDisplay`,
  `YearPlannerPrint` and the additive `units` prop keep the migration explicit.
- **Fluent/MUI peers**: declared optional; no runtime import.
- **Print**: Chromium is the PDF baseline; page count/size assertions are
  browser-specific evidence, not a cross-browser PDF guarantee.

## Readiness proof

| Check | Result |
|---|---|
| Required documents exist | ✅ 00, AR, PF, 01, 02, 03-01–03-06, 07, 99 (05 created in Phase 7) |
| `00-index.md` declares RD-06 | ✅ `year-planner/RD-06` |
| Ambiguity register open items | ✅ 0 open; 29 resolved |
| Spec tests precede implementation | ✅ every phase is spec → red → implement → green → impl → verify |
| Unresolved critical/major findings | ✅ none |
| New runtime dependency | ✅ none |
| Scope | ✅ RD-06 + minimal contracts; RD-07/RD-08 behavior not claimed |
| Test ownership | ✅ every ST case belongs to the phase that implements its subject |

## Next step

Execute with `exec-plan` under `--auto-commit --auto-design`, starting at
Phase 1.
