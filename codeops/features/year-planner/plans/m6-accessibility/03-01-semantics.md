# Semantics and Names: Accessibility Plan

> **Document**: 03-01-semantics.md
> **Parent**: [Index](00-index.md)

## Overview

This specification defines the ARIA contract and the text used for accessible names. It keeps a
labelled root region and a 37-column ARIA grid. Item proxies are focusable buttons in an overlay
that is a **sibling of the grid**, not a child: a row owns only grid cells, so axe
`aria-required-children` passes. The overlay aligns to the same row geometry (AR-21).

## Architecture

### Current Architecture

- `YearPlanner.tsx` renders the root `div`, the viewport and the grid.
- `YearGrid.tsx` renders `role="grid"`, header/footer rows and month rows.
- `MonthRow.tsx` renders a `rowheader`, the cell layer, the item layer and overflow.
- `CellLayer.tsx` renders `gridcell` elements with a date label.
- `ItemLayer.tsx` renders visual fragments and `role="button"` proxies.

### Proposed Changes

| Element | Role / attribute | Change |
| ------- | ---------------- | ------ |
| Root | `role="region"`, `aria-label` | Add; reuse `ariaLabel` |
| Grid | `role="grid"`, `aria-describedby` | Add generated keyboard-help id |
| Date cell | `role="gridcell"`, `aria-selected` | Add selected state |
| Date cell name | `aria-label` | Add count, ISO week, holiday, selected |
| Item proxy | `role="button"`, `aria-pressed` | Keep; add richer name; move to the grid-sibling overlay |
| Item overlay | no role | New sibling of `role="grid"`; owns proxies, previews and overflow |
| Item proxy name | `aria-label` | Add layer pattern, status, selection, clipping |
| Resize handles | sibling buttons, `tabindex=-1` | Keep; enlarge target |
| Overflow | `aria-expanded`, `aria-controls` | Keep; roving tab stop |
| Inspector | labelled `aside` | Add stable id and item list |
| Live regions | polite / assertive | Split by severity |

## Implementation Details

### New Module: `packages/react/src/a11y.ts`

Pure helpers keep label composition testable and out of the renderers.

```ts
/** Formats one date cell's accessible name. */
export function dateCellAccessibleName(input: {
  date: DateKey;
  formattedDate: string;
  itemCount: number;
  weekNumber?: number;
  meta?: DateMeta;
  selected: boolean;
}): string;

/** Formats one item proxy's accessible name. */
export function itemAccessibleName(input: {
  item: PlannerItem;
  layer: PlannerLayer;
  periodLabel: string;
  visibleLabel: string;
  selected: boolean;
  clipped: boolean;
}): string;

/** Expands selection ranges into a lookup set. */
export function selectedDateSet(
  ranges: readonly SelectionDateRange[],
): ReadonlySet<DateKey>;

/** Summarises a selection for the polite live region. */
export function selectionSummary(selection: PlannerSelection): string;
```

### Date cell name

The name is a comma-separated list built from validated text:

1. `formattedDate` (for example `Dec 1, 2015`).
2. `ISO week N` when the week number is visible.
3. the host `meta.label` when present.
4. `N items` or `1 item`.
5. `holiday` when `meta.holiday`.
6. `selected` when the date is selected.
7. `unavailable` when `meta.disabled`.

If `meta.ariaLabel` is present it replaces the whole name. The host owns that override and must
include any visible text it wants exposed.

The day number, week number, cell label and `renderCell` output are planner-or-host presentation.
Planner-owned visual spans are `aria-hidden` because the cell name already carries the date. Host
content stays in the accessibility tree, including Fluent/MUI buttons.

### Item proxy name

The name starts with the visible label (the title for ribbon/foreground items, the annotation label
for annotations). It then adds:

1. the item title when it differs from the annotation label;
2. the formatted period;
3. `layer <label or name>`;
4. `<pattern> pattern` when the pattern is not `solid`;
5. `status <status>` when the item has a status;
6. `selected` or `not selected`;
7. `partially visible` when `isStartClipped` or `isEndClipped`.

Example: `Winter booking, Jan 28, 2027 - Feb 6, 2027, layer Bookings, hatch pattern, status
confirmed, selected, partially visible`.

The name contains only model text and formatter output. No HTML, no `dangerouslySetInnerHTML`, and
no raw host style strings.

### Grid and region

- The root `div` becomes `role="region"` with `aria-label={ariaLabel}`. The grid uses
  `${ariaLabel} grid`, so the nested hierarchy is distinct (AR-18).
- The grid’s `aria-describedby` is the host’s `ariaDescribedBy` plus a generated hidden help id.
  The help text lists arrows, Shift+Arrow, Space, Enter, Escape and Delete.
- The empty-layout root uses the same region and label so a layout failure does not remove the
  named landmark.
- `aria-rowcount` remains rows + 2 (header and footer). `aria-colcount` remains 37.
- Non-dated cells keep `role="gridcell"` and `aria-hidden="true"`, so every row still has 37
  columns, but they have no tab stop and no accessible entry.

### Selected dates

`YearPlanner` memoises `selectedDateSet(state.selection.dates)` and passes it through `YearGrid` →
`MonthRow` → `CellLayer`. Dated cells set `aria-selected` to `"true"` or `"false"`. The selection
preview remains `aria-hidden` decorative.

### Hidden items

Effective visibility already removes hidden items from ribbon fragments, item lists and overflow.
The plan adds explicit assertions:

- no `[data-item-id="<hidden>"]` in the root;
- no proxy, item-list button, overflow entry or tooltip;
- the date cell count excludes the hidden item;
- the inspector filters selected hidden items.

## Error Handling

| Error Case | Handling Strategy | AR Ref |
| ---------- | ----------------- | ------ |
| Host `ariaLabel` contains markup | Rendered as text by React; never parsed as HTML | AR-2 |
| Item title is empty | Fall back to item id | AR-3 |
| Layer label is empty | Fall back to layer name, then id | AR-3 |
| Selection range has zero days | Contributes no selected dates | AR-2 |
| Disabled first date | Active date resolves to nearest enabled date | AR-10 |
| Custom `renderInspector` | Planner-owned aside, close button and skip target remain | AR-1 |

## Testing Requirements

- Unit tests for every helper and exact label strings.
- Integration tests for `aria-selected`, hidden items and root/grid names.
- Playwright assertions for accessible names and the accessibility tree.
- axe `label-content-name-mismatch` must report zero nodes.
- AC14 nested-control coverage uses axe `nested-interactive` plus a DOM scan for
  `button, a, input, select, textarea, [tabindex]` inside proxies; no HTML validator dependency is
  added (AR-20).
