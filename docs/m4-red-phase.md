# RD-07 Red Phase Evidence

> **Plan**: `codeops/features/year-planner/plans/m4-interaction-engine/`
> **Rule**: specification tests are written before implementation and must fail
> for the intended reason.

## Phase 1 — Selection policy

Command:

```bash
cd packages/react && pnpm exec vitest run src/interaction/selection.spec.test.tsx
```

State: `interaction/selection.ts` did not exist.

```text
Error: Failed to resolve import "./selection.js" from "src/interaction/selection.spec.test.tsx".
```

The project's established red-phase convention is an unresolved module import;
the per-case assertions cannot run until the module exists. The corrective run
is recorded in `99-execution-plan.md` task 1.3.2.
