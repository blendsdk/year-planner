---
layout: home

hero:
  name: Year Planner for React
  text: Plan the whole year in one component
  tagline: A 12–36 month, 37-column planning grid for construction, logistics, staffing and every team that plans a year at a glance.
  image:
    src: /screenshots/full-demo-hero.png
    alt: The Northwind Construction plan in the Year Planner
  actions:
    - theme: brand
      text: Open the full demo
      link: /examples/full-demo
    - theme: alt
      text: Get started
      link: /getting-started

features:
  - icon: 🗓️
    title: 12–36 months, 37 columns
    details: A classic Saturday-first year grid with context months, ISO week numbers and continuous ribbons across month rows.
  - icon: 📐
    title: Fit to the host
    details: Columns scale horizontally and rows choose a 24 px lane budget, so a 14-month view fits a laptop without shrinking hit targets.
  - icon: ⚡
    title: Built for 2,000 items
    details: One projection per model, a max-end lane index and row-scoped selection keep clicks fast on a full year of work.
  - icon: 🎨
    title: CSS-variable theming
    details: 56 built-in themes, host token overrides and optional Fluent UI v9 and MUI adapters.
  - icon: ♿
    title: Accessible by default
    details: A roving grid, live-region announcements, 24 px targets, reduced-motion support and automated axe coverage.
  - icon: 🖨️
    title: A3 print output
    details: A hidden print tree paginates a 12–36 month window into one to three A3 landscape pages.
---

## A full year, not a scroll bar

The default 14-month window shows December of the previous year, January to
December, and January of the next year. The component can widen to 36 months
without changing the renderer: the month rows are data, not a hard-coded
calendar.

<img class="screenshot" src="/screenshots/full-demo.png" alt="Northwind Construction's 2027 plan in the Year Planner" />

The [full construction demo](./examples/full-demo.md) is a working application:
double-click a date to allocate a project, right-click a bar to edit or delete
it, and reload the page to see the plan restored from browser storage.

## Start with one component

```tsx
import { YearPlanner } from "@blendsdk/react-year-planner";
import "@blendsdk/react-year-planner/styles.css";

const layers = [{ id: "build", name: "Build", channel: "ribbon", color: "#1d4e89" }];
const projects = [
  {
    id: "riverside",
    kind: "activity",
    layerId: "build",
    period: { kind: "all-day", startDate: "2027-02-02", endDateExclusive: "2027-05-28" },
    title: "Riverside offices",
    version: 1,
  },
];

export function Plan() {
  return <YearPlanner year={2027} layers={layers} defaultItems={projects} />;
}
```

<div class="hero-note">
  <strong>Status:</strong> 0.3.1 is published to npm with provenance. Install it
  with <code>pnpm add @blendsdk/react-year-planner</code>.
</div>

## Explore

| Start here | What you will find |
| --- | --- |
| [Your first planner](./tutorials/first-planner.md) | Install the component, add layers and projects, and print the year |
| [Controlled commands](./tutorials/controlled-commands.md) | Route create, move, resize and delete through a host backend |
| [Fit the grid to a host](./how-to/fit-to-host.md) | Measure a bounded region and keep 24 px targets |
| [Host-owned context menu](./how-to/context-menu.md) | Right-click a date, item or annotation and render your own menu |
| [Examples](./examples/index.md) | Live demos, themes, print and design-system adapters |
| [Story index](./stories.md) | Every story in the built Storybook |
| [Storybook](https://blendsdk.github.io/year-planner/storybook/) | The full interactive component catalogue |
| [API reference](https://blendsdk.github.io/year-planner/api/) | Generated TypeDoc for all three packages |
| [Localization](https://blendsdk.github.io/year-planner/localization.html) | 45 locale catalogues and message overrides |
