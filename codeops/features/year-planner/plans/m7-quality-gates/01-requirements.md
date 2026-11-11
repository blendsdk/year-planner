# Requirements: Quality Gates, Performance, Security and Browsers

> **Document**: 01-requirements.md
> **Parent**: [Index](00-index.md)
> **Source**: [RD-10](../../requirements/RD-10-quality-gates.md) — the OWNING requirements doc

## Scope of this plan (delta view)

### In this plan

- RD-10 Must Have: specification/implementation test split, unit and component coverage, Playwright
  E2E, visual regression, A3 print, axe and manual-audit status, timezone matrix, browser matrix,
  React 19 smoke, SSR smoke, clean consumer, performance benchmark, security tests, coverage
  thresholds, CI test report and AC traceability.
- RD-10 Should Have: bundle budget enforcement, `pnpm bench`, flaky-test policy, dependency license
  report and `THIRD_PARTY_NOTICES.md`.
- GitHub issue #3: reproducible baseline, production profile for the 36-month/100+ item case,
  measurable drag/selection improvement and no interaction regressions.
- The existing 108 passed / 25 skipped Playwright evidence, 474 React tests, 207 core tests and
  green CI run are the starting point. This plan extends them; it does not replace them.

### Deferred / out of this plan

- RD-10 manual NVDA/VoiceOver audit: **parked by user decision (RD-09 AR-12)**. Automated axe
  remains mandatory; no WCAG conformance claim is made. Revisit on an AT-capable host before any
  claim.
- The 60 kB React package target is measured on the React entry+CSS and is met (~40.55 kB). The
  existing core+React+adapters+CSS total keeps the user-approved RD-09 65 kB guard. Both values are
  reported; neither is hidden.
- RD-11 documentation/Storybook publication and RD-12 release: separate milestones. Their
  acceptance criteria join the traceability matrix when their plans execute; they are not
  implemented here.
- Issue #4 auto-fit: not placed in R1; remains a product decision outside RD-10.
- Real Edge/Safari binaries: unavailable on Linux; Chromium and WebKit are the documented proxies.
- Paid visual-regression services, external performance dashboards, virtualization, an external
  gesture store, backend/load/chaos testing and performance claims on unmeasured devices.

## Plan-local decisions

| Decision | Chosen | AR Ref |
| -------- | ------ | ------ |
| Traceability enforcement | Annotate spec-test titles; `test:quality` derives and checks every AC | AR-3 |
| Coverage | Keep 95% core / 80% React; add public-export smoke and rely on API reports | AR-4 |
| Timezone execution | One `scripts/test-timezones.sh` reused by CI | AR-5 |
| Browser matrix | Playwright Chromium/Firefox/WebKit plus mobile Chromium/WebKit | AR-6, AR-7 |
| Visual matrix | 12/14/18/24/36, overflow, high contrast, print at 2% tolerance | AR-8 |
| Print matrix | 12/14/18/24/36 plus PRT-01, `pdfinfo` page size | AR-9 |
| Performance harness | Node layout + production Playwright browser run, one `pnpm bench` | AR-10, AR-11 |
| Budget enforcement | Report RD budgets; CI hard-fails a 2× ceiling; `PERF_STRICT=1` asserts the issue #3 oracle | AR-13 |
| Optimization | Memoize rows/cells/items, stabilize props, isolate previews | AR-14 |
| Audit fix | Vitest and coverage 4.1.12; high/critical block; moderate dev-only accepted | AR-15, AR-16 |
| License report | `pnpm licenses list --prod --json` plus checked-in notices | AR-17 |
| SSR locale oracle | Server `en-US`, client `navigator.language=de-DE`, explicit display locale wins | AR-20 |
| CI evidence | Checked-in report plus uploaded Playwright/benchmark/environment artifacts | AR-21 |
| Flaky policy | Zero retries; `test:flaky` for triage only | AR-22 |
| Manual AT | Parked; no conformance claim | AR-25 |

## Acceptance Criteria

This plan is complete when all of the following are true. RD-10 owns the authoritative AC list;
these are the plan-local completion conditions that prove it.

1. `pnpm verify:full` passes on a clean checkout, including the new quality, timezone, audit,
   performance and benchmark steps.
2. `test:quality` fails when an RD acceptance criterion has no matrix row or no spec-test title.
3. `pnpm audit --audit-level high` exits clean; the license report is current.
4. `pnpm bench` records 500/2k/10k layout and browser results with named hardware/browser, and
   issue #3 has before/after numbers and a production 36-month/500-item profile.
5. The production drag budget is met or the actual value is recorded as a documented deviation;
   interaction, visual and accessibility suites remain green.
6. `docs/test-report.md` records commands, counts, browser versions, both size measurements, budget
   results, known gaps and CI artifact links; CI uploads the report and raw artifacts.
