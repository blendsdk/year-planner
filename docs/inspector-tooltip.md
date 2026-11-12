# Inspector and Tooltip

> **Scope**: the default inspector, custom inspector content, tooltip content and
> the action pipeline.

## Default inspector

Selecting an item opens the inspector aside. It lists the selected items with
their layer, period, status, visibility and editability, plus overflow items and
command feedback. With no selection it shows the empty state. `showInspector`
controls whether the aside is rendered.

The inspector is part of the keyboard model: the item proxy and the inspector
actions share the focus ring and the polite live region.

## Custom inspector

`renderInspector(context)` replaces the inspector body. The aside, heading and
close button remain, so focus and dismissal stay consistent.

```tsx
<YearPlanner
  year={2027}
  renderInspector={({ items, selection, actions }) => (
    <div>
      <p>{items.length} selected</p>
      <button type="button" onClick={() => actions.requestCommand({ kind: "delete", itemIds: selection.items })}>
        Delete
      </button>
    </div>
  )}
/>
```

`context.actions` exposes `close`, `focusItem`, `requestCommand`, `retry` and
`dismiss`. A custom body should not call the host's persistence layer directly;
route edits through `requestCommand` so validation, versions and rollback still
apply.

## Tooltip

The default tooltip shows the item title and period on hover or focus.
`renderTooltip(context)` replaces the body; the positioning, `role="tooltip"` and
the `aria-describedby` wiring stay owned by the planner.

```tsx
<YearPlanner
  year={2027}
  renderTooltip={({ item, fragment }) => (
    <span>
      {item.title} · {fragment?.startDate} → {fragment?.endDateExclusive}
    </span>
  )}
/>
```

The tooltip is closed while the inspector is open and never exposes a hidden
item.

## Actions

The default actions move ±7 days, resize by one day, delete with confirmation,
paint or erase the selected range, and create one day on the active layer.
Annotation actions are disabled because annotations are host-owned in R1.

Every action uses the shared command pipeline: local read-only and version
checks, optional `validateChange`, optional `onChangeRequest`, then a tracked
settlement. Pending items carry `data-yp-pending` and `aria-busy`; warnings
appear as inspector notices; accepted, rejected and accepted-not-applied
outcomes are announced in a polite live region. A rejected action leaves the
source period intact. See [commands.md](commands.md) for the host contract and
[controlled-api.md](controlled-api.md) for the state boundary.
