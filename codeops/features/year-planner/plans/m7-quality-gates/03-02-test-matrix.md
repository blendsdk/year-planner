# Test Matrix: Quality Gates Plan

> **Document**: 03-02-test-matrix.md
> **Parent**: [Index](00-index.md)

## Overview

This specification defines the browser, mobile, visual, print and timezone matrices required by
RD-10, plus the zero-retry flaky policy. It extends the existing Playwright and Vitest suites; it
does not add a new runner, browser service or paid screenshot provider.

## Architecture

### Current Architecture

- Desktop projects: Chromium, Firefox and WebKit (`playwright.config.ts:18-21`).
- One touch project: Pixel 5 for `interaction-touch.spec.ts` (`playwright.config.ts:22-26`).
- Visual baselines: 2016 blue, 2017 yellow, 2027 items, 2016 print
  (`tests/e2e/classic-year.spec.ts:13-98`).
- Print: 14-month, 24-month and 36-month PDFs (`tests/e2e/classic-year.spec.ts:35-137`).
- Demo window choices: 14, 24 and 36 only (`apps/demo/src/App.tsx`).
- No timezone script and no explicit retry policy.

### Proposed Changes

| Artifact | Change |
| -------- | ------ |
| `playwright.config.ts` | Explicit `retries: 0`; add `mobile-chromium` and `mobile-webkit` projects |
| `apps/demo/src/App.tsx` | Add 12- and 18-month options; add a print fixture route |
| `tests/e2e/quality-visual.spec.ts` | New `@visual` matrix for windows, density, theme and print |
| `tests/e2e/print-matrix.spec.ts` | 12/14/18/24/36 PDFs and PRT-01 |
| `tests/e2e/mobile.spec.ts` | Small mobile smoke |
| `scripts/test-timezones.sh` | Three-timezone core run |
| `package.json` | `test:a11y`, `test:timezones`, `test:flaky` |

## Implementation Details

### Browser matrix

| Project | Engine | Role | Notes |
| ------- | ------ | ---- | ----- |
| `chromium` | Chromium | Chrome proxy and Edge proxy | Primary PDF/axe engine |
| `firefox` | Firefox | Firefox | Full desktop suite |
| `webkit` | WebKit | Safari proxy | Full desktop suite |
| `mobile-chromium` | Chromium, Pixel 5 | Mobile Chrome | `@mobile` only |
| `mobile-webkit` | WebKit, iPhone 13 | Mobile Safari | `@mobile` only |
| `touch-chromium` | Chromium, Pixel 5 | Touch editing | Existing `interaction-touch` only |

The test report records `browser.version()` for each engine and the Playwright version. The
"latest two stable" wording is not executed: Playwright supplies one bundled version per engine, and
Edge/Safari are proxies. This is a known gap, not a claim. No statement is made about a browser
release that was not executed.

### Visual matrix

`tests/e2e/quality-visual.spec.ts` adds these desktop tests. Each uses a fixed viewport, disables
animations, waits for the grid, and calls `toHaveScreenshot` with `maxDiffPixelRatio: 0.02`.

| Test | Setup | Snapshot |
| ---- | ----- | -------- |
| `RD-10-AC-04: 12-month compact @visual` | 12-month range, classic blue | `quality-12-months.png` |
| `RD-10-AC-04: 18-month compact @visual` | 18-month range | `quality-18-months.png` |
| `RD-10-AC-04: 24-month compact @visual` | 24-month range | `quality-24-months.png` |
| `RD-10-AC-04: 36-month compact @visual` | 36-month range | `quality-36-months.png` |
| `RD-10-AC-04: compact overflow @visual` | 2027, compact density, `+N` open | `quality-overflow-compact.png` |
| `RD-10-AC-04: expanded overflow @visual` | 2027, expanded density | `quality-overflow-expanded.png` |
| `RD-10-AC-04: high-contrast theme @visual` | 2027, high contrast | `quality-high-contrast.png` |
| `RD-10-AC-06: print preview @visual` | 2016 print media | `quality-print.png` |

The existing 14-month, 2017 yellow and 2027-items snapshots remain. Baselines are generated for
Chromium, Firefox and WebKit. A missing baseline fails the test and writes the actual image; the
executor updates baselines intentionally and reviews the diff before committing.

### Print matrix

`tests/e2e/print-matrix.spec.ts`, Chromium only:

| Window | Expected pages | Assertions |
| ------ | -------------- | ---------- |
| 12 | 1 | `pdfinfo` page count and `1191.12 x 842.88 pts` |
| 14 | 1 | Existing assertion retained |
| 18 | 2 | Page count and page size |
| 24 | 2 | Existing assertion retained |
| 36 | 3 | Existing assertion retained |
| PRT-01 (2017 yellow, items, ISO dates) | 1 | Page count, month label, weekday header, ISO week, ribbon text, no row overflow |

The print DOM must contain every month label, 37 weekday headers, visible ISO week numbers and the
expected fragment text before `page.pdf` is called. Each month row's bounding box must sit inside its
`.yp-print-page` content box (no overflow), and each weekend cell must keep its weekend class or
data attribute. After PDF generation, `pdftotext -layout` must contain every month label, weekday
header, ISO week number and expected ribbon text; a page count alone is not proof. `pdfinfo` and
`pdftotext` are installed in CI by the existing `poppler-utils` step.

### Mobile smoke

`tests/e2e/mobile.spec.ts` is a short, touch-oriented test:

1. Load `/?interaction=1` at the device viewport.
2. Assert the grid and 14 month rows render.
3. Tap a date cell and assert the inspector opens or the selection updates, according to the fixture
   mode.
4. Assert no console error was emitted.
5. Assert the page does not overflow horizontally beyond the viewport (the planner scrolls inside its
   own viewport).

It does not repeat the full desktop suite. Touch editing physics remain covered by the existing
Chromium CDP test; WebKit mobile proves rendering and basic tap behavior.

### Timezone matrix

`scripts/test-timezones.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
for zone in UTC Pacific/Kiritimati America/Los_Angeles; do
  echo "== TZ=$zone =="
  TZ="$zone" pnpm --filter @blendsdk/year-planner-core exec vitest run
done
```

The script runs the full core suite, not a hand-picked subset, so date arithmetic, ISO weeks,
period parsing, layout and validation all see the same `TZ`. CI calls the same script. No
`process.env.TZ` mutation inside a test process is used because Node caches the timezone.

### Flaky policy

- `retries: 0` is explicit in `playwright.config.ts`; `trace: "retain-on-failure"` keeps failure
  evidence now that retries never run.
- Unit/component tests never retry; Vitest has no retry configured.
- `pnpm test:flaky` runs `playwright test --repeat-each=3 --project=chromium` for triage only. It is
  not part of `verify` or CI.
- A failure is fixed at the root cause or quarantined with a linked issue. Retries are never used to
  hide a flake.
- The policy is documented in `CONTRIBUTING.md` and `docs/test-report.md`.

## Code Examples

### Window option

```tsx
<select value={months} onChange={(event) => setMonths(Number(event.target.value))}>
  <option value={12}>12 months</option>
  <option value={14}>14 months</option>
  <option value={18}>18 months</option>
  <option value={24}>24 months</option>
  <option value={36}>36 months</option>
</select>
```

### Print assertion

```ts
const pdf = readPdfInfo("test-results/quality-18-months-a3.pdf");
expect(pdf.pages).toBe(2);
expect(pdf.pageSize).toContain("1191.12 x 842.88 pts");
```

## Error Handling

| Error Case | Handling Strategy | AR Ref |
| ---------- | ----------------- | ------ |
| Missing visual baseline | Playwright writes the actual image and fails; update intentionally | AR-8 |
| A print row overflows its page | Fail the row-bounds assertion; do not accept page count alone | AR-9 |
| Browser not installed | Fail with the existing Playwright install hint; CI installs all engines | AR-6 |
| `pdfinfo` missing | Fail with the install hint; CI installs `poppler-utils` | AR-9 |
| Mobile project unavailable | Fail; do not silently skip a configured project | AR-7 |
| Timezone name unsupported | Vitest fails under that `TZ`; do not swallow the error | AR-5 |
| Visual diff from a real regression | Fail and review; never lower the tolerance to pass | AR-8 |
| Flaky test | Fix or quarantine with an issue; never add retries | AR-22 |

> **Traceability:** AR-5 through AR-9 and AR-22 own the decisions in this document.

## Testing Requirements

- Each new visual test has a checked-in baseline for Chromium, Firefox and WebKit.
- Print tests assert page count, page size, row bounds and `pdftotext` content, not just that a PDF exists.
- Mobile tests run on both configured mobile engines.
- The timezone script fails when any zone fails.
- The Playwright config test asserts `retries === 0` and the mobile project names.
