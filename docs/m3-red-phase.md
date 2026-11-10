# Red-Phase Evidence — M3 React View

> **Date**: 2026-11-10
> **Purpose**: Record the failing state each M3 specification-test phase was
> written against. A phase is green only after its implementation lands.

## Phase 1 — Contracts and theme

Commands:

```bash
cd packages/core && pnpm exec vitest run src/contracts.spec.test.ts
cd packages/react && pnpm exec vitest run src/theme.spec.test.tsx
```

State: `contracts.ts`, `model/selection.ts` and `theme.ts` did not exist.

```text
Error: Failed to load url ./model/selection ...
Test Files  1 failed (1)
     Tests  no tests

Error: Failed to load url ./theme ...
Test Files  1 failed (1)
     Tests  no tests
```

## Phase 2 — View shell and state

Pending.

## Phase 3 — Items, annotations and slots

Pending.

## Phase 4 — Command pipeline

Pending.

## Phase 5 — Inspector

Pending.

## Phase 6 — Print and adapters

Pending.

## What this proves

- The specification tests fail when the behavior is absent, so a green run is
  not vacuous.
- The red state is the reproducible failure mode, not a timestamped diary.
