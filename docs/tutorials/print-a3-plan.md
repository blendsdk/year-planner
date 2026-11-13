# Print an A3 annual plan

> **Time**: about 5 minutes. **Prerequisites**: a rendered planner.

Printing is a first-class output, not a browser screenshot. The component
renders a hidden A3 tree and paginates the visible window.

## Paginate

```tsx
<YearPlanner year={2027} items={items} layers={layers} print={{ page: "A3", mode: "paginate" }} />
```

| Window | Pages |
| --- | --- |
| 12–14 months | 1 |
| 15–28 months | 2 |
| 29–36 months | 3 |

Each page is scaled inside the A3 landscape box. Month labels, weekends, ISO
weeks, ribbons, annotations and date metadata are preserved. `rowsPerPage`
changes the row split when your paper or margin needs it.

## Fit one page

```tsx
<YearPlanner
  range={{ start: { year: 2027, month: 0 }, monthCount: 24 }}
  items={items}
  layers={layers}
  print={{ page: "A3", mode: "fit" }}
/>
```

`fit` puts every row on one page. If the date text would fall below 7 pt, the
planner reports `PRINT_FIT_TOO_SMALL` instead of printing unreadable text.

## Trigger the browser dialog

```tsx
<button type="button" onClick={() => window.print()}>
  Print annual plan
</button>
```

The normal screen grid stays interactive; the print tree is hidden until the
print media query applies. Hosts should hide their own chrome in `@media print`:

```css
@media print {
  .app-header,
  .app-sidebar,
  .app-footer {
    display: none !important;
  }
}
```

## Check the output

- Print to PDF and confirm the page size is A3 landscape (420 × 297 mm).
- Confirm every month is present and the labels are readable.
- Confirm selections and focus rings are not printed.
- Confirm hidden items are absent.

The repository's Playwright matrix generates real Chromium PDFs and asserts
the page size and text with `pdfinfo` and `pdftotext`.

## Read more

- [Print reference](../print.md)
- [Print examples](../examples/print.md)
- [Accessibility](../accessibility.md) — contrast and text size also apply to
  print.
