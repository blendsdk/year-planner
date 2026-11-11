# Controlled Commands

The planner never treats a pointer drop as persisted truth. Every edit is a
typed command that the host can validate, accept, reject, time out or apply
later. This guide describes the host contract added in RD-08.

## Two modes, one pipeline

- **Controlled** (`items` supplied): `items` is authoritative. The component
  shows a pending proposal but never mutates the array. The host applies an
  accepted outcome by updating `items`.
- **Uncontrolled** (`defaultItems` supplied): the component applies accepted
  commands through the same local reducer and emits the next array through
  `onItemsChange`. Local undo/redo is available.

Both modes use the same request IDs, diagnostics, pending state, focus behavior
and timeout rules.

## Required props and callbacks

```tsx
<YearPlanner
  year={2027}
  items={items}
  baseRevision={revision}
  interaction={{ commandTimeoutMs: 15000 }}
  validateChange={(command, context, signal) => policy.check(command, context, signal)}
  onChangeRequest={(command, context, signal) => api.apply(command, { signal })}
  onChangeCommitted={(outcome) => applyAccepted(outcome)}
  onChangeRejected={(outcome) => reportRejected(outcome)}
  onDiagnostic={(entry) => log(entry)}
/>
```

| Prop | Purpose |
| ---- | ------- |
| `items` | Controlled authoritative items |
| `defaultItems` | Uncontrolled initial items |
| `baseRevision` | Optional host-wide token passed through in `CommandContext` |
| `validateChange` | Optional pre-request validation; sync or async |
| `onChangeRequest` | Host request; returns a `CommandOutcome` |
| `onChangeCommitted` | Called once when the host accepts |
| `onChangeRejected` | Called for local or host rejection, timeout or abort |
| `onDiagnostic` | Receives normalized validation, command and terminal diagnostics |
| `interaction.commandTimeoutMs` | Host validation + request deadline; default 15000 |
| `interaction.requestId` | Optional request-ID factory for deterministic tests |

## Command context

Every dispatched command receives:

```ts
interface CommandContext {
  requestId: string;
  baseRevision?: string;
}
```

`requestId` is unique for the life of the component. A response for an ID that
is no longer active is ignored. `baseRevision` is a pass-through token; it is
not used for per-item stale detection.

`validateChange` and `onChangeRequest` also receive an optional `AbortSignal` as
their third argument. Abort is advisory: ignoring it cannot make a late response
apply, because the pipeline checks the request state before settling.

## Validation

Local checks run before the host:

- global and item/layer read-only rules;
- annotation ownership;
- create completeness and duplicate IDs;
- update identity/version protection;
- paint target, layer policy and `expectedVersions`;
- timed-editing and range rules.

Then `validateChange`, if supplied, may return sync or async:

```ts
interface ValidationResult {
  permitted: boolean;
  diagnostics: Diagnostic[];
}
```

| Result | Behavior |
| ------ | -------- |
| `permitted: true`, no errors | Continue |
| `permitted: true`, warnings/info only | Continue; display notices |
| `permitted: true`, any `error` | Block |
| `permitted: false` | Block with the diagnostics, or `VALIDATION_ERROR` when none |
| Malformed result | Block with `VALIDATION_ERROR` |

Warnings and info are displayed in the inspector notice list and sent to
`onDiagnostic`. They do not block.

## Outcomes

```ts
type CommandOutcome =
  | {
      accepted: true;
      revision: string;
      updatedItems?: PlannerItem[];
      removedItemIds?: string[];
    }
  | {
      accepted: false;
      diagnostics: Diagnostic[];
      latestRevision?: string;
    };
```

The component normalizes the outcome at runtime. Malformed objects, invalid item
payloads, unknown diagnostic codes and missing revisions map to
`HOST_REJECTED`. A thrown or rejected host promise also maps to `HOST_REJECTED`
with a generic message; the original error is not shown to end users.

For a controlled paint command, the accepted outcome must include:

- `updatedItems` with every created, merged, residual or non-matching item;
- `removedItemIds` with every source that was removed;
- every ID in the command's `expectedVersions` covered by one of those arrays;
- for a union, at least one new item (an ID outside `expectedVersions`, version 1).

A partial paint payload is rejected with `HOST_REJECTED`.

## Versions

`PlannerItem.version` is a required positive integer.

| Command | Expected input | Accepted result |
| ------- | -------------- | --------------- |
| `create` | item version 1 | item exists at version 1 |
| `update` | `expectedVersion` | version + 1 |
| `move` | `expectedVersion` | version + 1 |
| `resize` | `expectedVersion` | version + 1 |
| `delete` | `expectedVersion` | item absent |
| `paint` | `expectedVersions` for every source | complete replacement set; new items version 1 |

A mismatch is rejected with `STALE_REVISION` before the host is called. The
controlled host remains authoritative for concurrent changes; the component
does not merge versions.

`update.patch` is `Partial<Omit<PlannerItem, "id" | "version">>`. Runtime checks
also reject a patch that owns `id` or `version`.

## Lifecycle

```text
local checks → optional validation → host request → accepted | rejected
accepted (controlled) → wait for props → applied | ACCEPTED_NOT_APPLIED
```

- **Pending**: the item keeps `data-yp-pending="true"` and `aria-busy="true"`.
  A gesture keeps its proposed preview visible until settlement.
- **Accepted**: the host outcome was applied and the command-status region
  announces “Change accepted”.
- **Rejected**: the source stays unchanged, the preview clears, focus returns to
  the source item (or the gesture date for paint/create), and the inspector shows
  the diagnostic.
- **Accepted-not-applied**: the host accepted but `items` never reflected the
  change before the timeout. The component shows `ACCEPTED_NOT_APPLIED`, clears
  pending and reverts visually to props. `onChangeCommitted` has already fired;
  `onChangeRejected` is not called.
- **Ignored**: a response for an obsolete request, or an unmounted component.
  It produces no callback, feedback or mutation.

### Accepted-not-applied detection

The component checks the props immediately and on every `items` change:

| Command | Applied when |
| ------- | ------------ |
| create | the ID exists |
| update/move/resize | the version advanced beyond `expectedVersion` |
| delete | the ID is absent |
| paint | every payload item exists at at least its accepted version and every removed ID is absent |

If the props never satisfy the rule within `commandTimeoutMs`, the result is
`ACCEPTED_NOT_APPLIED`.

## Stale requests and prop changes

- A layout, visibility, filter or interaction-mode change invalidates every
  validating/requesting command.
- An affected item version change invalidates a command that is still
  validating.
- During the host request, the response is allowed to settle. Before an
  uncontrolled local apply, the expected versions are re-checked; a concurrent
  change wins and produces `STALE_REVISION`.
- Unmount aborts in-flight requests and ignores their results.

Unrelated items may have pending commands at the same time.

## Retry

The inspector offers Retry only where replay is safe:

| Failure | create | update/move/resize | paint | delete |
| ------- | ------ | ------------------ | ----- | ------ |
| Explicit `HOST_REJECTED` | yes | yes | yes | no |
| Thrown/malformed host call | no | yes | no | no |
| `COMMAND_TIMEOUT` | no | yes | no | no |
| `STALE_REVISION`, `READ_ONLY`, `VALIDATION_ERROR`, `INVALID_COMMAND` | no | no | no | no |
| `ACCEPTED_NOT_APPLIED` | no | no | no | no |

A retried create still runs the duplicate-ID check. A timed-out paint is not
retried because a replay could create a second residual set.

## Mock host example

```tsx
function ControlledHost({ initialItems }: { initialItems: PlannerItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [revision, setRevision] = useState(1);

  return (
    <YearPlanner
      year={2027}
      items={items}
      baseRevision={String(revision)}
      onChangeRequest={async (command) => {
        const result = await api.apply(command);
        if (!result.accepted) {
          return {
            accepted: false,
            diagnostics: result.diagnostics,
            latestRevision: result.revision,
          };
        }
        setRevision((value) => value + 1);
        setItems(result.items);
        return {
          accepted: true,
          revision: result.revision,
          updatedItems: result.items,
          removedItemIds: result.removed ?? [],
        };
      }}
    />
  );
}
```

A capacity mock can reject a third overlapping reservation with
`CAPACITY_EXCEEDED` even when the reservation layer is hidden. The validator must
count hidden items; a read-only flag is still not proof of authorization.

## Security

- The host owns authentication, authorization, tenancy and rate limiting. The
  component never infers authorization from UI state.
- Diagnostics render as text, never HTML. Local diagnostics for hidden items keep
  the item ID but omit titles, dates and layer names.
- Host-supplied diagnostic prose is host-owned; redact sensitive text in the
  host before returning it.
- The component does not log item titles, periods or other payload data.
- Commands are typed and validated before dispatch; the host must validate
  again.

## Related

- [Interaction guide](interaction.md)
- [React view](react-view.md)
- [Security](security.md)
