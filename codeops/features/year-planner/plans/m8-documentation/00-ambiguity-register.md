# Ambiguity Register: Documentation, Storybook and API Reference

> **Status**: ✅ GATE PASSED — 22 resolved, 0 open
> **Last Updated**: 2026-11-12 13:42
> **Policy**: `--auto-design` active — eligible technical decisions delegated; scope, publication and honesty decisions inherited from the user's RD-11 directive, the RD itself and the prior RD-09/RD-10 rulings

| # | Category | Ambiguity / Gap | Options Presented | Decision | Status |
|---|----------|-----------------|-------------------|----------|--------|
| AR-1 | Scope | Which roadmap items this plan covers | RD-11 only / RD-11 plus RD-12 / RD-11 plus issue #4 | **RD-11 only.** RD-12 release/versioning and issue #4 auto-fit stay out. | ✅ Resolved — user milestone directive |
| AR-2 | Scope | Whether R1 publishes a live GitHub Pages site | Deploy now / build and upload the artifact now, enable Pages at the public release / no site | **Build the artifact in CI now; do not publish.** RD-11 explicitly keeps the repository private first and enables Pages at the public release. The deploy job exists but runs only through a manual dispatch with an explicit `deploy` input. | ✅ Resolved — inherited RD-11 decision |
| AR-3 | Technical unknowns | Where the user guide pages live | Storybook MDX pages / flat `docs/*.md` with an index / a VitePress site | **Flat `docs/*.md` plus `docs/README.md`.** Storybook and TypeDoc remain the published site. VitePress is explicitly out of scope, and the repo already keeps its guides as markdown. | ✅ Resolved — delegated |
| AR-4 | Naming & terminology | The RD names fourteen documentation topics but not file names | One page per topic / a topic map over existing pages / merge topics | **One owning page per topic plus a `docs/README.md` topic map.** `docs/react-view.md` is split into theming, customization, inspector/tooltip, print and getting-started; `commands.md`, `interaction.md` and `accessibility.md` keep their topics. | ✅ Resolved — delegated |
| AR-5 | UX & presentation | What the README quickstart must contain | Link only / a complete copy-paste example / embed the getting-started guide | **One complete example**: install, CSS import, static 14-month data, controlled selection and visibility, and a print button. `docs/getting-started.md` owns the expanded walkthrough. | ✅ Resolved — delegated |
| AR-6 | Feature gaps | Which Storybook states are actually missing | Rebuild the story set / add only the RD-named gaps / accept the current set | **Add the exact PRT-01 2017-yellow print story, the viewport addon and a documented base path.** The existing 171 stories already cover windows, ribbons, overflow, visibility, interaction, inspector, themes and token adapters. Fluent/MUI integration stays the existing token-adapter stories plus copy-paste examples in `docs/theming.md`; no design-system dependency is added to Storybook. | ✅ Resolved — delegated |
| AR-7 | Technical unknowns | How Storybook builds under the `/<repo>/` base path | A hard-coded base / an environment variable read by `viteFinal` / a post-build rewrite | **`STORYBOOK_BASE` read by `viteFinal`, defaulting to `/`.** The docs-site build sets `/year-planner/`; local development stays at `/`. | ✅ Resolved — delegated |
| AR-8 | Technical unknowns | How the GH Pages artifact is assembled | A shell script / a Node script / a Storybook-only build | **A small `scripts/build-docs-site.mjs`** that runs the existing Storybook and TypeDoc builds, copies `docs/api` into `storybook-static/api`, and verifies composition and links. No new dependency or framework. | ✅ Resolved — delegated |
| AR-9 | Integration points | Which Pages actions and guards the workflow uses | No workflow / a deploy-on-push workflow / a build workflow plus a guarded manual deploy job | **A `pages` workflow**: build and upload on push to `main`, deploy only on `workflow_dispatch` with `deploy: true`, job-level `pages: write` and `id-token: write`. Least privilege elsewhere. | ✅ Resolved — delegated |
| AR-10 | Non-functional gaps | How "every public export has TSDoc" is enforced | Manual review / API Extractor release tags plus a contract test / TypeDoc warnings only | **All three signals:** enable `ae-missing-release-tag`, remove every `(undocumented)` member from the checked-in API reports, enable TypeDoc `validation.notDocumented`, and add a contract test. | ✅ Resolved — delegated |
| AR-11 | Technical unknowns | How the TSDoc contract reads the surface | Source AST / checked-in API reports / TypeDoc JSON | **Checked-in API reports for members and release tags**, plus a source check for `@example` on the named entry points. The reports are the reviewed public surface. | ✅ Resolved — delegated |
| AR-12 | Naming & terminology | What "`@example` on public entry points" covers | Every export / main package entry points / components only | **Main entry points:** `YearPlanner`, `YearPlannerProvider`, `createTheme`, `buildClassicYearLayout` and `buildRibbonLayout`, plus the existing adapter examples. | ✅ Resolved — delegated |
| AR-13 | Data & state | Where the deferred-capability list lives | README section / `DEFERRED.md` at the root / roadmap only | **`DEFERRED.md` at the root**, one bullet per RD-11 deferred capability, linked from the README and `docs/limitations.md`. | ✅ Resolved — delegated |
| AR-14 | Security & compliance | How the docs stay honest about accessibility and performance | Repeat the RD-09/RD-10 evidence / claim conformance / omit status | **State the measured status and the known misses; make no conformance claim.** The contract test forbids conformance phrases and requires the parked manual audit and the measured performance gaps to be named. | ✅ Resolved — inherited RD-09/RD-10 decisions |
| AR-15 | UX & presentation | Whether the demo needs a new page for the RD-11 states | New demo app / new route / visible navigation over the existing routes | **Keep the existing `?commands=1`, `?interaction=1`, `?ac3=1` and `?print=prt01` routes; add visible navigation and README instructions.** No second demo app. | ✅ Resolved — delegated |
| AR-16 | Integration points | How RD-11 joins the traceability contract | Leave it for RD-12 / add rows now / waive | **Add RD-11-AC-01..13 rows, extend the checker through RD-11, and annotate the existing demo E2E tests with `RD-11-AC-08`.** | ✅ Resolved — delegated |
| AR-17 | Technical unknowns | Where the documentation contract tests live | Four files under `tests/quality/` / E2E only / a new runner | **Four Vitest files in `tests/quality/`** using the existing quality project and helpers: docs, Storybook, TSDoc and docs-site. No new runner. | ✅ Resolved — delegated |
| AR-18 | Non-functional gaps | The manual NVDA/VoiceOver audit is still parked | Run it / keep it parked and state it / block RD-11 | **Keep it parked and name it in `docs/accessibility.md` and `docs/limitations.md`.** No WCAG conformance claim. | ✅ Resolved — inherited RD-09 decision |
| AR-19 | UX & presentation | Story counts in the docs drift from the real set | Hard-code a count / omit counts / compute and assert the count | **Compute the count in the docs contract and require the docs to state the same number.** The current set is 171 stories across 12 files. | ✅ Resolved — delegated |
| AR-20 | Data & state | Whether the guides introduce new measurements | Re-run benchmarks / reuse the RD-10 evidence / omit numbers | **Reuse the checked-in RD-10 evidence** in `docs/test-report.md`, `docs/benchmarks/` and `docs/security.md`; no new measurement in a documentation milestone. | ✅ Resolved — delegated |
| AR-21 | Scope | Migration/versioning content | Versioned docs / a single migration page / omit | **One `docs/migration.md`** covering the pre-RD-06 preview migration and the semver/versioning policy. Versioned docs stay out of R1. | ✅ Resolved — inherited RD-11 scope |
| AR-22 | Integration points | How the API landing page is published | TypeDoc only / keep `docs/api-index.html` / write a new page | **Keep `docs/api-index.html`** as the `/api` landing page; the docs-site script copies it with the generated API tree. | ✅ Resolved — delegated |

## Resolution Notes

### Authority summary

- AR-1, AR-2, AR-14, AR-18 and AR-21 are **user-owned or inherited** scope, publication, honesty and
  scope-boundary decisions. They restate the RD-11 text and the RD-09/RD-10 rulings; they are not
  delegated to auto-design.
- AR-3 through AR-13 and AR-15 through AR-17, AR-19, AR-20 and AR-22 are **eligible technical
  decisions** inside the confirmed RD-11 scope. They create no product behavior change, public
  compatibility break, paid service or live publication.

### Delegated provenance

```text
Authority: AI — delegated by --auto-design
Eligibility: documentation structure, Storybook coverage, API-reference enforcement, static-site
  assembly, CI evidence wiring and implementation sequencing inside RD-11
Objective: make the component usable by an independent developer without reading its source —
  exhaustive Storybook states, a TSDoc/API Extractor/TypeDoc reference, honest status pages, a
  runnable demo and a reproducible docs-site artifact
Evidence: codeops/features/year-planner/requirements/RD-11-documentation.md;
  codeops/features/year-planner/requirements/00-traceability.md; README.md; docs/*.md;
  docs/test-report.md; docs/security.md; docs/benchmarks/rd10-after.md;
  apps/storybook/.storybook/main.ts; apps/storybook/stories/*.stories.tsx (171 stories);
  apps/demo/src/App.tsx; apps/demo/src/CommandsDemo.tsx; packages/core/etc/*.api.md (52
  undocumented members); packages/react/etc/*.api.md (57 undocumented members);
  packages/*/api-extractor.json; typedoc.*.json; .github/workflows/ci.yml; package.json
Rejected alternatives: named per row above
Strongest counterargument: splitting the existing guides and documenting 109 public interface
  members is churn with no runtime behavior; a smaller plan could add a handful of pages and leave
  the API reports as they are. The RD explicitly requires every listed topic as a page and TSDoc on
  every public interface and component prop, so the smaller plan would not satisfy AC3 or the
  Must Have list.
Confidence: High — every deliverable is a checked-in document, story, config or script, and the
  contract tests read the same artifacts the review will inspect
Hardening: in-context review of the structure and enforcement; no new runtime dependency, no new
  framework, no live deployment and no product behavior change
Policy version: 1
Root invocation ID: rd11-documentation-2026-11-12
Reopen triggers: the user enables Pages before release; a guide needs a new runtime measurement;
  Storybook cannot build under the base path; TypeDoc cannot pass `notDocumented`; the user changes
  the documentation scope or asks for guide pages on the public site
```
