# Test Report — Year Planner for React (RD-01 through RD-12)

> **Date**: 2026-11-12
> **Scope**: M1 foundation/temporal core/classic grid; M2 layers, visibility,
> paint/erase, ribbons, hit index and print planning; RD-06 rendered view,
> theming, slots, inspector, adapters and A3 print output; RD-07 pointer,
> keyboard and touch interaction, selection matrix, previews and focus;
> RD-08 controlled commands, validation, versions, rollback and
> accepted-not-applied handling; RD-09 accessibility semantics, focus, live
> regions, contrast and axe evidence; RD-10 traceability, browser/visual/print
> matrices, timezone and SSR evidence, performance budgets, issue #3
> optimization, security/privacy gates, dependency audit and CI evidence;
> RD-11 documentation, Storybook and API reference; RD-12 release versioning,
> OIDC automation, package metadata, governance and the release checklist
> **Workflow**: CodeOps (`exec-plan`), plans `m1-foundation-core`,
> `m2-layers-ribbons`, `m3-react-view`, `m4-interaction-engine`,
> `m5-controlled-commands`, `m6-accessibility`, `m7-quality-gates`,
> `m8-documentation` and `m9-release-maintenance`
> **Verdict**: **PASS** for RD-01 through RD-12, with the release-time owner
> actions recorded in `docs/releasing.md`. The manual NVDA/VoiceOver audit
> remains parked; no WCAG conformance claim is made.

---

## Commands

```bash
pnpm install --frozen-lockfile
pnpm verify
pnpm verify:full
pnpm test:quality
pnpm test:timezones
pnpm test:audit
pnpm test:licenses
pnpm test:environment
pnpm test:perf            # report mode; PERF_STRICT=1 gates the issue #3 oracle
pnpm bench                # report-first; --enforce gates the 2x ceiling
pnpm test:flaky           # triage only (repeat-each=3, Chromium)
pnpm test:consumer
pnpm run docs
```

`verify` runs:

```text
toolchain check → package and tools typecheck → lint → unit/component coverage
→ quality contracts → license report check → build → API Extractor report check
→ bundle size → Storybook build → TypeDoc → publint/attw
```

`verify:full` adds Playwright, the three-timezone suite, the dependency audit, the
performance budget run, the benchmark orchestrator and the clean-consumer install.

## Results

| Check | Result |
|---|---|
| Core tests | **220 passed** |
| React tests | **508 passed** (47 files) |
| Core coverage | **99.00% lines, 95.88% branches, 99.50% functions** |
| React coverage | **94.01% lines, 85.60% branches, 94.98% functions** |
| Playwright | **143 passed, 40 skipped** (PDF and axe are Chromium-only; forced-colors is Chromium-only; touch is Chromium-only; one pending-preview timing test is quarantined on all desktop engines) |
| Browsers | Chromium, Firefox, WebKit, Pixel 5 Chromium, iPhone 13 WebKit, Chromium touch |
| A3 print (M1 view) | **1 page**, 1191.12 × 842.88 pt |
| A3 print (RD-06 24 months) | **2 pages**, 1191.12 × 842.88 pt |
| A3 print (RD-06 36 months) | **3 pages**, 1191.12 × 842.88 pt |
| Quality tests | **185 passed** (traceability, public API, coverage, size, CI, package, license, audit, environment and release contracts) |
| Dependency audit | **PASS** — no high or critical advisories; two moderate dev-only (`glob`, `minimatch`) accepted |
| Licenses | **PASS** — `THIRD_PARTY_NOTICES.md` current |
| Clean consumer | **PASS** — packed types (`tsc --noEmit`), CSS import and production build; registry mode added for post-release |
| Storybook | **PASS** — static build succeeds; **176 stories across 13 files** |
| API Extractor | **PASS** — reports checked in |
| TypeDoc | **PASS** — `docs/api/core` and `docs/api/react` generated |
| Bundle size | **React entry + CSS 43.63 kB gzip / 60 kB**; **total 66.86 kB gzip / 68 kB** (core, React, adapters and CSS) |
| Module format | **ESM-only** — `"type": "module"`, import-only exports, ES build |
| CI | `verify`, `browsers`, `security`, `performance` and `dco` jobs configured; browser evidence and benchmark artifacts uploaded |
| Browser versions | Chromium 158.0.8127.18, Firefox 159.0, WebKit 27.2 (Playwright 1.65.0) |
| Timezones | **220 core tests pass under each of UTC, Pacific/Kiritimati and America/Los_Angeles** (660 runs total; final gate) |

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
| Accessibility | `a11y.spec.test.tsx`, `a11y.impl.test.tsx`, `announcements.spec.test.tsx`, `announcements.impl.test.tsx`, `accessibility.spec.test.tsx`, `accessibility.impl.test.tsx`, `interaction/row.spec.test.tsx`, `interaction/row.impl.test.tsx`, `styles.spec.test.tsx` |
| Accessibility E2E | `tests/e2e/accessibility.spec.ts` (eight axe states plus keyboard, skip link, hidden item) |
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

## RD-08 evidence

| Area | Evidence |
|---|---|
| Request identity | One ID per request; active/settled/obsolete state; collision suffix; late and obsolete responses ignored |
| Context | Optional `baseRevision`; optional `AbortSignal` third argument on validation and request callbacks |
| Validation | Local checks first; error diagnostics block even when permitted; warnings/info display as inspector notices |
| Versions | Positive-integer item versions; `expectedVersion` on update/move/resize/delete; `expectedVersions` on paint; `STALE_REVISION` |
| Outcomes | Runtime normalization; malformed outcomes map to `HOST_REJECTED`; accepted paint coverage is proved |
| Pending | Pending item outline and `aria-busy`; gesture preview retained until settlement; one command per item |
| Rollback | Preview clears; focus returns to the source item; paint/create fall back to the gesture date; selection is preserved |
| Accepted-not-applied | Controlled props are checked immediately and on change; timeout produces `ACCEPTED_NOT_APPLIED` and reverts |
| Retry | Explicit host rejection, thrown call and timeout matrix; no delete, timed-out create/paint or stale replay |
| Uncontrolled parity | Same reducer, version increments, paint residuals and undo/redo; controlled mode reports `UNDO_UNAVAILABLE` |
| Browser evidence | `tests/e2e/commands.spec.ts` in Chromium, Firefox and WebKit: accept, reject, stale, timeout, never-apply, warning, pending preview and capacity mock |
| Security | Diagnostics render as text; local hidden-item diagnostics omit titles/dates; host prose is host-owned; no authorization inferred |

## RD-09 evidence

| Area | Evidence |
|---|---|
| Semantics | Root region, labelled grid, `aria-selected` cells, 37 columns, generated shortcut description, item names with period/layer/pattern/status/selection/clipping |
| Grid structure | Item proxies moved to a grid-sibling overlay; axe `aria-required-children` passes in every scanned state |
| Focus | One roving tab stop for cells, proxies and the active row’s overflow; Home/End row bounds; disabled-date fallback |
| Skip link | First focusable planner control opens the inspector and focuses the item list |
| Item list | Visible, keyboard-reachable list with rendered-fragment filtering, overflow markers and hidden-item exclusion |
| Live regions | Visible status bar; hidden polite and assertive regions; pending/accepted/rejected/timeout/stale/aborted/not-applied mapped once |
| Contrast | Computed per-fragment text colour; all built-in presets pass 4.5:1 ribbon text and 3:1 focus/border |
| Target size | 24 px lanes, 24×24 resize handles, 24 px overflow, 28 px overflow entries, 26 px inspector buttons |
| Non-colour cues | Selected outline/weight/underline, dotted holiday underline, `+N` overflow, layer patterns/labels |
| Media | Forced-colours borders/outlines, reduced-motion rules, print hides status/skip/live regions |
| Automated axe | Eight states: blue, yellow, high-contrast, compact, expanded, overflow dialog, command error, AC3 Fluent/MUI and 36 months — all zero serious/critical |
| Keyboard E2E | Arrow/Shift+Arrow/Space/Enter, one tab stop per composite, skip link, move-by-week, hidden-item fallback, no nested proxy controls |
| Manual AT | **Parked by user decision 2026-11-11**; Orca attempt recorded; no NVDA/VoiceOver run; no WCAG conformance claim |

## Performance baseline (RD-10, issue #3)

> **Command**: `pnpm bench --out docs/benchmarks/rd10-baseline` (the 10k cases were run in short
> chunks under one run id on the 14 GiB reference host; the aggregator writes the same report).
> **Environment**: Intel Core i5-3470S (4 vCPU), 15 GB, Ubuntu 26.04, Node 24.21.0,
> Playwright 1.65.0, production preview at 1600×1200.
> **Run**: `2026-11-11T20:30:00.000Z`
> **Status**: pre-optimization baseline. Values above the budget are recorded, not hidden.

| Scenario | n | p50 | p95 | Budget | Status |
|---|---:|---:|---:|---:|---|
| Layout 10,000 items, compact | 10 | 88.16 ms | 108.07 ms | 250 ms | pass |
| Layout 10,000 items, expanded | 10 | 108.61 ms | 295.20 ms | 250 ms | miss |
| Initial render 500 items | 5 | 414.40 ms | 565.40 ms | 150 ms | fail |
| Initial render 2,000 items | 5 | 2,167.90 ms | 2,247.60 ms | 150 ms | fail |
| Initial render 10,000 items | 5 | 41,920.00 ms | 50,457.90 ms | 150 ms | fail |
| Initial render 12/14/18/24/36 months | 5 | 401–543 ms | 420–615 ms | 150 ms | fail |
| Drag 500 items, compact | 263 | 16.70 ms | 33.40 ms | 16.7 ms | fail |
| Drag 2,000 items, compact | 260 | 16.70 ms | 300.00 ms | 16.7 ms | fail |
| Drag 10,000 items, compact (10 steps) | 49 | 16.70 ms | 8,916.40 ms | 16.7 ms | fail |
| Drag 500 items, expanded | 260 | 16.70 ms | 33.40 ms | 16.7 ms | fail |
| Drag 500 items, 36 months | 269 | 16.70 ms | 100.00 ms | 16.7 ms | fail |
| Overflow open/close, 10,000 items | 5 | 93.50 ms | 115.30 ms | 100 ms | miss |
| Issue #3 production drag, 500 items | 3 | — | 33.40 ms | 16.7 ms | miss |
| Issue #3 development drag, 500 items | 268 | 16.70 ms | 416.60 ms | 16.7 ms | fail |

The production 500-item drag is **33.4 ms p95**; the development drag is **416.6 ms p95**, a
development-overhead factor of about 12×. CPU profiles are captured under
`test-results/bench/profiles`, named with the run id (`issue-3-production`, `issue-3-dev`,
`36-month-500`).

`pnpm bench` is report-first so this baseline can be recorded honestly.
`pnpm bench --enforce` and `PERF_STRICT=1 pnpm test:perf` gate the 2× ceiling and the issue #3
oracle after the optimization. The 10,000-item drag records 10 steps because the 14 GiB reference
host cannot complete 60 steps without exhausting memory; the sample count is printed beside every
p95.

## Post-optimization results (issue #3)

> **Command**: `pnpm bench --out docs/benchmarks/rd10-after` (same chunked reference-host method)
> **Run**: `2026-11-11T21:30:00.000Z`
> **Change**: row/cell/item/print/inspector memoization, stable interaction and command inputs,
> per-row preview isolation and a preview-content comparator. No virtualization or external store.

| Scenario | Before p95 | After p95 | Long tasks before → after |
|---|---:|---:|---:|
| Drag 500 items, compact | 33.40 ms | **16.70 ms** | 27 → 2 |
| Drag 2,000 items, compact | 300.00 ms | **16.80 ms** | 62 → 2 |
| Drag 10,000 items, compact (10 steps) | 8,916.40 ms | **66.60 ms** | 20 → 9 |
| Drag 500 items, expanded | 33.40 ms | **16.80 ms** | 45 → 2 |
| Drag 500 items, 36 months | 100.00 ms | **16.70 ms** | 62 → 4 |
| Issue #3 production drag, 500 items | 33.40 ms | **16.70 ms** | 64 → 4 |
| Issue #3 development drag, 500 items | 416.60 ms | **16.70 ms** | 62 → 2 |
| Overflow open/close, 10,000 items | 115.30 ms | 118.30 ms | — |
| Initial render 500 items | 565.40 ms | 666.20 ms | — |
| Initial render 10,000 items | 50,457.90 ms | 43,436.20 ms | — |

The production 500-item drag now meets the 16.7 ms frame budget. The issue #3 oracle
(`after p95 ≤ 0.9× baseline or ≤ 16.7 ms`, three repeats, no long-task or input-delay regression)
passes under `PERF_STRICT=1 pnpm test:perf`.

Two results remain documented misses rather than claims:

- **Overflow with 10,000 items** stays around 118 ms against the 100 ms budget; the overflow list
  itself is unchanged by this optimization.
- **Initial render** (500/2k/10k) is still far above the 150 ms budget. It is measured and recorded
  but not claimed; the issue #3 scope was interaction responsiveness. The 10,000-item drag remains a
  stress case with 10 steps and a recorded ceiling exemption.

## Known gaps and honest limitations

| Gap | Status |
|---|---|
| Full command lifecycle: rollback, stale responses, accepted-not-applied | Implemented — RD-08 |
| Batch multi-move, alt+drag subtraction, drag between layers/resources | Deferred from R1 |
| Native touch-scroll E2E | Touch gating and `touch-action` are tested; full scroll physics is RD-10 |
| Controlled-host undo history | Not implemented; rejected with `UNDO_UNAVAILABLE` |
| Fluent UI v9/MUI example stories | Real Buttons are proven in the demo fixture; accessibility stories cover the states |
| Annotation editing | Rendered but host-owned in this slice (AR-31) |
| Geometry via arbitrary `cssVars` | CSS variables change visually; use theme tokens or `units` for layout geometry |
| Full axe audit | Automated axe matrix green in Chromium; no serious/critical violations |
| Manual NVDA/VoiceOver audit | **Parked by user decision 2026-11-11** — low priority, not an R1 blocker, no Linux path; WCAG conformance is not claimed |
| Performance benchmarks (500/2k/10k items) | Before/after evidence in `docs/benchmarks/rd10-baseline.md` and `rd10-after.md`; drag now 16.7 ms p95. Initial render and 10k overflow remain documented misses |
| Pending-preview E2E | One geometry-sensitive timing test is `fixme` on all desktop engines. The state is covered by the React command tests and standalone probes (5/5 runs: preview present, command state `pending`). Revisit with a serial drag run before release |
| 36-month drag variance | 16.7–33.3 ms p95 across repeated runs; the checked-in after run recorded 16.7 ms and the budget is met or missed within one frame |
| React entry tree-shaking | The published entry is a single-file ESM bundle, so importing one export retains the component. The consumer proof asserts packed types, the CSS import and a production build; per-export module splitting is deferred and no tree-shaking claim is made |
| Mobile touch and RTL | Touch editing and marquee are implemented; RTL-specific pointer behavior is not |
| SVG shape plane and `edge-path` connectors | Deferred; `edge-path` emits `INVALID_RENDERER_OPTION` |
| Published packages | Not published; pre-alpha |
| Cross-browser PDF output | Chromium baseline only |

## Toolchain note

Vite 8 / Vitest 5 crashed with `Illegal instruction` on the reference CPU
(Intel i5-3470S, no AVX2) through the Rolldown native binding. The verified
fallback is **Vite 7.3.8 + Vitest 4.1.12**, recorded in plan AR #15 and
requirements AR #79. Vite 8 / Vitest 5 remain the target on compatible hardware.
React 19-only is the support policy (requirements AR #80). Vitest 4.1.12 removes the critical
`tinypool` advisories; the two remaining moderate advisories are development-only.


## RD-12 — Release, versioning and maintenance

> **Date**: 2026-11-12
> **Scope**: lockstep `0.2.0`, package metadata and changelogs, the human
> release PR, the manual OIDC release workflow, governance/support documents
> and the release checklist.
> **Verdict**: release automation and evidence are complete; the first live
> publication, repository visibility change, environment creation and branch
> protection remain maintainer actions.

### Commands and results

| Command | Result |
| ------- | ------ |
| `pnpm verify` | PASS — 220 core, 508 React, 185 quality tests |
| `pnpm release:check` | PASS — versions, changelogs, tarballs, source maps and `npm pack --dry-run` |
| `pnpm release:publish --dry-run --allow-dirty` | PASS — core then React packed, validated and published in npm dry-run mode; no upload |
| `node scripts/apply-branch-protection.mjs --record` | PASS (exit 0) — records the private-repo HTTP 403 and the missing second reviewer |
| `pnpm changeset status --since=origin/main` | PASS — no pending changesets; the release tree is versioned |
| `bash -n scripts/clean-consumer.sh` | PASS — registry and packed modes parse |

### What changed

- Both packages are at `0.2.0` with generated changelogs, package READMEs,
  checked-in LICENSE copies and complete publish metadata.
- `scripts/release-check.mjs` validates versions, changelogs, tarballs, source
  maps and the npm dry-run allowlist; `release:publish` refuses pending
  changesets.
- `scripts/release-publish.mjs` packs with pnpm, verifies the exact core
  dependency, compares published integrity, publishes core before React with
  npm provenance, and creates one `v<version>` GitHub release.
- `.github/workflows/release.yml` is manual, main-only and environment-guarded;
  its build job has no `id-token`, and its publish job installs nothing.
- Every workflow action is pinned to a full commit SHA; PRs get an
  informational `changeset status` check.
- `SUPPORT.md`, an expanded `SECURITY.md`, path-specific `CODEOWNERS`, grouped
  Dependabot updates and `docs/releasing.md` cover governance and support.
- `scripts/apply-branch-protection.mjs` checks/applies the required checks,
  one approval, no direct pushes and the second-reviewer prerequisite.

### Release-time owner actions

- Run `npm login`, `pnpm release:publish --bootstrap --skip-github-release` for
  `0.2.0`, configure the npm trusted publisher, then publish `0.2.1` through
  the workflow within the two-day validation window.
- Enable private vulnerability reporting, Dependabot alerts and Pages; create
  the `npm-production` environment; make the repository public; add a second
  reviewer; apply branch protection.
- The first OIDC release produces the provenance attestation; the `0.2.0`
  bootstrap does not.

### Known gaps

- The live npm publication and the GitHub release were not executed in this
  environment (no npm authentication, private repository).
- Branch protection is unavailable on the current private plan.
- The manual NVDA/VoiceOver audit remains parked; no WCAG conformance claim.

## Repository state

- MIT license, DCO, no CLA.
- ESM-only package; no CJS/UMD build.
- `pnpm verify` and `pnpm verify:full` pass locally.
- M1 plan: 48/48 tasks; M2 plan: 46/46; RD-06 plan: 46/46; RD-07 plan: 33/33; RD-09 plan: 55/55.
- No deferred feature is presented as implemented.

## RD-11 — Documentation, Storybook and API reference

> **Date**: 2026-11-12
> **Scope**: the guide set, Storybook states, TSDoc/API Extractor/TypeDoc, the
> docs-site artifact and the demo evidence.

### Commands and results

| Command | Result |
| ------- | ------ |
| `pnpm verify` | PASS — 220 core, 508 React, 138 quality tests |
| `pnpm api-report:ci` | PASS — both reports checked in, no warnings |
| `pnpm docs:build` | PASS — TypeDoc core and React, 0 warnings with fatal validation |
| `pnpm storybook:build` | PASS — 176 stories across 13 files |
| `pnpm docs:site` | PASS — 241 files; Storybook at `/`, TypeDoc at `/api` |
| `pnpm docs:site -- --check-only` | PASS — the built artifact resolves every relative asset and landing link |
| `pnpm verify:full` | PASS — 143 E2E passed / 40 skipped; timezone suite 220 × 3; perf 7 passed / 1 skipped; bench 8 passed / 8 skipped; clean consumer PASS |
| Final tree re-check | The release gate above ran on the final product code. Two later `pnpm verify` re-runs under host load average > 9 hit timer-sensitive failures (inspector resize, axe 36-month); each failed test passed alone. The affected suites are unchanged by the documentation work. |

### What changed

- Fourteen topic guides plus the commands, security and architecture pages;
  `docs/README.md` maps every topic.
- The README quickstart renders a 14-month view from static data with controlled
  selection and visibility and a print action. The install note is honest: the
  packages are not on a public registry, so the packed-tarball path is documented.
- Storybook adds the exact 2017 classic-yellow PRT-01 print story and Fluent/MUI
  provider wrapper stories, and configures the built-in Storybook 10 viewport.
- TSDoc covers every public report entry, `@public` tags are on the public source
  surface, and `@example` is bound to the five entry points.
- The docs-site script builds the packages first, writes Storybook to the repo
  root, copies TypeDoc to `/api`, and verifies relative links. The PR job builds
  and checks the artifact; the Pages deploy is manual and `main`-only.
- The demo renders a shared navigation on every route, including the hidden-data
  proof at `?security=1`.

### Deviations

- RD-11 names `@storybook/addon-viewport`; Storybook 10 provides the viewport in
  core, so no addon is installed.
- RD-11 AC7 says "install the package"; the packages are unpublished, so the
  quickstart uses the packed-tarball/consumer path until the release milestone.
- The docs site is built and uploaded but not published; the deploy job waits for
  the public-release Pages enablement.

### Known gaps

- The manual NVDA/VoiceOver audit remains parked; no WCAG conformance claim is
  made. Automated axe evidence is green.
- No versioned docs and no Storybook MDX guide pages in R1; the guides are
  repository markdown and the published site is Storybook plus TypeDoc.
- No live Pages deployment.
