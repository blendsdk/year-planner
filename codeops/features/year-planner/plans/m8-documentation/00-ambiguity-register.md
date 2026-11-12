# Ambiguity Register: Documentation, Storybook and API Reference

> **Status**: ✅ GATE PASSED — 32 resolved, 0 open (one runtime addition)
> **Last Updated**: 2026-11-12 14:10
> **Policy**: `--auto-design` active — eligible technical decisions delegated; scope, publication and honesty decisions inherited from the user's RD-11 directive, the RD itself and the prior RD-09/RD-10 rulings

| # | Category | Ambiguity / Gap | Options Presented | Decision | Status |
|---|----------|-----------------|-------------------|----------|--------|
| AR-1 | Scope | Which roadmap items this plan covers | RD-11 only / RD-11 plus RD-12 / RD-11 plus issue #4 | **RD-11 only.** RD-12 release/versioning and issue #4 auto-fit stay out. | ✅ Resolved — user milestone directive |
| AR-2 | Scope | Whether R1 publishes a live GitHub Pages site | Deploy now / build and upload the artifact now, enable Pages at the public release / no site | **Build the artifact in CI now; do not publish.** The deploy job is manual-only, guarded by `deploy: true` and `refs/heads/main`. | ✅ Resolved — inherited RD-11 decision |
| AR-3 | Technical unknowns | Where the user guide pages live | Storybook MDX pages / flat `docs/*.md` with an index / a VitePress site | **Flat `docs/*.md` plus `docs/README.md`.** Storybook and TypeDoc remain the published site; the guides are repository documentation. VitePress is out of scope. | ✅ Resolved — delegated |
| AR-4 | Naming & terminology | The RD names fourteen documentation topics but not file names | One page per topic / a topic map over existing pages / merge topics | **One owning page per topic plus a `docs/README.md` topic map.** `docs/react-view.md` is split with a section-by-section migration map; `commands.md`, `interaction.md` and `accessibility.md` keep their topics. SSR and ESM-only move to `getting-started.md`. | ✅ Resolved — delegated |
| AR-5 | UX & presentation | What the README quickstart must contain | Link only / a complete copy-paste example / embed the getting-started guide | **One complete `tsx` block**: CSS import, static 14-month data, controlled selection and visibility, and a print button. The install note is honest: packages are unpublished, so the example points at the packed-tarball/consumer path until RD-12. | ✅ Resolved — delegated |
| AR-6 | Feature gaps | Which Storybook states are actually missing | Rebuild the story set / add only the RD-named gaps / accept the current set | **Add the PRT-01 2017-yellow print story, two design-system wrapper stories using `YearPlannerProvider` + token adapters, and named viewports.** Modifier-key behavior is documented and proven by the interaction E2E, not by a static story. No design-system dependency is added to Storybook. | ✅ Resolved — delegated |
| AR-7 | Technical unknowns | How Storybook builds under the `/<repo>/` base path | An absolute Vite base / keep Storybook's relative URLs / a post-build rewrite | **Keep Storybook 10's relative `./` URLs, which already work under any subpath.** No `STORYBOOK_BASE`; no manager rewrite. The artifact check resolves relative URLs on disk. | ✅ Resolved — delegated |
| AR-8 | Technical unknowns | How the GH Pages artifact is assembled | A shell script / a Node script / a Storybook-only build | **`scripts/build-docs-site.mjs`**: run `pnpm build`, build Storybook to the repo-root `storybook-static/`, build TypeDoc, copy `docs/api` to `storybook-static/api`, then verify. Supports `--root <dir>` and `--check-only`. | ✅ Resolved — delegated |
| AR-9 | Integration points | Which Pages actions and guards the workflow uses | No workflow / a deploy-on-push workflow / a build workflow plus a guarded manual deploy job | **A `pages` workflow**: build and upload on push to `main`; deploy only on `workflow_dispatch` with `deploy: true` and `refs/heads/main`; job-level `pages: write` and `id-token: write`; no hardcoded base path. A separate `docs-site` PR job in `ci.yml` builds and verifies the artifact. | ✅ Resolved — delegated |
| AR-10 | Non-functional gaps | How "every public export has TSDoc" is enforced | Manual review / API Extractor release tags plus a contract test / TypeDoc warnings only | **All three signals:** enable `ae-missing-release-tag`, remove every `(undocumented)` report entry, enable TypeDoc `validation.notDocumented` plus `treatValidationWarningsAsErrors`, and add a contract test. | ✅ Resolved — delegated |
| AR-11 | Technical unknowns | How the TSDoc contract reads the surface | Source AST / checked-in API reports / TypeDoc JSON | **Checked-in API reports for members and release tags**, plus a TypeScript-AST check that binds `@example` to the named export. The reports are the reviewed public surface. | ✅ Resolved — delegated |
| AR-12 | Naming & terminology | What "`@example` on public entry points" covers | Every export / main package entry points / components only | **The three missing entry points:** `YearPlanner`, `YearPlannerProvider` and `buildClassicYearLayout`. `createTheme` and `buildRibbonLayout` already have examples; they are verified, not rewritten. | ✅ Resolved — delegated |
| AR-13 | Data & state | Where the deferred-capability list lives | README section / `DEFERRED.md` at the root / roadmap only | **`DEFERRED.md` at the root**, one bullet per RD-11 deferred capability, linked from the README and `docs/limitations.md`. | ✅ Resolved — delegated |
| AR-14 | Security & compliance | How the docs stay honest about accessibility and performance | Repeat the RD-09/RD-10 evidence / claim conformance / omit status | **State the measured status and the known misses; make no conformance claim.** A short denylist covers positive conformance phrases; "targets WCAG 2.2 AA" and truthful negations stay allowed. The contract normalizes markdown emphasis before checking `Conformance claim: none`. | ✅ Resolved — inherited RD-09/RD-10 decisions |
| AR-15 | UX & presentation | Whether the demo needs a new page for the RD-11 states | New demo app / new route / visible navigation over the existing routes | **Keep the routes; render a shared navigation on every route and document the routes.** The security/hidden-data route joins the navigation because it is the visibility proof. No second demo app. | ✅ Resolved — delegated |
| AR-16 | Integration points | How RD-11 joins the traceability contract | Leave it for RD-12 / add rows now / waive | **Add RD-11-AC-01..13 rows, extend the test and the CLI default through RD-11, and annotate the existing demo E2E tests.** Rows start `partial` and become `proven` after the titles land. | ✅ Resolved — delegated |
| AR-17 | Technical unknowns | Where the documentation contract tests live | Seven files under `tests/quality/` / E2E only / a new runner | **Five spec files and two implementation files under `tests/quality/`**: docs, Storybook, TSDoc, docs-site and demo, plus docs-contract impl and docs-site impl. No new runner. | ✅ Resolved — delegated |
| AR-18 | Non-functional gaps | The manual NVDA/VoiceOver audit is still parked | Run it / keep it parked and state it / block RD-11 | **Keep it parked and name it in `docs/accessibility.md` and `docs/limitations.md`.** No WCAG conformance claim. | ✅ Resolved — inherited RD-09 decision |
| AR-19 | UX & presentation | Story counts in the docs drift from the real set | Hard-code a count / omit counts / compute and assert the count | **Compute the count and assert it in every document that states one:** `README.md`, `docs/getting-started.md` and `docs/test-report.md`. The current set is 171 stories across 12 files; PRT-01 and the wrapper stories raise it. | ✅ Resolved — delegated |
| AR-20 | Data & state | Whether the guides introduce new measurements | Re-run benchmarks / reuse the RD-10 evidence / omit numbers | **Reuse the checked-in RD-10 evidence.** No new measurement in a documentation milestone. | ✅ Resolved — delegated |
| AR-21 | Scope | Migration/versioning content | Versioned docs / a single migration page / omit | **One `docs/migration.md`** covering the pre-RD-06 preview migration and the semver/versioning policy. Versioned docs stay out of R1. | ✅ Resolved — inherited RD-11 scope |
| AR-22 | Integration points | How the API landing page is published | TypeDoc only / keep `docs/api-index.html` / write a new page | **Keep `docs/api-index.html`** as the `/api` landing page; the docs-site script copies it with the generated tree. | ✅ Resolved — delegated |
| AR-23 | Technical unknowns | RD-11 names `@storybook/addon-viewport`, but the package has no Storybook 10 release | Install 9.0.8 / downgrade Storybook / use the built-in viewport | **Use Storybook 10's built-in `storybook/viewport`** and configure named viewports in `preview.ts`. The RD addon list predates Storybook 10; record the deviation in the test report. No dependency is added. | ✅ Resolved — delegated |
| AR-24 | Integration points | Where the Storybook build writes and what the Pages workflow uploads | App-local `apps/storybook/storybook-static` / repo-root `storybook-static` / copy between them | **Build to the repo-root `storybook-static/`** with an explicit `-o ../../storybook-static`; the script, checks and workflow use that single path. | ✅ Resolved — delegated |
| AR-25 | Technical unknowns | How the docs contract sees the Storybook actual output without a build | Absolute prefix assertion / relative URL resolution / build inside the test | **Resolve relative `./` URLs on disk and keep the artifact assertions out of the pre-build Vitest project.** `pnpm docs:site` and the PR `docs-site` job own the real-artifact proof. | ✅ Resolved — delegated |
| AR-26 | UX & presentation | The quickstart cannot say `pnpm add` while packages are unpublished | Publish now / show the packed-tarball path / omit install | **Show the packed-tarball/consumer path and state that registry publication is pending RD-12.** AC7's "install" step is satisfied by the packed install; no false npm instruction. | ✅ Resolved — delegated |
| AR-27 | Feature gaps | The RD asks for Fluent/MUI wrappers; the token-adapter stories are not wrappers | Add design-system deps / add provider wrappers / accept the token stories | **Add two provider-wrapper stories** (`FluentWrapper`, `MuiWrapper`) that wrap the planner in `YearPlannerProvider` with adapter tokens. No design-system dependency is added to Storybook. | ✅ Resolved — delegated |
| AR-28 | Feature gaps | RD-11 Should Have asks for architecture diagrams | Skip / add a Mermaid diagram / generate images | **Add one checked-in Mermaid architecture diagram** to `docs/architecture.md` and link it from the guide index. | ✅ Resolved — delegated |
| AR-29 | Security & compliance | The docs security scan must not flag truthful security prose | Scan all text / scan fenced code only / allowlist the page | **Scan fenced code blocks only** for `dangerouslySetInnerHTML`, `innerHTML` and `__html`; use an explicit asset allowlist for generated Storybook/TypeDoc assets; assert `_reference/` is absent. | ✅ Resolved — delegated |
| AR-30 | Non-functional gaps | The task gate falls back to the full suite for `apps/**`, `scripts/**`, `package.json`, lockfiles, configs and API reports | Narrow the map / accept the full gate / claim a scoped run | **Accept the full gate at task level for Phases 2–5 and say so.** `--baseline <phase-tree>` keeps committed task changes in view; no map weakening. | ✅ Resolved — delegated |
| AR-31 | Ordering & sequencing | Phase 5 extends traceability before the RD-11 rows and titles exist | Extend last / use partial rows / tolerate a red task gate | **Add the rows as `partial` first, then annotate titles, then flip them to `proven`.** The checker skips title proof for partial rows, so every task gate stays honest. | ✅ Resolved — delegated |
| AR-32 | Technical unknowns (runtime) | The Phase 5 demo/report cases shared `docs-contract.spec.test.ts` with the Phase 1 guide cases, so the Phase 1 contract could never be green | Keep one file and tolerate red / split the Phase 5 cases / skip them until Phase 5 | **Split ST-24/25/27 into `tests/quality/demo-contract.spec.test.ts`, created in Phase 5.** The Phase 1 file then owns only the guide, deferred, honesty, count, asset and security cases and can verify green. | ✅ Resolved — delegated (runtime) |

## Resolution Notes

### Authority summary

- AR-1, AR-2, AR-14, AR-18 and AR-21 are **user-owned or inherited** scope, publication, honesty and scope-boundary decisions.
- AR-3 through AR-13, AR-15 through AR-17, AR-19, AR-20, AR-22 through AR-31 are **eligible technical decisions** inside the confirmed RD-11 scope. They create no product behavior change, public compatibility break, paid service or live publication.

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
  apps/storybook/.storybook/main.ts; apps/storybook/package.json; apps/storybook/stories/*.stories.tsx
  (171 stories); apps/demo/src/App.tsx; apps/demo/src/CommandsDemo.tsx;
  packages/core/etc/year-planner-core.api.md (55 undocumented entries: 52 members, two aliases
  and one const); packages/react/etc/react-year-planner.api.md (57 members);
  packages/*/api-extractor.json; typedoc.*.json; .github/workflows/ci.yml; package.json;
  pnpm-lock.yaml; codeops/test-map.json; installed storybook@10.6.6 (built-in ./viewport,
  relative asset URLs, builder-vite base "./"); typedoc@0.28.20 validation behavior
Rejected alternatives: named per row above
Strongest counterargument: the corrected plan adds a docs-site script, a PR CI job and six test
  files to a documentation milestone. The smaller alternative is to build Storybook and TypeDoc
  separately and check them manually, but RD-11 AC5/AC6 require a reproducible `/api` under the
  repo base path, and a broken artifact must not merge. The added surface reuses the existing
  toolchain and adds no runtime dependency.
Confidence: High — the plan now matches the installed Storybook/TypeDoc behavior; every
  remaining risk is a build or content check that the phase gates exercise
Hardening: preflight cluster fan-out (five independent auditors) found the viewport, artifact-path,
  package-build and pre-build-test contradictions; the fixes were re-checked against the installed
  packages and the existing scripts
Policy version: 1
Root invocation ID: rd11-documentation-2026-11-12
Reopen triggers: the user enables Pages before release; a guide needs a new runtime measurement;
  Storybook changes its relative asset behavior; TypeDoc cannot pass validation; the user changes
  the documentation scope or asks for guide pages on the public site
```
