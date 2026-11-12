# Customization and Holidays

> **Scope**: slots, annotations, holiday metadata and additive item content.

The planner owns its outer surfaces: layout, ARIA, focus and hit testing. The host
adds content through render slots and date metadata; a slot never replaces the
structural surface it decorates.

## Slots

| Slot | Use |
| ---- | --- |
| `getDateMeta(date, context)` | Weekend, holiday, disabled and ARIA label metadata |
| `renderCell(context)` | Additive cell content |
| `renderItem(context)` | Additive item content, badges or status |
| `renderAnnotation(context)` | Annotation body |
| `renderOverflow(context)` | Compact `+N` popover body |
| `renderInspector(context)` | Replace the inspector body |
| `renderTooltip(context)` | Replace the tooltip body |
| `components` | Wrap inner content of a structural part |

```tsx
<YearPlanner
  year={2027}
  getDateMeta={(date) => (date === "2027-12-24" ? { holiday: true, label: "X" } : undefined)}
  renderCell={() => <span>extra</span>}
  renderItem={({ item }) => <span>{item.status}</span>}
  renderOverflow={({ hiddenCount }) => <span>{hiddenCount} hidden</span>}
/>
```

`components` keeps the planner's outer element, ARIA, focus and hit surface. A
custom `Root`, `MonthLabel` or `DayCell` cannot remove those surfaces.

## Annotations

An annotation is an item with `kind: "annotation"`. It renders as a badge in the
annotation channel and carries its own `annotation` payload:

```tsx
const holiday: PlannerItem = {
  id: "company-holiday",
  kind: "annotation",
  layerId: "notes",
  period: { kind: "all-day", startDate: "2027-02-01", endDateExclusive: "2027-02-02" },
  title: "Company holiday",
  version: 1,
  annotation: { label: "OH", background: "#ffd166", priority: 2 },
};
```

Annotation items render but are host-owned for edits in R1; their inspector
actions are disabled. `display.showAnnotations: false` hides the channel.

## Holidays

A holiday is date metadata, not an item. Return it from `getDateMeta` so every
cell and print page sees it:

```tsx
const holidays = new Set(["2027-01-01", "2027-12-24", "2027-12-25", "2027-12-31"]);

<YearPlanner
  year={2027}
  getDateMeta={(date) =>
    holidays.has(date) ? { holiday: true, background: "#fff4ce", ariaLabel: "Public holiday" } : undefined
  }
/>;
```

`DateMeta` also supports `disabled` (blocks editing), `label` (short marker) and
`ariaLabel` (screen-reader text). The same metadata is used by the print tree.

## Item content

`renderItem` receives the item, its ribbon fragment, the fragment count and index,
and the selected/read-only flags. Keep the content non-interactive: the item proxy
is already a focusable control, and a nested button or link is invalid. Put
actions in the inspector.

```tsx
<YearPlanner
  year={2027}
  renderItem={({ item, selected }) => (
    <span data-selected={selected}>{item.title}</span>
  )}
/>
```

The default item colour is the item colour, then the layer colour, then the theme
ribbon colour. A custom class or style can add decoration; unsafe CSS values are
dropped.

## Overflow

Compact density shows the configured number of lanes and puts the rest behind a
per-row `+N` control. `renderOverflow` decorates the popover body; the trigger
stays owned by the planner and remains keyboard reachable.
