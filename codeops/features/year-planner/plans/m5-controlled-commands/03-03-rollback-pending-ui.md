# Rollback and Pending UI: RD-08 Controlled Commands

> **Document**: 03-03-rollback-pending-ui.md
> **Parent**: [Index](00-index.md)

## Overview

This document owns what the user sees between a drop and an authoritative
result: the pending preview, the pending item style, the command-status
announcement, inspector feedback and focus restoration. It also defines how the
interaction layer reacts when a request is ignored or rejected.

The split is deliberate. The command pipeline knows item IDs and outcomes; it
does not know about ribbons, geometry or React preview types. The interaction
layer already owns gesture state and preview projection, so it owns the pending
preview list too (AR-15).

## Architecture

### Interaction commit result

`commitGesture` currently starts the request and attaches focus handling inside
each branch. Change it to return a small descriptor:

```ts
export interface GestureCommit {
  /** Preview to keep visible until the request settles. */
  preview?: GesturePreview;
  /** Settlement promise, when a command was dispatched. */
  promise?: Promise<CommandRequestResult>;
}

export function commitGesture(
  completion: GestureCompletion,
  context: CommitContext,
): GestureCommit;
```

- Selection clicks, marquee and invalid completions return `{}`; they still
  emit selection or diagnostics immediately.
- Move, resize, paint and create return the preview and the request promise.
- Focus handling stays in `commitGesture` because it already has the source
  item, visible set and fallback date. It attaches one `.then` to the promise;
  `useInteraction` attaches another to manage the preview. Settlement is
  idempotent, so two observers are safe.

### Pending preview list

`useInteraction` keeps:

```ts
interface PendingGesturePreview {
  key: string;
  preview: GesturePreview;
}
```

On each command completion:

1. Generate a local key from a monotonic counter.
2. Add `{ key, preview }` to the list.
3. `void promise.finally(() => remove(key))`.

The hook returns `previews`, ordered oldest pending first and the currently
active gesture preview last so it paints on top. The list is cleared on unmount
and a mounted ref guards the removal.

`YearGrid` and `MonthRow` accept `previews: readonly GesturePreview[]` instead of
one `preview`. Each row loops over the list and renders its clipped fragments.
The marquee branch checks the active list for `kind: "marquee"`. Keys include the
preview index and the fragment key so two pending previews of the same item
cannot collide.

The canonical item array is never changed for a pending request. The pending
preview is `aria-hidden` and `pointer-events: none`, like the existing gesture
preview.

## Pending and terminal presentation

### Pending item

`ItemLayer` already emits `data-yp-pending` and `aria-busy`. Add a style that
does not rely on color alone:

```css
.yp-fragment[data-yp-pending="true"] {
  outline: 1px dashed var(--yp-focus-ring);
  outline-offset: -1px;
}
```

The item stays at its canonical geometry while the preview shows the proposal.
A pending create has no item yet, so its preview is the only pending visual. A
pending delete keeps the source item with the pending outline until props remove
it.

### Command status

Add a second polite live region next to the focus announcer:

```tsx
<p className="yp-sr-only" role="status" aria-live="polite" data-yp-part="command-status">
  {commandAnnouncement}
</p>
```

`YearPlanner` watches `pipeline.lastSettled` and sets one plain message:

| Result | Message |
| ------ | ------- |
| `accepted` | “Change accepted” |
| `rejected` | “Change rejected: {first diagnostic message}” |
| `accepted-not-applied` | “Change accepted by the host but not applied” |
| `ignored` | no announcement |
| `confirmation-denied` | no announcement |

The root also exposes
`data-yp-command-state={pipeline.pendingItemIds.size > 0 ? "pending" : pipeline.lastSettled?.result ?? "idle"}`
for styling and browser tests. A new request clears the previous settlement so
the attribute does not claim an old success while a new command is pending.
This is presentation only; it is not authorization.

### Inspector feedback and notices

`InspectorFeedback` renders:

- the terminal failure feedback with its level, code and message;
- a retry button only when `feedback.retryable`;
- a dismiss button that clears feedback and notices;
- a bounded notice list for warning/info diagnostics, each rendered as text.

Accepted and accepted-not-applied outcomes have no success toast. The status
announcement and the pending outline disappearing are the accepted signal; the
item moving to its new geometry is the visible evidence. Accepted-not-applied
uses the feedback section so it cannot be mistaken for success.

Warnings from validation are added to `notices` and sent to `onDiagnostic`. A
warning never blocks. The notice list is capped at five entries, deduplicated by
code + message. Starting a new request clears the previous feedback and notices;
`dismiss` clears both immediately. This keeps a warning visible for the command
it describes and avoids hiding it behind a later failure.

## Rollback

### What is rolled back

| Surface | On rejection/timeout/abort | On accepted-not-applied | On ignored |
| ------- | -------------------------- | ----------------------- | ---------- |
| Pending preview | Removed | Removed | Removed |
| Pending item IDs | Cleared | Cleared | Cleared |
| Canonical items | Never mutated before acceptance; props remain | Props remain | Untouched |
| Selection | Unchanged; no optimistic mutation | Unchanged | Unchanged |
| Focus | Source item if visible, else fallback date | Source item if visible, else fallback date | Unchanged |
| Feedback | Failure message | `ACCEPTED_NOT_APPLIED` | None |

### Selection invariant

No command path calls `setSelection` before the host settles. Gesture selection
and item selection happen before the command is built. Therefore “restore
selection” is an invariant: a rejected or timed-out command does not remove the
source item from selection. If the user changes selection while a command is
pending, the newer selection wins and is never clobbered (AR-14).

### Focus

`commitGesture` resolves focus from the terminal result:

- `accepted`: focus the moved/resized item, or the created item.
- `accepted-not-applied`: focus the source item if it still exists; otherwise
  the fallback date.
- `rejected`: focus the source item when it is visible and still present;
  otherwise the fallback date.
- `ignored` or `confirmation-denied`: do not move focus.
- Paint has no single source item; use the fallback date on failure and leave
  focus alone on success.

The source lookup uses `visibleItemIds` and `state.items`, so a hidden or
removed item falls back to the nearest enabled date. This matches the RD-07
focus lifecycle and RD-09 can refine the announcement text later (AR-14).

### Prop and window changes

The pipeline invalidates requests in two ways (03-01):

- a layout/visibility/filter/interaction-mode change marks validating and
  requesting commands obsolete;
- an affected-item version change marks only a validating request obsolete.
  During requesting, the response settles and the apply-time version re-check
  (uncontrolled) or the application proof (controlled) protects the data.

Their promises resolve `"ignored"`, the preview list removes them, and no
feedback appears. An active gesture is already cancelled by the existing
ribbon-signature/mode effect. A request in `applying` is not cancelled; the props
are the authority and the application waiter decides. Unrelated items keep their
previews and pending state.

## Implementation Details

### `useInteraction` changes

- Add a `pendingPreviews` state array and a monotonic key counter.
- Add a mounted ref; remove entries only while mounted.
- After `commitGesture`, store the returned preview when a promise exists.
- Return `previews` instead of `preview`.
- Keep the active preview computed exactly as today.

The repository enables `exactOptionalPropertyTypes`. Build `GestureCommit` and
preview records with conditional spreads; never assign `undefined` to an
optional property.

### `commitGesture` changes

- Return `GestureCommit`.
- Build the preview for move/resize/paint/create from the completion, using the
  same `previewFromCompletion` helper the active gesture uses.
- Attach result-driven focus to the request promise.
- Do not call `onFocusDate`/`onFocusItem` for a move/resize/paint/create command
  before the result is known.

### Render changes

- `YearPlanner` passes `interaction.previews` to `YearGrid`.
- `YearGrid` passes `previews` to each `MonthRow`.
- `MonthRow` renders all previews in list order.
- The selection preview for date-drag stays a single active preview; it is not
  held after the drag because no command is pending.

### Styling changes

- Pending outline in `styles.css`.
- Optional `data-yp-command-state` selectors for demos; no new theme tokens.

## Error Handling

| Error Case | Handling Strategy | AR Ref |
| ---------- | ----------------- | ------ |
| Host rejects a move | Remove preview, keep canonical geometry, focus source item, show feedback | AR-14, AR-15 |
| Command times out | Same as rejection, `COMMAND_TIMEOUT` feedback | AR-7, AR-14 |
| Host accepts but props never change | Remove preview, show `ACCEPTED_NOT_APPLIED`, revert to props | AR-11, AR-12 |
| Prop/window changes mid-request | Resolve ignored, remove preview, no feedback | AR-10 |
| User starts a second gesture while one is pending | Keep both previews; pending outline remains per item | AR-15 |
| Source item removed during pending | Focus fallback date; no preview | AR-14 |
| Inspector hidden | Feedback/notices are not visible; `onDiagnostic` still fires | AR-17 |
| Warning-only validation | Command proceeds; notice appears in inspector | AR-6, AR-17 |

## Testing Requirements

- Component tests for pending preview lifetime on accept, reject, timeout and
  ignored.
- Focus restoration to the source item and fallback date.
- Selection unchanged after rejection; a newer selection is preserved.
- Two unrelated pending commands render two previews and independent pending
  states.
- Prop/visibility/year change removes the preview and sends no feedback.
- Status announcement text for each terminal result.
- Inspector notices for warnings and retry visibility matrix.
