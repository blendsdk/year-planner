# Getting Started

> **Status**: R1 pre-release. The packages are not on a public registry yet.

This guide renders a classic 14-month planner from static data, wires controlled
selection and visibility, and prints an A3 page.

## Install

The packages are not published yet. Until the release milestone publishes them,
build the workspace and install the packed tarballs:

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm --filter @blendsdk/year-planner-core pack --pack-destination ./packs
pnpm --filter @blendsdk/react-year-planner pack --pack-destination ./packs
```

Install the two `.tgz` files from `./packs` together with React 19 and React DOM 19. The React
package depends on `@blendsdk/year-planner-core@0.1.0`, which is not on a
registry yet, so add a pnpm `overrides` entry that maps
`@blendsdk/year-planner-core` to the core tarball (the same pattern as
`scripts/clean-consumer.sh`). Do not use a registry install instruction before
the packages are published.

## Render a 14-month view

`year` renders the classic preset: December of the previous year, the twelve
months of the year, and January of the next year. The grid always has 37 day
columns.

```tsx
import { useState } from "react";
import type {
  PlannerItem,
  PlannerLayer,
  PlannerSelection,
  VisibilityState,
} from "@blendsdk/year-planner-core";
import { YearPlanner } from "@blendsdk/react-year-planner";

const layers: PlannerLayer[] = [
  { id: "bookings", name: "Bookings", channel: "ribbon", color: "#1d4e89", label: "B" },
];

const items: PlannerItem[] = [
  {
    id: "winter",
    kind: "activity",
    layerId: "bookings",
    period: { kind: "all-day", startDate: "2027-01-28", endDateExclusive: "2027-02-07" },
    title: "Winter booking",
    version: 1,
  },
];

export function PlanningPage() {
  const [selection, setSelection] = useState<PlannerSelection>({ dates: [], items: [] });
  const [visibility, setVisibility] = useState<VisibilityState>({
    hiddenGroupIds: [],
    hiddenLayerIds: [],
    hiddenItemIds: [],
  });

  return (
    <>
      <button type="button" onClick={() => window.print()}>
        Print
      </button>
      <YearPlanner
        year={2027}
        items={items}
        layers={layers}
        activeLayerId="bookings"
        selection={selection}
        onSelectionChange={setSelection}
        visibility={visibility}
        onVisibilityChange={setVisibility}
      />
    </>
  );
}
```

## Styles

Import the stylesheet once in the application entry:

```ts
import "@blendsdk/react-year-planner/styles.css";
```

The stylesheet declares four cascade layers in order: `year-planner.base`,
`year-planner.theme`, `year-planner.components` and `year-planner.overrides`.
Host styles can override tokens through `cssVars`, `style` or a theme provider.

## Controlled selection

`selection` and `onSelectionChange` make the host the source of truth. An
uncontrolled planner uses `defaultSelection` instead. A selection holds date
ranges and item IDs; `anchorDate` and `focusDate` keep Shift extension and
keyboard focus stable.

```tsx
const [selection, setSelection] = useState<PlannerSelection>({ dates: [], items: [] });

<YearPlanner selection={selection} onSelectionChange={setSelection} year={2027} />;
```

Hidden items are pruned from selection. The same rule applies to a host that
removes an item from `items`.

## Controlled visibility

`visibility` and `onVisibilityChange` control the visible model. Uncontrolled
use `defaultVisibility`. Group, layer and item hides combine; filters and render
channels apply after them. See [visibility.md](visibility.md) for the full
precedence.

```tsx
const [visibility, setVisibility] = useState<VisibilityState>({
  hiddenGroupIds: [],
  hiddenLayerIds: ["maintenance"],
  hiddenItemIds: [],
});

<YearPlanner
  visibility={visibility}
  onVisibilityChange={setVisibility}
  year={2027}
  items={items}
/>;
```

## Sizing and fit

`display.fit` defaults to `"contain"`. The planner measures its **host region**
with a `ResizeObserver`, scales day columns horizontally and chooses a 24 px
lane budget vertically. A host must give the planner a bounded region:

```tsx
<section style={{ height: 640, minHeight: 0, overflow: "hidden" }}>
  <YearPlanner year={2027} items={items} layers={layers} />
</section>
```

The component root is content-sized, so the nearest parent with a real box is
the measured host. If the planner sits directly in the page, the viewport is
used and the page scrolls. A zero-size host (a hidden tab) keeps the last valid
geometry. If the 24 px column floor or the one-lane vertical budget still does
not fit, `.yp-viewport` scrolls; content is never clipped.

Set `display={{ fit: "none" }}` to keep the explicit design-unit geometry. In
fit mode `display.zoom` scales columns only and is clamped to the 24 px floor;
vertical geometry is fit-driven. `density: "expanded"` is a non-fit preference:
in fit mode the lane budget wins and extra items go to the existing overflow
popover.

## Context menu

`onContextMenuRequest` hands right-click, `Shift+F10` and the `ContextMenu` key
to the host. The component never renders a menu; see
[interaction.md](interaction.md#context-menu) for the request shape and focus
return.

## Print

Call `window.print()` when the planner is on the page. The component renders a
hidden A3 print tree. `print={{ mode: "paginate" }}` produces one to three pages
for a 12–36 month window; `print={{ mode: "fit" }}` scales one page and reports a
diagnostic when the date text would fall below 7 pt. See [print.md](print.md).

```tsx
<YearPlanner year={2027} print={{ page: "A3", mode: "paginate" }} />
```

## SSR

The component reads no browser globals during render, uses explicit `en-US` and
`UTC` defaults, and attaches observers only after mount. The package entry
declares `"use client"`, so React Server Component bundlers place it in a client
boundary. Server-render it with `renderToString` and hydrate with the same
explicit `display.locale`.

## Storybook

Storybook is the component catalogue: **183 stories across 15 files** covering
themes, windows, ribbons, overflow, visibility, interaction, inspector states,
slots, print modes and design-system adapters.

```bash
pnpm storybook        # local site on :6006
pnpm storybook:build  # static site in storybook-static/
```

## ESM-only

The React package is `"type": "module"`. Every export-map condition uses
`import`; Vite builds `formats: ["es"]`; `attw --profile esm-only` and the package
tests enforce the contract. There is no CommonJS or UMD build.

## Demo routes

The private demo demonstrates the integration states:

- `?` — the overview with controlled selection and visibility;
- `?commands=1` — controlled items, validation rejection and rollback;
- `?interaction=1` — selection, marquee, paint/erase, move and resize;
- `?ac3=1` — real Fluent UI v9 and MUI buttons in a cell and inspector;
- `?security=1` — a hidden item that must not reach the DOM or the inspector;
- `?print=prt01` — the 2017 classic-yellow print sample;
- `?bench=1` — the layout and browser benchmark host.

Run it with `pnpm dev`.

## Next steps

- [Controlled API](controlled-api.md) — every controlled/uncontrolled pair.
- [Theming](theming.md) — tokens, presets and design-system adapters.
- [Interaction](interaction.md) — pointer, selection and keyboard.
- [Accessibility](accessibility.md) — semantics and the evidence status.
