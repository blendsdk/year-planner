# Execution Plan: Documentation, Storybook and API Reference

> **Document**: 99-execution-plan.md
> **Parent**: [Index](00-index.md)
> **Last Updated**: 2026-11-12 15:00
> **Progress**: 33/77 tasks (43%)
> **CodeOps Artifact Schema**: 1

## Overview

Implement RD-11 in five phases: the guide set and README quickstart, the
Storybook gaps, the TSDoc/API/TypeDoc contract, the docs-site artifact and
workflows, and the demo/evidence/traceability close-out. Every phase follows the
specification-first order: write the contract, prove red, implement, prove green,
add implementation tests, verify.

**🚨 Update this document after EACH completed task!**

---

## Implementation Phases

| Phase | Title | Tasks |
| ----- | ----- | ----- |
| 1 | Guide set and README quickstart | 24 |
| 2 | Storybook coverage | 9 |
| 3 | TSDoc and API reference | 18 |
| 4 | Docs site and workflows | 12 |
| 5 | Demo, evidence, traceability and final gate | 14 |

**Total: 77 tasks across 5 phases**

> **⚠️ EXECUTION RULE — APPLIES TO EVERY AGENT EXECUTING THIS PLAN:**
>
> The task checkboxes in the phase sections below are the **single source of truth** for progress.
> Every task line appears exactly once. On implementation mark `[~]` with a timestamp; on verify
> pass promote to `[x]`; update the Progress header after every task. On a blocker mark `[!]` and
> append `Blocked: <reason>`.
>
> **Task gate scope (AR-30):** Phases 2–5 touch `apps/**`, `scripts/**`, `package.json`, lockfiles,
> TypeDoc/API Extractor configs or `packages/*/etc/**`. The test map treats those as full-on paths,
> so their task verification runs the **full gate**, not a fast slice. Use `--baseline
> <phase-tree>` so committed task changes stay in view.

---

## Phase 1: Guide set and README quickstart

> **Phase baseline tree**: 92af13a8d66ff2215ab92f0528c0129b7256c4a2
> **Lenses**: correctness, maintainability
> **Reasoning**: high — a guide that states the wrong precedence or an unmeasured claim becomes a product statement.

### Step 1.1: Specification tests

**Reference**: [03-01](03-01-guide-set.md) · ST-1–ST-8, ST-28, ST-29 · AR-3–AR-5, AR-13, AR-14, AR-19, AR-26, AR-29
**Objective**: Prove the guide set, quickstart, deferred list, honesty rules and assets are incomplete.

- [x] 1.1.1 [spec-author] Write the topic-map, required-heading, page-existence and link-resolution cases with `RD-11-AC-07` — `tests/quality/docs-contract.spec.test.ts` ✅ (completed: 2026-11-12 14:25)
- [x] 1.1.2 [spec-author] Write the quickstart, `DEFERRED.md`, honesty, story-count, asset and security cases with `RD-11-AC-09`, `RD-11-AC-10`, `RD-11-AC-12`, `RD-11-AC-13` — `tests/quality/docs-contract.spec.test.ts` ✅ (completed: 2026-11-12 14:30)
- [x] 1.1.3 Run the new tests and record the red result — `pnpm test:quality` ✅ (completed: 2026-11-12 14:34)

### Step 1.2: Implementation

**Reference**: [03-01](03-01-guide-set.md) · AR-3–AR-5, AR-13, AR-14, AR-19, AR-26, AR-28, AR-29
**Objective**: Create the topic pages, split the overloaded guide, add the index, the quickstart, the deferred list and the architecture diagram.

- [x] 1.2.1 Add the documentation index and fourteen-topic map — `docs/README.md` ⏳ (implemented: 2026-11-12 14:40) ✅ (completed: 2026-11-12 14:50)
- [x] 1.2.2 Add getting-started with install, first render, CSS, controlled selection/visibility, print, SSR, Storybook (171-story count) and ESM-only — `docs/getting-started.md` ⏳ (implemented: 2026-11-12 14:42) ✅ (completed: 2026-11-12 14:50)
- [x] 1.2.3 Add the controlled-API guide with the four controlled/uncontrolled pairs — `docs/controlled-api.md` ⏳ (implemented: 2026-11-12 14:44) ✅ (completed: 2026-11-12 14:50)
- [x] 1.2.4 Add the visibility guide with group → layer → item → filter → channel precedence — `docs/visibility.md` ✅ (completed: 2026-11-12 14:50)
- [x] 1.2.5 Move the theming section and add Fluent UI v9 and MUI copy-paste examples — `docs/theming.md` ✅ (completed: 2026-11-12 14:50)
- [x] 1.2.6 Move the items/overflow/slots sections and add the holiday recipe — `docs/customization.md` ✅ (completed: 2026-11-12 14:50)
- [x] 1.2.7 Move the inspector section and add the tooltip contract — `docs/inspector-tooltip.md` ✅ (completed: 2026-11-12 14:50)
- [x] 1.2.8 Add the dynamic-months guide (`year`, `range`, `contextMonths`, 12–36, units, density, zoom) — `docs/dynamic-months.md` ✅ (completed: 2026-11-12 14:50)
- [x] 1.2.9 Move the print section and document A3 paginate/fit and PRT-01 — `docs/print.md` ✅ (completed: 2026-11-12 14:50)
- [x] 1.2.10 Add the performance-status guide with the measured misses, `Conformance claim: none` and the report link — `docs/performance.md` ✅ (completed: 2026-11-12 14:50)
- [x] 1.2.11 Add the limitations guide and link `DEFERRED.md` — `docs/limitations.md` ✅ (completed: 2026-11-12 14:50)
- [x] 1.2.12 Add the migration and versioning guide — `docs/migration.md` ✅ (completed: 2026-11-12 14:50)
- [x] 1.2.13 Add the FAQ with at least eight question/answer pairs — `docs/faq.md` ✅ (completed: 2026-11-12 14:50)
- [x] 1.2.14 Add the checked-in Mermaid architecture diagram — `docs/architecture.md` ✅ (completed: 2026-11-12 14:50)
- [x] 1.2.15 Remove the split source guide and update its inbound links — `docs/react-view.md`, `README.md`, `docs/commands.md` ✅ (completed: 2026-11-12 14:50)
- [x] 1.2.16 Rewrite the README quickstart with the honest packed-install note, doc links and story count — `README.md` ✅ (completed: 2026-11-12 14:50)
- [x] 1.2.17 Add the 23-item deferred-capability list — `DEFERRED.md` ✅ (completed: 2026-11-12 14:50)
- [x] 1.2.18 Add the selection/keyboard cross-links, the parked-audit link and the corrected WCAG wording — `docs/interaction.md`, `docs/accessibility.md` ✅ (completed: 2026-11-12 14:50)

### Step 1.3: Green, implementation tests and verify

- [x] 1.3.1 Prove green for ST-1–ST-8, ST-28 and ST-29 — `pnpm test:quality` ✅ (completed: 2026-11-12 14:50)
- [x] 1.3.2 Add markdown-link extractor edge cases (fences, anchors, external URLs, `DEFERRED.md`) — `tests/quality/docs-contract.impl.test.ts` ✅ (completed: 2026-11-12 14:50)
- [x] 1.3.3 Verify the phase — `pnpm verify` ✅ (completed: 2026-11-12 14:55)

**Deliverables**:
- [x] All fourteen topics have an owning page with the required headings
- [x] README quickstart is complete and honest about the unpublished install
- [x] `DEFERRED.md` lists all 23 deferred capabilities
- [x] Architecture diagram and the SSR/ESM content are preserved
- [x] All phase verification passing

**Test slices**: `verification` (task) via the docs contract
**Task verify**: `pnpm verify` (docs-only changes plus the unknown `DEFERRED.md` path fall back to the fast full gate; 220 core + 508 React + 111 quality tests observed, 2026-11-12)
**Verify (gate)**: `pnpm verify`

---

## Phase 2: Storybook coverage

> **Phase baseline tree**: 2240eb1045451d42effcae7f2eb6123959a8e04e
> **Lenses**: correctness, maintainability
> **Reasoning**: medium — the story set is the public site; a missing state is a documentation gap, not a runtime risk.

### Step 2.1: Specification tests

**Reference**: [03-02](03-02-storybook.md) · ST-9–ST-12 · AR-6, AR-7, AR-23, AR-27
**Objective**: Prove the PRT-01 story, wrapper stories and viewport configuration are absent.

- [x] 2.1.1 [spec-author] Write the story-manifest, PRT-01, wrapper and viewport cases with `RD-11-AC-02`, `RD-11-AC-11` — `tests/quality/storybook-contract.spec.test.ts` ✅ (completed: 2026-11-12 15:00)
- [x] 2.1.2 Run the new tests and record the red result — `pnpm test:quality` ✅ (completed: 2026-11-12 15:00)

### Step 2.2: Implementation

**Reference**: [03-02](03-02-storybook.md) · AR-6, AR-7, AR-23, AR-27
**Objective**: Add the missing stories, the fixture and the built-in viewport configuration.

- [x] 2.2.1 Configure named viewports with the built-in `storybook/viewport` — `apps/storybook/.storybook/preview.ts` ✅ (completed: 2026-11-12 15:00)
- [x] 2.2.2 Add the PRT-01 booking and annotation fixture — `apps/storybook/stories/fixtures.ts` ✅ (completed: 2026-11-12 15:00)
- [x] 2.2.3 Add the exact 2017-yellow PRT-01 print story under `Year Planner/06 Print Planning` — `apps/storybook/stories/Print.stories.tsx` ✅ (completed: 2026-11-12 15:00)
- [x] 2.2.4 Add the `FluentWrapper` and `MuiWrapper` provider stories — `apps/storybook/stories/Adapters.stories.tsx` ✅ (completed: 2026-11-12 15:00)
- [x] 2.2.5 Update the story count to 174 in all three docs — `README.md`, `docs/getting-started.md`, `docs/test-report.md` ✅ (completed: 2026-11-12 15:00)

### Step 2.3: Green, implementation tests and verify

- [x] 2.3.1 Prove green for ST-9–ST-12 and build the site after the packages — `pnpm test:quality && pnpm build && pnpm storybook:build` ✅ (completed: 2026-11-12 15:00)
- [x] 2.3.2 Verify the phase — `pnpm verify` ✅ (completed: 2026-11-12 15:00)

**Deliverables**:
- [x] PRT-01 2017-yellow print story present and named
- [x] Fluent/MUI provider wrapper stories present
- [x] Built-in viewport configured; no addon dependency added
- [x] All phase verification passing

**Test slices**: `verification` (task) via the Storybook contract; `apps/**` is full-on
**Task verify**: `pnpm verify` (full gate; AR-30)
**Verify (gate)**: `pnpm verify`

---

## Phase 3: TSDoc and API reference

> **Phase baseline tree**: recorded at phase start by the exec-plan skill.
> **Lenses**: correctness, api-surface, maintainability
> **Reasoning**: high — the API report is the reviewed public contract; a wrong member doc is a published statement.

### Step 3.1: Specification tests

**Reference**: [03-03](03-03-api-reference.md) · ST-13–ST-18 · AR-10–AR-12
**Objective**: Prove the undocumented entries, disabled release-tag rule, non-fatal TypeDoc validation and missing examples.

- [ ] 3.1.1 [spec-author] Write the report, release-tag, TypeDoc-validation, API-report-gate and example cases with `RD-11-AC-03`, `RD-11-AC-04` — `tests/quality/tsdoc-contract.spec.test.ts`
- [ ] 3.1.2 Run the new tests and record the red result — `pnpm test:quality`

### Step 3.2: Implementation

**Reference**: [03-03](03-03-api-reference.md) · AR-10–AR-12
**Objective**: Document every public entry, add the entry-point examples and enable the gates.

- [ ] 3.2.1 Document the core period and interval members — `packages/core/src/period.ts`, `packages/core/src/interval.ts`
- [ ] 3.2.2 Document `DateParseResult` and `MS_PER_DAY` — `packages/core/src/date.ts`
- [ ] 3.2.3 Document the core diagnostic members — `packages/core/src/diagnostics.ts`
- [ ] 3.2.4 Document the core layout members and `ClassicYearLayoutResult` — `packages/core/src/layout/classic-year.ts`
- [ ] 3.2.5 Document the React render-context members — `packages/react/src/types.ts`
- [ ] 3.2.6 Document the inspector, theme and resolved-theme members — `packages/react/src/types.ts`, `packages/react/src/theme.ts`
- [ ] 3.2.7 Document the slot component members — `packages/react/src/types.ts`
- [ ] 3.2.8 Document the planner handle members — `packages/react/src/types.ts`, `packages/react/src/YearPlanner.tsx`
- [ ] 3.2.9 Add `@example` to `buildClassicYearLayout` — `packages/core/src/layout/classic-year.ts`
- [ ] 3.2.10 Add `@example` to `YearPlanner` and `YearPlannerProvider` — `packages/react/src/YearPlanner.tsx`, `packages/react/src/provider.tsx`
- [ ] 3.2.11 Enable `ae-missing-release-tag` — `packages/core/api-extractor.json`, `packages/react/api-extractor.json`
- [ ] 3.2.12 Enable TypeDoc `validation.notDocumented`, `invalidLink` and `treatValidationWarningsAsErrors` — `typedoc.core.json`, `typedoc.react.json`
- [ ] 3.2.13 Regenerate the API reports and TypeDoc, and fix every remaining warning — `packages/*/etc/*.api.md`, `docs/api/**`

### Step 3.3: Green, implementation tests and verify

- [ ] 3.3.1 Prove green for ST-13–ST-18 — `pnpm test:quality`
- [ ] 3.3.2 Prove the API gate and the HTML reference — `pnpm api-report:ci && pnpm docs:build`
- [ ] 3.3.3 Verify the phase — `pnpm verify`

**Deliverables**:
- [ ] Zero `(undocumented)` entries in both checked-in reports
- [ ] Release tags reported, examples bound to the named exports
- [ ] TypeDoc validation is fatal and the build is green
- [ ] All phase verification passing

**Test slices**: `core.unit`, `react.unit`, `verification` (task); `packages/*/etc/**` and configs are full-on
**Task verify**: `pnpm verify` (full gate; AR-30)
**Verify (gate)**: `pnpm verify`

---

## Phase 4: Docs site and workflows

> **Phase baseline tree**: recorded at phase start by the exec-plan skill.
> **Lenses**: correctness, security, maintainability
> **Reasoning**: high — a bad artifact path or an unguarded deploy job publishes the wrong content or publishes early.

### Step 4.1: Specification tests

**Reference**: [03-04](03-04-docs-site.md) · ST-19–ST-21 · AR-2, AR-8, AR-9, AR-25
**Objective**: Prove the artifact build, script flags, Pages workflow and PR job are missing.

- [ ] 4.1.1 [spec-author] Write the script, workflow, permission, guard and PR-job cases with `RD-11-AC-05`, `RD-11-AC-06` — `tests/quality/docs-site-contract.spec.test.ts`
- [ ] 4.1.2 Run the new tests and record the red result — `pnpm test:quality`

### Step 4.2: Implementation

**Reference**: [03-04](03-04-docs-site.md) · AR-2, AR-8, AR-9, AR-24, AR-25
**Objective**: Assemble and verify the artifact, expose `docs:site`, add the PR job and the guarded Pages workflow.

- [ ] 4.2.1 Implement the build/copy/verify script with `--root` and `--check-only` — `scripts/build-docs-site.mjs`
- [ ] 4.2.2 Add the script type declarations — `scripts/build-docs-site.d.mts`
- [ ] 4.2.3 Build Storybook into the repo-root `storybook-static/` — `apps/storybook/package.json`
- [ ] 4.2.4 Add the `docs:site` script — `package.json`
- [ ] 4.2.5 Add the build/upload/guarded-deploy workflow — `.github/workflows/pages.yml`
- [ ] 4.2.6 Add the PR `docs-site` build/verify job — `.github/workflows/ci.yml`
- [ ] 4.2.7 Document the release-time Pages enable step — `docs/README.md`

### Step 4.3: Green, implementation tests and verify

- [ ] 4.3.1 Prove green for ST-19–ST-21, build the artifact and check it — `pnpm test:quality && pnpm docs:site && pnpm docs:site -- --check-only`
- [ ] 4.3.2 Write the missing-API, wrong-root and broken-link failure cases — `tests/quality/docs-site.impl.test.ts`
- [ ] 4.3.3 Verify the phase — `pnpm verify`

**Deliverables**:
- [ ] `storybook-static/` contains Storybook at `/` and TypeDoc at `/api`
- [ ] Relative assets and landing links resolve; `--check-only` works on a built artifact
- [ ] PR job builds and verifies the artifact; deploy is manual and `main`-only
- [ ] All phase verification passing

**Test slices**: `verification` (task) via the docs-site contract; `scripts/**`, `package.json` and `.github/**` are full-on
**Task verify**: `pnpm verify` (full gate; AR-30)
**Verify (gate)**: `pnpm verify`

---

## Phase 5: Demo, evidence, traceability and final gate

> **Phase baseline tree**: recorded at phase start by the exec-plan skill.
> **Lenses**: correctness, maintainability
> **Reasoning**: high — traceability closes the milestone; a missing AC row blocks RD-12.

### Step 5.1: Specification tests

**Reference**: [03-05](03-05-demo-evidence.md) · ST-24–ST-27 · AR-15, AR-16, AR-20, AR-31
**Objective**: Prove the shared demo navigation, evidence section and RD-11 traceability rows are missing.

- [ ] 5.1.1 [spec-author] Write the shared-navigation, route-doc and report cases with `RD-11-AC-08`, `RD-11-AC-10` — `tests/quality/demo-contract.spec.test.ts`
- [ ] 5.1.2 Extend the traceability test through RD-11 (the CLI default changes in 5.2.5) — `tests/quality/traceability.spec.test.ts`
- [ ] 5.1.3 Run the new tests and record the red result — `pnpm test:quality`

### Step 5.2: Implementation

**Reference**: [03-05](03-05-demo-evidence.md) · AR-15, AR-16, AR-20, AR-31
**Objective**: Add the shared navigation, the evidence section and the RD-11 traceability rows.

- [ ] 5.2.1 Add the shared `DemoNav` to every route — `apps/demo/src/App.tsx`
- [ ] 5.2.2 Document the demonstration routes, including `?security=1` — `README.md`, `docs/getting-started.md`
- [ ] 5.2.3 Add RD-11-AC-01..13 rows with status `partial` — `codeops/features/year-planner/requirements/00-traceability.md`
- [ ] 5.2.4 Annotate the existing demo E2E titles with `RD-11-AC-08` — `tests/e2e/commands.spec.ts`, `tests/e2e/interaction.spec.ts`, `tests/e2e/accessibility.spec.ts`, `tests/e2e/security.spec.ts`
- [ ] 5.2.5 Flip the RD-11 rows to `proven` and set the CLI default through RD-11 — `codeops/features/year-planner/requirements/00-traceability.md`, `scripts/check-traceability.mjs`, `scripts/lib/traceability.mjs`
- [ ] 5.2.6 Add the RD-11 evidence section and correct the story counts — `docs/test-report.md`
- [ ] 5.2.7 Confirm the roadmap row links this plan; let the completion hook set Done — `codeops/features/year-planner/00-roadmap.md`

### Step 5.3: Green, implementation tests and verify

- [ ] 5.3.1 Prove green for ST-24–ST-27 — `pnpm test:quality`
- [ ] 5.3.2 Run the release gate — `pnpm verify:full`
- [ ] 5.3.3 Rebuild and verify the docs artifact — `pnpm docs:site && pnpm docs:site -- --check-only`
- [ ] 5.3.4 Run the packed consumer check — `pnpm test:consumer`

**Deliverables**:
- [ ] Demo routes discoverable from every route, including the visibility proof
- [ ] Thirteen RD-11 rows proven, checker and CLI through RD-11
- [ ] RD-11 evidence recorded with named gaps and deviations
- [ ] Full release gate passing

**Test slices**: `core.unit`, `react.unit`, `verification` (task); `apps/demo/**` is full-on
**Task verify**: `pnpm verify` (full gate; AR-30)
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

Phase 2 and Phase 3 are independent; Phase 4 needs the Storybook output, the
package build and the TypeDoc output; Phase 5 needs every contract green.

---

## Success Criteria

**Feature is complete when:**

1. ✅ All phases completed
2. ✅ All verification passing (`pnpm verify:full`)
3. ✅ No warnings/errors from API Extractor or TypeDoc
4. ✅ No dead code — the split source guide is removed, its sections preserved
5. ✅ Security — synthetic data only, no secrets, no raw HTML code examples, least-privilege workflows
6. ✅ Documentation updated — guides, README, `DEFERRED.md`, test report and roadmap
7. ✅ Traceability covers RD-11
8. ✅ Post-completion project re-analysis (handled by the exec-plan skill)
