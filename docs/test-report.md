# Test Report — Year Planner for React (M1 + M2 + RD-06 + RD-07)

> **Date**: 2026-11-11
> **Scope**: M1 foundation/temporal core/classic grid; M2 layers, visibility,
> paint/erase, ribbons, hit index and print planning; RD-06 rendered view,
> theming, slots, inspector, adapters and A3 print output; RD-07 pointer,
> keyboard and touch interaction, selection matrix, previews and focus
> **Workflow**: CodeOps (`exec-plan`), plans `m1-foundation-core`,
> `m2-layers-ribbons`, `m3-react-view` and `m4-interaction-engine`
> **Verdict**: **PASS** for the M1 + M2 + RD-06 + RD-07 slices. RD-08 lifecycle
> work is not claimed.

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
| Core tests | **207 passed** |
| React tests | **309 passed** (29 files) |
| Core coverage | **99.43% lines, 96.08% branches, 100% functions** |
| React coverage | **94.22% lines, 93.26% branches, 98.36% functions** |
| Playwright | **51 passed, 7 skipped** (PDF is Chromium-only; touch is Chromium-only) |
| Browsers | Chromium, Firefox, WebKit, Chromium touch |
| A3 print (M1 view) | **1 page**, 1191.12 × 842.88 pt |
| A3 print (RD-06 24 months) | **2 pages**, 1191.12 × 842.88 pt |
| A3 print (RD-06 36 months) | **3 pages**, 1191.12 × 842.88 pt |
| Clean consumer | **PASS** — packed core + React installed and built |
| Storybook | **PASS** — static build succeeds; **144 stories across 10 files** |
| API Extractor | **PASS** — reports checked in |
| TypeDoc | **PASS** — `docs/api/core` and `docs/api/react` generated |
| Bundle size | **54.10 kB gzip** including core, React, adapters and CSS; 60 kB budget |
| Module format | **ESM-only** — `"type": "module"`, import-only exports, ES build |
| CI | **Green** — [run 42922446935](https://github.com/blendsdk/year-planner/actions/runs/42922446935), `verify` + `browsers` jobs |

The coverage thresholds are enforced by Vitest: core 95% and React 80% for
lines, branches, functions and statements.

## RD-07 evidence

| Area | Evidence |
|---|---|
| Modes | `auto`, `inspect`, `select`, `paint`, `erase`, `create`, `move`, `resize`; modes are a TypeScript union; no runtime mode validator is claimed |
| Selection | Plain/Shift/Ctrl/Cmd date and item matrix; anchor/focus transitions; visual-order item ranges; merged/split ranges; Ctrl/Cmd+A; reserved Ctrl/Cmd+Shift |
| Pointer | Grid-root delegation, 4 px threshold, pointer capture, rAF move coalescing, edge auto-scroll, lost-capture cancel, one-shot click suppression |
| Commands | Move, resize, paint, erase, create and delete through the existing pipeline; duration/grab offset; one-day minimum; disabled ranges rejected |
| Preview | Per-row clipped date/move/resize/paint/create previews; fixed marquee; invalid red preview; `pointer-events: none` |
| Keyboard | Arrows skip disabled dates; Shift+Arrow range; Space toggle; Enter inspector; Escape cancel/clear; Delete focused/sole item |
| Focus | Commit focus restoration; hidden/removed item pruning; nearest enabled-date fallback; polite live region; controlled selection sync |
| Touch | `off`/`auto` stay scroll-first with `touch-action: auto`; `on` enables editing with `touch-action: none`; real touch E2E |
| Undo | Uncontrolled move/resize/paint/erase/create/update/delete; redo cleared by a new edit; controlled mode reports `UNDO_UNAVAILABLE` |
| Host controls | Host buttons/inputs in cells keep pointer and key events; no nested control inside an item proxy |
| Security | Hidden/locked/timed/annotation items cannot start edits; no phantom dates; diagnostics carry no hidden payload |

## RD-06 evidence

| Area | Evidence |
|---|---|
| Public view | 14/36-month grid, 39 CSS tracks, 37 ARIA columns, sticky header/footer, zoom 0.75–1.5, scroll container and `scrollToDate` |
| Items | Cross-month fragments, exact slot widths, deterministic lanes, one focus proxy per item (one tab stop) |
| Annotation/overflow | Annotation badges, compact 3-lane plus `+N` popover, hidden exclusion |
| Tooltip | Default title/date span and `renderTooltip` replacement |
| Cells | `getDateMeta` background/text/label/ARIA/holiday/disabled/content and annotation overlay |
| Slots | `renderCell`, `renderItem`, `renderAnnotation`, `renderOverflow`, `renderEmpty`, `renderInspector`, `renderTooltip`; structural `components` |
| Proxy contract | `role="button"` proxy, no nested interactive controls, sibling resize handles, `aria-pressed` selection |
| Theming | 24 tokens, five presets, provider, `cssVars`, implemented `unstyled`, `data-yp-theme` |
| State | Controlled/uncontrolled items/visibility/selection/filter; dev warnings; deterministic seeding |
| Commands | Local read-only/version/period checks, host validation, timeout, accept/reject, retry/dismiss, uncontrolled undo/redo, annotation host-ownership |
| Inspector | Details, visibility/editability, overflow, create/move/resize/paint/erase/delete, keyboard reachable |
| Adapters | Fluent UI v9 and MUI token mappings; real Buttons proven in a dev-only demo fixture across three browsers; no design-system dependency in the library |
| Print | Hidden per-page tree, 37 headers/footers, 1/2/3 A3 pages, per-page scale, labels/weekends/ISO weeks/ribbons |
| SSR | Node `renderToString` plus jsdom hydration with no mismatch errors |
| CSP | Documented `style-src-attr 'unsafe-inline'`; Playwright CSP-header test |
| Security | Metadata never rendered; item style and color allowlist; hidden data and stale tooltips excluded |

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
| Shared contracts | `packages/core/src/contracts.spec.test.ts`, `model/selection.impl.test.ts` |
| Theme and provider | `packages/react/src/theme.spec.test.tsx`, `theme.impl.test.tsx` |
| View shell, state and geometry | `YearPlanner.spec.test.tsx`, `YearPlanner.ssr.spec.test.tsx`, `YearPlanner.hydration.spec.test.tsx`, `YearPlanner.impl.test.tsx`, `geometry.impl.test.tsx`, `state.impl.test.tsx` |
| Items, annotations and slots | `items.spec.test.tsx`, `items.impl.test.tsx` |
| Commands | `commands.spec.test.tsx`, `commands.impl.test.tsx` |
| Inspector | `inspector.spec.test.tsx`, `inspector.impl.test.tsx` |
| Print and adapters | `print.spec.test.tsx`, `print.impl.test.tsx`, `adapters.spec.test.tsx`, `adapters.impl.test.tsx`, `styles.spec.test.tsx` |
| Interaction | `packages/react/src/interaction/selection.spec.test.tsx`, `gesture.spec.test.tsx`, `pointer.spec.test.tsx`, `keyboard.spec.test.tsx`, `interaction.integration.spec.test.tsx` |
| Interaction impl | `packages/react/src/interaction/selection.impl.test.tsx`, `gesture.impl.test.tsx`, `pointer.impl.test.tsx`, `keyboard.impl.test.tsx` |
| Interaction E2E | `tests/e2e/interaction.spec.ts`, `tests/e2e/interaction-touch.spec.ts` |
| Integration | `packages/react/src/integration.spec.test.tsx` |
| E2E | `tests/e2e/classic-year.spec.ts` |
| Red phases | `docs/m1-red-phase.md`, `docs/m2-red-phase.md`, `docs/m3-red-phase.md`, `docs/m4-red-phase.md` |

## Print evidence

The Playwright suite generates real Chromium PDFs:

```text
rd06-24-months-a3.pdf: Pages 2, 1191.12 x 842.88 pts (A3)
rd06-36-months-a3.pdf: Pages 3, 1191.12 x 842.88 pts (A3)
classic-2016-a3.pdf:   Pages 1, 1191.12 x 842.88 pts (A3)
```

Each RD-06 page uses its core-planned uniform scale and repeats the weekday
header, month labels, weekend tints, ISO weeks, ribbons and annotations.

## API documentation

API Extractor reports are committed at:

- `packages/core/etc/year-planner-core.api.md`
- `packages/react/etc/react-year-planner.api.md`

TypeDoc generates `docs/api/core/index.html`, `docs/api/react/index.html` and a
landing page at `docs/api/index.html`. Generated HTML is not committed.

## Known gaps and honest limitations

| Gap | Status |
|---|---|
| Full command lifecycle: rollback, stale responses, accepted-not-applied | Not implemented — RD-08 |
| Batch multi-move, alt+drag subtraction, drag between layers/resources | Deferred from R1 |
| Native touch-scroll E2E | Touch gating and `touch-action` are tested; full scroll physics is RD-10 |
| Controlled-host undo history | Not implemented; rejected with `UNDO_UNAVAILABLE` |
| Fluent UI v9/MUI example stories | Real Buttons are proven in the demo fixture; Storybook examples remain RD-11 polish |
| Annotation editing | Rendered but host-owned in this slice (AR-31) |
| Geometry via arbitrary `cssVars` | CSS variables change visually; use theme tokens or `units` for layout geometry |
| Full axe and manual screen-reader audit | Not performed; WCAG conformance is not claimed |
| Performance benchmarks (500/2k/10k items) | Not run |
| Mobile touch and RTL | Touch editing and marquee are implemented; RTL-specific pointer behavior is not |
| SVG shape plane and `edge-path` connectors | Deferred; `edge-path` emits `INVALID_RENDERER_OPTION` |
| Published packages | Not published; pre-alpha |
| Cross-browser PDF output | Chromium baseline only |

## Toolchain note

Vite 8 / Vitest 5 crashed with `Illegal instruction` on the reference CPU
(Intel i5-3470S, no AVX2) through the Rolldown native binding. The verified
fallback is **Vite 7.3.8 + Vitest 3.2.7**, recorded in plan AR #15 and
requirements AR #79. Vite 8 / Vitest 5 remain the target on compatible hardware.
React 19-only is the support policy (requirements AR #80).

## Repository state

- MIT license, DCO, no CLA.
- ESM-only package; no CJS/UMD build.
- `pnpm verify` and `pnpm verify:full` pass locally.
- M1 plan: 48/48 tasks; M2 plan: 46/46; RD-06 plan: 46/46; RD-07 plan: 33/33.
- No deferred feature is presented as implemented.
