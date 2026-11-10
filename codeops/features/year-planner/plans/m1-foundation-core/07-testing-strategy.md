# Testing Strategy: M1 Foundation and Core

> **Document**: 07-testing-strategy.md
> **Parent**: [Index](00-index.md)

## Testing Overview

### Coverage Goals

| Code type | Target |
|---|---|
| Temporal core | 95% lines/branches |
| Layout core | 95% lines/branches |
| React grid | 80% lines/branches |
| Tooling/config | Smoke tests |

> **Traceability:** each ST row is implemented under the `RD-XX-AC-NN` test ID
> from its Source column; `ST-N` is a plan-local label. Rows sourced to a plan
> local decision or an RD Must Have use `PLAN-AR-N` / `RD-XX-MH` and are still
> named in the test title. Every RD-01/02/03 acceptance criterion has at least
> one ST row; security ACs are ST-46/ST-54; RD-01 AC6/AC9 are ST-55/ST-56.

- Test names state behavior: `should ... when ...`.
- Spec tests are written before implementation and are the immutable oracle.
- Integration/print tests use real Chromium; no mocked geometry.

## Specification Test Cases

### Temporal core

| # | Input / Scenario | Expected Output / Behavior | Source |
|---|---|---|---|
| ST-1 | `parseDateKey('2016-01-01')` | valid DateKey | RD-02 AC1 |
| ST-2 | `parseDateKey('2027-02-29')` | `INVALID_DATE` | RD-02 AC9 |
| ST-3 | `parseDateKey('1500-01-01')` | `UNSUPPORTED_YEAR` | RD-02 AC9 |
| ST-4 | Jan 1 2016 Saturday-first column | column 6 | RD-02 AC1 |
| ST-5 | Jan 31 2016 column | column 36 | RD-02 AC1 |
| ST-6 | Jan 1 2017 column | column 1 | RD-02 AC2 |
| ST-7 | `daysInMonth(2016, 2)` / `(2017, 2)` | 29 / 28 | RD-02 AC3 |
| ST-8 | `isoWeekOf('2016-01-01')` | `{ week: 53, weekYear: 2015 }` | RD-02 AC4 |
| ST-9 | `isoWeekOf('2016-01-04')` | `{ week: 1, weekYear: 2016 }` | RD-02 AC4 |
| ST-10 | `isoWeekOf('2017-01-01')` | `{ week: 52, weekYear: 2016 }` | RD-02 AC4 |
| ST-11 | subtract `[2027-06-14, 2027-06-17)` from `[2027-06-10, 2027-06-21)` | two intervals `[10,14)` and `[17,21)` | RD-02 AC7 |
| ST-12 | touching `[a,b)` and `[b,c)` | `overlaps` false; union only with merge policy | RD-02 AC8 |
| ST-13 | zero/reverse range | `INVALID_RANGE` | RD-02 AC9 |
| ST-14 | date-only suite under `TZ=Pacific/Kiritimati` and `America/Los_Angeles` | identical results | RD-02 AC10 |
| ST-15 | timed interval crossing DST in explicit zone | correct date span | RD-02 AC11 |
| ST-43 | intersect `[2027-01-28,2027-02-07)` with Jan and Feb rows | Jan 28–31 + Feb 1–6; total 10 days | RD-02 AC5 |
| ST-44 | intersect `[2026-12-28,2027-01-04)` with Dec/Jan rows | Dec 28–31 + Jan 1–3; one identity | RD-02 AC6 |
| ST-45 | leap years 1900 / 2000 / 1600 | not leap / leap / leap | RD-02 AC3 |
| ST-46 | invalid input/security | `INVALID_DATE`/`UNSUPPORTED_YEAR`/`INVALID_RANGE`; source has no `eval`/local Date | RD-02 AC12 |
| ST-47 | `format`, `subtractDays`, min/max, `dayOfWeek`, `contains`, `splitAtDateBoundary` | documented results | RD-02 Must Have |

### Classic layout

| # | Input / Scenario | Expected Output / Behavior | Source |
|---|---|---|---|
| ST-16 | `buildClassicYearLayout({ year: 2016 })` | 14 rows, Dec 2015–Jan 2017 | RD-03 AC1 |
| ST-17 | each row | 37 day columns, 2 labels, weekday headers | RD-03 AC2 |
| ST-18 | Jan 2016 row | day 1 col 6; day 31 col 36 | RD-03 AC3 |
| ST-19 | Jan 2017 row | day 1 col 1; day 31 col 31 | RD-03 AC4 |
| ST-20 | Feb 2016 / 2017 | 29 / 28 numbered cells | RD-03 AC5 |
| ST-21 | ISO week labels | 53, 1, 52, 1 at the specified dates | RD-03 AC6 |
| ST-22 | `range` Jan 2027, 12 months | 12 rows, Jan–Dec 2027 | RD-03 AC7 |
| ST-23 | 18-month range Jul 2027 | 18 rows; Jul–Dec 2027 current, Jan–Dec 2028 context | RD-03 AC8 |
| ST-24 | `contextMonths: { before: 0, after: 0 }` | 12 rows | RD-03 AC7 |
| ST-25 | `monthCount: 11` / `37` | `INVALID_MONTH_COUNT` | RD-03 AC9 |
| ST-26 | 24/36-month window | 24/36 rows; keyboard reachability is ST-53 | RD-03 AC10 |
| ST-27 | blank slots | no DateKey, not selectable | RD-03 AC11 |
| ST-28 | weekend/weekday widths | weekend narrower; prefix sums monotonic | RD-03 AC12 |
| ST-29 | identical inputs | identical layout signature | RD-03 AC13 |
| ST-30 | range starting 9999-06, 12 months | `INVALID_RANGE` | RD-03 AC14 |
| ST-48 | `year: 2016` highlight tint | Dec 2015 context, 2016 current, Jan 2017 context | RD-03 AC1 / AR #11 |
| ST-49 | `contextMonths` negative/>12/non-integer/total<12/>36 | `INVALID_CONTEXT_MONTHS` | RD-03 Must / AR #12 |
| ST-50 | range starting 1600-01 | `UNSUPPORTED_VIEW_YEAR` | RD-03 AC14 |
| ST-51 | 2016 blue print | A3 420×297 mm, no clipped row | Plan AC6 / RD-05 AC11 |
| ST-52 | 15/28/29/36-month pagination | 2/2/3/3 pages, no row split | RD-05 print rules |

### Minimal React grid

| # | Input / Scenario | Expected Output / Behavior | Source |
|---|---|---|---|
| ST-31 | `<YearPlanner year={2016} />` | 14 rows, 37 cells/row, labels mirrored | RD-03 AC1–2 |
| ST-32 | blue → yellow theme switch | dates/geometry unchanged; colors change | RD-06 AC1 (minimal) |
| ST-33 | 2017 yellow print | A3 420×297 mm, no clipped row | RD-05 AC11 (print subset) |
| ST-34 | fresh Vite consumer installs packed tarballs | grid renders; CSS resolves | RD-01 AC5 |
| ST-35 | missing year/range | empty state, `MISSING_RANGE` | RD-06 defaults / AR #2 |
| ST-36 | 36-month window | 36 rows render without crash | RD-03 AC10 |
| ST-53 | 36-month keyboard navigation | grid has one tab stop; arrows move date focus | RD-03 AC10 / RD-09 keyboard |
| ST-54 | security smoke | no secrets/tokens in repo; no `eval`/dangerous HTML; no network requests | RD-01 AC10–11 / RD-03 AC15 |

### Foundation/toolchain

| # | Input / Scenario | Expected Output / Behavior | Source |
|---|---|---|---|
| ST-37 | `pnpm install --frozen-lockfile` | success on Node 24 | RD-01 AC1 |
| ST-38 | `pnpm typecheck` | strict pass, no `any` in public types | RD-01 AC2 |
| ST-39 | `pnpm build` | ESM + d.ts + maps for both packages | RD-01 AC3 |
| ST-40 | `pnpm pack:check` | no `publint`/`attw` errors | RD-01 AC4 |
| ST-41 | missing DCO sign-off | CI check fails | RD-01 AC7 |
| ST-42 | package manifests | MIT, type module, files allowlist, sideEffects CSS | RD-01 AC8 |
| ST-55 | React 18.2 and 19 smoke render | both render the grid | RD-01 AC6 |
| ST-56 | `pnpm verify:full` | includes e2e/visual/print | RD-01 AC9 |
| ST-57 | CI workflow | `tsc7-canary` exists and is non-blocking | RD-01 AC6 |

## Test Categories

### Specification Tests

| Test File | ST Cases | Component |
|---|---|---|
| `date.spec.test.ts` | ST-1–ST-10, ST-14, ST-45–ST-47 | Temporal |
| `period.spec.test.ts` | ST-11–ST-13, ST-15 | Temporal |
| `interval.spec.test.ts` | ST-43–ST-44 | Temporal |
| `classic-year.spec.test.ts` | ST-16–ST-30, ST-48–ST-50 | Layout |
| `YearPlanner.spec.test.tsx` | ST-31–ST-32, ST-35–ST-36, ST-53 | React grid |
| `print.spec.test.ts` | ST-33, ST-51–ST-52 | Print |
| `consumer.spec.test.ts` | ST-34 | Consumer |
| `toolchain.spec.test.ts` / `scripts/toolchain-check.sh` | ST-37–ST-42, ST-54–ST-56 | Toolchain |

### Implementation Tests

- Epoch-day conversion round-trips; ISO week boundaries 2015/2016/2017.
- Interval normalization/merge edge cases; adjacent intervals.
- Layout prefix widths with all four month-start columns; leap years.
- React blank slots, mirrored labels, zero items, theme fallback.

### Integration / E2E

- Playwright renders 2016/2017, checks cell counts, labels and print media.
- Clean consumer installs packed tarballs in a temp Vite app.

## Test Data

- Fixtures: 2016 blue OH dates, 2017 yellow OH dates (from handoff legacy
  transcription, marked unverified sample data).
- No source photos in the package or tests.

## Verification Checklist

- [ ] All ST cases defined with input→output
- [ ] Every ST case traces to RD/AR
- [ ] Spec tests fail before implementation (red)
- [ ] Spec tests pass after implementation (green)
- [ ] Impl tests cover edges/internals
- [ ] `pnpm verify` passes
- [ ] `pnpm verify:full` passes where wired
