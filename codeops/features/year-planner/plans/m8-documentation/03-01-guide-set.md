# Guide Set: Documentation, Storybook and API Reference

> **Document**: 03-01-guide-set.md
> **Parent**: [Index](00-index.md)

## Overview

The guide set is the repo-facing documentation surface. It owns the fourteen
topics named by RD-11, the README quickstart and the deferred-capability list.
Storybook and TypeDoc are the published site; the markdown guides are what a
developer reads in the repository and what the GH Pages artifact links back to.

## Architecture

### Current Architecture

Four topic guides plus evidence documents, linked ad hoc from the README.
`docs/react-view.md` mixes several topics in one file, so no single page owns
theming, customization, the inspector, dynamic months or print.

### Proposed Changes

| Page | Ownership | Action |
| ---- | --------- | ------ |
| `docs/README.md` | Guide index and the fourteen-topic map | New |
| `docs/getting-started.md` | Install, first render, CSS, controlled selection/visibility, print | New (absorbs the React view install/usage sections) |
| `docs/controlled-api.md` | Controlled/uncontrolled prop pairs and state flow | New |
| `docs/visibility.md` | Group → layer → item → filter → channel precedence | New |
| `docs/interaction.md` | Modes, selection, pointer, keyboard | Keep; add a topic-map intro and cross-links |
| `docs/theming.md` | CSS variables, presets, Fluent/MUI adapters | New (absorbs the React view theming section) |
| `docs/customization.md` | Slots, annotations, holidays, date metadata | New (absorbs the React view slots section) |
| `docs/inspector-tooltip.md` | Default and custom inspector, tooltip, actions | New (absorbs the React view inspector section) |
| `docs/dynamic-months.md` | Year/range, context months, 12–36 windows, units, density, zoom | New (expands the React view basic usage) |
| `docs/print.md` | A3 paginate/fit, PRT-01, print CSS | New (absorbs the React view print section) |
| `docs/accessibility.md` | Semantics, keyboard map, contrast, evidence status | Keep; link limitations |
| `docs/performance.md` | Measured status, budgets, known misses, commands | New |
| `docs/limitations.md` | Deferred scope, single-file bundle, browser proxies, parked AT | New |
| `docs/migration.md` | Pre-RD-06 migration and semver/versioning policy | New (absorbs the README migration section) |
| `docs/faq.md` | Common integration questions | New |
| `docs/architecture.md` | Checked-in Mermaid architecture diagram | New (RD-11 Should Have) |
| `docs/commands.md` | Async command lifecycle | Keep; cross-link controlled API |
| `docs/react-view.md` | — | Removed after its sections move |

Evidence documents (`docs/test-report.md`, `docs/security.md`,
`docs/benchmarks/`, `docs/adr/`, the red-phase records) keep their paths and are
linked from the index; they are not rewritten as guides.

### Section migration map

`docs/react-view.md` is removed only after every section has an owner:

| Removed section | Destination |
| --------------- | ----------- |
| Install and import | `getting-started.md` |
| Basic usage | `getting-started.md`; window options in `dynamic-months.md` |
| Data and state | `controlled-api.md` |
| Theming | `theming.md` |
| Items, annotations and overflow | `customization.md` |
| Slots | `customization.md` |
| Interaction | Cross-link `interaction.md`; no copy |
| Inspector | `inspector-tooltip.md` |
| Print | `print.md` |
| SSR | `getting-started.md` |
| Storybook | `getting-started.md` |
| ESM-only package | `getting-started.md` and `migration.md` |

### Topic map

`docs/README.md` carries one row per RD-11 topic and links the evidence
documents and the architecture diagram:

| Topic | Page |
| ----- | ---- |
| Getting started | `getting-started.md` |
| Controlled API | `controlled-api.md` (command lifecycle: `commands.md`) |
| Visibility semantics | `visibility.md` |
| Selection and keyboard | `interaction.md` (keyboard map: `accessibility.md`) |
| Theming | `theming.md` |
| Customization and holidays | `customization.md` |
| Inspector and tooltip | `inspector-tooltip.md` |
| Dynamic months | `dynamic-months.md` |
| Print | `print.md` |
| Accessibility status | `accessibility.md` |
| Performance status | `performance.md` |
| Limitations | `limitations.md` |
| Migration | `migration.md` |
| FAQ | `faq.md` |

## Implementation Details

### Required content per page

| Page | Required sections |
| ---- | ----------------- |
| `getting-started.md` | Install; Render a 14-month view; Styles; Controlled selection; Controlled visibility; Print; SSR; Storybook (with the current 171-story count); ESM-only; Next steps |
| `controlled-api.md` | Controlled vs uncontrolled; `items`; `selection`; `visibility`; `filter`; command lifecycle link |
| `visibility.md` | Precedence; groups; layers; items; filters; channels; hidden-data rule |
| `theming.md` | CSS variables; presets; `createTheme`; provider; Fluent UI v9 example; MUI example; contrast |
| `architecture.md` | A Mermaid diagram of core, React, adapters, Storybook and docs site |
| `customization.md` | Slots; annotations; holidays via `getDateMeta`; item content; structural wrappers |
| `inspector-tooltip.md` | Default inspector; custom inspector; tooltip; actions and pending states |
| `dynamic-months.md` | `year`; `range`; `contextMonths`; 12–36 windows; `units`; density; zoom |
| `print.md` | A3 paginate; fit; PRT-01; print CSS; page counts |
| `performance.md` | Measured status; budgets; known misses; how to reproduce; `Conformance claim: none`; link to `docs/test-report.md` |
| `limitations.md` | Deferred scope; single-file bundle; browser proxies; parked manual audit |
| `migration.md` | Pre-RD-06 migration; semver policy; API reports |
| `faq.md` | At least eight question/answer pairs |

### README quickstart

`README.md` must contain one fenced `tsx` block that:

- imports `YearPlanner` and `@blendsdk/react-year-planner/styles.css`;
- defines a static `PlannerItem[]` for a 14-month window;
- holds `selection` and `visibility` in `useState`;
- passes `selection`/`onSelectionChange` and `visibility`/`onVisibilityChange`;
- calls `window.print()` from a button.

The install note is honest: the packages are not on the public registry yet, so
the example points at the packed-tarball/consumer path
(`pnpm test:consumer` and the `file:` install in `scripts/clean-consumer.sh`)
until RD-12 publishes. The README also links `docs/README.md`, the Storybook
site and the API reference, and states the current story count (AR-19, AR-26).

### `DEFERRED.md`

One bullet per RD-11 deferred capability, with a one-line reason and the
replacement or workaround where one exists: resource timeline, recurrence,
scenarios, dependencies, split/merge, batch multi-move/bulk, data
provider/loading/error states, controlled-host undo, timed editing, RTL, week
start, aggregated density, SVG/PDF export, optimizer, full headless composition,
Shadow DOM, milestones, parent/child activities, non-Gregorian calendars, drag
between layers/resources, second demo, CJS/UMD and commercial support.

### Error Handling

| Error Case | Handling Strategy | AR Ref |
| ---------- | ----------------- | ------ |
| A topic page is missing or unreachable | Contract test fails and names the topic and path | AR-4 |
| A topic page is a stub | Contract asserts the required H2 headings per page and the FAQ pair count | AR-4 |
| A relative link points nowhere | Contract resolves every markdown link in `README.md`, `DEFERRED.md` and `docs/**` on disk | AR-4 |
| The README quickstart drifts from the API | Contract asserts one fenced `tsx` block with the required imports, state, callbacks and print call | AR-5 |
| A deferred capability is described as implemented | `DEFERRED.md` has one entry per capability; the contract rejects positive conformance phrases and requires the normalized `Conformance claim: none` line | AR-13, AR-14 |
| The story count drifts | Contract recomputes the count and compares it with all three docs | AR-19 |
| A published asset has no provenance | Contract asserts no `_reference/` path is published and every committed binary is allowlisted | AR-29 |

> **Traceability:** every structural decision above is recorded in
> [00-ambiguity-register.md](00-ambiguity-register.md).

## Testing Requirements

- `tests/quality/docs-contract.spec.test.ts` owns ST-1 through ST-8, ST-28 and ST-29; the demo and report cases live in `demo-contract.spec.test.ts` from Phase 5.
- Link resolution, topic coverage, quickstart shape, `DEFERRED.md` completeness
  and honesty checks run in the existing `test:quality` project.
- No new runner, dependency or snapshot.
