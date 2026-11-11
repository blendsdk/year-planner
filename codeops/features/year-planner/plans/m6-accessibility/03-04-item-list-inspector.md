# Item List and Inspector: Accessibility Plan

> **Document**: 03-04-item-list-inspector.md
> **Parent**: [Index](00-index.md)

## Overview

RD-09 requires a logical item list that is keyboard reachable without traversing the grid, lists
overflow items, excludes hidden items and returns focus to the grid on close. The existing
inspector only shows the current selection and the active row’s overflow. This specification adds a
planner-owned **All visible items** section to the inspector shell.

The item list is rendered even when the host replaces the inspector body with `renderInspector`.
That keeps the skip-link target, the hidden-item filter and the keyboard path stable across host
customisation.

## Architecture

### Current Architecture

- `Inspector.tsx` renders the `aside`, header, close button, `InspectorBody` (default or custom) and
  feedback (`Inspector.tsx:203-277`).
- `DefaultInspectorBody` renders selected details, active-row overflow, create and notes.
- `overflowRow` is the active month row from `YearPlanner`.
- Hidden items are filtered through `getEffectiveVisibility`.

### Proposed Changes

```text
aside[aria-label="Planner inspector"][tabindex=-1]
├── header (h2 + close)
├── InspectorBody (default selected details / custom renderInspector)
├── InspectorFeedback
├── Default body extras (overflow, create)
└── ItemList (planner-owned, always rendered)
    ├── h3 "All visible items (N)"
    └── ul > li > button per visible item
```

## Implementation Details

### New Component: `packages/react/src/render/ItemList.tsx`

```ts
/** Props for the planner-owned item list. */
export interface ItemListProps {
  model: PlannerModel;
  visibility: VisibilityState;
  filter: PlannerFilter;
  selection: PlannerSelection;
  formatters: PlannerFormatters;
  displayTimeZone: string;
  overflowItemIds: ReadonlySet<string>;
  listId: string;
  listRef?: RefObject<HTMLElement | null>;
  onSelectItem: (itemId: string) => void;
  onFocusItem: (itemId: string) => void;
}
```

Behaviour:

1. Resolve effective visibility once per item and drop hidden items.
2. Sort by period start (all-day start or timed start), then title, then id.
3. Render only items with a rendered fragment and effective visibility, then a `section` with
   `id={listId}`, `tabIndex={-1}`, `aria-labelledby`.
4. Render one button per item with:
   - visible title;
   - formatted period;
   - layer label;
   - `aria-pressed={selected}`;
   - an `aria-label` containing title, period, layer and overflow state;
   - `data-yp-item-id` so existing item/fragment selectors stay unambiguous;
   - a visible `hidden on this month` marker when the item is in the active row’s overflow.
5. Clicking selects the item and focuses its first visible proxy. If the item is only in overflow,
   focus falls back to the nearest date and the polite region announces it.

### Inspector changes

- Accept `itemListId` and `itemListRef`.
- Render `ItemList` between the header and the body.
- Keep `aria-label="Planner inspector"` and `tabIndex={-1}`.
- Keep the close button first in the tab order; focus returns to the active item or date.
- Default body keeps selected details and the active-row overflow section.
- The item list is not rendered when `open` is false; the skip link opens the inspector first.

### Hidden items

The item list, selected details and overflow section all use effective visibility. A hidden item
must be absent from:

- the root DOM (`[data-item-id]`);
- the item list;
- the overflow list;
- the date cell count;
- the inspector selection details;
- the accessibility tree via `getByRole("button", { name })`.

### 36-month windows

The list is item-driven, not cell-driven. A 36-month window with a normal item count renders the
same list length as a 14-month window. The inspector remains scrollable (`max-height: 80vh`).

## Error Handling

| Error Case | Handling Strategy | AR Ref |
| ---------- | ----------------- | ------ |
| Item list is empty | Render `No visible items` and keep the section focusable | AR-1 |
| Item has no title | Use the id as visible text and name | AR-3 |
| Item is hidden after selection | Selection prunes the item and the list drops it | AR-13 |
| Item has no visible fragment | Select it, then focus the nearest enabled date and announce | AR-10 |
| Custom inspector body | Item list still renders in the planner-owned shell | AR-1 |

## Testing Requirements

- Vitest: ordering, hidden filtering, overflow marker, button names, focus call.
- Playwright: skip link lands on the list; first Tab enters the first item; hidden item absent.
- axe: list section has an accessible name and valid list structure.
