# Controlled commands

> **Time**: about 15 minutes. **Prerequisites**: the planner renders and you
> have a place to keep items, such as React state or a server cache.

The default planner applies local changes itself. A real application usually
wants the host to validate, persist and version each change. That is the
`onChangeRequest` / `onChangeCommitted` contract.

## The pipeline in one picture

1. A gesture or inspector button produces a `PlannerCommand`.
2. The planner checks the command locally, then calls `validateChange`.
3. It calls `onChangeRequest` with the command and context.
4. Your host returns an accepted or rejected `CommandOutcome`.
5. Accepted changes settle only after the controlled `items` prop updates.
6. `onChangeCommitted` receives the outcome; `onChangeRejected` receives a
   rejection.

If the host accepts but never updates `items`, the planner reports
`ACCEPTED_NOT_APPLIED` after the timeout instead of pretending the change
happened.

## Host state

```tsx
import type { CommandOutcome, PlannerCommand, PlannerItem } from "@blendsdk/year-planner-core";
import { useRef, useState } from "react";

const [items, setItems] = useState<PlannerItem[]>(initialItems);
const itemsRef = useRef(items);
itemsRef.current = items;
```

## Apply a command

This small reducer is enough for create, update, move, resize and delete. Keep
it pure and return a new array.

```tsx
function applyCommand(
  current: PlannerItem[],
  command: PlannerCommand,
): { outcome: CommandOutcome; next: PlannerItem[] } {
  if (command.type === "create") {
    const item = { ...command.item, version: 1 };
    return {
      outcome: { accepted: true, revision: "next", updatedItems: [item] },
      next: [...current, item],
    };
  }
  if (command.type === "delete") {
    return {
      outcome: { accepted: true, revision: "next", removedItemIds: [command.itemId] },
      next: current.filter((item) => item.id !== command.itemId),
    };
  }
  if (command.type === "paint") {
    // Paint is a range union/subtract; keep it in the host or map a server call.
    return { outcome: { accepted: true, revision: "next" }, next: current };
  }
  const source = current.find((item) => item.id === command.itemId);
  if (!source) {
    return { outcome: { accepted: false, diagnostics: [{ code: "UNKNOWN_ITEM", level: "error", message: "Item not found" }] }, next: current };
  }
  const next: PlannerItem =
    command.type === "update"
      ? { ...source, ...command.patch, id: source.id, version: source.version + 1 }
      : { ...source, period: command.proposedPeriod, version: source.version + 1 };
  return {
    outcome: { accepted: true, revision: "next", updatedItems: [next] },
    next: current.map((item) => (item.id === source.id ? next : item)),
  };
}
```

## Wire the planner

```tsx
<YearPlanner
  year={2027}
  layers={layers}
  activeLayerId="build"
  items={items}
  baseRevision="rev-1"
  onChangeRequest={(command) => {
    const result = applyCommand(itemsRef.current, command);
    setItems(result.next);
    return result.outcome;
  }}
  onChangeCommitted={(outcome) => {
    if (outcome.accepted) console.log("saved", outcome.revision);
  }}
  onChangeRejected={(outcome) => {
    if (!outcome.accepted) console.warn(outcome.diagnostics);
  }}
  onDiagnostic={(diagnostic) => console.warn(diagnostic.code, diagnostic.message)}
/>
```

Because `items` is controlled, **every** command needs a handler. Dragging a bar,
resizing it, using the inspector's delete button and the keyboard all flow
through the same path. The existing
[Command lifecycle](https://blendsdk.github.io/year-planner/storybook/?path=/story/year-planner-10-command-lifecycle--accepted-move)
stories show pending, rejected, stale, timeout and accepted-not-applied states.

## Backend pattern

A production host usually sends the command to a server:

```tsx
async function onChangeRequest(command: PlannerCommand, context: CommandContext) {
  const response = await fetch("/api/plan/commands", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ command, baseRevision: context.baseRevision }),
  });
  if (!response.ok) {
    return {
      accepted: false,
      diagnostics: [{ code: "HOST_REJECTED", level: "error", message: "The server rejected the change" }],
    };
  }
  return (await response.json()) as CommandOutcome;
}
```

Return accepted items from the server and merge them into `items`. The planner
compares the command with the current items and settles only when the change is
actually visible.

## Read more

- [Controlled command contract](../commands.md) — request IDs, revisions,
  validation, retries and rollback.
- [Interaction](../interaction.md) — which gestures produce which commands.
- [Performance](../performance.md) — the pending-preview path.
