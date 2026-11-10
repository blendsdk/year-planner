# Minimal React Grid: M1

> **Document**: 03-04-minimal-react-grid.md
> **Parent**: [Index](00-index.md)

## Overview

A deliberately minimal React view that proves RD-03 geometry in a real browser:
HTML/CSS Grid, date numbers, ISO week numbers, month labels, weekday headers,
classic blue/yellow themes, context tint and print CSS. No ribbons, lanes,
selection, painting, drag, inspector or command pipeline — those are later plans.

## Architecture

```tsx
<YearPlanner
  year={2016}
  contextMonths={{ before: 1, after: 1 }}
  display={{ theme: 'classic-blue', showISOWeekNumbers: true }}
  print={{ page: 'A3', mode: 'paginate' }}
/>
```

### DOM

```text
yp-root
  yp-header (weekday headings, month band)
  yp-body
    yp-row (14 or N)
      yp-band (month label)
      yp-grid (37 cells)
      yp-band (month label)
  yp-footer (weekday headings)
```

Each valid cell contains date number and optional ISO week number; blank slots
are non-interactive and have no date. Month labels are mirrored.

### Theming

- `--yp-*` CSS variables for band, weekend, context, grid, text, date number.
- `classic-blue` and `classic-yellow` presets from the handoff colors.
- `@layer year-planner.base, theme`; no global resets.
- `data-yp-theme` attribute.

### Print

- `@page { size: A3 landscape; margin: 6mm; }`.
- `print-color-adjust: exact`.
- 14 rows/page default; 12–14 one page, 15–28 two, 29–36 three.
- No row split across pages.

## Error Handling

| Error Case | Handling | AR Ref |
|---|---|---|
| Missing year/range | Empty state + `MISSING_RANGE` message | AR #2 |
| Invalid window | Empty state + diagnostic | AR #1 |
| Theme unknown | Fall back to `classic-blue` + dev warning | AR #7 |

## Testing Requirements

- Component tests for 14 rows, 37 cells, mirrored labels, 2016/2017 boundaries.
- Visual screenshots for blue/yellow at 14 months.
- Print PDF at A3; `pdfinfo` 420×297 mm.
- Clean consumer install renders the grid.
- Basic keyboard/ARIA labels for dates (full accessibility audit later).
