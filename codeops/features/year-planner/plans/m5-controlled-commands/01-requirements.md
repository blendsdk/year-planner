# Requirements: Controlled Commands Implementation Plan

> **Document**: 01-requirements.md
> **Parent**: [Index](00-index.md)
> **Source**: [RD-08](../../requirements/RD-08-controlled-commands.md) — the OWNING requirements document

## Scope of this plan (delta view)

The RD owns the requirement text, diagnostic table, state model, failure paths
and acceptance criteria. This file records only what this plan adds or narrows.

### In this plan

- RD-08 Must Haves: command union and context, request identity, per-item
  versions, update patch protection, sync/async validation, outcomes,
  diagnostics, pending state, rollback, stale responses, accepted-not-applied,
  uncontrolled parity, complete paint payloads, create/delete rules, callbacks,
  inspector retry/dismiss, failure mapping, invalid-entity diagnostics and
  prop/window changes. See [RD-08 Must Have](../../requirements/RD-08-controlled-commands.md#must-have).
- RD-08 Should Haves: configurable timeout, abort signal for validation, pending
  visual state and request-ID factory override. See
  [RD-08 Should Have](../../requirements/RD-08-controlled-commands.md#should-have).
- RD-08 Acceptance Criteria 1–17 are the behavior oracle for the spec tests.

### Deferred / out of this plan

- Batch/bulk commands and partial bulk results — RD-08 Won't Have.
- Controlled-host undo history — host-owned; the component only reports
  `UNDO_UNAVAILABLE`.
- Optimistic multi-version merge — hosts own conflict resolution.
- Backend persistence, authorization, tenancy and audit logging — host-owned.
- Full accessibility conformance and announcement policy — RD-09.
- Race/performance/security gate suite and cross-browser matrix expansion — RD-10.
- Full public integration guide and Storybook publication — RD-11; this plan adds
  the command contract guide and the new-state stories needed to verify RD-08.

## Plan-local decisions

| Decision | Chosen | AR Ref |
| -------- | ------ | ------ |
| Public base revision input | Top-level optional `baseRevision` prop | AR-3 |
| Cancellation delivery | Optional third `AbortSignal` argument on host callbacks | AR-4 |
| New diagnostic codes | `CAPACITY_EXCEEDED`, `COMMAND_ABORTED`, `ACCEPTED_NOT_APPLIED`; pipeline uses `STALE_REVISION` | AR-5 |
| Validation severity | Error-level diagnostics block; warnings/info do not | AR-6 |
| Timeout coverage | Host validation plus request; confirmation excluded | AR-7 |
| Outcome trust | Runtime normalization; malformed outcomes map to `HOST_REJECTED` | AR-8 |
| Request identity | Tracked active/settled/obsolete state | AR-9 |
| Prop-change handling | Mark validating/requesting commands obsolete; no failure feedback | AR-10 |
| Application proof | Per-command structural rule against controlled props | AR-11, AR-19 |
| Accepted-not-applied callback | `onChangeCommitted` plus a local diagnostic; not `onChangeRejected` | AR-12 |
| Retry safety | Explicit host rejection for non-delete commands; timeout/thrown only for replay-safe update/move/resize | AR-13 |
| Rollback | No optimistic selection mutation; restore focus to source/fallback | AR-14 |
| Pending preview owner | Interaction layer; pipeline owns pending item IDs | AR-15 |
| Warning display | Bounded inspector notice list | AR-17 |
| Module layout | `commands/` internal split with stable `commands.ts` entry | AR-2 |
| Public handle | Stays `requestCommand(command): void` | AR-21 |
| Browser fixture | `?commands=1` controlled demo plus Playwright | AR-22 |
| Test layout | Separate lifecycle spec and impl files | AR-23 |
| Documentation | New `docs/commands.md` plus existing docs | AR-25 |
| Storybook | `CommandLifecycle` stories for every new state | AR-26 |
| Compatibility | Additive optional API; no dependency | AR-28 |

## Acceptance Criteria

The RD owns AC1–AC17. This plan adds only these delivery criteria:

1. [ ] Every RD-08 specification test case in `07-testing-strategy.md` passes.
2. [ ] Controlled and uncontrolled modes share the same command pipeline,
   diagnostics and focus behavior.
3. [ ] Every new terminal state has a Storybook story.
4. [ ] `pnpm verify:full` passes, including Playwright and the clean consumer.
5. [ ] `docs/commands.md`, the API reports and the changeset are current.
6. [ ] No new dependency and no breaking change to the public props or handle.
