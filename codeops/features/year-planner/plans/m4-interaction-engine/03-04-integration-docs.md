# Integration and Documentation: RD-07 Interaction Engine

> **Document**: 03-04-integration-docs.md
> **Parent**: [Index](00-index.md)

## Overview

This component wires the interaction engine into the existing view, adds a
browser fixture and Storybook states, and keeps the public documentation and API
report truthful.

## Architecture

### Module map

```text
packages/react/src/
├── interaction/
│   ├── selection.ts       pure modifier/range/item policy
│   ├── gesture.ts         pure FSM, marquee intersection, auto-scroll
│   ├── pointer.ts         target classification and design-unit mapping
│   ├── preview.ts         range projection into row fragments
│   ├── builders.ts         shared paint/create builders
│   └── useInteraction.ts  DOM listeners, rAF, commands, focus
├── render/
│   ├── SelectionPreview.tsx  per-row preview fragments
│   └── Marquee.tsx           fixed screen rectangle
├── YearPlanner.tsx        composes state, layout, pipeline and interaction
├── render/YearGrid.tsx    receives root pointer/key/touch props
├── render/MonthRow.tsx    places previews above cells
├── render/CellLayer.tsx   modifier-aware date surface
└── render/ItemLayer.tsx   modifier-aware item/handle surface
```

`YearPlanner.tsx` must stay below the ~700-line split threshold. If it grows
past it, extract the handle/state composition, not the interaction logic.

### View wiring order

1. Resolve layout, ribbons, theme, formatters and command pipeline.
2. Create selection/command callbacks for clicks, keys and gestures.
3. Create `useInteraction` with state, layout, ribbons, pipeline, callbacks.
4. Pass root pointer/key handlers, previews and touch-action to `YearGrid`.
5. Render the inspector and print tree as before.

### Existing behavior preserved

- Plain click on a proxy still selects the item.
- Plain click on a cell still selects the date.
- Arrow keys on a cell still move date focus.
- Arrow keys on a proxy still traverse visible proxies.
- The inspector, handle, print tree, theming and slots are unchanged.

## Implementation Details

### Public API changes

| Change | Shape | Compatibility |
| --- | --- | --- |
| Item focus | `PlannerSelection.focusItemId?: string` | Additive |
| Double-click | `InteractionConfig.doubleClick?: "inspect" \| "none"` | Additive, default `"inspect"` |
| Touch policy | Existing `touchEditing` prop | No shape change; now active |
| Marquee | Existing `marquee` prop | No shape change; now active |

No new package entry point, dependency, peer or build format.

### Demo fixture

Add `apps/demo/src/InteractionDemo.tsx`, rendered when
`window.location.search` contains `interaction=1`:

- year 2027, 14 months;
- `bookings`, `maintenance`, `training` ribbon layers and a `highlight` layer;
- three overlapping ribbon items;
- one highlight item for erase tests;
- `activeLayerId="highlight"`;
- a disabled date (`2027-03-10`);
- mode selector (`auto`, `select`, `paint`, `erase`, `create`, `move`,
  `resize`, `inspect`);
- touch policy selector (`off`, `auto`, `on`);
- read-only checkbox;
- uncontrolled items (`defaultItems`) with `onItemsChange` feeding a JSON
  output panel;
- controlled selection with `onSelectionChange` feeding the same panel.

The fixture is dev-only. It does not add dependencies to the library.

### Storybook stories

Add `apps/storybook/stories/Interaction.stories.tsx` with at least:

| Story | State |
| --- | --- |
| `AutoMode` | default auto mode |
| `InspectMode` | `mode: "inspect"` |
| `SelectMode` | `mode: "select"` |
| `PaintMode` | `mode: "paint"` with active highlight layer |
| `EraseMode` | `mode: "erase"` |
| `CreateMode` | `mode: "create"` with create defaults |
| `MoveMode` | `mode: "move"` |
| `ResizeMode` | `mode: "resize"` |
| `SelectedDateRange` | one selected range |
| `MultipleDateRanges` | disjoint normalized ranges |
| `SelectedItem` | item focus and anchor |
| `MultipleSelectedItems` | item focus state |
| `ItemRangeSelection` | Shift-range state |
| `SelectAllVisible` | all items selected |
| `DisabledDates` | disabled date metadata |
| `ReadOnlyInteraction` | global read-only |
| `LockedLayer` | locked layer |
| `TouchEditingOff` | `touchEditing: "off"` |
| `TouchEditingAuto` | `touchEditing: "auto"` |
| `TouchEditingOn` | `touchEditing: "on"` |
| `DoubleClickDisabled` | `doubleClick: "none"` |
| `AnnotationSelected` | host-owned annotation selected |
| `HiddenSelectedItem` | selection pruned by visibility |
| `MarqueeItemsMode` | `marquee: "items"` |
| `MarqueeDatesMode` | `marquee: "dates"` |

Stories are static states; drag previews are ephemeral and proven by E2E.

### E2E scenarios

Add `tests/e2e/interaction.spec.ts` and a Chromium touch project
(`playwright.config.ts`, `devices["Pixel 5"]`, `hasTouch: true`,
`testMatch` for the touch file). The touch test uses CDP touch events to prove
editing gating and selection; full native scroll physics belongs to the
quality-gates milestone.

| Scenario | Assertion |
| --- | --- |
| Date drag Jan 28 → Feb 6 | selection `[2027-01-28, 2027-02-07)`; two preview fragments |
| Marquee over three ribbons | exactly the three intersecting item IDs |
| Move a 10-day item to a cross-month target | duration preserved; fragments in both rows |
| Resize end | one-day minimum; invalid drag shows a diagnostic and no commit |
| Paint/erase | exact split periods; paint creates a range; undo restores |
| Keyboard | Arrow focus, Shift+Arrow range, Space toggle, Enter inspector, inspector move-by-week |
| Touch policy | `off`/`auto` leave `touch-action: auto` and select nothing; `on` sets `none` and selects |
| Host buttons | AC3 cell buttons still work and start no gesture |

### Documentation

- Add `docs/interaction.md`: modes, modifier matrix, pointer/touch, keyboard,
  previews, undo, focus, host responsibilities, host-control key ownership and
  examples.
- Update `docs/react-view.md` with the interaction section and touch ownership.
- Update `README.md` feature/status table and usage example.
- Update `docs/test-report.md` counts, E2E evidence and known gaps.
- Update `docs/security.md` with pointer/selection safety notes.
- Update stale public comments and demo copy that say pointer gestures, touch or
  undo are "inert" or "later slices" (`packages/react/src/types.ts`,
  `packages/react/src/YearPlanner.tsx`, `packages/react/src/commands.ts`,
  `apps/demo/src/App.tsx`).
- Add `.changeset/rd07-interaction.md`.

### API report and size

- Run `pnpm api-report` before `pnpm verify`; commit
  `packages/core/etc/year-planner-core.api.md` and
  `packages/react/etc/react-year-planner.api.md`.
- `focusItemId` appears in the core report (the React report imports
  `PlannerSelection`); `doubleClick` appears in the React report.
- `pnpm test:size` must stay under 60 kB gzip.
- No new dependency or package export.

## Integration Points

| Consumer | Contract |
| --- | --- |
| Host | `selection`/`onSelectionChange`, `interaction.*`, handle |
| RD-08 | Completed `PlannerCommand` values, rollback consumes outcomes |
| RD-09 | Focus outcomes and ARIA grid/proxy semantics |
| RD-10 | E2E scenarios and browser matrix |
| RD-11 | Interaction stories and docs |

## Error Handling

| Error Case | Handling Strategy | AR Ref |
| --- | --- | --- |
| Demo fixture absent | `?interaction=1` falls back to the normal demo | AR-31 |
| Storybook story drift | Static build + story count | AR-30 |
| API report stale | `pnpm api-report` before `pnpm verify`; `api-report:ci` checks it | AR-31 |
| Bundle budget exceeded | Size gate fails | AR-36 |
| Existing E2E snapshot changes | Re-baseline only for intentional interaction CSS; review image | AR-35 |
| Heading navigation | RD-07 FSM defines no heading transition; headings stay presentation-only, RD-09 owns navigation | AR-37 |

## Testing Requirements

- Storybook static build succeeds with the new stories.
- Playwright interaction file passes in Chromium, Firefox and WebKit; touch
  policy runs in Chromium with synthetic pointer events.
- Full verify and CI green.
- Docs and API report reviewed for truthful claims.
