# Current State: Quality Gates, Performance, Security and Browsers

> **Document**: 02-current-state.md
> **Parent**: [Index](00-index.md)

## Existing Implementation

### What Exists

The repository is at the end of RD-09 with a green full gate. The current evidence is:

| Area | Current evidence | Source |
| ---- | ---------------- | ------ |
| Core tests | 207 passed | `docs/test-report.md` |
| React tests | 474 passed across 42 files | `docs/test-report.md` |
| Core coverage | 99.34% lines, 96.08% branches | `docs/test-report.md` |
| React coverage | 94.27% lines, 92.90% branches | `docs/test-report.md` |
| E2E | 108 passed, 25 skipped across Chromium, Firefox, WebKit, Chromium touch | `docs/test-report.md` |
| A3 print | 1 page (14 months), 2 (24), 3 (36), 1191.12 × 842.88 pt | `tests/e2e/classic-year.spec.ts:35-49,100-137` |
| Visual | 2016 blue, 2017 yellow, 2027 items, 2016 print | `tests/e2e/classic-year.spec.ts:13-98` |
| Axe | Eight states green: blue, yellow, high contrast, compact, expanded, overflow, error, AC3, 36 months | `tests/e2e/accessibility.spec.ts` |
| SSR | Grid renders without browser globals; deterministic markup; hydration without mismatch | `packages/react/src/YearPlanner.ssr.spec.test.tsx:6-20`, `YearPlanner.hydration.spec.test.tsx:7-22` |
| Bundle | 63.36 kB gzip total / 65 kB guard; React entry+CSS ~40.55 kB / 60 kB AC12 target | `scripts/check-size.mjs:5` |
| Clean consumer | Packed core + React installed into a fresh Vite app and built | `scripts/clean-consumer.sh` |
| CI | `verify`, `browsers` and DCO jobs; latest run green | `.github/workflows/ci.yml:11-62` |
| Browser matrix | Chromium, Firefox, WebKit, Pixel 5 touch | `playwright.config.ts:18-27` |

### Relevant Files

| File | Purpose | Changes Needed |
| ---- | ------- | -------------- |
| `codeops/features/year-planner/requirements/00-traceability.md` | Partial AC matrix (handoff cases and a few R1 cases) | Expand to every RD-01..RD-10 AC with a test ID |
| `packages/*/src/**/*.spec.test.*` | Spec tests | Add missing `RD-XX-AC-NN` title IDs |
| `tests/quality/` | Does not exist | New cross-cutting quality checks |
| `tests/e2e/classic-year.spec.ts` | Existing visual/print evidence | Extend windows and print matrix |
| `playwright.config.ts` | Desktop + one touch project | Add mobile Chromium/WebKit, explicit zero retries |
| `apps/demo/src/App.tsx` | Demo with 14/24/36-month options | Add 12/18 options and a benchmark route |
| `scripts/` | Size, consumer and toolchain checks | Add timezone, license and benchmark scripts |
| `package.json` | Verify scripts | Add quality/timezone/audit/perf/bench aliases |
| `packages/react/src/YearPlanner.tsx` | Root component; 956 lines | Stabilize `components` and callbacks; no behavior change |
| `packages/react/src/render/MonthRow.tsx` | Row renderer; maps previews per row | Memoize and filter previews |
| `packages/react/src/render/CellLayer.tsx` | 37 cells per row | Memoize; only the active row receives `activeDate` changes |
| `packages/react/src/render/ItemOverlay.tsx` | Item layer wrapper | Per-row preview isolation and memoization |
| `packages/react/src/render/ItemLayer.tsx` | Fragments and proxies | Memoize by row/props |
| `.github/workflows/ci.yml` | Two main jobs | Add quality, audit, timezone, mobile, benchmark and report upload |
| `docs/test-report.md` | Curated evidence | Add RD-10 counts, browser versions, budgets, issue #3 before/after |
| `docs/security.md` | Current controls and limitations | Record audit result, license report, accepted moderate risk |

### Code Analysis

The performance problem from issue #3 is structural, not a single slow function:

- `YearPlanner` is one `forwardRef` component. Gesture state lives in `useInteraction`, which is
  called inside it (`packages/react/src/YearPlanner.tsx`). Every `pointermove` that changes the
  gesture preview re-renders the whole planner.
- `YearGrid` maps every month row and passes the full `previews` array to every row
  (`packages/react/src/render/YearGrid.tsx`). `MonthRow` maps the same array and renders a
  `SelectionPreview` for every entry (`packages/react/src/render/MonthRow.tsx`).
- `ItemOverlay` maps every row and renders a `SelectionPreview` for every item/range preview in
  every row; the previews are not passed into `ItemLayer` (`packages/react/src/render/ItemOverlay.tsx`).
- `YearPlanner` creates `components={props.components ?? {}}` on every render
  (`packages/react/src/YearPlanner.tsx`). A fresh object identity defeats memoization in every
  child that receives it.
- `CellLayer` renders all 37 cells per row with fresh closures. At 36 months that is 1,332 cells
  per render.
- `PrintPages` is always rendered, even on screen, and rebuilds the full print tree on every parent
  render; `ItemList` re-scans and sorts visible items inside the inspector.
- The preview computation itself is already memoized in `useInteraction`; the waste is in child
  rendering, not in recomputing the gesture.

Issue #3 measured the 6-item production Storybook drag at ~17 ms frames with no long tasks, while
the dev demo drag took ~5 s with long tasks up to ~330 ms. That confirms a large dev-only component,
but it does not prove the production 36-month/10k-item case is safe. No benchmark currently exists.

## Gaps Identified

### Gap 1: Incomplete traceability

**Current Behavior:** The matrix covers handoff cases and a subset of R1 cases. Only RD-02 and
RD-03 test titles contain `RD-XX-AC-NN` IDs; RD-04 through RD-09 use short prefixes such as
`RD-04 visibility precedence`.
**Required Behavior:** Every RD-01..RD-10 acceptance criterion has a matrix row and at least one
spec-test title containing its ID.
**Fix Required:** Expand the matrix, annotate spec titles, add missing tests and add a checker.

### Gap 2: Timezone matrix absent

**Current Behavior:** No test or script sets `TZ`. The date suite runs only in the host timezone.
**Required Behavior:** Date-only tests pass under UTC, `Pacific/Kiritimati` and
`America/Los_Angeles`.
**Fix Required:** Add `scripts/test-timezones.sh` and call it from CI and `verify:full`.

### Gap 3: Browser/mobile/visual matrix incomplete

**Current Behavior:** Desktop Chromium/Firefox/WebKit plus one Chromium touch project. Visual
baselines cover 14 months, 2017 yellow, 2027 items and one print page. The demo only offers 14/24/36
months. No mobile WebKit project. No high-contrast visual baseline.
**Required Behavior:** 12/14/18/24/36 windows, compact/expanded overflow, high contrast, print, and
mobile Chromium/WebKit smoke.
**Fix Required:** Extend the demo, Playwright config and visual/print tests; generate baselines.

### Gap 4: Print matrix incomplete

**Current Behavior:** 14-month, 24-month and 36-month PDFs are checked. 12- and 18-month PDFs and
PRT-01 are not.
**Required Behavior:** 12/14/18/24/36 page counts and page size, plus PRT-01 on one page.
**Fix Required:** Add print tests and the PRT-01 fixture.

### Gap 5: No performance harness or issue #3 baseline

**Current Behavior:** `docs/test-report.md` explicitly records "Performance benchmarks
(500/2k/10k items) — Not run". There is no `bench` script, no benchmark fixture, no CPU profile and
no frame measurement.
**Required Behavior:** A repeatable harness with named hardware/browser, p50/p95 layout, drag frame
time, overflow timing and issue #3 before/after evidence.
**Fix Required:** Add the benchmark fixture, Node/browser harness, result artifacts and profiles.

### Gap 6: Security/privacy suite partial

**Current Behavior:** Hidden items are tested for fragments, proxies, tooltips and inspector.
Metadata and unsafe styles have one test. There is no print hidden-data test, no network spy, no
dependency audit script and no license report. `pnpm audit` currently reports **2 critical**
`tinypool` advisories through Vitest 3.2.7 and 5 moderate advisories.
**Required Behavior:** Hidden data absent from DOM/ARIA/tooltips/inspector/print; XSS inert; no
network/telemetry; no high/critical dependency advisories; current license report.
**Fix Required:** Add the security suite, upgrade Vitest to 4.1.12, add audit/license scripts.

### Gap 7: CI evidence not published

**Current Behavior:** CI runs verify and browsers, but uploads nothing. The checked-in report is
updated manually. No environment/browser version capture and no benchmark artifact.
**Required Behavior:** CI publishes commands, counts, browser versions, known gaps and performance
observations.
**Fix Required:** Add quality/report steps, environment capture and artifact uploads.

### Gap 8: Flaky policy implicit

**Current Behavior:** Playwright retries are unset (default 0) but not documented; no triage command.
**Required Behavior:** Explicit zero-retry default and a documented triage path.
**Fix Required:** Set `retries: 0`, add `test:flaky`, document the policy.

## Dependencies

### Internal Dependencies

- RD-01 through RD-09 are complete. Their tests are the baseline this plan extends.
- RD-09's axe matrix, item list, hidden filtering and 65 kB budget decision are prerequisites.
- The RD-10 traceability work depends on the RD files remaining the source of acceptance criteria.
- The performance optimization depends on the existing render structure; no public prop changes.

### External Dependencies

- Node 24, pnpm 12.9.1, Vite 7.3.8, Vitest 4.1.12 (planned), Playwright 1.65.0, axe-core 4.14.0,
  `pdfinfo` from poppler-utils, Chromium/Firefox/WebKit.
- GitHub Actions `ubuntu-latest` for CI; no paid service.
- `pnpm audit` needs registry network access; the license generator uses the local lockfile.

## Risks and Concerns

| Risk | Likelihood | Impact | Mitigation |
| ---- | ---------- | ------ | ---------- |
| Vitest 4 upgrade breaks tests or coverage | Medium | High | Isolate the upgrade in Phase 6; run the full suite; fall back only with a recorded, reviewed alternative if the upgrade is impossible |
| 10k-item initial layout exceeds 250 ms | Medium | High | Profile first; memoize and avoid per-frame full renders; record actual values if the budget is not met |
| Drag frame budget misses on the 4-core host | Medium | High | Measure production preview; optimize rows/cells/items; use the 2× CI ceiling and document actuals |
| Visual baselines are noisy across engines | Medium | Medium | Keep 2% tolerance, fixed viewport, disable animations, generate on all three engines |
| Mobile WebKit project is flaky or unavailable | Low | Medium | Use a small smoke spec; WebKit is already installed; skip only with recorded evidence |
| Audit fix requires another toolchain change | Medium | Medium | Vitest 4.1.12 supports Vite 7 and Node 24; keep Vite 7.3.8 because Vite 8 crashes on this CPU |
| Traceability annotation becomes a large mechanical change | High | Medium | Do it per RD, with a checker that proves completeness; no behavior changes |
| CI performance numbers vary by runner | High | Medium | Name hardware; upload artifacts; use 2× ceiling in CI and RD budgets on the reference host |
| `pnpm audit` network failure | Low | Medium | CI job retries once; local `verify` does not require audit; report the failure explicitly |
