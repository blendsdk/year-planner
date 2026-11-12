# Preflight Report: Release, Versioning and Maintenance

> **Status**: ✅ PREFLIGHT PASSED WITH NOTES — 31 findings resolved, 3 accepted notes
> **Iteration**: 2 (re-scan after fixes)
> **Artifact**: Implementation plan at `codeops/features/year-planner/plans/m9-release-maintenance/` (9 documents)
> **Codebase Grounded**: RD-12, package manifests, Changesets config and pending changesets, workflows, scripts, governance files, live GitHub API settings and npm CLI behavior
> **Last Updated**: 2026-11-12 20:35

> **SAME-SESSION REVIEW:** This plan was created in the current session. Two
> independent auditors re-checked the load-bearing claims against the repository,
> installed tools, live GitHub API and npm documentation. Consider a fresh-session
> review before the actual publication.

## Audit scope

| Item | Value |
| ---- | ----- |
| Audit target | `codeops/features/year-planner/plans/m9-release-maintenance/` (9 files) |
| Context documents | RD-12, `00-traceability.md`, `.changeset/**`, `packages/*/package.json`, `.github/**`, `scripts/**`, `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, `docs/migration.md`, `docs/renderer-spike.md`, `docs/adr/0001-renderer-strategy.md`, `codeops/test-map.json`, `AGENTS.md` |
| Modification set | The 9 plan documents only |
| Scope mode | Strict |
| Original goal | Make the first public release reproducible, lockstep, provenance-signed and maintainable |
| Smallest viable design | Keep Changesets, pnpm pack and the existing CI; add a human release PR, one manual release workflow, one shared validation module, governance documents and a release checklist |

## Codebase Context Summary

**Tech Stack:** ESM-only pnpm monorepo, TypeScript 6, React 19, Vite 7, Vitest 4,
Playwright 1.65, Biome 2.6.6, Changesets 3.0.3, Node 24, pnpm 12.9.1, npm
11.19.0. **Architecture:** two public packages, private demo and Storybook,
quality contracts under `tests/quality`, GitHub Actions CI/Pages. **Verified
constraints:** repository private; branch protection HTTP 403; no
`npm-production` environment; `can_approve_pull_request_reviews` false; private
vulnerability reporting 404; Dependabot alerts disabled; `npm whoami` 401;
`changeset version` produces `0.2.0`; `pnpm pack` rewrites `workspace:*` to
`0.2.0`; five pending changesets.

## Summary by Severity

| Severity | Count | Status |
| -------- | ----- | ------ |
| CRITICAL | 3 | All resolved |
| MAJOR | 14 | All resolved |
| MINOR | 11 | All resolved |
| OBSERVATION | 3 | Accepted |

## Findings

### PF-001: `changesets/action` cannot open a working release PR [CRITICAL]

**Dimension:** Feasibility / Codebase Alignment
**Location:** original `03-02` version workflow; AR-3
**Evidence:** `gh api repos/blendsdk/year-planner/actions/permissions/workflow` returns `can_approve_pull_request_reviews: false`; a PR created by `GITHUB_TOKEN` does not trigger `pull_request` workflows; the action's commit has no DCO sign-off.
**Problem:** The release PR could not be created, would not run CI, and would fail the DCO check.
**Resolution:** Replace the action with a human release PR (`pnpm version-packages`, DCO sign-off, normal CI). AR-3 updated; all `version.yml` references removed.

### PF-002: `npm-production` does not exist, so the approval gate is false [CRITICAL]

**Dimension:** Security / Codebase Alignment
**Location:** `03-02` release workflow; AR-23, AR-27
**Evidence:** `gh api repos/blendsdk/year-planner/environments` returns `total_count: 0`. GitHub auto-creates an unprotected environment on first use.
**Problem:** The publish job could run without a human approval.
**Resolution:** The plan no longer assumes the environment exists; `03-03` and `docs/releasing.md` own the exact setup step with required reviewers and a `main` branch policy. Phase 4 records the absent state.

### PF-003: Branch protection would lock out the only maintainer [CRITICAL]

**Dimension:** Feasibility / Security
**Location:** `03-03` protection settings; AR-8
**Evidence:** CODEOWNERS is `* @blendsdk`; GitHub does not allow self-approval; `enforce_admins: true` removes the bypass.
**Problem:** Every PR would be unmergeable.
**Resolution:** The script requires a second eligible reviewer before applying; the release checklist records the prerequisite. Check mode reports it.

### PF-004: The release workflow had no `main` guard [MAJOR]

**Dimension:** Security / Edge Cases
**Location:** `03-02` workflow; ST-10
**Evidence:** `workflow_dispatch` can target any ref.
**Resolution:** Verify, build and publish jobs require `refs/heads/main`; ST-10 asserts it.

### PF-005: `gh release` had no token in the publish job [MAJOR]

**Dimension:** Feasibility
**Location:** `03-02` workflow
**Evidence:** `GITHUB_TOKEN` is not exported as an environment variable; the docs-dispatch step had it, the publish step did not.
**Resolution:** `GH_TOKEN: ${{ github.token }}` is set on the publish and docs-dispatch steps; the bootstrap guide adds `gh auth login`.

### PF-006: The release verify job could not run `verify:full` [MAJOR]

**Dimension:** Feasibility
**Location:** `03-02` verify job
**Evidence:** `verify:full` runs Playwright print/browser tests and needs `poppler-utils`; a fresh runner has neither.
**Resolution:** The verify job installs `poppler-utils` and `npx playwright install --with-deps chromium firefox webkit`.

### PF-007: AC-12 had no proving case; ST-16 had no owner; `release:smoke` was never added [MAJOR]

**Dimension:** Completeness / Testability
**Location:** `07` ST table; `99` Phase 2/3
**Resolution:** ST-27 proves the audit gate; ST-17 owns the registry smoke; task 2.2.4 adds `release:smoke`; task 3.1.1 writes the audit case.

### PF-008: Phase 2/3 gates depended on later phases [MAJOR]

**Dimension:** Ordering & Sequencing
**Location:** `99` phases; `07` ST table
**Evidence:** ST-15 (Dependabot) was Phase 3, ST-24 (traceability) was Phase 5, but the earlier phase gates claimed them.
**Resolution:** ST numbering and phase ownership realigned: Phase 2 owns ST-9–ST-17, Phase 3 owns ST-18–ST-25 and ST-27, Phase 5 owns ST-26.

### PF-009: Pack spec cases were pre-build and in an implementation file [MAJOR]

**Dimension:** Testability / Ordering
**Location:** `07`; `99` Phase 1
**Evidence:** `vitest.quality.config.ts` runs before the build; `release-pack.impl.test.ts` was assigned requirement-derived ST-6–ST-8 and depended on a Phase 2 script.
**Resolution:** Added `release-pack.spec.test.ts` with synthetic fixtures; `release-pack.impl.test.ts` covers helper failure modes; the real tarball proof is `release:check` after the build in Phase 4.

### PF-010: First release had no provenance and left an unvalidated trusted publisher [MAJOR]

**Dimension:** Security / Edge Cases
**Location:** `03-02` bootstrap; AR-4
**Evidence:** npm cannot configure a trusted publisher for a non-existent package; a new configuration expires after two days without a successful publish.
**Resolution:** `0.2.0` is an explicit manual bootstrap; the maintainer configures the publisher and publishes `0.2.1` through OIDC within the window. `0.2.1` is the first announced release.

### PF-011: The first release bypassed the release-PR flow [MAJOR]

**Dimension:** Ordering / Consistency
**Location:** `99` Phase 1; AR-28
**Resolution:** Recorded: `0.2.0` is committed in this milestone; the human release-PR procedure applies from `0.2.1`.

### PF-012: The `changeset status` job lacked a base ref and an informational mechanism [MAJOR]

**Dimension:** Feasibility
**Location:** `03-03`; ST-15
**Resolution:** The job uses `fetch-depth: 0` and `continue-on-error: true`.

### PF-013: The visibility checklist contained a literal that fails the docs contract [MAJOR]

**Dimension:** Codebase Alignment
**Location:** original `03-03` visibility sequence
**Evidence:** `tests/quality/docs-contract.spec.test.ts` rejects `_reference/` in any `docs/**` file.
**Resolution:** Reworded to "unpublished reference-image material"; no literal path in `docs/releasing.md`.

### PF-014: The plan counted six changesets, but five exist; CODEOWNERS and SemVer already exist [MAJOR]

**Dimension:** Codebase Alignment
**Location:** `00-index`, `01`, `02`, `03-01`, `07`
**Resolution:** Count corrected to five (four minor, one patch); CODEOWNERS task is "extend"; the migration task is the `0.2.0` first-release delta.

### PF-015: An action pin was an annotated tag object SHA, not a commit SHA [MAJOR]

**Dimension:** Security / Codebase Alignment
**Location:** `02-current-state`; AR-19
**Evidence:** `pnpm/action-setup@v4` ref `f40ff…` is an annotated tag; the commit is `b906aff…`. The `changesets/action` pin is removed.
**Resolution:** Commit SHA recorded; ST-14 asserts a 40-hex commit with a version comment.

### PF-016: Test-map claims were wrong [MAJOR]

**Dimension:** Codebase Alignment
**Location:** `07`, `99`
**Evidence:** `docs/**` is in `ignorePaths`, not `fullOnPaths`; `tests/quality/**` is owned by `quality.contracts`.
**Resolution:** Plan text now describes the selector behavior accurately; no map edit.

### PF-017: Phase gates contradicted each other (`verify` vs `verify:full`) [MAJOR]

**Dimension:** Consistency
**Location:** `07`, `99`
**Resolution:** All phase gates use `pnpm verify`; the plan gate is `pnpm verify:full`, matching the documented ladder.

### PF-018: The publish job ran install/build with release credentials [MAJOR]

**Dimension:** Security
**Location:** `03-02` workflow; AR-23
**Resolution:** Split jobs: credential-free build/pack, then an environment-guarded publish that installs nothing and uploads the downloaded tarballs.

### PF-019: `release:check` and `release:publish` duplicated pack logic [MAJOR]

**Dimension:** Maintainability
**Location:** `03-01`, `03-02`
**Resolution:** Shared `scripts/lib/release-manifest.mjs` with unit-tested helpers; both scripts are thin wrappers.

### PF-020: `npm pack --dry-run` and `pnpm pack` disagreed on LICENSE [MAJOR]

**Dimension:** Data & state / Compliance
**Location:** `03-01`; ST-5, ST-6
**Resolution:** Checked-in `packages/*/LICENSE` copies; `release:check` also runs `npm pack --dry-run --json`.

### PF-021: `THIRD_PARTY_NOTICES.md` was dropped from `files` without a recorded deviation [MINOR]

**Dimension:** Compliance
**Location:** `03-01`; AR-14
**Resolution:** Explicit deviation: no bundled third-party runtime code; notices stay at the repository root.

### PF-022: Source-map wording forbade every relative source [MINOR]

**Dimension:** Consistency
**Location:** AR-15; `03-01`; ST-8
**Resolution:** Relative `../src/...` sources are allowed; only absolute, home-directory and `file://` paths are forbidden.

### PF-023: `--allow-dirty` and `--skip-github-release` were unguarded [MINOR]

**Dimension:** Edge Cases
**Location:** `03-02` flags; ST-12
**Resolution:** `--allow-dirty` requires `--dry-run`; `--skip-github-release` requires `--bootstrap`; the impl tests cover both.

### PF-024: The `ci-contract` report expectations would break in Phase 5 [MINOR]

**Dimension:** Test Impact
**Location:** `99` task 5.2.1
**Evidence:** `tests/quality/ci-contract.spec.test.ts` hard-codes the quality count and the RD-10 verdict.
**Resolution:** Task 5.2.1 updates the report and the contract expectations together.

### PF-025: The security review was scheduled after the release surface was built [MINOR]

**Dimension:** Ordering
**Location:** `00-index` specialist table
**Resolution:** The security auditor reviews Phase 2 and re-checks Phase 3.

### PF-026: Partial traceability rows were underspecified [MINOR]

**Dimension:** Data & state / Traceability
**Location:** AR-29; `99` task 5.1.1
**Evidence:** The checker skips title proof only when the title cell is blank.
**Resolution:** Partial rows use `partial` with blank proving file/title and an evidence cell; task 5.1.1 names the format; the expected count becomes 183.

### PF-027: Post-release README status and docs URL were undefined [MINOR]

**Dimension:** Completeness
**Location:** `03-03` checklist; `03-02` release notes
**Resolution:** Post-release updates README/docs status; the docs URL is `https://blendsdk.github.io/year-planner/`.

### PF-028: Private reporting and Dependabot alerts are disabled [MINOR]

**Dimension:** Security
**Location:** `03-03`; AR-27
**Evidence:** private-vulnerability-reporting 404; vulnerability-alerts disabled.
**Resolution:** Exact enable commands added to the visibility/setup checklist.

### PF-029: One contract file mixed three concerns [MINOR]

**Dimension:** Maintainability
**Location:** `07`; AR-30
**Resolution:** Split into `release-metadata`, `release-workflow` and `release-governance` spec files.

### PF-030: Release tags could differ from the release commit [MINOR]

**Dimension:** Edge Cases
**Location:** `03-02`; AR-24
**Resolution:** An existing release is updated only when its tag commit matches `HEAD`.

### PF-031: `release:check` output path was not specified [MINOR]

**Dimension:** Feasibility
**Location:** `03-02` workflow
**Resolution:** `release:check` writes validated tarballs to `release-packs/`; the build job uploads that directory.

## Accepted notes

| # | Note | Owner / revisit |
|---|------|-----------------|
| PF-N1 | No live npm publication or repository visibility change in this environment. The bootstrap, trusted publisher, environment, Pages and branch protection are owner actions. | User; run `docs/releasing.md` at release |
| PF-N2 | The first bootstrap `0.2.0` has no provenance; `0.2.1` is the first provenance-signed release. This is an npm registry constraint, not a design choice. | User; publish `0.2.1` within two days |
| PF-N3 | The environment's `/tmp` quota can fail a pack; the execution uses `CODEOPS_TMPDIR`/`TMPDIR` on a filesystem with space. | Executor; Phase 4 evidence records the path |

## Iteration 2 verification

| Check | Result |
| ----- | ------ |
| Plan file and link integrity | 10 files; every relative link resolves |
| Numbered task count | 55, matching the phase table (13+15+13+7+7) |
| Register gate | `✅ GATE PASSED — 30 resolved, 0 open` |
| Version/pack claims | `changeset version` → `0.2.0`; `pnpm pack` → exact `0.2.0` dependency |
| npm bootstrap claim | Confirmed by `npm help trust` and the registry 404s |
| Branch protection / environment / reporting constraints | Confirmed against the live GitHub API |
| Action pins | Every pin is a commit SHA; `pnpm/action-setup` resolves to `b906aff…` |
| Workflow design | Main guard, environment, split build/publish, no secrets, no install in publish |
| Test inventory | Four new spec files plus one impl file; ST-1–ST-28 mapped |
| Traceability plan | Partial-row format, 183 expected, checker/CLI through 12 |

**Verdict:** ✅ PASSED WITH NOTES — every critical/major finding is resolved in
the plan; the three notes are release-operation constraints recorded in the
register and the release guide.
