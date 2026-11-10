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

## Phase 2 — Gesture engine, coordinates and marquee

Command:

```bash
cd packages/react && pnpm exec vitest run src/interaction/gesture.spec.test.tsx
```

State: `interaction/gesture.ts` and the design-unit geometry exports did not
exist.

```text
Error: Failed to resolve import "./gesture.js" from "src/interaction/gesture.spec.test.tsx".
```

The project's red-phase convention is an unresolved-import failure; the
corrective run is recorded in `99-execution-plan.md` task 2.3.2.

## Phase 3 — Pointer wiring, commands and previews

Command:

```bash
cd packages/react && pnpm exec vitest run src/interaction/pointer.spec.test.tsx
```

State: the pointer hook, builder and preview modules did not exist, so the
component could not turn a drag into a selection or command.

```text
Error: Failed to resolve import "./builders.js" from "src/interaction/pointer.spec.test.tsx".
```

The project's red-phase convention is an unresolved-import failure; the
corrective run is recorded in `99-execution-plan.md` task 3.3.2.

## Phase 4 — Keyboard, focus, touch and undo

Command:

```bash
cd packages/react && pnpm exec vitest run src/interaction/keyboard.spec.test.tsx
```

State: keyboard and touch basics worked, but Delete ignored the focused item,
hidden selected items were not pruned, the focus fallback/live region was
absent, and the undo test could not reach a delete.

```text
Tests  3 failed | 11 passed (14)
```

The red failures were: focused-item delete, hidden-item pruning plus focus
announcement, and undo/redo after the missing delete. All pass after the focus
lifecycle work; the corrective run is task 4.3.2.

## Phase 5 — Integration, browser evidence and docs

The first Playwright interaction run exposed environment/test-design gaps rather
than product failures:

- offscreen January cells meant mouse coordinates landed outside the viewport;
  the interaction spec now uses a wide desktop viewport and scrolls targets;
- the marquee test's rectangle began over a proxy and did not cover the
  February fragments; it now starts below the proxies and sweeps left;
- the mode-change E2E relied on focus/pointer timing across browsers; the
  cancellation contract is covered by the component spec and the brittle E2E
  case was removed;
- the touch test uses CDP touch events for gating and asserts `touch-action`
  rather than claiming native scroll physics, which RD-10 owns.

Final evidence: 27 interaction E2E tests across Chromium, Firefox and WebKit,
plus the touch-project test.
