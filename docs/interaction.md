# Interaction Guide

> **Scope**: pointer, keyboard and touch interaction
> **Status**: Implemented for the classic year view
> **Related**: [documentation index](README.md) · [keyboard and screen-reader map](accessibility.md) · [controlled API](controlled-api.md)

## Modes

Set `interaction.mode` to one of `auto`, `inspect`, `select`, `paint`, `erase`,
`create`, `move` or `resize`.

| Mode | Pointer behaviour |
|---|---|
| `auto` | Item body drags move, handles resize, empty-cell drags marquee items |
| `inspect` | Clicks inspect; dragging selects dates |
| `select` | Drag selects a chronological date range |
| `paint` | Drag paints the active highlight layer |
| `erase` | Drag subtracts from the active highlight layer |
| `create` | Drag creates an item from `createDefaults` or `activeLayerId` |
| `move` | Item body drags move |
| `resize` | Handle drags resize |

`auto` never paints silently. Paint/erase/create require a drag; a click always
selects.

## Selection

Selection is controlled with `selection` + `onSelectionChange`, or uncontrolled
with `defaultSelection`. Date ranges and item IDs coexist.

| Input | Result |
|---|---|
| Plain date click | One selected date; items cleared |
| Shift+date click/drag | Range from the anchor |
| Ctrl/Cmd+date click/drag | Toggle/union without clearing items |
| Plain item click | One item; dates cleared |
| Shift+item click | Visual-order item range |
| Ctrl/Cmd+item click | Toggle an item without clearing dates |
| Ctrl/Cmd+A | All visible items; dates cleared |
| Ctrl/Cmd+Shift+key | Reserved; no change and no diagnostic |
| Escape | Cancel a gesture, else clear selection |
| Marquee drag | Intersecting items; Shift adds, Ctrl/Cmd toggles |
| `marquee: "dates"` | In `auto`, an empty-cell drag selects a date range instead of items |

Ranges are half-open `[startDate, endDateExclusive)`, sorted and merged.
Toggling a date inside a range splits it. A disabled date is never selected;
selection splits around it. A drag preview is local and one selection change is
emitted on pointer release.

## Pointer gestures

Native Pointer Events are delegated on the grid root. A 4 CSS px movement turns
a press into a drag, so a click and a drag never both fire. Dragging near a
viewport edge auto-scrolls. Pointer capture keeps the gesture alive over the
grid; `pointercancel`, lost capture, Escape and a real model change cancel it.

Moves preserve calendar duration and the grab offset. Resizes keep at least one
day and reject a reversed range with `INVALID_COMMAND`. Paint/erase/create use
the same validated command pipeline as the inspector. Invalid ranges never
mutate canonical items.

Host controls inside a cell keep their own pointer and keyboard events. The
planner ignores clicks, keys and drags that start on a host `button`, link,
input, select, textarea, contenteditable element or ARIA widget.

## Previews

Selected dates and transient drag ranges render as clipped row fragments.
Move/resize/paint/create previews sit above item proxies and are decorative:
they use `pointer-events: none` and `aria-hidden="true"`. An invalid range is
shown with a red dashed outline but is never committed.

## Keyboard

| Key | Action |
|---|---|
| Arrow keys | Move date focus; disabled dates are skipped |
| Shift+Arrow | Extend the date range from the anchor |
| Space | Toggle the focused date or item |
| Enter | Select and open the inspector |
| Escape | Cancel a gesture, else clear selection |
| Delete | Delete the DOM-focused item, else the single selected item |
| Ctrl/Cmd+A | Select all visible items |

Delete requires the same permission check and confirmation as the inspector.
A read-only planner, locked item or timed item never produces an edit command.

## Touch

Touch is scroll-first. `interaction.touchEditing: "auto"` behaves as off until
the host sets `"on"`; `"off"` never enables editing. While on, the grid uses
`touch-action: none` and drag/select is available. The component does not render
its own touch toggle; the host owns the control. `"auto"` and `"off"` leave
native panning and zooming intact.

## Focus and undo

After a commit, focus returns to the edited item. If the item is removed or
hidden, focus moves to the nearest enabled date and a polite live region
announces the change. Hidden items are pruned from selection. Selection changes
are not undoable.

In uncontrolled mode, update/move/resize/paint/erase/create/delete commands are
undoable with `requestUndo` / `requestRedo`; a new edit clears redo. Controlled
hosts own durable history, and local undo reports `UNDO_UNAVAILABLE`.

## Example

```tsx
<YearPlanner
  year={2027}
  layers={layers}
  activeLayerId="highlight"
  defaultItems={items}
  interaction={{
    mode: "auto",
    marquee: "items",
    touchEditing: "off",
    createDefaults: { kind: "activity", layerId: "bookings" },
    confirmChange: async () => true,
  }}
  onChangeRequest={(command, context, signal) => host.apply(command, context, signal)}
  onChangeCommitted={(outcome) => host.commit(outcome)}
  onChangeRejected={(outcome) => host.reject(outcome)}
  onSelectionChange={(selection) => host.setSelection(selection)}
/>
```

The full controlled-command contract — request IDs, `baseRevision`, validation
severity, versions, accepted-not-applied detection, rollback and retry — is in
[commands.md](commands.md).

## Known limits

- Batch multi-move, bulk commands, alt+drag subtraction and drag between layers
  or resources are deferred from R1.
- Timed items are read-only in the classic view.
- Annotation items render but are host-owned for edits.
- Automated semantics, focus and announcements are covered in
  [accessibility.md](accessibility.md). The manual NVDA/VoiceOver audit is parked
  and no WCAG conformance claim is made.
