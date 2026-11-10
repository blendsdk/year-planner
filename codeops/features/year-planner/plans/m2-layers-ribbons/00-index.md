# M2 Layers and Ribbons Implementation Plan

> **Feature**: Year Planner — layer model, visibility, annotations, validation, paint/erase, continuous ribbons, lanes, overflow and print planning
> **Status**: Planning Complete
> **Created**: 2026-11-10
> **Implements**: year-planner/RD-04, year-planner/RD-05
> **CodeOps Artifact Schema**: 1

## Overview

This plan adds the core engine that turns canonical items into visible, editable,
lane-packed year-planner data:

- a validated entity model for groups, layers, items, resources and assignments;
- visibility resolution with group/layer/item/filter/channel precedence;
- editability resolution from global, item, layer, group policy and interaction
  mode;
- atomic paint/erase helpers that preserve the "one item, one period" invariant;
- renderer-agnostic ribbon fragments clipped to month rows, deterministic lanes,
  compact overflow, a hit index and a layout signature;
- A3 print page planning with paginate and fit modes.

The React renderer (RD-06) consumes these descriptors. This plan deliberately
does not add rendering, inspector, drag interaction or commands; those remain
the next slices.

## Minimum-Sufficient Baseline

**Original goal:** deliver the RD-04 + RD-05 core slice (option A), with
specification-first tests and green verification.

**Smallest viable design:** pure TypeScript modules inside the existing
`@blendsdk/year-planner-core` package. New functions consume the existing
`YearLayout` and `PlannerPeriod` types. No new dependency, service, store or
framework.

**Excluded machinery:** no React rendering, no interaction state machine, no
command dispatcher, no data provider, no persistence, no new test harness, no
public renderer switch.

**Approved complexity:** none beyond the existing M1 toolchain. The only
support code is the repo's existing Vitest coverage gate and the API Extractor
report.

## Document Index

| # | Document | Description |
|---|---|---|
| AR | [Ambiguity Register](00-ambiguity-register.md) | Zero-Ambiguity Gate decisions (audit trail) |
| PF | [Preflight Report](00-preflight-report.md) | Plan audit; findings resolved |
| 00 | [Index](00-index.md) | This document |
| 01 | [Requirements](01-requirements.md) | Delta view of RD-04 and RD-05 |
| 02 | [Current State](02-current-state.md) | Existing core analysis and gaps |
| 03-01 | [Entity Model and Validation](03-01-entity-model.md) | Types, diagnostics, non-blanking validation |
| 03-02 | [Visibility and Editability](03-02-visibility-editability.md) | Precedence, filters, reducer, policy |
| 03-03 | [Paint and Erase](03-03-paint-erase.md) | Atomic interval algebra and attribute equality |
| 03-04 | [Ribbon Geometry](03-04-ribbon-geometry.md) | Fragments, lanes, overflow, signature |
| 03-05 | [Print and Hit Index](03-05-print-hit-index.md) | A3 pages, fit scale, lookup |
| 07 | [Testing Strategy](07-testing-strategy.md) | ST cases and verification |
| 99 | [Execution Plan](99-execution-plan.md) | Phases and task checklist |

## Quick Reference

```ts
import {
  buildClassicYearLayout,
  buildRibbonLayout,
  createInitialVisibility,
  planRibbonPrint,
  validatePlannerData,
} from "@blendsdk/year-planner-core";

const layout = buildClassicYearLayout({ year: 2027 });
if (!layout.ok) throw new Error(layout.diagnostics[0]?.message);

const data = validatePlannerData({ items, layers, groups, resources });
const visibility = createInitialVisibility(data.model);
const ribbons = buildRibbonLayout(layout.layout, {
  model: data.model,
  visibility,
  filter: { statuses: ["confirmed"] },
});
const print = planRibbonPrint(ribbons, { mode: "paginate" });
```

## Key Decisions

| Decision | Outcome |
|---|---|
| Scope | RD-04 + RD-05 core only; RD-06 renders later (AR-1) |
| Periods | All-day and timed; explicit `displayTimeZone`, default UTC (AR-2) |
| Validation | Typed diagnostics, non-blanking normalized model, IDs only (AR-3, AR-26) |
| Visibility | Presentation only; group → layer → item → filter → channel (AR-7) |
| Paint | Split residual items, new IDs, version 1, atomic (AR-12, AR-13) |
| Lanes | Ribbon channel only; deterministic sort and previous-row reuse (AR-15, AR-16) |
| Overflow | Per-row fragment count, deduplicated item list (AR-17) |
| Print | A3 paginate default; fit returns scale plus a sub-7-pt warning (AR-19) |
| Renderer | HTML stays canonical; descriptors are renderer-agnostic (ADR 0001) |
| Connectors | `edge-path` deferred to RD-06 with the shape plane (AR-21) |

## Specialist Agents

**None** — the capability-gap check found no standing specialist that would add
coverage for this slice. Evidence: pure TypeScript interval/geometry logic in
one existing package; no external service, database, auth, regulated domain or
concurrent runtime. The standard correctness, maintainability, standards and
security lenses cover the work.

## Related Files

```text
packages/core/src/model/types.ts
packages/core/src/model/equality.ts
packages/core/src/model/validation.ts
packages/core/src/model/visibility.ts
packages/core/src/model/editability.ts
packages/core/src/model/paint.ts
packages/core/src/model/index.ts
packages/core/src/ribbon/types.ts
packages/core/src/ribbon/lanes.ts
packages/core/src/ribbon/fragments.ts
packages/core/src/ribbon/hit-index.ts
packages/core/src/ribbon/print.ts
packages/core/src/ribbon/index.ts
packages/core/src/index.ts
packages/core/etc/year-planner-core.api.md
docs/test-report.md
docs/m2-red-phase.md
codeops/features/year-planner/00-roadmap.md
```
