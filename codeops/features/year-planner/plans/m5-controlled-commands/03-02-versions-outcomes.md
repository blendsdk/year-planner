# Versions and Outcomes: RD-08 Controlled Commands

> **Document**: 03-02-versions-outcomes.md
> **Parent**: [Index](00-index.md)

## Overview

This document owns validation severity, host-outcome normalization, version
rules, application proof, retry safety and the uncontrolled reducer. Request
identity, timeout and obsolete handling are in
[03-01](03-01-command-lifecycle.md); pending previews and focus are in
[03-03](03-03-rollback-pending-ui.md).

The guiding rule is simple: the component may display a proposal, but it may
only call a command applied when the authoritative source says so. In controlled
mode that source is `items`; in uncontrolled mode it is the local reducer that
emits `onItemsChange`.

## Validation

### Ordering

1. Local checks in `commands/validate.ts`.
2. Delete confirmation (outside the deadline).
3. Host `validateChange`, with the abort signal.
4. Host `onChangeRequest`, with the same signal and deadline.

Local checks never call the host. A local failure produces one typed diagnostic
and settles `"rejected"` without a request ID (AR-6).

### Severity

Normalize `ValidationResult` before deciding:

```ts
interface NormalizedValidation {
  permitted: boolean;
  diagnostics: Diagnostic[];
  hasError: boolean;
}
```

Decision table:

| `permitted` | Diagnostics | Result |
| ----------- | ----------- | ------ |
| `true` | none | continue |
| `true` | warnings/info only | continue; emit each diagnostic and add notices |
| `true` | at least one `error` | block with those diagnostics |
| `false` | at least one `error` | block with those diagnostics |
| `false` | none or warnings only | block with a synthesized `VALIDATION_ERROR` |
| malformed result | — | block with `VALIDATION_ERROR` |

A warning is displayed but never blocks. An error blocks even when the host set
`permitted: true`, because the severity is part of the public diagnostic
contract (AR-6).

### Timeout and throw mapping

`validateChange` throwing or rejecting maps to `VALIDATION_ERROR` with a generic
message. It is not retryable in R1; the host’s original error is never shown to
end users (AR-8).

## Host outcome normalization

`onChangeRequest` is untrusted at runtime even when the host uses TypeScript.
Normalize before any mutation:

```ts
type NormalizedOutcome =
  | { accepted: true; revision: string; updatedItems?: PlannerItem[]; removedItemIds?: string[] }
  | { accepted: false; diagnostics: Diagnostic[]; latestRevision?: string };
```

Rules:

- `accepted` must be a boolean; anything else is malformed.
- Accepted requires a string `revision`.
- Rejected requires an array of diagnostics; an empty array becomes one
  `HOST_REJECTED` diagnostic.
- Each diagnostic gets a typed level (`error`/`warning`/`info`), a string
  message, optional string arrays for item/resource IDs, and an optional
  `periods` array passed through when present. Local range failures attach the
  offending period and layer/item IDs. Unknown codes map to `HOST_REJECTED`;
  malformed entries are replaced with a generic `HOST_REJECTED` entry.
- `updatedItems`, when present, must be an array of item-like objects with a
  string `id` and a positive integer `version`. A malformed payload is
  `HOST_REJECTED`.
- `removedItemIds`, when present, must be an array of strings.
- In controlled mode, an accepted paint outcome must carry `updatedItems` and
  `removedItemIds`, and every key in the command’s `expectedVersions` must
  appear in one of them. A union must include at least one new item: an ID that
  is not in `expectedVersions` with version 1. A missing or partial payload is
  `HOST_REJECTED` (AR-30). In uncontrolled mode, the local helper result is
  always used; a host payload is not trusted for item state.
- A thrown or rejected request maps to `HOST_REJECTED` with a generic message.
- A host that reports `COMMAND_ABORTED` in a rejected outcome is a normal
  rejection; an internal abort is `"ignored"`.

No partial mutation is allowed: normalize the entire outcome first, then apply
it.

Add `isDiagnosticCode` (backed by a private code list) and the three RD-08 codes to
the core diagnostic module so the React layer can normalize without duplicating
the union (AR-5, AR-8).

## Version rules

`PlannerItem.version` is a required positive integer. Core validation already
drops invalid items with `INVALID_VERSION`
(`packages/core/src/model/validation.ts:350`).

| Command | Required version input | Accepted result | Uncontrolled result |
| ------- | ---------------------- | --------------- | ------------------- |
| `create` | item `version: 1` | item exists with version 1 | item added with version 1 |
| `update` | `expectedVersion` | host item with version + 1 | source version + 1 |
| `move` | `expectedVersion` | host item with version + 1 | source version + 1 |
| `resize` | `expectedVersion` | host item with version + 1 | source version + 1 |
| `delete` | `expectedVersion` | item absent | item removed |
| `paint` union | `expectedVersions` for affected sources | complete `updatedItems`; new merged item version 1 | same helper result |
| `paint` subtract | `expectedVersions` for affected sources | complete `updatedItems` (residuals version 1) and `removedItemIds` | same helper result |

A mismatch between the command’s expected version and the current item is
`STALE_REVISION` with the item ID, before any host call. The pipeline maps the
core paint helper’s `STALE_VERSION` to `STALE_REVISION` when it reports a paint
failure.

Runtime hardening:

- `expectedVersion` must be a positive integer; otherwise `INVALID_COMMAND`.
- Every `expectedVersions` value must be a positive integer; keys must name
  existing items.
- `update.patch` may not own `id` or `version`; use `Object.hasOwn`, not `in`.
- `create.item` must have a non-empty ID, a valid kind, a layer, a valid period
  and version 1.
- Annotation items remain host-owned and reject every command.

Undo restores the whole prior item array, so it restores the prior versions.
Redo re-applies the incremented versions. A new command clears the redo stack.
Controlled mode creates no local history (AR-18).

## Application proof

After a controlled host accepts, the pipeline enters `applying` and waits for
`items` to reflect the outcome. It checks immediately and then on every
`items` change. The rule is per command (AR-19):

| Command | Applied when |
| ------- | ------------ |
| `create` | an item with the created ID exists |
| `update` | the item exists and its version is greater than `expectedVersion` |
| `move` | the item exists and its version is greater than `expectedVersion` |
| `resize` | the item exists and its version is greater than `expectedVersion` |
| `delete` | the item ID is absent |
| `paint` | every `expectedVersions` source appears in `updatedItems` or `removedItemIds`; every accepted `updatedItems` entry exists at a version at least its accepted version; every `removedItemIds` entry is absent; a union includes a new item (ID outside `expectedVersions`, version 1) |

If `updatedItems` is present for update/move/resize, the payload’s versions are
the expected versions; the item must exist at at least that version. A host may
add metadata or change unrelated fields; the rule does not require deep
equality.

For paint, the coverage rule is the completeness proof: a source that is neither
updated nor removed makes the payload partial. A union with no new item is
likewise partial. Both are rejected before props are read.

The waiter:

- registers before the host promise is awaited, so a synchronous prop update is
  not missed;
- uses the latest `items` from a ref, not a stale closure;
- clears on settlement, obsolete request or unmount;
- times out after `commandTimeoutMs`.

On timeout the result is `"accepted-not-applied"`:

1. `onChangeCommitted` has already fired with the host’s accepted outcome.
2. Emit `ACCEPTED_NOT_APPLIED` through `onDiagnostic`.
3. Set inspector feedback with `level: "error"`, not retryable.
4. Clear pending state and the pending preview.
5. Revert visually to props; no local mutation (AR-11, AR-12).

## Callbacks

| Situation | `onChangeCommitted` | `onChangeRejected` | `onDiagnostic` |
| --------- | ------------------- | ------------------ | -------------- |
| Local validation failure | — | synthesized rejection | each diagnostic |
| Host validation failure | — | synthesized rejection | each diagnostic |
| Confirmation denied | — | — | — |
| Host request rejected | — | host outcome | each diagnostic |
| Host request timeout | — | synthesized `COMMAND_TIMEOUT` | `COMMAND_TIMEOUT` |
| Host request throws | — | synthesized `HOST_REJECTED` | `HOST_REJECTED` |
| Host accepted and applied | host outcome once | — | warnings from validation |
| Host accepted, not applied | host outcome once | — | `ACCEPTED_NOT_APPLIED` |
| Obsolete/ignored | — | — | — |

`revision` and `latestRevision` pass through unchanged (AR-20). They never
participate in item stale detection.

Host callbacks are invoked after the pipeline has settled its own pending
state. A throwing `onChangeCommitted` or `onChangeRejected` must not turn a
successful application into a rejection or trigger rollback; invoke them
outside the host-request `try`/`catch` and do not let their errors re-enter the
lifecycle.

## Retry and feedback

`CommandFeedback` carries the highest-severity diagnostic plus the command and a
`retryable` flag. `notices` holds warning/info diagnostics, capped at five and
deduplicated by code + message. Starting a new request clears feedback and
notices; `dismiss` clears both.

Retry is deliberately narrow (AR-13):

| Code / source | create | update/move/resize | paint | delete |
| ------------- | ------ | ------------------ | ----- | ------ |
| `HOST_REJECTED` — explicit host rejection | yes | yes | yes | no |
| `HOST_REJECTED` — thrown or malformed host call | no | yes | no | no |
| `COMMAND_TIMEOUT` | no | yes | no | no |
| `STALE_REVISION` | no | no | no | no |
| `READ_ONLY` | no | no | no | no |
| `VALIDATION_ERROR` | no | no | no | no |
| `INVALID_COMMAND` | no | no | no | no |
| `CONFIRMATION_UNAVAILABLE` | no | no | no | no |
| `ACCEPTED_NOT_APPLIED` | no | no | no | no |

“Explicit rejection” means the host returned `{ accepted: false }`; the host has
stated the change did not apply. A thrown call or a timeout is ambiguous, so only
replay-safe update/move/resize are retried. A retried create still performs the
local duplicate-ID check. A timed-out or thrown paint is excluded because a
replay could create a second residual set.

## Uncontrolled reducer

Extract the current logic into a pure `localCommandItems(state, command, createId)`
and apply it through `applyHostOutcome`. The same helper is used by:

- no-host mode;
- an accepted uncontrolled host outcome without a payload;
- an accepted uncontrolled paint outcome, always (the local helper is the
  authoritative item state; a host payload is not trusted);
- the apply-time stale-version check before any uncontrolled mutation.

The reducer returns `updatedItems` and `removedItemIds`, never mutates the input
array, and always increments versions by one. The hook records one undo entry
before applying, clears redo, and emits the full next array through
`onItemsChange`.

Before applying an accepted uncontrolled outcome, re-check the command’s
affected items against the latest items: `expectedVersion`, every
`expectedVersions` entry, the created ID’s absence and the delete target’s
presence. A mismatch is `STALE_REVISION`, fires `onChangeRejected`, produces no
undo entry and does not mutate items. A concurrent change always wins.

`onChangeCommitted` receives the outcome that was actually applied. If the host
supplied a complete payload, it is passed through untouched; if the component
synthesized the local payload, the effective outcome carries it (plus the host’s
revision token).

## Error Handling

| Error Case | Handling Strategy | AR Ref |
| ---------- | ----------------- | ------ |
| `permitted: false`, no diagnostics | Synthesize `VALIDATION_ERROR` | AR-6 |
| Warning-only validation | Continue; display notice | AR-6 |
| Error diagnostic with `permitted: true` | Block | AR-6 |
| Malformed validation result | `VALIDATION_ERROR` | AR-8 |
| Malformed accepted outcome | `HOST_REJECTED`, no mutation | AR-8 |
| Accepted controlled paint without payload | `HOST_REJECTED`, no mutation | AR-30 |
| Unknown diagnostic code | Normalize to `HOST_REJECTED` | AR-8 |
| Version mismatch | `STALE_REVISION`, no host call | AR-18 |
| Affected item changes before an uncontrolled apply | `STALE_REVISION`, `onChangeRejected`, no mutation | AR-10, AR-18 |
| Invalid expected version | `INVALID_COMMAND` | AR-18 |
| Update patch owns `id`/`version` | `INVALID_COMMAND` | AR-18 |
| Host never updates props | `ACCEPTED_NOT_APPLIED` after timeout | AR-11 |
| Delete retry requested | Not offered; no retry button | AR-13 |

## Testing Requirements

- Validation severity matrix, malformed validation and malformed outcomes.
- Version increments, stale rejection and undo/redo versions.
- Paint payload completeness, residuals and erase-to-empty.
- Application proof for every command, including immediate and late props.
- Retry matrix and notices.
- No React import in `local.ts`/`apply.ts`; pure helpers are unit-testable.
