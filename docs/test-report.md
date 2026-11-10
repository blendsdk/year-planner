# M1 Test Report — Year Planner for React

> **Date**: 2026-11-10
> **Scope**: M1 foundation, temporal core, classic layout and minimal React grid
> **Workflow**: CodeOps (`exec-plan`), M1 plan `codeops/features/year-planner/plans/m1-foundation-core/`
> **Verdict**: **PASS** for the M1 slice. M2–M4 behavior is not claimed.

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
| Core tests | **46 passed** |
| React tests | **7 passed** |
| Core coverage | **99.59% lines, 95.4% branches, 100% functions** |
| React coverage | **99.31% lines, 87.3% branches, 85.71% functions** |
| Playwright | **7 passed, 2 skipped** (PDF is Chromium-only) |
| Browsers | Chromium, Firefox, WebKit |
| A3 print | **1 page**, 1191.12 × 842.88 pt |
| Clean consumer | **PASS** — packed core + React installed and built |
| Storybook | **PASS** — static build succeeds |
| API Extractor | **PASS** — both reports checked in |
| TypeDoc | **PASS** — `docs/api/core` and `docs/api/react` generated |
| Bundle size | **8.98 kB gzip** including core, React and CSS; 60 kB budget |
| CI | **Green** — [run 42802501322](https://github.com/blendsdk/year-planner/actions/runs/42802501322), `verify` + `browsers` jobs |

The coverage thresholds are enforced by Vitest: core 95% and React 80% for
lines, branches, functions and statements.

## Specification evidence

| Area | Test files |
|---|---|
| Dates, ISO weeks, leap years | `packages/core/src/date.spec.test.ts`, `date.impl.test.ts` |
| Half-open intervals and subtraction | `packages/core/src/interval.spec.test.ts` |
| Periods and timed projection | `packages/core/src/period.spec.test.ts` |
| Classic layout and dynamic months | `packages/core/src/layout/classic-year.spec.test.ts`, `classic-year.impl.test.ts` |
| Public core entry | `packages/core/src/index.spec.test.ts` |
| Minimal React grid | `packages/react/src/YearPlanner.spec.test.tsx`, `YearPlanner.impl.test.tsx` |
| Visual and print | `tests/e2e/classic-year.spec.ts` |
| Clean consumer | `scripts/clean-consumer.sh` |
| Red phase | `docs/m1-red-phase.md` |

## Print evidence

The Playwright print test now asserts the PDF itself, not just a screenshot:

```text
Pages:      1
Page size:  1191.12 x 842.88 pts (A3)
```

The demo chrome is hidden in print, the grid is scaled to fit one A3 landscape
page, and a month row never splits across pages.

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
| Layers, visibility, annotations | Not implemented — M2 |
| Continuous ribbons, lanes, overflow | Not implemented — M2 |
| Selection, paint, erase, move, resize | Not implemented — M3 |
| Controlled commands, validation, rollback | Not implemented — M4 |
| Full accessibility audit and manual screen-reader pass | Not performed; WCAG conformance is not claimed |
| Mobile smoke tests | Not run |
| Real Edge/Safari smoke tests | Not run; Chromium approximates Edge and WebKit approximates Safari |
| Performance benchmarks (500/2k/10k items) | Not meaningful before ribbons/interactions; not run |
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
- The M1 execution plan is 48/48 tasks.
- No deferred feature is presented as implemented.
