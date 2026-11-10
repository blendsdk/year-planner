# Inspector: M3 React View

> **Document**: 03-05-inspector.md
> **Parent**: [Index](00-index.md)

## Overview

A component-owned side panel that lists selection details, effective
visibility, editability, overflow items and command feedback. It is keyboard
reachable without traversing the grid and can be replaced through
`renderInspector`.

## Visibility and DOM

```html
<aside data-yp-part="inspector" class="yp-inspector" aria-label="Planner inspector" tabindex="-1">
  <header class="yp-inspector-header">
    <h2>Inspector</h2>
    <button type="button" data-yp-part="inspector-close" aria-label="Close inspector">×</button>
  </header>
  <div class="yp-inspector-body">
    ...selected items / overflow / feedback / empty...
  </div>
</aside>
```

- Rendered when `showInspector !== false` and not locally closed.
- Selecting an item or calling `openInspector()` opens it.
- The close button hides it locally; a new selection opens it again.
- `renderInspector` replaces the body content while the aside, close button,
  ARIA and focus target remain owned by the component.
- Focus moves to the aside (not trapped) when opened through the handle; close
  returns focus to the last focused item or date.
- `InspectorRenderContext.items` is the deduplicated list of **effectively
  visible** selected items only; hidden or missing items are omitted.

```ts
interface InspectorActions {
  close(): void;
  focusItem(id: string): void;
  requestCommand(command: PlannerCommand): void;
  retry?(): void;
  dismiss?(): void;
}
interface InspectorRenderContext {
  selection: PlannerSelection;
  items: readonly PlannerItem[]; // effectively visible selected items only
  actions: InspectorActions;
}
```

## Default content

### Selected items

For each unique selected item ID, in selection order:

- title (`item.title ?? item.id`) and kind;
- layer name and group path;
- period formatted in `locale`/`displayTimeZone`;
- status, resource names (host data, only for visible items);
- effective visibility and reason;
- editability for move/resize/paint/delete via `getItemEditability`,
  `canDeleteItem` and `canCreateItem`;
- action buttons: `Delete`, `Move earlier`, `Move later`, `Resize shorter`,
  `Resize longer`, `Paint range`, `Erase range`.

A hidden or missing item never renders details; it is skipped.

### Overflow

For the active row (derived from `selection.focusDate` or the focused cell),
list `RibbonRow.overflow` entries with title and date span. Clicking an entry
selects the item and focuses its proxy.

### Create

`Create item` uses `createDefaults.layerId` first, then `activeLayerId`. The
create check calls `canCreateItem` with the chosen layer as `activeLayerId`, so
the core target rule does not reject an explicit default. It is
shown when either exists and uses the selected date range, or the focused date
as one day. If neither a layer nor a date exists, it is disabled with a hint.

### Feedback

- Shows the latest diagnostic message and code.
- `Retry` appears for timeout/host-rejected/validation failures.
- `Dismiss` clears the feedback.
- Both buttons are keyboard reachable.

### Empty state

When nothing is selected and no overflow is available, `renderEmpty()` content
or a short "Select an item or date range" hint is shown.

## Actions

All actions build a `PlannerCommand` and call the same `requestCommand`
pipeline:

| Action | Command |
|---|---|
| Delete | `delete` with current version (after confirmation) |
| Move earlier/later | `move` with period shifted by −7/+7 days (one week, matching RD-07 AC11) |
| Resize shorter/longer | `resize` with end moved −1/+1 day, minimum one day |
| Paint range | `paint` union over selected dates or item period, active highlight layer |
| Erase range | `paint` subtract over selected dates or item period |
| Create item | `create` with `createDefaults.layerId ?? activeLayerId`, version 1, selected/focused day |

- Timed items render the period but move/resize/paint are disabled with a
  `TIMED_EDITING_UNSUPPORTED` diagnostic. Delete remains available.
- Read-only/locked/hidden items show disabled actions and a reason; invoking the
  handle still rejects with `READ_ONLY`.
- Paint/erase requires `activeLayerId` to be an existing **highlight** layer.
  A missing, background, ribbon, annotation or foreground layer yields
  `INVALID_PAINT_TARGET` (the same code for every invalid paint target).
- Actions never mutate `items` directly; they use the command pipeline.

## Accessibility

- Aside has `aria-label`, `tabindex="-1"` and a landmark role (`complementary`).
- Buttons have accessible names and visible focus.
- The close button is the first tab stop after the aside is focused.
- Selection details use definition lists; action groups use `aria-label`.
- No nested interactive controls inside item proxies.
- Inspector remains usable with `unstyled`.

## Testing Requirements

- Open/close, selection opening, `showInspector={false}`, handle open.
- Details for selected items; hidden selected items omitted from context.
- Overflow list for the active row.
- Every action emits the expected command; move is exactly ±7 days.
- Create layer precedence; neither-layer disabled state.
- Read-only rejection and disabled reasons; timed edit diagnostic.
- Retry/dismiss and keyboard reachability.
- `renderInspector` replacement keeps the aside and close button.
- Empty state uses `renderEmpty`.
