# State and Commands: M3 React View

> **Document**: 03-04-state-commands.md
> **Parent**: [Index](00-index.md)

## Overview

Owns controlled/uncontrolled state, the selection model, and the minimal
command request pipeline used by the inspector and public handle. RD-07 adds
pointer gestures; RD-08 extends the pipeline with rollback and stale-response
cancellation.

## State model

| Prop pair | Controlled | Local seed | Change callback |
|---|---|---|---|
| `items` / `defaultItems` | `items` | `defaultItems ?? []` | `onItemsChange` after a local apply |
| `visibility` / `defaultVisibility` | `visibility` | mapped preset + model defaults | `onVisibilityChange` |
| `selection` / `defaultSelection` | `selection` | `emptySelection()` | `onSelectionChange` |
| `filter` / `defaultFilter` | `filter` | `{}` | `onFilterChange` |

Rules:

- Controlled wins. Supplying both logs one development warning through
  `console.warn` and ignores the default; production builds do not warn.
- Uncontrolled state is seeded once and then owned locally.
- `items` are validated on identity change with `validatePlannerData`; the
  normalized model is memoized. Invalid entities are dropped and diagnostics
  forwarded through `onDiagnostic`.
- `groups`, `layers`, `resources` and `annotations` participate in the same
  validation pass; changing any of them re-validates.
- `defaultVisibility` is a `VisibilityState`; map it to
  `VisibilityPresetOptions` field by field:

```ts
createInitialVisibility(model, {
  hideGroupIds: defaultVisibility?.hiddenGroupIds,
  hideLayerIds: defaultVisibility?.hiddenLayerIds,
  hideItemIds: defaultVisibility?.hiddenItemIds,
  hideChannels: defaultVisibility?.hiddenChannels,
});
```

- `showAll` clears hidden groups/layers/items and keeps channel flags.
- `setFilter` replaces the filter and calls `onFilterChange` in both modes.
- `displayTimeZone` defaults to `UTC`; `display` and `interaction` objects are
  read per render.

## Selection

```ts
export function emptySelection(): PlannerSelection {
  return { dates: [], items: [] };
}
export function selectionItemIds(selection: PlannerSelection | undefined): string[];
```

- RD-06 renders `selection.items` and `selection.dates`.
- Proxy click replaces item selection with one ID and clears dates; this is the
  only pointer selection behavior in RD-06. The full modifier matrix is RD-07.
- Disabled dates from `getDateMeta` are never selected by handle or click;
  `selectRange` intersecting a disabled date is a no-op with no diagnostic.
- `selectRange(interval)` replaces dates and clears items.
- `clearSelection()` returns `emptySelection()`.
- Selection changes are not undoable.

## Command pipeline

### Local checks (always first)

| Command | Checks |
|---|---|
| `create` | `canCreateItem(layerId, { ...ctx, activeLayerId: layerId })`; complete item/version/period |
| `update` | `getItemEditability(itemId, "move", ctx)`; expected version; patch has no `id`/`version` |
| `move` | `getItemEditability(itemId, "move", ctx)`; expected version; all-day period |
| `resize` | `getItemEditability(itemId, "resize", ctx)`; expected version; all-day period, at least one day |
| `delete` | `canDeleteItem(itemId, ctx)`; expected version; confirmation |
| `paint` | active layer must exist and have channel `highlight`; expected version; all-day period; local paint/erase guard |

A failed check produces one diagnostic and no mutation. Core paint codes map
to public codes at this boundary:

| Core code | Public code |
|---|---|
| `NOT_EDITABLE` | `READ_ONLY` |
| `STALE_VERSION` | `STALE_REVISION` |
| `INVALID_PAINT_CHANNEL` | `INVALID_PAINT_TARGET` |
| `INVALID_PAINT_TARGET` | `INVALID_PAINT_TARGET` |
| `UNKNOWN_REFERENCE` (paint path) | `INVALID_PAINT_TARGET` |
| `UNKNOWN_REFERENCE` (other commands) | `INVALID_COMMAND` |
| `INVALID_RANGE` | `INVALID_COMMAND` |

| Failure | Code |
|---|---|
| Global/read-only/hidden/locked/policy/mode | `READ_ONLY` |
| Version mismatch | `STALE_REVISION` |
| Invalid command shape/period | `INVALID_COMMAND` |
| Paint layer missing, mismatched or not a highlight layer | `INVALID_PAINT_TARGET` |
| Timed edit | `TIMED_EDITING_UNSUPPORTED` |
| Confirmation unavailable | `CONFIRMATION_UNAVAILABLE` |
| Host validation denied | `VALIDATION_ERROR` |
| Host promise rejected | `HOST_REJECTED` |
| Timeout | `COMMAND_TIMEOUT` |
| Undo/redo in controlled mode | `UNDO_UNAVAILABLE` |

### Host flow

```text
requestCommand(command)
  → local checks
  → validateChange(command, { requestId })
  → confirmChange for delete
  → onChangeRequest(command, { requestId })
      → accepted:  apply in uncontrolled mode; onChangeCommitted
      → rejected:  onChangeRejected; keep state
      → timeout:   COMMAND_TIMEOUT; onChangeRejected; retry available
```

- `requestId` defaults to `crypto.randomUUID()` when available, otherwise a
  monotonic `yp-<n>` fallback; `interaction.requestId` overrides it.
- `interaction.createId` defaults to the same UUID/monotonic factory, so paint
  and create always have an ID source. A host factory returning a duplicate ID
  produces `INVALID_COMMAND` and no mutation.
- `commandTimeoutMs` defaults to 15000. The timer is cleared when the promise
  settles; unmount clears pending timers.
- Controlled mode never mutates `items`. A local apply is allowed only when
  `items` is absent; `onItemsChange` still fires for uncontrolled state.
- Host `CommandOutcome.updatedItems`/`removedItemIds` are applied to
  uncontrolled state with the same remove-then-insert rule; a `create` without
  `updatedItems` uses the command item.
- Rejected commands leave items, versions and selection untouched.
- `onChangeCommitted`/`onChangeRejected` receive the authoritative outcome.
- Validated diagnostics are forwarded to `onDiagnostic`.
- Command diagnostics carry IDs only; never titles or periods.

### Local apply

| Command | Local result |
|---|---|
| `create` | append the item once |
| `update` | replace item, merge patch, `version + 1` |
| `move`/`resize` | replace item period, `version + 1` |
| `delete` | remove item |
| `paint` | remove every affected source ID, then insert `updatedItems` |

Paint local apply is explicit because core paint returns matching removals plus
**new and non-matching affected items** in `updatedItems`:

```ts
const affected = new Set([
  ...result.removedItemIds,
  ...result.updatedItems.map((item) => item.id),
]);
// remove affected source IDs, then insert result.updatedItems
```

The same rule applies to host `CommandOutcome`: remove every ID in
`removedItemIds` plus every ID already present in `updatedItems`, then append
`updatedItems` exactly once.

A mixed-attribute paint case proves non-matching items are not duplicated.

Uncontrolled applies snapshot the prior item array for undo (bounded to 50).
`requestUndo`/`requestRedo` switch between snapshots and call `onItemsChange`.
Controlled undo/redo emits `UNDO_UNAVAILABLE`.

### Pending and retry

- At most one command per item is active; a repeat request for the same item is
  rejected with `INVALID_COMMAND` while pending.
- Pending item IDs render `data-yp-pending="true"` and `aria-busy="true"`.
- The inspector stores the last failed command and message. `retry()` re-runs
  the same command only for timeout/host-rejected/validation errors; `dismiss()`
  clears the feedback.
- Unmount cancels timers and ignores late settlements.

## Testing Requirements

- Controlled vs uncontrolled for items, visibility, selection and filter.
- Development warning only when both controlled and default are supplied.
- `defaultVisibility` field mapping plus `defaultVisible: false`.
- Visibility reducer actions through the handle; showAll preserves channels.
- Selection handle methods; disabled dates rejected.
- Command happy paths and every rejection code; mapping table.
- Version increments and immutability of controlled props.
- Host accepted/rejected/timeout; retry/dismiss.
- Undo/redo in uncontrolled; controlled rejection.
- Paint mixed-attribute no-duplication.
- No mutation of input arrays.
