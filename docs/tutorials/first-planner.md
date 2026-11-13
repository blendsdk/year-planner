# Your first planner

> **Time**: about 10 minutes. **Prerequisites**: React 19 and a bundler that
> understands ESM.

By the end of this tutorial you have a 14-month planning grid with two project
layers, a milestone annotation, a print button and a working inspector.

## 1. Install

The packages are prepared but not published to npm yet. Use the tarball path in
[Getting started](../getting-started.md#install) until the registry release;
after that the same example works with a normal install.

```bash
pnpm add @blendsdk/react-year-planner @blendsdk/year-planner-core
```

## 2. Define the layers

Layers decide the ribbon colour and the interaction channel. A construction
company might separate new build, renovation and service work.

```tsx
import type { PlannerLayer } from "@blendsdk/year-planner-core";

const layers: PlannerLayer[] = [
  { id: "build", name: "New build", channel: "ribbon", color: "#1d4e89", label: "B" },
  { id: "renovation", name: "Renovation", channel: "ribbon", color: "#8358c6", label: "R" },
  { id: "milestones", name: "Milestones", channel: "annotation", color: "#f6bd60" },
];
```

Every layer has one channel. Ribbon items become long bars; annotation items
become compact chips. A date cell stays empty when it has no item.

## 3. Define projects

A period is **half-open**: `startDate` is included, `endDateExclusive` is not.
That is why a project that ends on 28 May uses `2027-05-29`.

```tsx
import type { PlannerItem } from "@blendsdk/year-planner-core";

const items: PlannerItem[] = [
  {
    id: "riverside",
    kind: "activity",
    layerId: "build",
    period: { kind: "all-day", startDate: "2027-02-02", endDateExclusive: "2027-05-29" },
    title: "Riverside offices",
    status: "active",
    version: 1,
  },
  {
    id: "harbor",
    kind: "activity",
    layerId: "renovation",
    period: { kind: "all-day", startDate: "2027-03-09", endDateExclusive: "2027-07-30" },
    title: "Harbor retrofit",
    status: "active",
    version: 1,
  },
  {
    id: "permit",
    kind: "annotation",
    layerId: "milestones",
    period: { kind: "all-day", startDate: "2027-02-01", endDateExclusive: "2027-02-02" },
    title: "Riverside permit",
    annotation: { label: "P", background: "#ffd166", priority: 2 },
    version: 1,
  },
];
```

## 4. Render the year

Give the planner a bounded host region. The default `display.fit` is `contain`,
so the component measures the parent and fits the year into it.

```tsx
import "@blendsdk/react-year-planner/styles.css";
import { YearPlanner } from "@blendsdk/react-year-planner";
import { useRef } from "react";

export function Plan() {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <>
      <button type="button" onClick={() => window.print()}>
        Print A3
      </button>
      <div ref={ref} style={{ height: 680, minHeight: 0 }}>
        <YearPlanner
          year={2027}
          layers={layers}
          defaultItems={items}
          activeLayerId="build"
          print={{ page: "A3", mode: "paginate" }}
          display={{ theme: "classic-blue", showISOWeekNumbers: true }}
        />
      </div>
    </>
  );
}
```

The root is content-sized; the **parent** is measured. A parent without a real
height makes the vertical budget follow the content, so the year will not
shrink. Use a fixed height, `height: 100%` with `min-height: 0`, or a flex child
that can shrink.

## 5. Select and inspect

The planner owns selection by default. Click a date or an item; the built-in
inspector shows the item and offers move, resize and delete. Add
`onSelectionChange` when your app needs the selection:

```tsx
const [selection, setSelection] = useState<PlannerSelection>({ dates: [], items: [] });
<YearPlanner
  year={2027}
  layers={layers}
  defaultItems={items}
  defaultSelection={selection}
  onSelectionChange={setSelection}
/>;
```

## What next

- [Controlled commands](./controlled-commands.md) — send changes through a host.
- [Fit the grid to a host](../how-to/fit-to-host.md) — the sizing contract.
- [Print an A3 plan](./print-a3-plan.md) — page budgets and print CSS.
- [The Storybook demos](https://blendsdk.github.io/year-planner/storybook/) —
  the same features with every state visible.
