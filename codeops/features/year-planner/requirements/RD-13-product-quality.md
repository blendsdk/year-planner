# RD-13: Product Quality — Fit, Performance and Interaction Polish

> **Document**: RD-13-product-quality.md
> **Status**: Preflighted
> **Created**: 2026-11-12
> **Project**: Year Planner for React
> **Depends On**: RD-01 through RD-12
> **CodeOps Artifact Schema**: 1

---

## Feature Overview

R1 is feature-complete and release-ready, but it has not been published. Direct
use of the demo exposed four quality gaps that matter more than new planning
features: the classic 14-month grid is physically too large for an embedded
application layout, initial render and first interaction feel slow, the header
typography looks aggressive and is not centred, and right-click has no
behaviour. The Storybook catalogue documents states but does not demonstrate
interactions, so a first-time reader clicks and sees nothing happen.

RD-13 is the R1.5 quality pass before the first public release. It makes the
planner fit real application regions, makes the supported data size responsive,
polishes the header typography, adds a host-owned context-menu contract, and
turns Storybook into a demonstrable product surface. It adds no new planning
capability and does not rewrite the renderer.

---

## Functional Requirements

### Must Have

- [ ] A container-aware fit mode: the planner measures its **host region**, scales
  column widths horizontally and chooses a vertical lane budget, so the grid
  fits without clipping, down to **24 px cells and 24 px item proxies**, then
  scrolls inside its own viewport instead of shrinking below that floor. At the
  smallest supported region the fit shows one visible ribbon lane per month and
  routes the remaining items to the existing overflow popover.
- [ ] The classic 14-month view fits a **1280 × 800** application region with
  one visible lane per month, and a 12-month view fits **1024 × 768** or scrolls
  explicitly. Month and year labels are centred in their band; context-month
  years use a two-digit form so the compact band remains legible; day-name and
  month-name typography is smaller and calmer.
- [ ] Header typography is driven by CSS variables (`--yp-font-*`) declared once
  in the theme root, not hard-coded pixel values in header selectors. Cell text,
  item labels and day numbers keep their current readable sizes.
- [ ] Production-build performance at the supported data size, unthrottled on
  the reference host: **500-item initial render p95 ≤150 ms**, **2,000-item
  drag input-delay p95 ≤8 ms** (time from pointer event to handler), and
  **click-to-select work p95 ≤50 ms** (pointer-down to selection commit). Record
  **4× CPU-throttled** diagnostics for initial render and drag; the throttled
  numbers are reported, not substituted for the gate. 10,000 items remains a
  documented stress case, not a target.
- [ ] A host-owned context-menu contract: right-click, Shift+F10 and the
  ContextMenu key raise a discriminated request for a date, item or annotation;
  the component never renders a menu. With no handler, the native browser menu
  is preserved.
- [ ] Right-clicking an item selects it without starting a move, resize, paint
  or marquee gesture.
- [ ] Storybook opens with a **Demos** section containing at least six stories
  with `play` functions and an **event-log playground** that shows selection,
  command and context-menu events as they happen. Every story has a one-line
  description; the existing state catalogue is retained.
- [ ] The intended first published version is **`0.3.0`**; `0.2.0` is not
  published. `docs/releasing.md`, `docs/migration.md` and `docs/test-report.md`
  record the bootstrap and provenance sequence for `0.3.0` / `0.3.1`. The
  “never published” fact is a release-time registry check recorded as `partial`
  until the owner runs it.
- [ ] Issue #4 (auto-fit) is resolved by the fit contract, or explicitly
  re-scoped with the owner's ruling recorded before the plan closes.

### Should Have

- [ ] Visual-regression snapshots at **1280 × 800**, **1440 × 900** and
  **1024 × 768** for the default theme.
- [ ] The existing Playwright benchmark harness gains a CPU-throttle profile and
  a click-to-select metric; the baseline is checked in under
  `docs/benchmarks/rd13-baseline.md`.
- [ ] A demo app shell that shows the planner inside a bounded application
  region with header, sidebar and footer, instead of a full-page planner.
- [ ] The existing Storybook titles remain the Reference surface; Demos is added
  first. A separate top-level “Reference” rename is explicitly not required
  because it would break the RD-11 required-story contract.
- [ ] The 37-column model remains unchanged; no column-count, week-start or
  calendar-system change.

### Won't Have (Out of Scope)

- A vanilla-JavaScript, canvas, WebGL or Web Component renderer rewrite. The
  React renderer stays; only transient drag previews may write DOM styles
  imperatively.
- Shrinking cells below 24 px, non-uniform scaling or CSS `transform: scale`.
- Automatically reducing the visible month window without an explicit host
  decision.
- A built-in context-menu component or a new design-system dependency. Fluent UI
  and MUI remain optional adapters; their menus are host-owned.
- Supporting 10,000 items at 60 fps in R1.5.
- New planning capabilities: recurrence, dependencies, resource timelines,
  RTL, configurable week start, milestones or non-Gregorian calendars.
- A WCAG conformance claim or a manual NVDA/VoiceOver audit; the manual audit
  remains parked.
- Publishing `0.2.0` or any pre-release tag.

---

## Technical Requirements

### Fit and responsive units

The component already renders inside `.yp-viewport { overflow: auto }` and
supports `zoom` in `[0.75, 1.5]`. Those are not enough: the natural grid is
about 2,000 px wide and 1,332 px tall at the default units, so a 1440 × 900
laptop with an application sidebar needs a scale below the current floor.

The fit contract is:

```ts
interface DisplayConfig {
  /** Fit the grid to its container; defaults to "contain". */
  fit?: "none" | "contain";
  /** User zoom multiplier applied after fit; defaults to 1. */
  zoom?: number;
}
```

- `fit: "contain"` measures the nearest **host region** with a
  `ResizeObserver`. The component root is content-sized, so it is not the
  measured element; the host must give the planner a bounded height.
- The fit is two-dimensional and deliberately **not** one uniform scale:
  - **Horizontal:** scale column widths and the month band from the available
    width, clamped so weekday and weekend columns stay at least 24 px.
  - **Vertical:** keep lane height at 24 px and choose the largest visible-lane
    budget (1–3) that fits the available height. At the smallest supported
    region the budget is one lane; the remaining items use the existing overflow
    popover.
- If the horizontal floor or the one-lane vertical budget still does not fit,
  `.yp-viewport` scrolls; the component never clips content.
- `fit: "none"` preserves the current explicit-size behaviour.
- In fit mode, `zoom` multiplies the horizontal scale only and is clamped to the
  24 px column floor; vertical geometry is fit-driven. In `fit: "none"`, `zoom`
  keeps its current two-axis behavior.
- `density: "expanded"` is a user preference for the non-fit mode; in fit mode
  the vertical lane budget wins and extra lanes move to overflow.
- Print output is unaffected; print uses its own A3 pagination.
- No `transform: scale`; text must remain crisp and hit targets must remain
  measurable.

### Performance

The measured curve is superlinear: 500 items render in about 414 ms and 10,000
items in about 50,458 ms. That is an algorithmic signal, not a React-mount
signal. The performance work therefore starts with evidence:

1. Profile the production build at 500 and 2,000 items with 4× CPU throttling.
2. Fix algorithmic work first: index items once per model, cache `Intl`
   formatters, precompute per-cell date metadata, and stabilize callback and
   row props so `memo` boundaries hold.
3. Move transient drag preview geometry out of React state into refs and
   direct style writes; commit the final selection once on pointer-up.
4. Re-measure after the fit work; the smaller grid must not hide a remaining
   cost.

The supported target is **2,000 items**. The reference host remains the RD-10
host (Intel i5-3470S, 4 vCPU, 14 GiB RAM, Chromium from Playwright). Results
are recorded in `docs/benchmarks/rd13-baseline.md` and
`docs/performance.md`.

### Typography

- The month/year label is centred horizontally and vertically in the band,
  using two centred lines: short month name, then a two-digit year for every
  month. The full year remains available in the accessible name and tooltip.
- Day names are smaller and lighter than today's 14 px/700; the month name is
  smaller than today's 18 px/700. Exact values are tuned in the visual
  prototype and recorded in the plan.
- Font sizes move to CSS variables declared once in the theme root; no
  hard-coded `font-size` values remain in the header or cell selectors.
- Day and week numbers inherit the existing tabular numerals and are covered by
  a computed-style test.
- Cell text, item labels and print typography are not reduced.

### Context menu

```ts
type PlannerContextTarget =
  | { kind: "date"; date: DateKey }
  | { kind: "item"; itemId: string; date: DateKey }
  | { kind: "annotation"; annotationId: string; date: DateKey };

interface PlannerContextMenuRequest {
  target: PlannerContextTarget;
  clientX: number;
  clientY: number;
  anchorRect: DOMRect;
  source: "pointer" | "keyboard";
}

interface YearPlannerProps {
  /** Raises a host-owned context-menu request; no menu is rendered. */
  onContextMenuRequest?: (request: PlannerContextMenuRequest) => void;
}
```

- The component calls `preventDefault()` only when a handler is provided.
- Right-click on an unselected item selects it first, then raises the request;
  no move/resize/paint gesture starts.
- Shift+F10 and the ContextMenu key raise the same request from the focused
  cell or item with `source: "keyboard"` and the focused element's rect.
- The host renders Fluent `Menu` or MUI `Menu` in its own portal. The package
  ships adapter examples in Storybook, not menu components.
- Focus returns to the originating cell or item when the host menu closes; the
  host owns that behaviour and the documentation states it.

### Storybook

- Navigation order: **Demos** (new), **Reference** (existing state catalogue),
  **API** (print, slots, adapters).
- Demos: select a range, move an item, resize an item, paint a layer, keyboard
  navigation, and context menu. Each has a `play` function and a one-line
  description.
- The event-log playground renders a side panel with timestamped events from
  selection, command and context-menu callbacks.
- Every story has a `parameters.docs.description.story` one-liner.
- The existing 174 stories remain available; redundant variants may be merged
  only when the state remains represented elsewhere.

### Release

- `0.3.0` is the first published version. The `0.2.0` changelog remains as
  unpublished history; the first npm publication is a manual bootstrap of
  `0.3.0`, followed by a `0.3.1` provenance-signed release through OIDC within
  the trusted-publisher validation window.
- `docs/releasing.md` and `docs/migration.md` replace the `0.2.0` bootstrap
  narrative with the `0.3.0` / `0.3.1` sequence.
- The release checklist gains the fit, performance, context-menu and demo
  evidence.

---

## Integration Points

- RD-03 supplies the 37-column classic layout and dynamic month windows.
- RD-06 supplies `DisplayConfig`, themes and the CSS-variable pipeline.
- RD-07 supplies the gesture engine, selection state and keyboard navigation.
- RD-09 supplies the 24 px target contract and focus behaviour.
- RD-10 supplies the Playwright benchmark harness and the reference host.
- RD-11 supplies the Storybook catalogue and docs site.
- RD-12 supplies the release workflow and the `0.2.0` → `0.3.0` version path.

---

## Scope Decisions

| Decision | Options Considered | Chosen | Rationale | AR Ref |
|---|---|---|---|---|
| Renderer | Optimize React / imperative renderer / vanilla rewrite / canvas | Optimize React; imperative drag preview only | The superlinear curve is algorithmic; a rewrite would keep the complexity and risk accessibility | AR-4 |
| Fit | Transform scale / responsive units / auto month reduction | Responsive units with a 24 px floor and internal scroll | Keeps text crisp and targets legal; does not silently change the visible range | AR-5 |
| Performance target | 2k / 10k | 2k supported; 10k stress | 10k is not the R1 use case and needs virtualization, not a rewrite | AR-3 |
| Typography | Full redesign / header-only polish | Header-only polish plus tokens | Cell text already works for the user; headers are the complaint | AR-11 |
| Context menu | Built-in menu / host-owned request | Host-owned request | Fluent and MUI own their menus; the component stays design-system neutral | AR-13 |
| Stories | Describe all 174 / add demos + describe all | Add Demos and event log; describe every story; keep the catalogue | Preserves the state-coverage mandate while fixing the first-run experience | AR-17 |
| First release | Publish 0.2.0 / publish 0.3.0 | 0.3.0 | Nothing is published; do not ship a version already known to be weak | AR-2 |
| Manual AT audit | Run now / keep parked | Keep parked | No AT host is available; no conformance claim is made | AR-26 |

---

## Security Considerations

- **Data sensitivity**: The context-menu request carries only an item or
  annotation identifier, a date key, pointer coordinates and a DOM rect. No
  item content, hidden fields or host data is included.
- **Input validation**: The fit scale is clamped; `ResizeObserver` callbacks
  are bounded; no user-supplied CSS or HTML is introduced.
- **Injection**: No new HTML string rendering. Context-menu requests are
  callbacks, not DOM insertion points.
- **Authentication/authorization**: N/A; the component remains client-side with
  no backend.
- **Privacy**: Hidden items remain absent from the DOM and from context-menu
  requests. The fit mode does not inspect host content outside its own region.
- **Dependencies**: No new runtime dependency. The measurement harness uses the
  existing Playwright installation and browser APIs.

---

## Acceptance Criteria

1. [ ] At a **1280 × 800** host region, the 14-month classic view fits without
   page or component scroll, shows one visible ribbon lane per month, and every
   interactive cell and item proxy is at least 24 × 24 CSS px.
2. [ ] At **1024 × 768**, the 12-month view fits or scrolls inside the
   component; no cell or item proxy is below 24 × 24 CSS px and no content is
   clipped.
3. [ ] Unthrottled production-build measurements meet: 500-item initial render
   p95 ≤150 ms, 2,000-item drag input-delay p95 ≤8 ms, click-to-select work p95
   ≤50 ms. The 4× CPU-throttled initial-render and drag results are recorded as
   diagnostics.
4. [ ] Month and year labels are centred; day-name and month-name sizes are
   reduced; header and cell font sizes are CSS variables declared in the theme
   root with no hard-coded header sizes left in the stylesheet.
5. [ ] `onContextMenuRequest` fires for date, item and annotation targets from
   pointer and keyboard input; no handler preserves the native menu; right-click
   selects an item without starting a gesture.
6. [ ] Fluent UI and MUI context-menu examples exist in Storybook and the docs
   explain host-owned focus return.
7. [ ] Storybook has a Demos section with at least six `play` stories, an
   event-log playground, and a one-line description on every story; the state
   catalogue still renders.
8. [ ] `0.3.0` is the first published version; `0.2.0` is not published; the
   release, migration and test-report documents record the `0.3.0` / `0.3.1`
   bootstrap and provenance sequence.
9. [ ] `pnpm verify:full` passes, including the existing browser, print,
   accessibility, timezone, performance and clean-consumer gates.
10. [ ] No vanilla, canvas, WebGL or Web Component renderer is introduced; no
    new runtime dependency is added; no cell or item proxy drops below the
    24 px floor; the 37-column model and the no-auto-month-reduction rule are
    unchanged.

---

## Complexity

Performance and fit: **L**. Context menu: **M**. Storybook demos: **M**.
Release/documentation: **S**.
