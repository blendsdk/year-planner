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
