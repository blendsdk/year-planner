# Temporal Core: M1

> **Document**: 03-02-temporal-core.md
> **Parent**: [Index](00-index.md)

## Overview

Implements RD-02 date-only arithmetic, half-open periods, ISO weeks and interval
algebra in `@blendsdk/year-planner-core`. No React, DOM, timezone conversion or
recurrence.

## Architecture

- `src/date.ts`: validation, epoch-day math, day-of-week, ISO week.
- `src/period.ts`: `PlannerPeriod` validation and duration/projection.
- `src/interval.ts`: intersect/union/subtract/merge/overlap.
- `src/diagnostics.ts`: `Diagnostic` codes and helpers.
- `src/index.ts`: public exports.

### Date representation

`DateKey` is a validated `YYYY-MM-DD` string. Internally use integer epoch days
(Hinnant civil-date algorithm), never local `Date`.

### ISO week

Monday-based; compute week-year and week number. `2016-01-01` → 53/2015;
`2016-01-04` → 1/2016; `2017-01-01` → 52/2016; `2017-01-02` → 1/2017.

### Intervals

All half-open. `subtract([10,21), [14,17))` → `[10,14)`, `[17,21)`.
Touching intervals do not overlap; `mergeAdjacent` only when explicitly enabled.

### Timed periods

Validate RFC 3339 instants and IANA zones. `projectTimedPeriod(period, zone)`
uses `Intl.DateTimeFormat` in the explicit zone; no default guess. Timed editing
is not in this plan.

## Implementation Details

```ts
type DateKey = string;
type InstantISO = string;

function parseDateKey(value: string): { ok: true; date: DateKey } | { ok: false; diagnostic: Diagnostic };
function formatDateKey(date: DateKey): string;
function addDays(date: DateKey, days: number): DateKey;
function subtractDays(date: DateKey, days: number): DateKey;
function diffDays(a: DateKey, b: DateKey): number;
function compareDateKeys(a: DateKey, b: DateKey): -1 | 0 | 1;
function minDate(a: DateKey, b: DateKey): DateKey;
function maxDate(a: DateKey, b: DateKey): DateKey;
function dayOfWeek(date: DateKey): 0 | 1 | 2 | 3 | 4 | 5 | 6; // Saturday-first
function daysInMonth(year: number, month: number): number;
function isoWeekOf(date: DateKey): { week: number; weekYear: number };
function eachDate(start: DateKey, endExclusive: DateKey): DateKey[];
function normalize(periods: PlannerPeriod[], mergeAdjacent?: boolean): PlannerPeriod[];
function contains(period: PlannerPeriod, date: DateKey): boolean;
function splitAtDateBoundary(period: PlannerPeriod, date: DateKey): PlannerPeriod[];
function intersect(a: PlannerPeriod, b: PlannerPeriod): PlannerPeriod | null;
function union(a: PlannerPeriod, b: PlannerPeriod): PlannerPeriod[];
function subtract(a: PlannerPeriod, b: PlannerPeriod): PlannerPeriod[];
function mergeAdjacent(periods: PlannerPeriod[], merge: boolean): PlannerPeriod[];
function overlaps(a: PlannerPeriod, b: PlannerPeriod): boolean;
```

## Error Handling

| Error Case | Handling | AR Ref |
|---|---|---|
| Malformed/invalid date | `INVALID_DATE` diagnostic, no throw for host input | AR #4 |
| Year outside 1600–9999 | `UNSUPPORTED_YEAR` | AR #1 |
| `end <= start` | `INVALID_RANGE` | AR #1 |
| Unknown timezone | `INVALID_TIMEZONE` | AR #10 |
| Malformed instant | `INVALID_INSTANT` | AR #1 |
| Timed projection fails | `TIMED_PROJECTION_FAILED` | AR #10 |

## Testing Requirements

- Spec tests for RD-02 AC1–12.
- TZ matrix: UTC, `Pacific/Kiritimati`, `America/Los_Angeles`.
- Property tests for add/diff/invert and interval subtract/union invariants.
