# @blendsdk/react-year-planner

## 0.3.1

### Patch Changes

- Publish the first provenance-signed release from GitHub Actions. No runtime
  behaviour changes; this release validates trusted publishing for all three
  packages.
- Updated dependencies
  - @blendsdk/year-planner-core@0.3.1

## 0.3.0

### Minor Changes

- Fit the classic grid to its host region with a 24 px interaction floor, centre
  and calm the header typography, and add a host-owned context-menu contract. Add
  the Demos Storybook group, the event-log playground and story-level
  descriptions for the whole catalogue. The supported data size is 2,000 items;
  the 0.3.0 bootstrap is the first published version.
- Replace the old theme preset names with 56 built-in presets: 19 Material 2014
  families, 35 Fluent UI v9 families and the `high-contrast` and `print`
  utilities. `material-teal` is the default. The 24-token theme API, geometry and
  print behaviour are unchanged.
- Add the planner-owned `PlannerMessages` contract and the `messages` prop.
  Every label, button, command status, keyboard instruction and screen-reader
  announcement can be translated or overridden. English remains the zero-config
  default.
- Change the licence for newly offered copies to Year Planner Internal Use License 1.0. Earlier MIT grants remain valid for the material they cover.
- Updated dependencies
  - @blendsdk/year-planner-core@0.3.0

## 0.2.0

### Minor Changes

- a901975: Add WCAG 2.2 AA-targeted accessibility: labelled grid semantics, roving focus, Home/End, a skip
  link, a keyboard-reachable visible item list, rich item names, polite/assertive announcements, a
  visible command status bar, contrast-safe ribbon text, 24 px targets, forced-colours and
  reduced-motion rules. Item proxies now render in a grid-sibling overlay so the ARIA row contract
  stays valid.
- 478cf9a: Add the rendered React view: scrollable and zoomable year grid, item and
  annotation fragments, compact overflow, tooltips, component-owned inspector,
  CSS-variable themes and presets, provider, render slots, controlled
  items/visibility/selection/filter state, A3 multi-page print output, SSR-safe
  rendering, Fluent UI v9/MUI token adapters, and the canonical selection/command
  contracts with a minimal request pipeline.
  
  The package is ESM-only. Pre-1.0 migration note: `YearPlannerTheme` is now the
  token object; preset names use `YearPlannerThemeName`. `display.theme` still
  accepts preset strings, `YearPlannerDisplay`/`YearPlannerPrint` remain aliases,
  and the additive `units` prop is retained.
- 238be07: React package: add the interaction engine — pointer selection and marquee,
  move, resize, paint, erase, create and delete gestures, ephemeral previews, the
  full modifier and anchor/focus selection matrix, keyboard navigation, touch
  scroll-first policy, disabled-date handling, focus restoration with a polite
  live region, and local undo/redo integration.
  
  Core package: add the optional additive `focusItemId` field to
  `PlannerSelection`.
  
  `InteractionConfig` gains `doubleClick: "inspect" | "none"` (default inspect).
  `interaction.touchEditing` and `interaction.marquee` are now active rather than
  inert.
- 289cf59: Controlled command lifecycle for the year planner:
  
  - request IDs, obsolete-response rejection, one deadline for host validation and
    the host request, optional abort signals and unmount cancellation;
  - per-item versions, `expectedVersion`/`STALE_REVISION`, runtime update-patch
    protection and complete paint payloads;
  - local and host validation severity, normalized diagnostics and warning notices;
  - explicit pending state with retained gesture previews and pending item styling;
  - accepted-not-applied detection against controlled props;
  - rollback of previews and focus, selection preservation and ignored stale
    responses;
  - a safe retry matrix and polite terminal-outcome announcements.
  
  Additive APIs: `YearPlannerProps.baseRevision`, an optional third `AbortSignal`
  argument on `validateChange`/`onChangeRequest`, and the
  `CAPACITY_EXCEEDED`, `COMMAND_ABORTED` and `ACCEPTED_NOT_APPLIED` diagnostic
  codes (`isDiagnosticCode` is exported for runtime normalization).
  
  Core paint residuals and new items remain `version: 1`; uncontrolled undo
  restores the prior version and redo re-applies the increment.

### Patch Changes

- 3f130ea: Prevent native text selection while dragging on the year grid. Day numbers, ISO
  week numbers, item labels and month labels no longer start a browser selection
  during select, paint, move or resize gestures. Inspector content and form controls
  inside host slots remain selectable.
- Updated dependencies [478cf9a]
- Updated dependencies [238be07]
- Updated dependencies [289cf59]
  - @blendsdk/year-planner-core@0.2.0
