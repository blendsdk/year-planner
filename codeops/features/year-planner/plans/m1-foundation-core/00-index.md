# M1 Foundation and Core Implementation Plan

> **Feature**: Year Planner for React — foundation, temporal core, classic layout and minimal grid
> **Status**: Planning Complete
> **Created**: 2026-11-10
> **Implements**: year-planner/RD-01, year-planner/RD-02, year-planner/RD-03
> **CodeOps Artifact Schema**: 1

## Overview

This plan builds the first executable slice of the Year Planner: the monorepo and
toolchain, the pure temporal core, the classic 12–36 month layout generator and a
minimal React grid that renders dates, ISO weeks, month labels and themes. It
does not implement ribbons, lanes, interactions, commands or the full
accessibility audit; those are later plans.

The slice is deliberately vertical enough to prove the package boundary and the
calendar geometry: core tests run in Node, the React grid renders the 2016/2017
classic views, and a fresh consumer can install the packed packages.

## Minimum-Sufficient Baseline

**Original goal:** a tested foundation and classic year geometry for the
open-source Year Planner.

**Smallest viable design:** two ESM packages, a pure TypeScript date/interval
module, a pure layout generator, and a minimal HTML/CSS Grid React view with
classic themes and print CSS.

**Excluded machinery:** no renderer abstraction beyond an internal HTML layer,
no ribbon/lane engine, no interaction state machine, no command pipeline, no
data provider, no full Storybook catalog, no accessibility conformance claim.

**Approved complexity:** user-mandated Storybook/API Extractor/TypeDoc/Playwright
toolchain; M0 renderer spike as an evidence artifact. No AI-proposed escalation.

## Document Index

| # | Document | Description |
|---|---|---|
| AR | [Ambiguity Register](00-ambiguity-register.md) | Plan-local decisions |
| PF | [Preflight Report](00-preflight-report.md) | Plan audit; all critical/major resolved |
| 00 | [Index](00-index.md) | This document |
| 01 | [Requirements](01-requirements.md) | Delta view of RD-01–RD-03 |
| 02 | [Current State](02-current-state.md) | Greenfield repository analysis |
| 03-01 | [Foundation](03-01-foundation.md) | Workspace, packages, toolchain, CI |
| 03-02 | [Temporal Core](03-02-temporal-core.md) | Dates, periods, interval algebra |
| 03-03 | [Classic Layout](03-03-classic-layout.md) | 12–36 month grid geometry |
| 03-04 | [Minimal React Grid](03-04-minimal-react-grid.md) | HTML grid, themes, print |
| 07 | [Testing Strategy](07-testing-strategy.md) | Spec tests and verification |
| 99 | [Execution Plan](99-execution-plan.md) | Phases and task checklist |

## Quick Reference

```tsx
import { YearPlanner } from '@blendsdk/react-year-planner';
import '@blendsdk/react-year-planner/styles.css';

<YearPlanner year={2016} display={{ theme: 'classic-blue' }} />;
```

## Key Decisions

| Decision | Outcome |
|---|---|
| Package split | `@blendsdk/year-planner-core` + `@blendsdk/react-year-planner` |
| TypeScript | 6.0.3 for R1; TS7 canary |
| Renderer | HTML/CSS Grid for M1; SVG/evidence spike separate |
| Dynamic months | 12–36 rows; 14-month classic default |
| Tests | Spec-first Vitest; Playwright for grid/print |
| Release | Lockstep Changesets + provenance |

## Specialist Agents

**None** — the capability-gap check found no role that a standing specialist
would close for this slice beyond the standard correctness/security review.
Evidence: greenfield library; pure date/layout logic; no external service,
database, auth or regulated domain.

## Related Files

```text
packages/core/src/date.ts
packages/core/src/period.ts
packages/core/src/interval.ts
packages/core/src/layout/classic-year.ts
packages/react/src/YearPlanner.tsx
packages/react/src/styles.css
apps/demo/src/App.tsx
apps/storybook/stories/ClassicYear.stories.tsx
tests/e2e/classic-year.spec.ts
```
