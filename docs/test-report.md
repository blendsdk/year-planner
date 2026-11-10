# Test Report — Year Planner for React (M1 + M2)

> **Date**: 2026-11-10
> **Scope**: M1 foundation/temporal core/classic grid; M2 layers, visibility,
> paint/erase, ribbon geometry, hit index and print planning
> **Workflow**: CodeOps (`exec-plan`), plans `m1-foundation-core` and
> `m2-layers-ribbons`
> **Verdict**: **PASS** for the M1 + M2 core slices. Renderer, interaction and
> command behavior is not claimed.

---

## Commands

```bash
pnpm install --frozen-lockfile
pnpm verify
pnpm verify:full
pnpm test:size
pnpm test:consumer
pnpm run docs
```

`verify` runs:

```text
toolchain check → typecheck → lint → unit/component coverage → build
→ API Extractor report check → bundle size → Storybook build → TypeDoc
→ publint/attw
```

`verify:full` adds Playwright and the clean-consumer install.

## Results

| Check | Result |
|---|---|
| Core tests | **203 passed** |
| React tests | **7 passed** |
| Core coverage | **99.43% lines, 96.06% branches, 100% functions** |
| React coverage | **99.31% lines, 87.3% branches, 85.71% functions** |
| Playwright | **7 passed, 2 skipped** (PDF is Chromium-only) |
| Browsers | Chromium, Firefox, WebKit |
| A3 print (M1 view) | **1 page**, 1191.12 × 842.88 pt |
| Clean consumer | **PASS** — packed core + React installed and built |
| Storybook | **PASS** — static build succeeds |
| API Extractor | **PASS** — both reports checked in |
| TypeDoc | **PASS** — `docs/api/core` and `docs/api/react` generated |
| Bundle size | **8.98 kB gzip** including core, React and CSS; 60 kB budget |
| CI | **Green** — [run 42821164337](https://github.com/blendsdk/year-planner/actions/runs/42821164337), `verify` + `browsers` jobs |

The coverage thresholds are enforced by Vitest: core 95% and React 80% for
lines, branches, functions and statements.

## Specification evidence

| Area | Test files |
|---|---|
| Dates, ISO weeks, leap years | `packages/core/src/date.spec.test.ts`, `date.impl.test.ts` |
| Half-open intervals and subtraction | `packages/core/src/interval.spec.test.ts` |
| Periods and timed projection | `packages/core/src/period.spec.test.ts` |
| Classic layout and dynamic months | `packages/core/src/layout/classic-year.spec.test.ts`, `classic-year.impl.test.ts` |
| Entity model and validation | `packages/core/src/model/validation.spec.test.ts`, `validation.impl.test.ts` |
| Visibility, filters and editability | `packages/core/src/model/visibility.spec.test.ts`, `visibility.impl.test.ts` |
| Paint and erase | `packages/core/src/model/paint.spec.test.ts`, `paint.impl.test.ts` |
| Ribbon fragments, lanes and overflow | `packages/core/src/ribbon/fragments.spec.test.ts`, `fragments.impl.test.ts` |
| Hit index | `packages/core/src/ribbon/hit-index.spec.test.ts`, `hit-index.impl.test.ts` |
| Print planning | `packages/core/src/ribbon/print.spec.test.ts`, `print.impl.test.ts` |
| End-to-end core pipeline | `packages/core/src/integration.spec.test.ts` |
| Minimal React grid | `packages/react/src/YearPlanner.spec.test.tsx`, `YearPlanner.impl.test.tsx` |
| Visual and print | `tests/e2e/classic-year.spec.ts` |
| Clean consumer | `scripts/clean-consumer.sh` |
| Red phase | `docs/m1-red-phase.md`, `docs/m2-red-phase.md` |

## M2 core evidence

| Area | Evidence |
|---|---|
| Non-blanking validation | Invalid entities dropped, valid siblings preserved; diagnostics are redacted (ST-1–ST-13, ST-64, ST-76) |
| Visibility precedence | Group → layer → item → filter → channel; hidden parent always wins (ST-14–ST-19) |
| Filters | Layer/resource/status allowlists and trimmed case-insensitive search (ST-20–ST-22) |
| Editability | Global/item/layer/policy/mode precedence and create/delete checks (ST-25–ST-30, ST-65–ST-68, ST-78) |
| Paint/erase | Atomic union/subtract, new IDs, `version: 1`, full affected result set (ST-31–ST-42, ST-69–ST-71, ST-81) |
| Fragments | Cross-month/year clipping, exact slot widths, continuation flags (ST-43–ST-46, ST-73) |
| Lanes | Deterministic sort, previous-row reuse, repacking after hide (ST-45, ST-47, ST-52–ST-54, ST-72) |
| Overflow | Compact 3 lanes + 17 overflow for 20 items; expanded 20 lanes; hidden items excluded (ST-48–ST-50, ST-80) |
| Channels | Background/annotation/foreground do not consume lanes (ST-58, ST-74) |
| Signature | Stable for identical inputs; changes with item, visibility and window (ST-55) |
| Hit index | Absolute bounds, half-open hit test, topmost shape (ST-56, ST-75) |
| Print planning | 1/2/3 pages at 12–14/15–28/29–36; per-page fit; 7 pt warning (ST-59–ST-63, ST-79) |

## Integration evidence

`packages/core/src/integration.spec.test.ts` runs the full core pipeline for
12, 24 and 36 months:

```text
validatePlannerData → createInitialVisibility → buildRibbonLayout
→ createRibbonHitIndex → planRibbonPrint
```

Assertions: the invalid item is dropped without blanking valid data, the valid
booking has three fragments, the annotation stays on its channel, the hit index
returns all fragments, and the print plan has 1/2/3 pages.

## Print evidence

The M1 Playwright test asserts the PDF itself:

```text
Pages:      1
Page size:  1191.12 x 842.88 pts (A3)
```

M2 adds pure page planning. With the classic 1,995 px width and 6 mm side
margins, a 14-row page scales to `1542 / 1995 ≈ 0.773`. Date text at that scale
is about 6.96 pt, so `fit` mode correctly reports `PRINT_FIT_TOO_SMALL` and
`requiresPaginate`. Paginate remains the default and keeps the 1/2/3-page
boundaries.

## API documentation

API Extractor reports are committed at:

- `packages/core/etc/year-planner-core.api.md`
- `packages/react/etc/react-year-planner.api.md`

TypeDoc generates `docs/api/core/index.html` and `docs/api/react/index.html`
with a landing page at `docs/api/index.html`. Generated HTML is not committed.

## Renderer evidence

The M0 gate compared HTML-only, HTML + SVG shape plane, SVG shapes with HTML
proxies and a limited full-SVG row. All 12 browser/variant combinations had:

- 14 rows, 518 slots, 427 dated cells;
- 0 misaligned ribbons/proxies (max 0.5 px in Firefox);
- working date keyboard focus, including the SVG row;
- 0 axe serious/critical violations.

Chromium printed every variant on one A3 page. The decision is recorded in
[ADR 0001](adr/0001-renderer-strategy.md) and
[the spike report](renderer-spike.md).

## Known gaps and honest limitations

| Gap | Status |
|---|---|
| Ribbon DOM, proxies, labels, overflow popover, inspector | Not implemented — RD-06 |
| Controlled `visibility`/`onVisibilityChange` React props | Core reducer delivered; React wiring is RD-06 |
| Selection, move, resize, marquee, keyboard interaction | Not implemented — RD-07 |
| Controlled commands, dispatcher, rollback | Not implemented — RD-08; paint/erase helpers exist |
| Optional `edge-path` gutter connectors | Deferred to RD-06 with the SVG shape plane (AR-21) |
| Actual 18/24/36-month printed PDFs and PRT-01 | Core page plans exist; rendered print verification is RD-06/RD-10 |
| Timed highlight paint/erase | Skipped by design (AR-34); timed items still render as fragments |
| 14-month `fit` print | Warns because the classic width prints date text at about 6.96 pt |
| Full accessibility audit and manual screen-reader pass | Not performed; WCAG conformance is not claimed |
| Mobile smoke tests | Not run |
| Real Edge/Safari smoke tests | Not run; Chromium approximates Edge and WebKit approximates Safari |
| Performance benchmarks (500/2k/10k items) | Not run; ribbon geometry is deterministic but not benchmarked |
| Firefox/WebKit PDF output | Not supported by Playwright; Chromium baseline only |
| Localized labels and RTL | Labels are `en-US`; RTL is deferred |
| Published packages | Not published; pre-alpha |

## Toolchain note

Vite 8 / Vitest 5 crashed with `Illegal instruction` on the reference CPU
(Intel i5-3470S, no AVX2) through the Rolldown native binding. The verified
fallback is **Vite 7.3.8 + Vitest 3.2.7**, recorded in plan AR #15 and
requirements AR #79. Vite 8 / Vitest 5 remain the target on compatible hardware.
React 19-only is the support policy (requirements AR #80).

## Repository state

- MIT license, DCO, no CLA.
- `pnpm verify` and `pnpm verify:full` pass locally.
- The M1 execution plan is 48/48 tasks; the M2 plan is 46/46.
- No deferred feature is presented as implemented.
