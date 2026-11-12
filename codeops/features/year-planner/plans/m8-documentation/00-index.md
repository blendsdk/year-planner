# Documentation, Storybook and API Reference Implementation Plan

> **Feature**: Developer-facing R1 documentation — a topic-owned guide set, an exhaustive Storybook site, TSDoc/API Extractor/TypeDoc enforcement, a reproducible GitHub Pages artifact and an honest status record
> **Status**: Planning Complete
> **Created**: 2026-11-12 13:42
> **Implements**: year-planner/RD-11
> **CodeOps Artifact Schema**: 1

## Overview

RD-11 makes Year Planner for React usable by an independent developer who has not
read its source. The repository already contains substantial material: four
guides, a 171-story Storybook, generated TypeDoc, checked-in API Extractor
reports, a demo with controlled-command routes and the RD-10 test evidence. What
it lacks is a single navigation surface, the topic pages the RD names, a
complete public TSDoc contract, an exact PRT-01 print story, a documented
Storybook base path and a reproducible docs-site artifact.

This plan adds no runtime behavior. It reorganizes the existing guides, adds the
missing topic pages, closes the Storybook and TSDoc gaps, builds the
`storybook-static` artifact with TypeDoc at `/api`, and wires the GitHub Pages
build without publishing it. The repository stays private first; the deploy job
is manual and guarded.

The documentation must be honest. The manual NVDA/VoiceOver audit remains parked,
the initial-render and 10k-overflow performance misses remain documented, and no
WCAG conformance claim is made.

## Minimum-Sufficient Baseline

**Original goal:** deliver RD-11's developer documentation, Storybook coverage,
API reference and docs-site artifact without changing product behavior.

**Smallest viable design:** keep the existing markdown and Storybook stack, split
the overloaded `docs/react-view.md` into the topic pages the RD names, add a
`docs/README.md` topic map, add the missing PRT-01 story and viewport addon, remove
the remaining `(undocumented)` members from the checked-in API reports, and add a
small Node script that assembles and verifies the Pages artifact.

**Excluded machinery:** no VitePress site, no second demo app, no Storybook MDX
migration, no new runtime dependency, no paid documentation service, no live
GitHub Pages deployment, and no new performance or accessibility measurement.

**Approved complexity:** None beyond RD-mandated machinery. The
`@storybook/addon-viewport` package and the Pages workflow are named in RD-11.
The docs-site script reuses the existing Storybook, TypeDoc and Node toolchain;
the three contract tests reuse the existing `tests/quality` project.

## Document Index

| #   | Document                                                        | Description                                      |
| --- | --------------------------------------------------------------- | ------------------------------------------------ |
| AR  | [Ambiguity Register](00-ambiguity-register.md)                  | Zero-Ambiguity Gate decisions (audit trail)      |
| 00  | [Index](00-index.md)                                            | This document — overview and navigation          |
| 01  | [Requirements](01-requirements.md)                              | RD-11 delta view and plan-local decisions        |
| 02  | [Current State](02-current-state.md)                            | Existing docs, stories, API reports and gaps     |
| 03  | [Guide Set](03-01-guide-set.md)                                 | Topic pages, README quickstart and `DEFERRED.md` |
| 04  | [Storybook](03-02-storybook.md)                                 | Missing stories, viewport addon and base path    |
| 05  | [API Reference](03-03-api-reference.md)                         | TSDoc, release tags, API reports and TypeDoc     |
| 06  | [Docs Site](03-04-docs-site.md)                                 | Artifact assembly, Pages workflow and CI         |
| 07  | [Demo and Evidence](03-05-demo-evidence.md)                     | Demo navigation, test report and traceability    |
| 08  | [Testing Strategy](07-testing-strategy.md)                      | ST-cases and verification                        |
| 99  | [Execution Plan](99-execution-plan.md)                          | Phases, sessions and task checklist              |

## Quick Reference

### Commands added or changed

```bash
pnpm docs            # API reports plus TypeDoc (existing; unchanged contract)
pnpm docs:build      # TypeDoc HTML under docs/api (existing)
pnpm docs:site       # Storybook with base path + TypeDoc at /api, verified artifact
pnpm storybook:build # static Storybook (existing; base defaults to /)
pnpm test:quality    # docs, Storybook and TSDoc contract tests (existing project)
pnpm verify          # gains the contracts through test:quality
pnpm verify:full     # release gate; unchanged
```

`STORYBOOK_BASE=/year-planner/` is used by `docs:site`; local builds keep `/`.

### Key Decisions

| Decision | Outcome | AR |
| -------- | ------- | -- |
| Scope | RD-11 only; RD-12 and issue #4 out | AR-1 |
| Publication | Build and upload the artifact; manual guarded deploy only | AR-2, AR-9 |
| Guide structure | Flat `docs/*.md`, `docs/README.md` topic map, split `react-view.md` | AR-3, AR-4 |
| Quickstart | Complete README example with controlled selection/visibility and print | AR-5 |
| Storybook gaps | PRT-01 print story, viewport addon, documented base path | AR-6, AR-7 |
| API enforcement | Release tags + zero `(undocumented)` + TypeDoc validation | AR-10, AR-11 |
| Docs site | `scripts/build-docs-site.mjs`, no new dependency | AR-8 |
| Honesty | Measured status, named misses, no conformance claim | AR-14, AR-18 |
| Traceability | RD-11 rows, checker through RD-11, demo E2E titles | AR-16 |
| Test placement | Four `tests/quality` contract files | AR-17 |

## Specialist Agents

**None** — the capability-gap check found no gap a standing specialist would close.

_Detection evidence: the repository already carries the generated project agents
`.opencode/agents/correctness-reviewer.md`, `.opencode/agents/security-auditor.md`
and `.opencode/agents/performance-auditor.md` from the RD-09/RD-10 work.
`codeops/codeops.json` sets strict quality with independent review. RD-11 changes
only documents, stories, configuration, a small Node script and contract tests;
the correctness reviewer covers content accuracy, and no new security,
performance or accessibility surface is introduced. Candidate creation is
reserved authority and is not needed._

## Related Files

| File | Role |
| ---- | ---- |
| `codeops/features/year-planner/requirements/RD-11-documentation.md` | Owning requirements |
| `codeops/features/year-planner/requirements/00-traceability.md` | AC-to-test matrix; gains RD-11 rows |
| `README.md` | Quickstart, package overview and doc links |
| `DEFERRED.md` | Deferred-capability list |
| `docs/README.md` | Guide index and topic map |
| `docs/getting-started.md`, `controlled-api.md`, `visibility.md`, `theming.md`, `customization.md`, `inspector-tooltip.md`, `dynamic-months.md`, `print.md`, `performance.md`, `limitations.md`, `migration.md`, `faq.md` | Topic guides |
| `docs/interaction.md`, `docs/commands.md`, `docs/accessibility.md` | Existing topic owners, extended and cross-linked |
| `apps/storybook/stories/Print.stories.tsx`, `fixtures.ts` | PRT-01 2017-yellow print story |
| `apps/storybook/.storybook/main.ts` | Viewport addon and `STORYBOOK_BASE` |
| `packages/core/src/**`, `packages/react/src/**` | TSDoc on public members and examples |
| `packages/*/etc/*.api.md` | Reviewed public API reports |
| `packages/*/api-extractor.json` | `ae-missing-release-tag` enabled |
| `typedoc.core.json`, `typedoc.react.json` | `validation.notDocumented` |
| `scripts/build-docs-site.mjs` | Storybook + TypeDoc artifact assembly and check |
| `.github/workflows/pages.yml` | Build, upload and guarded deploy |
| `apps/demo/src/App.tsx` | Visible navigation to the demonstration routes |
| `docs/test-report.md` | RD-11 evidence section and corrected counts |
| `tests/quality/docs-contract.spec.test.ts` | Guide, README, DEFERRED and honesty contract |
| `tests/quality/storybook-contract.spec.test.ts` | Story coverage, addon and base-path contract |
| `tests/quality/tsdoc-contract.spec.test.ts` | API report, release tag and `@example` contract |
| `tests/quality/docs-site-contract.spec.test.ts` | Artifact, base-path and Pages workflow contract |
| `tests/quality/docs-site.impl.test.ts` | Docs-site script failure modes |
