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
  auto-scroll near container edges. Coordinates map through scroll and zoom.
- [ ] Selection state uses the canonical `DateInterval` and `PlannerSelection`
  types defined in **RD-04, Shared public contracts**. Controlled via
  `selection` + `onSelectionChange`, or uncontrolled via `defaultSelection`.
- [ ] Selection policy:
  - dates are normalized/merged; toggling a date inside a range splits it;
  - plain date click replaces dates and clears items;
  - Shift+date click/drag extends/replaces the range from the anchor;
  - Ctrl/Cmd+date click toggles a date, adds/removes ranges and keeps items;
  - plain item click replaces items and clears dates;
  - Shift+item click selects an item range in visual start order and clears
    dates;
  - Ctrl/Cmd+item click toggles an item and keeps dates;
  - Ctrl/Cmd+A selects all visible items and clears dates;
  - Ctrl/Cmd+Shift is **reserved and ignored** in R1 (no selection change, no
    diagnostic);
  - Escape cancels an active gesture, then clears selection when idle.
- [ ] Anchor/focus transitions:
  - plain replace sets `anchorDate`/`focusDate` to the clicked date and clears
    the item anchor;
  - Shift extend keeps the anchor and moves focus to the new edge;
  - Ctrl/Cmd toggle keeps the anchor, moves focus to the toggled date, and
    clears the anchor if the last date is removed;
  - plain item replace sets `anchorItemId` and clears date anchor/focus;
  - Shift item range sets the item anchor and focus item;
  - Escape clears anchor/focus with the selection;
  - marquee replace sets focus to the last intersecting item/date but no anchor.
- [ ] Marquee drag on empty cells selects items intersecting the rectangle by
  default; Shift+marquee adds, Ctrl/Cmd+marquee toggles; a `select` tool drag
  selects a chronological date range. A screen rectangle is never interpreted
  as a contiguous date interval.
- [ ] Dragging one item moves only that item. Batch multi-move and `bulk`
  commands are deferred from R1.
- [ ] Paint/erase require `activeLayerId` pointing to a highlight layer. If it
  is missing or not a highlight layer, a diagnostic is shown and no command is
  emitted.
- [ ] Paint unions the dragged range into the active layer; erase subtracts it.
  The data semantics are RD-04: erase replaces one source item with zero, one or
  two new items; no hole is stored.
- [ ] Create uses `interaction.createDefaults` (`kind`, `layerId`), optional
  `createId` (default `crypto.randomUUID()` when available, otherwise a
  monotonic fallback), version 1 and the proposed range. The host receives a
  complete `create` command.
- [ ] Delete requires `confirmChange` (default confirmation for destructive
  actions); a read-only/locked item cannot be deleted by pointer or imperative
  command.
- [ ] Move preserves duration in calendar days for all-day items and handles
  month/year boundaries. Resize enforces at least one day; an end dragged before
  the start is rejected with a diagnostic and no commit.
- [ ] Read-only, locked, hidden or unauthorized items cannot be moved, resized,
  painted or deleted, including through imperative commands. Editability follows
  RD-04 precedence.
- [ ] Timed items are read-only in the classic view; move/resize emits
  `TIMED_EDITING_UNSUPPORTED`.
- [ ] Touch is scroll-first. `touchEditing: 'auto'` behaves as `off` until the
  user enables the explicit Touch edit toggle; `'on'` enables drag/select with
  `touch-action: none` while active; `'off'` never enables it. No accidental
  edit while scrolling.
- [ ] Keyboard: arrow keys move date focus; Shift+Arrow extends a date range;
  Space toggles the focused item/date; Enter inspects; Escape cancels; Delete
  requires permission and confirmation. The inspector provides equivalent
  move/resize/paint/create/delete actions.
- [ ] Focus is restored to the logical item after lane repack, row clipping,
  hide/show or commit; if removed, focus moves to the nearest meaningful target.
- [ ] Local undo/redo for uncontrolled update/paint/erase/create/move/resize/
  delete; selection changes are not undoable. Undo emits a compensating local
  change and updates `onItemsChange`. Controlled history is host-owned.
- [ ] Drag previews are ephemeral; canonical items are not mutated until commit.
- [ ] Blank cells never produce dates; cross-row selection uses chronological
  min/max of valid dates and ignores blank slots. Dates marked `disabled` by
  `getDateMeta` are not selectable, focusable, movable or paintable; pointer and
  keyboard navigation skip them.
- [ ] A pointer gesture is canceled when the year/range, items, visibility or
  interaction mode changes mid-gesture.

### Should Have

- [ ] Alt+drag subtraction as an optional modifier, disabled by default to avoid
  OS conflicts.
- [ ] `requestUndo` / `requestRedo` handle paths for local history.
- [ ] A configurable double-click action (inspect by default).

### Won't Have (Out of Scope)

- Batch multi-move, `bulk` commands, split/merge of reservations, drag between
  resources/layers.
- Freehand pixel painting as canonical data.
- Automatic scheduling or conflict resolution.
- RTL-specific pointer behavior.
- Touch drag without explicit Touch edit mode.

---

## Technical Requirements

### Finite-state machine

```text
idle
  ├─ pointerDown(empty)         → pendingCell
  ├─ pointerDown(item proxy)    → pendingItem
  ├─ pointerDown(resize handle) → pendingResize
  └─ pointerDown(annotation)    → inspecting

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

### Coordinate mapping

- Map pointer position to a month row and column using row bounds and prefix
  widths; validate the mapped date against the month.
- Account for scroll, zoom, sticky headers and `ResizeObserver` changes.
- If the pointer is over a blank slot or outside valid rows, hold the last valid
  date; never invent a date. On pointer up, use the chronological min/max of the
  anchor and last valid date.
- Cross-row selection is chronological, not a rectangular cell block.

### Complexity

FSM and pointer adapter: **L**. Selection matrix: **L**. Keyboard: **M**.
Touch: **M**. Undo/redo: **M**.

---

## Integration Points

- RD-05 supplies fragment bounds and lane previews.
- RD-06 supplies proxies, cells, handles and the inspector.
- RD-08 consumes committed commands and rollback outcomes.
- RD-09 owns focus semantics, announcements and keyboard accessibility.
- RD-10 owns pointer/E2E test coverage.

---

## Scope Decisions

| Decision | Options Considered | Chosen | Rationale | AR Ref |
|---|---|---|---|---|
| Selection model | One union, separate dates/items | Separate | Avoids conflating ranges and items | AR #17, #44 |
| Modifier matrix | Various | Plain/Shift/Ctrl/Cmd policy in this RD | Predictable, documented | AR #18, #44 |
| Marquee | Dates, items, configurable | Items default; dates via select tool | Rectangles do not map to contiguous dates | AR #18 |
| Batch move | Include, defer | Deferred | High-stakes; not required | AR #38 |
| Paint target | First highlight layer, active layer | Active layer required | Explicit and safe | AR #40 |
| Touch | Auto drag, scroll-first | Scroll-first + Touch edit | Avoid accidental edits | AR #19 |
| Undo | Controlled, local | Local uncontrolled R1 | Controlled host owns durable history | AR #8, #55 |

---

## Security Considerations

- **Data sensitivity**: Selection and drag previews may reveal item intervals;
  hidden items are not hit-testable and are removed from selection.
- **Input validation**: Pointer coordinates are clamped to valid cells/rows; no
  phantom dates; invalid ranges are rejected. Create defaults are validated.
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
   Ctrl/Cmd+A selects all visible items; Escape clears. Ctrl/Cmd+Shift changes
   nothing and leaves selection/anchor/focus unchanged.
4. [ ] Marquee selection over three overlapping ribbons selects exactly the
   intersecting item IDs, not a date range. Shift+marquee adds; Ctrl/Cmd+marquee
   toggles.
5. [ ] Erasing `[2027-06-14, 2027-06-17)` from `[2027-06-10, 2027-06-21)`
   leaves two highlight items `[2027-06-10, 2027-06-14)` and
   `[2027-06-17, 2027-06-21)`; undo restores the original item.
6. [ ] Paint union over `[2027-06-10, 2027-06-14)` with
   `[2027-06-12, 2027-06-15)` yields one `[2027-06-10, 2027-06-15)` item.
7. [ ] Moving a 10-day item from Jan 28 to Feb 2 preserves 10 calendar days and
   renders the correct fragments in both rows.
8. [ ] Dragging a resize end before the start shows a diagnostic, does not
   commit, and restores the original item.
9. [ ] Escape during a drag discards the preview and restores the original item
   and focus.
10. [ ] Read-only and locked items cannot be moved/resized/painted/deleted by
    pointer or imperative command.
11. [ ] Keyboard-only: arrows move focus; Shift+Arrow extends; Space toggles;
    Enter inspects; the inspector moves an item by one week and commits.
12. [ ] Touch edit off: dragging scrolls; touch edit on: dragging selects; no
    accidental edit while scrolling.
13. [ ] Create with `createDefaults.layerId` (or `activeLayerId` when no default)
    produces a complete create command with a stable ID and version 1; if
    neither is supplied, a diagnostic is shown. Delete requires confirmation.
14. [ ] Changing the year/range, items, visibility or interaction mode during a
    drag cancels the gesture and restores focus.
15. [ ] Focus returns to the selected item after lane repack and after commit;
    if the item is hidden, focus moves to a nearby cell and an announcement is
    made.
16. [ ] In uncontrolled mode, redo re-applies the last undone local update/
    paint/erase/create/move/resize/delete; redo is cleared by a new edit. In
    controlled mode, undo/redo are host-owned and no local entry is created.
17. [ ] Plain item click replaces item selection and clears dates; Shift+item
    selects a visual-order item range and clears dates; Ctrl/Cmd+item toggles an
    item and keeps dates; anchor/focus update per the transition table.
18. [ ] A `disabled` date is skipped by arrow navigation, cannot be selected,
    painted, moved or resized, and exposes `aria-disabled`.
19. [ ] Security requirements verified: hidden/locked items not hit-testable,
    blank cells never produce dates, no unauthorized mutation.
