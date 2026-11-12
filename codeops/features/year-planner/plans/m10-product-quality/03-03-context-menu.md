# Context Menu: Product Quality

> **Document**: 03-03-context-menu.md
> **Parent**: [Index](00-index.md)

## Overview

Right-click currently does nothing. Desktop users naturally right-click a date
or an item expecting actions, and the host framework — Fluent UI or MUI — owns
the menu component. This component adds a typed request contract: the planner
reports what was right-clicked, which day is under the pointer, and how the host
can restore focus. The component never ships a menu and never depends on a
design system at runtime.

## Architecture

### Current Architecture

- `useInteraction.ts:275-278` starts gestures only for the primary button; a
  right-click is ignored.
- `YearGrid.tsx` renders `.yp-grid` and `.yp-item-overlay` as **siblings**;
  item proxies live in the overlay, not inside `.yp-grid`.
- Cells expose `data-date`; item fragments expose `data-item-id` and
  `data-yp-channel`; item proxies expose `data-yp-part="item-proxy"` and
  `data-item-id`.
- `interaction/pointer.ts` already classifies a target as date, item or
  annotation and resolves the pointer date.
- There is no `contextmenu` handler anywhere in `packages/react/src`.

### Proposed Changes

| Change | File |
| ------ | ---- |
| Public request types and prop | `packages/react/src/types.ts` |
| Root context-menu resolution and dispatch | `packages/react/src/YearPlanner.tsx`, `render/YearGrid.tsx` |
| Right-click selection without a gesture | `packages/react/src/interaction/useInteraction.ts` |
| Keyboard request from cells and items | `packages/react/src/interaction/useInteraction.ts`, `render/YearGrid.tsx`, `render/ItemOverlay.tsx` |
| Fluent and MUI examples | `apps/storybook/stories/ContextMenu.stories.tsx` |
| Dev-only Storybook dependencies | `apps/storybook/package.json`, lockfile |
| Host documentation | `docs/interaction.md`, `docs/getting-started.md` |

## Implementation Details

### Public types

```ts
/** The date, item or annotation a context-menu request refers to. */
export type PlannerContextTarget =
  | { kind: "date"; date: DateKey }
  | { kind: "item"; itemId: string; date: DateKey }
  | { kind: "annotation"; annotationId: string; date: DateKey };

/** A host-owned context-menu request. */
export interface PlannerContextMenuRequest {
  target: PlannerContextTarget;
  clientX: number;
  clientY: number;
  anchorRect: DOMRect;
  source: "pointer" | "keyboard";
  /** Returns focus to the originating cell or item; the host calls it on close. */
  restoreFocus: () => void;
}

interface YearPlannerProps {
  /** Raises a context-menu request; the host renders the menu. */
  onContextMenuRequest?: (request: PlannerContextMenuRequest) => void;
}
```

For item and annotation targets, `date` is the **day under the pointer**, not
the fragment start. A multi-day item right-clicked on its middle day reports
that middle day. The existing `classifyTarget`/`pointToDate` logic supplies the
date; the context-menu resolver reuses it rather than reimplementing the
geometry.

### Pointer flow

1. A single `contextmenu` listener sits on the component root (`.yp-root`).
   This is the only element that contains both the grid and the item overlay.
2. Ignore touch-originated context menus (`event.pointerType === "touch"` or
   `sourceCapabilities?.firesTouchEvents === true`); long-press remains the
   browser's native behavior.
3. Resolve the target from `event.target.closest(...)` **annotation first**:
   - `[data-item-id][data-yp-channel="annotation"]` → annotation;
   - `[data-yp-part="item-proxy"][data-item-id]` or `[data-item-id]` → item;
   - `[data-date]` → date;
   - otherwise ignore.
4. If `onContextMenuRequest` is absent, return without `preventDefault`; the
   browser menu appears.
5. If present, `preventDefault()` and, for an item target that is not selected,
   select it first (without starting a gesture).
6. Build the request with `clientX`, `clientY`, `anchorRect` from the target
   element, `source: "pointer"` and a `restoreFocus` closure that focuses the
   originating cell or proxy.
7. Call the handler once. The component does not open, position or close a menu.

The existing primary-button gate already prevents a right-click from starting a
move, resize, paint or marquee gesture.

### Keyboard flow

- A single `onKeyDown` handler on the component root detects `Shift+F10` or the
  `ContextMenu` key. Do not duplicate the handler on the grid and on every
  proxy.
- Resolve the active target from the focused element: a proxy
  (`data-item-id`), an annotation fragment, or a cell (`data-date`). If the
  focused element is not a planner target, ignore the key.
- Set a short-lived "keyboard request" flag so the browser-generated
  `contextmenu` event that follows is ignored and only one request is raised.
- `anchorRect` comes from the focused element; `clientX`/`clientY` are its
  bottom-left corner so a host can position a menu without a pointer.
- The component does not move focus. The request's `restoreFocus` closure lets
  the host return focus when its menu closes.

### Host examples

Storybook includes two examples, both host-owned:

- **Fluent UI**: `Menu` + `MenuList` + `MenuItem` inside a `FluentProvider`,
  anchored with `position: fixed` at `clientX/clientY`. Fluent v9 needs a
  trigger/popover composition or a programmatic open; the example uses the
  programmatic open path.
- **MUI**: `Menu` + `MenuItem` with `anchorReference="anchorPosition"` and
  `anchorPosition={{ top: clientY, left: clientX }}`.

The examples call `onContextMenuRequest`, store the request in local state,
render actions such as "New item", "Edit", "Hide layer" and "Delete", and call
`request.restoreFocus()` after closing. The design-system packages are
**devDependencies of the private Storybook app**, not dependencies of the
library.

### Data and privacy

- The request contains only identifiers, a date, coordinates, a rect, the
  source and the focus closure.
- Hidden items are absent from the DOM and cannot be resolved as targets.
- Item content, titles, host data and hidden fields are never included.
- The handler receives the same items the host already passed in; no extra
  query or fetch is performed.

### Error Handling

| Error Case | Handling Strategy | AR Ref |
| ---------- | ----------------- | ------ |
| No `onContextMenuRequest` handler | Do nothing; the native browser menu remains | AR-17 |
| Right-click on empty grid chrome | Ignore; no request and no `preventDefault` | AR-13 |
| Right-click on an unselected item | Select it, then raise the request; no gesture | AR-16 |
| Right-click on an annotation proxy | Resolve `kind: "annotation"` before the item proxy branch | AR-35 |
| Right-click a multi-day item | Report the day under the pointer | AR-35 |
| Handler throws | The error propagates to the host; the component does not swallow it or leave a gesture active | AR-14 |
| Keyboard key and the browser `contextmenu` event both fire | The keyboard flag suppresses the duplicate; exactly one request is raised | AR-15 |
| Host menu closes without returning focus | The host calls `restoreFocus`; the component keeps its own focus state unchanged | AR-13 |
| Touch long-press | Ignore the touch-originated `contextmenu`; the browser's native behavior remains | AR-34 |

> **Traceability:** every design choice above is recorded in
> [00-ambiguity-register.md](00-ambiguity-register.md).

## Testing Requirements

- Unit tests for target resolution: proxy, annotation proxy, cell, chrome.
- Component tests for the native fallback, `preventDefault` with a handler,
  right-click selection and the no-gesture invariant.
- Keyboard tests for `Shift+F10` and `ContextMenu` on a cell and an item;
  assert exactly one request.
- A hidden-item test proves a hidden item cannot be a context target.
- A touch test proves a long-press contextmenu event does not raise a request.
- Storybook stories for Fluent and MUI render and open a menu from a request.
- The security E2E suite asserts that no hidden item details appear in the
  rendered demo or the request payload; the Storybook menus are documentation,
  not a security proof.
- The demo gains a `?context=1` mode that logs requests so the E2E can assert
  the payload without reaching into React internals.
