# Testing Strategy: Quality Gates, Performance, Security and Browsers

> **Document**: 07-testing-strategy.md
> **Parent**: [Index](00-index.md)

## Testing Overview

### Coverage Goals

| Code type | Target |
| --------- | ------ |
| Core business logic | 95% lines/branches (existing, above the RD-10 90% floor) |
| React components and hooks | 80% lines/branches (existing) |
| New scripts and quality checks | 90% of pure parsing/branch paths; end-to-end CLI cases |
| Public API | Every runtime export smoke-tested; type surface checked by API Extractor |

- Test names state behavior and repeat the `RD-XX-AC-NN` ID where the test proves an acceptance
  criterion.
- Specification tests derive from RD-10 and the plan documents, never from the implementation.
- Implementation tests cover edge cases, malformed input and internal helpers.
- No production behavior is changed to make a test pass.

## 🚨 Specification Test Cases (MANDATORY — NON-NEGOTIABLE)

> These cases derive from RD-10, the plan specs and the ambiguity register. They are the oracle.
> If an implementation does not match, the implementation is wrong.

### Traceability and public API

| # | Input / Scenario | Expected Output / Behavior | Source |
|---|------------------|----------------------------|--------|
| ST-1 | Every RD-01..RD-10 acceptance criterion | Has a row in `00-traceability.md` and at least one spec-test title containing `RD-XX-AC-NN` | RD-10 AC2; AR-3 |
| ST-2 | A matrix missing one AC row | Checker fails, names the missing ID and exits non-zero | RD-10 AC2; AR-3 |
| ST-3 | A duplicate matrix row | Checker fails and lists the duplicate ID | RD-10 AC2; AR-3 |
| ST-4 | A title `RD-02-AC-01/02` | Both IDs count as present | RD-10 AC2; AR-3 |
| ST-5 | An ID only in a comment or fixture string | Does not count as a title | RD-10 AC2; AR-3 |
| ST-6 | Current core and React coverage configs | Core thresholds ≥90, React thresholds ≥80 | RD-10 AC3; AR-4 |
| ST-7 | Every runtime export in `packages/core/src/index.ts` and `packages/react/src/index.ts` | Present in the golden list and defined at runtime | RD-10 AC3; AR-4, AR-24 |
| ST-8 | The checked-in API Extractor reports | `api-report:ci` passes; type exports are covered | RD-10 AC3; AR-24 |

RD-11 and RD-12 are not implemented in this milestone; their acceptance criteria join the matrix
when their plans execute. This is the confirmed RD-10 scope, not a traceability waiver.

### Matrix and print

| # | Input / Scenario | Expected Output / Behavior | Source |
|---|------------------|----------------------------|--------|
| ST-9 | Core suite under `TZ=UTC`, `TZ=Pacific/Kiritimati`, `TZ=America/Los_Angeles` | All three runs pass | RD-10 AC5; AR-5 |
| ST-10 | Full Playwright desktop suite | Chromium, Firefox and WebKit pass | RD-10 AC4; AR-6 |
| ST-11 | Pixel 5 Chromium mobile smoke | Grid renders, tap works, no console error, no page-level horizontal overflow | RD-10 AC4; AR-7 |
| ST-12 | iPhone 13 WebKit mobile smoke | Same behavior as ST-11 | RD-10 AC4; AR-7 |
| ST-13 | React 19 component render | `React.version` starts with `19`; planner renders | RD-10 AC4; AR-23 |
| ST-14 | 12/14/18/24/36-month layouts at 2% tolerance | Each snapshot matches its checked-in baseline | RD-10 Must Have; AR-8 |
| ST-15 | Compact and expanded overflow | Each snapshot matches its baseline; `+N` and entries are visible | RD-10 Must Have; AR-8 |
| ST-16 | High-contrast theme | Snapshot matches; focus and text remain visible | RD-10 Must Have; AR-8 |
| ST-17 | 12/14/18/24/36-month print | Page counts `1/1/2/2/3`; page size `1191.12 x 842.88 pt`; no row overflows its page; `pdftotext` contains labels, weekday headers, ISO weeks and ribbons | RD-10 AC6; AR-9 |
| ST-18 | PRT-01 (2017 yellow, items, ISO dates) | One A3 page with the expected content | RD-10 AC6; AR-9 |
| ST-19 | Axe scan of the eight RD-09 states | Zero serious or critical violations | RD-10 AC7; AR-25 |
| ST-20 | Manual AT evidence | Not claimed; RD-09 park decision recorded | RD-10 AC7; AR-25 |

### Security and privacy

| # | Input / Scenario | Expected Output / Behavior | Source |
|---|------------------|----------------------------|--------|
| ST-21 | Item hidden by id, layer or group | Title and id absent from DOM, ARIA, tooltip, item list, inspector, print and overflow | RD-10 AC8; AR-18 |
| ST-22 | Title `<img src=x onerror=alert(1)>` | Rendered as text; no `img` element; no script execution | RD-10 AC9; AR-18 |
| ST-23 | Metadata HTML, unsafe `style`, hostile `className`, annotation HTML | No HTML/CSS injection; unsafe values dropped or escaped | RD-10 AC9; AR-18 |
| ST-24 | Render and interact with network spies installed | Zero `fetch`, XHR, beacon or WebSocket calls | RD-10 AC10; AR-19 |
| ST-25 | Browser interaction with a request log | No cross-origin request; only same-origin/data/blob URLs | RD-10 AC10; AR-19 |
| ST-26 | `pnpm audit --audit-level high` and the CI least-privilege contract | Exit 0; no high or critical advisory; `contents: read`, no `secrets.*`, no `pull_request_target`, no `write-all` | RD-10 AC16; AR-15, AR-16 |
| ST-27 | `pnpm test:licenses` | `THIRD_PARTY_NOTICES.md` is current; runtime and dev tooling sections present | RD-10 Should Have; AR-17 |
| ST-28 | Documented CSP header with `style-src-attr` | Grid and items render; no attacker URL requested | RD-10 AC13; AR-19 |
| ST-49 | Seeded invalid dates, malformed periods and duplicate/unknown references | Each returns a documented diagnostic or normalized value; no uncaught throw | RD-10 Security fuzz; AR-18 |

### Performance

| # | Input / Scenario | Expected Output / Behavior | Source |
|---|------------------|----------------------------|--------|
| ST-29 | 500/2k/10k items × compact/expanded/overflow | Node layout records p50/p95 for every cell | RD-10 AC11; AR-10, AR-29 |
| ST-30 | 500/2k/10k initial render, 12/14/18/24/36 months | Browser records `readyMs` and DOM node count | RD-10 AC11; AR-10 |
| ST-31 | 60-step production drag, compact and expanded | Records p50/p95 frame time and long tasks | RD-10 AC11; AR-10 |
| ST-32 | Overflow open/close with 10k items | Records elapsed time; budget 100 ms | RD-10 AC11; AR-10 |
| ST-33 | 10k compact initial layout | p95 ≤ 250 ms; otherwise `miss` with actual value | RD-10 AC11; AR-13 |
| ST-34 | Compact drag and expanded 500-fragment drag | p95 ≤ 16.7 ms and no long task > 50 ms; otherwise `miss` | RD-10 AC11; AR-13 |
| ST-35 | 12/14/18/24/36 initial render | p95 ≤ 150 ms; otherwise `miss` | RD-10 AC11; AR-13 |
| ST-36 | Issue #3 500-item dev and production drag in `PERF_STRICT=1` | Baseline and after files show the dev/production split; after p95 is ≤0.9× baseline p95 or ≤16.7 ms, with three repeats and no long-task/input-delay regression | Issue #3; AR-13, AR-14 |
| ST-37 | 36-month/500-item production drag | CPU profile saved; top self-time functions listed in the report | Issue #3; AR-28 |
| ST-38 | Two benchmark model builds with the same seed | Deep-equal output; 500/2k/10k models validate | RD-10 AC11; AR-29 |
| ST-39 | `previewIntersectsRow` for selection, item, marquee and empty previews; render-count probe | True only for intersecting non-marquee previews; non-intersecting rows do not re-render | AR-14 |
| ST-40 | Bundle size check | React entry+CSS ≤60 kB (measured ~40.55) and core+React+adapters+CSS total ≤65 kB (measured 63.36); both reported | RD-10 AC12; AR-2 |

### SSR, consumer and CI

| # | Input / Scenario | Expected Output / Behavior | Source |
|---|------------------|----------------------------|--------|
| ST-41 | Server `renderToString` without `window`/`document` | Grid and labels render; no `ResizeObserver` reference | RD-10 AC15; AR-20 |
| ST-42 | Hydrate server markup in a client with `navigator.language=de-DE` | No hydration warning or mismatch | RD-10 AC15; AR-20 |
| ST-43 | Packed core + React in a fresh Vite app | Install, build, `tsc --noEmit` against the packed types, CSS import and tree-shaken import succeed | RD-10 AC14 |
| ST-44 | CI workflow contract | `verify`, `browsers`, `security`, `performance` and `dco` jobs exist; artifact paths and reporters are present | RD-10 Must Have; AR-21 |
| ST-45 | Playwright config | `retries` is `0`; mobile projects are named `mobile-chromium` and `mobile-webkit` | RD-10 Should Have; AR-22 |
| ST-46 | Package scripts | Every documented command exists and maps to the expected runner | RD-10 Should Have; AR-21, AR-22 |
| ST-47 | Environment capture with a missing browser | Writes `not-installed`; does not guess a version | AR-21 |
| ST-48 | Test report | Contains commands, counts, browser versions, known gaps, audit result, benchmark values and both size measurements | RD-10 Must Have; AR-21 |

## Test Categories

### Specification Tests (from ST-cases above)

| Test file | ST cases covered | Component |
| --------- | ---------------- | --------- |
| `tests/quality/traceability.spec.test.ts` | ST-1–ST-5 | Traceability checker |
| `tests/quality/public-api.spec.test.ts` | ST-7 | Public API |
| `tests/quality/coverage-contract.spec.test.ts` | ST-6, ST-8, ST-40 | Coverage, API and size contract |
| `tests/quality/repo-contract.spec.test.ts` | RD-01 AC1–AC11 | Repository/process contract |
| `tests/quality/ci-contract.spec.test.ts` | ST-44–ST-48 | CI and report contract |
| `tests/quality/package-scripts.spec.test.ts` | ST-46 | Commands |
| `tests/e2e/quality-visual.spec.ts` | ST-14–ST-16 | Visual matrix |
| `tests/e2e/print-matrix.spec.ts` | ST-17, ST-18 | Print matrix |
| `tests/e2e/mobile.spec.ts` | ST-11, ST-12 | Mobile matrix |
| `tests/e2e/security.spec.ts` | ST-21, ST-25, ST-28 | Browser security |
| `tests/perf/bench.spec.ts` | ST-30–ST-37 | Performance harness |
| `scripts/bench-layout.mjs` | ST-29 | Node layout/ribbon harness |
| `packages/react/src/security.spec.test.tsx` | ST-21–ST-24 | Security/privacy |
| `packages/core/src/fuzz.spec.test.ts` | ST-49 | Parser fuzz |
| `packages/react/src/react19.spec.test.tsx` | ST-13 | React 19 |
| `packages/react/src/YearPlanner.ssr.spec.test.tsx` | ST-41 | SSR |
| `packages/react/src/YearPlanner.hydration.spec.test.tsx` | ST-42 | Hydration |
| `packages/react/src/interaction/preview.spec.test.tsx` | ST-39 | Preview row intersection |
| `tests/quality/bench-data.spec.test.ts` | ST-38 | Benchmark data determinism |
| `scripts/test-timezones.sh` | ST-9 | Timezone matrix |
| `scripts/clean-consumer.sh` | ST-43 | Clean consumer |

### Implementation Tests (edge cases, internals)

| Test file | Description | Priority |
| --------- | ----------- | -------- |
| `packages/react/src/security.impl.test.tsx` | Style allowlist, hostile class names, annotation text, diagnostics redaction | High |
| `packages/react/src/interaction/preview.impl.test.tsx` | Boundary and empty-preview edge cases | High |
| `tests/quality/traceability.impl.test.ts` | Malformed RD, missing acceptance section, duplicate IDs, slash expansion | High |
| `tests/quality/bench-data.impl.test.ts` | Count boundaries, clipping, invalid input | High |
| `scripts/ci-environment.mjs` | Missing browser, parseable output, no guessed versions | Medium |
| `scripts/write-licenses.mjs` | Stable ordering, stale detection, empty runtime section | Medium |

### Integration Tests

| Test | Components | Description |
| ---- | ---------- | ----------- |
| `RD-10-AC-02` traceability | RD files, matrix, tests | Full repository check |
| `RD-10-AC-11` benchmark | Demo fixture, core layout, React render, Playwright | One production run produces every scenario |
| `RD-10-AC-08/10` security | Planner, print tree, inspector, browser request log | Hidden/XSS/network paths together |
| `RD-10-AC-15` SSR | Core layout, React server render, client hydrate | Server/client locale split |

### End-to-End Tests

| Scenario | Steps | Expected result |
| -------- | ----- | --------------- |
| Window matrix | Load each window | Grid rows and screenshot match |
| Overflow | Open `+N`, close with Escape | Entries visible; popover closes |
| Print | Generate each PDF | Page count and A3 size match |
| Mobile | Load, tap, inspect | No console error; expected panel |
| Security | Load `?security=1`, interact | No leak, no external request |
| Performance | 60-step drag | Frame and long-task data recorded |

## Test Data

### Fixtures Needed

- Hidden item sentinel `TOPSECRET-HIDDEN` with id `secret-item`, hidden by id, layer and group.
- XSS item with hostile title, metadata, style and className.
- PRT-01 fixture: 2017 classic-yellow window, several items, ISO dates.
- Benchmark model: 500/2k/10k items, seed 42, five layers, 1–10 day durations.
- Mobile fixture: existing `?interaction=1` route.
- CI fixture: a minimal workflow and package manifest for contract tests.
- Traceability fixtures: complete, missing row, duplicate row, slash-expanded title, comment-only ID.

### Mock Requirements

- Network spies (`fetch`, XHR, beacon, WebSocket) are true browser externals and may be mocked.
- The Playwright request log is real; no mock.
- `pdfinfo` is a real external command; no mock.
- Core layout, validation and React rendering use real objects.
- No component internals are mocked.

## Verification Checklist

- [ ] All specification test cases (ST-1..ST-48) are defined with concrete input/output pairs
- [ ] Every ST case traces to a requirement, spec doc, or AR entry
- [ ] Specification tests are written before implementation
- [ ] Specification tests are verified to FAIL before implementation (red phase)
- [ ] All specification tests pass after implementation (green phase)
- [ ] Implementation tests cover edge cases and internals
- [ ] All unit, integration and E2E tests pass
- [ ] No regressions in the existing 207 core, 474 React and 108 Playwright tests
- [ ] Coverage stays at or above the RD-10 floor
- [ ] `pnpm verify:full` passes, including timezone, performance and benchmark steps
- [ ] `docs/test-report.md` records every required field and both size measurements
- [ ] No WCAG conformance claim is made while the manual AT audit is parked
