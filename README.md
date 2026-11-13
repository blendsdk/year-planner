# Year Planner for React

An open-source React component for long-range annual planning.

The first release targets a classic **14-month, Saturday-first, 37-column year
grid** — December of the previous year, January–December of the current year,
and January of the next year — with:

- continuous interval ribbons that cross month rows;
- overlapping layers and deterministic visual lanes;
- date-range selection, marquee, painting, erasing, moves and resizes;
- custom annotations, holidays, cells and item content;
- themeable CSS, A3 print support and a controlled integration API.

> **Status: pre-alpha.** The packages are **not published to a public registry**
> yet. Install the packed tarballs from this repository until the release
> milestone publishes them. APIs, styles and package names may change before
> the first release.

## Quickstart

The example renders a 14-month view from static data, imports the stylesheet,
keeps selection and visibility in controlled state, and prints an A3 page.

```tsx
import { useState } from "react";
import type {
  PlannerItem,
  PlannerLayer,
  PlannerSelection,
  VisibilityState,
} from "@blendsdk/year-planner-core";
import { YearPlanner } from "@blendsdk/react-year-planner";
import "@blendsdk/react-year-planner/styles.css";

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

The packages are unpublished; build the workspace and install the packed
tarballs together with React 19 and React DOM 19. The clean-consumer script
(`pnpm test:consumer`) performs the same packed install in CI. Start with
[docs/getting-started.md](docs/getting-started.md) for the full walkthrough.

## Documentation

The [documentation index](docs/README.md) maps every guide:

| Area | Guide |
| ---- | ----- |
| Getting started | [docs/getting-started.md](docs/getting-started.md) |
| Controlled API | [docs/controlled-api.md](docs/controlled-api.md) |
| Visibility | [docs/visibility.md](docs/visibility.md) |
| Interaction and keyboard | [docs/interaction.md](docs/interaction.md) |
| Theming | [docs/theming.md](docs/theming.md) |
| Customization and holidays | [docs/customization.md](docs/customization.md) |
| Inspector and tooltip | [docs/inspector-tooltip.md](docs/inspector-tooltip.md) |
| Dynamic months | [docs/dynamic-months.md](docs/dynamic-months.md) |
| Print | [docs/print.md](docs/print.md) |
| Accessibility status | [docs/accessibility.md](docs/accessibility.md) |
| Performance status | [docs/performance.md](docs/performance.md) |
| Limitations | [docs/limitations.md](docs/limitations.md) |
| Migration | [docs/migration.md](docs/migration.md) |
| FAQ | [docs/faq.md](docs/faq.md) |

The documentation site is built with VitePress. It hosts the guide, tutorials,
examples and the component catalogue: Storybook is at `/storybook/` (**183 stories across 15 files**) and the generated TypeDoc reference is at `/api/`.
It is designed for `https://blendsdk.github.io/year-planner/`; Pages must be
enabled before it is public.

```bash
pnpm docs:dev      # VitePress at http://localhost:5173/year-planner/
pnpm docs:site     # combined VitePress + Storybook + TypeDoc artifact
```

The renderer decision is in
[ADR 0001](docs/adr/0001-renderer-strategy.md); the CSP contract is in
[docs/security.md](docs/security.md), and the full test evidence is in
[docs/test-report.md](docs/test-report.md).

## Demo routes

Run `pnpm dev` and open the demo:

| Route | Demonstrates |
| ----- | ------------ |
| `?` | Overview with controlled selection and visibility |
| `?commands=1` | Controlled items, validation rejection and rollback |
| `?interaction=1` | Selection, marquee, paint/erase, move and resize |
| `?ac3=1` | Real Fluent UI v9 and MUI buttons in a cell and inspector |
| `?security=1` | A hidden item that must not reach the DOM or inspector |
| `?print=prt01` | The 2017 classic-yellow print sample |
| `?bench=1` | Layout and browser benchmark host |

## Packages

| Package | Purpose |
| --- | --- |
| `@blendsdk/year-planner-core` | Pure TypeScript dates, intervals, layout geometry, visibility and commands. No React, no DOM. |
| `@blendsdk/react-year-planner` | React view, interaction layer, render slots, themes and styles. |

Both packages are **ESM-only**: `"type": "module"`, an `import`-only export map
and an ES Vite build. Fluent UI v9 and MUI token adapters are available at
`@blendsdk/react-year-planner/adapters/fluent` and
`@blendsdk/react-year-planner/adapters/mui` without adding either design system
as a dependency.

## Scope of the first release

- Date-only intervals with half-open semantics.
- 12–36 month windows; the 14-month classic view is the default preset.
- Layers, groups, visibility and custom render channels.
- Continuous ribbons, overlaps, lane allocation and compact overflow.
- Select, multi-select, paint, erase, create, move, resize, cancel, undo/redo.
- Keyboard access, custom render slots, annotations and theming.
- Print A3 baseline; Storybook examples and generated API reference.
- Controlled `items` props; a mock validation/rollback example.

## Explicitly deferred

Resource timeline, recurrence, scenarios, dependencies, split/merge, batch
multi-move, data providers, controlled-host undo, timed-event editing, RTL,
configurable week start, aggregated density, SVG/PDF export, an optimizer, full
headless composition, Shadow DOM, milestones, parent/child activities,
non-Gregorian calendars, drag between layers/resources, a second demo, CJS/UMD
and commercial support. The full list with reasons is in
[DEFERRED.md](DEFERRED.md). None of these is stubbed or presented as implemented.

## Documentation mandate

Every public component, prop combination, state and edge case gets a Storybook
story. Prefer more stories over fewer: themes, window sizes, zoom, locale,
items, annotations, channels, overflow, inspector states, slots, print modes,
controlled states, filters, read-only and error states are all part of the
documented surface. Stories are part of the definition of done, not an optional
extra.

## Development

The repository layout, requirements, plans and architecture decisions live under
`codeops/`.

```bash
pnpm install
pnpm verify          # fast gate: typecheck, lint, coverage, quality, licenses, build, API report, size, Storybook, TypeDoc, pack
pnpm verify:full     # adds Playwright, timezones, audit, performance evidence, benchmarks and the clean-consumer install
pnpm test:quality    # traceability, public API, coverage, size, CI and license contracts
pnpm test:timezones  # date suite under UTC, Pacific/Kiritimati and America/Los_Angeles
pnpm test:audit      # no high or critical dependency advisories
pnpm test:perf       # performance report; PERF_STRICT=1 gates the drag-latency oracle
pnpm bench           # layout and browser benchmarks; --enforce gates the 2x ceiling
pnpm storybook       # interactive component site
pnpm run docs        # API Extractor reports + TypeDoc HTML under docs/api
```

## Community

- [Contributing](./CONTRIBUTING.md) — development workflow and the DCO.
- [Code of Conduct](./CODE_OF_CONDUCT.md) — the expected community behavior.
- [Security policy](./SECURITY.md) — private reporting and the response process.
- [Support](./SUPPORT.md) — best-effort community support, no SLA.
- [Release process](./docs/releasing.md) — versioning, bootstrap, publish and rollback.
- [Open an issue](https://github.com/blendsdk/year-planner/issues/new/choose).

## License

MIT. See [LICENSE](./LICENSE). Contributions are accepted under the Developer
Certificate of Origin; see [CONTRIBUTING.md](./CONTRIBUTING.md).
