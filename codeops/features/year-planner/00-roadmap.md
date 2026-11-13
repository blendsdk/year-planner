# Roadmap: Year Planner for React

> **Feature-Set**: Year Planner for React
> **Status**: In Progress
> **Created**: 2026-11-10
> **Last Updated**: 2026-11-14
> **Progress**: 13 / 13 (100%) — implementation complete; localization, lockstep versioning and the first npm release delivered
> **CodeOps Artifact Schema**: 1

## Legend

⬜ Backlog · ✏️ RD Drafted · 🔎 RD Preflighted · 📋 Plan Created · 🔬 Plan Preflighted · 🔄 Executing · ✅ Done · ⛔ Blocked · ⏸️ Deferred

## Tracker

| ID | Title | RD | Plan | Stage | Status | Last Updated | Depends-on / Blocker |
|----|-------|----|------|-------|--------|--------------|----------------------|
| RD-01 | Foundation, packages and toolchain | [RD-01](requirements/RD-01-foundation.md) | [licence review](plans/licensing-and-theme-refresh/01-license-review.md) | Done | ✅ | 2026-11-13 16:47 | Internal-use licence and package contracts verified; first npm publication completed (0.3.0 bootstrap, 0.3.1 provenance) |
| RD-02 | Temporal core and interval algebra | [RD-02](requirements/RD-02-temporal-core.md) | [m1-foundation-core](plans/m1-foundation-core/00-index.md) | Done | ✅ | 2026-11-10 11:45 | depends on RD-01 |
| RD-03 | Classic year layout and dynamic months | [RD-03](requirements/RD-03-classic-year-layout.md) | [theme and docs review](plans/licensing-and-theme-refresh/02-theme-and-docs-review.md) | Done | ✅ | 2026-11-13 18:36 | Functional guide verified; theme examples use material-teal and fluent-marigold |
| RD-04 | Layers, visibility, annotations and validation | [RD-04](requirements/RD-04-layers-visibility.md) | [m2-layers-ribbons](plans/m2-layers-ribbons/00-index.md) | Done | ✅ | 2026-11-10 14:02 | depends on RD-01, RD-02 |
| RD-05 | Continuous ribbons, lanes, overflow and print | [RD-05](requirements/RD-05-ribbons-lanes-print.md) | [theme and docs review](plans/licensing-and-theme-refresh/02-theme-and-docs-review.md) | Done | ✅ | 2026-11-13 18:36 | Print theme, PRT-01 and 15/28/29 boundary matrix verified |
| RD-06 | React view, theming and style integration | [RD-06](requirements/RD-06-react-view-theming.md) | [theme and docs review](plans/licensing-and-theme-refresh/02-theme-and-docs-review.md) | Done | ✅ | 2026-11-13 18:36 | 54 palette families and two utility presets verified |
| RD-07 | Interaction engine, selection and keyboard | [RD-07](requirements/RD-07-interaction-selection.md) | [m4-interaction-engine](plans/m4-interaction-engine/00-index.md) | Done | ✅ | 2026-11-11 00:19 | depends on RD-03, RD-04, RD-05, RD-06 |
| RD-08 | Controlled commands, validation and rollback | [RD-08](requirements/RD-08-controlled-commands.md) | [m5-controlled-commands](plans/m5-controlled-commands/00-index.md) | Done | ✅ | 2026-11-11 04:00 | depends on RD-04, RD-05, RD-06, RD-07 |
| RD-09 | Accessibility and keyboard experience | [RD-09](requirements/RD-09-accessibility.md) | [theme and docs review](plans/licensing-and-theme-refresh/02-theme-and-docs-review.md) | Done | ✅ | 2026-11-13 18:36 | All 56 preset contrast checks and axe matrix verified; manual audit parked |
| RD-10 | Quality gates, performance, security and browsers | [RD-10](requirements/RD-10-quality-gates.md) | [theme and docs review](plans/licensing-and-theme-refresh/02-theme-and-docs-review.md) | Done | ✅ | 2026-11-13 18:36 | Visual, print and browser coverage regenerated; manual audit parked |
| RD-11 | Documentation, Storybook and API reference | [RD-11](requirements/RD-11-documentation.md) | [theme and docs review](plans/licensing-and-theme-refresh/02-theme-and-docs-review.md) | Done | ✅ | 2026-11-13 18:36 | Functional guide, catalogue docs and stories verified |
| RD-12 | Release, versioning and maintenance | [RD-12](requirements/RD-12-release-maintenance.md) | [licence review](plans/licensing-and-theme-refresh/01-license-review.md) | Done | ✅ | 2026-11-13 18:40 | Licence and palette notices verified; visual-design rights confirmed; commit/push authorised |
| RD-13 | Product quality: fit, performance and interaction polish | [RD-13](requirements/RD-13-product-quality.md) | [m10-product-quality](plans/m10-product-quality/00-index.md) | Done | ✅ | 2026-11-13 04:00 | 77/77 tasks; 0.3.0 prepared; live publish is an owner action |


> **Note**: All 13 RDs are implementation-complete. The licensing/theme refresh and the follow-on localization task are delivered: the React package now owns a complete `PlannerMessages` contract, the `@blendsdk/year-planner-languages` package ships 45 locale catalogues for 41 left-to-right languages, and every workspace is aligned to `0.3.1` with `@blendsdk/lockstep`. The first npm release is complete: `0.3.0` was the unprovenanced bootstrap and `0.3.1` is the provenance-signed release, with trusted publishers configured for all three packages. RD-01 and RD-12 carry licence and palette verification; the visual-design rights question was confirmed resolved by the user on 2026-11-13 and the commit/push is authorised. The manual NVDA/VoiceOver evidence (RD-09 AC10) is parked by user decision on 2026-11-11 as a low-priority release-gate item; no WCAG conformance claim is made. RD-10 records initial-render and 10k-overflow performance misses and a WebKit/desktop pending-preview test quarantine in `docs/test-report.md`.
