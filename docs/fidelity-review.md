# Photo Fidelity Review — M1

> **Date**: 2026-11-10
> **Scope**: the M1 minimal classic grid, compared with the two reference
> planning photos in the handoff pack.
> **Verdict**: **Structurally faithful; not pixel-perfect.** Accepted for the M1
> minimal grid. Holiday content and exact paper/print styling belong to later
> slices.

The reference photos are external source material and are not published in this
repository. The generated screenshots are:

- `packages/react` output captured by Playwright:
  `tests/e2e/classic-year.spec.ts-snapshots/classic-2016-blue-chromium-linux.png`
- `tests/e2e/classic-year.spec.ts-snapshots/classic-2017-yellow-chromium-linux.png`
- `tests/e2e/classic-year.spec.ts-snapshots/classic-2016-print-chromium-linux.png`

## Reference calendars

| Property | Blue 2016 photo | Yellow 2017 photo |
|---|---|---|
| Window | Dec 2015, Jan–Dec 2016, Jan 2017 | Dec 2016, Jan–Dec 2017, Jan 2018 |
| Week start | Saturday | Saturday |
| Day slots | 37 per month row | 37 per month row |
| Month labels | Left and right bands | Left and right bands |
| Date numbers | Upper-right of a cell | Upper-right of a cell |
| ISO week numbers | Lower-left, at month day 1 and Mondays | Same |
| Weekend emphasis | Blue weekend columns | Yellow weekends in the current year; grey context weekends |
| Holidays | `OH` cells, plus `BEL`/`NLD` notes | `OH` cells, plus place notes |
| Print | Portrait A3-style sheet | Portrait A3-style sheet |

## Checked against the M1 grid

| Check | M1 result | Status |
|---|---|---|
| 14 month rows in the classic preset | 14 rows: Dec 2025–Jan 2027 for 2016 | Match |
| 37 fixed day columns | 37 slots per row, 2 weekend + 25 weekday per week | Match |
| Saturday-first header | Sat, Sun, Mon, Tue, Wed, Thu, Fri | Match |
| Jan 1 2016 at column 6, Jan 31 at 36 | Verified by spec test and screenshot | Match |
| Jan 1 2017 at column 1, Jan 31 at 31 | Verified by spec test and screenshot | Match |
| Mirrored month labels | Left and right labels on every row | Match |
| Date number upper-right | Yes | Match |
| ISO week lower-left at day 1/Mondays | Yes | Match |
| Blue theme band and weekend tint | Blue band, blue weekend cells | Match in structure |
| Yellow theme band and weekend tint | Yellow band, yellow weekend cells | Match in structure |
| Context months visually distinct | Context rows use a separate tint | Match in intent |
| A3 landscape print, no clipped row | 1 page, 1191.12 × 842.88 pt | Match |
| Holiday `OH` cells | Not implemented in M1 | Deferred — host annotations in RD-06 |
| Place notes and multi-day ribbons | Not implemented in M1 | Deferred — RD-05/RD-06 |

## Known visual differences

1. **Context-month tint**: the blue photo keeps context month weekdays white and
   uses the same weekend tint as current months. The M1 grid tints all context
   cells. This is a token-level styling difference, not a geometry difference.
2. **Yellow context weekends**: the yellow photo uses grey weekends in the
   context months. M1 uses the theme's context tint. RD-06 will refine the
   theme tokens with the actual reference values.
3. **Cell borders and type scale**: M1 uses 1 px borders and 12 px date numbers;
   the photos use a finer print grid and a different type scale. This is not a
   fidelity failure for a minimal HTML grid.
4. **Holidays and notes**: deliberately absent. RD-03/RD-06 specify host-supplied
   annotations and `getDateMeta`; no built-in holiday database exists.
5. **Paper texture, binding marks and photo distortion**: intentionally excluded;
   not part of the digital component.
6. **Header/footer week labels**: M1 repeats the weekday header above and below
   the grid. The photos use a single printed header/footer band; the structure
   is equivalent.

## Sign-off

| Role | Result |
|---|---|
| Structural fidelity (rows, columns, week start, labels, ISO weeks) | **Accepted** |
| Theme color fidelity (blue/yellow bands and weekends) | **Accepted for M1**; token refinement in RD-06 |
| Pixel-level reproduction | **Not claimed** |
| Holiday/annotation content | **Not in M1**; host data in RD-06 |

This review is a maintainer comparison against the reference photos. It is not a
legal clearance for the photos, which remain external and unpublished.
