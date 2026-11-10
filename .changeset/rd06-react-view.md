---
"@blendsdk/year-planner-core": minor
"@blendsdk/react-year-planner": minor
---

Add the RD-06 rendered React view: scrollable and zoomable year grid, item and
annotation fragments, compact overflow, tooltips, component-owned inspector,
CSS-variable themes and presets, provider, render slots, controlled
items/visibility/selection/filter state, A3 multi-page print output, SSR-safe
rendering, Fluent UI v9/MUI token adapters, and the canonical selection/command
contracts with a minimal request pipeline.

The package is ESM-only. Pre-1.0 migration note: `YearPlannerTheme` is now the
token object; preset names use `YearPlannerThemeName`. `display.theme` still
accepts preset strings, `YearPlannerDisplay`/`YearPlannerPrint` remain aliases,
and the additive `units` prop is retained.
