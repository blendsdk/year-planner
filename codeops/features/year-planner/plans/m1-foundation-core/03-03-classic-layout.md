# Classic Layout: M1

> **Document**: 03-03-classic-layout.md
> **Parent**: [Index](00-index.md)

## Overview

Implements RD-03: 12–36 month rows with 37 fixed day columns, Saturday-first
weekdays, prefix widths and date-to-column mapping. Pure data; no React.

## Architecture

```text
src/layout/classic-year.ts
  buildClassicYearLayout(options)
  dateToColumn(row, date)
  rowForDate(layout, date)
  layoutSignature(layout)
  paginatePrintRows(layout, rowsPerPage)
```

### Options

```ts
interface ClassicYearLayoutOptions {
  year?: number;
  contextMonths?: { before: number; after: number };
  range?: { start: { year: number; month: number }; monthCount: number };
  highlightYear?: number;
  units?: { monthBand: number; weekend: number; weekday: number; rowHeight: number; headerHeight: number };
}
```

- `range` wins over `year`.
- Missing both → `MISSING_RANGE`.
- Classic default: `year` + `{ before: 1, after: 1 }` = 14 months.
- Month 0–11; month count 12–36; view years 1601–9998.
- `highlightYear` default: for the `year` preset, `highlightYear = year`; for an
  explicit `range`, the start month's year. Months in that year are `current`,
  others `context`.

### Geometry

- Weekday sequence Sat, Sun, Mon, Tue, Wed, Thu, Fri.
- Columns 0–1 weekend; 12 weekend + 25 weekday slots.
- Default units: 70 band, 40 weekend, 55 weekday, 1855 day units, 90 row,
  36 header/footer.
- `firstColumn = dayOfWeek(firstDate)` using the Saturday-first helper
  (`Sat=0 … Fri=6`). Do not use a separate Sunday-first UTC index.
- `column = firstColumn + dayOfMonth - 1`.
- End-exclusive column for a period ending on the next month's first day:
  `firstColumn + daysInMonth`.

## Error Handling

| Error Case | Handling | AR Ref |
|---|---|---|
| Both `year` and `range` absent | `MISSING_RANGE`; empty state | AR #2 |
| Month count outside 12–36 | `INVALID_MONTH_COUNT` | AR #1 |
| Month outside 0–11 | `INVALID_MONTH` | AR #1 |
| `contextMonths` before/after non-integer, <0, >12, or total outside 12–36 | `INVALID_CONTEXT_MONTHS` | AR #12 |
| Window beyond 9999-12-31 | `INVALID_RANGE` | AR #1 |
| View year outside 1601–9998 | `UNSUPPORTED_VIEW_YEAR` | AR #1 |

## Testing Requirements

- RD-03 AC1–15 (AC15 security is ST-54).
- 12/14/18/24/36 month layouts.
- Jan 2016 col 6/36; Jan 2017 col 1/31; leap years; ISO weeks.
- Prefix sums monotonic; blank slots have no date.
- Print pagination helper: 14 rows/page.
- 2016 tint: Dec 2015 context, Jan–Dec 2016 current, Jan 2017 context.
- `contextMonths` invalid: negative, >12, total <12, total >36.
- 36-month keyboard reachability tested in the React/E2E grid, not pure layout.
