# RD-10: Quality Gates, Performance, Security and Browser Support

> **Document**: RD-10-quality-gates.md
> **Status**: Draft
> **Created**: 2026-11-10
> **Project**: Year Planner for React
> **Depends On**: RD-01 through RD-09
> **CodeOps Artifact Schema**: 1

---

## Feature Overview

Defines the measurable quality contract for the first release: automated test
tiers, specification tests derived from RDs, browser and React matrices,
performance budgets, security/privacy verification, SSR checks and release
evidence.

No performance, accessibility or booking-correctness claim is made without a
recorded measurement.

---

## Functional Requirements

### Must Have

- [ ] **Specification tests** (`*.spec.test.*`) derive from RD acceptance
  criteria and act as the immutable oracle; **implementation tests**
  (`*.impl.test.*`) cover internals.
- [ ] Unit tests for dates, ISO weeks, interval algebra, visibility, geometry,
  lanes, selection reducer and validation.
- [ ] Component tests for controlled/uncontrolled state, slots, theming,
  overflow, focus and diagnostics.
- [ ] Playwright E2E for selection, multi-select, Ctrl/Cmd/Shift, marquee,
  paint/erase/undo/redo, create/delete, move/resize, cancel, visibility,
  rejection/rollback, keyboard-only and touch-edit.
- [ ] Visual regression baselines for 2016 blue, 2017 yellow, 2027 overlaps,
  12/14/18/24/36-month layouts, compact/expanded overflow, high contrast and print.
- [ ] A3 print verification: generated PDF page size is A3 landscape; no row
  clipping; month labels, weekends, ISO weeks and ribbons align.
- [ ] Accessibility: axe automated scans plus the manual audit defined in RD-09.
- [ ] Timezone matrix: date-only suite passes under at least UTC,
  `Pacific/Kiritimati` and `America/Los_Angeles`.
- [ ] Browser matrix: latest two stable Chrome, Edge, Firefox and Safari; print
  baseline in Chromium; Edge is covered by Chromium and Safari is approximated by
  WebKit; add real Edge/Safari smoke tests where available; mobile smoke test on
  Chromium/WebKit.
- [ ] React 19 component/E2E smoke tests.
- [ ] SSR smoke test: render the grid and labels to string without `window` or
  `document`, then hydrate without mismatch.
- [ ] Clean-consumer test: packed tarballs installed in a fresh Vite app; CSS,
  ESM imports, types and tree-shaking verified.
- [ ] Performance benchmark at 500, 2,000 and 10,000 items; record p50/p95 layout
  time and pointer-move frame time on named hardware/browser.
- [ ] Security tests: hidden item absent from DOM/ARIA/tooltips/inspector/print;
  XSS payload in title/metadata is escaped; no telemetry/network calls;
  dependency audit has no high/critical vulnerabilities.
- [ ] Coverage thresholds: core ≥ 90% lines/branches; React ≥ 80% lines/branches;
  no untested public API.
- [ ] CI publishes a test report with commands, pass/fail counts, browser
  versions, known gaps and performance observations.
- [ ] Every RD acceptance criterion has a spec-test ID in
  `requirements/00-traceability.md`; the test title repeats the ID.

### Should Have

- [ ] A bundle-size budget for the React package (≤ 60 KB min+gzip excluding
  React peers, including CSS; enforced by `pnpm test:size`).
- [ ] A `pnpm bench` command for the layout/pointer harness.
- [ ] Flaky-test detection/retry policy with a zero-retry default for unit tests.
- [ ] Dependency license report and `THIRD_PARTY_NOTICES.md`.

### Won't Have (Out of Scope)

- Performance claims on devices/browsers not measured.
- Healthcare, booking-correctness or financial safety claims.
- Chaos testing, load testing of a backend, or multi-node concurrency.
- Visual regression on every OS/font combination.
- A paid visual-regression service as a mandatory dependency.

---

## Technical Requirements

### Provisional performance budgets

| Scenario | Budget (reference machine: 4 vCPU, Node 24, Chromium) |
|---|---|
| 10k items, 14 rows, compact overflow, initial layout | ≤ 250 ms p95 |
| Pointer preview, compact 3-lane view, 14 rows | ≤ 16.7 ms per frame (60 Hz) |
| Pointer preview, expanded view with 500 visible fragments | ≤ 16.7 ms per frame (60 Hz) |
| Overflow list open/close with 10k compact items | ≤ 100 ms |
| 12/14/18/24/36-month initial render | ≤ 150 ms p95 |
| React package ESM entry + CSS min+gzip (excluding peers) | ≤ 60 KB |

Budgets are verified by the harness; if a budget cannot be met, the test report
records the actual value and the release notes do not claim otherwise.

### Test commands

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm test:e2e
pnpm test:visual
pnpm test:a11y
pnpm test:print
pnpm test:size
pnpm storybook:build
pnpm bench
pnpm verify
pnpm verify:full
```

### Evidence artifacts

- `docs/test-report.md` with commands and results.
- Playwright HTML report and screenshots.
- A3 PDF sample and `pdfinfo` output.
- Benchmark JSON/CSV with hardware/browser names.
- axe report and manual screen-reader notes.

### Complexity

Test harness and evidence: **L**. Performance harness: **M**. Security tests:
**M**.

---

## Integration Points

- Every RD supplies acceptance criteria that map to spec tests.
- RD-09 supplies the manual accessibility audit.
- RD-11 publishes the test report and limitations.
- RD-12 gates release on `pnpm verify:full` and the evidence artifacts.
- `verify` is the fast gate (typecheck, lint, unit, build, API report, Storybook
  build, pack, size); `verify:full` adds E2E, visual, a11y, print and bench.

---

## Scope Decisions

| Decision | Options Considered | Chosen | Rationale | AR Ref |
|---|---|---|---|---|
| Test oracle | Implementation-derived, RD-derived | RD-derived spec tests | Prevents self-validating tests | AR #31 |
| Browsers | Legacy broad, modern | Latest two stable | Practical support matrix | AR #22 |
| Performance | Unmeasured claims, measured | Measured budgets | Honest evidence | AR #23 |
| Visual regression | Paid service, Playwright | Playwright screenshots | No mandatory paid dependency | AR #31 |
| Security | Host-only, component guardrails | Guardrails + host authority | Prevent leaks/XSS | AR #24 |

---

## Security Considerations

- **Data sensitivity**: Test fixtures are synthetic; no real employee, patient,
  customer or booking data.
- **Input validation**: Fuzz date/time/period parsers; validate IDs, references
  and metadata.
- **Authentication & authorization**: N/A — no backend; tests assert visibility
  is not treated as authorization.
- **Injection risks**: XSS payloads in titles, labels and metadata must render as
  text; no `dangerouslySetInnerHTML`.
- **Encryption needs**: N/A.
- **Rate limiting**: N/A.
- **Infrastructure**: CI uses least-privilege tokens; release credentials are
  OIDC-only.

---

## Acceptance Criteria

1. [ ] `pnpm verify:full` passes on a clean checkout.
2. [ ] Every RD acceptance criterion maps to at least one test ID in the
   traceability matrix.
3. [ ] Core coverage is ≥ 90% lines/branches; React coverage is ≥ 80%;
   no public export is untested.
4. [ ] Playwright passes on Chromium, Firefox and WebKit; React 19 smoke
   tests pass.
5. [ ] Date-only tests pass under the three specified timezones.
6. [ ] A3 PDF output reports 420×297 mm landscape and shows no clipped month
   row for 12, 14, 18, 24 and 36-month layouts; PRT-01 (2017 yellow, events,
   ISO dates) prints on one page.
7. [ ] axe reports no serious/critical violations; the manual audit is recorded
   with browser, AT and date.
8. [ ] Hidden items are absent from DOM, ARIA, tooltips and overflow lists.
9. [ ] An XSS payload in a title/metadata renders as inert text; no script
   executes.
10. [ ] No network request or telemetry is emitted by the component.
11. [ ] The performance harness records results for 500/2k/10k items in compact,
    expanded and overflow scenarios; the report states actual values; budgets
    are met or deviations documented.
12. [ ] `pnpm test:size` enforces the 60 KB React package budget including CSS.
13. [ ] A documented CSP with `style-src-attr` renders themes; no remote style
    URL is executed from untrusted metadata.
14. [ ] `pnpm pack` + fresh Vite install + tree-shaken import succeeds.
15. [ ] SSR renders the grid/labels to string without `window`/`document` and
    hydrates without mismatch when server/client locales differ.
16. [ ] Security requirements verified: least-privilege CI, no secrets, no XSS,
    no hidden-data leak.
