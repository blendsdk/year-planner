# Gesture Engine: RD-07 Interaction Engine

> **Document**: 03-02-gesture-engine.md
> **Parent**: [Index](00-index.md)

## Overview

The gesture engine turns pointer events into a small, deterministic state
machine. It is pure: it receives a target, a point, the current date under the
pointer and a context snapshot, and returns the next state or a commit intent.
DOM listeners, pointer capture, scrolling and React state belong to
`useInteraction.ts`.

## Architecture

### Current Architecture

No pointer state exists. `CellLayer` and `ItemLayer` expose only click,
focus and key handlers. `geometry.ts` can map a client point to a date or
fragment but has no design-unit export and no threshold/cancel model.

### Proposed Changes

Add `interaction/gesture.ts` and `interaction/pointer.ts`:

- `pointer.ts` classifies event targets.
- `geometry.ts` exposes `pointToDesign` and ribbon-row-aware date mapping.
- `gesture.ts` owns the FSM, activation matrix, marquee intersection,
  auto-scroll delta and commit intents.
- `useInteraction.ts` owns listeners, capture, rAF and command/selection calls.

## Implementation Details

### Gesture state

```ts
/** A pointer position in client coordinates. */
export interface GesturePoint {
  clientX: number;
  clientY: number;
}

/** A rectangle in day-plane design units. */
export interface DesignRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Classified pointer-down target. */
export type GestureTarget =
  | { kind: "cell"; date: DateKey }
  | {
      kind: "item";
      itemId: string;
      fragmentId: string;
      date: DateKey;
      annotation: boolean;
    }
  | { kind: "resize"; itemId: string; edge: "start" | "end"; date: DateKey }
  | { kind: "host-control" }
  | { kind: "none" };

/** Pure context supplied by the view. */
export interface GestureContext {
  mode: InteractionMode;
  marquee: "items" | "dates";
  threshold: number;
  items: ReadonlyMap<string, PlannerItem>;
  /** True only for a known date whose host metadata says disabled. */
  isDisabled: (date: DateKey) => boolean;
  /** Precomputed editability for move/resize; supplied by the view. */
  isEditable: (itemId: string, action: "move" | "resize") => boolean;
}

/** Active gesture kinds. */
export type ActiveGesture =
  | { kind: "select-dates"; anchorDate: DateKey; focusDate: DateKey }
  | { kind: "marquee"; anchor: DesignPoint; current: DesignPoint }
  | {
      kind: "move";
      itemId: string;
      grabOffsetDays: number;
      pointerDate: DateKey;
      fallbackDate: DateKey;
    }
  | {
      kind: "resize";
      itemId: string;
      edge: "start" | "end";
      pointerDate: DateKey;
      fallbackDate: DateKey;
    }
  | {
      kind: "paint";
      operation: "union" | "subtract";
      anchorDate: DateKey;
      focusDate: DateKey;
    }
  | { kind: "create"; anchorDate: DateKey; focusDate: DateKey }
  | {
      kind: "blocked";
      code: "INVALID_COMMAND" | "TIMED_EDITING_UNSUPPORTED";
      message: string;
      fallbackDate: DateKey;
    };

/** Finite-state machine state. */
export type GestureState =
  | { phase: "idle" }
  | {
      phase: "pending";
      target: GestureTarget;
      start: GesturePoint;
      pointerId: number;
      modifiers: SelectionModifiers;
      anchorDate: DateKey;
      lastDate: DateKey;
      startDesign: DesignPoint;
    }
  | {
      phase: "active";
      gesture: ActiveGesture;
      start: GesturePoint;
      startDesign: DesignPoint;
      pointerId: number;
      modifiers: SelectionModifiers;
      lastDate: DateKey;
    };
```

`DesignPoint` is `{ x: number; y: number }` in day-plane design units.

### Reducer functions

```ts
/** Starts a pending gesture, or returns idle for an ignored target. */
export function beginGesture(input: {
  target: GestureTarget;
  point: GesturePoint;
  design: DesignPoint;
  pointerId: number;
  modifiers: SelectionModifiers;
  date: DateKey;
  context: GestureContext;
}): GestureState;

/** Advances a pending gesture into active after the threshold, or updates it. */
export function moveGesture(input: {
  state: GestureState;
  point: GesturePoint;
  design: DesignPoint;
  date: DateKey | undefined;
  context: GestureContext;
}): GestureState;

/** Produces the commit intent; never mutates canonical items. */
export function endGesture(input: {
  state: GestureState;
  design: DesignPoint;
  date: DateKey | undefined;
  context: GestureContext;
}): GestureCompletion;

/** Cancels any gesture and reports the focus to restore. */
export function cancelGesture(state: GestureState): {
  state: GestureState;
  restore?: { itemId?: string; date?: DateKey };
};

/** Returns true when the pointer moved beyond the threshold. */
export function exceedsThreshold(
  start: GesturePoint,
  current: GesturePoint,
  threshold: number,
): boolean;
```

### Commit intents

```ts
export type GestureCompletion =
  | { kind: "none" }
  | { kind: "click"; target: GestureTarget; modifiers: SelectionModifiers }
  | {
      kind: "select";
      anchor: DateKey;
      focus: DateKey;
      modifiers: SelectionModifiers;
    }
  | { kind: "marquee"; rect: DesignRect }
  | {
      kind: "move";
      itemId: string;
      proposedPeriod: PlannerPeriod;
      fallbackDate: DateKey;
    }
  | {
      kind: "resize";
      itemId: string;
      proposedPeriod: PlannerPeriod;
      fallbackDate: DateKey;
    }
  | {
      kind: "paint";
      operation: "union" | "subtract";
      startDate: DateKey;
      endDateExclusive: DateKey;
      fallbackDate: DateKey;
    }
  | {
      kind: "create";
      startDate: DateKey;
      endDateExclusive: DateKey;
      fallbackDate: DateKey;
    }
  | {
      kind: "invalid";
      code: "INVALID_COMMAND" | "TIMED_EDITING_UNSUPPORTED";
      message: string;
      fallbackDate: DateKey;
    };
```

### Activation matrix

| Pointer-down target | auto | inspect / select | paint / erase | create | move | resize |
| --- | --- | --- | --- | --- | --- | --- |
| Date cell | marquee items (`marquee: "dates"` → date range) | date range | paint / erase | create | date range | date range |
| Item proxy | move if editable, else click | click only | paint/erase through the date | create through the date | move if editable | click only |
| Resize handle | resize | click only | paint/erase through the date | create through the date | click only | resize |
| Annotation proxy | click/inspect only | click/inspect | click/inspect | click/inspect | click/inspect | click/inspect |
| Host control / blank | idle | idle | idle | idle | idle | idle |

A resize handle in a mode where resize is not editable falls back to its parent
item target for click selection. Paint/erase/create convert an item or handle
target into the cell date beneath the pointer, so a gesture can start over a
ribbon. Move/resize require
`context.isEditable(itemId, "move" | "resize")` and an all-day item; the view
computes editability with the core `getItemEditability` precedence, so a
locked/read-only/hidden/policy-denied item never starts a preview. Timed items
complete with `TIMED_EDITING_UNSUPPORTED`.

### Heading targets

RD-07's FSM defines no month/weekday heading transition; headings stay
presentation-only in this slice. RD-09 owns keyboard navigation. This is
recorded as an accepted observation, not an implemented gesture target. If a
later slice makes headings interactive, they become a click-only target with
priority below cells.

### Threshold and click exclusivity

- Distance is Euclidean in CSS pixels.
- Below 4 px, `endGesture` returns a `click` intent for the pending target.
- At or above 4 px, the pending target becomes the active gesture.
- The hook suppresses the browser `click` that follows a completed drag.
- A click never emits paint/create/move/resize.

### Move proposal

For an all-day source item:

```text
duration = diffDays(source.startDate, source.endDateExclusive)
grabOffset = diffDays(source.startDate, pointerDownDate)
proposedStart = addDays(currentDate, -grabOffset)
proposedEnd = addDays(proposedStart, duration)
```

The start is clamped to the layout's first/last known date only for preview;
the command may address a date outside the visible window. Only a known date
whose host metadata says disabled blocks the range; an unknown out-of-window
date is not treated as disabled.

### Resize proposal

- `start` edge: `newStart = currentDate`, `newEnd = source.endDateExclusive`.
- `end` edge: `newStart = source.startDate`, `newEnd = addDays(currentDate, 1)`.
- Invalid when `newStart >= newEnd`, the source is timed, or the range contains
  a disabled date.

### Paint / erase / create range

The range is chronological: `min(anchor, focus)` to `addDays(max(anchor, focus),
1)`. A reversed pointer path is valid; a missing date holds the last valid date.
A range containing a disabled date completes as `invalid` with
`INVALID_COMMAND`.

### Marquee geometry

```ts
/** Builds a normalized rectangle from two design points. */
export function designRectBetween(start: DesignPoint, end: DesignPoint): DesignRect;

/** Converts a design rectangle to fixed screen coordinates for the marquee. */
export function designRectToScreen(
  rect: DesignRect,
  view: ViewGeometry,
): { left: number; top: number; width: number; height: number };
```

The marquee stores the pointerup design point, not only the last pointermove, so
a press-release without an intervening move still produces the correct
rectangle. The fixed rectangle uses `designRectToScreen`; it is
`pointer-events: none` and `aria-hidden`.

### Marquee intersection

```ts
/** Returns visible item IDs whose fragments intersect the design rectangle. */
export function intersectMarquee(
  ribbons: RibbonLayout,
  rect: DesignRect,
  options: {
    visible: ReadonlySet<string>;
    showAnnotations: boolean;
    visibleLaneCount: (rowId: string) => number;
  },
): string[];
```

Rules:

- Include ribbon/annotation/foreground fragments only.
- Skip ribbon fragments with `lane >= visibleLaneCount(rowId)`.
- Skip background/highlight fragments.
- Skip items not in `visible`.
- Deduplicate by item ID, return in visual order.

### Auto-scroll

```ts
/** Returns the scroll delta for a pointer near a viewport edge. */
export function autoScrollDelta(input: {
  point: GesturePoint;
  viewportRect: { left: number; top: number; width: number; height: number };
  edge?: number;
  maxStep?: number;
}): { x: number; y: number };
```

Defaults: 32 px edge zone, 12 px maximum per axis per frame. The hook applies
the delta to the viewport and schedules another frame until the pointer leaves
the zone or the gesture ends.

### Cancellation

`useInteraction` cancels when any of these changes during a pending/active
gesture:

| Trigger | Comparison |
| --- | --- |
| Layout/year/range, items, visibility, filter | `ribbons.signature` (already covers layout, items, visibility, filter and fragments) |
| Interaction mode | mode string |
| Escape | key event |
| Pointer cancel/lost capture | pointer event |
| Unmount | effect cleanup |

Equal-content arrays/objects recreated by a controlled host keep the same
signature and do **not** cancel the gesture. A real content change does. Raw
array/object identity is never a cancellation trigger.

Cancellation restores focus to the source item or gesture start date.

## Integration Points

- `useInteraction` feeds `moveGesture` from a rAF-coalesced pointer move.
- `YearGrid` supplies the design point, current date and target from the DOM.
- `SelectionPreview`/`Marquee` consume the preview state owned by the hook.
- `commands.ts` receives only completed commands.

## Error Handling

| Error Case | Handling Strategy | AR Ref |
| --- | --- | --- |
| Pointer outside valid rows | Hold last valid date; no invented date | AR-11 |
| Expanded/lane-grown row height | Map y through `ribbonRow.top`/`height`, not `layout.rowHeight` | AR-11 |
| Unknown out-of-window date | Not a disabled date; edit validation applies only to known dates | AR-25 |
| Blank slot at pointer up | Use last valid date | AR-11 |
| Timed item move/resize | `TIMED_EDITING_UNSUPPORTED`, no command | AR-15 |
| Invalid resize | `INVALID_COMMAND`, no command, restore | AR-15 |
| Disabled date in edit range | `INVALID_COMMAND`, no command | AR-25 |
| Lost capture | Cancel and restore focus | AR-21 |
| Host control | Ignore the gesture | AR-33 |

## Testing Requirements

- Pure tests for threshold, activation matrix, move/resize math, marquee
  intersection, auto-scroll delta and cancellation.
- jsdom tests for pointer capture, click suppression, preview updates and
  cancellation triggers.
- Playwright tests for real drag coordinates across rows and scroll.
