# Current State: RD-07 Interaction Engine

> **Document**: 02-current-state.md
> **Parent**: [Index](00-index.md)

## Existing Implementation

### What Exists

RD-06 shipped a rendered year grid with:

- `CellLayer` renders dated cells, `aria-disabled`, roving `tabIndex` and
  ArrowLeft/Right/Up/Down focus movement (`packages/react/src/render/CellLayer.tsx:96-125`).
- `ItemLayer` renders ribbon/annotation/foreground proxies with `role="button"`,
  `aria-pressed`, focus tooltips, click selection and Arrow proxy traversal
  (`packages/react/src/render/ItemLayer.tsx:150-248`).
- Two resize-handle buttons exist but have no pointer handlers
  (`packages/react/src/render/ItemLayer.tsx:234-247`).
- `YearPlanner` keeps `activeDate`/`activeItemId`, plain date/item click
  selection, arrow focus and the imperative handle
  (`packages/react/src/YearPlanner.tsx:211-402`).
- `usePlannerState` supplies controlled/uncontrolled selection, items,
  visibility and filter (`packages/react/src/state.ts:124-235`).
- `geometry.ts` maps client points through viewport rect, scroll, month band,
  sticky header and zoom (`packages/react/src/geometry.ts:27-113`).
- The command pipeline validates read-only, versions, paint targets, timed
  edits and host outcomes, with timeout, retry, undo and redo
  (`packages/react/src/commands.ts`).
- Core selection is only `emptySelection()` and `selectionItemIds()`
  (`packages/core/src/model/selection.ts`).

### Relevant Files

| File | Purpose | Changes Needed |
| --- | --- | --- |
| `packages/core/src/contracts.ts` | Canonical selection/command types | Add optional `focusItemId` |
| `packages/core/src/model/selection.ts` | Minimal selection helpers | Leave as-is; interaction algebra stays in React |
| `packages/react/src/YearPlanner.tsx` | Component, state and handle | Wire `useInteraction`, pass pointer/keyboard props, focus fallback, selection sync |
| `packages/react/src/types.ts` | Public props/config | Add `doubleClick`; keep `touchEditing`/`marquee` |
| `packages/react/src/state.ts` | Controlled state | No structural change; selection callbacks used by the hook |
| `packages/react/src/geometry.ts` | Coordinate math | Export/design-unit helpers for gestures and marquee |
| `packages/react/src/render/YearGrid.tsx` | Grid shell | Root pointer/keyboard delegation and marquee overlay |
| `packages/react/src/render/MonthRow.tsx` | Row geometry | Render clipped preview fragments |
| `packages/react/src/render/CellLayer.tsx` | Date cells | Modifier-aware click/keyboard callbacks; pointer target attributes |
| `packages/react/src/render/ItemLayer.tsx` | Proxies/handles | Modifier-aware selection; pointer targets on proxy/handles |
| `packages/react/src/render/Inspector.tsx` | Inspector | Reuse extracted paint builder; focus item via selection |
| `packages/react/src/commands.ts` | Pipeline | Reuse; no lifecycle rewrite |
| `apps/demo/src/App.tsx` | Demo | Add `?interaction=1` fixture and mode/touch controls |
| `apps/storybook/stories/` | Stories | New `Interaction.stories.tsx` |
| `tests/e2e/classic-year.spec.ts` | Existing E2E | Keep green; new `interaction.spec.ts` |

### Code Analysis

The existing click handlers are plain-selection only:

```tsx
const selectItem = useCallback((itemId: string) => {
  const next = { dates: [], items: [itemId], anchorItemId: itemId };
  state.setSelection(next);
  setActiveItemId(itemId);
}, [state]);

const selectDate = useCallback((date: string) => {
  const next = {
    dates: [{ startDate: date, endDateExclusive: addDays(date, 1) }],
    items: [],
    anchorDate: date,
    focusDate: date,
  };
  state.setSelection(next);
  setActiveItemId(undefined);
}, [state]);
```

No modifier state is read. No pointer events exist. `ItemLayer` handles only
`onClick`, `onKeyDown`, focus and hover. The resize handles are inert buttons.

## Gaps Identified

### Gap 1: Selection policy

**Current Behavior:** plain click replaces a single item or date; no Shift
range, Ctrl/Cmd toggle, Ctrl/Cmd+A, anchor/focus transitions or normalization.
**Required Behavior:** RD-07 selection matrix and `PlannerSelection` transitions.
**Fix Required:** pure `selection.ts` policy, called by clicks, gestures and keys.

### Gap 2: Pointer gesture engine

**Current Behavior:** no pointer down/move/up/cancel handling, no threshold, no
pointer capture, no auto-scroll.
**Required Behavior:** FSM with pending/active/commit/cancel, coordinate mapping,
edge auto-scroll and cancellation.
**Fix Required:** `gesture.ts` FSM, `pointer.ts` target/coordinate helpers,
`useInteraction.ts` DOM wiring.

### Gap 3: Editing gestures

**Current Behavior:** only the inspector can move/resize/paint/erase/create/delete.
**Required Behavior:** pointer drags and handles produce typed commands.
**Fix Required:** shared command builders, move/resize previews, paint/erase/create
gestures through the existing pipeline.

### Gap 4: Previews

**Current Behavior:** no drag preview; canonical items are the only visuals.
**Required Behavior:** ephemeral date/move/resize/paint/create previews, two
clipped fragments for a cross-month range, marquee rectangle.
**Fix Required:** `preview.ts` projection, `SelectionPreview`/`Marquee` components.

### Gap 5: Keyboard and touch

**Current Behavior:** arrows move date focus; Enter/Space select an item; touch
policy is inert.
**Required Behavior:** Shift+Arrow range, Space toggle, Enter inspect, Escape
cancel/clear, Delete with permission/confirmation, Ctrl/Cmd+A, disabled-date skip,
touch scroll-first policy.
**Fix Required:** extend cell/proxy/root key handlers; add touch pointer gating
and `touch-action`.

### Gap 6: Focus/undo/contract

**Current Behavior:** no `focusItemId`; hidden selected items remain selected;
pending focus silently does nothing when the item disappears; redo is cleared by
new edits but is not covered for every command type.
**Required Behavior:** focus restoration and pruning, item focus field, undo/redo
evidence for all command types.
**Fix Required:** contract field, focus fallback, visibility/filter pruning,
targeted tests.

## Dependencies

### Internal Dependencies

- RD-05 `RibbonLayout`/`fragments`, `RibbonHitEntry`.
- RD-06 state, geometry, command pipeline, grid/proxy/cell surfaces, inspector.
- Core visibility/editability/paint helpers.

### External Dependencies

None. Native Pointer Events, rAF and `Intl` only.

## Risks and Concerns

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Click handlers and pointer gesture both fire selection | High | High | 4 px threshold + suppress-click flag; explicit tests |
| Host button in a cell starts a gesture | Med | High | Ignore host interactive controls in target classification; AC3 E2E stays green |
| Cross-row mapping drifts from CSS geometry | Med | High | Reuse prefix widths; pure mapping tests + Playwright drag |
| Preview mutates canonical items | Low | High | Preview is separate state; original item remains; tests |
| Controlled hosts replace item arrays every render | Med | Med | Compare identity/signature; cancel only on real changes |
| Existing RD-06 tests regress | Med | High | Preserve handlers and add modifiers; full suite per phase |
| Touch gesture blocks scrolling | Med | High | `touchEditing` off by default; `touch-action: none` only when on |
| Gesture command bypasses validation | Low | High | All commands go through `pipeline.requestCommand` |
| Bundle growth | Low | Med | No dependency; size gate |
