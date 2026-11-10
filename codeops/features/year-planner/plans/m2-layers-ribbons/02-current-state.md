# Current State: M2 Layers and Ribbons

> **Document**: 02-current-state.md
> **Parent**: [Index](00-index.md)

## Existing Implementation

### What Exists

The core package is a pure ESM TypeScript library with:

| Module | Capability |
|---|---|
| `date.ts` | `DateKey` parsing, epoch conversion, ISO weeks, date arithmetic |
| `period.ts` | `AllDayPeriod`, `TimedPeriod`, validation, timed projection |
| `interval.ts` | Half-open union, intersect, subtract, normalize, merge |
| `layout/classic-year.ts` | 12–36 month rows, 37 fixed slots, prefix widths, print pagination |
| `diagnostics.ts` | Stable diagnostic codes and helper |

The React package renders a minimal date grid, themes, ISO weeks and A3 print
CSS. It has no item model or ribbon rendering.

### Relevant Files

| File | Purpose | Changes Needed |
|---|---|---|
| `packages/core/src/index.ts` | Public barrel | Export model and ribbon modules |
| `packages/core/src/diagnostics.ts` | Diagnostic union | Add typed M2 codes |
| `packages/core/src/period.ts` | Period types | Reused, not changed |
| `packages/core/src/interval.ts` | Interval algebra | Reused by paint/erase |
| `packages/core/src/layout/classic-year.ts` | Row geometry | Reused by fragments/print |
| `packages/core/etc/year-planner-core.api.md` | API report | Regenerated |
| `docs/test-report.md` | Evidence | Add M2 results |
| `codeops/features/year-planner/00-roadmap.md` | Lifecycle | RD-04/RD-05 rows |

## Gaps Identified

### Gap 1: No canonical item/entity model

**Current Behavior:** The core has dates, periods and layout only. There is no
`PlannerItem`, `PlannerLayer`, `LayerGroup`, `Resource` or `Assignment`.
**Required Behavior:** RD-04's exact interfaces plus non-blanking validation.
**Fix Required:** Add `model/types.ts` and `model/validation.ts`.

### Gap 2: No visibility or editability resolution

**Current Behavior:** Nothing is hidden or filtered; no policy evaluation.
**Required Behavior:** Group → layer → item → filter → channel precedence,
tri-state groups, reducer, policy resolution and mode gates.
**Fix Required:** Add `model/visibility.ts` and `model/editability.ts`.

### Gap 3: No paint/erase semantics

**Current Behavior:** Interval subtraction exists, but no item-level paint or
erase, no attribute equality, no identity/version rules.
**Required Behavior:** Atomic union/subtract that creates new residual/merged
items and leaves differing items untouched.
**Fix Required:** Add `model/paint.ts`.

### Gap 4: No ribbon fragments, lanes or overflow

**Current Behavior:** Only month-row date geometry exists.
**Required Behavior:** Clipped fragments, deterministic lanes, compact overflow
and a signature. Connectors are deferred to RD-06.
**Fix Required:** Add `ribbon/types.ts`, `ribbon/lanes.ts`,
`ribbon/fragments.ts` and `ribbon/hit-index.ts`. Connectors stay deferred.

### Gap 5: No print page planning for variable row heights

**Current Behavior:** `paginatePrintRows` chunks 12–36 month rows at 14 per
page, but has no fit scale or variable-height ribbon rows.
**Required Behavior:** Paginate/fit plans over `RibbonRow[]`, with the 7 pt
diagnostic and 1/2/3-page boundaries.
**Fix Required:** Add `ribbon/print.ts`.

## Dependencies

### Internal Dependencies

- `date.ts`, `period.ts`, `interval.ts` and `layout/classic-year.ts` from M1.
- Existing Vitest coverage gate (95% for core).
- Existing API Extractor report and `pnpm verify` chain.

### External Dependencies

None added.

## Risks and Concerns

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Public API growth breaks the report | High | Low | Regenerate and review the API report in the same commit |
| Lane math diverges from renderer tokens | Medium | Medium | Export constants; pin them with tests; revisit when RD-06 sets CSS tokens |
| Metadata deep equality on exotic values | Medium | Low | Structural equality for plain data; identity for non-plain objects; documented |
| Coverage gate on many branches | High | Medium | Spec + impl tests per module; run coverage per phase |
| Hiding repacks lanes and changes IDs | Low | High | IDs are item IDs, never regenerated; lane changes only affect geometry |

## Gaps Owned by Later RDs

These are **not** M2 failures; they are downstream by AR-1:

| Gap | Owner |
|---|---|
| Actual ribbon DOM, proxies, labels, selection styling | RD-06 |
| Controlled `visibility`/`onVisibilityChange` props and `defaultVisibility` | RD-06 (core reducer is here) |
| Inspector, tooltips, overflow popover, slots | RD-06 |
| Sticky headers, zoom, scroll-to-date, ResizeObserver | RD-06 |
| Pointer/keyboard interaction, marquee, drag preview | RD-07 |
| Command dispatcher, validation hooks, rollback | RD-08 |
| Actual 18/24/36-month printed PDFs and PRT-01 | RD-06 / RD-10 |
| Full axe and screen-reader conformance | RD-09 |
