# RD-06 Findings Ledger

> **Document**: 05-findings.md
> **Parent**: [Index](00-index.md)
> **Review date**: 2026-11-10
> **Reviewer**: independent phase reviewer (correctness, maintainability, standards, security)
> **Scope**: React view, state, commands, inspector, print, theming, adapters, tests and docs
> **Verdict after fixes**: ✅ no open critical or major finding

## Critical findings

| ID | Finding | Ruling | Resolution |
|---|---|---|---|
| C1 | CSS URL injection bypassed the style sanitizer through item/date color fields and item/date style background values | Fix | One `safeCssColor` validator for hex/rgb/hsl/named/`var(--yp-*)`; applied to screen/print colors and to color-bearing style properties; `image-set`, escaped `url` and URL values rejected; unit and Playwright no-request evidence |
| C2 | `unstyled` only added a class; no CSS rules removed decoration | Fix | Overrides-layer rules remove fills, grid/item colors and shadows while keeping geometry, borders and focus; static CSS + DOM tests |

## Major findings

| ID | Finding | Resolution |
|---|---|---|
| M1 | Layer/item ribbon colors were not rendered | Item color → annotation background → layer color → CSS theme fallback; `item.className` applied; tests |
| M2 | Print header/footer had 7 labels for 39 tracks | 37 weekday headings in header and footer; `74` headings asserted |
| M3 | Compact overflow fragments printed beyond row height | Print filters `lane >= visibleLaneCount`; 20-item print test asserts 3 fragments |
| M4 | `units.monthBand` was ignored by the rendered bands | `layout.monthBandWidth` is passed to grid, item layer and print pages; tests |
| M5 | Local paint committed different IDs than it applied | Apply and commit share one `localCommandItems` result; committed IDs compared to DOM |
| M6 | Create/move/resize validation was incomplete | Duplicate IDs, kinds, periods, reverse ranges and one-day minimum validated; local apply failure yields `INVALID_COMMAND` |
| M7 | Local annotation edits failed or duplicated | Annotations are host-owned for edits (AR-31); commands rejected, inspector actions disabled and explained |
| M8 | Read-only mode could be bypassed by undo/redo | Both reject with `READ_ONLY`; test added |
| M9 | Built entry lacked `"use client"` and could execute `process.env` | Entry directive, build banner, guarded environment check, `test:size` guard |
| M10 | Tooltip stayed visible after its item was hidden | Tooltip effect clears when the item leaves the current row fragments; test |
| M11 | Pending IDs were reserved too late and different-item outcomes could clobber | IDs reserve before async validation; local apply uses functional updates; undo snapshots preserved |
| M12 | Proxy keyboard model had no tab stop and cross-month items got two | One active fragment per item via `activeFragmentId`; first visible proxy receives tab 0; arrow keys move within the proxy group |
| M13 | Docs/test report/plan overstated completion | Docs, test report, plan and roadmap reconciled after the final verify |

## Minor findings

| ID | Resolution |
|---|---|
| m1 | `showInspector` false→true transition reopens the panel; test |
| m2 | Move/resize/paint/create use per-action editability and create checks |
| m3 | Global read-only reaches `ItemRenderContext`; item class and layer name/aria applied |
| m4 | Timed labels explicitly use the Gregorian calendar |
| m5 | Validation runs before confirmation; validation denial is retryable; feedback clears on success; timers clear in `finally`; unmount is checked |
| m6 | `getPresetTheme` uses `Object.hasOwn`; item/date selectors use `CSS.escape` when available |
| m7 | Overflow entries show title + date span; tooltip uses `aria-describedby` and viewport clamping |
| m8 | Duplicate outcome helper and public `applyCommandOutcome` removed; source comments no longer reference plans |
| m9 | `cssVars`-only geometry limitation documented |
| m10 | Combined print context/weekend CSS rule added |
| m11 | Adapter docs show the token mapping and state there is no design-system peer |
| m12 | Nested interactive host content is documented as warned, not prevented |
| m13 | Update/move/resize replace items in place, preserving order |

## Verification after fixes

| Check | Result |
|---|---|
| React tests | **136 passed** (20 files) |
| Core tests | **207 passed** |
| React coverage | **92.35% lines / 91.7% branches / 98.34% functions** |
| Core coverage | **99.43% lines / 96.08% branches / 100% functions** |
| `pnpm verify` | PASS |
| `pnpm verify:full` | PASS — Playwright 20 passed / 4 skipped, clean consumer |
| PDFs | 1 page (14 months), 2 pages (24), 3 pages (36), all A3 |
| Bundle | **44.11 kB gzip** / 60 kB |
| ESM guard | Built entry starts with `"use client"`; no `process.env`; import-only exports |

## Accepted notes

- AC3 remains partial per AR-27: host-button fixture and token adapters are
  proven; actual Fluent/MUI component examples belong to RD-11.
- RD-07 owns pointer gestures and the full selection matrix.
- RD-08 owns rollback, stale-response cancellation and accepted-not-applied.
- Annotation editing is host-owned in this slice (AR-31).
