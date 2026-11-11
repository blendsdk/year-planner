# Integration and Documentation: RD-08 Controlled Commands

> **Document**: 03-04-integration-docs.md
> **Parent**: [Index](00-index.md)

## Overview

This document owns the evidence that the lifecycle works outside unit tests:
a controlled demo host, Storybook states, Playwright scenarios, the host
contract guide and release metadata. It adds no production API beyond the
additive props and codes defined in the other component documents.

## Architecture

### Controlled demo fixture

Add `apps/demo/src/CommandsDemo.tsx` and a `?commands=1` route in
`apps/demo/src/App.tsx`. The fixture is a real controlled host:

- `items` lives in React state.
- `baseRevision` is a counter passed to the planner.
- A host-mode `<select>` chooses the behavior.
- A request log and diagnostics list are exposed through `data-testid` nodes.
- The planner uses `interaction.commandTimeoutMs` of 800 ms in the fixture so a
  timeout scenario completes quickly in a browser.

Host modes:

| Mode | `validateChange` | `onChangeRequest` | Props update |
| ---- | ---------------- | ----------------- | ------------ |
| `accept` | permit | accepted with the new revision | yes, immediately |
| `delay` | permit | accepted after a short deferred promise | yes, after resolution |
| `reject` | permit | rejected with `CAPACITY_EXCEEDED` | no |
| `stale` | permit | rejected with `STALE_REVISION` | no |
| `timeout` | permit | never resolves; honors the abort signal | no |
| `never-apply` | permit | accepted | never |
| `warning` | permitted + one warning | accepted | yes |
| `capacity` | permit | capacity policy decides | yes only when allowed |

The fixture computes accepted updates with a small pure helper:

- create: append the item with version 1;
- update: spread the patch and increment the version;
- move/resize: replace the period and increment the version;
- delete: remove the item;
- paint: apply the payload produced by the core paint helper in the fixture, or
  use a local copy of the union/erase rules. The demo may call the public
  `paintItems`/`eraseItems` helpers directly.

### Capacity mock

The fixture includes a dock layer with two bookable slots. A reservation on the
dock is rejected when two other reservations overlap its half-open period. The
validator counts all dock reservations, regardless of visibility, and returns
`CAPACITY_EXCEEDED` with the conflicting item IDs. This is demo/test code; the
library still has no capacity engine (RD-08 Won't Have, requirements AR-6).

### Storybook states

Add `apps/storybook/stories/CommandLifecycle.stories.tsx` with controlled
render functions. Suggested stories:

| Story | State |
| ----- | ----- |
| `AcceptedMove` | Controlled host applies a move and the pending state clears |
| `PendingMove` | Deferred host leaves a move preview and pending outline |
| `PendingResize` | Deferred resize |
| `PendingPaint` | Deferred paint preview |
| `PendingCreate` | Deferred create preview |
| `PendingDelete` | Deferred delete keeps the source item pending |
| `RejectedValidation` | Host validation error |
| `RejectedStale` | `STALE_REVISION` |
| `Timeout` | `COMMAND_TIMEOUT` with a short fixture timeout |
| `AcceptedNotApplied` | Accepted but props never update |
| `WarningsOnly` | Warning diagnostic does not block |
| `RetryAvailable` | First request fails, retry succeeds |
| `CapacityRejected` | Third dock reservation gets `CAPACITY_EXCEEDED` |

Each story uses a deterministic trigger button or a Storybook `play` function.
No arbitrary timers; deferred promises and a short `commandTimeoutMs` keep the
states stable. The stories import only public package surfaces.

### Browser evidence

Add `tests/e2e/commands.spec.ts` against `/?commands=1`. The default Playwright
projects run it in Chromium, Firefox and WebKit; no config change is expected.

Scenarios:

1. **Accept a move**: drag the booking, assert the new period, assert the
   pending attribute clears and the command status announces acceptance.
2. **Reject a move**: drag, assert the original period, feedback
   `CAPACITY_EXCEEDED`, source item focused.
3. **Stale revision**: bump the host revision, drag, assert `STALE_REVISION` and
   no geometry change.
4. **Timeout**: choose `timeout`, drag, assert `COMMAND_TIMEOUT`, original
   period and pending cleared.
5. **Accepted not applied**: choose `never-apply`, drag, assert
   `ACCEPTED_NOT_APPLIED`, original period and no phantom success.
6. **Warning only**: choose `warning`, drag, assert the warning notice and the
   accepted move.
7. **Pending preview**: choose `delay`, drop, assert a preview fragment and
   `data-yp-pending="true"` before the host resolves; after resolution both
   clear.
8. **Capacity**: create the third overlapping dock reservation, assert the
   diagnostic and unchanged item count.

Selectors use stable `data-yp-part` attributes and fixture `data-testid` values,
not CSS structure or text that may change.

## Documentation

### `docs/commands.md`

New guide covering:

- the controlled versus uncontrolled contract;
- `CommandContext`, request IDs and `baseRevision`;
- `validateChange` severity and ordering;
- `CommandOutcome` shapes and diagnostic normalization;
- per-item versions and update patch rules;
- pending, accepted, rejected, timeout, abort and accepted-not-applied states;
- rollback, focus and selection behavior;
- retry safety and inspector notices;
- a complete mock-host example;
- security boundaries: host owns authorization; diagnostics are text and local
  hidden-item details stay redacted; host-supplied diagnostic prose is
  host-owned and must be redacted by the host.

### Existing docs

- `docs/interaction.md`: link the lifecycle guide and extend the host example.
- `docs/react-view.md`: explain the command pipeline states and props.
- `docs/security.md`: confirm diagnostics are text, hidden diagnostics are
  redacted, host-supplied prose is host-owned, and read-only is not
  authorization.
- `docs/test-report.md`: update counts, CI link and known gaps after the final
  verification.
- `README.md`: add controlled commands and accepted-not-applied to the feature
  list and link `docs/commands.md` from the documentation section.

### Release metadata

- Add `.changeset/rd08-command-lifecycle.md` with a minor bump for both packages.
- Regenerate `packages/core/etc/year-planner-core.api.md` and
  `packages/react/etc/react-year-planner.api.md` in Phase 1 immediately after the
  public surface changes, then refresh them again at closeout. `pnpm verify` runs
  `api-report:ci`, so a stale report fails every phase gate.
- Update the roadmap row to Plan Created/Preflighted and later Done, using the
  roadmap skill; do not hand-edit derived status.

## Error Handling

| Error Case | Handling Strategy | AR Ref |
| ---------- | ----------------- | ------ |
| Demo host diverges from the public contract | Compile against public types; the same fixture feeds E2E | AR-22 |
| Storybook timer flakes | Deferred promises; short configured timeouts; explicit triggers | AR-26 |
| Playwright cannot see a pending state | Pending attributes and test IDs are part of the contract | AR-22 |
| Capacity fixture accidentally ships as API | Keep it inside `apps/`; never export from a package | AR-22 |
| Docs example drifts from the types | Typecheck the example in the docs test or keep it in a typed file | AR-25 |
| API report change is missed | `pnpm verify` runs `api-report:ci` | AR-24 |

## Testing Requirements

- Demo fixture build and Storybook static build succeed.
- Every Storybook state renders without console errors.
- Playwright scenarios pass in Chromium, Firefox and WebKit.
- Docs build (`pnpm run docs`) succeeds.
- API reports are current and the changeset is present.
