# Ambiguity Register: Quality Gates, Performance, Security and Browsers

> **Status**: ✅ GATE PASSED — 29 resolved, 0 open
> **Last Updated**: 2026-11-11 14:51
> **Policy**: `--auto-design` active — eligible technical decisions delegated; reserved decisions inherited from the user's RD-10 scope directive and the prior RD-09 decision

| # | Category | Ambiguity / Gap | Options Presented | Decision | Status |
|---|----------|-----------------|-------------------|----------|--------|
| AR-1 | Scope | Which RDs and issues this plan covers | RD-01–RD-10 only / RD-10 plus RD-11 / RD-10 plus issue #4 | **RD-10 plus issue #3.** RD-11 documentation/publication and RD-12 release remain out of scope. Issue #4 auto-fit remains a separate R1/backlog decision. | ✅ Resolved — user scope directive |
| AR-2 | Non-functional gaps | RD-10 AC12 names a 60 kB React package ESM+CSS budget; the existing `test:size` guard sums core, React, adapters and CSS at 63.36 kB against a 65 kB total ceiling | Measure the React entry+CSS separately / treat 63.36 kB as the AC12 size / cut accessibility features | **Measure both.** The React entry+CSS is ~40.55 kB, under the 60 kB AC12 target. Keep the 65 kB core+React+adapters+CSS total as the RD-09 installed-size guard. Record both values; AC12 is met and no 60 kB deviation is claimed. | ✅ Resolved — inherited RD-09 total guard plus a technical measurement fix |
| AR-3 | Technical unknowns | How to enforce "every RD acceptance criterion has a spec-test ID and the test title repeats it" | Add titles and a checker / add a separate mapping table only / waive the criterion | **Annotate existing spec-test titles and add a `test:quality` checker.** The checker derives every `RD-XX-AC-NN` from the RD files, requires a row in `00-traceability.md`, and requires at least one spec-test title containing the ID. No waiver. | ✅ Resolved |
| AR-4 | Technical unknowns | Coverage thresholds: RD-10 requires core ≥90% and React ≥80%; current configs enforce 95% and 80% | Keep 95/80 / lower to 90/80 / add new untested-API enforcement only | **Keep 95/80** because they already exceed the RD minimum. Add a runtime public-export smoke test and rely on the checked-in API Extractor reports for type-only exports. | ✅ Resolved |
| AR-5 | Technical unknowns | How to run the date-only suite under UTC, `Pacific/Kiritimati` and `America/Los_Angeles` | Three CI jobs / one local shell script reused by CI / a new test runner | **One `scripts/test-timezones.sh`** that invokes the existing core Vitest date suite under each `TZ` value. CI calls the same script. No new runner or dependency. | ✅ Resolved |
| AR-6 | Technical unknowns | Real Edge/Safari coverage versus Playwright's bundled engines on Linux, and the "latest two stable" wording | Install real Edge/Safari / use Chromium as the Edge proxy and WebKit as the Safari proxy / add a second Playwright version | **Use one Playwright-bundled Chromium, Firefox and WebKit version per engine.** RD-10 explicitly allows the proxies where real browsers are unavailable. Record exact `browser.version()` values and list "latest two stable per engine" as a known gap; make no claim beyond the measured versions. | ✅ Resolved — documented known gap |
| AR-7 | Technical unknowns | Which mobile devices and engines form the mobile smoke matrix | Chromium only / WebKit only / Pixel 5 Chromium plus iPhone 13 WebKit | **Pixel 5 (Chromium) plus iPhone 13 (WebKit).** Both run the same small `@mobile` smoke spec: render, tap a date, open the inspector, no console error. | ✅ Resolved |
| AR-8 | UX & presentation | Which visual states get checked-in screenshots | Existing four / every month window and density / a focused quality subset | **A focused subset:** 12/14/18/24/36-month layouts, compact and expanded overflow, high contrast, and print. Desktop Chromium, Firefox and WebKit; keep the existing 2% pixel tolerance. | ✅ Resolved |
| AR-9 | Technical unknowns | A3 print coverage: RD-10 requires 12/14/18/24/36 months and PRT-01 | Add only missing windows / replace the existing PDF tests / assert page size only | **Extend the existing `pdfinfo` tests** with 12- and 18-month PDFs and a PRT-01 fixture. Assert page count, 420×297 mm landscape (`1191.12 × 842.88 pt`), month labels, weekday headers, ISO weeks and ribbons. Chromium only. | ✅ Resolved |
| AR-10 | Technical unknowns | How to measure layout time and pointer frame time without a new framework | Node-only benchmark / Playwright-only benchmark / both using existing tooling | **Both, using existing Vitest/Playwright and Node.** A Node harness measures core layout/ribbon time at 500/2k/10k items; a Playwright harness measures a production preview for initial render, drag frames, overflow open/close and long tasks. `pnpm bench` orchestrates both and writes JSON plus Markdown. | ✅ Resolved |
| AR-11 | Technical unknowns | Where the large benchmark fixture lives | A new app / a hidden route in the existing demo / generated data inside the benchmark script | **A `?bench=1` route in the existing demo** with a deterministic generator. The demo is private and never published, so no public bundle cost or new app. | ✅ Resolved |
| AR-12 | Non-functional gaps | Which hardware/browser the numbers describe | This host only / CI only / both, named separately | **Both, named separately.** Local reference: Intel i5-3470S, 4 vCPU, 14 GiB, Ubuntu 26.04, Node 24, Chromium from Playwright 1.65. CI: `ubuntu-latest` with recorded versions. No cross-device performance claim. | ✅ Resolved |
| AR-13 | Non-functional gaps | Whether the harness fails the build on an RD budget miss | Hard-fail every budget / report only / hard-fail a regression ceiling | **Report RD budgets and hard-fail a 2× regression ceiling.** `pnpm test:perf` measures every RD budget and fails only on a harness error or a 2× breach. `PERF_STRICT=1 pnpm test:perf` additionally asserts the issue #3 oracle (after p95 ≤0.9× baseline or ≤16.7 ms, three repeats, no long-task/input-delay regression). Strict mode is used for the Phase 5 red/green; `verify:full` uses report mode. A 1×–2× miss is a documented deviation, never silently loosened. | ✅ Resolved |
| AR-14 | Technical unknowns | Which optimization to apply for issue #3 | External gesture store / full virtualization / row-level memoization and preview isolation | **Memoize the row/cell/item layers, stabilize the `components` object and callbacks, and pass gesture previews only to intersecting rows.** This reuses React primitives and adds no architecture layer. Virtualization and an external store stay out unless the profile proves memoization insufficient; that would reopen the decision. | ✅ Resolved |
| AR-15 | Security & compliance | Two critical `tinypool` advisories are reachable through Vitest 3.2.7 | Override `tinypool` to 2.x / upgrade Vitest to 4.1.12 / accept dev-only criticals | **Upgrade Vitest and `@vitest/coverage-v8` to 4.1.12**, which supports Vite 7 and Node 24 and removes the affected path. Keep Vite 7.3.8 because Vite 8 crashes on the reference CPU. | ✅ Resolved |
| AR-16 | Security & compliance | Which audit severities block the gate, and whether dev dependencies count | Production only / all dependencies / high and critical only | **All dependencies; high and critical block.** The two current criticals are fixed by AR-15. Remaining moderate advisories are recorded in the security notes as dev-only accepted risk; no high/critical claim is made until the audit is clean. | ✅ Resolved |
| AR-17 | Technical unknowns | How to produce `THIRD_PARTY_NOTICES.md` without a new dependency | Hand-maintain / add a license-checker package / use `pnpm licenses list` | **Use the built-in `pnpm licenses list --prod --json`** and a small generator/check script. The file is checked in; `verify` fails when it is stale. No new dependency. | ✅ Resolved |
| AR-18 | Technical unknowns | Where the new security specification tests live | Extend `items.spec` / a new `security.spec.test.tsx` / E2E only | **A new `packages/react/src/security.spec.test.tsx` plus `security.impl.test.tsx`.** Use real components and real DOM assertions; no mocks except true browser externals. | ✅ Resolved |
| AR-19 | Security & compliance | How to prove no telemetry or network request is emitted | Unit spies only / Playwright request log only / both | **Both.** Unit tests spy on `fetch`, `XMLHttpRequest`, `sendBeacon` and `WebSocket`; a Playwright test asserts every request is same-origin or a data/blob URL. | ✅ Resolved |
| AR-20 | Behavioral | What "hydrates without mismatch when server/client locales differ" means | Server and client use the same explicit locale / client browser locale differs but explicit `display.locale` wins / suppress hydration warnings | **Explicit locale wins.** The current component already defaults to `en-US` and never reads `navigator.language`; the test proves that a `de-DE` client locale does not change output and that matching explicit `display.locale` values hydrate cleanly. No production change is expected. Never suppress warnings. | ✅ Resolved |
| AR-21 | Integration points | How CI publishes the RD-10 test report | External dashboard / checked-in report only / checked-in report plus uploaded raw artifacts | **Checked-in `docs/test-report.md` plus uploaded artifacts:** Playwright HTML/JSON, `test-results/environment.txt`, benchmark JSON/Markdown and CPU profiles. No external service. | ✅ Resolved |
| AR-22 | Non-functional gaps | Flaky-test policy and retry default | Retry twice in CI / zero retries everywhere / retries only for known externals | **Zero retries by default.** Add an explicit `retries: 0`, document the policy, and provide `pnpm test:flaky` (`--repeat-each=3`) for triage. There are no known external flaky tests. | ✅ Resolved |
| AR-23 | Technical unknowns | What counts as the React 19 smoke test | A second E2E app / a component test asserting the React major and rendering / rely on the existing suite | **A component test asserting `React.version` starts with `19` and rendering the planner**, plus the existing all-React-19 component/E2E suites. No second app. | ✅ Resolved |
| AR-24 | Technical unknowns | What "no untested public API" means for type-only exports | Require a runtime call for every type / rely on API reports and a runtime smoke test / waive | **Runtime smoke for every runtime export plus the checked-in API Extractor reports for the type surface.** Type-only exports cannot be called at runtime; the API report is their compile-time evidence. | ✅ Resolved |
| AR-25 | Non-functional gaps | RD-10 says the RD-09 manual accessibility audit is part of the gate, but the user parked it | Run it anyway / record it as parked and make no claim / block RD-10 | **Record the RD-09 park decision (AR-12 there) and make no WCAG conformance claim.** Automated axe remains mandatory; manual NVDA/VoiceOver stays a release-gate item for a later AT-capable host. | ✅ Resolved — inherited RD-09 user decision |
| AR-26 | Scope | Issue #4 (auto-fit) was proposed during triage but is not in RD-10 | Include it / leave it for an R1/backlog decision | **Leave it out.** The user has not placed auto-fit in R1; the plan records it as an open product decision outside RD-10. | ✅ Resolved — user scope boundary |
| AR-27 | Naming & terminology | RD-10 lists `pnpm test:a11y`, but the root package has no such script | Add the alias / rename the existing spec / remove the command from the RD | **Add `test:a11y`** as `playwright test tests/e2e/accessibility.spec.ts` and keep `test:visual` and `test:print` aliases. `verify:full` runs all three through the full Playwright suite. | ✅ Resolved |
| AR-28 | Technical unknowns | How to capture the issue #3 CPU profiles | React Profiler instrumentation / Chrome DevTools Protocol `Profiler` / manual screenshots | **CDP `Profiler.start/stop` in the Playwright benchmark** for the 500-item dev drag and the 36-month/500-item production drag. Save `.cpuprofile` files as evidence; no React runtime instrumentation. | ✅ Resolved |
| AR-30 | Technical unknowns (runtime) | Capturing the pre-optimization baseline can exceed the 2× budget ceiling, so a hard-failing `pnpm bench` cannot both record the baseline and succeed | Fail the baseline run / report-first with an explicit enforcing command / skip the baseline | **Report-first `pnpm bench`; `pnpm bench --enforce` and `PERF_STRICT=1 pnpm test:perf` gate.** The baseline records the real pre-optimization values (500-item drag p95 33.3 ms, 2k 300 ms); the post-optimization run and CI enforce the ceiling. | ✅ Resolved |
| AR-29 | Data & state | Benchmark item distribution and scenario matrix | Random per run / deterministic seed / one fixed count | **Deterministic seeded generator**, five layers, 1–10 day durations spread across the window. Scenario matrix: 500/2k/10k items × compact/expanded/overflow, plus 12/14/18/24/36-month initial render and 36-month/500-item drag. | ✅ Resolved |

## Resolution Notes

### Authority summary

- AR-1, AR-2, AR-25 and AR-26 are **user-owned** scope or acceptance decisions, inherited from the
  RD-10 scope directive and the prior RD-09 decisions. They are not delegated to auto-design.
- AR-3 through AR-24 and AR-27 through AR-29 are **eligible technical decisions** inside the
  confirmed RD-10 scope. They add no product surface, public compatibility break, paid service,
  deployment or reserved authority. AR-15 is a version upgrade of existing dev tooling, not a new
  dependency.

### Delegated provenance

```text
Authority: AI — delegated by --auto-design
Eligibility: testing strategy, performance engineering, security mechanism within the approved
  policy, CI evidence publishing, and implementation sequencing inside RD-10
Objective: deliver measured quality gates for RD-10 — traceability, coverage, timezone/browser
  matrices, performance budgets, issue #3 profiling and measurable improvement, security/privacy
  verification, SSR and print evidence, and CI-published results
Evidence: codeops/features/year-planner/requirements/RD-10-quality-gates.md;
  codeops/features/year-planner/requirements/00-traceability.md;
  package.json; playwright.config.ts; scripts/check-size.mjs; scripts/clean-consumer.sh;
  packages/core/vitest.config.ts; packages/react/vitest.config.ts;
  packages/react/src/YearPlanner.tsx; packages/react/src/render/YearGrid.tsx;
  packages/react/src/render/MonthRow.tsx; packages/react/src/render/CellLayer.tsx;
  packages/react/src/render/ItemOverlay.tsx; packages/react/src/render/ItemLayer.tsx;
  tests/e2e/*.spec.ts; docs/test-report.md; docs/security.md;
  GitHub issue #3; pnpm audit output (2 critical tinypool advisories, 5 moderate advisories)
Rejected alternatives: named per row above
Strongest counterargument: a separate performance harness and a traceability checker are new
  support scripts and add maintenance cost; the alternative is to rely on one-off manual
  measurements and a hand-maintained matrix, but RD-10 explicitly requires repeatable evidence and
  issue #3 cannot be closed without a reproducible baseline. The scripts reuse existing Vitest and
  Playwright and add no dependency.
Confidence: High — each mechanism is directly verifiable in the existing stack; the Vitest upgrade
  is the only toolchain risk and is isolated to a version bump with a full-suite verification task
Hardening: in-context review of the harness and traceability design; no new architecture layer,
  paid service or public API change. The optimization is limited to React memoization and stable
  props, not an external gesture store.
Policy version: 1
Root invocation ID: rd10-quality-gates-2026-11-11
Reopen triggers: a performance budget cannot be met with memoization and would require a new
  architecture layer; Vitest 4 cannot run the existing suite; Playwright cannot provide a mobile
  WebKit project; a security test finds a real injection or hidden-data leak that needs a new
  mechanism; the user changes the bundle budget or the RD-10 scope
```

### AR-2 — bundle budget note

RD-10 AC12 measures the React package ESM entry plus CSS, excluding peers. The existing
`scripts/check-size.mjs` instead sums core, React, both adapters and CSS. The two measurements answer
different questions. This plan reports the React package value against 60 kB (currently ~40.55 kB)
and keeps the larger total against the user-approved 65 kB RD-09 guard (currently 63.36 kB). No
feature has to be cut and no 60 kB deviation is claimed.

### AR-3 — traceability note

The current matrix covers handoff cases and a subset of RDs. The checker covers RD-01..RD-10 — the
RDs implemented by this plan — and derives the expected IDs from the RD files, so a future RD cannot
add an AC without a matrix row and a test title. RD-11 and RD-12 join the checker when their plans
execute. The checker is a quality test, not a replacement for the API reports or coverage thresholds.
