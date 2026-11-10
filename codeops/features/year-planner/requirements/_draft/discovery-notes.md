# Discovery Notes — Year Planner for React

> **CodeOps Artifact Schema**: 1
> **Status**: Working notes
> **Created**: 2026-11-10
> **Feature**: `year-planner`
> **Source material**: `universal-planning-engine-handoff/` (external, read-only)

## 1. Project vision

A reusable, open-source React component for long-range annual planning. The
flagship view is a classic 14-month, Saturday-first, 37-slot year grid derived
from two photographed physical planners (blue 2016, yellow 2017), extended with
continuous interval ribbons, overlapping layers, annotations, range painting,
drag selection, moves/resizes, theming, print and a controlled integration API.

It is a library/SDK, not a vertical SaaS product and not a complete scheduling
backend. Host applications own persistence, authorization, business rules and
booking correctness.

## 2. Technology decisions already made

- React 19 development target and peer; React 18 is not supported in R1.
- Strict TypeScript; TS 6.0.3 for R1; TS7 canary only.
- Vite 8, Vitest 5, Storybook 10, Playwright, Turbo 2, pnpm 12, Changesets 3,
  Biome 2.
- Two packages: `@blendsdk/year-planner-core` and
  `@blendsdk/react-year-planner`.
- ESM-only R1; generated API docs with TypeDoc and API Extractor.
- Storybook as the public component site; TypeDoc at `/api`; GH Pages hosting.
- MIT license, DCO, no CLA, no commercial license.
- Separate repository: `blendsdk/year-planner`.

## 3. Stakeholders

| # | Role | Description | Key needs |
|---|------|-------------|-----------|
| 1 | React product developer | Integrates the component into a SaaS app | Clear API, controlled state, theming, docs, TypeScript types |
| 2 | End-user planner | HR/ops/campaign/resource planner | Fast annual overview, readable ribbons, selection, keyboard, print |
| 3 | Host application owner | Owns persistence, auth and business rules | Validation hooks, command contract, rollback, no data leakage |
| 4 | Accessibility user | Keyboard/screen-reader user | Focus, labels, announcements, non-color cues |
| 5 | Open-source maintainer | Maintains the package | Tests, CI, docs, release automation, low support burden |

## 4. Comparable systems

| System | Relevant features | R1 decision |
|--------|-------------------|-------------|
| FullCalendar | Multi-month/year views, resource timeline, RRULE | Concepts only; no fork |
| React Big Calendar | Month/week/day, custom views, selection | Concepts only; no year view |
| React Big Schedule | Year views, resource timeline, drag/resize, print | Closest free competitor; differentiate on classic 37-slot layout, layers/ribbons, controlled validation |
| Bryntum Scheduler/Gantt | Resource scheduling, dependencies, enterprise | Not R1 |
| DayPilot | Yearly calendar tutorial, resource calendar | Concepts only; no fork |
| DHTMLX Scheduler | Booking/resource scheduler | Not R1 |
| Microsoft Fluent UI v9 | Theming tokens, FluentProvider | Priority styling adapter |
| MUI | Theme palette, components | Optional styling adapter |

## 5. User journeys

1. A planner opens the current year, sees the 14-month view, toggles
   groups/layers, inspects overlapping ribbons, paints a leave/closure range,
   erases part of it, undoes, and prints A3.
2. A developer controls `items`, `visibility`, `selection` and
   `interaction`; handles `onSelectionChange`, `onChangeRequest` and
   `validateChange`; rejects an over-capacity proposal and observes rollback.
3. A keyboard user moves date focus with arrows, extends a range with
   Shift+Arrow, opens the inspector, moves an item by a week using a menu action,
   and confirms the result.
4. A theming consumer wraps the component in FluentProvider, maps Fluent tokens
   to planner CSS variables, inserts a Fluent Button into a cell and an item, and
   prints the result.

## 6. Edge cases considered

- Cross-month and cross-year intervals; fragments share one item ID.
- Variable weekend/weekday widths; 37 slots always cover 31 days plus leading
  blanks.
- Hidden group/layer/item; show-item under hidden parent; hidden item still
  counts for host validation.
- Three or more overlapping ribbons; compact overflow; expanded lanes.
- Drag across rows; blank cells; chronological min/max; no phantom dates.
- Ctrl/Cmd/Shift selection; marquee; multi-item move confirmation.
- Zero-length/reverse intervals; invalid dates; unsupported years.
- DST/timed periods; display projection only in R1.
- 12, 14, 18 and 24-month windows; A3 pagination.
- Async validation rejection, timeout, stale response, revision mismatch.
- Read-only/locked items; pointer cancel; focus restoration.
- Custom renderers that do not remove the hit surface.
- Hidden data must not appear in DOM, ARIA, tooltips or exports.
- Multiple planner instances with unique SVG/defs IDs.

## 7. Scope confirmation

**In R1:** date core; 12–36 month layout; classic 14 preset; layers/groups/
visibility; continuous ribbons; overlaps/lanes/overflow; select/paint/erase/
create/move/resize/cancel; local undo/redo; keyboard; theming; custom cells/
items/annotations; holidays as host data; print A3; controlled items; mock
validation/rollback; Storybook; API docs; tests; release automation.

**Deferred:** resource timeline, recurrence, scenarios, dependencies, optimizer,
split/merge, batch multi-move, data provider/loading states, controlled-host
undo, aggregated density, RTL, configurable week start, timed editing, SVG/PDF
export, second domain demo, UMD/CJS, commercial support.

## 8. Domain lenses

| Lens | Selected? | Evidence |
|------|-----------|----------|
| Web application | Yes | Browser UI, keyboard/pointer, accessibility, async host validation, controlled state |
| Data and migration | Yes | Versioned public API, serialized visibility presets, package format, mixed-version consumers |
| Distributed and concurrent | Yes, scoped | Async validation, stale responses, revisions, cancellation and rollback; no server or multi-node system |
| Compiler and language | No | No parser/compiler/IR |
| Financial system | No | No money/ledger |

## 9. Domain glossary

| Term | Definition |
|------|------------|
| Activity/item | One logical scheduled entity with identity |
| Occurrence | One instance of a recurrence series (deferred) |
| Period | Half-open `[start, endExclusive)` date-only or timed interval |
| Fragment | Visual projection of one item clipped to one month row |
| Layer group | Hierarchy controlling categorization and visibility |
| Layer | Visual/logical classification with a render channel |
| Render channel | background, highlight, ribbon, annotation or foreground |
| Resource | Schedulable person/asset/space (types only in R1) |
| Assignment | Activity-to-resource link (types/examples only in R1) |
| Visibility | Presentation state; never authorization or occupancy |
| Effective visibility | Derived visibility after group/layer/item/filter precedence |
| Annotation | Date-bound label/decoration, including host-supplied holidays |
| Marquee | Rectangular pointer selection; defaults to item intersection |
| Controlled mode | Host owns items/visibility/selection; component emits requests |
| Command | Typed proposal to create/update/move/resize/delete/paint |
| Diagnostic | Stable-coded error/warning/info with entity and interval context |

## 10. Structuring notes

- Feature slug: `year-planner`.
- RDs are ordered by dependency; see `requirements/README.md`.
- M0 renderer/toolchain spike informs the renderer choice but not R1 behavior.
- The handoff is a source register, not an oracle; its commercial and
  "universal platform" sections are superseded.
