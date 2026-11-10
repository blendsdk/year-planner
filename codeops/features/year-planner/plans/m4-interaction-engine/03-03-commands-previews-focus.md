# Commands, Previews and Focus: RD-07 Interaction Engine

> **Document**: 03-03-commands-previews-focus.md
> **Parent**: [Index](00-index.md)

## Overview

This component turns completed gestures and keyboard actions into selection
changes or typed commands, renders ephemeral previews, restores focus, and
wires the grid surfaces. It reuses the RD-06 command pipeline and inspector
rather than creating a second edit path.

## Architecture

### Current Architecture

- The inspector owns a private `commandForPaint` helper.
- `YearPlanner` owns plain click selection and pending-focus effects.
- `CellLayer` owns date arrow navigation; `ItemLayer` owns proxy traversal.
- No preview components exist.

### Proposed Changes

- Extract shared `buildPaintCommand` and `buildCreateItem` helpers into
  `interaction/builders.ts` (the existing `src/commands.ts` pipeline keeps its
  name).
- Add `SelectionPreview` and `Marquee` render components.
- Add `useInteraction` for pointer listeners, rAF, keyboard, touch, commands
  and focus.
- Reuse `pipeline.requestCommand`, `requestUndo` and `requestRedo` unchanged.

## Implementation Details

### Command builders

```ts
/** Builds an RD-04 paint/erase command for the active highlight layer. */
export function buildPaintCommand(input: {
  model: PlannerModel;
  visibility: VisibilityState;
  filter: PlannerFilter;
  layerId: string;
  startDate: DateKey;
  endDateExclusive: DateKey;
  operation: "union" | "subtract";
  defaults: PaintDefaults;
}): PlannerCommand | undefined;

/** Builds a complete version-1 create item, or undefined without a layer. */
export function buildCreateItem(input: {
  interaction: InteractionConfig | undefined;
  activeLayerId: string | undefined;
  startDate: DateKey;
  endDateExclusive: DateKey;
  createId: () => string;
}): PlannerItem | undefined;
```

`buildPaintCommand` returns `undefined` when the layer is missing or is not a
highlight layer. Its `expectedVersions` include every effectively visible,
unlocked and editable highlight item on the layer that intersects the range —
the same filter as the core paint reducer (`affectedItems`). The inspector uses
the same helper.

`buildCreateItem` uses `interaction.createDefaults.layerId` first, then
`activeLayerId`; kind defaults to `activity`; version is 1; ID comes from
`createPlannerId(interaction)` so `interaction.createId`, `crypto.randomUUID()`
and the monotonic fallback all keep working. Paint defaults come from
`interaction.paintDefaults ?? { kind: "highlight" }`.

### Preview projection

```ts
/** One preview rectangle clipped to one month row. */
export interface PreviewFragment {
  key: string;
  rowId: string;
  startDate: DateKey;
  endDateExclusive: DateKey;
  x: number;
  width: number;
}

/** Projects date ranges into zoom-scaled row fragments. */
export function projectPreviewRanges(
  ranges: readonly SelectionDateRange[],
  layout: YearLayout,
  zoom: number,
): PreviewFragment[];
```

Only valid dates in a row are used. A blank slot is never included. The x/width
come from `row.prefixWidths`, so preview geometry matches ribbon fragments.

### Preview state

```ts
export type GesturePreview =
  | { kind: "selection"; ranges: SelectionDateRange[] }
  | { kind: "marquee"; rect: DesignRect }
  | {
      kind: "item";
      variant: "move" | "resize";
      itemId: string;
      layerId: string;
      ranges: SelectionDateRange[];
      valid: boolean;
    }
  | {
      kind: "range";
      variant: "paint" | "erase" | "create";
      layerId?: string;
      ranges: SelectionDateRange[];
      valid: boolean;
    };
```

Persistent selected ranges render as per-row fragments with
`data-yp-part="selection"` and `data-preview-kind="selection"`. They remain
visible after pointerup and for controlled selection.

Transient drag previews render with `data-yp-part="selection-preview"` for date
drags or `data-yp-part="gesture-preview"` for move/resize/paint/create, plus
`data-preview-kind`, `data-preview-start`, `data-preview-end` and
`data-preview-valid`. They are `aria-hidden="true"` and use the selection or
layer color with a dashed outline for invalid ranges.

Every preview and the marquee has `pointer-events: none`. Date-selection
previews sit above cells and below item proxies; move/resize previews sit above
item proxies so the proposed range is visible over the original item.

The marquee renders as a fixed screen rectangle with
`data-yp-part="marquee"`, `aria-hidden="true"`, using `designRectToScreen`.

### Move/resize preview

The original item remains rendered. The preview shows the proposed period
clipped into the affected rows. On commit the pipeline applies the command; on
cancel the preview disappears and the original is unchanged.

### Focus restoration

| Situation | Target |
| --- | --- |
| Command accepted, item still visible | Item proxy (first fragment) |
| Item removed/hidden | Selection `focusDate`, then item start date, then nearest enabled cell; announce in a polite live region |
| Gesture cancelled | Source item, else gesture start date |
| Selection controlled externally | `focusItemId`, else `focusDate`, else first enabled cell |
| Lane repack / row clipping | Same item by ID, first visible fragment |
| Escape with empty selection | No-op |

`YearPlanner` keeps `activeDate` and `activeItemId` in sync with
`selection.focusDate`/`focusItemId`. An effect prunes selected item IDs that are
no longer effectively visible after visibility/filter changes. When focus falls
back because an item was hidden or removed, the planner updates a polite
`role="status"` live region (`data-yp-part="focus-status"`) with a generic
"focus moved to <date>" message. RD-09 can refine the wording and full
announcement policy.

### Keyboard matrix

| Surface | Key | Action |
| --- | --- | --- |
| Cell | Arrow | Move date focus; skip disabled dates; stop at window edge |
| Cell | Shift+Arrow | Extend/replace date range from the anchor |
| Cell | Space | Toggle the focused date in selection |
| Cell | Enter | Select the date and open the inspector |
| Proxy | Arrow | Move between visible proxies in visual order |
| Proxy | Shift+Arrow | Extend a date range from the item start |
| Proxy | Space | Toggle the item |
| Proxy | Enter | Select the item and open the inspector |
| Grid root | Ctrl/Cmd+A | Select all visible items, clear dates |
| Grid root | Ctrl/Cmd+Shift+key | Ignored, no diagnostic |
| Grid root | Escape | Cancel gesture, else clear selection |
| Grid root | Delete | Delete `focusItemId`, else the sole selected item, else no-op diagnostic |

The grid root is the single owner of Ctrl/Cmd+A, Escape and Delete. Cell/proxy
handlers do not handle those keys. Every cell/proxy/root handler returns early
when `event.defaultPrevented` is true or the event target is a host interactive
control (`button`, `a`, `input`, `select`, `textarea`, `[contenteditable]`,
`role="button"` outside a planner-owned proxy). The overflow popover calls
`stopPropagation`/`preventDefault` on Escape so closing it does not clear the
selection.

### Click ownership and host controls

A planner-originated pointer sequence owns its selection. On pointerup the hook
applies the click/gesture result and sets a one-shot suppression flag; the
native `click` that follows is consumed and ignored. Programmatic and keyboard
clicks still use the existing native click handlers. Both the pointerdown
classifier and the click/key handlers call one `isHostInteractive(target)` guard,
so a host button/input inside a cell keeps its own events and never selects a
date or starts a gesture.

### Touch policy

- `pointerType === "touch"` starts no gesture unless
  `interaction.touchEditing === "on"`.
- `"auto"` is scroll-first and behaves as off until the host sets `"on"`.
- `"off"` never starts a touch gesture.
- The grid root sets `touch-action: none` only while touch editing is on;
  otherwise it leaves native panning intact.
- Chromium E2E uses a touch-enabled project and CDP touch events to prove that a
  real swipe scrolls when editing is off and selects when it is on.
- No built-in touch chrome is added; the host owns the toggle (AR-20).

### Double-click

`interaction.doubleClick` defaults to `"inspect"`. A non-drag double-click on an
item selects it, opens the inspector and moves keyboard focus into it.
`"none"` keeps the normal single-click behavior but does not focus the
inspector, so the difference is observable. A drag never triggers it.

### Undo integration

All commands use `pipeline.requestCommand`, so uncontrolled mode records one
snapshot per accepted command and clears redo. Selection changes never enter the
history. `requestUndo`/`requestRedo` already exist on the handle and are covered
for move, resize, paint, erase, create, update and delete.

## Integration Points

- `YearPlanner` creates the interaction hook with state, layout, ribbons,
  formatters and pipeline.
- `YearGrid` receives `onPointerDown/Move/Up/Cancel`, `onKeyDown`, previews and
  `touchAction`.
- `CellLayer` receives modifier-aware click/key callbacks.
- `ItemLayer` receives modifier-aware click/key callbacks and resize-handle
  pointer targets.
- `MonthRow` renders persistent selection and date previews above cells, and
  move/resize previews above item proxies, all with `pointer-events: none`.
- `Inspector` uses the shared paint/create builders.

## Error Handling

| Error Case | Handling Strategy | AR Ref |
| --- | --- | --- |
| Paint layer missing/wrong channel | `INVALID_PAINT_TARGET`; no command | AR-17 |
| Create layer missing | `INVALID_COMMAND`; no command | AR-17 |
| Move/resize timed item | `TIMED_EDITING_UNSUPPORTED`; no command | AR-15 |
| Invalid resize/period | `INVALID_COMMAND`; no command; restore | AR-15 |
| Read-only/locked item | Pipeline rejects `READ_ONLY`; preview is still discarded | AR-26 |
| Host rejection/timeout | Pipeline feedback; preview gone; original remains; RD-08 owns rollback | AR-26 |
| Hidden item selected | Prune selection; focus nearby date | AR-19 |
| Annotation edit | No gesture; inspect only | AR-24 |

## Testing Requirements

- Command builder tests for paint/create and missing layers.
- Preview projection tests including cross-month clipping.
- Focus fallback tests for commit/removal/hide/repack.
- Keyboard matrix tests for cells and proxies.
- Touch gating tests for off/auto/on and `touch-action`.
- Double-click default/`none` tests.
- Undo/redo tests for every command type.
