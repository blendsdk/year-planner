# RD-08 Red Phase Evidence

> **Plan**: `codeops/features/year-planner/plans/m5-controlled-commands/`
> **Rule**: specification tests are written before implementation and must fail
> for the intended reason.

## Phase 1 — Command lifecycle and context

Command:

```bash
cd packages/react && pnpm exec vitest run src/commands.lifecycle.spec.test.tsx
```

State: the request state machine, `baseRevision`, the abort signal, validation
severity, malformed-outcome normalization and context invalidation did not exist.
The pure apply helper module did not exist either.

```text
Test Files  1 failed (1)
Tests  13 failed | 16 passed (29)
```

Failing cases:

- `includes baseRevision when supplied`
- `uses the current baseRevision for each command`
- `blocks an error diagnostic even when permitted is true`
- `allows a warning diagnostic and displays it`
- `times out host validation and aborts its signal`
- `times out the host request and aborts its signal`
- `keeps concurrent request IDs distinct when the factory collides`
- `invalidates a validating request when an affected item changes`
- `invalidates a requesting request when the year window changes`
- `invalidates a requesting request when the interaction mode changes`
- `aborts an in-flight request on unmount without callbacks`
- `rejects an accepted outcome without a revision`
- `rejects a non-boolean accepted flag`

The 16 passing cases are existing RD-06 behavior that the RD-08 tests keep as
regression guards: request-ID factory use, omitted `baseRevision`, local checks
first, sync/async validation, synthesized `VALIDATION_ERROR`, thrown-validation
mapping, late-response ignoring, null/throw outcome mapping, one-command-per-item,
unrelated pending items, delete confirmation, and distinct built-in IDs.

The pure stale-apply guard is a second spec file:

```bash
cd packages/react && pnpm exec vitest run src/commands.apply.spec.test.tsx
```

State: `commands/apply.ts` did not exist.

```text
Error: Failed to resolve import "./commands/apply.js" from "src/commands.apply.spec.test.tsx".
```

The project's red-phase convention permits the unresolved-import failure for a
new pure module; the corrective run is recorded in `99-execution-plan.md` task
1.3.2.

## Phase 2 — Versions, validation and outcomes

Command:

```bash
cd packages/react && pnpm exec vitest run src/commands.outcomes.spec.test.tsx
```

State: the Phase 1 lifecycle foundation already included outcome
normalization, the controlled application waiter and the version guards,
because the request state machine cannot settle accepted/rejected outcomes
without them. The Phase 2 suite therefore ran green for those cases on its first
execution. The first run found one real gap — warning notices were not rendered
in the inspector (ST-54/ST-71) — plus six test-harness spy wiring mistakes. The
inspector gap was fixed in `InspectorFeedback`; the spy wiring was corrected in
the test file. Final Phase 2 run: 28/28 passed.

This is recorded as a process deviation: the Phase 2 behavior was implemented
with the Phase 1 foundation rather than after a separate red run. The
specification suite remains the independent oracle and all cases pass.

## Phase 3 — Pending preview, rollback and status

Command:

```bash
cd packages/react && pnpm exec vitest run src/interaction.commands.spec.test.tsx
```

State: the gesture preview still disappeared when the pointer was released, no
command-status live region existed, focus fell back to the gesture date instead
of the source item, and only one preview could render.

```text
Test Files  1 failed (1)
Tests  7 failed | 3 passed (10)
```

Failing cases:

- `keeps the move preview until the host accepts`
- `clears the preview and restores focus when the host rejects`
- `holds a paint preview until the host rejects`
- `holds a create preview until the host rejects`
- `renders two pending previews for unrelated items`
- `clears pending on a year change without feedback`
- `preserves a newer selection when a command is rejected`

The three passing cases were existing timeout, accepted-not-applied and pending
delete behavior. After the implementation the same suite is 10/10 green.
