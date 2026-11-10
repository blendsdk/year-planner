# RD-08: Controlled Commands, Validation and Rollback

> **Document**: RD-08-controlled-commands.md
> **Status**: Draft
> **Created**: 2026-11-10
> **Project**: Year Planner for React
> **Depends On**: RD-04, RD-05, RD-06, RD-07
> **CodeOps Artifact Schema**: 1

---

## Feature Overview

Defines how the component proposes edits to the host application and how it
handles acceptance, rejection, timeouts, stale responses and rollback. The
component never treats a pointer drop as persisted truth.

Controlled `items` remain authoritative. Uncontrolled mode may apply local
changes through the same reducer for demos and tests. In both modes the command
pipeline, diagnostics and focus behavior are identical.

---

## Functional Requirements

### Must Have

- [ ] Commands: `create`, `update`, `move`, `resize`, `delete`, `paint`
  (`union`/`subtract`) and `bulk` (optional atomic).
- [ ] Every command envelope carries `context: { requestId, baseRevision?,
  scenarioId? }`; request IDs are unique and used for stale-response rejection.
- [ ] `validateChange(command, context)` may return a `ValidationResult`
  synchronously or asynchronously; the component runs local checks first.
- [ ] `onChangeRequest(command, context)` returns a `CommandOutcome`:
  `{ accepted: true, revision, updatedItems? }` or
  `{ accepted: false, diagnostics, latestRevision? }`.
- [ ] Diagnostics contain stable codes, severity, message, item/resource IDs and
  offending periods; the UI announces errors and shows a visible message.
- [ ] Pending state is explicit; a drop shows a pending preview, not a success.
- [ ] Rejection, timeout or stale response rolls back the preview and restores
  the source item, selection and focus.
- [ ] A response whose request ID is no longer current is ignored.
- [ ] A revision mismatch is rejected with `STALE_REVISION`; the component does
  not overwrite concurrent changes.
- [ ] Accepted controlled changes require the host to update `items`; if the
  host never updates, the component must not display a phantom success. A
  pending/accepted marker clears on props update or timeout.
- [ ] Uncontrolled mode applies the command through the same local reducer and
  records local undo for paint/erase/create/move/resize.
- [ ] Bulk commands are atomic at the host boundary; partial success requires an
  explicit host policy and is not silently reported as complete.
- [ ] The mock host example demonstrates an over-capacity rejection, a clear
  diagnostic and full rollback; no built-in capacity engine is required.
- [ ] `onChangeCommitted` and `onChangeRejected` callbacks fire with the
  authoritative outcome.
- [ ] The inspector exposes a retry action where safe and a dismiss action.

### Should Have

- [ ] A configurable command timeout (default 15 seconds).
- [ ] An `AbortSignal` for in-flight validation where the host supports it.
- [ ] A `pending` visual state distinguishable from accepted and rejected.

### Won't Have (Out of Scope)

- A local persistence layer, backend or database.
- Server-side authorization, tenancy or audit logging.
- A built-in capacity/availability solver.
- Optimistic multi-version merge; hosts own conflict resolution.
- Controlled-host undo history — host-owned.

---

## Technical Requirements

### Command union

```ts
type PlannerCommand =
  | { type: 'create'; item: PlannerItem }
  | { type: 'update'; itemId: string; patch: Partial<PlannerItem>; expectedVersion: number }
  | { type: 'move'; itemId: string; proposedPeriod: PlannerPeriod; expectedVersion: number }
  | { type: 'resize'; itemId: string; proposedPeriod: PlannerPeriod; expectedVersion: number }
  | { type: 'delete'; itemId: string; expectedVersion: number }
  | { type: 'paint'; layerId: string; period: PlannerPeriod; operation: 'union' | 'subtract' }
  | { type: 'bulk'; commands: PlannerCommand[]; atomic?: boolean };
```

### Command lifecycle

1. `begin` from canonical snapshot and base revision.
2. `preview` ephemeral change and provisional geometry.
3. `validate` local + optional host.
4. `requestCommit` with request ID.
5. `settle` accepted/rejected/stale/timeout.
6. `recordUndo` in uncontrolled mode; controlled hosts compensate.

### Diagnostic codes

| Code | Meaning |
|---|---|
| `CAPACITY_EXCEEDED` | Mock host capacity policy rejected the period |
| `INVALID_RANGE` | Period is zero/reverse or outside supported dates |
| `STALE_REVISION` | Expected version no longer current |
| `UNKNOWN_ENTITY` | Item/resource/layer does not exist |
| `READ_ONLY` | Item or host forbids the change |
| `COMMAND_TIMEOUT` | No outcome before the timeout |
| `HOST_REJECTED` | Host rejected without a more specific code |
| `VALIDATION_ERROR` | Host-supplied diagnostic details |

### State model

```text
idle → pending → validating → committing → accepted | rejected | stale | timeout
```

Only one active command per item; unrelated commands may proceed independently.

### Complexity

Command pipeline: **L**. Rollback/focus restoration: **M**. Mock host: **S**.

---

## Integration Points

- RD-07 produces proposed periods and selection for commands.
- RD-04 supplies canonical items and revisions.
- RD-09 announces pending/rejected/accepted states.
- RD-10 tests races, stale responses, timeouts and rollback.
- RD-11 documents the integration contract and mock example.

---

## Scope Decisions

| Decision | Options Considered | Chosen | Rationale | AR Ref |
|---|---|---|---|---|
| Source of truth | Component, host | Host controlled | Backend authority; no phantom success | AR #4 |
| Undo | Component/host | Local uncontrolled only | Controlled history is host-owned | AR #8 |
| Capacity | Built-in, host | Host/mock only | Generic component must not encode policy | AR #6 |
| Timeout | None, fixed, configurable | 15s configurable | Predictable pending termination | AR #4 |
| Bulk | Atomic, partial | Atomic by default | Avoid inconsistent schedules | AR #4 |

---

## Security Considerations

- **Data sensitivity**: Commands contain item titles, periods and assignments;
  the component does not log or persist them.
- **Input validation**: Commands are validated locally before host dispatch;
  host must validate again.
- **Authentication & authorization**: Host-owned. A read-only flag is not proof
  of write authorization; the host remains authoritative.
- **Injection risks**: N/A — typed commands, no raw HTML.
- **Encryption needs**: Host-owned transport; the component does not transmit.
- **Rate limiting**: Host-owned for backend endpoints.
- **Infrastructure**: N/A.

---

## Acceptance Criteria

1. [ ] A move command includes the original version; a host with a newer version
   rejects it with `STALE_REVISION` and the UI rolls back.
2. [ ] A host rejection displays the diagnostic message, restores the source
   item/selection/focus and does not mutate controlled `items`.
3. [ ] A delayed response for an older request ID is ignored; the current
   preview/state is unaffected.
4. [ ] A command that exceeds the timeout rolls back with `COMMAND_TIMEOUT` and
   announces the failure.
5. [ ] An accepted command with `updatedItems` is reflected after the host
   updates props; no success is shown if the host never updates and the timeout
   expires.
6. [ ] The mock capacity validator rejects a third concurrent unit booking on a
   capacity-2 dock with `CAPACITY_EXCEEDED`, even if the booking layer is hidden.
7. [ ] A paint/erase/move/resize in uncontrolled mode is undoable locally; a
   controlled command does not create a local history entry.
8. [ ] A bulk command with one invalid child is rejected atomically unless the
   host explicitly opts into partial results.
9. [ ] The pending visual state is distinguishable from accepted/rejected, and a
   screen-reader announcement is made for each terminal outcome.
10. [ ] Security requirements verified: no authorization inferred from UI state,
    no command bypasses host validation, no raw HTML in diagnostics.
