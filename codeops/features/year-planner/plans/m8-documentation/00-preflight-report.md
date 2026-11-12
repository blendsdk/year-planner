# Preflight Report: Documentation, Storybook and API Reference

> **Status**: ✅ PREFLIGHT PASSED WITH NOTES — 37 findings resolved, 2 accepted notes
> **Iteration**: 2 (re-scan after fixes)
> **Artifact**: Implementation plan at `codeops/features/year-planner/plans/m8-documentation/` (11 documents)
> **Codebase Grounded**: 40+ source, config, story, test and workflow files examined; every named path, package, command and count verified
> **Last Updated**: 2026-11-12 14:10

> **SAME-SESSION REVIEW:** This plan was created in the current session. Same-agent
> bias risk is elevated. The 13-dimension scan was therefore fanned out to five
> independent auditor dispatches; their findings were merged here. Consider a
> fresh-session review before RD-12.

## Audit scope

| Item | Value |
| ---- | ----- |
| Audit target | `codeops/features/year-planner/plans/m8-documentation/` (11 files) |
| Context documents | RD-11, `00-traceability.md`, `AGENTS.md`, `README.md`, `docs/**`, `apps/storybook/**`, `apps/demo/**`, `packages/*/src/**`, `packages/*/etc/**`, `scripts/**`, `tests/quality/**`, `.github/workflows/**`, `package.json`, `pnpm-lock.yaml`, `codeops/test-map.json` |
| Modification set | The 11 plan documents only |
| Scope mode | Strict |
| Original goal | Make the component usable by an independent developer without reading its source: exhaustive Storybook, TSDoc/API/TypeDoc reference, honest status pages, runnable demo and reproducible docs artifact |
| Smallest viable design | Keep the existing markdown/Storybook/TypeDoc stack; split the overloaded guide; add the missing stories; remove the undocumented report entries; assemble the artifact with a small Node script |

## Codebase Context Summary

**Tech Stack:** ESM-only pnpm monorepo, TypeScript 6, React 19, Vite 7, Vitest 4,
Playwright 1.65, Storybook 10.6.6, TypeDoc 0.28.20, API Extractor 7.60.1,
Biome 2.6.6, Node 24. **Architecture:** pure core package, React package with
interaction/command/render layers, private demo and Storybook apps, quality
contracts under `tests/quality`. **Key files examined:** the two package
manifests and API reports, `api-extractor.json`, `typedoc.*.json`,
`apps/storybook/{package.json,.storybook/*,stories/*}`, `apps/demo/src/App.tsx`,
`tests/quality/*`, `scripts/check-traceability.mjs`, `scripts/lib/traceability.mjs`,
`.github/workflows/ci.yml`, `package.json`, `codeops/test-map.json`.

**Reference verification:** every plan path exists or is explicitly proposed;
the counts 171 stories/12 files, 157 matrix rows, 23 deferred capabilities and
14 topics were verified; installed-package behavior was checked for the
viewport, relative asset URLs and TypeDoc validation.

## Summary by Severity

| Severity | Count | Status |
| -------- | ----- | ------ |
| CRITICAL | 4 | All resolved |
| MAJOR | 16 | All resolved |
| MINOR | 8 | All resolved or accepted |
| OBSERVATION | 2 | Accepted |

## Findings

### PF-001: `@storybook/addon-viewport@10.6.6` does not exist; viewport is built in [CRITICAL]

**Dimension:** Dependency / Feasibility
**Location:** `03-02-storybook.md` §Proposed Changes; `99-execution-plan.md` task 2.2.1; `07-testing-strategy.md` ST-11
**Codebase Evidence:** `apps/storybook/package.json` pins Storybook 10.6.6. The registry's latest `@storybook/addon-viewport` is 9.0.8 (an empty package); the installed `storybook@10.6.6` exports `./viewport` and the built site already reports `"viewport": true`.
**Problem:** The dependency cannot be installed and the addon-registration oracle cannot pass.
**Resolution:** Use Storybook 10's built-in `storybook/viewport` and named `parameters.viewport` entries; record the RD deviation (AR-23). No dependency is added. **Fixed** in `03-02`, `07`, `99` and AR-6/AR-23.

### PF-002: Storybook artifact path does not match the build output [CRITICAL]

**Dimension:** Logical Contradiction / Codebase Alignment
**Location:** `03-04-docs-site.md` §Artifact layout and script steps; `99-execution-plan.md` task 4.2.1; `.github/workflows/pages.yml` plan
**Codebase Evidence:** `apps/storybook/package.json` builds `-o storybook-static` inside the app, so the output is `apps/storybook/storybook-static/`; no root directory exists.
**Problem:** The script, checks and upload would target an empty root path.
**Resolution:** Build Storybook into the repo root with `-o ../../storybook-static` and use that single path everywhere (AR-24). **Fixed** in `03-04`, `99`.

### PF-003: `docs:site` never builds the workspace packages [CRITICAL]

**Dimension:** Dependency / Ordering
**Location:** `03-04-docs-site.md` script steps; the Pages build job
**Codebase Evidence:** `packages/*/package.json` export `dist/`, which is gitignored; `preview.ts` imports the package CSS; the existing `verify` runs `pnpm build` before Storybook.
**Problem:** A clean checkout or CI runner cannot resolve the workspace packages, so the first docs build fails.
**Resolution:** The script runs `pnpm build` before Storybook and TypeDoc (AR-8). **Fixed** in `03-04`, `99`; Phase 2's build command includes `pnpm build`.

### PF-004: Artifact-dependent tests run in the pre-build quality project [CRITICAL]

**Dimension:** Testability / Ordering
**Location:** `07-testing-strategy.md` ST-20/21/22; `03-04-docs-site.md` §Testing Requirements
**Codebase Evidence:** `vitest.quality.config.ts` explicitly runs before the build and must not read `dist`; `package.json` orders `test:quality` before `build`, `storybook:build` and `docs:build`; `storybook-static/` and `docs/api/` are gitignored.
**Problem:** The contracts would fail on a clean checkout or require a slow build inside a 30-second, 3-second-budget group.
**Resolution:** The Vitest contract asserts script/workflow/config only; the real artifact proof is `pnpm docs:site` and `docs:site -- --check-only` in Phase 4 and the PR `docs-site` job (AR-25). **Fixed** in `03-04`, `07`, `99`.

### PF-005: Absolute base-path assertion contradicts Storybook's relative output [MAJOR]

**Dimension:** Compatibility / Codebase Alignment
**Location:** `03-02-storybook.md` §Base path; `03-04-docs-site.md` script step 6; ST-12/20/22
**Codebase Evidence:** The built `index.html` and `iframe.html` use `./` asset URLs; `@storybook/builder-vite` defaults to `base: "./"`; `viteFinal` affects the preview build, not the manager template.
**Problem:** The planned `/year-planner/` prefix never appears, and an absolute override makes local static builds less portable.
**Resolution:** Keep relative URLs, drop `STORYBOOK_BASE`/`viteFinal`, and resolve relative URLs on disk (AR-7, AR-25). **Fixed** in `03-02`, `03-04`, `07`, `99`.

### PF-006: TypeDoc validation warnings are not fatal [MAJOR]

**Dimension:** Testability
**Location:** `03-03-api-reference.md` §TypeDoc validation; ST-16
**Codebase Evidence:** TypeDoc 0.28.20 exits zero for validation warnings unless `treatWarningsAsErrors` or `treatValidationWarningsAsErrors` is set.
**Problem:** The claimed TypeDoc gate would pass with undocumented reflections.
**Resolution:** Add `treatValidationWarningsAsErrors: true` and assert it (AR-10). **Fixed** in `03-03`, `07`, `99`.

### PF-007: AC-13 has no proving case; AC-12's "existing contract" does not exist [MAJOR]

**Dimension:** Completeness / Testability
**Location:** `01-requirements.md` §Security scope; `07-testing-strategy.md` ST-8/ST-25; `03-05-demo-evidence.md` §Traceability
**Codebase Evidence:** `tests/quality/repo-contract.spec.test.ts` checks production secrets/HTML, not docs; no asset or photo test exists.
**Problem:** The traceability checker through RD-11 cannot honestly close AC-12/AC-13.
**Resolution:** Add ST-28 (docs security scan) and ST-29 (asset provenance) with explicit titles (AR-29). **Fixed** in `07`, `99`, `03-05`.

### PF-008: AC-08 visibility evidence is not wired to the annotated E2E titles [MAJOR]

**Dimension:** Completeness / Codebase Alignment
**Location:** `03-05-demo-evidence.md` §Traceability; task 5.2.4
**Codebase Evidence:** `commands.spec.ts` and `interaction.spec.ts` do not test visibility; the hidden-item proof is in `accessibility.spec.ts`; the default route passes `defaultVisibility` only in `?security=1` mode.
**Problem:** The matrix could claim visibility without a proving test.
**Resolution:** Annotate `accessibility.spec.ts` and document `?security=1`; add the shared nav on every route (AR-15). **Fixed** in `03-05`, `07`, `99`.

### PF-009: The `react-view.md` split loses SSR, ESM-only and items sections [MAJOR]

**Dimension:** Completeness
**Location:** `03-01-guide-set.md` page table; task 1.2.15
**Codebase Evidence:** `docs/react-view.md` has SSR, ESM-only and items/overflow sections; the split table named only five destinations.
**Problem:** Removing the file would drop content that no contract checked.
**Resolution:** Add a section-by-section migration map; put SSR/ESM in getting-started and items/overflow in customization (AR-4). **Fixed** in `03-01`, `02`, `99`; required headings include SSR/ESM.

### PF-010: AC-04 is mapped to the traceability checker, which would be circular [MAJOR]

**Dimension:** Completeness / Testability
**Location:** `03-05-demo-evidence.md` §Traceability; `07-testing-strategy.md` ST-26
**Codebase Evidence:** No existing test asserts `api-report:ci` in `verify` or both reports checked in.
**Problem:** The matrix would validate itself.
**Resolution:** Add ST-18 to the TSDoc contract and map AC-04 there (AR-10). **Fixed** in `07`, `99`, `03-05`.

### PF-011: TSDoc plan misses `date.ts`; count unit is inconsistent [MAJOR]

**Dimension:** Codebase Alignment / Consistency
**Location:** `02-current-state.md`; `03-03-api-reference.md`; tasks 3.2.2–3.2.4
**Codebase Evidence:** The core report has 55 `(undocumented)` entries: 52 members, `ClassicYearLayoutResult`, `DateParseResult` and `MS_PER_DAY`; the latter two live in `packages/core/src/date.ts`.
**Problem:** The task list cannot reach zero undocumented entries.
**Resolution:** Define the unit as report entries (55 core + 57 React), add the `date.ts` task, and correct the counts (AR-10). **Fixed** in `02`, `03-03`, `99`.

### PF-012: Phase 2–5 task verification is not a fast slice [MAJOR]

**Dimension:** Ordering / Feasibility
**Location:** `99-execution-plan.md` task-verify lines
**Codebase Evidence:** `codeops/test-map.json` marks `apps/**`, `scripts/**`, `package.json`, lockfiles, TypeDoc/API Extractor configs and `packages/*/etc/**` as full-on.
**Problem:** The stated task scopes and budgets were wrong.
**Resolution:** State the full gate at task level for those phases and use the phase baseline tree (AR-30). **Fixed** in `99`.

### PF-013: Phase 5 traceability ordering makes intermediate tasks unverifiable [MAJOR]

**Dimension:** Ordering
**Location:** `99-execution-plan.md` task 5.1.2 and 5.2.1–5.2.4
**Codebase Evidence:** The checker requires every row to have a proving title; extending `through: 11` before the rows/titles exist leaves a red gate.
**Problem:** Tasks would be marked complete with a failing verify.
**Resolution:** Add rows as `partial`, annotate titles, then flip to `proven` (AR-31). **Fixed** in `99`, `03-05`.

### PF-014: Fluent/MUI wrapper and modifier-key story coverage is overclaimed [MAJOR]

**Dimension:** Implicit Assumption
**Location:** `03-02-storybook.md` state table; AR-6
**Codebase Evidence:** The adapter stories map tokens; no wrapper story exists; the interaction stories are static and have no modifier-key story.
**Problem:** AC-2/AC-11 coverage was asserted without the stories.
**Resolution:** Add `FluentWrapper`/`MuiWrapper` provider stories; document modifier keys and prove them in the interaction E2E (AR-27). **Fixed** in `03-02`, `07`, `99`.

### PF-015: The README quickstart cannot be satisfied as written [MAJOR]

**Dimension:** Completeness / Honesty
**Location:** `03-01-guide-set.md` §README quickstart; ST-3
**Codebase Evidence:** Packages are unpublished; the existing snippet has undefined `items`/`layers`; `scripts/clean-consumer.sh` packs and installs tarballs.
**Problem:** A `pnpm add` instruction would be false and the snippet is not runnable.
**Resolution:** One fenced block with static data, state, callbacks and print; honest packed-install note until RD-12 (AR-5, AR-26). **Fixed** in `03-01`, `07`, `99`.

### PF-016: `--check-only`, the workflow step and the script root are underspecified [MAJOR]

**Dimension:** Completeness / Edge Cases
**Location:** `03-04-docs-site.md` script steps and workflow; `07-testing-strategy.md` impl test
**Codebase Evidence:** The script resolves its own repo root; no `--root`; `--check-only` must not delete first; the workflow had no check step.
**Problem:** The impl test cannot use temporary fixtures and the check-only proof never ran.
**Resolution:** Add `--root` and branch before deletion; add the check-only step to the PR/Pages build (AR-8). **Fixed** in `03-04`, `99`.

### PF-017: No pull-request docs-site build [MAJOR]

**Dimension:** Completeness / CI
**Location:** `03-04-docs-site.md`; `00-index.md` commands
**Codebase Evidence:** `ci.yml` runs `pnpm verify`, which does not run `docs:site`; the Pages workflow triggers only on `main`.
**Problem:** A broken artifact assembly could merge.
**Resolution:** Add a `docs-site` PR job to `ci.yml` (AR-9). **Fixed** in `03-04`, `00-index`, `99`.

### PF-018: Stub topic pages can pass the docs contract [MAJOR]

**Dimension:** Testability
**Location:** `03-01-guide-set.md` required content; ST-1/ST-3
**Codebase Evidence:** The original ST-1 checked file existence and one H1 only.
**Problem:** A one-line page would satisfy the topic map.
**Resolution:** Assert the required H2 headings per page, the FAQ pair count, the single quickstart block and its tokens (AR-4). **Fixed** in `03-01`, `07`.

### PF-019: The honesty rules have no phrase policy and fail the current wording [MAJOR]

**Dimension:** Ambiguity / Testability
**Location:** `03-01-guide-set.md` error table; ST-4/ST-5
**Codebase Evidence:** `docs/accessibility.md` uses `**Conformance claim**: none`; `docs/interaction.md` still says WCAG conformance is "covered by the accessibility milestone".
**Problem:** A literal check fails honest text, while a broad check false-flags `targets WCAG 2.2 AA`.
**Resolution:** Normalize emphasis; allow "targets"; deny positive claim phrases; reword the stale interaction sentence (AR-14). **Fixed** in `03-01`, `07`, `99`.

### PF-020: The script needs type declarations and path/URL imports [MAJOR]

**Dimension:** Feasibility
**Location:** `03-04-docs-site.md` script steps; task 4.2.1
**Codebase Evidence:** `tsconfig.tools.json` typechecks `tests/quality/**`; existing scripts ship `.d.mts` files; `allowJs` is off; path/URL resolution needs `node:path`/`node:url`.
**Problem:** Importing the script from the impl test would fail `typecheck:tools`.
**Resolution:** Add `scripts/build-docs-site.d.mts` and list the full import set (AR-8). **Fixed** in `03-04`, `99`.

### PF-021: `buildRibbonLayout` already has an `@example` [MINOR]

**Dimension:** Consistency
**Location:** `02-current-state.md`; task 3.2.8; ST-17
**Codebase Evidence:** `packages/core/src/ribbon/fragments.ts` already has the tag.
**Problem:** The task would duplicate an existing example.
**Resolution:** Verify it instead; the missing examples are `YearPlanner`, `YearPlannerProvider` and `buildClassicYearLayout` (AR-12). **Fixed** in `02`, `03-03`, `07`, `99`.

### PF-022: Test-file, story-count and ST-10 title inventory inconsistencies [MINOR]

**Dimension:** Consistency
**Location:** `00-index.md`, `01-requirements.md`, `07-testing-strategy.md`, ST-10
**Codebase Evidence:** The plan creates four spec and two impl files; the Print meta title is `Year Planner/06 Print Planning`, not `Print`; the count appears in three docs.
**Problem:** Reviewers and executors would follow different inventories, and a literal story ID would fail.
**Resolution:** State six files; use the actual Print title; check the count in all three docs (AR-17, AR-19). **Fixed** in `00-index`, `01`, `07`, `99`.

### PF-023: Deploy guard and specialist coverage [MINOR]

**Dimension:** Security
**Location:** `03-04-docs-site.md` workflow; `00-index.md` Specialist Agents
**Codebase Evidence:** The workflow can be dispatched from any ref; the plan claimed no new security surface.
**Problem:** A feature branch could publish; the workflow permissions were not reviewed.
**Resolution:** Add `refs/heads/main` to the deploy guard and dispatch the existing `security-auditor` for Phase 4 (AR-9). **Fixed** in `03-04`, `00-index`, `99`.

### PF-024: The demo navigation is one-way [MINOR]

**Dimension:** Edge Cases
**Location:** `03-05-demo-evidence.md` §Demo navigation
**Codebase Evidence:** `App.tsx` returns the sub-route before the `demo-chrome` block, so a default-page nav disappears.
**Problem:** The user cannot return without the browser button.
**Resolution:** Render a shared `DemoNav` before the route switch (AR-15). **Fixed** in `03-05`, `99`.

### PF-025: Traceability CLI and roadmap task boundaries [MINOR]

**Dimension:** Consistency / Ordering
**Location:** `03-05-demo-evidence.md`; task 5.2.6/5.2.7
**Codebase Evidence:** `scripts/check-traceability.mjs` defaults `through = 10`; the exec-plan skill owns the Done transition.
**Problem:** The CLI silently skips RD-11, and the plan could mark Done before the release gate.
**Resolution:** Default the CLI through 11; confirm the roadmap link and let the completion hook set Done (AR-16). **Fixed** in `03-05`, `99`.

### PF-026: Stale current-state facts and a missing `DEFERRED.md` link scope [MINOR]

**Dimension:** Codebase Alignment
**Location:** `02-current-state.md`; ST-2
**Codebase Evidence:** `docs/react-view.md` is 186 lines with twelve sections, not 182/six; `docs/slots` does not exist; the link check omitted `DEFERRED.md`.
**Problem:** The baseline was partly stale and a new root document was outside the link contract.
**Resolution:** Correct the facts and include `DEFERRED.md` in ST-2. **Fixed** in `02`, `03-01`, `07`.

### PF-027: RD-11 Should Have architecture diagrams has no deliverable [MINOR]

**Dimension:** Completeness
**Location:** `01-requirements.md`; `03-01-guide-set.md`
**Codebase Evidence:** `docs/adr/0001-renderer-strategy.md` is prose; no diagram exists.
**Problem:** A Should Have was silently dropped.
**Resolution:** Add a checked-in Mermaid diagram in `docs/architecture.md` (AR-28). **Fixed** in `01`, `03-01`, `99`.

### PF-028: Security and asset scan scope is undefined [MINOR]

**Dimension:** Security
**Location:** `01-requirements.md` §Security scope; ST-8/ST-28
**Codebase Evidence:** `docs/security.md` legitimately contains the word `dangerouslySetInnerHTML`; generated Storybook and TypeDoc assets contain fonts/SVGs.
**Problem:** A broad scan would false-fail; a narrow one could miss real usage.
**Resolution:** Scan fenced code blocks only; use an explicit generated-asset allowlist; assert `_reference/` is absent (AR-29). **Fixed** in `07`, `01`.

### Iteration 2 residual findings

| # | Severity | Finding | Resolution |
|---|----------|---------|------------|
| PF-029 | MAJOR | Phase 1's ST-7/ST-5/ST-6 needed content that no Phase 1 task created (getting-started count, performance claim/report link) | Added the count to task 1.2.2 and the required headings; added `Conformance claim: none` and the report link to task 1.2.10 |
| PF-030 | MINOR | The `?security=1` route proof is `security.spec.ts`, not the accessibility hidden-item test | Corrected `03-05`, `07` and task 5.2.4; accessibility remains the dynamic-hiding proof |
| PF-031 | MINOR | Phase 1's task-gate claim did not match the map (`DEFERRED.md` is unknown; docs select only the quality group) | Changed Phase 1 task verify to `pnpm verify` and corrected the evidence text |
| PF-032 | MINOR | Task 5.1.2/ST-26 still attributed AC-02/AC-04 to the traceability test | Removed the IDs; AC-02 → Storybook contract, AC-04 → TSDoc contract; ST-26 cites the project traceability contract |
| PF-033 | MINOR | `03-03` still listed `theme.ts` and `fragments.ts` as examples to add | Reworded to add the three missing and verify the two existing |
| PF-034 | MINOR | The CLI default change appeared in both 5.1.2 and 5.2.5 | Kept it in 5.2.5; 5.1.2 only extends the test |
| PF-035 | MINOR | The report said "77 checkbox lines" although the file has 98 (77 tasks + 21 deliverables) | Corrected the wording |
| PF-036 | MINOR | The wrapper story description implied `YearPlannerProvider` accepts adapter tokens | Specified `YearPlannerProvider` around a `YearPlanner` with the adapter `cssVars`; updated ST-11 |
| PF-037 | MINOR | `00-index` still described `docs:site` as "Storybook with base path" | Changed to "Storybook (relative URLs) + TypeDoc at /api" |

## Iteration 2 verification

| Check | Result |
| ----- | ------ |
| Plan file and link integrity | 11 files; every relative link resolves |
| Plan task count | 77 numbered tasks, matching the phase table; 21 deliverable checkboxes are separate |
| Register gate | `✅ GATE PASSED — 31 resolved, 0 open` |
| Storybook package claim | Built-in `storybook/viewport` verified in the installed package |
| Artifact path | Root `storybook-static/` used consistently in `03-04`, `99` and the workflow |
| TSDoc counts | 55 core + 57 React report entries, with `date.ts` covered by a task |
| Base-path design | Relative URLs; no `STORYBOOK_BASE`/`viteFinal` planning left |
| Traceability plan | Partial-first rows, CLI default 11, AC-04/AC-08/AC-12/AC-13 owners named |
| Test inventory | Four spec + two impl files, all with an owning phase task |
| Security scan scope | Fenced-code scan and asset allowlist recorded |

## Accepted notes

| # | Note | Owner / revisit |
|---|------|-----------------|
| PF-N1 | No live Pages deployment in R1. The build/upload and guarded deploy exist; enabling Pages is a public-release step (AR-2). | User; revisit at RD-12/public release |
| PF-N2 | Manual NVDA/VoiceOver evidence remains parked; no WCAG conformance claim. Automated axe and the documented status remain (AR-18). | User; revisit when a Windows/macOS AT host is available |

## Deviations recorded for the test report

- RD-11 names `@storybook/addon-viewport`; Storybook 10 provides the viewport in
  core, so the addon is not installed (AR-23).
- RD-11 AC7 says "install the package"; the packages are unpublished, so the
  quickstart uses the packed-tarball/consumer path until RD-12 (AR-26).

**Verdict:** ✅ PASSED WITH NOTES — every critical/major finding is resolved in the
plan; the two notes are inherited scope decisions recorded in the register.
