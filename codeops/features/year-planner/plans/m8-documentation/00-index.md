# Documentation, Storybook and API Reference Implementation Plan

> **Feature**: Developer-facing R1 documentation — a topic-owned guide set, an exhaustive Storybook site, TSDoc/API Extractor/TypeDoc enforcement, a reproducible GitHub Pages artifact and an honest status record
> **Status**: Execution Complete
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
`docs/README.md` topic map, add the missing PRT-01 and wrapper stories, remove
the remaining `(undocumented)` members from the checked-in API reports, and add a
small Node script that assembles and verifies the Pages artifact.

**Excluded machinery:** no VitePress site, no second demo app, no Storybook MDX
migration, no new runtime dependency, no paid documentation service, no live
GitHub Pages deployment, and no new performance or accessibility measurement.

**Approved complexity:** None beyond RD-mandated machinery. The Pages workflow
and the `docs-site` CI job are the publication path named in RD-11; Storybook 10
already provides the viewport, so no addon is added. The docs-site script reuses
the existing build, Storybook, TypeDoc and Node toolchain; the five contract files
and two implementation files reuse the existing `tests/quality` project.

## Document Index

| #   | Document                                                        | Description                                      |
| --- | --------------------------------------------------------------- | ------------------------------------------------ |
| AR  | [Ambiguity Register](00-ambiguity-register.md)                  | Zero-Ambiguity Gate decisions (audit trail)      |
| PF  | [Preflight Report](00-preflight-report.md)                      | Independent audit, findings and resolutions      |
| 00  | [Index](00-index.md)                                            | This document — overview and navigation          |
| 01  | [Requirements](01-requirements.md)                              | RD-11 delta view and plan-local decisions        |
| 02  | [Current State](02-current-state.md)                            | Existing docs, stories, API reports and gaps     |
| 03  | [Guide Set](03-01-guide-set.md)                                 | Topic pages, README quickstart and `DEFERRED.md` |
| 04  | [Storybook](03-02-storybook.md)                                 | Missing stories, viewport config and wrappers |
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
pnpm docs:site       # Storybook (relative URLs) + TypeDoc at /api, verified artifact
pnpm storybook:build # static Storybook into the repo-root storybook-static/
pnpm test:quality    # docs, Storybook and TSDoc contract tests (existing project)
pnpm verify          # gains the contracts through test:quality
pnpm verify:full     # release gate; unchanged
```

Storybook 10 emits relative asset URLs; no base-path environment variable is needed.

### Key Decisions

| Decision | Outcome | AR |
| -------- | ------- | -- |
| Scope | RD-11 only; RD-12 and issue #4 out | AR-1 |
| Publication | Build and upload the artifact; manual guarded deploy only | AR-2, AR-9 |
| Guide structure | Flat `docs/*.md`, `docs/README.md` topic map, split `react-view.md` | AR-3, AR-4 |
| Quickstart | Complete README example with controlled selection/visibility and print | AR-5 |
| Storybook gaps | PRT-01 + wrapper stories, built-in viewport, relative URLs | AR-6, AR-7, AR-23, AR-27 |
| API enforcement | Release tags + zero `(undocumented)` + fatal TypeDoc validation | AR-10, AR-11 |
| Docs site | `scripts/build-docs-site.mjs`; root artifact; package build first | AR-8, AR-24 |
| Publication | Build/upload on push; manual `main`-only deploy; PR `docs-site` job | AR-2, AR-9, AR-25 |
| Quickstart | Packed-tarball install until RD-12 publishes | AR-5, AR-26 |
| Honesty | Measured status, named misses, no conformance claim | AR-14, AR-18 |
| Traceability | RD-11 rows (partial first), checker and CLI through RD-11 | AR-16, AR-31 |
| Task gates | Full gate at task level where the map is full-on | AR-30 |
| Test placement | Five spec + two impl files under `tests/quality` | AR-17, AR-32 |

## Specialist Agents

| Role | Kind | Use | AR Ref |
| ---- | ---- | --- | ------ |
| `security-auditor` | reviewer | Phase 4 — Pages workflow permissions, OIDC scope, artifact contents | AR-9, AR-29 |

_Detection evidence: `.opencode/agents/security-auditor.md` already exists and
`codeops/codeops.json` sets strict quality with independent review. The plan adds
a deployment workflow with `pages: write` and `id-token: write`, so a workflow
security review is warranted even though no runtime code changes. The
`correctness-reviewer` covers every phase's content accuracy; no new specialist
is proposed._

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
| `docs/architecture.md` | Checked-in Mermaid architecture diagram |
| `apps/storybook/stories/Print.stories.tsx`, `fixtures.ts` | PRT-01 2017-yellow print story |
| `apps/storybook/.storybook/preview.ts` | Built-in viewport configuration |
| `packages/core/src/**`, `packages/react/src/**` | TSDoc on public members and examples |
| `packages/core/src/date.ts` | `DateParseResult` and `MS_PER_DAY` docs |
| `packages/*/etc/*.api.md` | Reviewed public API reports |
| `packages/*/api-extractor.json` | `ae-missing-release-tag` enabled |
| `typedoc.core.json`, `typedoc.react.json` | `validation.notDocumented` |
| `scripts/build-docs-site.mjs`, `scripts/build-docs-site.d.mts` | Artifact assembly, check and types |
| `.github/workflows/pages.yml` | Build, upload and guarded deploy |
| `.github/workflows/ci.yml` | PR `docs-site` build/verify job |
| `apps/demo/src/App.tsx` | Visible navigation to the demonstration routes |
| `docs/test-report.md` | RD-11 evidence section and corrected counts |
| `tests/quality/docs-contract.spec.test.ts` | Guide, README, DEFERRED and honesty contract |
| `tests/quality/storybook-contract.spec.test.ts` | Story coverage, addon and base-path contract |
| `tests/quality/tsdoc-contract.spec.test.ts` | API report, release tag and `@example` contract |
| `tests/quality/docs-site-contract.spec.test.ts` | Artifact, base-path and Pages workflow contract |
| `tests/quality/demo-contract.spec.test.ts` | Demo routes and evidence report |
| `tests/quality/docs-site.impl.test.ts` | Docs-site script failure modes |
| `tests/quality/docs-contract.impl.test.ts` | Markdown link-extractor edge cases |
