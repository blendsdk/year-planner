# Selection Policy: RD-07 Interaction Engine

> **Document**: 03-01-selection-policy.md
> **Parent**: [Index](00-index.md)

## Overview

Selection is the shared state behind pointer clicks, drags, marquee and keyboard.
This component owns the canonical modifier matrix, range normalization and
anchor/focus transitions. It is pure: no React, no DOM, no diagnostics.

## Architecture

### Current Architecture

RD-06 exposes `PlannerSelection` with `dates`, `items`, `anchorDate`,
`focusDate` and `anchorItemId`. Only two helpers exist in core
(`emptySelection`, `selectionItemIds`). `YearPlanner` replaces the whole
selection on a plain click.

### Proposed Changes

Add optional `focusItemId` to the canonical contract and implement the policy in
`packages/react/src/interaction/selection.ts`. The module is internal to the
React package; it is not re-exported from the package entry.

## Implementation Details

### New Types/Interfaces

```ts
/** Keyboard or pointer modifiers relevant to selection. */
export interface SelectionModifiers {
  /** Shift extends or replaces from the anchor. */
  shift: boolean;
  /** Ctrl on Windows/Linux, Cmd on macOS. */
  mod: boolean;
}

/** Returns true when the event uses the platform's primary modifier. */
export function isMod(event: {
  ctrlKey?: boolean;
  metaKey?: boolean;
}): boolean;
```

### New Functions/Methods

```ts
/** Sorts, clamps and merges overlapping or adjacent half-open ranges. */
export function normalizeDateRanges(
  ranges: readonly SelectionDateRange[],
): SelectionDateRange[];

/** Adds one date, splitting around disabled dates when supplied. */
export function addDate(
  ranges: readonly SelectionDateRange[],
  date: DateKey,
  isDisabled?: (date: DateKey) => boolean,
): SelectionDateRange[];

/** Removes one date, splitting the containing range. */
export function removeDate(
  ranges: readonly SelectionDateRange[],
  date: DateKey,
): SelectionDateRange[];

/** Toggles one date. */
export function toggleDate(
  ranges: readonly SelectionDateRange[],
  date: DateKey,
  isDisabled?: (date: DateKey) => boolean,
): SelectionDateRange[];

/** Builds one chronological range from anchor to focus, skipping disabled dates. */
export function rangeBetween(
  anchor: DateKey,
  focus: DateKey,
  isDisabled?: (date: DateKey) => boolean,
): SelectionDateRange[];

/** Plain/Shift/Ctrl date click policy. */
export function applyDateClick(
  selection: PlannerSelection,
  date: DateKey,
  modifiers: SelectionModifiers,
  isDisabled?: (date: DateKey) => boolean,
): PlannerSelection;

/** Plain/Shift/Ctrl drag policy; focus is the current pointer date. */
export function applyDateDrag(
  selection: PlannerSelection,
  anchor: DateKey,
  focus: DateKey,
  modifiers: SelectionModifiers,
  isDisabled?: (date: DateKey) => boolean,
): PlannerSelection;

/** Plain/Shift/Ctrl item click policy. */
export function applyItemClick(
  selection: PlannerSelection,
  itemId: string,
  modifiers: SelectionModifiers,
  visualOrder: readonly string[],
): PlannerSelection;

/** Plain/Shift/Ctrl marquee item policy. */
export function applyItemMarquee(
  selection: PlannerSelection,
  intersecting: readonly string[],
  modifiers: SelectionModifiers,
  visualOrder: readonly string[],
): PlannerSelection;

/** Selects every visible item in visual order and clears dates. */
export function selectAllVisible(
  selection: PlannerSelection,
  visualOrder: readonly string[],
): PlannerSelection;

/** Clears dates, items, anchors and focus. */
export function clearSelection(): PlannerSelection;

/** Sorts visible item IDs by start date, row, lane and ID. */
export function visualItemOrder(
  items: readonly PlannerItem[],
  ribbons: RibbonLayout,
  visible: ReadonlySet<string>,
): string[];

/** True when a date lies in any selected range. */
export function isDateSelected(
  ranges: readonly SelectionDateRange[],
  date: DateKey,
): boolean;
```

### Selection matrix

| Input | Dates | Items | Anchor / focus |
| --- | --- | --- | --- |
| Plain date click | one day, replaces | cleared | `anchorDate = focusDate = date`; item anchor/focus cleared |
| Shift date click | one range from anchor to date | cleared | anchor kept; `focusDate = date` |
| Mod date click | toggles one date, splitting/merging | kept | anchor kept; `focusDate = date`; anchor cleared when no dates remain |
| Plain date drag (select tool) | one range anchor→focus | cleared | anchor = drag anchor; focus = last valid date |
| Shift date drag | one range from anchor→focus | cleared | anchor kept; focus = last valid date |
| Mod date drag | union of existing dates + anchor→focus | kept | anchor kept; focus = last valid date |
| Plain item click | cleared | one item | `anchorItemId = focusItemId = item`; date anchor/focus cleared |
| Shift item click | cleared | visual-order range inclusive | anchor kept; `focusItemId = item` |
| Mod item click | kept | toggles one item | anchor kept; `focusItemId = item`; anchor cleared when no items remain |
| Plain marquee | cleared | intersecting items | no anchor; `focusItemId` = last intersecting in visual order |
| Shift marquee | cleared | existing + intersecting | no anchor; focus = last intersecting |
| Mod marquee | kept | toggles intersecting | no anchor; focus = last intersecting |
| Mod+Shift any click | unchanged | unchanged | unchanged; no diagnostic |
| Ctrl/Cmd+A | cleared | all visible | no anchor; focus = last visible |
| Escape (idle) | cleared | cleared | all anchors/focus cleared |

### Range rules

- Ranges are half-open `[startDate, endDateExclusive)`.
- Empty or reversed ranges are dropped.
- Sorting is by `startDate`; adjacent or overlapping ranges merge.
- Removing a date from `[a, d)` yields `[a, date)` and `[date+1, d)` when both
  sides remain.
- A range crossing a disabled date is split around that date for selection.
  Move/resize/paint validate the full range separately and reject it.
- No date arithmetic is performed on strings beyond `addDays` from the core.

### Visual order

`visualItemOrder` filters to visible IDs and sorts by:

1. period start date ascending;
2. first fragment row index ascending;
3. first fragment lane ascending;
4. item ID ascending.

Items with no visible fragment are excluded.

## Integration Points

- `YearPlanner` calls the click policies from cell/proxy clicks.
- `useInteraction` calls drag/marquee policies.
- Cell/proxy keyboard handlers call click/toggle policies.
- `SelectionPreview` reads selected ranges; `ItemLayer` reads selected item IDs.

## Error Handling

| Error Case | Handling Strategy | AR Ref |
| --- | --- | --- |
| Reversed/empty range | Dropped during normalization | AR-5 |
| Disabled date inside range | Selection splits; edit gestures reject | AR-25 |
| Mod+Shift | Returns the input selection unchanged, no diagnostic | AR-7 |
| Unknown item in visual order | Ignored | AR-6 |
| Controlled selection missing focus | Policy treats it as absent; no throw | AR-3 |

## Testing Requirements

- Pure unit tests for normalization, add/remove/toggle, range splitting, item
  order and every matrix row.
- Table tests for anchor/focus transitions.
- Disabled-date splitting and rejection tests.
- No React/DOM import in the policy module.
