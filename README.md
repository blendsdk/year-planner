# Year Planner for React

An open-source React component for long-range annual planning.

The first release targets a classic **14-month, Saturday-first, 37-slot year
grid** — December of the previous year, January–December of the current year,
and January of the next year — with:

- continuous interval ribbons that cross month rows;
- overlapping layers and deterministic visual lanes;
- date-range selection, painting, erasing, moves and resizes;
- custom annotations, holidays, cells and item content;
- themeable CSS, print support and a controlled integration API.

> **Status: pre-alpha.** No package has been published yet. APIs, styles and
> package names may change before the first release. The repository currently
> contains the **M1 foundation slice**; the full R1 experience is in progress.

## Current milestone

| Area | State |
|---|---|
| Temporal core (dates, ISO weeks, half-open intervals) | Done |
| Classic 12–36 month layout, 37 day slots | Done |
| Minimal React grid, classic themes, ISO weeks, print | Done |
| Storybook site, demo, clean-consumer check, CI | Done |
| API Extractor reports and generated TypeDoc API | Done |
| Renderer evidence gate and ADR | Done — HTML renderer, optional SVG shape plane |
| Layers, visibility, ribbons, interactions, commands | Not implemented yet |

The renderer decision is recorded in
[ADR 0001](docs/adr/0001-renderer-strategy.md), with measurements in
[docs/renderer-spike.md](docs/renderer-spike.md). The M1 test evidence is in
[docs/test-report.md](docs/test-report.md).

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
