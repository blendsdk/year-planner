# Controlled API

> **Scope**: the controlled and uncontrolled prop pairs, state ownership and the
> command lifecycle boundary.

The planner works in two modes. In **controlled** mode the host owns the value and
receives a change request through a callback. In **uncontrolled** mode the
planner owns an internal value, seeded by a `default*` prop, and reports changes
the same way. A control always wins over its default.

## Controlled vs uncontrolled

| Domain | Controlled | Uncontrolled seed | Change callback |
| ------ | ---------- | ----------------- | --------------- |
| Items | `items` | `defaultItems` | `onItemsChange` |
| Selection | `selection` | `defaultSelection` | `onSelectionChange` |
| Visibility | `visibility` | `defaultVisibility` | `onVisibilityChange` |
| Filter | `filter` | `defaultFilter` | `onFilterChange` |

Do not mix a controlled prop with its default for the same domain. When a
controlled prop is present, the planner renders that value and never applies a
local change to it; the host must update the prop in the callback. The callback
receives the proposed next value, so the host can accept, transform or ignore it.

## Items

`items` is the authoritative model. Changes made through the inspector or a
pointer gesture follow the command pipeline (see below); an accepted local change
in uncontrolled mode calls `onItemsChange`. Invalid items are dropped by the core
validator and reported through `onDiagnostic`; valid siblings still render.

```tsx
const [items, setItems] = useState<PlannerItem[]>(initialItems);

<YearPlanner
  items={items}
  onItemsChange={setItems}
  layers={layers}
  activeLayerId="bookings"
  year={2027}
/>;
```

## Selection

`selection` holds date ranges and item IDs plus the optional anchors used by
Shift extension and keyboard focus. A controlled host can select a range, then
clear or replace it without the planner fighting the value. Hidden items are
pruned automatically.

```tsx
const [selection, setSelection] = useState<PlannerSelection>({ dates: [], items: [] });

<YearPlanner
  selection={selection}
  onSelectionChange={setSelection}
  year={2027}
  items={items}
/>;
```

## Visibility

`visibility` controls groups, layers, items and render channels. Uncontrolled
hosts can use `defaultVisibility`. The effective visibility is the combination of
the explicit hides, the filters and the channel rules; see
[visibility.md](visibility.md).

```tsx
const [visibility, setVisibility] = useState<VisibilityState>({
  hiddenGroupIds: [],
  hiddenLayerIds: [],
  hiddenItemIds: [],
});

<YearPlanner
  visibility={visibility}
  onVisibilityChange={setVisibility}
  year={2027}
  items={items}
/>;
```

## Filter

`filter` narrows the visible set by layer, resource, status and title. A filter
is a view concern, not a data mutation: the item still exists and reappears when
the filter is cleared. The callback receives the next filter state.

```tsx
<YearPlanner
  filter={{ layerIds: ["bookings"], search: "winter" }}
  onFilterChange={setFilter}
  year={2027}
  items={items}
/>;
```

## Command lifecycle

Pointer edits and inspector actions do not write items directly. They build a
`PlannerCommand` and run it through:

1. local read-only and version checks;
2. optional `validateChange(command, context, signal)`;
3. optional `onChangeRequest(command, context, signal)` with one shared deadline;
4. a tracked settlement: accepted, rejected, timed out, or accepted-not-applied.

`onChangeCommitted` and `onChangeRejected` receive the outcome. A request ID
makes late responses safe to ignore; `baseRevision` carries the host revision.
The full contract, including retries and rollback, is in
[commands.md](commands.md).

```tsx
<YearPlanner
  items={items}
  validateChange={() => ({ permitted: true, diagnostics: [] })}
  onChangeRequest={async (command) => {
    // applyLocally is a host helper that turns a command into the next items.
    const nextItems = applyLocally(items, command);
    const nextRevision = String(nextItems.length);
    setItems(nextItems);
    return { accepted: true, revision: nextRevision, updatedItems: nextItems };
  }}
  year={2027}
/>;
```

## Choosing a mode

Use controlled state when the host persists items, syncs multiple views or needs
to reject a change. Use uncontrolled state for a local demo or a read-mostly
view. Both modes share the same command pipeline, accessibility behaviour and
diagnostics.
