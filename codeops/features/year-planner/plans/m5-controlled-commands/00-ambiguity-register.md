# Ambiguity Register: RD-08 Controlled Commands, Validation and Rollback

> **Status**: ✅ GATE PASSED — all 30 items resolved
> **Last Updated**: 2026-11-11 01:36
> **Authority**: `--auto-design` delegated resolutions; scope follows the user objective “deliver RD-08”
> **Policy version**: 1
> **Root invocation ID**: `yp-rd08-2026-11-11T01-36Z`
> **CodeOps Artifact Schema**: 1

## Scope baseline

- **Planning target**: RD-08 — controlled command requests, request identity and stale-response
  rejection, per-item versions, validation, host outcomes, explicit pending state, rollback of
  preview/selection/focus, accepted-but-not-applied handling, local undo parity and the mock-host
  integration evidence.
- **Context artifacts**: RD-04, RD-05, RD-06, RD-07, RD-08; requirements ambiguity register
  AR-4, AR-6, AR-8, AR-37, AR-38, AR-41, AR-42, AR-55, AR-58; `packages/react/src/commands.ts`;
  `packages/react/src/state.ts`; `packages/react/src/interaction/**`;
  `packages/react/src/YearPlanner.tsx`; `packages/react/src/render/**`;
  `packages/core/src/contracts.ts`; `packages/core/src/diagnostics.ts`;
  `packages/core/src/model/paint.ts`; existing command, interaction and inspector tests.
- **Modification set**: new plan documents, `packages/react/src/commands/**` internal modules,
  `packages/react/src/commands.ts` entry, `packages/react/src/types.ts`,
  `packages/react/src/YearPlanner.tsx`, `packages/react/src/interaction/**`,
  `packages/react/src/render/**`, `packages/core/src/diagnostics.ts`, React/core tests,
  `apps/demo/src/CommandsDemo.tsx` plus the App route, Storybook command-lifecycle stories,
  `tests/e2e/commands.spec.ts`, API reports, docs, changeset and roadmap.
- **Explicitly out of this plan**: batch/bulk commands and partial bulk results; controlled-host
  undo history; optimistic multi-version merge; backend persistence, authorization, tenancy or
  audit logging; RD-09 full accessibility conformance and RD-10 performance/security gate suite.

## Register

| # | Category | Ambiguity / Gap | Options Presented | Resolution | Status |
|---|----------|-----------------|-------------------|------------|--------|
| 1 | Scope | Which RD-08 items this plan implements | All Must Haves and Should Haves / Must Haves only / pull RD-09 forward | **AI — delegated (AR-1):** implement every RD-08 Must Have and all four Should Haves inside the existing command pipeline; no RD-09/RD-10 scope. | ✅ Resolved |
| 2 | Naming | Plan folder and module layout for a growing command surface | Keep one `commands.ts` / split into `commands/` modules / a public command package | **AI — delegated (AR-2):** plan folder `m5-controlled-commands`; internal modules under `packages/react/src/commands/`; keep `commands.ts` as the internal entry point so existing imports stay stable. | ✅ Resolved |
| 3 | Technical | How the host supplies `CommandContext.baseRevision` | Top-level `baseRevision` prop / `interaction.baseRevision` / host-managed request wrapper | **AI — delegated (AR-3):** add top-level `baseRevision?: string` to `YearPlannerProps`; include it in every dispatched context only when defined. | ✅ Resolved |
| 4 | Technical | How an in-flight validation or request is cancelled | No signal / `AbortSignal` inside `CommandContext` / optional third callback argument | **AI — delegated (AR-4):** keep `CommandContext` canonical; pass an optional third `AbortSignal` argument to `validateChange` and `onChangeRequest`; create one controller per command. | ✅ Resolved |
| 5 | Technical | New diagnostic vocabulary for terminal states | Reuse `COMMAND_TIMEOUT`/`HOST_REJECTED` / add the missing RD-08 codes / expose strings only | **AI — delegated (AR-5):** add `COMMAND_ABORTED`, `ACCEPTED_NOT_APPLIED` and the already-specified `CAPACITY_EXCEEDED`; keep `STALE_VERSION` in the core paint helper and map pipeline version mismatches to `STALE_REVISION`. | ✅ Resolved |
| 6 | Behavioral | Validation ordering and severity semantics | Host validation first / local checks first / severity ignored | **AI — delegated (AR-6):** run local checks first, then host validation; any error-level diagnostic blocks even when `permitted` is true; `permitted: false` blocks; warnings and info are displayed but do not block. | ✅ Resolved |
| 7 | Behavioral | What the command timeout covers | Host request only / validation plus request / confirmation too | **AI — delegated (AR-7):** one deadline covers host validation and the host request; local checks and user confirmation are not timed out; accepted-not-applied uses a separate window. | ✅ Resolved |
| 8 | Behavioral | Runtime shape of host outcomes and diagnostics | Trust TypeScript / validate the outcome shape / reject every host result | **AI — delegated (AR-8):** normalize at runtime; malformed outcomes, unknown diagnostic codes and non-string messages map to `HOST_REJECTED` or a typed validation diagnostic; never mutate partially. | ✅ Resolved |
| 9 | Behavioral | Request identity and obsolete responses | Per-item pending flag only / monotonic request IDs / request-ID state machine | **AI — delegated (AR-9):** one generated ID per accepted request, tracked as active/settled/obsolete; an active-ID collision gets a deterministic suffix; a response for a non-active ID is ignored without callbacks, feedback or mutation. | ✅ Resolved |
| 10 | Behavioral | What a prop/window change does to an in-flight command | Ignore the change / abort and roll back / let the response win | **AI — delegated (AR-10):** visibility, year/range or interaction-mode changes invalidate all validating/requesting requests; item changes invalidate only validating requests whose affected IDs changed; during requesting the response settles and the application proof plus an uncontrolled expected-version re-check protect against stale writes. | ✅ Resolved |
| 11 | Behavioral | How accepted-but-not-applied is detected | Never detect / compare props after a timeout / rely on a host callback | **AI — delegated (AR-11):** in controlled mode wait until props reflect the accepted command (ID, version or removal); after `commandTimeoutMs` without reflection, show `ACCEPTED_NOT_APPLIED` and revert to props. | ✅ Resolved |
| 12 | Behavioral | Callback semantics for accepted-but-not-applied | Call `onChangeRejected` / call only `onChangeCommitted` plus a diagnostic / call neither | **AI — delegated (AR-12):** the host accepted, so `onChangeCommitted` fires once; the local application failure emits `ACCEPTED_NOT_APPLIED` through `onDiagnostic` and feedback, not `onChangeRejected`. | ✅ Resolved |
| 13 | Behavioral | Which failures expose a retry action | Every failure / explicit rejection plus replay-safe failures / no retry | **AI — delegated (AR-13):** retry explicit host rejections for create/update/move/resize/paint, and timeouts or thrown host calls only for update/move/resize; never delete, timed-out create/paint, stale, read-only, invalid, confirmation or accepted-not-applied outcomes. | ✅ Resolved |
| 14 | Behavioral | Rollback of selection and focus | Clobber current state / restore a snapshot blindly / preserve user changes | **AI — delegated (AR-14):** commands never optimistically mutate selection; on rejection/timeout restore focus to the source item when visible, otherwise the fallback date; restore the selection snapshot only if the user has not changed selection meanwhile. | ✅ Resolved |
| 15 | UX | Where the pending preview lives | Pipeline-owned / interaction-owned / canonical item mutation | **AI — delegated (AR-15):** the interaction layer owns a list of pending gesture previews until each request settles; the pipeline owns only per-item pending IDs; canonical items are never mutated for a pending request. | ✅ Resolved |
| 16 | UX | How pending, accepted and rejected states are distinguishable | Pending attribute only / status text only / pending styling plus live announcements and inspector feedback | **AI — delegated (AR-16):** keep `data-yp-pending`/`aria-busy`, add a dashed pending style, a polite command-status announcement for every terminal result and inspector feedback for failures. | ✅ Resolved |
| 17 | UX | Where non-blocking warnings and info are displayed | `onDiagnostic` only / inspector notices / a new toast system | **AI — delegated (AR-17):** keep `onDiagnostic` and add a bounded inspector notice list for warning/info diagnostics; dismiss clears feedback and notices. | ✅ Resolved |
| 18 | Data & state | Version invariants across controlled and uncontrolled modes | Global revision only / per-item version only / both | **AI — delegated (AR-18):** per-item positive integer `version` is authoritative; host acceptance returns `version + 1`; the uncontrolled reducer increments by one; undo restores the prior version; redo re-applies the increment; residual paint items start at 1. | ✅ Resolved |
| 19 | Data & state | Exact rule for “the host applied the accepted outcome” | Any props change / exact payload equality / per-command structural rule | **AI — delegated (AR-19):** create = ID present; delete = ID absent; update/move/resize = version advanced; paint = every accepted `updatedItems` entry present at its version and every removed ID absent. | ✅ Resolved |
| 20 | Integration | How revision tokens and callbacks are passed through | Drop `revision` / store it internally / pass it through | **AI — delegated (AR-20):** `CommandOutcome.revision` and `latestRevision` reach the host callbacks unchanged; neither participates in item stale detection. | ✅ Resolved |
| 21 | Integration | Public return type of `requestCommand` | Change the handle to return a promise / keep the public handle void / expose the pipeline | **AI — delegated (AR-21):** the public handle stays `requestCommand(command): void`; the internal pipeline returns `CommandRequestResult` for preview and focus lifecycle. | ✅ Resolved |
| 22 | Integration | How browser evidence is produced | Component tests only / a controlled demo fixture plus E2E / Storybook-only | **AI — delegated (AR-22):** add a `?commands=1` controlled demo with accept/reject/stale/timeout/never-apply modes and a Playwright suite; no new test harness. | ✅ Resolved |
| 23 | Testing | Test files and layers for the lifecycle | One large command test file / split spec and impl files / E2E-only | **AI — delegated (AR-23):** new `commands.lifecycle.spec.test.tsx` and `commands.lifecycle.impl.test.tsx`; extend existing command and interaction tests; E2E in `tests/e2e/commands.spec.ts`. | ✅ Resolved |
| 24 | Process | Verify and commit cadence | `pnpm verify` / `pnpm verify:full` / ad hoc | **AI — delegated (AR-24):** `pnpm verify` after each task, `pnpm verify:full` at each phase and completion; auto-commit follows the user’s milestone directive. | ✅ Resolved |
| 25 | Docs | Where the command contract is documented | Only RD-08 / a dedicated guide plus updates / Storybook only | **AI — delegated (AR-25):** add `docs/commands.md` and update `docs/interaction.md`, `docs/react-view.md`, `docs/security.md`, `docs/test-report.md`, README, changeset and API reports. | ✅ Resolved |
| 26 | Docs | Storybook coverage for the new states | Minimal / all terminal and pending states / skip | **AI — delegated (AR-26):** add a `CommandLifecycle` story file covering pending, accepted, rejected, timeout, stale, accepted-not-applied, warnings, retry and the capacity mock. | ✅ Resolved |
| 27 | Security | Diagnostic and hidden-data handling | Trust host diagnostics / render as text and redact hidden entities / render HTML | **AI — delegated (AR-27):** diagnostics render as text, hidden item details stay redacted, no titles or periods are logged, and UI state never implies authorization. | ✅ Resolved |
| 28 | Compatibility | API and dependency impact | Breaking rewrite / additive surface only / new dependency | **AI — delegated (AR-28):** additive optional props, callback arguments and diagnostic codes; no new dependency; existing RD-06/RD-07 behavior and tests stay green. | ✅ Resolved |
| 29 | Edge cases | Delete confirmation denial | Treat as a failure / treat as a no-op / always request | **AI — delegated (AR-29):** a denied or unavailable confirmation sends no request and produces no rollback feedback; an unavailable handler emits `CONFIRMATION_UNAVAILABLE`. | ✅ Resolved |
| 30 | Edge cases | Accepted paint outcomes with missing or partial payloads | Accept the visual result / reject the outcome / synthesize items | **AI — delegated (AR-30):** in controlled mode every `expectedVersions` source must appear in `updatedItems` or `removedItemIds`; a union must return at least one new item; a missing/partial payload is `HOST_REJECTED` with no mutation. Uncontrolled mode computes the same pure helper result. | ✅ Resolved |

## Delegated resolution provenance

### AR-1 — Scope

```text
Authority: AI — delegated by --auto-design
Eligibility: implementation sequencing inside the confirmed RD-08 scope.
Objective: deliver RD-08 without pulling RD-09/RD-10 work forward.
Decision: implement all four Should Haves and every Must Have; leave accessibility conformance and the full quality gate to later RDs.
Evidence: RD-08 Must Have/Should Have lists; RD-09 owns announcements and the WCAG audit; RD-10 owns the race/performance/security suite.
Rejected alternatives: Must Haves only (drops a required configurable timeout and abort signal); pull RD-09 forward (scope expansion).
Strongest counterargument: `AbortSignal` adds a public callback argument.
Confidence: High — additive and explicitly requested as a Should Have.
Hardening: no new dependency; the third argument is optional.
Policy version: 1 · Root invocation ID: yp-rd08-2026-11-11T01-36Z
Reopen triggers: a Should Have conflicts with RD-04’s canonical contract.
```

### AR-2 — Plan and module names

```text
Authority: AI — delegated by --auto-design
Eligibility: file and module naming inside the React package.
Objective: keep the command hook reviewable and below the split threshold.
Decision: plan `m5-controlled-commands`; internal files `commands/types.ts`, `commands/local.ts`, `commands/validate.ts`, `commands/apply.ts` and `commands/pipeline.ts`, with `commands.ts` as the stable entry.
Evidence: `packages/react/src/commands.ts` is 609 lines; RD-08 adds lifecycle, application and preview wiring.
Rejected alternatives: a single file above 800 lines (violates the split rule); a public command package (unneeded surface).
Strongest counterargument: more files to navigate.
Confidence: High — one concern per module; existing imports stay stable.
Hardening: pure helpers are testable without React; the hook remains the only React boundary.
Policy version: 1 · Root invocation ID: yp-rd08-2026-11-11T01-36Z
Reopen triggers: the modules exceed their responsibility or size boundary.
```

### AR-3 — Base revision source

```text
Authority: AI — delegated by --auto-design
Eligibility: public interface completion required by the canonical `CommandContext`.
Objective: let a host pass a global revision without changing item stale detection.
Decision: add optional top-level `baseRevision`; include it in the context only when defined.
Evidence: RD-04 defines `CommandContext { requestId; baseRevision? }`; RD-08 says it is host-wide pass-through.
Rejected alternatives: `interaction.baseRevision` (mixes transport with interaction config); a host wrapper (forces every caller to wrap commands).
Strongest counterargument: another top-level prop.
Confidence: High — optional and additive.
Hardening: context shape test; undefined is omitted, not stringified.
Policy version: 1 · Root invocation ID: yp-rd08-2026-11-11T01-36Z
Reopen triggers: a host needs per-command revisions instead of one pass-through value.
```

### AR-4 — Abort signal delivery

```text
Authority: AI — delegated by --auto-design
Eligibility: failure and recovery interface design inside the confirmed contract.
Objective: cancel or ignore in-flight work on unmount, timeout and prop changes.
Decision: `validateChange` and `onChangeRequest` receive an optional third `AbortSignal`; `CommandContext` stays unchanged.
Evidence: RD-08 Should Have asks for an AbortSignal for in-flight validation; the canonical context type is owned by RD-04.
Rejected alternatives: add `signal` to `CommandContext` (changes the canonical public type); internal-only cancellation (host work continues).
Strongest counterargument: a third positional argument is less discoverable.
Confidence: High — existing two-argument functions remain assignable.
Hardening: abort is advisory; late results are ignored even when the host ignores the signal.
Policy version: 1 · Root invocation ID: yp-rd08-2026-11-11T01-36Z
Reopen triggers: the host contract needs a cancellation token carried in the context.
```

### AR-5 — Diagnostic codes

```text
Authority: AI — delegated by --auto-design
Eligibility: additive vocabulary inside the existing diagnostic model.
Objective: give abort and accepted-not-applied stable, typed outcomes.
Decision: add `COMMAND_ABORTED`, `ACCEPTED_NOT_APPLIED` and the already-specified `CAPACITY_EXCEEDED`; use `STALE_REVISION` for pipeline version mismatches.
Evidence: RD-08 names all three codes in its diagnostic table; the core union currently has none of them; AC6 and ST-49/ST-77 depend on `CAPACITY_EXCEEDED`.
Rejected alternatives: reuse `HOST_REJECTED` (loses the stable capacity distinction); string codes (breaks the typed union and API report).
Strongest counterargument: the union grows by three entries.
Confidence: High — additive, no existing code changes meaning.
Hardening: independent preflight challenger flagged the missing capacity code; pipeline maps the core paint `STALE_VERSION` to `STALE_REVISION` before host dispatch.
Policy version: 1 · Root invocation ID: yp-rd08-2026-11-11T01-36Z
Reopen triggers: a later RD consolidates diagnostic codes.
```

### AR-6 — Validation severity

```text
Authority: AI — delegated by --auto-design
Eligibility: validation ordering and failure design.
Objective: make local safety checks authoritative and warnings non-blocking.
Decision: local checks → host validation; any error-level diagnostic blocks; `permitted: false` blocks even without errors; warnings/info are surfaced and the command continues.
Evidence: RD-08 says local checks run first and errors block while warnings/info do not.
Rejected alternatives: trust `permitted` only (a host could permit an error); block on every diagnostic (contradicts the warning rule).
Strongest counterargument: a host may use warning severity for a hard policy.
Confidence: High — the requirement is explicit.
Hardening: tests cover error + permitted true, warnings + permitted true, and permitted false with no diagnostics.
Policy version: 1 · Root invocation ID: yp-rd08-2026-11-11T01-36Z
Reopen triggers: hosts need a force-block warning flag.
```

### AR-7 — Timeout scope

```text
Authority: AI — delegated by --auto-design
Eligibility: failure and recovery design.
Objective: terminate a stuck host call without interrupting user confirmation.
Decision: one `commandTimeoutMs` deadline covers host validation and the host request; delete confirmation is outside it; accepted-not-applied uses a separate `commandTimeoutMs` window.
Evidence: RD-08 Should Have defaults 15s; the existing pipeline only times the request.
Rejected alternatives: include confirmation (a modal can legitimately stay open); separate timeout per phase (more configuration than the RD asks for).
Strongest counterargument: a slow validation now consumes the request budget.
Confidence: High — one predictable deadline matches the RD wording.
Hardening: timers are cleared on every settlement; late results are ignored.
Policy version: 1 · Root invocation ID: yp-rd08-2026-11-11T01-36Z
Reopen triggers: hosts need independent validation and request budgets.
```

### AR-8 — Outcome normalization

```text
Authority: AI — delegated by --auto-design
Eligibility: defensive integration behavior inside the accepted contract.
Objective: never partially mutate state from an untrusted host result.
Decision: runtime-normalize the outcome and diagnostics; malformed data becomes `HOST_REJECTED` (or `VALIDATION_ERROR` during validation) with a generic message.
Evidence: RD-08 failure paths require malformed outcomes to map to `HOST_REJECTED` with no partial mutation.
Rejected alternatives: trust TypeScript (runtime hosts are untyped); throw to the host (loses the feedback path).
Strongest counterargument: extra defensive code.
Confidence: High — a thin type guard plus normalization is proportionate.
Hardening: never echo an unknown message or code into the UI.
Policy version: 1 · Root invocation ID: yp-rd08-2026-11-11T01-36Z
Reopen triggers: the host contract publishes a versioned outcome schema.
```

### AR-9 — Request identity and obsolete responses

```text
Authority: AI — delegated by --auto-design
Eligibility: concurrency and consistency mechanism.
Objective: ensure a response can only settle the request that is still current.
Decision: track each request as active/settled/obsolete; ignore responses for non-active IDs without callbacks, feedback or mutation.
Evidence: `commands.ts` already creates request IDs and checks `inFlight`, but has no explicit obsolete state; RD-08 requires unique IDs and ignored obsolete responses.
Rejected alternatives: compare item IDs only (two commands on one item in sequence); rely on promise cancellation (hosts may ignore the signal).
Strongest counterargument: a small state machine.
Confidence: High — directly required by AC3 and AC13.
Hardening: tests cover late timeout responses, prop-change cancellation, duplicate-item rejection and an active-ID collision suffix.
Policy version: 1 · Root invocation ID: yp-rd08-2026-11-11T01-36Z
Reopen triggers: batch commands need per-item request IDs.
```

### AR-10 — Prop-change invalidation

```text
Authority: AI — delegated by --auto-design
Eligibility: concurrency and recovery design.
Objective: never commit geometry computed from a stale layout.
Decision: visibility, year/range or interaction-mode changes invalidate every validating/requesting request; an item change invalidates only a validating request whose affected IDs changed; during requesting the response settles and application proof plus an uncontrolled expected-version re-check protect against stale writes.
Evidence: RD-08 AC13 and the RD-07 cancellation pattern; the ribbon signature includes every item, so a host acceptance can change it before the response continuation.
Rejected alternatives: abort on every item change (races synchronous acceptance and cancels unrelated items); ignore item changes entirely (stale uncontrolled apply); a synchronous-applied guard for only non-paint commands (incomplete).
Strongest counterargument: per-request invalidation needs affected-ID bookkeeping.
Confidence: High — it preserves both AC13 and “unrelated items may proceed”.
Hardening: independent preflight challenger recommended this refinement; tests cover affected, unrelated and requesting-phase changes.
Policy version: 1 · Root invocation ID: yp-rd08-2026-11-11T01-36Z
Reopen triggers: batch commands or cross-item transactions are introduced.
```

### AR-11 — Accepted-not-applied detection

```text
Authority: AI — delegated by --auto-design
Eligibility: consistency and recovery mechanism.
Objective: avoid showing a success that the controlled props never reflect.
Decision: wait for the props to reflect the accepted command using the per-command structural rule in AR-19; after `commandTimeoutMs`, emit `ACCEPTED_NOT_APPLIED` and clear the pending overlay.
Evidence: RD-08 requires this terminal state and says the UI reverts to props.
Rejected alternatives: trust the host's accepted flag (phantom success); require a host callback (extra surface).
Strongest counterargument: a slow host may need more than the timeout.
Confidence: High — the timeout is configurable.
Hardening: tests cover immediate apply, late apply and never-apply.
Policy version: 1 · Root invocation ID: yp-rd08-2026-11-11T01-36Z
Reopen triggers: hosts request a separate application timeout.
```

### AR-12 — Accepted-not-applied callback semantics

```text
Authority: AI — delegated by --auto-design
Eligibility: failure and recovery design; no product scope change.
Objective: keep the host callback contract truthful.
Decision: `onChangeCommitted` fires once on host acceptance; `ACCEPTED_NOT_APPLIED` is a local diagnostic and inspector feedback, not `onChangeRejected`.
Evidence: RD-08 calls `onChangeCommitted` with the authoritative outcome; the host did accept.
Rejected alternatives: fire `onChangeRejected` (misreports the host result); fire neither (host loses audit evidence).
Strongest counterargument: a host may want one terminal callback.
Confidence: Med — the RD does not spell out this edge.
Hardening: the diagnostic is delivered through `onDiagnostic` and rendered textually; no silent failure.
Policy version: 1 · Root invocation ID: yp-rd08-2026-11-11T01-36Z
Reopen triggers: a host contract requires a single terminal callback per command.
```

### AR-13 — Retry safety

```text
Authority: AI — delegated by --auto-design
Eligibility: failure recovery design inside the existing retry surface.
Objective: offer retry only where replay cannot duplicate a destructive action.
Decision: retry explicit host rejections for create/update/move/resize/paint; retry timeouts and thrown host calls only for update/move/resize; never retry delete, a timed-out create/paint, or permanent failures.
Evidence: RD-08 says retry “where safe”; the inspector already exposes retry.
Rejected alternatives: retry everything (a timed-out or thrown create/paint may already have landed); retry nothing (drops a useful recovery path).
Strongest counterargument: a thrown host call may have applied before it threw.
Confidence: Med — the replay-safety boundary is a judgement call.
Hardening: explicit host rejection means the host said no; timed-out/thrown update/move/resize target an explicit state and are guarded by the expected version; a retried create still runs the duplicate-ID check; timed-out or thrown paint is excluded because a replay could create a second residual set.
Policy version: 1 · Root invocation ID: yp-rd08-2026-11-11T01-36Z
Reopen triggers: hosts provide idempotency keys tied to request IDs.
```

### AR-14 — Selection and focus rollback

```text
Authority: AI — delegated by --auto-design
Eligibility: recovery design inside the existing selection/focus lifecycle.
Objective: restore the user’s place without clobbering newer intent.
Decision: commands never optimistically mutate selection; on failure restore focus to the source item when visible, otherwise the fallback date; restore the old selection only if it is still current.
Evidence: the current pipeline applies local items only after acceptance; gesture focus is handled in `interaction/commit.ts`.
Rejected alternatives: blindly reset selection (loses a newer click); no focus restoration (violates the RD).
Strongest counterargument: selection rollback becomes a no-op in most paths.
Confidence: High — “preserve newer intent” is the safer invariant.
Hardening: tests assert selection is unchanged after rejection and focus returns to the source item.
Policy version: 1 · Root invocation ID: yp-rd08-2026-11-11T01-36Z
Reopen triggers: optimistic selection changes are introduced.
```

### AR-15 — Pending preview ownership

```text
Authority: AI — delegated by --auto-design
Eligibility: internal architecture and UI state.
Objective: show the proposed drop position until the host settles without mutating canonical items.
Decision: the interaction layer keeps a list of pending gesture previews; the pipeline keeps per-item pending IDs; no command or preview type crosses into the core.
Evidence: the current preview disappears when the gesture becomes idle (`useInteraction.ts:341,606-621`).
Rejected alternatives: pipeline-owned preview (couples commands to UI); canonical optimistic items (violates controlled truth).
Strongest counterargument: duplicate pending state in two layers.
Confidence: High — each layer owns its concern.
Hardening: previews are aria-hidden and pointer-events none.
Policy version: 1 · Root invocation ID: yp-rd08-2026-11-11T01-36Z
Reopen triggers: non-gesture commands need previews.
```

### AR-16 — Pending and terminal visuals

```text
Authority: AI — delegated by --auto-design
Eligibility: presentation within the RD-defined states.
Objective: make pending unmistakable and announce every terminal outcome.
Decision: keep `data-yp-pending`/`aria-busy`, add a dashed pending outline, a polite command-status live region for accepted/rejected/not-applied, and inspector feedback for failures.
Evidence: `ItemLayer` already emits pending attributes but no pending style; RD-08 AC14 requires announcements.
Rejected alternatives: a toast system (new surface); color-only pending state (accessibility).
Strongest counterargument: another live region.
Confidence: High — minimal and consistent with the existing focus announcer.
Hardening: text is plain; no diagnostic HTML.
Policy version: 1 · Root invocation ID: yp-rd08-2026-11-11T01-36Z
Reopen triggers: RD-09 replaces the announcement policy.
```

### AR-17 — Warning display

```text
Authority: AI — delegated by --auto-design
Eligibility: presentation and state handling for non-blocking diagnostics.
Objective: display warnings without creating an acknowledgement workflow.
Decision: add a bounded `notices` list to the pipeline, rendered in the inspector; `dismiss` clears feedback and notices.
Evidence: RD-08 says warnings/info are displayed but do not block; the inspector already owns feedback.
Rejected alternatives: `onDiagnostic` only (the component would not display them); a modal (blocks).
Strongest counterargument: notices can accumulate.
Confidence: High — cap at five and clear on dismiss.
Hardening: tests cover warning + successful commit.
Policy version: 1 · Root invocation ID: yp-rd08-2026-11-11T01-36Z
Reopen triggers: hosts need a persistent audit log in the UI.
```

### AR-18 — Version invariants

```text
Authority: AI — delegated by --auto-design
Eligibility: data-state design inside the canonical item contract.
Objective: make concurrent edits detectable and undo faithful.
Decision: per-item positive integer version is authoritative; accepted host items use version + 1; uncontrolled increments; undo restores the prior version; redo re-applies; paint residuals start at 1.
Evidence: RD-08 explicit version rules; `PlannerItem.version` is already required and validated (`validation.ts:350`).
Rejected alternatives: global revision only (cannot isolate an item); host-owned versions in uncontrolled mode (breaks local undo).
Strongest counterargument: the host must remember to increment.
Confidence: High — required by the RD.
Hardening: tests cover update v→v+1, undo v, redo v+1 and stale v.
Policy version: 1 · Root invocation ID: yp-rd08-2026-11-11T01-36Z
Reopen triggers: a host can prove a different optimistic-concurrency scheme is needed.
```

### AR-19 — Applied rule

```text
Authority: AI — delegated by --auto-design
Eligibility: consistency check inside the controlled contract.
Objective: decide when props prove the accepted change landed.
Decision: create = ID present; delete = ID absent; update/move/resize = version advanced; paint = every accepted `updatedItems` entry present at its version and every removed ID absent.
Evidence: RD-08 requires `updatedItems` for paint and version + 1 on acceptance.
Rejected alternatives: any new array reference (controlled hosts may recreate equal arrays); exact deep equality to the whole item (hosts may add metadata).
Strongest counterargument: a host that batches multiple changes may satisfy the rule early.
Confidence: High — the rule is narrow and testable.
Hardening: the waiter also checks immediately after registration.
Policy version: 1 · Root invocation ID: yp-rd08-2026-11-11T01-36Z
Reopen triggers: hosts apply changes without version increments.
```

### AR-20 — Revision pass-through

```text
Authority: AI — delegated by --auto-design
Eligibility: integration pass-through inside the canonical outcome.
Objective: preserve the host’s authoritative token without using it for stale detection.
Decision: pass `revision` and `latestRevision` unchanged to the callbacks.
Evidence: requirements ambiguity register AR-41; RD-08 explicitly separates the tokens from item versions.
Rejected alternatives: store them in the component (unused state); use them for staleness (contradicts AR-41).
Strongest counterargument: unused data in the callback? It is the host’s own token.
Confidence: High — no behavior change.
Hardening: a callback test asserts the token is unchanged.
Policy version: 1 · Root invocation ID: yp-rd08-2026-11-11T01-36Z
Reopen triggers: a future RD promotes the revision to stale detection.
```

### AR-21 — Request return type

```text
Authority: AI — delegated by --auto-design
Eligibility: internal interface design.
Objective: let the interaction layer distinguish ignored, accepted, rejected and accepted-not-applied without changing the public handle.
Decision: keep the handle void; the pipeline returns `CommandRequestResult`.
Evidence: `YearPlannerHandle.requestCommand` is public; `CommandPipeline` is package-internal.
Rejected alternatives: expose a promise on the handle (public compatibility surface); boolean only (cannot distinguish ignored).
Strongest counterargument: two similar command APIs.
Confidence: High — the public contract stays stable.
Hardening: type-level tests and API report.
Policy version: 1 · Root invocation ID: yp-rd08-2026-11-11T01-36Z
Reopen triggers: hosts need settlement promises from the handle.
```

### AR-22 — Browser evidence

```text
Authority: AI — delegated by --auto-design
Eligibility: testing strategy and demo fixture design.
Objective: prove rollback, timeout and pending states in a real browser.
Decision: add a `?commands=1` controlled fixture with host modes and a Playwright suite; no new harness.
Evidence: `tests/e2e/interaction.spec.ts` already drives `?interaction=1`; Playwright config is established.
Rejected alternatives: component tests only (no real layout/pending proof); Storybook-only (not a deterministic browser gate).
Strongest counterargument: another demo fixture.
Confidence: High — reuses the existing pattern.
Hardening: deterministic modes; no arbitrary sleeps beyond the bounded host timeout.
Policy version: 1 · Root invocation ID: yp-rd08-2026-11-11T01-36Z
Reopen triggers: the touch/visual projects need the same fixture.
```

### AR-23 — Test files

```text
Authority: AI — delegated by --auto-design
Eligibility: testing strategy.
Objective: keep specification tests immutable and implementation tests separate.
Decision: new `commands.lifecycle.spec.test.tsx` for ST cases, `commands.lifecycle.impl.test.tsx` for internals, extend existing command/interaction suites, E2E in `tests/e2e/commands.spec.ts`.
Evidence: the project uses `.spec.test` and `.impl.test` consistently.
Rejected alternatives: one large file (loses the oracle boundary); E2E-only (slow and hard to isolate).
Strongest counterargument: more test files.
Confidence: High — matches the standards.
Hardening: spec tests cite behavior in plain language, not AR/ST ids.
Policy version: 1 · Root invocation ID: yp-rd08-2026-11-11T01-36Z
Reopen triggers: the lifecycle needs a pure helper module without React.
```

### AR-24 — Verify and commit

```text
Authority: AI — delegated by --auto-design (process); user directive (commit mode)
Eligibility: process inside the invoked workflow.
Objective: keep CI green with incremental evidence.
Decision: `pnpm verify` after each task, `pnpm verify:full` at each phase and completion; commit and push after verified tasks per the user’s milestone directive.
Evidence: repository scripts; prior milestone practice.
Rejected alternatives: one final verify (poor recovery).
Strongest counterargument: full verify is slow.
Confidence: High — matches prior slices.
Hardening: CI watch after each push.
Policy version: 1 · Root invocation ID: yp-rd08-2026-11-11T01-36Z
Reopen triggers: the user changes commit mode or verify policy.
```

### AR-25 — Documentation

```text
Authority: AI — delegated by --auto-design
Eligibility: documentation surface inside the RD.
Objective: document the host contract where a host developer will look.
Decision: add `docs/commands.md`; update interaction, react-view, security, test-report, README and API reports.
Evidence: `docs/interaction.md:121` already shows a basic host example; the lifecycle is missing.
Rejected alternatives: RD-only (not a developer guide); Storybook-only (poor search).
Strongest counterargument: RD-11 owns final documentation.
Confidence: High — RD-08 explicitly owns the integration contract.
Hardening: docs examples compile against the public types.
Policy version: 1 · Root invocation ID: yp-rd08-2026-11-11T01-36Z
Reopen triggers: RD-11 restructures the docs set.
```

### AR-26 — Storybook

```text
Authority: User directive + AI implementation
Eligibility: documentation surface within the standing “as many stories as possible” mandate.
Objective: make every new command state inspectable.
Decision: add `CommandLifecycle.stories.tsx` with pending, accepted, rejected, timeout, stale, accepted-not-applied, warning, retry and capacity-mock stories.
Evidence: 144 existing stories across 10 files; RD-08 adds distinct terminal states.
Rejected alternatives: static code snippets only (no interaction); E2E-only (not browsable).
Strongest counterargument: some states need timers and are awkward in Storybook.
Confidence: High — use deferred promises and explicit triggers.
Hardening: each story has a deterministic trigger button or play function.
Policy version: 1 · Root invocation ID: yp-rd08-2026-11-11T01-36Z
Reopen triggers: Storybook cannot represent a state deterministically.
```

### AR-27 — Security

```text
Authority: AI — delegated by --auto-design
Eligibility: security mechanism within the approved security policy.
Objective: never leak hidden data or imply authorization.
Decision: render diagnostics as text, keep hidden-item diagnostics redacted, never log titles/periods, and treat UI state as presentation only.
Evidence: RD-08 security section; requirements ambiguity register AR-24/AR-53 and the existing hidden-item test.
Rejected alternatives: trust host messages as HTML (XSS); use read-only flags as authorization (host-owned).
Strongest counterargument: host messages may still contain sensitive text supplied by the host.
Confidence: High — the component only displays what the host returns; documentation states the boundary.
Hardening: text rendering; no `dangerouslySetInnerHTML`.
Policy version: 1 · Root invocation ID: yp-rd08-2026-11-11T01-36Z
Reopen triggers: a host needs rich diagnostic content.
```

### AR-28 — Compatibility

```text
Authority: AI — delegated by --auto-design
Eligibility: compatibility and dependency policy.
Objective: harden the lifecycle without breaking the existing package.
Decision: additive optional props, callback arguments and diagnostic codes only; no dependency; ESM-only package unchanged.
Evidence: RD-08 adds no new runtime capability; `packages/react/package.json` has no new dependency need.
Rejected alternatives: rewrite the pipeline behind a new API (breaks hosts); add a state library (unneeded).
Strongest counterargument: the internal module split changes file layout.
Confidence: High — internal imports are stable through `commands.ts`.
Hardening: existing 309 React tests and API reports.
Policy version: 1 · Root invocation ID: yp-rd08-2026-11-11T01-36Z
Reopen triggers: a breaking change is approved.
```

### AR-29 — Delete confirmation

```text
Authority: AI — delegated by --auto-design
Eligibility: failure/recovery design for a destructive command.
Objective: keep a denial as a no-op.
Decision: a denied confirmation sends no request and produces no rollback feedback; an unavailable handler emits `CONFIRMATION_UNAVAILABLE`.
Evidence: RD-08 says a rejected confirmation is a no-op, not a rollback error; the current pipeline already returns false without feedback.
Rejected alternatives: show a failure (misleading); proceed without confirmation (unsafe).
Strongest counterargument: the user gets no feedback when denying.
Confidence: High — denial is the user’s intent.
Hardening: test both denied and unavailable paths.
Policy version: 1 · Root invocation ID: yp-rd08-2026-11-11T01-36Z
Reopen triggers: a host wants analytics on denials.
```

### AR-30 — Paint accepted payload

```text
Authority: AI — delegated by --auto-design
Eligibility: data consistency rule inside the canonical paint contract.
Objective: ensure residual split items and removals are applied atomically.
Decision: in controlled mode every `expectedVersions` source must appear in `updatedItems` or `removedItemIds`; a union must return at least one new item (an ID outside `expectedVersions`, version 1); a missing or partial payload is `HOST_REJECTED` with no mutation. Uncontrolled mode computes the same result through the pure helper.
Evidence: RD-08 says controlled accepted paint outcomes must include the complete post-operation set; paint can create residuals, leave non-matching items and remove sources. RD-08 also says uncontrolled mode applies the same pure helper.
Rejected alternatives: accept a visual-only or empty controlled outcome (phantom success); synthesize locally in controlled mode (violates host authority); require every paint to return a non-empty `updatedItems` (erase-to-empty is valid); reject an uncontrolled payload omission (the component owns local truth).
Strongest counterargument: a host that applies props itself and returns a different but equivalent shape.
Confidence: High — the RD is explicit for controlled mode and for the uncontrolled helper.
Hardening: independent preflight challenger flagged the presence-only check; tests cover controlled erase-to-empty, residuals, a missing source, an empty union and an uncontrolled payload omission.
Policy version: 1 · Root invocation ID: yp-rd08-2026-11-11T01-36Z
Reopen triggers: a future RD allows server-computed paint diffs without payloads.
```

## Gate result

Every row is resolved or explicitly scoped out. No reserved-authority decision remains: the plan
adds only additive optional API, and no product scope, acceptance criterion or compatibility break
is changed. The next plan document may be written.
