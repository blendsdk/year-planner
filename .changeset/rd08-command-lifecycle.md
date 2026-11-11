---
"@blendsdk/year-planner-core": minor
"@blendsdk/react-year-planner": minor
---

Controlled command lifecycle for the year planner:

- request IDs, obsolete-response rejection, one deadline for host validation and
  the host request, optional abort signals and unmount cancellation;
- per-item versions, `expectedVersion`/`STALE_REVISION`, runtime update-patch
  protection and complete paint payloads;
- local and host validation severity, normalized diagnostics and warning notices;
- explicit pending state with retained gesture previews and pending item styling;
- accepted-not-applied detection against controlled props;
- rollback of previews and focus, selection preservation and ignored stale
  responses;
- a safe retry matrix and polite terminal-outcome announcements.

Additive APIs: `YearPlannerProps.baseRevision`, an optional third `AbortSignal`
argument on `validateChange`/`onChangeRequest`, and the
`CAPACITY_EXCEEDED`, `COMMAND_ABORTED` and `ACCEPTED_NOT_APPLIED` diagnostic
codes (`isDiagnosticCode` is exported for runtime normalization).

Core paint residuals and new items remain `version: 1`; uncontrolled undo
restores the prior version and redo re-applies the increment.
