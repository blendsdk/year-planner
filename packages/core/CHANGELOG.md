# @blendsdk/year-planner-core

## 0.2.0

### Minor Changes

- 478cf9a: Add the RD-06 rendered React view: scrollable and zoomable year grid, item and
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
