# Ribbon Geometry: M2 Layers and Ribbons

> **Document**: 03-04-ribbon-geometry.md
> **Parent**: [Index](00-index.md)

## Overview

Projects visible items into continuous fragments clipped to month rows, packs
ribbon-channel fragments into deterministic lanes, computes compact overflow,
and produces a deterministic signature. Optional gutter connectors are deferred
to RD-06. The output is pure data; RD-06 renders it.

## Architecture

| File | Responsibility |
|---|---|
| `src/ribbon/types.ts` | Shared fragment, row, layout and option types |
| `src/ribbon/lanes.ts` | Deterministic lane allocation and reuse |
| `src/ribbon/fragments.ts` | Projection, geometry, row assembly, overflow and signature |
| `src/ribbon/hit-index.ts` | Fragment bounds lookup |
| `src/ribbon/print.ts` | A3 page plans |
| `src/ribbon/index.ts` | Public barrel |

## Implementation Details

### Public types

```ts
export interface RibbonFragment {
  fragmentId: string;
  itemId: string;
  rowId: string;
  rowIndex: number;
  sourcePeriod: PlannerPeriod;
  clippedStart: DateKey;
  clippedEndExclusive: DateKey;
  startColumn: number;
  endColumnExclusive: number;
  x: number;
  width: number;
  lane: number;
  y: number;
  height: number;
  isStartClipped: boolean;
  isEndClipped: boolean;
  channel: RenderChannel;
}

export interface RibbonOverflowEntry {
  itemId: string;
  title?: string;
  period: PlannerPeriod;
}

export interface RibbonRow {
  rowId: string;
  rowIndex: number;
  top: number;
  height: number;
  laneCount: number;
  visibleLaneCount: number;
  overflowCount: number;
  overflow: RibbonOverflowEntry[];
  fragments: RibbonFragment[];
}

export interface RibbonLayout {
  rows: RibbonRow[];
  fragments: RibbonFragment[];
  density: "compact" | "expanded";
  compactMaxLanes: number;
  laneHeight: number;
  laneTop: number;
  headerHeight: number;
  footerHeight: number;
  monthBandWidth: number;
  totalDayWidth: number;
  totalWidth: number;
  height: number;
  signature: string;
}

export interface RibbonOptions {
  density?: "compact" | "expanded";
  compactMaxLanes?: number;
  laneHeight?: number;
  laneTop?: number;
  displayTimeZone?: string;
}

export function buildRibbonLayout(
  layout: YearLayout,
  context: VisibilityContext,
  options?: RibbonOptions,
): RibbonLayout;
```

Defaults: `density: "compact"`, `compactMaxLanes: 3`, `laneHeight: 18`,
`laneTop: 18`, `displayTimeZone: "UTC"`. Optional `edge-path` connectors are
deferred to RD-06 with the SVG shape plane (AR-21); M2 exposes no connector
option.

### Projection

For each visible item and each row:

1. Project the item period to an all-day period with `displayTimeZone` when it
   is timed (AR-2).
2. `start = max(projected.startDate, row.firstDate)`.
3. `end = min(projected.endDateExclusive, row.endDateExclusive)`.
4. Skip when `start >= end`.
5. `startColumn = dateToColumn(row, start)`.
6. `endColumnExclusive = dateToColumn(row, addDays(end, -1)) + 1`.
7. `x = row.prefixWidths[startColumn]`,
   `width = row.prefixWidths[endColumnExclusive] - x`.
8. `isStartClipped = start !== projected.startDate`,
   `isEndClipped = end !== projected.endDateExclusive`.
9. `fragmentId = `${row.rowId}:${item.id}:${startColumn}``.

Hidden items are excluded before projection, so canonical dates are untouched.
Items outside the window produce no fragment.

### Channels and heights

Only `ribbon` fragments consume lanes (AR-15). Other channels get lane `0` and:

| Channel | y | height |
|---|---|---|
| `background`, `highlight` | 0 | base row height |
| `annotation` | 0 | 14 |
| `foreground` | 0 | base row height |
| `ribbon` | `laneTop + lane * laneHeight` | `laneHeight` |

Background/highlight/foreground fragments are listed in the row but do not
affect `laneCount`.

### Lane allocation

For each row:

1. Collect `channel === "ribbon"` fragments.
2. Sort by:
   - `clippedStart` ascending;
   - projected source duration in **days** descending (AR-16, AR-2);
   - layer `sortOrder` ascending (default 0);
   - layer `displayPriority` descending (default 0);
   - item ID ascending (code-unit order, locale-independent).
3. For each fragment, prefer the lane the same item used in the previous row
   when that lane has no overlapping interval; otherwise use the lowest lane
   whose intervals do not overlap.
4. Overlap uses half-open columns: touching intervals may share a lane.
5. `laneCount = highest assigned lane + 1`.

`laneCount` excludes background/highlight/annotation/foreground fragments.
Hiding a layer removes its fragments and repacks the remaining lanes without
touching item IDs or periods.

### Row height and overflow

- `visibleLaneCount = density === "expanded" ? laneCount : min(laneCount, compactMaxLanes)`.
- `height = max(layout.rowHeight, visibleLaneCount * laneHeight + laneTop)`.
- A compact fragment with `lane >= compactMaxLanes` is overflow.
- `overflowCount` counts overflow **fragments**.
- `overflow` deduplicates by item in first-fragment order and carries the title
  and source period for the accessible list (AR-17).
- Hidden items never appear in `overflow`.

`RibbonRow.top` is the cumulative sum of preceding row heights. `RibbonLayout.height`
is the sum of all row heights; `headerHeight`/`footerHeight` are copied from the
year layout for print planning. `totalWidth = 2 * monthBandWidth + totalDayWidth`
(1,995 design px for the classic layout); `totalDayWidth` and `monthBandWidth`
are copied from the year layout.

### Connectors and signature

- Optional `edge-path` connectors are deferred to RD-06 (AR-21). `buildRibbonLayout`
  emits no connector descriptors and accepts no connector option in M2.
- The signature (in `fragments.ts`) includes the year layout signature, serialized
  visibility, filter, density/option values, item IDs + versions + periods and
  fragment geometry (AR-20). Identical inputs produce an identical string; an
  item version, visibility, window or lane change produces a different one.
- `isStartClipped` is true only when the fragment starts after the projected
  item start; `isEndClipped` is true only when it ends before the projected
  item end. A one-row item therefore has both flags false.

### Example

```ts
const ribbons = buildRibbonLayout(layout, { model, visibility }, { density: "compact" });
const february = ribbons.rows.find((row) => row.rowId === "2027-02");
console.log(february?.laneCount, february?.overflowCount);
```

## Testing Requirements

- Cross-month, cross-year, one-day and eight-day widths.
- Three overlapping items in three lanes; touching items share.
- Hiding a layer repacks without changing IDs.
- Compact 20 items → 3 visible lanes, 17 overflow; expanded → 20 lanes.
- Channel partition and row growth.
- Signature stability and change triggers.
- A clause proving no connector option/descriptor exists in M2.
- Hidden items absent from fragments and overflow.
