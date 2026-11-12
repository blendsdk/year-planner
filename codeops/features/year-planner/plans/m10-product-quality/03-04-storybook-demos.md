# Storybook Demos: Product Quality

> **Document**: 03-04-storybook-demos.md
> **Parent**: [Index](00-index.md)

## Overview

The Storybook catalogue contains 174 stories, four `play` functions and two
description and 1 **story** description; 173 stories have no story-level
description. It proves
that states render; it does not show a first-time reader what the component
does. This component adds a Demos group with real interactions, an event-log
playground, and a one-line description on every story. The existing catalogue
stays as the reference surface because the documentation mandate requires every
meaningful state and the RD-11 contract hard-codes its titles.

## Architecture

### Current Architecture

- Twelve story files under `apps/storybook/stories/`.
- Titles use the `Year Planner/NN Name` hierarchy; `Classic Year/Grid` is a
  separate older group.
- `storybook/test` is available (`userEvent`, `within`) and is used by four
  accessibility stories.
- `tests/quality/storybook-contract.spec.test.ts` extracts exports with
  `^export const (\w+): Story` and asserts required named stories.
- `tests/quality/docs-contract.spec.test.ts` requires README,
  getting-started and the test report to state the exact story count.
- The docs site builds Storybook at `/` and TypeDoc at `/api`.
- Fluent UI and MUI are dependencies of the private demo app, not of the
  Storybook app.

### Proposed Changes

| Change | File |
| ------ | ---- |
| Demos group | `apps/storybook/stories/Demos.stories.tsx` |
| Event-log playground | `apps/storybook/stories/EventLog.stories.tsx` |
| Context-menu examples | `apps/storybook/stories/ContextMenu.stories.tsx` |
| Story descriptions | All `*.stories.tsx` |
| Demos-first ordering | `apps/storybook/.storybook/preview.ts` |
| Dev-only design-system dependencies | `apps/storybook/package.json`, lockfile |
| Description and demo contract | `tests/quality/storybook-contract.spec.test.ts` |
| Story-count docs | `README.md`, `docs/getting-started.md`, `docs/test-report.md` |

## Implementation Details

### Navigation

Keep the existing `Year Planner/NN` titles so the RD-11 required-story contract
stays valid. The existing catalogue is the **Reference** surface even though its
titles are unchanged; this is a recorded deviation from RD-13's illustrative
three-section naming. Add `options.storySort` in `preview.ts`:

```ts
options: {
  storySort: {
    order: ["Demos", "Year Planner", "Classic Year"],
  },
}
```

Storybook then opens on Demos and keeps the reference catalogue one level down.
The contract asserts the configured order string.

### Demos

| Story | Interaction | Assertion |
| ----- | ----------- | --------- |
| `SelectRange` | Drag across a week of cells | Selection preview appears and the selected-date count updates |
| `MoveItem` | Drag an item two weeks later | A move command request is emitted with the new period |
| `ResizeItem` | Drag an item edge | A resize request is emitted with the new end date |
| `PaintLayer` | Drag across days in paint mode | Paint preview appears and a paint command is emitted |
| `KeyboardNavigation` | Focus the grid; Arrow/Home/End | Focus moves and the active date changes |
| `ContextMenu` | Right-click a cell and an item | The request log records the right target |
| `EventLog` | Trigger one selection in its play function | The side panel records the event type, target and timestamp |

Each demo has a `play` function that drives the interaction with
`userEvent`/`within` and asserts the visible outcome. The event-log story also
has a play function so the Demos rule is uniform. The demo page shows a short
instruction line so a reader knows what to try.

### Event-log playground

The story owns local state:

```ts
interface LogEntry {
  at: string;
  type: "selection" | "change" | "command" | "context";
  target: string;
  detail: string;
}
```

It passes handlers for `onSelectionChange`, `onChangeRequest`,
`onChangeCommitted`, `onChangeRejected` and `onContextMenuRequest`, appends
entries (capped at 50), and renders a scrollable panel beside the planner with a
Clear button. This makes every callback visible without opening the browser
console. `onCommandOutcome` does not exist in the public API and must not be
referenced.

### Descriptions

Every story receives a one-line `parameters.docs.description.story`. To avoid
repeating the nested object 174 times, add a small helper that **keeps the
`: Story` annotation** and deep-merges the docs block:

```ts
function story(description: string, config: Story = {}): Story {
  return {
    ...config,
    parameters: {
      ...config.parameters,
      docs: {
        ...config.parameters?.docs,
        description: { ...config.parameters?.docs?.description, story: description },
      },
    },
  };
}
```

Existing exports become
`export const AutoMode: Story = story("Default automatic mode: …", {})`.
The helper is local to the stories folder; it is not a package export. The
contract parses both the annotated export and the helper's first argument.

### Context-menu examples

`ContextMenu.stories.tsx` contains a Fluent `Menu` example and an MUI `Menu`
example. Both read `onContextMenuRequest`, store the request, render host
actions, and call `request.restoreFocus()` on close. They import the
design-system packages as dev-only dependencies of the Storybook app; the
library package stays dependency-free. Fluent v9 uses a programmatic open
(`open` state plus a positioned popover) rather than a bare trigger.

### Contract

Extend `tests/quality/storybook-contract.spec.test.ts`:

- every `export const <Name>: Story` has a **story-level** description, either
  literal or via the `story("…", …)` helper;
- every story in the Demos group has a `play` function;
- the Demos group contains at least six interaction stories plus the event log;
- the event-log story references `onChangeRequest`, `onChangeCommitted`,
  `onChangeRejected` and `onContextMenuRequest`, and does **not** reference
  `onCommandOutcome`;
- the `storySort` order string contains `Demos`;
- existing required-story and duplicate-title checks stay green;
- the docs-contract story-count assertions are updated to the new count.

### Error Handling

| Error Case | Handling Strategy | AR Ref |
| ---------- | ----------------- | ------ |
| A play function fails | Storybook shows the interaction error in the panel; the demo is not considered done until it passes | AR-19 |
| A story has no story-level description | The quality contract fails and names the file/export | AR-20 |
| A demo needs data that drifts | Use the shared `fixtures.ts` and fixed 2027 dates | AR-19 |
| A context-menu example leaks item content into the log | The example logs the target kind and ID only, never the title or host data | AR-13 |
| Storybook ordering changes | The `storySort` order is asserted by the contract | AR-18 |
| A redundant story is merged | The state must remain represented elsewhere; the coverage contract proves it | AR-32 |
| The helper drops a component description | The helper deep-merges `parameters.docs`, preserving `description.component` | AR-36 |

> **Traceability:** every design choice above is recorded in
> [00-ambiguity-register.md](00-ambiguity-register.md).

## Testing Requirements

- `tests/quality/storybook-contract.spec.test.ts` covers story-level
  descriptions, Demos play functions, the event log, storySort and the existing
  required stories.
- `tests/quality/docs-contract.spec.test.ts` is updated with the new story
  count and file count.
- `pnpm storybook:build` and `pnpm docs:site` build the site.
- The existing E2E interaction, command and accessibility suites cover the
  behaviors the demos drive; the demos are the documentation layer on top.
- A manual review checks each demo at 1280 × 800 and records the result in
  `docs/test-report.md`; the stories directory is not an evidence location.
