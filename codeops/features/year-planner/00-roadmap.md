# Roadmap: Year Planner for React

> **Feature-Set**: Year Planner for React
> **Status**: In Progress
> **Created**: 2026-11-10
> **Last Updated**: 2026-11-10
> **Progress**: 6 / 12 (50%)
> **CodeOps Artifact Schema**: 1

## Legend

⬜ Backlog · ✏️ RD Drafted · 🔎 RD Preflighted · 📋 Plan Created · 🔬 Plan Preflighted · 🔄 Executing · ✅ Done · ⛔ Blocked · ⏸️ Deferred

## Tracker

| ID | Title | RD | Plan | Stage | Status | Last Updated | Depends-on / Blocker |
|----|-------|----|------|-------|--------|--------------|----------------------|
| RD-01 | Foundation, packages and toolchain | [RD-01](requirements/RD-01-foundation.md) | [m1-foundation-core](plans/m1-foundation-core/00-index.md) | Done | ✅ | 2026-11-10 11:45 | — |
| RD-02 | Temporal core and interval algebra | [RD-02](requirements/RD-02-temporal-core.md) | [m1-foundation-core](plans/m1-foundation-core/00-index.md) | Done | ✅ | 2026-11-10 11:45 | depends on RD-01 |
| RD-03 | Classic year layout and dynamic months | [RD-03](requirements/RD-03-classic-year-layout.md) | [m1-foundation-core](plans/m1-foundation-core/00-index.md) | Done | ✅ | 2026-11-10 11:45 | depends on RD-01, RD-02 |
| RD-04 | Layers, visibility, annotations and validation | [RD-04](requirements/RD-04-layers-visibility.md) | [m2-layers-ribbons](plans/m2-layers-ribbons/00-index.md) | Done | ✅ | 2026-11-10 14:02 | depends on RD-01, RD-02 |
| RD-05 | Continuous ribbons, lanes, overflow and print | [RD-05](requirements/RD-05-ribbons-lanes-print.md) | [m2-layers-ribbons](plans/m2-layers-ribbons/00-index.md) | Done | ✅ | 2026-11-10 14:02 | depends on RD-02, RD-03, RD-04 |
| RD-06 | React view, theming and style integration | [RD-06](requirements/RD-06-react-view-theming.md) | [m3-react-view](plans/m3-react-view/00-index.md) | Done | ✅ | 2026-11-10 16:58 | depends on RD-03, RD-04, RD-05 |
| RD-07 | Interaction engine, selection and keyboard | [RD-07](requirements/RD-07-interaction-selection.md) | — | RD Preflighted | 🔎 | 2026-11-10 | depends on RD-03, RD-04, RD-05, RD-06 |
| RD-08 | Controlled commands, validation and rollback | [RD-08](requirements/RD-08-controlled-commands.md) | — | RD Preflighted | 🔎 | 2026-11-10 | depends on RD-04, RD-05, RD-06, RD-07 |
| RD-09 | Accessibility and keyboard experience | [RD-09](requirements/RD-09-accessibility.md) | — | RD Preflighted | 🔎 | 2026-11-10 | depends on RD-06, RD-07 |
| RD-10 | Quality gates, performance, security and browsers | [RD-10](requirements/RD-10-quality-gates.md) | — | RD Preflighted | 🔎 | 2026-11-10 | depends on RD-01–RD-09 |
| RD-11 | Documentation, Storybook and API reference | [RD-11](requirements/RD-11-documentation.md) | — | RD Preflighted | 🔎 | 2026-11-10 | depends on RD-01–RD-10 |
| RD-12 | Release, versioning and maintenance | [RD-12](requirements/RD-12-release-maintenance.md) | — | RD Preflighted | 🔎 | 2026-11-10 | depends on RD-01–RD-11 |
