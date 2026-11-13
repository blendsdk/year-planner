# Classic year layout

> **Scope**: the implemented month/day grid, its labels, context months, theme
> behaviour and A3 print output. Every dimension below is a design pixel; the
> host-fit and zoom rules scale the rendered grid without changing its structure.

The classic year layout is the component's default view. It is a compact annual
plan: one row per month, 37 day slots per row and a fixed Saturday-first week.
The same geometry drives the screen grid, hit-testing and the print tree, so a
cell found by the pointer is the same cell placed on paper.

## The month window

The `year` prop renders fourteen rows:

```text
December of year - 1
January … December of year
January of year + 1
```

The current calendar year is the planning year. The December before it and the
January after it are **context months**: they keep full dates and interaction,
but use a quieter surface so the eye stays on the planning year. `highlightYear`
moves that emphasis; a row is current when its calendar year equals
`highlightYear`. The classic preset defaults it to `year`.

Use `contextMonths` when fourteen rows are not the right shape. The values are
integers from 0 to 12 and the total window must stay between 12 and 36 rows:

```tsx
<YearPlanner year={2027} contextMonths={{ before: 0, after: 0 }} />
```

An explicit `range` is the alternative. `month` is zero-based (0 = January) and
`monthCount` must be between 12 and 36:

```tsx
<YearPlanner range={{ start: { year: 2027, month: 0 }, monthCount: 18 }} />
```

Invalid windows produce a typed diagnostic and no rows. The component never
guesses a year and never pads a short window.

## The 37 day columns

Every month row has exactly 37 day columns, regardless of the window length.
The columns always cover the month plus the leading and trailing week slots, so
a 31-day month with up to six leading blanks fits without a special case.

| Property | Value |
| --- | --- |
| Week order | Saturday, Sunday, Monday, Tuesday, Wednesday, Thursday, Friday |
| Day columns per row | 37 |
| Weekend columns | 12 per row (Saturday and Sunday slots) |
| Weekday columns | 25 per row |
| Month band | 70 design px on the left and right |
| Weekend column | 40 design px |
| Weekday column | 55 design px |
| Row height | 90 design px |
| Header and footer band | 36 design px |

The columns are not a calendar month padded to a fixed number of days. A row
starts at the first column for its own first weekday and ends after its last
day. Slots before and after the real dates stay in the grid as empty,
non-selectable cells with no `DateKey`. They never appear in a selection, a
drag result or an item fragment.

For a date in a row:

```text
column = firstColumn + (dayOfMonth - 1)
endColumnExclusive = firstColumn + daysInMonth
```

`firstColumn` is the Saturday-first weekday index of the first day of the
month. For example, 1 January 2016 is a Friday, so it sits at column 6 and
31 January sits at column 36. 1 January 2017 is a Sunday, so it sits at column 1
and 31 January sits at column 31.

## Labels and headers

Month labels are mirrored: one band on the left of the row and one on the right.
The duplicate label keeps the month name visible while a wide grid scrolls
horizontally.

Weekday headers appear above the grid and again below it. The repeated footer
keeps the weekday name in view when a host scrolls to the last month rows. Both
bands use the same Saturday-first sequence.

Inside a valid day cell, the components place:

- the **date number** near the upper-right corner;
- the **ISO week number** near the lower-left, at month day 1 and on Mondays;
- an optional host label near the upper-left, rendered from `getDateMeta()`.

ISO week numbering follows the ISO-8601 week-year rules. That is why 1 January
2016 can display week 53 while 4 January 2016 displays week 1. The default
formatter is `Intl.DateTimeFormat` with an explicit locale (`en-US` by default)
and the Gregorian calendar.

Month rows, weekday bands and day cells are real CSS Grid tracks. Cell borders
are one pixel and the grid is bounded by the same border token, so print and
screen share the line rhythm.

## Context months and date metadata

Context months use the theme's context surface. `getDateMeta()` can add a
host-owned holiday flag, label, background, text colour, class name, style,
disabled state or accessible label. A `disabled` date is not selectable and
exposes `aria-disabled`. The component ships no holiday database: a holiday
appears only when the host supplies it.

Annotations are separate from date metadata. An annotation overlays its label
and fill on the cell; `getDateMeta()` supplies the base cell background and text.
Both are host data and both are absent when the host supplies neither.

## Theme behaviour

The layout is theme-independent. All 56 built-in presets use the same geometry,
so switching a palette changes colour only. The default is `material-teal`.
There are 19 Material 2014 families (`material-*`), 35 Fluent UI v9 families
(`fluent-*`) and two monochrome utilities (`high-contrast` and `print`).

```tsx
<YearPlanner year={2027} display={{ theme: "fluent-marigold" }} />
```

Palette themes use light surfaces. The ribbon, weekend, highlight and annotation
colours come from the family's accent or light tint; text, borders and focus
rings are chosen to stay readable on every built-in cell surface. The
`high-contrast` and `print` presets use black, white and grey only.

`classic-blue`, `classic-yellow` and `modern` were removed without aliases. A
removed name is treated like an unknown host theme name: the component keeps the
supplied class name and falls back to the provider theme or the default. See
[Migration](migration.md) for the replacement names.

Theme values reach the grid as CSS custom properties. A host can override one
token without editing package CSS:

```tsx
<YearPlanner year={2027} cssVars={{ "--yp-ribbon": "#1d4e89" }} />
```

The shared geometry tokens remain available when a host needs a different row
height or column width. Changing geometry through arbitrary `cssVars` changes
CSS only, not the JavaScript layout; use a theme token or the `units` prop when
hit-testing must follow the new size.

## Printing

The print tree is built from the same rows and fragments as the screen grid. It
is hidden on screen and becomes visible under `@media print` as an A3 landscape
page (420 × 297 mm).

<code v-pre>print={{ page: "A3", mode: "paginate" }}</code> groups rows into readable pages:
12–14 months fit one page, 15–28 months use two and 29–36 months use three. Each
page is scaled uniformly inside the A3 area; month labels, weekday bands,
weekends, ISO weeks, ribbons, annotations and date metadata are preserved.
`rowsPerPage` overrides the row split when a host needs a different rhythm.

<code v-pre>print={{ page: "A3", mode: "fit" }}</code> renders one page and scales every row to
fit. If the date text would fall below 7 pt, the planner reports
`PRINT_FIT_TOO_SMALL` instead of printing unreadable text.

The `print` utility preset sets `printScale` to 1 and removes screen-only colour.
Ribbon and header labels use the same readable text colour as the screen grid.
A host should hide its own chrome in print and should not add a CSS transform;
use `mode: "fit"` when the core must plan the scale.

PRT-01 is the reference 2017 print sample rendered with `fluent-marigold`: one
A3 page containing the booking `2017-02-06` → `2017-02-10` and the holiday
annotation `2017-02-01` → `2017-02-02`. The Playwright print matrix checks its
page count, page size and text content.

## Related guides

- [Dynamic months](dynamic-months.md) — the `year` and `range` forms in more detail.
- [Theming](theming.md) — tokens, presets and adapters.
- [Print](print.md) — pagination, fit mode and print CSS.
- [Interaction](interaction.md) — how pointer and keyboard input map to cells.

The layout is pure data in `@blendsdk/year-planner-core`; the React package only
renders it. Identical inputs always produce identical rows, columns and prefix
widths, which is what makes the visual and print evidence stable.
