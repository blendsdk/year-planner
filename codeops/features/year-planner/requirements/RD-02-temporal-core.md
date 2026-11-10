# RD-02: Temporal Core and Interval Algebra

> **Document**: RD-02-temporal-core.md
> **Status**: Draft
> **Created**: 2026-11-10
> **Project**: Year Planner for React
> **Depends On**: RD-01
> **CodeOps Artifact Schema**: 1

---

## Feature Overview

Defines the framework-neutral temporal foundation: date-only values, timed
instants, half-open periods and interval algebra. Every layout, interaction and
command decision depends on these semantics, so they are specified before any
view code.

All intervals are **half-open** `[start, endExclusive)`. Date-only values have
no timezone. Timed values are absolute instants with an IANA display zone. A
date-only value never silently becomes midnight UTC.

---

## Functional Requirements

### Must Have

- [ ] `DateKey` is a validated Gregorian `YYYY-MM-DD` string in the supported
  range **1600-01-01 through 9999-12-31**.
- [ ] Date-only arithmetic uses Gregorian calendar space and never local
  `Date` conversion, DST rules or host timezone.
- [ ] Supported operations: parse, format, validate, compare, add days,
  subtract days, diff days, min/max, days in month, each date in a range,
  day of week (Saturday-first index), ISO week number and ISO week-year.
- [ ] `AllDayPeriod` is `{ kind: 'all-day'; startDate; endDateExclusive }` and
  requires `startDate < endDateExclusive`.
- [ ] `TimedPeriod` is `{ kind: 'timed'; start; endExclusive; timeZone }` with
  RFC 3339 instants and a valid IANA zone; requires `start < endExclusive`.
- [ ] Timed periods can be projected to the date span they touch in an explicit
  `displayTimeZone`; projection is deterministic and DST-aware via `Intl`.
  The React view defaults `displayTimeZone` to `UTC` (RD-06). Timed move/resize
  is rejected with `TIMED_EDITING_UNSUPPORTED` (RD-08).
- [ ] Interval operations: intersect, union, subtract, normalize, merge
  touching intervals, contains, overlaps and split at a date boundary.
- [ ] Touching intervals `[a,b)` and `[b,c)` are **not** overlapping.
- [ ] Invalid dates, impossible dates, unsupported years, invalid zones and
  zero/reverse ranges produce typed diagnostics, never silent normalization.
- [ ] ISO week numbers are Monday-based and may belong to the previous or next
  ISO week-year.

### Should Have

- [ ] A `DateKey` parser with an explicit result type rather than throwing for
  host-supplied input.
- [ ] Deterministic `compareDateKeys` and stable sorting helpers.

### Won't Have (Out of Scope)

- Recurrence expansion, RRULE, RDATE, EXDATE — P1.
- Timed event move/resize and day/week views — P1.
- Non-Gregorian calendars — not supported.
- Timezone database updates or a bundled tzdata — use the host runtime.

---

## Technical Requirements

### Core types

```ts
type DateKey = string; // validated YYYY-MM-DD
type InstantISO = string; // validated RFC 3339 instant with offset

type PlannerPeriod =
  | { kind: 'all-day'; startDate: DateKey; endDateExclusive: DateKey }
  | { kind: 'timed'; start: InstantISO; endExclusive: InstantISO; timeZone: string };
```

### Date math

Use integer civil-day arithmetic (days since a fixed epoch) for date-only
values. Do not use `new Date(year, month, day)` or local timezone conversion.
ISO week calculation must use the ISO week-year, not the calendar year.

### Diagnostics

| Code | Condition |
|---|---|
| `INVALID_DATE` | Malformed or impossible `DateKey` |
| `UNSUPPORTED_YEAR` | Year outside 1600–9999 |
| `INVALID_RANGE` | `end <= start` |
| `INVALID_INSTANT` | Malformed RFC 3339 instant |
| `INVALID_TIMEZONE` | Unknown IANA zone |
| `TIMED_PROJECTION_FAILED` | Instant cannot be projected in the requested zone |

### Complexity

Date parsing and math: **S**. Interval algebra: **M**. Timed projection: **M**.

---

## Integration Points

- RD-03 uses date math, month boundaries and ISO weeks.
- RD-05 uses interval intersection and splitting for fragments.
- RD-07 uses interval algebra for selection, paint, erase, move and resize.
- RD-08 uses period validation in command proposals.

---

## Scope Decisions

| Decision | Options Considered | Chosen | Rationale | AR Ref |
|---|---|---|---|---|
| Date range | Any JS year, 1600–9999, 1970–2100 | 1600–9999 core; view 1601–9998 | Avoids JS year 0–99 trap; context months stay in range | AR #60 |
| Date representation | JS Date, string, Temporal | Validated string + integer math | No timezone drift; no polyfill dependency | AR #72 |
| Timed events | Full editing, projection only, exclude | Projection only | Keeps R1 classic view date-focused | AR #5, #46 |
| Interval boundary | Closed, half-open | Half-open | Adjacent intervals do not overlap; matches handoff | AR #73 |

---

## Security Considerations

- **Data sensitivity**: Dates and titles may be business-sensitive; the core
  must not log or persist them.
- **Input validation**: All host-supplied date/time strings are validated;
  malformed values return diagnostics.
- **Authentication & authorization**: N/A — pure library.
- **Injection risks**: No SQL, shell, HTML or filesystem access.
- **Encryption needs**: N/A — no storage or transport.
- **Rate limiting**: N/A — no endpoints.
- **Infrastructure**: N/A — pure TypeScript.

---

## Acceptance Criteria

1. [ ] `2016-01-01` is Friday at Saturday-first column 6; `2016-01-31` is at
   column 36 in the January 2016 row.
2. [ ] `2017-01-01` is Sunday at column 1; `2017-01-31` is at column 31.
3. [ ] February 2016 has 29 days; February 2017 has 28; 1900 is not leap; 2000
   and 2028 are leap.
4. [ ] `2016-01-01` reports ISO week 53 of ISO week-year 2015; `2016-01-04`
   reports week 1 of 2016; `2017-01-01` reports week 52 of 2016; `2017-01-02`
   reports week 1 of 2017.
5. [ ] `[2027-01-28, 2027-02-07)` intersects January as Jan 28–31 and February
   as Feb 1–6, with total duration 10 days.
6. [ ] `[2026-12-28, 2027-01-04)` intersects December 2026 and January 2027 and
   remains one logical interval.
7. [ ] `[2027-06-10, 2027-06-21)` minus `[2027-06-14, 2027-06-17)` yields
   `[2027-06-10, 2027-06-14)` and `[2027-06-17, 2027-06-21)`.
8. [ ] `[a,b)` and `[b,c)` do not overlap; union merges them only when the
   merge policy is enabled.
9. [ ] Zero-length and reverse ranges return `INVALID_RANGE`; `2027-02-29`
   returns `INVALID_DATE`; year 1500 returns `UNSUPPORTED_YEAR`.
10. [ ] The same date-only test suite passes under `TZ=Pacific/Kiritimati`,
    `TZ=America/Los_Angeles` and `TZ=UTC`.
11. [ ] A timed interval crossing a DST transition projects to the correct
    sequence of dates in its display zone.
12. [ ] Security requirements verified: no `eval`, no local `Date` parsing,
    no untrusted string interpolation into executable code.
