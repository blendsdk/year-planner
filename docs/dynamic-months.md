# Dynamic Months

> **Scope**: year and range windows, context months, 12–36 month layouts, units,
> density and zoom.

## year

`year` renders the classic 14-month preset: December of the previous year, the
twelve months of the year, and January of the next year. The grid always has 37
day columns, so a month that starts mid-week still has a stable column.

```tsx
<YearPlanner year={2027} />
```

## range

`range` selects an explicit window and wins over `year`. `monthCount` accepts 12
to 36 months.

```tsx
<YearPlanner range={{ start: { year: 2027, month: 0 }, monthCount: 18 }} />
```

## context months

`contextMonths` changes the context months around `year`: `{ before, after }`.
The default is `{ before: 1, after: 1 }`, which produces the 14-month classic
view. A context month is rendered with the muted context style and still accepts
selection and items.

```tsx
<YearPlanner year={2027} contextMonths={{ before: 2, after: 2 }} />
```

## windows

The validated window range is 12–36 months. A smaller or larger value is rejected
with a diagnostic; the planner does not silently clamp it. Print page counts
follow the same windows: 12–14 months fit one A3 page, 15–28 fit two, and 29–36
fit three.

## density

`display.density` is `compact` (default) or `expanded`. Compact limits the visible
lanes per row and exposes the rest through `+N`; expanded grows the row to show
the lanes. `compactMaxLanes` changes the compact limit.

```tsx
<YearPlanner year={2027} display={{ density: "expanded" }} />
```

## zoom

`display.zoom` scales the rendered grid from `0.75` to `1.5`; the default is `1`.
Zoom changes the visual scale, not the month window.

```tsx
<YearPlanner year={2027} display={{ zoom: 1.25 }} />
```

## units and highlightYear

`units` overrides layout geometry per instance and wins over theme geometry:
`headerHeight`, `monthBand`, `rowHeight`, `weekday` and `weekend`. Use it when the
host needs a denser or taller grid than a theme provides.

`highlightYear` marks a year as current; it changes the emphasis only. It does not
change the window.

## Choosing a window

Use `year` for the classic annual planner, `range` for a fiscal year or a
multi-year programme, and `contextMonths` when the host wants more or less
adjacent context. Storybook contains 12, 14, 18, 24 and 36-month examples for
each layout.
