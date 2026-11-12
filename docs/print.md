# Print

> **Scope**: A3 pagination, fit mode, the PRT-01 sample and print styling.

The component renders a hidden print tree planned by the core. Screen layout and
print layout share the same window, visibility and item data, so a hidden item is
hidden in print too.

## paginate

`print={{ page: "A3", mode: "paginate" }}` produces one to three A3 landscape
pages:

| Window | Pages |
| ------ | ----- |
| 12–14 months | 1 |
| 15–28 months | 2 |
| 29–36 months | 3 |

Each page is scaled uniformly inside both A3 dimensions. Month labels, weekends,
ISO weeks, ribbons, annotations and date metadata are preserved. `rowsPerPage`
overrides the row split when a host needs a different page rhythm.

```tsx
<YearPlanner year={2027} print={{ page: "A3", mode: "paginate" }} />
```

## fit

`print={{ page: "A3", mode: "fit" }}` renders one page and scales all rows to
fit. When the date text would fall below 7 pt, the planner reports the
`PRINT_FIT_TOO_SMALL` diagnostic instead of printing unreadable text.

```tsx
<YearPlanner range={{ start: { year: 2027, month: 0 }, monthCount: 24 }} print={{ mode: "fit" }} />
```

## PRT-01

PRT-01 is the reference 2017 classic-yellow print sample: one A3 page with the
booking `2017-02-06` → `2017-02-10` and the holiday annotation `2017-02-01` →
`2017-02-02`. Storybook contains the exact story
`Year Planner/06 Print Planning/Prt01TwoThousandSeventeen`; the Playwright print
matrix asserts the page size and content with `pdfinfo` and `pdftotext`.

## print CSS

The print tree is hidden on screen and becomes visible in `@media print`. Host
chrome should be hidden in print, for example:

```css
@media print {
  .demo-chrome {
    display: none !important;
  }
  body {
    margin: 0;
  }
}
```

Do not scale the planner with a CSS transform for print; use `mode: "fit"` so the
core can compute a readable page and report diagnostics. The page size is A3
landscape (420 × 297 mm); the R1 baseline does not include other paper sizes.

## Verifying print

```bash
pnpm test:print     # the @print Playwright group
pnpm test:consumer  # packed install, including the print CSS import
```

The browser print preview is the source of truth for page content; the automated
tests assert the PDF page count, page size and text content.
