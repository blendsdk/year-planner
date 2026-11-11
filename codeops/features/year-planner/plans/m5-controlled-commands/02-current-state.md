# Current State: RD-08 Controlled Commands

> **Document**: 02-current-state.md
> **Parent**: [Index](00-index.md)

## Existing Implementation

### What Exists

RD-06 shipped a command pipeline used by the inspector, the imperative handle,
keyboard delete and every RD-07 gesture:

- `useCommandPipeline` owns pending item IDs, feedback, undo/redo and the host
  request path (`packages/react/src/commands.ts:202-609`).
- Local checks cover read-only, create completeness, duplicate IDs, paint target
  and paint versions, annotation ownership, update identity protection, layer
  policies, `expectedVersion`, timed editing and range validity
  (`packages/react/src/commands.ts:261-411`).
- The request path generates a request ID, adds item IDs to a pending set, calls
  optional `validateChange`, confirms deletes, calls `onChangeRequest` with a
  15-second timeout, then applies uncontrolled changes or reports feedback
  (`packages/react/src/commands.ts:413-559`).
- Late responses are ignored after unmount or after the request leaves the
  `inFlight` set (`packages/react/src/commands.ts:513-516`).
- Uncontrolled undo/redo stores whole item snapshots and emits `onItemsChange`
  through `applyLocalItems` (`packages/react/src/commands.ts:563-591`,
  `packages/react/src/state.ts:203-216`).
- Controlled props are authoritative; `applyLocalItems` refuses to mutate them
  (`packages/react/src/state.ts:205-216`).
- Paint/erase use the pure core helper, which returns `updatedItems`,
  `removedItemIds` and diagnostics (`packages/core/src/model/paint.ts:212-255`).
- Items are rendered with `data-yp-pending` and `aria-busy` while a command is
  pending (`packages/react/src/render/ItemLayer.tsx:180,189`).
- The inspector renders the first feedback message with retry and dismiss
  (`packages/react/src/render/Inspector.tsx:614-638`).
- Gesture commands are emitted from `commitGesture`; rejection currently focuses
  the fallback date (`packages/react/src/interaction/commit.ts:92-163`).
- Gesture previews exist only while the gesture is active
  (`packages/react/src/interaction/useInteraction.ts:606-621`); the preview
  disappears when the pointer is released (`useInteraction.ts:341`).

### Relevant Files

| File | Purpose | Changes Needed |
| ---- | ------- | -------------- |
| `packages/react/src/commands.ts` | Command hook, local checks, host request | Split into `commands/` modules; keep as stable entry |
| `packages/react/src/state.ts` | Controlled/uncontrolled items and selection | No structural change; expose latest items to the pipeline waiter |
| `packages/react/src/types.ts` | Public props and callbacks | Add `baseRevision`; optional abort-signal argument |
| `packages/react/src/YearPlanner.tsx` | Component wiring | Pass base revision, revision key and command status |
| `packages/react/src/interaction/commit.ts` | Gesture-to-command boundary | Return preview/request handle; result-driven focus |
| `packages/react/src/interaction/useInteraction.ts` | Gesture controller | Hold pending previews until settlement |
| `packages/react/src/interaction/preview.ts` | Preview projection | Reuse; no shape change |
| `packages/react/src/render/YearGrid.tsx` | Grid shell | Render active plus pending previews |
| `packages/react/src/render/MonthRow.tsx` | Row geometry | Render a list of previews |
| `packages/react/src/render/Inspector.tsx` | Inspector feedback | Notices, accepted-not-applied message, safe retry |
| `packages/react/src/styles.css` | Pending style | Add dashed pending outline |
| `packages/core/src/diagnostics.ts` | Diagnostic union | Add `CAPACITY_EXCEEDED`, `COMMAND_ABORTED`, `ACCEPTED_NOT_APPLIED` and the runtime guard |
| `packages/core/src/contracts.ts` | Canonical command types | No shape change; verify context pass-through |
| `packages/core/src/model/paint.ts` | Paint/erase result | No change; pipeline consumes the existing payload |
| `apps/demo/src/App.tsx` | Demo routes | Add `?commands=1` |
| `apps/demo/src/CommandsDemo.tsx` | Controlled host fixture | New |
| `apps/storybook/stories/CommandLifecycle.stories.tsx` | New-state stories | New |
| `tests/e2e/commands.spec.ts` | Browser lifecycle evidence | New |
| `docs/commands.md` | Host contract guide | New |

### Code Analysis

The current run loop is request/response with a best-effort late check:

```ts
const requestId = requestIdFactory();
const context: CommandContext = { requestId };
for (const id of ids) pendingRef.current.add(id);
inFlight.current.add(requestId);
// ...
const outcome = await Promise.race([
  Promise.resolve(input.onChangeRequest(command, context)),
  timeout,
]);
if (!mounted.current || !inFlight.current.has(requestId)) {
  finishPending();
  return false;
}
```

That is a boolean result. The interaction layer cannot distinguish “the host
rejected this” from “this response was ignored”, and the preview has already
disappeared because the gesture became idle before the request starts.

The host validation branch only looks at `permitted`:

```ts
const validation = await input.validateChange(command, context);
if (!validation.permitted) {
  // reject with the first diagnostic
}
```

Diagnostics with `level: "warning"` or `"info"` are accepted when `permitted`
is true but are never displayed on the success path. An error-level diagnostic
with `permitted: true` is incorrectly allowed.

Controlled acceptance is assumed, not proven:

```ts
if (!state.itemsControlled) {
  // apply local result
}
finishPending();
input.onChangeCommitted?.(outcome);
return true;
```

A host that returns `{ accepted: true }` without updating `items` looks like a
success until the next render, which is exactly the phantom success RD-08
forbids.

## Gaps Identified

### Gap 1: No explicit request lifetime

**Current Behavior:** IDs are generated and held in a `Set`, but there is no
active/settled/obsolete distinction. Prop changes do not cancel anything.
**Required Behavior:** A response settles only the current request; obsolete
responses are ignored without callbacks, feedback or mutation.
**Fix Required:** Add a request record with a status and a settlement path
(AR-9, AR-10).

### Gap 2: No base revision

**Current Behavior:** `CommandContext` only carries `requestId`.
**Required Behavior:** Optional `baseRevision` pass-through.
**Fix Required:** Add the public prop and include it in the context (AR-3).

### Gap 3: Validation severity and timeout

**Current Behavior:** Only `permitted` matters; validation is outside the
timeout and receives no signal.
**Required Behavior:** Error diagnostics block, warnings do not; validation and
request share a deadline; optional abort signal.
**Fix Required:** Normalize validation, start the deadline before host
validation and pass the controller (AR-4, AR-6, AR-7).

### Gap 4: Unvalidated host outcomes

**Current Behavior:** A malformed object can flow into `applyHostOutcome`;
accepted paint without `updatedItems` silently applies nothing in controlled
mode.
**Required Behavior:** Malformed outcomes map to `HOST_REJECTED`; paint requires
the complete payload.
**Fix Required:** Runtime type guards and normalization (AR-8, AR-30).

### Gap 5: No accepted-not-applied state

**Current Behavior:** Controlled acceptance is declared immediately.
**Required Behavior:** Wait for props to reflect the accepted outcome; after the
timeout show `ACCEPTED_NOT_APPLIED` and revert.
**Fix Required:** Add an application waiter keyed by request (AR-11, AR-19).

### Gap 6: Pending preview is lost

**Current Behavior:** The preview exists only during the gesture; the dropped
item immediately snaps back to canonical geometry while the request is pending.
**Required Behavior:** Show a pending preview until settlement.
**Fix Required:** Let the interaction layer retain previews and render them
until the request promise settles (AR-15).

### Gap 7: Focus rollback is incomplete

**Current Behavior:** Rejected move/resize/paint focus the fallback date.
**Required Behavior:** Return focus to the source item when it still exists,
otherwise the fallback date; never clobber a newer selection.
**Fix Required:** Result-driven focus in `commitGesture`/`useInteraction`
(AR-14).

### Gap 8: No prop/window invalidation

**Current Behavior:** A response can commit geometry after visibility, the year
window or interaction mode changed; item changes are not checked per request.
**Required Behavior:** Context changes mark validating/requesting commands
obsolete; affected-item changes mark only validating requests obsolete, and an
uncontrolled apply re-checks versions.
**Fix Required:** Compare a context key and per-request affected IDs in the
pipeline (AR-10).

### Gap 9: Feedback and retry are too coarse

**Current Behavior:** One message, retry for every failure including delete.
**Required Behavior:** Level-aware feedback, warning notices, retry only where
safe.
**Fix Required:** Extend feedback and add a bounded notices list (AR-13, AR-17).

### Gap 10: Module size and missing evidence

**Current Behavior:** `commands.ts` is 609 lines; the demo only covers
uncontrolled interaction; no lifecycle browser suite.
**Required Behavior:** Split before the lifecycle additions; add controlled
demo and E2E evidence.
**Fix Required:** `commands/` modules, `?commands=1` fixture, Playwright suite
(AR-2, AR-22).

## Dependencies

### Internal Dependencies

- RD-04 canonical `PlannerItem`, `CommandContext`, `CommandOutcome`,
  `Diagnostic`, `ValidationResult`, paint algebra and version validation.
- RD-05 ribbon signature for prop-change invalidation.
- RD-06 controlled/uncontrolled state, inspector and rendering.
- RD-07 gesture completion, pending item IDs and focus lifecycle.

### External Dependencies

None. The plan uses React 19, the existing Vitest/RTL/Playwright stack and the
existing Storybook app.

## Risks and Concerns

| Risk | Likelihood | Impact | Mitigation |
| ---- | ---------- | ------ | ---------- |
| Application waiter misses a synchronous host update | Medium | High | Check the current items immediately when registering the waiter |
| Multiple pending requests confuse preview ownership | Medium | Medium | Key previews per request; render active plus pending lists |
| Timeout races a response that settles at the same tick | Medium | Medium | One settlement guard per request; ignore the second result |
| Warning diagnostics become noisy | Low | Medium | Cap notices, clear on dismiss and on a new command |
| Splitting `commands.ts` changes behavior | Low | High | Mechanical extraction; existing tests stay green at every step |
| Controlled fixture drifts from the library contract | Low | Medium | Reuse public types; E2E asserts visible outcomes, not internals |
| Additional live region clashes with the focus announcer | Low | Medium | Separate `command-status` region with plain text |
