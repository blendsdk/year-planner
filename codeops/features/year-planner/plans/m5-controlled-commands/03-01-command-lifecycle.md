# Command Lifecycle: RD-08 Controlled Commands

> **Document**: 03-01-command-lifecycle.md
> **Parent**: [Index](00-index.md)

## Overview

This document owns the request state machine, context construction, timeout,
abort and obsolete-response handling. Version rules, outcome normalization and
application proof live in [03-02](03-02-versions-outcomes.md). Pending previews
and focus restoration live in [03-03](03-03-rollback-pending-ui.md).

The module split is deliberate: the existing `commands.ts` is already 609 lines,
and the lifecycle additions would push it well past the project's ~700-line
split threshold. `commands.ts` stays as the stable internal entry point so the
component, inspector and interaction layer do not change their imports.

## Architecture

### Module layout

| Module | Owns |
| ------ | ---- |
| `commands.ts` | Re-exports the public-internal types, `createPlannerId` and `useCommandPipeline` |
| `commands/types.ts` | `CommandPipeline`, `CommandFeedback`, `CommandRequestResult`, input types |
| `commands/local.ts` | ID factory, local command reducer, host-outcome application |
| `commands/validate.ts` | Local checks, failure helpers, diagnostic normalization |
| `commands/apply.ts` | Accepted-outcome application rules and per-command waiter predicate |
| `commands/pipeline.ts` | React hook and request state machine |

Dependency direction: `pipeline` → `validate`/`local`/`apply` → `types`; nothing
imports back from `pipeline`. No module imports the interaction or render layer.

### Request state machine

```text
local checks
    │
    ├── fail ──────────────────────────────► rejected (no request ID)
    │
    └── confirm (delete only)
            │
            ├── denied / unavailable ──────► confirmation-denied / rejected
            │
            └── pending state
                    │
                    ├── start deadline ────► validating
                    │                           │
                    │                           ├── error / denied ──► rejected
                    │                           └── permitted ───────► requesting
                    │                                                       │
                    │                         ┌─────────────────────────────┤
                    │                         │                             │
                    │                    timeout/abort                  outcome
                    │                         │                             │
                    │                         ▼                             ▼
                    │                     rejected                  accepted/rejected
                    │                                                       │
                    │                                              controlled?
                    │                                                 │      │
                    │                                                yes     no
                    │                                                 │      │
                    │                                                 ▼      ▼
                    │                                              applying  accepted
                    │                                                 │
                    │                                    ┌────────────┴───────────┐
                    │                                    │                        │
                    │                              props prove            timeout
                    │                                    │                        │
                    │                                    ▼                        ▼
                    │                                 accepted          accepted-not-applied
                    │
                    └── prop/window change while validating/requesting ──► ignored
```

`ignored` is not a failure. It means the response no longer belongs to the
current view state, or the component unmounted. It produces no callback, no
feedback and no mutation.

### Request record

```ts
type RequestPhase = "validating" | "requesting" | "applying";
type RequestStatus = "active" | "settled" | "obsolete";

interface ActiveRequest {
  id: string;
  command: PlannerCommand;
  itemIds: string[];
  phase: RequestPhase;
  status: RequestStatus;
  controller: AbortController;
  deadline?: ReturnType<typeof setTimeout>;
  finish: (result: CommandRequestResult) => void;
}
```

The pipeline stores these in a `Map<string, ActiveRequest>` ref. A request ID
must never be reused while an earlier record exists. The built-in factory is a
UUID with a monotonic fallback. If a host factory returns an ID that is already
active, the pipeline appends a deterministic `#2`, `#3`, … suffix so both
requests remain addressable; the host factory is still documented to return
unique IDs (AR-9).

### Pipeline surface

```ts
export type CommandRequestResult =
  | "accepted"
  | "rejected"
  | "accepted-not-applied"
  | "ignored"
  | "confirmation-denied";

export interface CommandPipeline {
  /** Item IDs with an active command. */
  pendingItemIds: ReadonlySet<string>;
  /** Failure feedback; `undefined` when the last result was accepted or ignored. */
  feedback: CommandFeedback | undefined;
  /** Non-blocking warning/info diagnostics, newest last, capped. */
  notices: readonly Diagnostic[];
  /** Last terminal result, consumed by the status announcer. */
  lastSettled: CommandSettlement | undefined;
  requestCommand(command: PlannerCommand): Promise<CommandRequestResult>;
  retry(): Promise<CommandRequestResult | undefined>;
  dismiss(): void;
  requestUndo(): void;
  requestRedo(): void;
}
```

`CommandFeedback` gains `level: DiagnosticLevel` and keeps `code`, `message`,
`command` and `retryable`. `CommandSettlement` carries the result, command and
diagnostics so the component can announce the outcome without re-deriving it:

```ts
export interface CommandSettlement {
  result: CommandRequestResult;
  command: PlannerCommand;
  diagnostics: Diagnostic[];
}
```

The public `YearPlannerHandle.requestCommand` stays `void`. It calls the
pipeline and ignores the promise (AR-21).

### Input additions

```ts
export interface CommandPipelineInput {
  // existing fields…
  /** Optional host-wide revision token; included in every context when set. */
  baseRevision?: string;
  /** Layout/visibility/filter/mode signature; item changes are checked separately. */
  contextKey?: string;
}
```

`YearPlanner` computes `contextKey` from the layout signature, a stable
serialization of visibility and filter, and the current interaction mode. It
deliberately excludes item versions: item changes are checked per request
against the affected IDs. This avoids cancelling unrelated commands and avoids
racing a controlled host that applies its acceptance to `items`.

```ts
const contextKey = JSON.stringify({
  layout: layout?.signature ?? "",
  mode: state.interactionMode,
  visibility: {
    groups: [...state.visibility.hiddenGroupIds].sort(),
    layers: [...state.visibility.hiddenLayerIds].sort(),
    items: [...state.visibility.hiddenItemIds].sort(),
    channels: [...(state.visibility.hiddenChannels ?? [])].sort(),
  },
  filter: {
    layers: [...(state.filter.layerIds ?? [])].sort(),
    resources: [...(state.filter.resourceIds ?? [])].sort(),
    statuses: [...(state.filter.statuses ?? [])].sort(),
    search: state.filter.search ?? "",
  },
});
```

The current component can compute this key before the pipeline because it only
needs `layout`, `state.visibility`, `state.filter` and `state.interactionMode`;
no hook reordering is required.

## Implementation Details

### Request entry

1. Run local checks synchronously.
2. Reject with `READ_ONLY`, `STALE_REVISION`, `INVALID_COMMAND`,
   `INVALID_PAINT_TARGET`, `TIMED_EDITING_UNSUPPORTED` or
   `CONFIRMATION_UNAVAILABLE` as appropriate.
3. Reject a second command for an item that already has an active request with
   `INVALID_COMMAND`; unrelated items may proceed.
4. For delete, run the confirmation hook before the deadline starts. A denial
   returns `confirmation-denied` with no feedback and no callback.
5. Generate one request ID.
6. Build `CommandContext`:
   ```ts
   const context: CommandContext = {
     requestId,
     ...(input.baseRevision !== undefined ? { baseRevision: input.baseRevision } : {}),
   };
   ```
7. Add the item IDs to `pendingItemIds`, create an `AbortController`, and start
   the deadline.
8. Validate and request; settle exactly once.

### Deadline

One timer covers `validateChange` and `onChangeRequest`. It does not cover local
checks or user confirmation. `commandTimeoutMs` defaults to 15000 ms (AR-7).

```ts
const deadline = new Promise<"timeout">((resolve) => {
  timer = setTimeout(() => resolve("timeout"), timeoutMs);
});
```

When the deadline wins:

1. Mark the request settled.
2. Call `controller.abort()`.
3. Clear pending item IDs.
4. Emit `COMMAND_TIMEOUT` feedback and `onChangeRejected`.
5. Return `"rejected"`.

The timer is cleared on every settlement path. A host response arriving later
finds `status !== "active"` and is ignored.

### Abort

The controller is created per request and passed as an optional third argument
to `validateChange` and `onChangeRequest` (AR-4):

```ts
validateChange?: (
  command: PlannerCommand,
  context: CommandContext,
  signal?: AbortSignal,
) => ValidationResult | Promise<ValidationResult>;

onChangeRequest?: (
  command: PlannerCommand,
  context: CommandContext,
  signal?: AbortSignal,
) => CommandOutcome | Promise<CommandOutcome>;
```

Abort is advisory. If the host ignores it, the pipeline still ignores the late
result. Internal aborts happen on timeout, prop/window invalidation and unmount.
A host-supplied rejected diagnostic with `COMMAND_ABORTED` is a normal rejection
and fires `onChangeRejected`; an internal abort is `ignored` and fires nothing.

### Obsolete responses

Every settlement path checks the request status first:

```ts
function settle(request: ActiveRequest, result: CommandRequestResult): void {
  if (request.status !== "active") return;
  request.status = "settled";
  clearDeadline(request);
  finishPending(request);
  request.finish(result);
}
```

An obsolete request is never `settled` by a response. `finish` resolves the
caller promise with `"ignored"` once.

### Prop and window invalidation

Two independent checks run on every render (AR-10):

1. **Context key change.** A `useEffect` compares `input.contextKey` with the
   previous value. Layout, visibility, filter or interaction-mode changes mark
   every request in `validating` or `requesting` obsolete, abort it, remove its
   pending IDs and resolve it `"ignored"`. Requests in `applying` are left alone
   because the host has already accepted; the application waiter decides from
   props.
2. **Affected-item change.** Each request records the versions (or existence) of
   the items it targets at dispatch. A `useEffect` on `state.items` compares
   those records:
   - while `validating`, a changed or missing affected item marks that request
     obsolete;
   - while `requesting`, the response is allowed to settle; the application
     proof and the uncontrolled apply-time version re-check protect against a
     stale write;
   - while `applying`, props are the application signal.

This keeps unrelated items running (RD-08 “unrelated items may proceed”) and
avoids interpreting a host’s acceptance-driven prop update as an external
change. Equal-content arrays recreated by a controlled host do not change
versions, so they do not invalidate. A paint request’s affected set is
`Object.keys(expectedVersions)`; a brand-new item appearing inside the paint
range is outside this check and remains a host-validated concern.

### Unmount

The cleanup effect marks every active request obsolete, aborts it, clears its
timer and resolves it `"ignored"`. No state update is attempted after unmount.
This is the internal equivalent of “unmount cancels in-flight commands”; hosts
that honor the signal can stop their work too.

### Local mode

Without `onChangeRequest`, the command is applied through the same local reducer
used by accepted uncontrolled host responses. The request still gets an ID and
pending state so diagnostics and focus behavior match host mode. It settles
`"accepted"` or `"rejected"`; it never enters `applying` (AR-18).

Before any uncontrolled local apply (including an accepted host response), the
pipeline re-checks the command’s affected item versions against the latest
items. If an item changed or disappeared while the request was in flight, the
result is `STALE_REVISION` and no local mutation occurs. This is the guard that
makes the requesting-phase item rule safe.

### Multiple requests

One active command per item; unrelated items may run concurrently. Each has its
own record, controller, deadline and pending preview. A failure for one item
does not clear another item's pending state.

## Error Handling

| Error Case | Handling Strategy | AR Ref |
| ---------- | ----------------- | ------ |
| Local check fails | Typed diagnostic, no request ID, no host call | AR-6 |
| Second command for a pending item | `INVALID_COMMAND`, no host call | AR-9 |
| Confirmation denied | No request, no feedback, `confirmation-denied` | AR-29 |
| Confirmation handler unavailable | `CONFIRMATION_UNAVAILABLE` feedback | AR-29 |
| Host validation throws | `VALIDATION_ERROR`, rollback, retryable | AR-6, AR-8 |
| Host request throws | `HOST_REJECTED` with a generic message | AR-8 |
| Host request times out | `COMMAND_TIMEOUT`, abort, rollback | AR-7 |
| Host response malformed | `HOST_REJECTED`, no mutation | AR-8 |
| Host ignores abort | Late result ignored by status check | AR-9 |
| Affected item changes while validating | Obsolete, abort, clear pending, no feedback | AR-10 |
| Affected item changes while requesting (uncontrolled) | Response settles, then `STALE_REVISION`; no local apply | AR-10 |
| Unrelated item changes | Request continues | AR-10 |
| Context key changes (visibility/year/filter/mode) | Obsolete, abort, clear pending, no feedback | AR-10 |
| Component unmounts | Obsolete, abort, ignore, no state update | AR-9 |
| Duplicate request ID from a host factory | Deterministic `#n` suffix keeps active IDs unique; the factory is still documented to return unique IDs | AR-9 |

## Testing Requirements

- Unit tests for ID generation, context construction and the request record.
- Component tests for validation ordering, timeout, abort, late responses,
  prop/window invalidation, unmount and concurrent unrelated commands.
- Tests assert that every ignored path produces no callback, no feedback and no
  item mutation.
- Existing host-callback assertions that check exact arity are updated to expect
  the optional third `AbortSignal` argument; a new assertion checks the signal
  instance.
- No React import in the pure local/apply helpers.
