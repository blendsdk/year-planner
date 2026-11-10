# Requirements: M2 Layers and Ribbons

> **Document**: 01-requirements.md
> **Parent**: [Index](00-index.md)
> **Source**: [RD-04](../../requirements/RD-04-layers-visibility.md) and [RD-05](../../requirements/RD-05-ribbons-lanes-print.md) — the owning requirements documents

## Scope of this plan (delta view)

### In this plan

- RD-04 Must Have: entity interfaces, nested groups with cycle rejection,
  render channels, annotation-as-item, paint/erase semantics, resources and
  assignments, editability precedence, visibility precedence, effective
  visibility, tri-state groups, visibility reducer/preset primitives, filters,
  no-leak rules, runtime validation and the public data inputs.
- RD-04 Should Have: serializable visibility preset, normalized fallback model,
  `displayPriority`/`sortOrder`, layer labels/patterns (data only).
- RD-05 Must Have: fragment projection, fragment identity, cap/continuation
  flags, cross-month/year clipping, channel partitioning, deterministic lane
  allocation, compact/expanded density, overflow model, renderer-agnostic
  descriptors, A3 pagination data, hit index and lane repacking after hiding.
- RD-05 Should Have: layout signature and per-row deterministic output
  (memoization is left to the renderer). Constrained `edge-path` connectors are
  deferred to RD-06 (AR-21).

### Deferred / out of this plan

- RD-04 AC9 component wiring (`visibility` + `onVisibilityChange`,
  `defaultVisibility`, imperative calls dispatching the same callback) — RD-06
  owns the React props; this plan delivers the pure reducer, preset and initial
  state the view calls.
- RD-05 renderer-owned checks (AC6/AC7 visual overflow list and row growth,
  AC9/AC11/AC13 actual print output, AC13 keyboard reachability) — RD-06
  consumes this plan's descriptors and owns DOM, CSS and print rendering.
  The core supplies the overflow entries, page plans and scales.
- RD-06 React view, slots, inspector, tooltips, theming and Fluent/MUI adapters.
- RD-07 interaction engine and selection.
- RD-08 controlled command dispatcher and rollback.
- Aggregated density, resource timeline, recurrence, dependencies, split/merge,
  scenarios, data provider, RTL, SVG/PDF file export.

## Plan-local decisions

| Decision | Chosen | AR Ref |
|---|---|---|
| Timed period projection | Explicit `displayTimeZone`, default UTC | AR-2 |
| Diagnostic vocabulary | Typed additive codes | AR-3 |
| Entity ID scope | Per collection; items + annotations share | AR-4 |
| Cycle recovery | Exclude cycle members and dependents | AR-5 |
| Empty group state | Hidden if all descendant layers hidden | AR-6 |
| Multi-ancestor policy | Nearest group wins; layer overrides | AR-9 |
| Paint equality | Structural equality | AR-11 |
| Paint no-match | Create the drawn range | AR-12 |
| Lane channels | `ribbon` only | AR-15 |
| Print fit | Scale + warning + `requiresPaginate` | AR-19 |
| Module split | `model/` and `ribbon/` | AR-25 |

## Acceptance criteria

The owning RDs keep their acceptance criteria. This plan verifies every
core-level criterion through the ST cases in [07-testing-strategy.md](07-testing-strategy.md).
Renderer-owned criteria remain open for RD-06 and are listed in
[02-current-state.md](02-current-state.md#gaps-identified).
