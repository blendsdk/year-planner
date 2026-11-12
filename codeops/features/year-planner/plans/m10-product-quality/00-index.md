# Product Quality Implementation Plan

> **Feature**: Fit, performance, typography, host-owned context menus and demonstrable Storybook coverage for the first published release
> **Status**: Plan Preflighted
> **Created**: 2026-11-12 23:50
> **Implements**: year-planner/RD-13
> **CodeOps Artifact Schema**: 1

## Overview

R1 is feature-complete but unpublished. Direct use of the demo exposed four
quality gaps that matter more than new planning capability: the classic
14-month grid is about 2,000 × 1,332 px at its default units and cannot fit an
embedded application region, initial render is several hundred milliseconds,
the month/year header looks aggressive and is not centred, and right-click does
nothing. The Storybook catalogue documents 174 states but only four of them
have a `play` function and only two have a description, so a first-time reader
clicks and sees nothing happen.

This plan is the R1.5 quality pass. It measures the production build first,
fixes the algorithmic render cost, fits the grid to its host with responsive
units and a 24 px floor, polishes the header typography with CSS tokens, adds a
host-owned context-menu contract, and turns Storybook into a demonstrable
product surface. It adds no planning feature and does not rewrite the renderer.

The first published version becomes `0.3.0`. `0.2.0` is never published; the
release documents move to the `0.3.0` bootstrap and `0.3.1` provenance
sequence.

## Minimum-Sufficient Baseline

**Original goal:** make the planner fit real application layouts, feel
responsive at the supported data size, look polished, support host-owned
context menus and demonstrate itself — without a renderer rewrite.

**Smallest viable design:** keep React and the existing layout engine; add one
`display.fit` prop backed by a `ResizeObserver` and the existing theme units;
add one `onContextMenuRequest` callback; move header sizes to CSS variables;
optimize the existing render path; add a Demos section and an event log to the
existing Storybook. No new runtime dependency, no new renderer, no new
design-system integration.

**Excluded machinery:** vanilla/canvas/WebGL renderer, virtualization for
10,000 items, a built-in menu component, automatic month-window reduction,
non-uniform scaling, a new state-management library, a new measurement
framework.

**Approved complexity:** the fit mode, performance harness extension and
context-menu contract are RD-13 requirements. No complexity escalation remains.

## Document Index

| #   | Document                                                        | Description                                       |
| --- | --------------------------------------------------------------- | ------------------------------------------------- |
| AR  | [Ambiguity Register](00-ambiguity-register.md)                  | Zero-Ambiguity Gate decisions (audit trail)       |
| PF  | [Preflight Report](00-preflight-report.md)                      | Independent audit, findings and resolutions (created after the audit) |
| BL  | [Baseline](00-baseline.md)                                      | Phase 0 production measurements and decision (created in Phase 0) |
| 00  | [Index](00-index.md)                                            | This document — overview and navigation           |
| 01  | [Requirements](01-requirements.md)                              | RD-13 delta view and plan-local decisions         |
| 02  | [Current State](02-current-state.md)                            | Existing implementation, gaps and risks           |
| 03  | [Performance](03-01-performance.md)                             | Profiling, algorithmic fixes and targets          |
| 04  | [Fit and Typography](03-02-fit-typography.md)                   | Responsive units, 24 px floor, header tokens      |
| 05  | [Context Menu](03-03-context-menu.md)                           | Host-owned request contract and keyboard path     |
| 06  | [Storybook Demos](03-04-storybook-demos.md)                     | Demos, event log and story descriptions           |
| 07  | [Testing Strategy](07-testing-strategy.md)                      | ST cases, test files and verification             |
| 99  | [Execution Plan](99-execution-plan.md)                          | Phases, sessions and task checklist               |

## Quick Reference

### New public surface

```ts
// Fit the grid to its host region; "contain" is the default.
<YearPlanner display={{ fit: "contain" }} />

// Raise a host-owned context-menu request; no menu is rendered.
<YearPlanner
  onContextMenuRequest={(request) => {
    if (request.target.kind === "item") {
      openFluentMenu(request.target.itemId, request.clientX, request.clientY);
    }
  }}
/>
```

### Key Decisions

| Decision | Outcome | AR |
| -------- | ------- | -- |
| Renderer | Keep React; imperative drag preview only | AR-4 |
| Performance target | 2,000 items supported; 10,000 stress | AR-3 |
| Fit | Horizontal column scale + vertical lane budget, 24 px cells/proxies, one lane at the floor | AR-5, AR-7 |
| Fit default | `contain` | AR-6 |
| Typography | Header-only polish plus tokens | AR-11, AR-12 |
| Context menu | Host-owned callback; root listener; pointer-day date; no built-in menu | AR-13, AR-14, AR-34, AR-35 |
| Stories | Demos first; existing catalogue as Reference; event log; story-level descriptions | AR-18, AR-19, AR-20, AR-36 |
| First release | Intended `0.3.0`, then `0.3.1` provenance; AC8 partial | AR-2, AR-27, AR-39 |

## Specialist Agents

| Role | Kind | Use | AR Ref |
| ---- | ---- | --- | ------ |
| `correctness-reviewer` | reviewer | Every phase — measurement accuracy, fit arithmetic, API behavior, demo correctness | AR-3, AR-5, AR-13 |
| `security-auditor` | reviewer | Phase 3 — context-menu request payload, no hidden-item leakage, no new injection surface | AR-13, AR-29 |

_Detection evidence: `.opencode/agents/correctness-reviewer.md` and
`.opencode/agents/security-auditor.md` exist; `codeops/codeops.json` sets strict
quality with independent review. The context-menu callback handles item
identifiers and host data, so a security review is warranted. No new specialist
is proposed._

## Related Files

| File | Role |
| ---- | ---- |
| `codeops/features/year-planner/requirements/RD-13-product-quality.md` | Owning requirements |
| `packages/react/src/types.ts` | `DisplayConfig`, context-menu request types |
| `packages/react/src/options.ts` | Fit option resolution and validation |
| `packages/react/src/YearPlanner.tsx` | Prop wiring, host-region fit, context-menu dispatch |
| `packages/react/etc/react-year-planner.api.md` | Public API report update |
| `packages/react/src/geometry.ts` | Fit scale and zoom composition |
| `packages/react/src/theme.ts` | Unit profiles and typography tokens |
| `packages/react/src/styles.css` | Header typography and token defaults |
| `packages/react/src/render/MonthRow.tsx` | Centred month/year label |
| `packages/react/src/render/YearGrid.tsx` | Grid geometry and header row |
| `packages/react/src/interaction/useInteraction.ts` | Transient drag preview path |
| `packages/react/src/interaction/pointer.ts` | Pointer dispatch and right-click path |
| `packages/react/src/render/ItemOverlay.tsx` | Imperative preview escape hatch |
| `apps/demo/src/App.tsx` | Bounded app-shell demo |
| `apps/storybook/stories/` | Demos, event log and descriptions |
| `apps/storybook/package.json` | Dev-only Fluent/MUI dependencies for the examples |
| `tests/perf/bench.spec.ts` | Production benchmark harness |
| `docs/benchmarks/rd13-baseline.md` | Phase 0 evidence |
| `docs/performance.md`, `docs/releasing.md`, `docs/migration.md`, `docs/test-report.md` | Updated evidence and release docs |
| `tests/quality/release-*.spec.test.ts` | Release and metadata contracts |
| `tests/quality/storybook-contract.spec.test.ts` | Story coverage contract |
