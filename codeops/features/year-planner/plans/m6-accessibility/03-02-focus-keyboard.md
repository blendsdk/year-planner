# Focus and Keyboard: Accessibility Plan

> **Document**: 03-02-focus-keyboard.md
> **Parent**: [Index](00-index.md)

## Overview

This specification defines the roving focus model, the tab order, the skip link and the keyboard
commands that are not yet implemented. It keeps focus state in logical IDs (`activeDate`,
`activeItemId`, `selection.focusDate`, `selection.focusItemId`) and resolves DOM nodes only when
moving focus.

## Architecture

### Current Architecture

- `YearPlanner.tsx` owns `activeDate`, `activeItemId`, `pendingFocus` and the focus-restoration
  effect (`YearPlanner.tsx:348-413`).
- `CellLayer.tsx` gives one date cell `tabindex=0`; every other dated cell is `-1`.
- `ItemLayer.tsx` gives one fragment proxy `tabindex=0`; arrow keys move through proxy DOM order.
- `Overflow.tsx` gives every row’s overflow button a normal tab stop.
- The inspector close handler restores focus to the active item or date.

### Proposed Changes

#### Tab order

| Order | Element | Tab stops |
| ----- | ------- | --------- |
| 1 | Skip link | 1 (visible on focus) |
| 2 | Grid | 1 date cell with `tabindex=0` |
| 3 | Item layer | 1 proxy with `tabindex=0` |
| 4 | Overflow | 1 button with `tabindex=0` in the active row |
| 5 | Inspector | Close button, item list, selected actions, overflow, feedback, create |

Resize handles remain `tabindex=-1`; keyboard resize is available through the inspector.

### Active date resolution

`effectiveActiveDate` currently falls back to the first date. It must resolve through
`nearestEnabledDate` when:

- no active date is set; or
- the active date is no longer in the layout; or
- the active date is disabled by `getDateMeta`.

The resolved date is the single `tabindex=0` cell. The fallback announcement uses the existing
`Focus moved to <date>` message.

### Home and End

| Key | Behaviour |
| --- | --------- |
| `Home` | Focus the first enabled date in the current month row |
| `End` | Focus the last enabled date in the current month row |

The row is found from `layout.rows` by `firstDate <= date < endDateExclusive`. Candidate dates are
the row’s dated columns. Disabled candidates are skipped inward. `PageUp`/`PageDown` stay
unimplemented; they are optional in RD-09 (AR-14).

### Overflow roving tab stop

`MonthRow` receives `activeRowId` (the row containing the effective active date) and passes
`tabIndex={row.rowId === activeRowId ? 0 : -1}` to `Overflow`. When date focus enters another row,
that row’s overflow button becomes the single tab stop. The button remains reachable after the
roving proxy because it appears later in the row’s DOM.

When the popover opens, focus moves to the first entry. `Escape` closes it and returns focus to the
button. Selecting an entry selects and focuses the item, then closes the popover.

### Skip link

The root renders, as its first focusable child:

```tsx
<a className="yp-skip-link" href={`#${itemListId}`} onClick={skipToItemList}>
  Skip to item list
</a>
```

`skipToItemList` opens the inspector when needed and sets a one-shot focus flag. An effect focuses
the item-list section (`tabIndex=-1`) after it renders. The link is hidden visually until focused
and is omitted when `showInspector === false`.

### Focus restoration

The existing `pendingFocus` effect stays the single restoration path. It must:

1. resolve the logical item’s first visible fragment;
2. fall back to the nearest enabled date when the item is gone or hidden;
3. announce the fallback through the polite live region;
4. clear the pending target after focusing.

Successful gestures and structural changes (lane repack, row clipping, hide/show) already set
`activeItemId`/`focusItemId`; the plan adds tests for a repack that moves the item to another row
and for a command that changes the item’s period.

#### Inspector action focus policy

Inspector **Move earlier**, **Move later**, **Resize shorter** and **Resize longer** keep focus on
the pressed button after acceptance. Stealing focus to the proxy after each accepted change would
make repeated operations require a new trip through the inspector. **Delete** falls back to the
nearest date because the item is gone. Gesture commits restore the item proxy. This is the
explicit reading of “focus returns to the logical item after a successful command” (AR-17).

## Implementation Details

### New Helper: `packages/react/src/interaction/row.ts`

```ts
/** Finds the month row that contains a date. */
export function rowForDate(
  layout: YearLayout,
  date: DateKey,
): MonthRowLayout | undefined;

/** Returns the first or last enabled date in a row. */
export function rowEdgeDate(
  layout: YearLayout,
  date: DateKey,
  edge: "start" | "end",
  isDisabled: (date: DateKey) => boolean,
): DateKey | undefined;
```

`rowEdgeDate` scans the row’s dated columns from the requested edge and returns the first enabled
date. It returns `undefined` when every date in the row is disabled.

### Interaction changes

- `useInteraction.onCellKeyDown` handles `Home` and `End` before the arrow map.
- `YearGrid`/`MonthRow` receive `selectedDates` and `activeRowId`.
- `Overflow` receives `tabIndex` and focuses its first entry on open.

### Integration points

- `YearPlanner` computes `effectiveActiveDate`, `activeRowId` and `selectedDates`.
- `MonthRow` passes `activeRowId` to `Overflow`.
- `Inspector` receives `itemListId` and `itemListRef`.

## Error Handling

| Error Case | Handling Strategy | AR Ref |
| ---------- | ----------------- | ------ |
| No enabled date in the layout | No cell receives `tabindex=0`; the grid keeps its label | AR-10 |
| Focused item has no visible fragment | Fall back to nearest enabled date and announce | AR-10 |
| Skip link target is closed | Open the inspector, then focus the item list | AR-1 |
| Overflow row disappears | The next active row’s button becomes the tab stop | AR-9 |
| Inspector is host-disabled | Omit the skip link; the grid remains fully keyboard operable | AR-1 |

## Testing Requirements

- Vitest: roving tab stops, disabled first date, Home/End edges, overflow tab stop.
- Playwright: Tab order, skip link, arrow/Shift+Arrow/Space/Enter/Delete flow, focus restoration.
- Accessibility-tree assertion: exactly one `gridcell` with `tabindex=0`, one proxy, one overflow
  button in the tab order.
- Focus policy: gesture commit returns to the item; inspector move keeps the button focused; Delete
  falls back to the nearest date.
