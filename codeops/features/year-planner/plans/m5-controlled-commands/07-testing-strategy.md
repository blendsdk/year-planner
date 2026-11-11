# Testing Strategy: RD-08 Controlled Commands

> **Document**: 07-testing-strategy.md
> **Parent**: [Index](00-index.md)

## Testing Overview

### Coverage Goals

| Code type | Target |
| --------- | ------ |
| Command lifecycle and pure helpers | 95% lines, 90% branches |
| React wiring, previews and inspector | 85% lines, 80% branches |
| Demo / stories | Build and browser evidence |

- Test names state behavior: `should [expected behavior] when [condition]`.
- The immutable-oracle rule applies: a failing spec test means the
  implementation is wrong, never the test.
- Existing RD-06/RD-07 tests must remain green.

## 🚨 Specification Test Cases (MANDATORY — NON-NEGOTIABLE)

> These cases derive from RD-08, the component specs and the Ambiguity Register.
> Expectations are fixed before implementation. ST cases are grouped by the
> phase that implements them so each phase gate is reachable.

### Phase 1 — Command lifecycle and context

| # | Input / Scenario | Expected Output / Behavior | Source |
|---|------------------|----------------------------|--------|
| ST-1 | `interaction.requestId` returns `"request-7"`; request a move | Host receives `{ requestId: "request-7" }`; no fallback ID is used | RD-08 request IDs / AR-9 |
| ST-2 | `baseRevision="rev-9"`; request any command | Context is `{ requestId, baseRevision: "rev-9" }` | RD-08 context / AR-3 |
| ST-3 | No `baseRevision`; request a command | Context has `requestId` and no `baseRevision` property | RD-08 context / AR-3 |
| ST-4 | `baseRevision` changes from `"a"` to `"b"` between two commands | The second context carries `"b"`; the first in-flight context stays `"a"` | RD-08 pass-through / AR-3 |
| ST-5 | Read-only planner; request a move | `READ_ONLY` diagnostic; `validateChange` and `onChangeRequest` are not called | RD-08 local checks first / AR-6 |
| ST-6 | `validateChange` returns `{ permitted: true, diagnostics: [] }` synchronously | Host request runs and the command settles once | RD-08 validation / AR-6 |
| ST-7 | `validateChange` resolves `{ permitted: true }` after a tick | Host request runs only after the promise resolves | RD-08 async validation / AR-6 |
| ST-8 | `validateChange` returns `permitted: true` with one `error` diagnostic | Command blocks; no host request; feedback shows the error; `onChangeRejected` fires | RD-08 error blocks / AR-6 |
| ST-9 | `validateChange` returns `permitted: true` with one `warning` diagnostic | Command proceeds; warning reaches `onDiagnostic` and the inspector notice list; `onChangeCommitted` fires | RD-08 warnings display / AR-6 |
| ST-10 | `validateChange` returns `permitted: false` and no diagnostics | Command blocks with a synthesized `VALIDATION_ERROR` | RD-08 validation / AR-6 |
| ST-11 | `validateChange` throws | `VALIDATION_ERROR` feedback; no host request; original error text is not shown | RD-08 failure paths / AR-8 |
| ST-12 | Host validation never resolves; timeout is 20 ms | After 20 ms: `COMMAND_TIMEOUT`, abort signal fired, pending cleared, no host request | RD-08 timeout / AR-7 |
| ST-13 | Host request never resolves; timeout is 20 ms | After 20 ms: `COMMAND_TIMEOUT`, abort signal fired, pending cleared, feedback retryable for a move | RD-08 AC4 / AR-7 |
| ST-14 | Host request resolves accepted after the timeout already fired | Late response is ignored; no `onChangeCommitted`, no diagnostic, no item mutation | RD-08 AC3 / AR-9 |
| ST-15 | Two concurrent commands with a factory that returns `"same-id"` twice | The second active ID gets a deterministic suffix; each response settles its own request | RD-08 request IDs / AR-9 |
| ST-16 | Affected item version changes while a request is validating | Request becomes ignored; late response produces no callbacks, no feedback and no mutation | RD-08 AC13 / AR-10 |
| ST-17 | Year/range, visibility or filter changes while a request is requesting | Request becomes ignored; pending clears; no failure feedback | RD-08 AC13 / AR-10 |
| ST-18 | Interaction mode changes while a request is requesting | Request becomes ignored; no stale geometry commits | RD-08 AC13 / AR-10 |
| ST-19 | Component unmounts while a request is pending | Abort signal fires; no callback or state update; no unhandled rejection | RD-08 unmount / AR-9 |
| ST-20 | Host returns `null` / `{ accepted: "yes" }` / an accepted result without `revision` | `HOST_REJECTED` feedback; no item mutation | RD-08 malformed outcome / AR-8 |
| ST-21 | Host request throws `new Error("secret detail")` | `HOST_REJECTED` with a generic message; `"secret detail"` is not displayed | RD-08 failure paths / AR-8 |
| ST-22 | Item `a` has a pending move; request a second move for `a` | Second request rejects with `INVALID_COMMAND` and never calls the host | RD-08 one per item / AR-9 |
| ST-23 | Item `a` is pending; request a move for item `b` | Both requests reach the host; each has its own pending state | RD-08 unrelated items / AR-9 |
| ST-24 | Delete with `confirmChange` returning `false` | No host request, no feedback, no `onChangeRejected`, result `confirmation-denied` | RD-08 delete confirmation / AR-29 |
| ST-25 | Delete without a confirmation handler in a DOM with no `window.confirm` | `CONFIRMATION_UNAVAILABLE` feedback; no host request | RD-08 confirmation / AR-29 |
| ST-26 | Two consecutive requests with the built-in factory | Request IDs differ | RD-08 unique IDs / AR-9 |
| ST-93 | Unrelated item `b` changes while item `a` is validating | Item `a` request continues; no cancellation | RD-08 unrelated items / AR-10 |
| ST-94 | Item `a` version changes while its uncontrolled request is requesting; host accepts | The response settles, the apply-time re-check rejects with `STALE_REVISION`, `onChangeRejected` fires and the concurrent change is not overwritten | RD-08 AC13 / AR-10, AR-18 |

### Phase 2 — Versions, validation severity and outcomes

| # | Input / Scenario | Expected Output / Behavior | Source |
|---|------------------|----------------------------|--------|
| ST-27 | Item version 2; move with `expectedVersion: 1` | `STALE_REVISION`; host is not called; item unchanged | RD-08 AC1 / AR-18 |
| ST-28 | Item version 2; resize with `expectedVersion: 1` | `STALE_REVISION`; no host call | RD-08 AC1 / AR-18 |
| ST-29 | Item version 2; delete with `expectedVersion: 1` | `STALE_REVISION`; item remains | RD-08 AC1 / AR-18 |
| ST-30 | Paint over item `h` at version 3 with `expectedVersions: { h: 2 }` | `STALE_REVISION`; no host call; no paint mutation | RD-08 AC8 / AR-18 |
| ST-31 | Update patch includes `id` (runtime object) | `INVALID_COMMAND`; host is not called | RD-08 AC15 / AR-18 |
| ST-32 | Update patch includes `version` (runtime object) | `INVALID_COMMAND`; host is not called | RD-08 AC15 / AR-18 |
| ST-33 | Update patch changes only `title` | Accepted; uncontrolled source version becomes `v+1`; title changes | RD-08 AC15 / AR-18 |
| ST-34 | Create with an empty ID, unknown kind, missing layer, invalid period or version 2 | `INVALID_COMMAND`; host is not called | RD-08 create / AR-18 |
| ST-35 | Create with an ID already present | `INVALID_COMMAND` with the duplicate ID; host is not called | RD-08 create / AR-18 |
| ST-36 | Controlled move accepted with `updatedItems` at version 2 | Props update; item renders at the new period; no `ACCEPTED_NOT_APPLIED` | RD-08 AC5 / AR-11, AR-19 |
| ST-37 | Controlled accept but `items` never changes; timeout 20 ms | `ACCEPTED_NOT_APPLIED` after 20 ms; `onChangeCommitted` fired once; `onChangeRejected` not fired; pending clears | RD-08 AC5 / AR-11, AR-12 |
| ST-38 | Controlled accept; props update after 10 ms with timeout 100 ms | No `ACCEPTED_NOT_APPLIED`; pending clears when props prove application | RD-08 AC5 / AR-11 |
| ST-39 | Controlled accept for delete; props remove the item | Item disappears; no `ACCEPTED_NOT_APPLIED` | RD-08 delete / AR-19 |
| ST-40 | Controlled accept for update without `updatedItems`; props bump version to `v+1` | Applied; pending clears | RD-08 version rule / AR-19 |
| ST-41 | Controlled paint accepted without `updatedItems` | `HOST_REJECTED`; no mutation; no accepted callback | RD-08 paint payload / AR-30 || ST-42 | Controlled erase accepted with two residuals and one removed source; props apply them | Two residual fragments render; source is gone | RD-08 AC8 / AR-19, AR-30 |
| ST-43 | Uncontrolled update from version 1 | `onItemsChange` gets version 2; undo restores version 1 | RD-08 AC16 / AR-18 |
| ST-44 | Uncontrolled update v1→v2; undo; redo | Undo shows version 1; redo shows version 2 | RD-08 AC16 / AR-18 |
| ST-45 | Uncontrolled update v1→v2; second update with `expectedVersion: 1` | Second update rejects `STALE_REVISION`; no third version | RD-08 AC16 / AR-18 |
| ST-46 | Uncontrolled erase splits `[A,C)` into two residuals | Residuals have new IDs and version 1; undo restores the source | RD-08 AC8/AC16 / AR-18 |
| ST-47 | Uncontrolled create with version 1; undo; redo | Create adds version 1; undo removes it; redo restores it | RD-08 AC10 / AR-18 |
| ST-48 | Controlled command; call `requestUndo` | No local history is created; `UNDO_UNAVAILABLE` diagnostic | RD-08 AC7 / AR-18 |
| ST-49 | Host rejects with `CAPACITY_EXCEEDED` | Feedback shows the code/message; `onChangeRejected` fires once; item unchanged | RD-08 AC6 / AR-8 |
| ST-50 | Host rejects with warnings only | Host decision still blocks; warnings display; no mutation | RD-08 host rejection / AR-6, AR-8 |
| ST-51 | Host accepted outcome carries `revision: "r7"`; rejected carries `latestRevision: "r8"` | Callbacks receive the tokens unchanged | RD-08 revision pass-through / AR-20 |
| ST-52 | Error diagnostic with `permitted: true` from host validation | Blocks (same as ST-8) in both controlled and uncontrolled mode | RD-08 severity / AR-6 |
| ST-53 | Accepted paint has `updatedItems: []` and `removedItemIds: ["h"]`; props remove `h` | Applied; no residual; no `ACCEPTED_NOT_APPLIED` | RD-08 AC9 / AR-30 |
| ST-54 | Warning-only validation followed by an accepted uncontrolled command | `onItemsChange` fires; notice remains until dismiss | RD-08 AC11 / AR-17 |
| ST-55 | Retry after a timed-out move | Retry uses the original command; a successful second request clears feedback | RD-08 retry / AR-13 |
| ST-56 | Retry after a failed delete | No retry button/action; delete feedback is not retryable | RD-08 retry safety / AR-13 |
| ST-57 | Retry after a timed-out create | No retry action | RD-08 retry safety / AR-13 |
| ST-90 | Paint `[Jun 10, Jun 12)` over a layer with no visible highlight | One highlight from `defaults`, version 1, accepted; no source removal | RD-08 AC9 / AR-30 |
| ST-91 | Paint a zero-length or reversed period | `INVALID_RANGE`; host is not called; no item | RD-08 AC9 / AR-18 |
| ST-92 | Paint over a matching highlight and a different-attribute highlight | Matching source is merged/removed; different-attribute item stays untouched; no duplicate | RD-08 AC9 / AR-30 |
| ST-95 | Controlled union accepted with `updatedItems: []` and `removedItemIds: []` while `expectedVersions` names one source | `HOST_REJECTED`; no mutation | RD-08 AC8/AC9 / AR-30 |
| ST-96 | Controlled union accepted without a new item in `updatedItems` | `HOST_REJECTED`; no mutation | RD-08 AC9 / AR-30 |
| ST-97 | Controlled erase accepted with every expected source in `removedItemIds` and residuals in `updatedItems` | Applied; residuals render; sources are gone | RD-08 AC8/AC9 / AR-30 |

### Phase 3 — Pending preview, rollback and status

| # | Input / Scenario | Expected Output / Behavior | Source |
|---|------------------|----------------------------|--------|
| ST-58 | Move a 10-day item; host resolves accepted after a tick | Preview remains after pointerup while pending; after acceptance it clears and the item renders at the new period | RD-08 pending preview / AR-15 |
| ST-59 | Move; host rejects | Preview clears; item stays at the original period; focus returns to the source item; feedback shows the rejection | RD-08 AC2 / AR-14, AR-15 |
| ST-60 | Move; host times out | Preview clears; item stays; focus returns to the source item; `COMMAND_TIMEOUT` feedback | RD-08 AC4 / AR-14 |
| ST-61 | Move; host accepts but props never update | Preview clears; item stays at props geometry; `ACCEPTED_NOT_APPLIED`; focus source item | RD-08 AC5 / AR-11, AR-14 |
| ST-62 | Paint a range; host rejects | Paint preview clears; no highlight changes; focus falls back to the gesture date | RD-08 AC2 / AR-14 |
| ST-63 | Create a range; host rejects | Create preview clears; no item appears; focus falls back to the gesture date | RD-08 AC2 / AR-14 |
| ST-64 | Delete an item; host is pending | Source item has `data-yp-pending="true"` and `aria-busy="true"`; no preview overlay | RD-08 pending state / AR-16 |
| ST-65 | Two unrelated items move while both hosts are deferred | Two preview fragments render; each item keeps its own pending state; settling one leaves the other | RD-08 unrelated items / AR-15 |
| ST-66 | Year changes while a move is pending | Preview clears; no stale geometry commits; no failure feedback | RD-08 AC13 / AR-10, AR-15 |
| ST-67 | Rejected command; selection before the command | Selection is unchanged; a newer user selection made during the request is preserved | RD-08 AC2 / AR-14 |
| ST-68 | Accepted move | Polite command status says “Change accepted” | RD-08 AC14 / AR-16 |
| ST-69 | Rejected move | Polite command status includes the rejection message | RD-08 AC14 / AR-16 |
| ST-70 | Accepted-not-applied | Polite command status says the change was accepted but not applied | RD-08 AC14 / AR-12, AR-16 |
| ST-71 | Warning diagnostic | Inspector notice renders the warning; the command still commits | RD-08 AC11 / AR-17 |
| ST-72 | Dismiss after a rejection | Feedback and notices clear; no retry is triggered | RD-08 inspector actions / AR-17 |
| ST-73 | Retry visible on a timed-out move; click retry | Second request is sent; success clears feedback | RD-08 retry / AR-13 |
| ST-74 | Delete failure | No retry control is rendered | RD-08 retry safety / AR-13 |
| ST-75 | Unmount while pending | No command-status announcement, no feedback, no React state update | RD-08 unmount / AR-9, AR-16 |
| ST-76 | Source item becomes hidden during a pending move | Preview clears; no stale geometry commits; no failure feedback and the ignored result does not move focus | RD-08 AC13 / AR-10, AR-14 |

### Phase 4 — Integration and documentation

| # | Input / Scenario | Expected Output / Behavior | Source |
|---|------------------|----------------------------|--------|
| ST-77 | Three overlapping dock reservations on a capacity-2 mock, third hidden layer | Third request rejects with `CAPACITY_EXCEEDED`; no item added | RD-08 AC6 |
| ST-78 | Browser: accept a move in the controlled fixture | Item period changes; pending clears; status announces acceptance | RD-08 AC5 |
| ST-79 | Browser: reject a move | Original period; feedback shows rejection; source focused | RD-08 AC2 |
| ST-80 | Browser: stale revision | `STALE_REVISION`; no geometry change | RD-08 AC1 |
| ST-81 | Browser: timeout | `COMMAND_TIMEOUT`; no geometry change; pending clears | RD-08 AC4 |
| ST-82 | Browser: accepted-not-applied | `ACCEPTED_NOT_APPLIED`; no phantom success; original period | RD-08 AC5 |
| ST-83 | Browser: warning-only command | Notice visible; move applies | RD-08 AC11 |
| ST-84 | Browser: deferred host | Pending preview visible before resolution; clears after | RD-08 pending state |
| ST-85 | Storybook static build | Every `CommandLifecycle` story renders without console errors | RD-08 story mandate / AR-26 |
| ST-86 | Docs and API gates | `docs/commands.md` exists; API reports include the new codes, prop and arguments; changeset present | RD-08 docs / AR-25 |
| ST-87 | Hidden item command rejection | Diagnostic keeps the item ID but does not contain the title, dates or hidden layer name | RD-08 security / AR-27 |
| ST-88 | Host diagnostic message contains `<b>blocked</b>` | The inspector renders the literal text; no `<b>` element is created | RD-08 security / AR-27 |
| ST-89 | Uncontrolled paint host accepts without a payload | The local helper computes residuals, emits `onItemsChange`, records undo and passes the effective payload to `onChangeCommitted` | RD-08 paint parity / AR-30, AR-20 |

## Test Categories

### Specification Tests

> Written BEFORE implementation. Filed as `.spec.test`.

| Test File | ST Cases Covered | Component |
| --------- | ---------------- | --------- |
| `packages/react/src/commands.lifecycle.spec.test.tsx` | ST-1–ST-26, ST-93–ST-94 | Lifecycle and context |
| `packages/react/src/commands.outcomes.spec.test.tsx` | ST-27–ST-57, ST-90–ST-97 | Versions, outcomes and paint |
| `packages/react/src/interaction.integration.spec.test.tsx` | ST-58–ST-76 | Pending preview, rollback, status |
| `tests/e2e/commands.spec.ts` | ST-78–ST-84 | Browser integration |
| `packages/react/src/commands.spec.test.tsx` | Existing RD-06 cases plus ST-77 and ST-87–ST-89 | Command regressions, security, local parity |

### Implementation Tests

> Written AFTER implementation. Filed as `.impl.test`.

| Test File | Description | Priority |
| --------- | ----------- | -------- |
| `packages/react/src/commands.lifecycle.impl.test.tsx` | Request record, settlement races, normalization edges, application predicates, retry matrix | High |
| `packages/react/src/commands.impl.test.tsx` | Existing internals plus ID/context/concurrency edges | High |
| `packages/react/src/inspector.impl.test.tsx` | Notices, feedback levels, retry visibility | Medium |
| `packages/react/src/interaction/*.impl.test.tsx` | Pending preview removal and focus edges | Medium |

### Integration Tests

| Test | Components | Description |
| ---- | ---------- | ----------- |
| Controlled accept | Pipeline + state + render | Props apply the accepted item |
| Controlled reject | Pipeline + render + focus | Canonical item and focus restored |
| Prop invalidation | Pipeline + state + interaction | Pending preview clears, response ignored |
| Uncontrolled undo | Pipeline + local reducer | Version and history parity |

### End-to-End Tests

| Scenario | Steps | Expected Result |
| -------- | ----- | --------------- |
| Accept move | Drag, wait for host | New period, pending clears, announcement |
| Reject move | Select reject, drag | Original period, feedback, source focus |
| Stale | Bump revision, drag | `STALE_REVISION`, no change |
| Timeout | Select timeout, drag | `COMMAND_TIMEOUT`, no change |
| Never apply | Select never-apply, drag | `ACCEPTED_NOT_APPLIED`, no phantom success |
| Pending preview | Select delay, drop | Preview before resolve; clear after |
| Capacity | Create third overlapping booking | `CAPACITY_EXCEEDED`, item count unchanged |

## Test Data

### Fixtures Needed

- Controlled items array with `version` values 1, 2 and 3.
- A highlight layer and highlight items for paint tests.
- A capacity-2 dock fixture with two overlapping reservations.
- Deferred host promises and request-ID factories.
- A controlled wrapper that updates props after a tick.

### Mock Requirements

Use real `YearPlanner`, real core helpers and real DOM. Mock only the host
boundary (`validateChange`, `onChangeRequest`) and timers where the test needs a
deterministic deadline. No command, paint or selection helper is mocked.

## Verification Checklist

- [ ] All specification test cases (ST-*) defined with concrete input/output pairs
- [ ] Every ST case traces to a requirement, spec doc, or AR entry
- [ ] Specification tests written BEFORE implementation
- [ ] Specification tests verified to FAIL before implementation (red phase)
- [ ] All specification tests pass after implementation (green phase)
- [ ] Implementation tests written for edge cases and internals
- [ ] All unit / integration / E2E tests pass
- [ ] No regressions in existing tests
- [ ] `pnpm verify:full` passes
- [ ] Storybook and docs builds pass
