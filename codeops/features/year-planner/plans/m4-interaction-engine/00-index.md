# Interaction Engine Implementation Plan

> **Feature**: Pointer, keyboard and touch interaction for the classic year view: selection matrix, marquee, move/resize/paint/erase/create, previews, focus restoration and local undo integration.
> **Status**: Planning Complete
> **Created**: 2026-11-10 19:32
> **Implements**: year-planner/RD-07
> **CodeOps Artifact Schema**: 1

## Overview

RD-06 delivered the rendered year view, item proxies, resize handles, inspector
and a command request pipeline. The view can select an item or a single date by
click, but it cannot drag a range, marquee a group, move or resize an item, paint
a highlight range, create an item from a gesture, or navigate the full keyboard
matrix.

This plan adds the interaction engine as a separate internal layer. A gesture
produces an ephemeral preview, then one typed command through the existing
pipeline. Selection is a first-class state with explicit anchor/focus
transitions, controlled or uncontrolled. Pointer, keyboard and touch all call
the same selection and command helpers, so the modifier rules cannot drift
between input methods.

The highest risks are the modifier matrix, cross-row date mapping, preview
isolation from canonical items, cancellation while a gesture is active, and
keeping the RD-06 surface and 140 existing React tests intact.

## Minimum-Sufficient Baseline

**Original goal:** make the year planner directly editable with pointer, keyboard
and touch while keeping every change typed, validated and reversible.

**Smallest viable design:** native Pointer Events delegated on the grid root, a
small pure gesture state machine, a pure selection-policy module, per-row preview
overlays built from existing prefix-width geometry, and the existing command
pipeline. No gesture library, no new state container and no new dependency.

**Excluded machinery:** gesture/pointer library, worker, canvas layer, second undo
store, built-in touch-mode chrome, batch/bulk command engine, alt+drag
subtraction.

**Approved complexity:** None beyond the existing React/core packages. The
interaction layer is ordinary feature code inside the confirmed RD-07 scope.

## Document Index

| #   | Document | Description |
| --- | -------- | ----------- |
| AR  | [Ambiguity Register](00-ambiguity-register.md) | Zero-Ambiguity Gate decisions (audit trail) |
| 00  | [Index](00-index.md) | This document — overview and navigation |
| 01  | [Requirements](01-requirements.md) | Delta view of RD-07 and plan-local decisions |
| 02  | [Current State](02-current-state.md) | Existing handlers, geometry and gaps |
| 03-01 | [Selection Policy](03-01-selection-policy.md) | Contract, normalization, modifier matrix and transitions |
| 03-02 | [Gesture Engine](03-02-gesture-engine.md) | FSM, coordinates, marquee, auto-scroll, cancellation |
| 03-03 | [Commands, Previews and Focus](03-03-commands-previews-focus.md) | Command builders, preview projection, focus, undo, keyboard/touch |
| 03-04 | [Integration and Documentation](03-04-integration-docs.md) | View wiring, demo, Storybook, E2E, docs, changeset |
| 07  | [Testing Strategy](07-testing-strategy.md) | Specification test cases and verification |
| 99  | [Execution Plan](99-execution-plan.md) | Phases, sessions and task checklist |

## Quick Reference

### Usage

```tsx
<YearPlanner
  year={2027}
  layers={layers}
  activeLayerId="highlight"
  defaultItems={items}
  defaultSelection={{ dates: [], items: [] }}
  interaction={{
    mode: "auto",
    marquee: "items",
    touchEditing: "off",
    createDefaults: { kind: "activity", layerId: "bookings" },
    confirmChange: async () => true,
  }}
  onChangeRequest={(command) => host.apply(command)}
  onSelectionChange={(selection) => host.setSelection(selection)}
/>
```

### Key Decisions

| Decision | Outcome | AR |
| --- | --- | --- |
| Item focus | Add optional `focusItemId` to `PlannerSelection` | AR-3 |
| Selection algebra | Internal pure React module | AR-4 |
| Date ranges | Sorted, merged, split on toggle | AR-5 |
| Click vs drag | 4 px threshold; drag suppresses click | AR-9 |
| Pointer wiring | Grid-root delegation with capture | AR-10 |
| Preview | Separate per-row fragments, no mutation | AR-14 |
| Touch | Host-controlled `touchEditing` prop is the toggle | AR-20 |
| Undo | Reuse the existing pipeline | AR-22 |
| Dependencies | Native Pointer Events only | AR-36 |

## Specialist Agents

**None** — the capability-gap check found no gap a standing specialist would
close. The work is React interaction code plus tests, covered by the existing
general phase reviewer; RD-09 owns the dedicated accessibility audit and RD-10
owns the browser/performance matrix.

_Detection evidence: repository has no specialist agent configuration for UI
interaction or accessibility (`find . -name 'AGENTS.md'` returns no project
file); existing plans use the general phase reviewer; RD-07 requirements defer
announcements/WCAG to RD-09 and cross-browser evidence to RD-10._

## Related Files

| Path | Role |
| --- | --- |
| `packages/react/src/YearPlanner.tsx` | Main component and handle; wires the interaction hook |
| `packages/react/src/interaction/selection.ts` | Pure modifier/range/item policy |
| `packages/react/src/interaction/gesture.ts` | Pure gesture FSM and marquee intersection |
| `packages/react/src/interaction/pointer.ts` | Target classification and coordinate helpers |
| `packages/react/src/interaction/builders.ts` | Shared paint/create command builders |
| `packages/react/src/interaction/preview.ts` | Preview projection into row fragments |
| `packages/react/src/interaction/useInteraction.ts` | DOM wiring, rAF, commands, focus |
| `packages/react/src/render/SelectionPreview.tsx` | Selection/gesture preview overlay |
| `packages/react/src/render/Marquee.tsx` | Screen-space marquee rectangle |
| `packages/react/src/render/CellLayer.tsx` | Pointer/keyboard cell surface |
| `packages/react/src/render/ItemLayer.tsx` | Proxy and resize-handle pointer surface |
| `packages/react/src/render/YearGrid.tsx` | Grid-root pointer/keyboard delegation |
| `packages/react/src/render/MonthRow.tsx` | Preview overlay placement |
| `packages/core/src/contracts.ts` | `PlannerSelection.focusItemId` |
| `apps/demo/src/InteractionDemo.tsx` | Interaction fixture for Playwright |
| `apps/storybook/stories/Interaction.stories.tsx` | Storybook interaction states |
| `tests/e2e/interaction.spec.ts` | Browser gesture, keyboard and touch evidence |
| `docs/interaction.md` | Public interaction guide |
