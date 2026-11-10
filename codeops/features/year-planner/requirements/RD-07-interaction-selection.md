# RD-07: Interaction Engine, Selection and Keyboard

> **Document**: RD-07-interaction-selection.md
> **Status**: Draft
> **Created**: 2026-11-10
> **Project**: Year Planner for React
> **Depends On**: RD-03, RD-04, RD-05, RD-06
> **CodeOps Artifact Schema**: 1

---

## Feature Overview

Defines the pointer, keyboard and touch interaction model. A gesture produces a
**preview of a proposed change**, not a direct mutation. Selection is a
first-class state separate from items: date ranges and item IDs coexist without
being conflated.

This is the highest-risk area. Every modifier combination, boundary condition
and cancellation path must be specified and tested.

---

## Functional Requirements

### Must Have

- [ ] Interaction modes: `inspect`, `select`, `paint`, `erase`, `create`,
  `move`, `resize` and `auto`. `auto` means item-body drag moves, handle drag
  resizes, empty-cell drag selects; it does not silently paint.
- [ ] A movement threshold (default 4 CSS px) distinguishes click from drag;
  one gesture never fires both a click and a range/create action.
- [ ] Pointer Events with `pointerId`, `setPointerCapture`, pointer cancel and
  auto-scroll near container edges.
- [ ] Selection state: `{ dates: DateInterval[], items: EntityId[],
  anchorDate?, focusDate?, anchorItemId? }`. Controlled via `selection` +
  `onSelectionChange`, or uncontrolled internally.
- [ ] Plain date click selects one date and clears item selection.
- [ ] Shift+date click extends the date range from the anchor; Shift+drag
  extends/replaces the range.
- [ ] Ctrl/Cmd+date click toggles that date; Ctrl/Cmd+drag adds the range.
- [ ] Plain item click selects one item and clears date selection.
- [ ] Ctrl/Cmd+item click toggles the item; Shift+item click selects a range of
  items in visual start order.
- [ ] Marquee drag on empty cells selects items intersecting the rectangle by
  default; a `select` tool drag selects a chronological date range. A screen
  rectangle is never interpreted as a contiguous date interval.
- [ ] Ctrl/Cmd+A selects all visible items; Escape cancels an active gesture,
  then clears selection when idle.
- [ ] Multi-item move is an explicit action with confirmation; dragging one item
  moves only that item by default. Multi-item moves are atomic.
- [ ] Paint unions the dragged date range into the active highlight layer;
  erase subtracts it. Erasing the middle of an interval yields two intervals.
- [ ] Move preserves duration in calendar days for all-day items and handles
  month/year boundaries. Resize enforces at least one day; an end dragged before
  the start is rejected with a diagnostic and no commit.
- [ ] Read-only, locked, hidden or unauthorized items cannot be moved, resized or
  painted, including through imperative commands.
- [ ] Touch is scroll-first; an explicit “Touch edit” mode enables drag/select
  with `touch-action: none` while active. No accidental edit while scrolling.
- [ ] Keyboard: arrow keys move date focus; Shift+Arrow extends a date range;
  Space toggles the focused item/date; Enter inspects; Escape cancels; Delete
  requires permission and confirmation. The inspector provides equivalent
  move/resize/paint actions.
- [ ] Focus is restored to the logical item after lane repack, row clipping,
  hide/show or commit; if removed, focus moves to the nearest meaningful target.
- [ ] Local undo/redo for uncontrolled paint/erase/create/move/resize; selection
  changes are not undoable. Undo emits a compensating local change, not a
  history rewrite.
- [ ] Drag previews are ephemeral; canonical items are not mutated until commit.
- [ ] Blank cells never produce dates; cross-row selection uses chronological
  min/max of valid dates and ignores blank slots.

### Should Have

- [ ] Alt+drag subtraction as an optional modifier, disabled by default to avoid
  OS conflicts.
- [ ] A `requestUndo` / `requestRedo` handle path for local history.
- [ ] A configurable double-click action (inspect by default).

### Won't Have (Out of Scope)

- Split/merge of reservations, batch multi-move, drag between resources/layers.
- Freehand pixel painting as canonical data.
- Automatic scheduling or conflict resolution.
- RTL-specific pointer behavior.
- Touch drag without explicit Touch edit mode.

---

## Technical Requirements

### Finite-state machine

```text
idle
  ├─ pointerDown(empty)        → pendingCell
  ├─ pointerDown(item proxy)   → pendingItem
  ├─ pointerDown(resize handle)→ pendingResize
  └─ pointerDown(annotation)   → inspecting

pendingCell --threshold--> selecting | painting | erasing | creating
pendingItem --threshold--> moving
pendingResize --threshold--> resizing

active --pointerMove--> preview/recompute date/lanes
active --pointerUp--> validating → committing | rejected
active --Escape/pointerCancel--> canceled → idle
validating --host reject/stale/timeout--> rollback → idle
```

### Hit-test priority

1. Resize handle when editing is permitted.
2. Visible item proxy when move/inspect is permitted.
3. Annotation control when directly targeted.
4. Empty date cell.
5. Month/weekday heading navigation.

Background highlights and decorative SVG shapes never intercept pointer events.

### Modifier abstraction

Use `mod` = `Ctrl` on Windows/Linux and `Cmd` on macOS. Never hard-code
`ctrlKey` alone. Shift and mod combinations are tested on both platforms.

### Selection reducer

- Date ranges are normalized and merged according to selection policy.
- Toggling a date inside a range splits the range correctly.
- Item IDs are deduplicated and stable.
- Anchor/focus are preserved across extend/toggle; cleared on replace.
- Selection is deterministic and independent of render order.

### Complexity

FSM and pointer adapter: **L**. Selection matrix: **L**. Keyboard: **M**.
Touch: **M**. Undo/redo: **M**.

---

## Integration Points

- RD-05 supplies fragment bounds and lane previews.
- RD-06 supplies item proxies, cells and handles.
- RD-08 consumes committed commands and rollback outcomes.
- RD-09 owns focus semantics, announcements and keyboard accessibility.
- RD-10 owns pointer/E2E test coverage.

---

## Scope Decisions

| Decision | Options Considered | Chosen | Rationale | AR Ref |
|---|---|---|---|---|
| Selection model | One union, separate dates/items | Separate | Avoids conflating ranges and items | AR #17 |
| Modifier matrix | Various | Plain/Shift/Ctrl/Cmd matrix in this RD | Predictable, documented behavior | AR #18 |
| Marquee | Dates, items, configurable | Items default; dates via select tool | Rectangles do not map to contiguous dates | AR #18 |
| Multi-item move | Drag all, explicit action | Explicit atomic action | High-stakes safety | AR #18 |
| Touch | Auto drag, scroll-first | Scroll-first + Touch edit | Avoid accidental edits | AR #19 |
| Undo | Global/controlled, local | Local uncontrolled R1 | Controlled host owns durable history | AR #8 |

---

## Security Considerations

- **Data sensitivity**: Selection and drag previews may reveal item intervals;
  hidden items are not hit-testable.
- **Input validation**: Pointer coordinates are clamped to valid cells/rows;
  no phantom dates; invalid ranges are rejected.
- **Authentication & authorization**: Read-only/locked/unauthorized items cannot
  be modified; host permission remains authoritative.
- **Injection risks**: N/A — no HTML/script generation from pointer data.
- **Encryption needs**: N/A.
- **Rate limiting**: N/A.
- **Infrastructure**: N/A.

---

## Acceptance Criteria

1. [ ] In `select` mode, dragging from Jan 28 to Feb 6 yields exactly
   `[2027-01-28, 2027-02-07)` and two clipped preview fragments.
2. [ ] Plain click on a date selects that date and clears item selection; a drag
   beyond the 4 px threshold does not fire a click.
3. [ ] Shift+click extends from the anchor; Ctrl/Cmd+click toggles a date;
   Ctrl/Cmd+A selects all visible items; Escape clears.
4. [ ] Marquee selection over three overlapping ribbons selects exactly the
   intersecting item IDs, not a date range.
5. [ ] Erasing `[2027-06-14, 2027-06-17)` from `[2027-06-10, 2027-06-21)`
   leaves `[2027-06-10, 2027-06-14)` and `[2027-06-17, 2027-06-21)`; undo
   restores the original interval.
6. [ ] Moving a 10-day item from Jan 28 to Feb 2 preserves 10 calendar days and
   renders the correct fragments in both rows.
7. [ ] Dragging a resize end before the start shows a diagnostic, does not
   commit, and restores the original item.
8. [ ] Escape during a drag discards the preview and restores the original item
   and focus.
9. [ ] Read-only and locked items cannot be moved/resized/painted by pointer or
   imperative command.
10. [ ] Keyboard-only: arrows move focus; Shift+Arrow extends; Space toggles;
    Enter inspects; the inspector moves an item by one week and commits.
11. [ ] Touch edit off: dragging scrolls; touch edit on: dragging selects; no
    accidental edit while scrolling.
12. [ ] Focus returns to the selected item after lane repack and after commit;
    if the item is hidden, focus moves to a nearby cell and an announcement is
    made.
13. [ ] Security requirements verified: hidden/locked items are not hit-testable,
    blank cells never produce dates, no unauthorized mutation.
