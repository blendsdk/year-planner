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
handles acceptance, rejection, timeouts, stale responses, aborts and rollback.
The component never treats a pointer drop as persisted truth.

Controlled `items` remain authoritative. Uncontrolled mode applies changes
through the same reducer and emits `onItemsChange` for local undo. In both modes
the command pipeline, diagnostics and focus behavior are identical.

---

## Functional Requirements

### Must Have

- [ ] Commands: `create`, `update`, `move`, `resize`, `delete`, `paint`
  (`union`/`subtract`). Batch/bulk commands are deferred.
- [ ] Every command is dispatched with `context: { requestId, baseRevision? }`;
  request IDs are unique and used for obsolete-response rejection. `baseRevision`
  is optional host-wide pass-through and is not used for item stale detection.
  `STALE_REVISION` is a host rejection of an `expectedVersion`; an obsolete
  request-ID response is ignored, not rolled back.
- [ ] `PlannerItem.version` is a required positive integer. `update`, `move`,
  `resize` and `delete` require `expectedVersion: number`; a mismatch is
  `STALE_REVISION`. On acceptance, the controlled host returns the updated item
  with `version + 1`; the uncontrolled reducer increments by 1. Undo restores
  the prior version; redo re-applies the incremented version. New paint
  residuals start at `version: 1`.
- [ ] `update.patch` is `Partial<Omit<PlannerItem, 'id' | 'version'>>`; identity
  and version cannot be changed by an update.
- [ ] `validateChange(command, context)` may return a `ValidationResult`
  synchronously or asynchronously; the component runs local checks first.
- [ ] `onChangeRequest(command, context)` returns a `CommandOutcome`:
  `{ accepted: true, revision, updatedItems? }` or
  `{ accepted: false, diagnostics, latestRevision? }`.
- [ ] Diagnostics have stable codes, severity (`error`, `warning`, `info`),
  message, item/resource IDs and offending periods. Errors block; warnings and
  info are displayed but do not block in R1.
- [ ] Pending state is explicit; a drop shows a pending preview, not a success.
  At most one active command per item; unrelated items may proceed.
- [ ] Rejection, timeout, abort or stale response rolls back the preview and
  restores the source item, selection and focus.
- [ ] A response whose request ID is no longer current is ignored.
- [ ] An `expectedVersion` mismatch is rejected with `STALE_REVISION`; the
  component does not overwrite concurrent changes. `CommandOutcome.revision` is
  a required host-wide token and `CommandContext.baseRevision` is optional; neither
  is used for item stale detection in R1.
- [ ] Accepted controlled changes require the host to update `items`. If the host
  accepts but never updates props, the component shows `ACCEPTED_NOT_APPLIED`
  after the timeout, clears the pending overlay and reverts to props. It does not
  display a phantom success.
- [ ] Uncontrolled mode applies the command through the same local reducer,
  emits `onItemsChange`, and records local undo for
  update/paint/erase/create/move/resize/delete.
- [ ] Paint/erase commands include `defaults: PaintDefaults` and
  `expectedVersions` for every affected source item; any mismatch rejects with
  `STALE_REVISION`. Accepted paint outcomes **must** include the complete
  post-operation `updatedItems` set (new merged/residual items) and
  `removedItemIds` for every removed source. Uncontrolled mode applies the same
  pure helper and emits the same replacement set.
- [ ] Create commands include a complete item with a stable ID, `version: 1`,
  `kind`, `layerId` and proposed period; missing defaults produce a diagnostic.
- [ ] Delete requires `confirmChange` or the default confirmation; a rejected
  confirmation is a no-op, not a rollback error.
- [ ] `onChangeCommitted` and `onChangeRejected` callbacks fire with the
  authoritative outcome.
- [ ] The inspector exposes retry (where safe) and dismiss actions.
- [ ] Thrown/rejected promises map to `HOST_REJECTED` or `VALIDATION_ERROR`;
  aborts map to `COMMAND_ABORTED`; unmount cancels in-flight commands.
- [ ] Invalid entities in `items` produce per-entity diagnostics and do not blank
  the planner (RD-04).
- [ ] Changes to `items`, `visibility`, `year/range` or `interaction` during a
  pending command cancel the stale preview or ignore the stale response.

### Should Have

- [ ] A configurable command timeout (default 15 seconds).
- [ ] An `AbortSignal` for in-flight validation where the host supports it.
- [ ] A pending visual state distinguishable from accepted and rejected.
- [ ] A `requestId` factory override for deterministic tests.

### Won't Have (Out of Scope)

- A local persistence layer, backend or database.
- Server-side authorization, tenancy or audit logging.
- A built-in capacity/availability solver.
- Optimistic multi-version merge; hosts own conflict resolution.
- Controlled-host undo history — host-owned.
- Batch/bulk commands or partial bulk results.

---

## Technical Requirements

### Command union

The canonical `PlannerCommand`, `CommandContext`, `CommandOutcome`, `Diagnostic`
and `ValidationResult` types are defined in **RD-04, Shared public contracts**.
This RD owns their lifecycle, validation and rollback behavior, not a second
type definition. `paint` requires `expectedVersions` for every affected source
item; accepted paint outcomes require `updatedItems`.

### Command lifecycle

1. `begin` from canonical snapshot and item versions.
2. `preview` ephemeral change and provisional geometry.
3. `validate` local + optional host.
4. `requestCommit` with request ID.
5. `settle` accepted/rejected/stale/timeout/aborted.
6. `recordUndo` in uncontrolled mode; controlled hosts compensate.

### Diagnostic codes

| Code | Meaning |
|---|---|
| `CAPACITY_EXCEEDED` | Mock host capacity policy rejected the period |
| `INVALID_RANGE` | Period is zero or reverse (`end <= start`) |
| `INVALID_DATE` / `UNSUPPORTED_YEAR` | Invalid date key or year outside 1600–9999 (RD-02) |
| `MISSING_RANGE` | Neither `year` nor `range` was supplied to the view |
| `STALE_REVISION` | Expected version no longer current |
| `UNKNOWN_ENTITY` | Item/resource/layer does not exist |
| `READ_ONLY` | Item or host forbids the change |
| `INVALID_PAINT_TARGET` | Paint layer is missing, not a highlight layer, or differs from `activeLayerId` |
| `TIMED_EDITING_UNSUPPORTED` | Timed item move/resize in the classic view |
| `COMMAND_TIMEOUT` | No outcome before the timeout |
| `COMMAND_ABORTED` | Request was aborted |
| `CONFIRMATION_UNAVAILABLE` | No `confirmChange` and no browser confirmation available |
| `ACCEPTED_NOT_APPLIED` | Host accepted but did not update props before timeout |
| `HOST_REJECTED` | Host rejected without a more specific code |
| `VALIDATION_ERROR` | Host-supplied diagnostic details |

### State model

```text
idle → pending → validating → committing → accepted | rejected | stale | timeout | aborted
accepted → applied (props updated) | accepted-not-applied (timeout)
```

Only one active command per item.

### Failure paths

- `validateChange`/`onChangeRequest` throw → `HOST_REJECTED` with a generic
  message; the original error is not shown to end users.
- Host returns malformed outcome → `HOST_REJECTED`; no partial mutation.
- AbortSignal aborts → `COMMAND_ABORTED`; rollback.
- Unmount → abort and ignore late results.
- Props/window change mid-command → cancel or ignore stale response; never
  commit geometry from a stale layout.
- Host accepts but props do not update → `ACCEPTED_NOT_APPLIED`, revert to props.

### Complexity

Command pipeline: **L**. Rollback/focus restoration: **M**. Mock host: **S**.

---

## Integration Points

- RD-04 supplies canonical items, versions, read-only flags and paint algebra.
- RD-07 produces proposed periods and selection for commands.
- RD-06 supplies the inspector and pending/error UI.
- RD-09 announces pending/rejected/accepted states.
- RD-10 tests races, stale responses, timeouts, aborts and rollback.
- RD-11 documents the integration contract and mock example.

---

## Scope Decisions

| Decision | Options Considered | Chosen | Rationale | AR Ref |
|---|---|---|---|---|
| Source of truth | Component, host | Host controlled; uncontrolled local mirror | Backend authority; no phantom success | AR #4, #55 |
| Version model | Per-item version, global revision, both | Per-item version; optional baseRevision | Simple, testable | AR #41 |
| Update patch | Full item, allowlist | `Omit<id|version>` | Protect identity | AR #42 |
| Warnings | Block, non-blocking | Non-blocking in R1 | Avoid acknowledgement machinery | AR #42 |
| Bulk | Atomic, partial | Deferred | Scope and complexity | AR #38 |
| Paint outcome | Visual only, updatedItems | `updatedItems` | Residual split items | AR #37 |
| Undo | Controlled, local | Local uncontrolled only | Controlled history is host-owned | AR #8, #55 |
| Timeout | None, fixed, configurable | 15s configurable | Predictable pending termination | AR #58 |
| Accepted-but-not-applied | Phantom success, revert | Warn and revert to props | Honest controlled contract | AR #41, #58 |

---

## Security Considerations

- **Data sensitivity**: Commands contain item titles, periods and assignments;
  the component does not log or persist them. Hidden item diagnostics are
  redacted.
- **Input validation**: Commands are validated locally before host dispatch; the
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
   updates props; if the host never updates, `ACCEPTED_NOT_APPLIED` is shown
   after the timeout and the UI reverts to props.
6. [ ] The mock capacity validator rejects a third concurrent unit booking on a
   capacity-2 dock with `CAPACITY_EXCEEDED`, even if the booking layer is hidden.
7. [ ] An update/paint/erase/move/resize/create/delete in uncontrolled mode is
   undoable locally and emits `onItemsChange`; a controlled command does not
   create a local history entry.
8. [ ] Paint erase returns the two residual highlight items in `updatedItems`
   and the source ID in `removedItemIds`; the controlled parent applies them and
   the fragments update. A concurrent edit to a source item causes
   `STALE_REVISION` and no paint commit.
9. [ ] Painting a range that intersects no visible highlight creates one
    highlight from `defaults`; a zero-length paint returns `INVALID_RANGE`.
    Erasing a range that fully covers a source removes it and returns no
    residual. Mixed-attribute items are not merged.
10. [ ] A create command contains a complete item with a stable ID and version 1;
    delete without confirmation is a no-op.
11. [ ] A warning diagnostic is displayed but does not block the commit; an error
    diagnostic blocks and rolls back.
12. [ ] A thrown/rejected host promise maps to `HOST_REJECTED`; an abort maps to
    `COMMAND_ABORTED`; unmount cancels in-flight commands.
13. [ ] Changing `items`, `visibility` or `year/range` during a pending command
    ignores the stale response and never commits stale geometry.
14. [ ] The pending visual state is distinguishable from accepted/rejected, and a
    screen-reader announcement is made for each terminal outcome.
15. [ ] An `update` command changes only allowed fields; an attempt to patch
    `id` or `version` is rejected at the type level and by runtime validation.
16. [ ] In uncontrolled mode, two consecutive updates on one item require
    versions `v` then `v+1`; undo restores `v` and redo restores `v+1`; a stale
    `v` is rejected. In controlled mode, the mock host owns the equivalent
    test.
17. [ ] Security requirements verified: no authorization inferred from UI state,
    no command bypasses host validation, hidden diagnostics redacted, no raw HTML.
