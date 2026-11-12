# Execution Plan: Documentation, Storybook and API Reference

> **Document**: 99-execution-plan.md
> **Parent**: [Index](00-index.md)
> **Last Updated**: 2026-11-12 13:42
> **Progress**: 0/72 tasks (0%)
> **CodeOps Artifact Schema**: 1

## Overview

Implement RD-11 in five phases: the guide set and README quickstart, the
Storybook gaps and base path, the TSDoc/API/TypeDoc contract, the docs-site
artifact and Pages workflow, and the demo/evidence/traceability close-out. Every
phase follows the specification-first order: write the contract, prove red,
implement, prove green, add implementation tests, verify.

**🚨 Update this document after EACH completed task!**

---

## Implementation Phases

| Phase | Title | Tasks |
| ----- | ----- | ----- |
| 1 | Guide set and README quickstart | 23 |
| 2 | Storybook coverage and base path | 10 |
| 3 | TSDoc and API reference | 17 |
| 4 | Docs site and Pages workflow | 9 |
| 5 | Demo, evidence, traceability and final gate | 13 |

**Total: 72 tasks across 5 phases**

> **⚠️ EXECUTION RULE — APPLIES TO EVERY AGENT EXECUTING THIS PLAN:**
>
> The task checkboxes in the phase sections below are the **single source of truth** for progress.
> Every task line appears exactly once. On implementation mark `[~]` with a timestamp; on verify
> pass promote to `[x]`; update the Progress header after every task. On a blocker mark `[!]` and
> append `Blocked: <reason>`.

---

## Phase 1: Guide set and README quickstart

> **Phase baseline tree**: recorded at phase start by the exec-plan skill.
> **Lenses**: correctness, maintainability
> **Reasoning**: high — a guide that states the wrong precedence or an unmeasured claim becomes a product statement.

### Step 1.1: Specification tests

**Reference**: [03-01](03-01-guide-set.md) · ST-1–ST-8 · AR-3–AR-5, AR-13, AR-14, AR-19
**Objective**: Prove the guide set, quickstart, deferred list and honesty rules are incomplete.

- [ ] 1.1.1 [spec-author] Write the topic-map, page-existence and link-resolution cases with `RD-11-AC-07` — `tests/quality/docs-contract.spec.test.ts`
- [ ] 1.1.2 [spec-author] Write the quickstart, `DEFERRED.md`, honesty and story-count cases with `RD-11-AC-09`, `RD-11-AC-10` — `tests/quality/docs-contract.spec.test.ts`
- [ ] 1.1.3 Run the new tests and record the red result — `pnpm test:quality`

### Step 1.2: Implementation

**Reference**: [03-01](03-01-guide-set.md) · AR-3–AR-5, AR-13, AR-14, AR-19
**Objective**: Create the topic pages, split the overloaded guide, add the index, the quickstart and `DEFERRED.md`.

- [ ] 1.2.1 Add the documentation index and fourteen-topic map — `docs/README.md`
- [ ] 1.2.2 Add the getting-started guide (install, first render, CSS, controlled selection/visibility, print) — `docs/getting-started.md`
- [ ] 1.2.3 Add the controlled-API guide with the four controlled/uncontrolled pairs — `docs/controlled-api.md`
- [ ] 1.2.4 Add the visibility guide with group → layer → item → filter → channel precedence — `docs/visibility.md`
- [ ] 1.2.5 Move the theming section and add Fluent UI v9 and MUI copy-paste examples — `docs/theming.md`
- [ ] 1.2.6 Move the slots/annotations sections and add the holiday recipe — `docs/customization.md`
- [ ] 1.2.7 Move the inspector section and add the tooltip contract — `docs/inspector-tooltip.md`
- [ ] 1.2.8 Add the dynamic-months guide (`year`, `range`, `contextMonths`, 12–36, units, density, zoom) — `docs/dynamic-months.md`
- [ ] 1.2.9 Move the print section and document A3 paginate/fit and PRT-01 — `docs/print.md`
- [ ] 1.2.10 Add the performance-status guide from the RD-10 evidence — `docs/performance.md`
- [ ] 1.2.11 Add the limitations guide and link `DEFERRED.md` — `docs/limitations.md`
- [ ] 1.2.12 Add the migration and versioning guide — `docs/migration.md`
- [ ] 1.2.13 Add the FAQ with at least eight question/answer pairs — `docs/faq.md`
- [ ] 1.2.14 Remove the split source guide and update its inbound links — `docs/react-view.md`, `README.md`, `docs/commands.md`
- [ ] 1.2.15 Rewrite the README quickstart, doc links and story count — `README.md`
- [ ] 1.2.16 Add the deferred-capability list — `DEFERRED.md`
- [ ] 1.2.17 Add the selection/keyboard cross-links and the parked-audit link — `docs/interaction.md`, `docs/accessibility.md`

### Step 1.3: Green, implementation tests and verify

- [ ] 1.3.1 Prove green for ST-1–ST-8 — `pnpm test:quality`
- [ ] 1.3.2 Add markdown-link extractor edge cases (fences, anchors, external URLs) — `tests/quality/docs-contract.impl.test.ts`
- [ ] 1.3.3 Verify the phase — `pnpm verify`

**Deliverables**:
- [ ] All fourteen topics have an owning page and the index maps them
- [ ] README quickstart is complete and runnable
- [ ] `DEFERRED.md` lists all 23 deferred capabilities
- [ ] All phase verification passing

**Test slices**: `verification` (task) via the docs contract; no core/react source change
**Task verify**: `node "$CODEOPS_PLUGIN_ROOT/bin/codeops-test.mjs" run --gate task --baseline HEAD --include tests/quality/docs-contract.spec.test.ts` (validated: 220 core + 508 React + 93 quality tests observed, 2026-11-12)
**Verify (gate)**: `pnpm verify`

---

## Phase 2: Storybook coverage and base path

> **Phase baseline tree**: recorded at phase start by the exec-plan skill.
> **Lenses**: correctness, maintainability
> **Reasoning**: medium — the story set is the public site; a missing state is a documentation gap, not a runtime risk.

### Step 2.1: Specification tests

**Reference**: [03-02](03-02-storybook.md) · ST-9–ST-12 · AR-6, AR-7
**Objective**: Prove the PRT-01 story, viewport addon and base path are absent.

- [ ] 2.1.1 [spec-author] Write the story-coverage, PRT-01, viewport and base-path cases with `RD-11-AC-02`, `RD-11-AC-11` — `tests/quality/storybook-contract.spec.test.ts`
- [ ] 2.1.2 Run the new tests and record the red result — `pnpm test:quality`

### Step 2.2: Implementation

**Reference**: [03-02](03-02-storybook.md) · AR-6, AR-7
**Objective**: Add the missing story and fixture, the viewport addon and the base-path hook.

- [ ] 2.2.1 Add `@storybook/addon-viewport` 10.6.6 and update the lockfile — `apps/storybook/package.json`, `pnpm-lock.yaml`
- [ ] 2.2.2 Register the addon and named viewports — `apps/storybook/.storybook/main.ts`, `apps/storybook/.storybook/preview.ts`
- [ ] 2.2.3 Add `viteFinal` with `base: process.env.STORYBOOK_BASE ?? "/"` — `apps/storybook/.storybook/main.ts`
- [ ] 2.2.4 Add the PRT-01 booking and annotation fixture — `apps/storybook/stories/fixtures.ts`
- [ ] 2.2.5 Add the exact 2017-yellow PRT-01 print story with the A3 description — `apps/storybook/stories/Print.stories.tsx`
- [ ] 2.2.6 Update the story count in the docs to the new total — `README.md`, `docs/getting-started.md`

### Step 2.3: Green, implementation tests and verify

- [ ] 2.3.1 Prove green for ST-9–ST-12 and build the site — `pnpm test:quality && pnpm storybook:build`
- [ ] 2.3.2 Verify the phase — `pnpm verify`

**Deliverables**:
- [ ] PRT-01 2017-yellow print story present and named
- [ ] Viewport addon active
- [ ] Base path configurable with a `/` default
- [ ] All phase verification passing

**Test slices**: `verification` (task) via the Storybook contract
**Task verify**: `node "$CODEOPS_PLUGIN_ROOT/bin/codeops-test.mjs" run --gate task --baseline HEAD --include tests/quality/storybook-contract.spec.test.ts`
**Verify (gate)**: `pnpm verify`

---

## Phase 3: TSDoc and API reference

> **Phase baseline tree**: recorded at phase start by the exec-plan skill.
> **Lenses**: correctness, api-surface, maintainability
> **Reasoning**: high — the API report is the reviewed public contract; a wrong member doc is a published statement.

### Step 3.1: Specification tests

**Reference**: [03-03](03-03-api-reference.md) · ST-13–ST-17 · AR-10–AR-12
**Objective**: Prove the undocumented members, disabled release-tag rule and missing examples.

- [ ] 3.1.1 [spec-author] Write the report, release-tag, TypeDoc-validation and example cases with `RD-11-AC-03` — `tests/quality/tsdoc-contract.spec.test.ts`
- [ ] 3.1.2 Run the new tests and record the red result — `pnpm test:quality`

### Step 3.2: Implementation

**Reference**: [03-03](03-03-api-reference.md) · AR-10–AR-12
**Objective**: Document every public member, add the entry-point examples and enable the gates.

- [ ] 3.2.1 Document the core period and interval members — `packages/core/src/period.ts`, `packages/core/src/interval.ts`
- [ ] 3.2.2 Document the core diagnostic members — `packages/core/src/diagnostics.ts`
- [ ] 3.2.3 Document the core layout members and type aliases — `packages/core/src/layout/classic-year.ts`
- [ ] 3.2.4 Document the React render-context members — `packages/react/src/types.ts`
- [ ] 3.2.5 Document the inspector, theme and resolved-theme members — `packages/react/src/types.ts`, `packages/react/src/theme.ts`
- [ ] 3.2.6 Document the slot component members — `packages/react/src/types.ts`
- [ ] 3.2.7 Document the planner handle members — `packages/react/src/types.ts`, `packages/react/src/YearPlanner.tsx`
- [ ] 3.2.8 Add `@example` to `buildClassicYearLayout` and `buildRibbonLayout` — `packages/core/src/layout/classic-year.ts`, `packages/core/src/ribbon/fragments.ts`
- [ ] 3.2.9 Add `@example` to `YearPlanner` and `YearPlannerProvider` — `packages/react/src/YearPlanner.tsx`, `packages/react/src/provider.tsx`
- [ ] 3.2.10 Enable `ae-missing-release-tag` — `packages/core/api-extractor.json`, `packages/react/api-extractor.json`
- [ ] 3.2.11 Enable TypeDoc validation — `typedoc.core.json`, `typedoc.react.json`
- [ ] 3.2.12 Regenerate the API reports and TypeDoc, and fix every remaining warning — `packages/*/etc/*.api.md`, `docs/api/**`

### Step 3.3: Green, implementation tests and verify

- [ ] 3.3.1 Prove green for ST-13–ST-17 — `pnpm test:quality`
- [ ] 3.3.2 Prove the API gate and the HTML reference — `pnpm api-report:ci && pnpm docs:build`
- [ ] 3.3.3 Verify the phase — `pnpm verify`

**Deliverables**:
- [ ] Zero `(undocumented)` entries in both checked-in reports
- [ ] Release tags reported and examples on the named entry points
- [ ] TypeDoc builds with `notDocumented` enabled
- [ ] All phase verification passing

**Test slices**: `core.unit`, `react.unit`, `verification` (task) via source changes
**Task verify**: `node "$CODEOPS_PLUGIN_ROOT/bin/codeops-test.mjs" run --gate task --baseline HEAD --include tests/quality/tsdoc-contract.spec.test.ts`
**Verify (gate)**: `pnpm verify`

---

## Phase 4: Docs site and Pages workflow

> **Phase baseline tree**: recorded at phase start by the exec-plan skill.
> **Lenses**: correctness, security, maintainability
> **Reasoning**: high — a bad base path or an unguarded deploy job publishes the wrong artifact or publishes early.

### Step 4.1: Specification tests

**Reference**: [03-04](03-04-docs-site.md) · ST-18–ST-20 · AR-2, AR-7–AR-9
**Objective**: Prove the artifact build, base path and Pages workflow are missing.

- [ ] 4.1.1 [spec-author] Write the script, base-path, artifact and workflow cases with `RD-11-AC-05`, `RD-11-AC-06` — `tests/quality/docs-site-contract.spec.test.ts`
- [ ] 4.1.2 Run the new tests and record the red result — `pnpm test:quality`

### Step 4.2: Implementation

**Reference**: [03-04](03-04-docs-site.md) · AR-2, AR-7–AR-9
**Objective**: Assemble and verify the artifact, expose `docs:site`, and add the guarded Pages workflow.

- [ ] 4.2.1 Implement the build/copy/verify script with `--check-only` — `scripts/build-docs-site.mjs`
- [ ] 4.2.2 Add the `docs:site` script — `package.json`
- [ ] 4.2.3 Add the build/upload/guarded-deploy workflow — `.github/workflows/pages.yml`
- [ ] 4.2.4 Document the release-time Pages enable step — `docs/README.md`

### Step 4.3: Green, implementation tests and verify

- [ ] 4.3.1 Prove green for ST-18–ST-20 and build the artifact — `pnpm test:quality && pnpm docs:site`
- [ ] 4.3.2 Write the missing-API, wrong-base and broken-link failure cases — `tests/quality/docs-site.impl.test.ts`
- [ ] 4.3.3 Verify the phase — `pnpm verify`

**Deliverables**:
- [ ] `storybook-static/` contains Storybook at `/` and TypeDoc at `/api`
- [ ] Asset URLs use `/year-planner/`; local builds keep `/`
- [ ] Pages workflow builds on push and deploys only on manual dispatch
- [ ] All phase verification passing

**Test slices**: `verification` (task) via the docs-site contract
**Task verify**: `node "$CODEOPS_PLUGIN_ROOT/bin/codeops-test.mjs" run --gate task --baseline HEAD --include tests/quality/docs-site-contract.spec.test.ts`
**Verify (gate)**: `pnpm verify`

---

## Phase 5: Demo, evidence, traceability and final gate

> **Phase baseline tree**: recorded at phase start by the exec-plan skill.
> **Lenses**: correctness, maintainability
> **Reasoning**: high — traceability closes the milestone; a missing AC row blocks RD-12.

### Step 5.1: Specification tests

**Reference**: [03-05](03-05-demo-evidence.md) · ST-23–ST-26 · AR-15, AR-16, AR-20
**Objective**: Prove the demo navigation, evidence section and RD-11 traceability rows are missing.

- [ ] 5.1.1 [spec-author] Write the demo-navigation and report cases with `RD-11-AC-08`, `RD-11-AC-10` — `tests/quality/docs-contract.spec.test.ts`
- [ ] 5.1.2 Extend the traceability test through RD-11 with `RD-11-AC-02`, `RD-11-AC-04` — `tests/quality/traceability.spec.test.ts`
- [ ] 5.1.3 Run the new tests and record the red result — `pnpm test:quality`

### Step 5.2: Implementation

**Reference**: [03-05](03-05-demo-evidence.md) · AR-15, AR-16, AR-20
**Objective**: Add the demo navigation, the evidence section and the RD-11 traceability rows.

- [ ] 5.2.1 Add the route navigation — `apps/demo/src/App.tsx`
- [ ] 5.2.2 Document the demonstration routes — `README.md`, `docs/getting-started.md`
- [ ] 5.2.3 Add RD-11-AC-01..13 rows with owning tests — `codeops/features/year-planner/requirements/00-traceability.md`
- [ ] 5.2.4 Annotate the existing demo E2E titles with `RD-11-AC-08` — `tests/e2e/commands.spec.ts`, `tests/e2e/interaction.spec.ts`
- [ ] 5.2.5 Add the RD-11 evidence section and correct the story counts — `docs/test-report.md`
- [ ] 5.2.6 Update the roadmap row to the plan and final stage — `codeops/features/year-planner/00-roadmap.md`

### Step 5.3: Green, implementation tests and verify

- [ ] 5.3.1 Prove green for ST-23–ST-26 — `pnpm test:quality`
- [ ] 5.3.2 Run the release gate — `pnpm verify:full`
- [ ] 5.3.3 Rebuild and verify the docs artifact — `pnpm docs:site`
- [ ] 5.3.4 Run the packed consumer check — `pnpm test:consumer`

**Deliverables**:
- [ ] Demo routes discoverable from the default page
- [ ] Thirteen RD-11 rows and the checker through RD-11
- [ ] RD-11 evidence recorded with named gaps
- [ ] Full release gate passing

**Test slices**: `core.unit`, `react.unit`, `verification` (task); release E2E for the demo
**Task verify**: `node "$CODEOPS_PLUGIN_ROOT/bin/codeops-test.mjs" run --gate task --baseline HEAD --include tests/quality/docs-contract.spec.test.ts --include tests/quality/traceability.spec.test.ts`
**Verify (gate)**: `pnpm verify:full`

---

## Dependencies

```
Phase 1 (guides) ──► Phase 2 (Storybook) ──► Phase 4 (docs site)
        │                                        ▲
        └────────► Phase 3 (API) ────────────────┘
                                                 │
                                      Phase 5 (evidence)
```

Phase 2 and Phase 3 are independent; Phase 4 needs the Storybook base path and
the TypeDoc output; Phase 5 needs every contract green.

---

## Success Criteria

**Feature is complete when:**

1. ✅ All phases completed
2. ✅ All verification passing (`pnpm verify:full`)
3. ✅ No warnings/errors from API Extractor or TypeDoc
4. ✅ No dead code — the split source guide is removed and no link points to it
5. ✅ Security — synthetic data only, no secrets, no raw HTML examples, least-privilege workflow
6. ✅ Documentation updated — guides, README, `DEFERRED.md`, test report and roadmap
7. ✅ Traceability covers RD-11
8. ✅ Post-completion project re-analysis (handled by the exec-plan skill)
