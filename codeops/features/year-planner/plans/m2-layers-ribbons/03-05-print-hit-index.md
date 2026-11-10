# Print Planning and Hit Index: M2 Layers and Ribbons

> **Document**: 03-05-print-hit-index.md
> **Parent**: [Index](00-index.md)

## Overview

Produces A3 print page plans over variable-height ribbon rows and a lookup index
for pointer/keyboard hit-testing. Both are pure descriptors.

## Implementation Details

### Print API

```ts
export type PrintPageSize = "A3";
export type PrintMode = "paginate" | "fit";

export interface PrintOptions {
  page?: PrintPageSize;
  mode?: PrintMode;
  rowsPerPage?: number;
}

export interface PrintPage {
  index: number;
  firstRowIndex: number;
  rows: RibbonRow[];
  contentHeight: number;
  scale: number;
}

export interface PrintPlan {
  page: PrintPageSize;
  mode: PrintMode;
  pages: PrintPage[];
  scale: number;
  requiresPaginate: boolean;
  diagnostics: Diagnostic[];
}

export type PrintPlanResult =
  | { ok: true; plan: PrintPlan }
  | { ok: false; diagnostics: Diagnostic[] };

export const A3_LANDSCAPE_INNER_WIDTH = 1542;
export const A3_LANDSCAPE_INNER_HEIGHT = 1077;
export const PRINT_DATE_TEXT_PX = 12;
export const PRINT_MIN_DATE_TEXT_PT = 7;

export function planRibbonPrint(
  ribbon: RibbonLayout,
  options?: PrintOptions,
): PrintPlanResult;
```

### Paginate

- Default `page: "A3"`, `mode: "paginate"`, `rowsPerPage: 14`.
- `rowsPerPage` must be an integer 1–14; otherwise
  `INVALID_PRINT_OPTIONS`.
- Rows are chunked strictly by `rowsPerPage`; a month row never splits. Do not
  close a page early, because that would break the 29–36 → 3-page rule.
- Page counts with the default and base 90 px rows: 12–14 → 1, 15–28 → 2,
  29–36 → 3.
- Each page gets `contentHeight = headerHeight + footerHeight + sum(row.height)`
  and a uniform
  `scale = min(1, innerWidth / totalWidth, innerHeight / contentHeight)`,
  where `totalWidth = 2 * monthBandWidth + totalDayWidth` (1,995 for classic).
  This keeps wide and expanded pages inside both A3 dimensions (AR-29). A
  14-row page scales to about 0.773 and fits 1,332 × 0.773 = 1,030 px of height.

### Fit

- One page containing every row.
- `contentHeight = headerHeight + footerHeight + sum(row.height)`.
- `scale = min(1, innerWidth / totalWidth, innerHeight / contentHeight)`.
- Printed date size = `PRINT_DATE_TEXT_PX * scale * 0.75` points.
- When that value is below `PRINT_MIN_DATE_TEXT_PT`, add a
  `PRINT_FIT_TOO_SMALL` warning and set `requiresPaginate: true`. The plan is
  still returned so a caller can preview the scale (AR-19).
- Invalid page or mode returns `ok: false` with `INVALID_PRINT_OPTIONS`.

Because the classic grid is 1,995 design px wide, the width constraint makes
the 14-month fit scale about `1542 / 1995 = 0.773`, which prints 12 px date text
at about 6.96 pt. The 14-month fit therefore also carries the warning; RD-06
owns the final print typography decision.

### Hit index API

```ts
export interface RibbonHitEntry {
  fragmentId: string;
  itemId: string;
  rowId: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RibbonHitIndex {
  entries: RibbonHitEntry[];
  byFragmentId: ReadonlyMap<string, RibbonHitEntry>;
  byItemId: ReadonlyMap<string, RibbonHitEntry[]>;
}

export function createRibbonHitIndex(ribbon: RibbonLayout): RibbonHitIndex;

export function hitTestRibbon(
  index: RibbonHitIndex,
  x: number,
  y: number,
): RibbonHitEntry | undefined;
```

Entries use absolute day-plane coordinates: `x` is the fragment x relative to
the day area, `y` is `row.top + fragment.y`. Entries are sorted by `y`
ascending, then lane ascending, then `x` ascending. `hitTestRibbon` returns the
last matching entry, so the topmost shape wins over a full-row backdrop
(AR-22, AR-31). Bounds are half-open in x and y.

### Example

```ts
const print = planRibbonPrint(ribbons, { mode: "paginate" });
if (print.ok) {
  console.log(print.plan.pages.length, print.plan.pages[0]?.rows.length);
}

const index = createRibbonHitIndex(ribbons);
const hit = hitTestRibbon(index, 420, 120);
```

## Error handling

| Case | Handling | AR Ref |
|---|---|---|
| `rowsPerPage` outside 1–14 | `INVALID_PRINT_OPTIONS`, `ok: false` | AR-19 |
| Unknown page size | `INVALID_PRINT_OPTIONS`, `ok: false` | AR-19 |
| Fit below 7 pt | Plan returned, warning, `requiresPaginate: true` | AR-19 |
| Missing fragment coordinates | Deterministic skip in the index | AR-22 |

## Testing Requirements

- Pagination for 12, 14, 15, 18, 24, 28, 29 and 36 rows.
- No month-row split.
- Fit scale for 14 and 18 months; both are width/height-bound and warn.
- Invalid options.
- Hit index by fragment and item; topmost hit; boundary behavior.
