# Controlled Commands Implementation Plan

> **Feature**: Controlled command lifecycle for the year planner: request identity, per-item versions, local and host validation, explicit pending state, accepted/rejected/timeout/abort handling, accepted-but-not-applied detection, rollback of preview/focus and identical uncontrolled behavior.
> **Status**: Execution Complete
> **Created**: 2026-11-11 01:36
> **Implements**: year-planner/RD-08
> **CodeOps Artifact Schema**: 1

## Overview

RD-06 and RD-07 already send typed commands through `useCommandPipeline`. The
pipeline performs local checks, optionally calls host validation, sends a
request with a generated ID, applies uncontrolled changes locally and rolls
back nothing. That is enough for a demo, but not for a controlled host that must
remain authoritative.

This plan hardens the same pipeline instead of adding a second command system.
Every request gets a tracked identity and a lifetime. Host validation and the
host request share one deadline. A response can settle only the request that is
still current. Accepted controlled changes are verified against the props before
the UI calls them applied. Pending gestures keep their proposed preview until
the request settles. Rejections clear the preview and return focus to the
source item. Warnings are visible without blocking.

The highest risks are response ordering, the accepted-but-not-applied window,
the split between pipeline state and interaction-owned previews, and keeping
the 309 existing React tests plus the RD-06/RD-07 behavior intact.

## Minimum-Sufficient Baseline

**Original goal:** make the planner safe to use with a controlled host that can
accept, reject, stall, abort or apply a change later.

**Smallest viable design:** extend `useCommandPipeline` with an explicit request
state machine, runtime outcome normalization and a props-application waiter;
split the existing 609-line module into focused internal files; keep previews in
the interaction layer that already owns gesture state; reuse the existing
diagnostic, inspector and test infrastructure.

**Excluded machinery:** a state-management library, a command queue or worker, a
second undo store, a new test harness, a built-in backend or persistence layer,
and batch/bulk commands. The demo host and Storybook mocks are test/demo code,
not production API.

**Approved complexity:** None. The work stays inside the existing React/core
packages and the established demo/Storybook/Playwright surfaces.

## Document Index

| #   | Document | Description |
| --- | -------- | ----------- |
| AR  | [Ambiguity Register](00-ambiguity-register.md) | Zero-Ambiguity Gate decisions (audit trail) |
| 00  | [Index](00-index.md) | This document — overview and navigation |
| 01  | [Requirements](01-requirements.md) | Delta view of RD-08 and plan-local decisions |
| 02  | [Current State](02-current-state.md) | Existing pipeline, gaps and risks |
| 03-01 | [Command Lifecycle](03-01-command-lifecycle.md) | Request state, context, timeout, abort, obsolete handling |
| 03-02 | [Versions and Outcomes](03-02-versions-outcomes.md) | Version rules, validation severity, outcome normalization, application wait, retry |
| 03-03 | [Rollback and Pending UI](03-03-rollback-pending-ui.md) | Pending previews, focus restoration, notices, announcements |
| 03-04 | [Integration and Documentation](03-04-integration-docs.md) | Demo host, Storybook, E2E, docs and release evidence |
| 07  | [Testing Strategy](07-testing-strategy.md) | Specification test cases and verification |
| 05  | [Findings](05-findings.md) | Post-execution review findings and rulings |
| 99  | [Execution Plan](99-execution-plan.md) | Phases, sessions and task checklist |

## Quick Reference

### Controlled host contract

```tsx
<YearPlanner
  year={2027}
  items={items}
  baseRevision={revision}
  validateChange={(command, context) => policy.check(command, context)}
  onChangeRequest={async (command, context, signal) => {
    const response = await api.apply(command, { signal });
    return response.accepted
      ? { accepted: true, revision: response.revision, updatedItems: response.items }
      : { accepted: false, diagnostics: response.diagnostics, latestRevision: response.revision };
  }}
  onChangeCommitted={(outcome) => setRevision(outcome.revision)}
  onChangeRejected={(outcome) => report(outcome.diagnostics)}
  onDiagnostic={(entry) => log(entry)}
/>
```

### Key decisions

| Decision | Outcome |
| -------- | ------- |
| Request identity | One tracked ID per request; obsolete responses are ignored (AR-9) |
| Base revision | Optional top-level `baseRevision` passed through, never used for item staleness (AR-3) |
| Validation | Local checks first; error-level diagnostics block, warnings do not (AR-6) |
| Timeout | One deadline covers host validation and the request, not confirmation (AR-7) |
| Application | Controlled acceptance waits for props before declaring success (AR-11, AR-19) |
| Rollback | Pending preview clears; focus returns to the source item; no optimistic selection change (AR-14, AR-15) |
| Uncontrolled parity | Same command pipeline, same version increment, local undo/redo (AR-18) |

## Specialist Agents

**None** — the capability-gap check found no gap a standing specialist would
close. The work is React command-lifecycle code, existing test layers and a
documentation update; RD-09 owns the dedicated accessibility audit and RD-10
owns the browser/performance matrix.

_Detection evidence: `codeops/specialists/` is absent; `.opencode/agents/` contains only
catalog roles (`executor`, `correctness-reviewer`, `design-challenger`, `spec-test-author`,
`security-auditor`, `performance-auditor`, `semantics-reviewer`, `concurrency-auditor`,
`preflight-auditor`, `explorer`, `financial-integrity-auditor`); the RD-07 findings ledger
records no recurring command-lifecycle area that a project specialist would own. Dynamic
phase packets plus the catalog reviewer cover the work._

## Related Files

### Core

- `packages/core/src/diagnostics.ts` — add two additive diagnostic codes.
- `packages/core/src/contracts.ts` — canonical command/context/outcome types (no shape change).
- `packages/core/src/model/paint.ts` — existing paint result contract.

### React

- `packages/react/src/commands.ts` — stable internal entry point.
- `packages/react/src/commands/types.ts` — pipeline and result types.
- `packages/react/src/commands/local.ts` — ID factory, local reducer, host-outcome application.
- `packages/react/src/commands/validate.ts` — local checks, diagnostic helpers.
- `packages/react/src/commands/apply.ts` — accepted-outcome application rules.
- `packages/react/src/commands/pipeline.ts` — the React hook and request state machine.
- `packages/react/src/types.ts` — `baseRevision` and host callback signatures.
- `packages/react/src/YearPlanner.tsx` — pipeline wiring, command status announcement.
- `packages/react/src/interaction/commit.ts` — command emission and result-driven focus.
- `packages/react/src/interaction/useInteraction.ts` — pending previews and rollback.
- `packages/react/src/interaction/preview.ts` — preview projection (reused).
- `packages/react/src/render/YearGrid.tsx`, `MonthRow.tsx` — render multiple previews.
- `packages/react/src/render/ItemLayer.tsx` — pending attribute (existing).
- `packages/react/src/render/Inspector.tsx` — feedback, notices, retry/dismiss.
- `packages/react/src/styles.css` — pending style.

### Evidence and docs

- `packages/react/src/commands.lifecycle.spec.test.tsx` — ST cases.
- `packages/react/src/commands.lifecycle.impl.test.tsx` — internal edge cases.
- `packages/react/src/commands.spec.test.tsx`, `commands.impl.test.tsx` — extended regressions.
- `packages/react/src/interaction.integration.spec.test.tsx` — preview/rollback integration.
- `apps/demo/src/CommandsDemo.tsx`, `apps/demo/src/App.tsx` — controlled browser fixture.
- `apps/storybook/stories/CommandLifecycle.stories.tsx` — new states.
- `tests/e2e/commands.spec.ts` — browser evidence.
- `docs/commands.md` and the existing docs set.
- `.changeset/rd08-command-lifecycle.md` — release note.
- `packages/core/etc/year-planner-core.api.md`, `packages/react/etc/react-year-planner.api.md` — API reports.
