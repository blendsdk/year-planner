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

Command:

```bash
cd packages/react && pnpm exec vitest run src/YearPlanner.spec.test.tsx
```

State: the M1 grid had no `YearPlannerHandle`, controlled state, locale
formatters or pointer geometry; the new shell tests could not compile against
the old props.

```text
Type error: Property 'defaultVisibility' does not exist ...
```

Restored after implementation; 26 shell/state spec tests and 2 SSR tests pass.

## Phase 3 — Items, annotations and slots

Command:

```bash
cd packages/react && pnpm exec vitest run src/items.spec.test.tsx
```

State: only date cells rendered; there were no proxies, annotation badges,
overflow popovers or tooltips.

```text
TestingLibraryElementError: Unable to find role "tooltip"
```

Restored after implementation; 17 item spec tests and 5 implementation tests
pass.

## Phase 4 — Command pipeline

Command:

```bash
cd packages/react && pnpm exec vitest run src/commands.spec.test.tsx
```

State: the public handle exposed no-op command methods, so delete/move/paint
requests produced no state change, diagnostics or host callbacks.

```text
AssertionError: expected [] to have a length of 4 but got 0
```

Restored after implementation; 13 command spec tests and 6 implementation tests
pass.

## Phase 5 — Inspector

Command:

```bash
cd packages/react && pnpm exec vitest run src/inspector.spec.test.tsx
```

State: there was no inspector aside, detail list, overflow list or feedback
area.

```text
TestingLibraryElementError: Unable to find role "complementary"
```

Restored after implementation; 10 inspector spec tests and 4 implementation
tests pass.

## Phase 6 — Print and adapters

Pending.

## What this proves

- The specification tests fail when the behavior is absent, so a green run is
  not vacuous.
- The red state is the reproducible failure mode, not a timestamped diary.
