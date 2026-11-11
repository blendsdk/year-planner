# Year Planner for React

An open-source React component for long-range annual planning.

The first release targets a classic **14-month, Saturday-first, 37-slot year
grid** — December of the previous year, January–December of the current year,
and January of the next year — with:

- continuous interval ribbons that cross month rows;
- overlapping layers and deterministic visual lanes;
- date-range selection, marquee, painting, erasing, moves and resizes;
- custom annotations, holidays, cells and item content;
- themeable CSS, print support and a controlled integration API.

> **Status: pre-alpha.** No package has been published yet. APIs, styles and
> package names may change before the first release. The repository now contains
> the **M1 + M2 core + RD-06 rendered view + RD-07 interaction + RD-08 command
> lifecycle** slices.

## Current milestones

| Area | State |
|---|---|
| Temporal core (dates, ISO weeks, half-open intervals) | Done — M1 |
| Classic 12–36 month layout, 37 day slots | Done — M1 |
| Minimal React grid, classic themes, ISO weeks, print | Done — M1 |
| Storybook site, demo, clean-consumer check, CI | Done — M1; 157-story suite across RD-06, RD-07 and RD-08 |
| API Extractor reports and generated TypeDoc API | Done — M1 |
| Renderer evidence gate and ADR | Done — HTML renderer, optional SVG shape plane |
| Entity model, validation, layers, visibility, editability | Done — M2 core |
| Paint/erase, ribbons, lanes, compact overflow, hit index | Done — M2 core |
| A3 paginate/fit print planning | Done — M2 core |
| React grid, ribbons, annotations, overflow, tooltips | Done — RD-06 |
| Theming, presets, provider, slots, inspector | Done — RD-06 |
| A3 multi-page print output and Fluent/MUI token adapters | Done — RD-06 |
| Pointer, keyboard and touch interaction, marquee, drag/resize/paint/create | Done — RD-07 |
| Controlled commands, request IDs, versions, rollback and accepted-not-applied | Done — RD-08 |

The renderer decision is recorded in
[ADR 0001](docs/adr/0001-renderer-strategy.md), with measurements in
[docs/renderer-spike.md](docs/renderer-spike.md). Test evidence for all slices is
in [docs/test-report.md](docs/test-report.md). Usage and theming are documented
in [docs/react-view.md](docs/react-view.md); the CSP contract is in
[docs/security.md](docs/security.md).

## Usage

```tsx
import { YearPlanner } from "@blendsdk/react-year-planner";
import "@blendsdk/react-year-planner/styles.css";

<YearPlanner year={2027} items={items} layers={layers} activeLayerId="bookings" />;
```

Interaction is documented in [docs/interaction.md](docs/interaction.md) and the
controlled command contract in [docs/commands.md](docs/commands.md). The package
is **ESM-only**: `"type": "module"`, an `import`-only export map and
an ES Vite build. Fluent UI v9 and MUI token adapters are available at
`@blendsdk/react-year-planner/adapters/fluent` and
`@blendsdk/react-year-planner/adapters/mui` without adding either design system
as a dependency.

### Migrating the pre-RD-06 preview

- `YearPlannerTheme` is now the token object; preset strings use
  `YearPlannerThemeName`.
- `display.theme` still accepts a preset string (or a host theme name).
- `YearPlannerDisplay` and `YearPlannerPrint` remain aliases.
- The additive `units` prop remains and wins over theme geometry.

## Packages

| Package | Purpose |
| --- | --- |
| `@blendsdk/year-planner-core` | Pure TypeScript dates, intervals, layout geometry, visibility and commands. No React, no DOM. |
| `@blendsdk/react-year-planner` | React view, interaction layer, render slots, themes and styles. |

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
multi-move, data providers, timed-event editing, RTL, configurable week start,
aggregated density, SVG/PDF export and a second domain demo. These are not
stubbed or presented as implemented.

## Documentation mandate

Every public component, prop combination, state and edge case gets a Storybook
story. Prefer more stories over fewer: themes, window sizes, zoom, locale,
items, annotations, channels, overflow, inspector states, slots, print modes,
controlled states, filters, read-only and error states are all part of the
documented surface. Stories are part of the definition of done, not an optional
extra.

## Development

The project is being built under the CodeOps workflow. The repository layout,
requirements, plans and architecture decisions live under `codeops/`.

```bash
pnpm install
pnpm verify          # fast gate: typecheck, lint, coverage, build, API report, size, Storybook, TypeDoc, pack
pnpm verify:full     # adds Playwright and the clean-consumer install
pnpm storybook       # interactive component site
pnpm run docs        # API Extractor reports + TypeDoc HTML under docs/api
```

The component is not published. A fresh consumer can install the packed
tarballs from this repository with `pnpm test:consumer`.

## License

MIT. See [LICENSE](./LICENSE). Contributions are accepted under the Developer
Certificate of Origin; see [CONTRIBUTING.md](./CONTRIBUTING.md).
