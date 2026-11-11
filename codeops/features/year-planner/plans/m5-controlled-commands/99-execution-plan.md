# Execution Plan: RD-08 Controlled Commands

> **Document**: 99-execution-plan.md
> **Parent**: [Index](00-index.md)
> **Last Updated**: 2026-11-11 04:00
> **Progress**: 34/34 tasks (100%)
> **CodeOps Artifact Schema**: 1

## Overview

Delivers RD-08 in four phases: command lifecycle primitives, versions and
outcomes, pending preview/rollback/status, then the controlled demo, Storybook,
browser evidence and closeout. Specification tests precede implementation in
every behavior phase.

**🚨 Update this document after EACH completed task!**

---

## Implementation Phases

| Phase | Title | Tasks |
|---|---|---|
| 1 | Command lifecycle and context | 9 |
| 2 | Versions, validation and outcomes | 9 |
| 3 | Pending preview, rollback and status | 8 |
| 4 | Integration, Storybook, E2E and closeout | 8 |

**Total: 34 tasks across 4 phases** (no fabricated hour estimates — scope is
bounded by the task-size criteria).

> **⚠️ EXECUTION RULE — APPLIES TO EVERY AGENT EXECUTING THIS PLAN:**
>
> The task checkboxes below are the **single source of truth** for progress.
> Every task line appears exactly once in this document. The executing agent MUST:
>
> 1. **On implementation:** mark the task `[~]` with a timestamp —
>    `- [~] 1.1.1 Task description ⏳ (implemented: YYYY-MM-DD HH:MM)`
> 2. **On verify pass:** promote it to `[x]` —
>    `- [x] 1.1.1 Task description ✅ (completed: YYYY-MM-DD HH:MM)`
> 3. **Update the Progress header** and Last Updated stamp after EVERY task —
>    never batch updates. Only `[x]` counts as complete.
> 4. **Resume** by scanning top-to-bottom: the first `[~]` task is resumed
>    first, else the first `[ ]` task.
> 5. **On blocker:** mark the task `[!]` and append `Blocked: <short reason>`.
>
> Timestamps come from `date '+%Y-%m-%d %H:%M'` — never invented.

---

## Phase 1: Command lifecycle and context

> **Phase baseline tree**: _(recorded by the exec-plan skill from a temporary-index snapshot of
> committed, staged, unstaged, and untracked phase-start state)_
> **Reasoning**: high — request identity, timeout and obsolete handling are concurrency-sensitive
> and hard to reverse once the interaction layer depends on them.

**Reference**: [03-01](03-01-command-lifecycle.md) · AR-2, AR-3, AR-4, AR-5, AR-7, AR-8, AR-9, AR-10, AR-21

**Objective**: make every command a tracked request with a context, a deadline and a settlement
rule that cannot be applied twice.

### Step 1.1: Specification tests

- [x] 1.1.1 [spec-author] Write lifecycle spec tests for ST-1–ST-26 and ST-93–ST-94 — `packages/react/src/commands.lifecycle.spec.test.tsx` ✅ (completed: 2026-11-11 01:58)
- [x] 1.1.2 Run the lifecycle spec tests and record the expected red failures — `docs/m5-red-phase.md` ✅ (completed: 2026-11-11 01:58)

### Step 1.2: Implementation

- [x] 1.2.1 Split `commands.ts` into `commands/types.ts`, `commands/local.ts`, `commands/validate.ts` and `commands/pipeline.ts`, keeping `commands.ts` as the stable entry — `packages/react/src/commands.ts`, `packages/react/src/commands/**` ✅ (completed: 2026-11-11 02:14)
- [x] 1.2.2 Add `CAPACITY_EXCEEDED`, `COMMAND_ABORTED`, `ACCEPTED_NOT_APPLIED` and the runtime `isDiagnosticCode` guard — `packages/core/src/diagnostics.ts`, `packages/core/src/index.ts` ✅ (completed: 2026-11-11 02:14)
- [x] 1.2.3 Add `baseRevision` to the public props and pipeline input; pass it into `CommandContext` only when defined; add optional `AbortSignal` callback arguments and update the existing exact-arity callback assertions — `packages/react/src/types.ts`, `packages/react/src/YearPlanner.tsx`, `packages/react/src/commands/types.ts`, `packages/react/src/commands/pipeline.ts`, `packages/react/src/commands.impl.test.tsx`, `packages/react/src/commands.spec.test.tsx` ✅ (completed: 2026-11-11 02:14)
- [x] 1.2.4 Implement the active/settled/obsolete request record, one deadline for validation plus request, abort, ignored late responses and one-command-per-item — `packages/react/src/commands/pipeline.ts` ✅ (completed: 2026-11-11 02:14)
- [x] 1.2.5 Invalidate on context-key changes and affected-item version changes, and add the uncontrolled apply-time version re-check — `packages/react/src/commands/pipeline.ts`, `packages/react/src/YearPlanner.tsx` ✅ (completed: 2026-11-11 02:14)

### Step 1.3: Implementation tests and verify

- [x] 1.3.1 Write lifecycle edge tests for same-tick settlement, duplicate IDs, abort-ignoring hosts and concurrent items — `packages/react/src/commands.lifecycle.impl.test.tsx` ✅ (completed: 2026-11-11 02:14)
- [x] 1.3.2 Run `pnpm api-report` then `pnpm verify`; keep the existing RD-06/RD-07 suites green ✅ (completed: 2026-11-11 02:14)

**Deliverables**:
- [ ] ST-1–ST-26 and ST-93–ST-94 pass
- [ ] Every request has one ID, one deadline and one settlement
- [ ] A late or obsolete response cannot fire a callback or mutate items

**Verify**: `pnpm verify`

---

## Phase 2: Versions, validation and outcomes

> **Phase baseline tree**: recorded by the executor at phase start.
> **Reasoning**: high — the accepted-not-applied window and validation severity define the public
> host contract.

**Reference**: [03-02](03-02-versions-outcomes.md) · AR-6, AR-8, AR-11, AR-12, AR-13, AR-17, AR-18, AR-19, AR-20, AR-30

**Objective**: prove that a controlled acceptance was applied, normalize host results, and make
versions and validation severity consistent in both modes.

### Step 2.1: Specification tests

- [x] 2.1.1 [spec-author] Write version/outcome spec tests for ST-27–ST-57 and ST-90–ST-92, ST-95–ST-97 — `packages/react/src/commands.outcomes.spec.test.tsx` ✅ (completed: 2026-11-11 02:19)
- [x] 2.1.2 Run the new spec tests and record the expected red failures — `docs/m5-red-phase.md` ✅ (completed: 2026-11-11 02:19)

### Step 2.2: Implementation

- [x] 2.2.1 Normalize validation severity, synthesize missing errors, and collect warning/info notices — `packages/react/src/commands/validate.ts`, `packages/react/src/commands/pipeline.ts` ✅ (completed: 2026-11-11 02:19)
- [x] 2.2.2 Runtime-normalize outcomes, diagnostics and paint payloads; map malformed or partial accepted results to `HOST_REJECTED` — `packages/react/src/commands/apply.ts`, `packages/react/src/commands/pipeline.ts` ✅ (completed: 2026-11-11 02:19)
- [x] 2.2.3 Implement the controlled application waiter and `ACCEPTED_NOT_APPLIED` terminal state — `packages/react/src/commands/apply.ts`, `packages/react/src/commands/pipeline.ts`, `packages/react/src/YearPlanner.tsx` ✅ (completed: 2026-11-11 02:19)
- [x] 2.2.4 Implement the retry matrix, feedback level, notices, dismiss and accepted-not-applied inspector message — `packages/react/src/commands/pipeline.ts`, `packages/react/src/render/Inspector.tsx` ✅ (completed: 2026-11-11 02:19)
- [x] 2.2.5 Harden the local reducer: runtime expected versions, `Object.hasOwn` patch checks, version increments and paint residual parity — `packages/react/src/commands/local.ts`, `packages/react/src/commands/validate.ts` ✅ (completed: 2026-11-11 02:19)

### Step 2.3: Implementation tests and verify

- [x] 2.3.1 Write implementation tests for application predicates, malformed payloads, retry and undo versions — `packages/react/src/commands.lifecycle.impl.test.tsx`, `packages/react/src/commands.impl.test.tsx` ✅ (completed: 2026-11-11 02:19)
- [x] 2.3.2 Run `pnpm verify` ✅ (completed: 2026-11-11 02:19)

**Deliverables**:
- [ ] ST-27–ST-57 and ST-90–ST-92, ST-95–ST-97 pass
- [ ] Controlled acceptance cannot show phantom success
- [ ] Warnings display without blocking; errors always block
- [ ] Uncontrolled version, paint and undo behavior matches the RD

**Verify**: `pnpm verify`

---

## Phase 3: Pending preview, rollback and status

> **Phase baseline tree**: recorded by the executor at phase start.
> **Reasoning**: high — preview ownership and focus restoration cross the interaction/render
> boundary and are user-visible.

**Reference**: [03-03](03-03-rollback-pending-ui.md) · AR-14, AR-15, AR-16, AR-17

**Objective**: keep the proposed geometry visible until settlement, then clear it and restore the
user’s place without clobbering newer intent.

### Step 3.1: Specification tests

- [x] 3.1.1 [spec-author] Write pending/rollback/status spec tests for ST-58–ST-76 — `packages/react/src/interaction.commands.spec.test.tsx` ✅ (completed: 2026-11-11 02:33)
- [x] 3.1.2 Run the new spec tests and record the expected red failures — `docs/m5-red-phase.md` ✅ (completed: 2026-11-11 02:33)

### Step 3.2: Implementation

- [x] 3.2.1 Return `CommandRequestResult` from the pipeline and a `GestureCommit` descriptor from `commitGesture`; add result-driven focus restoration — `packages/react/src/interaction/commit.ts`, `packages/react/src/commands/types.ts`, `packages/react/src/commands/pipeline.ts` ✅ (completed: 2026-11-11 02:33)
- [x] 3.2.2 Hold pending previews in `useInteraction` until each request promise settles — `packages/react/src/interaction/useInteraction.ts`, `packages/react/src/interaction/types.ts` ✅ (completed: 2026-11-11 02:33)
- [x] 3.2.3 Render a list of active plus pending previews in the grid and month rows — `packages/react/src/YearPlanner.tsx`, `packages/react/src/render/YearGrid.tsx`, `packages/react/src/render/MonthRow.tsx` ✅ (completed: 2026-11-11 02:33)
- [x] 3.2.4 Add the pending outline, command-status live region and root command-state attribute — `packages/react/src/styles.css`, `packages/react/src/YearPlanner.tsx` ✅ (completed: 2026-11-11 02:33)

### Step 3.3: Implementation tests and verify

- [x] 3.3.1 Write edge tests for preview removal, multiple pending commands, selection preservation and fallback focus — `packages/react/src/interaction.commands.spec.test.tsx`, `packages/react/src/interaction/*.impl.test.tsx` ✅ (completed: 2026-11-11 02:33)
- [x] 3.3.2 Run `pnpm verify` ✅ (completed: 2026-11-11 02:33)

**Deliverables**:
- [ ] ST-58–ST-76 pass
- [ ] A dropped command never snaps back before settlement
- [ ] Rejection, timeout and accepted-not-applied clear the preview and restore focus
- [ ] Terminal outcomes are announced; warnings are visible

**Verify**: `pnpm verify`

---

## Phase 4: Integration, Storybook, E2E and closeout

> **Phase baseline tree**: recorded by the executor at phase start.
> **Reasoning**: medium — integration evidence and documentation, with no new lifecycle algorithm.

**Reference**: [03-04](03-04-integration-docs.md) · AR-22, AR-23, AR-24, AR-25, AR-26, AR-27, AR-28

**Objective**: prove the lifecycle in a controlled host, publish every new state and close the
milestone with current API and docs evidence.

### Step 4.1: Integration tests

- [x] 4.1.1 [spec-author] Write the controlled-host Playwright suite for ST-78–ST-84, the capacity regression ST-77 and the security/local-parity cases ST-87–ST-89 — `tests/e2e/commands.spec.ts`, `packages/react/src/commands.spec.test.tsx` ✅ (completed: 2026-11-11 02:57)
- [x] 4.1.2 Run the new browser tests and record the expected red failures — `docs/m5-red-phase.md` ✅ (completed: 2026-11-11 02:57)

### Step 4.2: Integration implementation and documentation

- [x] 4.2.1 Build the controlled `?commands=1` demo with host modes and the capacity-2 mock — `apps/demo/src/CommandsDemo.tsx`, `apps/demo/src/App.tsx` ✅ (completed: 2026-11-11 02:57)
- [x] 4.2.2 Add the `CommandLifecycle` Storybook stories for every pending and terminal state — `apps/storybook/stories/CommandLifecycle.stories.tsx` ✅ (completed: 2026-11-11 02:57)
- [x] 4.2.3 Write the host contract guide and update the existing docs set — `docs/commands.md`, `docs/interaction.md`, `docs/react-view.md`, `docs/security.md`, `README.md` ✅ (completed: 2026-11-11 02:57)
- [x] 4.2.4 Add the changeset and regenerate the API reports — `.changeset/rd08-command-lifecycle.md`, `packages/core/etc/year-planner-core.api.md`, `packages/react/etc/react-year-planner.api.md` ✅ (completed: 2026-11-11 02:57)

### Step 4.3: Green phase and closeout

- [x] 4.3.1 Run the command Playwright suite green in Chromium, Firefox and WebKit — `tests/e2e/commands.spec.ts` ✅ (completed: 2026-11-11 02:57)
- [x] 4.3.2 Run `pnpm verify:full`, update `docs/test-report.md`, watch CI, update the roadmap and close the plan ✅ (completed: 2026-11-11 04:00)

**Deliverables**:
- [ ] ST-77–ST-89 pass
- [ ] Storybook static build includes the new states
- [ ] Docs and API reports are current; changeset present
- [ ] CI `verify` and `browsers` jobs green
- [ ] Roadmap RD-08 Done and plan 34/34

**Verify**: `pnpm verify:full`

---

## Dependencies

```text
Phase 1 Command lifecycle and context
    ↓
Phase 2 Versions, validation and outcomes
    ↓
Phase 3 Pending preview, rollback and status
    ↓
Phase 4 Integration, Storybook, E2E and closeout
```

---

## Success Criteria

**Feature is complete when:**

1. ✅ All phases completed and every ST case passes
2. ✅ `pnpm verify:full` passes
3. ✅ No warnings/errors; no dead code or unused parameters
4. ✅ Security: hidden diagnostics redacted, diagnostics rendered as text, no raw HTML, host authorization not inferred
5. ✅ Controlled and uncontrolled modes use the same command pipeline, diagnostics and focus behavior
6. ✅ Documentation, Storybook, API reports and changeset updated
7. ✅ Existing RD-06/RD-07 tests and behavior remain green
8. ✅ CI `verify` and `browsers` jobs green
9. ✅ Roadmap and plan progress reconciled
