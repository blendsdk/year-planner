# CI and Evidence: Quality Gates Plan

> **Document**: 03-05-ci-evidence.md
> **Parent**: [Index](00-index.md)

## Overview

RD-10 requires CI to publish a test report with commands, pass/fail counts, browser versions, known
gaps and performance observations. The current workflow runs `pnpm verify` and the Playwright
suite, but uploads no report, records no browser versions and has no performance job. This
specification adds a small evidence layer on top of the existing GitHub Actions workflow. It uses
no external dashboard or paid service.

## Architecture

### Current Architecture

- `.github/workflows/ci.yml` has `verify`, `browsers` and `dco` jobs (lines 11–62).
- `verify` runs `pnpm verify` and `pnpm test:consumer`.
- `browsers` builds, installs poppler and Playwright browsers, and runs the full Playwright suite.
- There is no JSON reporter, no environment capture and no artifact upload.
- `docs/test-report.md` is updated by hand after a run.

### Proposed Changes

| Artifact | Change |
| -------- | ------ |
| `playwright.config.ts` | Add list, JSON and HTML reporters |
| `scripts/ci-environment.mjs` | Write Node, pnpm, OS, CPU, Playwright and browser versions |
| `.github/workflows/ci.yml` | Add environment capture, JSON results, artifact uploads, security and performance jobs |
| `package.json` | `typecheck:tools`, `test:environment`, `test:audit`, `test:quality`, `test:timezones`, `test:perf`, `bench`, `test:flaky` |
| `docs/test-report.md` | RD-10 counts, versions, budgets, issue #3 before/after and known gaps |
| `CONTRIBUTING.md` | Zero-retry flaky policy and local commands |

## Implementation Details

### CI jobs

| Job | Trigger | Commands | Artifacts |
| --- | ------- | -------- | --------- |
| `verify` | push and PR | `pnpm verify`, `pnpm test:timezones`, `pnpm test:consumer` | none |
| `browsers` | push and PR | build, install poppler/browsers, `pnpm exec playwright test` | environment, JSON, HTML report, PDFs |
| `security` | push and PR | install, `pnpm audit --audit-level high`, `pnpm test:licenses` | audit log |
| `performance` | push and PR | build, install Chromium, `pnpm bench`; upload profiles from `test-results/bench` | bench JSON/Markdown, CPU profiles |
| `dco` | PR only | Signed-off-by scan | none |

`verify` includes `test:quality`, `test:licenses` and the existing typecheck, lint, unit, build,
API report, size, Storybook, TypeDoc and pack checks. `verify:full` is the local release gate and
adds `test:e2e`, `test:timezones`, `test:audit`, `pnpm bench`, `test:perf` and `test:consumer`.
`pnpm bench` builds the demo before `test:perf` reuses the same production preview. `test:audit`
needs registry access; an offline environment reports the failure and does not claim a clean audit.

### Environment capture

`scripts/ci-environment.mjs`:

```bash
node scripts/ci-environment.mjs --out test-results/environment.txt
```

It writes:

```text
date: 2026-11-11T14:51:00Z
os: Ubuntu 26.04 LTS
cpu: Intel(R) Core(TM) i5-3470S CPU @ 2.90GHz (4 vCPU)
memory: 14 GiB
node: v24.21.0
pnpm: 12.9.1
playwright: 1.65.0
chromium: <browser.version()>
firefox: <browser.version()>
webkit: <browser.version()>
```

Browser versions are read from the installed Playwright browsers with `browser.version()`. A
missing browser is recorded as `not-installed`, not guessed. The script is safe to run locally.

### Playwright reporters

```ts
reporter: [
  ["list"],
  ["json", { outputFile: "test-results/playwright.json" }],
  ["html", { open: "never" }],
],
```

The JSON result is the machine-readable count source; the HTML report is the human artifact. Both
are uploaded. `test-results` and `playwright-report` are already gitignored.

### Test report fields

`docs/test-report.md` must record:

| Field | Source |
| ----- | ------ |
| Commands | The exact commands run |
| Core/React test counts | Vitest output |
| Playwright pass/fail/skip counts | Playwright JSON |
| Browser versions | `environment.txt` |
| A3 page counts and page size | `pdfinfo` output |
| Coverage | Vitest coverage summary |
| Bundle size and budget | `pnpm test:size`: React entry+CSS against 60 kB and total against 65 kB |
| Audit result | `pnpm audit --audit-level high` |
| License report status | `pnpm test:licenses` |
| Benchmark results | `docs/benchmarks/rd10-after.*` |
| Known gaps | Manual list |
| Both size measurements | AR-2 note |

The report never states a browser version, performance value or conformance claim that was not
measured.

### Artifact uploads

```yaml
- uses: actions/upload-artifact@v4
  if: always()
  with:
    name: browser-evidence
    path: |
      test-results/
      playwright-report/
    retention-days: 14
```

Performance artifacts:

```yaml
- uses: actions/upload-artifact@v4
  if: always()
  with:
    name: performance-evidence
    path: |
      docs/benchmarks/
      test-results/bench/
    retention-days: 14
```

`if: always()` preserves evidence for failed runs. A failed upload is reported as a workflow warning,
not silently ignored.

### Flaky policy in CONTRIBUTING

Add a short section:

```markdown
## Flaky tests

Retries are disabled by default. A flaky test is fixed at the root cause or quarantined with a
linked issue. Use `pnpm test:flaky` (Chromium, `--repeat-each=3`) to reproduce a suspected flake.
Never add a retry to hide a failure.
```

## Code Examples

### Security job

```yaml
security:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v4
      with:
        version: 12.9.1
    - uses: actions/setup-node@v4
      with:
        node-version: 24
        cache: pnpm
    - run: pnpm install --frozen-lockfile
    - run: pnpm audit --audit-level high 2>&1 | tee test-results/audit.txt
    - run: pnpm test:licenses
    - uses: actions/upload-artifact@v4
      if: always()
      with:
        name: security-evidence
        path: test-results/audit.txt
        retention-days: 14
```

### Timezone step in the verify job

```yaml
      - run: pnpm verify
      - run: pnpm test:timezones
      - run: pnpm test:consumer
```

### Performance job

```yaml
performance:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v4
      with:
        version: 12.9.1
    - uses: actions/setup-node@v4
      with:
        node-version: 24
        cache: pnpm
    - run: pnpm install --frozen-lockfile
    - run: pnpm build
    - run: npx playwright install --with-deps chromium
    - run: pnpm bench
    - run: node scripts/ci-environment.mjs --out test-results/environment.txt
    - uses: actions/upload-artifact@v4
      if: always()
      with:
        name: performance-evidence
        path: |
          docs/benchmarks/
          test-results/bench/
          test-results/environment.txt
        retention-days: 14
```

## Error Handling

| Error Case | Handling Strategy | AR Ref |
| ---------- | ----------------- | ------ |
| Browser version cannot be read | Record `not-installed`; do not guess | AR-21 |
| Artifact upload fails | `if: always()` still attempts; the workflow warns and the job log keeps the path | AR-21 |
| Audit registry unavailable | Retry once, then fail with the network error; never report a clean audit | AR-16 |
| Performance job runner differs from the reference host | Report the environment; apply only the 2× ceiling | AR-12, AR-13 |
| Playwright JSON output missing | The report step fails; counts cannot be invented | AR-21 |
| A flaky test appears in CI | Fix or quarantine with an issue; no retry | AR-22 |
| `verify` runs too long | Keep bench and perf in `verify:full`; timezone is a fast core-only step in `verify` | AR-10 |

> **Traceability:** AR-10 through AR-13, AR-16, AR-21 and AR-22 own the decisions in this document.

## Testing Requirements

- `tests/quality/ci-contract.spec.test.ts` asserts the workflow contains the `verify`, `browsers`,
  `security`, `performance` and `dco` jobs, the `test:timezones` step, the environment step, the
  JSON/HTML reporters, the artifact paths and the least-privilege/no-secrets contract.
- `tests/quality/package-scripts.spec.test.ts` asserts every documented command exists.
- `scripts/ci-environment.mjs` writes a parseable file and records `not-installed` for a missing
  browser.
- The test report contains every required field, including both size measurements and the known gaps.
