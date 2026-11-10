# RD-03: Classic Year Layout and Dynamic Months

> **Document**: RD-03-classic-year-layout.md
> **Status**: Draft
> **Created**: 2026-11-10
> **Project**: Year Planner for React
> **Depends On**: RD-01, RD-02
> **CodeOps Artifact Schema**: 1

---

## Feature Overview

Generates the calendar coordinate plane: the 14-month classic year view derived
from the two photographed planners, with a configurable window of at least 12
months. The layout is pure data — month rows, 37 day columns, variable weekend
widths, date-to-column mapping, prefix widths and row bounds — so the same
geometry drives HTML, SVG, print and hit-testing.

The classic preset is December of `year - 1`, January–December of `year`, and
January of `year + 1`. It is the default, not a hardcoded requirement.

---

## Functional Requirements

### Must Have

- [ ] Classic default: 14 month rows — previous December, current January–
  December, following January.
- [ ] Configurable window from **12 to 36** month rows. The 37 day columns are
  fixed: 31 days plus at most 6 leading blank slots always fit.
- [ ] `year` + `contextMonths` preset: `{ before: 1, after: 1 }` produces the
  classic 14; `{ before: 0, after: 0 }` produces 12. `before`/`after` are
  integers 0–12 and `before + 12 + after` must be 12–36; otherwise emit a
  diagnostic.
- [ ] Explicit `range` form: `{ start: { year, month }, monthCount }` where
  `month` is **0–11**, `monthCount >= 12` and `<= 36`; invalid values produce a
  diagnostic.
- [ ] Classic view years are **1601–9998** so the previous December and
  following January are inside the supported date core (1600–9999).
- [ ] `highlightYear` controls which calendar year receives the “current” tint:
  a month is current when its calendar year equals `highlightYear`; all other
  months are context. Default is the year of the start month. The classic
  preset defaults `highlightYear` to `year`.
- [ ] Each row exposes: year, month index, context/current kind, first date,
  end-exclusive date, first column, days in month, 37 column descriptors and
  prefix widths.
- [ ] Weekday sequence is Saturday, Sunday, Monday, Tuesday, Wednesday,
  Thursday, Friday; columns 0 and 1 are weekend; 12 weekend and 25 weekday
  slots per row.
- [ ] Default design units: 70 month band, 40 weekend column, 55 weekday
  column, 1855 day units, 90 row height, 36 header/footer height.
- [ ] Date numbers render near the upper-right of valid cells; ISO week numbers
  render near the lower-left at month day 1 and on Mondays.
- [ ] Month labels appear on the left and right of every row; weekday headers
  appear above and below the grid.
- [ ] Non-month slots remain in the grid as visually empty, non-selectable
  cells with no date.
- [ ] Context months are visually distinguished from current-year months using
  theme tokens, not hard-coded colors.
- [ ] The layout is deterministic for identical inputs and exposes no DOM or
  React dependencies.

### Should Have

- [ ] A `layoutSignature` helper for memoization and visual-test stability.
- [ ] A print row-pagination helper that groups rows into A3 pages.

### Won't Have (Out of Scope)

- Configurable week start — Saturday-first is fixed in R1.
- RTL mirroring — deferred to P1.
- Aggregated density view — deferred.
- Resource timeline rows — deferred.
- Pixel-perfect reproduction of photo distortions, paper texture or branding.

---

## Technical Requirements

### Layout shape

```ts
interface DayColumnLayout {
  columnIndex: number; // 0-36
  date?: DateKey;      // absent for blank slots
  isWeekend: boolean;
  isContextMonth: boolean;
  x: number;           // design units
  width: number;       // design units
}

interface MonthRowLayout {
  rowId: string;       // stable row identity, e.g. "2027-01"
  rowIndex: number;
  year: number;
  monthIndex: number; // 0-11
  kind: 'context' | 'current';
  firstDate: DateKey;
  endDateExclusive: DateKey;
  firstColumn: number; // 0-6, Saturday-first
  daysInMonth: number;
  columns: DayColumnLayout[]; // 37 entries
  prefixWidths: number[]; // 38 entries, design units
  height: number;
}

interface YearLayout {
  rows: MonthRowLayout[];
  totalDayWidth: number;
  bodyHeight: number;
  headerHeight: number;
  footerHeight: number;
  monthBandWidth: number;
}
```

### Date-to-column mapping

For a valid date in a row:

```text
column = firstColumn + (dayOfMonth - 1)
endColumnExclusive = firstColumn + (endDayOfMonthExclusive - 1)
```

When an interval ends on the first day of the next month, the exclusive column
is `firstColumn + daysInMonth` (the slot after the last valid day). Never clamp
an interval to a partial last day.

### Validation

- `monthCount < 12`, `monthCount > 36`, a month outside 0–11, a view year
  outside 1601–9998, or a window whose end date exceeds 9999-12-31 returns a
  typed diagnostic and does not render. A start at `9999-06` with 12 months is
  invalid.
- The component never invents dates for blank slots.
- Duplicate or missing month rows are a layout error, not silently repaired.

### Complexity

Row generation and prefix sums: **M**. Month-window validation: **S**.

---

## Integration Points

- RD-05 consumes row metadata and prefix widths to clip items into fragments.
- RD-06 renders rows, labels, headers and cells.
- RD-07 uses row bounds and date mapping for hit-testing.
- RD-11 documents the classic preset and dynamic window API.

---

## Scope Decisions

| Decision | Options Considered | Chosen | Rationale | AR Ref |
|---|---|---|---|---|
| Month window | Fixed 14, configurable 12+, arbitrary | 12–36, 14 default | User requirement; 37 columns work for any month | AR #13 |
| Week start | Saturday-first, Monday-first, configurable | Saturday-first fixed | Photo fidelity; RTL/week start deferred | AR #34 |
| Month rows | CSS grid only, data layout + renderer | Pure data layout | Shared by HTML/SVG/print/hit-testing | AR #11 |
| Print | Fit all, paginate | Paginate larger windows | Readability at A3 | AR #14 |

---

## Security Considerations

- **Data sensitivity**: Month labels and dates are not sensitive; item content
  is rendered elsewhere.
- **Input validation**: Year, month, range and count are validated; out-of-range
  values produce diagnostics.
- **Authentication & authorization**: N/A — pure layout.
- **Injection risks**: No HTML injection; labels are React text/Intl output.
- **Encryption needs**: N/A.
- **Rate limiting**: N/A.
- **Infrastructure**: N/A.

---

## Acceptance Criteria

1. [ ] Year 2016 renders 14 rows: Dec 2015, Jan–Dec 2016, Jan 2017.
2. [ ] Every row has exactly 37 day columns, two mirrored month labels and
   weekday headers above and below the grid.
3. [ ] January 2016 has Jan 1 at column 6 and Jan 31 at column 36.
4. [ ] January 2017 has Jan 1 at column 1 and Jan 31 at column 31.
5. [ ] February 2016 has 29 numbered cells; February 2017 has 28.
6. [ ] `2016-01-01` displays ISO week 53; `2016-01-04` displays week 1;
   `2017-01-01` displays week 52; `2017-01-02` displays week 1.
7. [ ] A 12-month window starting January 2027 renders Jan–Dec 2027 only.
8. [ ] An 18-month window starting July 2027 renders Jul 2027–Dec 2028 with
   context tint and correct year labels.
9. [ ] `monthCount: 11` and `monthCount: 37` are rejected with a diagnostic and
   no rows are rendered.
10. [ ] A 24-month window renders 24 rows and a 36-month window renders 36 rows;
    `monthCount: 37` is rejected. The 36-month layout remains keyboard reachable.
11. [ ] Blank slots have no `DateKey`, are not focusable/selectable and never
    appear in selection or drag results.
12. [ ] Weekend columns are consistently narrower than weekday columns at the
    default scale; prefix sums are monotonic.
13. [ ] Identical inputs produce identical row metadata and prefix widths.
14. [ ] A range starting at `9999-06` with 12 months is rejected because the end
    exceeds 9999-12-31; a range starting at `1600-01` is rejected because the
    view year is outside 1601–9998.
15. [ ] Security requirements verified: no phantom dates, no HTML injection, no
    unvalidated year/month input.
