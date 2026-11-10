# M3 React View Implementation Plan

> **Feature**: Year Planner for React — rendered calendar, items, theming, inspector, slots and print
> **Status**: Execution Complete
> **Created**: 2026-11-10
> **Implements**: year-planner/RD-06
> **CodeOps Artifact Schema**: 1

## Overview

This plan turns the M2 core engine into the public React product surface:

- a scrollable, zoomable 39-column year grid with sticky headers;
- rendered ribbon fragments, highlights, annotations, overflow and tooltips;
- a component-owned inspector with selection details and command actions;
- controlled and uncontrolled items, visibility, selection and filter state;
- a typed CSS-variable theme system with five presets, provider, slots and
  `unstyled` mode;
- Fluent UI v9 and MUI token adapters as optional subpaths;
- localized Gregorian labels and deterministic SSR;
- real A3 paginate/fit print output built from the M2 print plan.

The plan also adds the canonical selection/command **types** that RD-04
declared but M2 did not deliver. It implements the smallest command request
pipeline needed by the inspector and public handle; pointer gestures, marquee
and drag previews remain RD-07, and rollback/stale-response cancellation remain
RD-08.

## Minimum-Sufficient Baseline

**Original goal:** deliver RD-06 with specification-first tests and green
verification.

**Smallest viable design:** extend the existing `@blendsdk/react-year-planner`
package. Reuse M2 `validatePlannerData`, `createInitialVisibility`,
`buildRibbonLayout`, `createRibbonHitIndex` and `planRibbonPrint`. Add no
runtime dependency.

**Excluded machinery:** no gesture engine, no drag preview, no marquee, no
rollback state machine, no data provider, no persistence, no PDF library, no
Fluent/MUI runtime dependency, no public renderer switch, no RTL.

**Approved complexity:** the only support code is the existing Vitest,
Testing Library, Playwright and API Extractor toolchain. The print tree and
command request pipeline are required by RD-06 acceptance criteria.

## Document Index

| # | Document | Description |
|---|---|---|
| AR | [Ambiguity Register](00-ambiguity-register.md) | Zero-Ambiguity Gate decisions |
| PF | [Preflight Report](00-preflight-report.md) | Independent plan audit; findings resolved |
| 00 | [Index](00-index.md) | This document |
| 01 | [Requirements](01-requirements.md) | RD-06 delta and deferrals |
| 02 | [Current State](02-current-state.md) | Existing React surface and gaps |
| 03-01 | [Contracts and Theme](03-01-contracts-theme.md) | Selection/command types, tokens, provider, CSS layers |
| 03-02 | [View Shell](03-02-view-shell.md) | Grid, scroll, zoom, headers, labels, SSR |
| 03-03 | [Items and Slots](03-03-items-slots.md) | Fragments, annotations, overflow, tooltip, slots |
| 03-04 | [State and Commands](03-04-state-commands.md) | Controlled state, selection, request pipeline |
| 03-05 | [Inspector](03-05-inspector.md) | Default inspector, actions, feedback, retry |
| 03-06 | [Print and Integrations](03-06-print-integrations.md) | A3 print tree, Fluent/MUI adapters |
| 05 | [Findings Ledger](05-findings.md) | Post-phase review and rulings |
| 07 | [Testing Strategy](07-testing-strategy.md) | ST cases and verification |
| 99 | [Execution Plan](99-execution-plan.md) | Phases and task checklist |

## Quick Reference

```tsx
import { YearPlanner } from "@blendsdk/react-year-planner";
import "@blendsdk/react-year-planner/styles.css";

<YearPlanner
  year={2027}
  items={items}
  layers={layers}
  groups={groups}
  display={{ theme: "classic-yellow", zoom: 1 }}
  showInspector
/>;
```

```ts
import { createTheme, YearPlannerProvider } from "@blendsdk/react-year-planner";
import { fluentThemeToCssVars } from "@blendsdk/react-year-planner/adapters/fluent";

const theme = createTheme({ ribbon: "#8358c6" });
const vars = fluentThemeToCssVars(theme);
```

## Key Decisions

| Decision | Outcome |
|---|---|
| Scope | All RD-06 ACs; minimal command/selection pipeline; gestures and rollback stay RD-07/RD-08 (AR-1) |
| Contracts | Type-only selection/command types in core (AR-2) |
| Renderer | HTML/CSS only; no public switch (AR-9) |
| Zoom | Scale design units in React (AR-10) |
| Themes | 24 tokens → `--yp-*`, five presets, optional provider (AR-4, AR-5) |
| State | Controlled wins; defaults warn in dev; visibility seeded once (AR-6, AR-7) |
| Commands | Local checks → host validation → host request with timeout (AR-18) |
| Inspector | Default actions use the same pipeline; retry/dismiss (AR-17, AR-21) |
| Print | Hidden page tree from `planRibbonPrint` (AR-23) |
| Security | Only host-typed styles produce CSS; metadata never rendered (AR-25) |

## Specialist Agents

**None** — the capability-gap check found no standing specialist that adds
coverage. Evidence: one React package plus type-only core contracts; no external
service, database, authentication, regulated data or concurrent runtime. The
standard correctness, maintainability, standards and security lenses cover the
work.

## Related Files

```text
packages/core/src/contracts.ts
packages/core/src/index.ts
packages/react/src/YearPlanner.tsx
packages/react/src/theme.ts
packages/react/src/provider.tsx
packages/react/src/state.ts
packages/react/src/commands.ts
packages/react/src/geometry.ts
packages/react/src/render/YearGrid.tsx
packages/react/src/render/ItemLayer.tsx
packages/react/src/render/Inspector.tsx
packages/react/src/render/Tooltip.tsx
packages/react/src/render/PrintPages.tsx
packages/react/src/adapters/fluent.ts
packages/react/src/adapters/mui.ts
packages/react/src/styles.css
packages/react/etc/react-year-planner.api.md
tests/e2e/classic-year.spec.ts
docs/test-report.md
codeops/features/year-planner/00-roadmap.md
```
