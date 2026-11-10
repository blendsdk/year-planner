# Red-Phase Evidence — M2

> **Date**: 2026-11-10
> **Purpose**: Record the failing state that each M2 specification-test phase was
> written against. The implementation is green when the corresponding phase is
> complete; the red state is reproducible by removing the module named below.

## Phase 1 — Entity model and validation

Command:

```bash
cd packages/core
pnpm exec vitest run src/model/validation.spec.test.ts
```

State: `packages/core/src/model/validation.ts` and `types.ts` did not exist.

```text
Error: Cannot find module './validation' imported from
  packages/core/src/model/validation.spec.test.ts
Test Files  1 failed (1)
     Tests  no tests
```

Restored after implementation; the Phase 1 green run is recorded in the M2
section of `docs/test-report.md`.

## Phase 2 — Visibility and editability

Command:

```bash
cd packages/core
pnpm exec vitest run src/model/visibility.spec.test.ts
```

State: `packages/core/src/model/visibility.ts` and `editability.ts` did not
exist.

```text
Error: Cannot find module './visibility' imported from
  packages/core/src/model/visibility.spec.test.ts
Test Files  1 failed (1)
     Tests  no tests
```

Restored after implementation; 17 spec tests pass.

## Phase 3 — Paint and erase

Command:

```bash
cd packages/core
pnpm exec vitest run src/model/paint.spec.test.ts
```

State: `packages/core/src/model/paint.ts` did not exist.

```text
Error: Cannot find module './paint' imported from
  packages/core/src/model/paint.spec.test.ts
Test Files  1 failed (1)
     Tests  no tests
```

Restored after implementation; 14 spec tests pass.

## Phase 4 — Ribbon fragments and lanes

Command:

```bash
cd packages/core
pnpm exec vitest run src/ribbon/fragments.spec.test.ts
```

State: `packages/core/src/ribbon/fragments.ts` and `lanes.ts` did not exist.

```text
Error: Cannot find module './fragments' imported from
  packages/core/src/ribbon/fragments.spec.test.ts
Test Files  1 failed (1)
     Tests  no tests
```

Restored after implementation; 20 spec tests pass.

## Phase 5 — Hit index

Command:

```bash
cd packages/core
pnpm exec vitest run src/ribbon/hit-index.spec.test.ts
```

State: `packages/core/src/ribbon/hit-index.ts` did not exist.

```text
Error: Cannot find module './hit-index' imported from
  packages/core/src/ribbon/hit-index.spec.test.ts
Test Files  1 failed (1)
     Tests  no tests
```

Restored after implementation; 2 spec and 4 implementation tests pass.

## Phase 6 — Print planning

Command:

```bash
cd packages/core
pnpm exec vitest run src/ribbon/print.spec.test.ts
```

State: `packages/core/src/ribbon/print.ts` did not exist.

```text
Error: Cannot find module './print' imported from
  packages/core/src/ribbon/print.spec.test.ts
Test Files  1 failed (1)
     Tests  no tests
```

Restored after implementation; 8 spec tests pass.

## What this proves

- The specification tests fail when the behavior is absent, so a green run is
  not vacuous.
- It does not claim a timestamped TDD diary; the red state is the reproducible
  failure mode.
