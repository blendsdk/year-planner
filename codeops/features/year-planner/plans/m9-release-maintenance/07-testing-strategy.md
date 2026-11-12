# Testing Strategy: Release, Versioning and Maintenance

> **Document**: 07-testing-strategy.md
> **Parent**: [Index](00-index.md)

## Testing Overview

### Coverage Goals

| Code type | Target |
| --------- | ------ |
| Release metadata | Every package field, version, changelog and files entry |
| Tarball contents | Every packed path, the exact internal dependency and source-map paths |
| Workflows | Every trigger, permission, action pin, environment guard and secret |
| Release scripts | Version mismatch, missing changelog, forbidden path, integrity mismatch, dry run |
| Governance | Every required file, policy stage, required check and README link |
| Existing product code | Unchanged thresholds; no product behavior changes |

- Test names state behavior and repeat the `RD-12-AC-NN` ID where the test proves
  an acceptance criterion.
- Specification tests derive from RD-12 and the plan documents, never from the
  implementation.
- Real-release proofs (`release:publish --dry-run`, `release:check`) run as
  phase and CI commands, not inside the pre-build quality project.
- No production behavior is changed to make a test pass.

## Test Slices & Groups

`tests/quality/**` is owned by `quality.contracts` in `codeops/test-map.json`.
The new contract and implementation files need no map edit. `scripts/**`,
`package.json`, lockfiles, `.github/**` and `packages/*/package.json` are
full-on paths, so those task gates run `pnpm verify`. `docs/**` is an ignored
path in the map; the plan still runs `pnpm verify` because the contract tests
read the docs.

| Test File | Concern | Runs Before Build |
| --------- | ------- | ----------------- |
| `tests/quality/release-metadata.spec.test.ts` | Versions, metadata, changelogs | Yes |
| `tests/quality/release-workflow.spec.test.ts` | Workflows, OIDC, pinning, guards | Yes |
| `tests/quality/release-governance.spec.test.ts` | Governance, support, security, checklist | Yes |
| `tests/quality/release-pack.spec.test.ts` | Tarball and source-map rules with fixtures | Yes |
| `tests/quality/release-pack.impl.test.ts` | Shared-helper failure modes | Yes |
| `pnpm release:check` | The real built tarballs | No (after build) |
| `pnpm release:publish --dry-run` | The real build, pack and upload dry run | No |
| `pnpm release:smoke` | Registry install after publication | No |

## 🚨 Specification Test Cases (MANDATORY — NON-NEGOTIABLE)

> These cases derive from RD-12, the plan specs and the ambiguity register. They
> are the oracle. If an artifact does not match, the artifact is wrong.

### Versioning and packaging

| # | Input / Scenario | Expected Output / Behavior | Source |
|---|------------------|----------------------------|--------|
| ST-1 | `.changeset/config.json` | The fixed group contains both package names; `access` is `public`; `baseBranch` is `main` | RD-12 Must Have; AR-2 |
| ST-2 | Both package manifests | Versions are identical, start with `0.` and equal the changelog heading | RD-12 AC1; AR-2 |
| ST-3 | Both package changelogs | Each contains `## <version>` and at least one change entry | RD-12 Must Have; AR-13 |
| ST-4 | Both package manifests | `license`, `repository`, `homepage`, `bugs`, `publishConfig.access=public`, `sideEffects` and the expected `exports` are present and correct | RD-12 AC11; AR-13 |
| ST-5 | Both package manifests and directories | `files` contains `dist`, `README.md`, `LICENSE` and `CHANGELOG.md`; both READMEs and LICENSE copies exist and the LICENSE matches the root | RD-12 AC11; AR-13 |
| ST-6 | Synthetic pack output | Only `package.json`, `README.md`, `LICENSE`, `CHANGELOG.md` and `dist/**`; every required file present; no source, test, fixture, photo, `etc`, `temp`, `coverage` or `node_modules` path | RD-12 AC11; AR-15 |
| ST-7 | Packed React manifest | `@blendsdk/year-planner-core` equals the released core version exactly, not `workspace:*` or a range | RD-12 AC3; AR-5 |
| ST-8 | Every packed `.map` | No absolute path, home-directory path or `file://` URL; relative `../src/...` sources are allowed | RD-12 AC11; AR-15 |

### Release automation

| # | Input / Scenario | Expected Output / Behavior | Source |
|---|------------------|----------------------------|--------|
| ST-9 | `docs/releasing.md` | Documents the human release PR (`pnpm version-packages`, DCO sign-off, CI) and does not reference `changesets/action` | RD-12 Should Have; AR-3 |
| ST-10 | `.github/workflows/release.yml` | `workflow_dispatch`; `main`-only guard on verify/build/publish; `npm-production` environment; separate build, publish and smoke jobs; publish input default false | RD-12 AC2, AC13; AR-23 |
| ST-11 | `.github/workflows/release.yml` | Job-scoped `contents: write`, `id-token: write`, `actions: write`; no `secrets.*`, `NPM_TOKEN`, `NODE_AUTH_TOKEN` or `.npmrc`; publish job installs nothing | RD-12 AC2, AC13; AR-23 |
| ST-12 | `scripts/release-publish.mjs` | Publishes core before React; `npm publish` with `--provenance`; compares `npm view dist.integrity` before skipping; supports `--dry-run`, `--packs`, `--bootstrap`; rejects `--allow-dirty` without `--dry-run` and `--skip-github-release` without `--bootstrap` | RD-12 AC2, AC3; AR-5, AR-24 |
| ST-13 | Release notes builder | One `v<version>` tag; body contains both changelog headings and links to both npm packages and `https://blendsdk.github.io/year-planner/` | RD-12 AC5; AR-6 |
| ST-14 | Every workflow `uses:` | Matches `owner/repo@<40-hex-commit-sha>` with a version comment; no tag, branch or annotated tag object SHA | RD-12 AC11; AR-19 |
| ST-15 | `.github/workflows/ci.yml` | A `changeset` job uses `fetch-depth: 0`, `continue-on-error: true` and `changeset status --since=origin/main` | RD-12 Should Have; AR-10 |
| ST-16 | `docs/releasing.md` and `scripts/release-publish.mjs` | Documents the npm bootstrap, `npm login`, trusted-publisher fields, the two-day window and the `0.2.1` provenance release; `--bootstrap` publishes without provenance | RD-12 AC2; AR-4 |
| ST-17 | `scripts/clean-consumer.sh` and `package.json` | `--registry` installs the exact versions from npm, retries propagation, typechecks and builds; `release:smoke` exists | RD-12 AC4, Should Have; AR-12 |

### Governance and evidence

| # | Input / Scenario | Expected Output / Behavior | Source |
|---|------------------|----------------------------|--------|
| ST-18 | `.github/CODEOWNERS` | Catch-all owner plus package, workflow, changeset, security and release-checklist paths; every path exists | RD-12 AC7; AR-18 |
| ST-19 | `SUPPORT.md` | Best-effort support, no SLA, issue path, security path, current `0.x` line and no commercial tier | RD-12 AC8; AR-16 |
| ST-20 | `SECURITY.md` | Supported versions, private reporting, acknowledgement, triage, coordinated disclosure and dependency updates; checklist names the enable commands | RD-12 Must Have; AR-17 |
| ST-21 | `docs/releasing.md` | Checklist includes `pnpm verify:full`, API report, docs build, Storybook build, print sample, browser/React matrix, changelog, provenance, `npm pack --dry-run` review, `DEFERRED.md`/README review and the renderer ADR | RD-12 AC9; AR-20 |
| ST-22 | `docs/releasing.md` | Visibility/license section: owner review, private reporting, Dependabot alerts, Pages, `npm-production`, trusted publisher, branch protection, and no unpublished reference-image material | RD-12 AC10; AR-9, AR-27 |
| ST-23 | `scripts/apply-branch-protection.mjs` | `--check`/`--apply`; required checks `verify`, `browsers`, `docs-site`, `dco`, `security`; one review; no force push or deletion; 403 and second-reviewer prerequisites | RD-12 AC6; AR-8 |
| ST-24 | `README.md`, `CONTRIBUTING.md` | Link CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, SUPPORT, the release checklist, the issue chooser and the PR template; the issue/PR templates exist | RD-12 AC7; AR-16 |
| ST-25 | `.github/dependabot.yml` and `docs/releasing.md` | Weekly npm and GitHub Actions updates; grouped minor/patch; major separate; security alerts enable command | RD-12 Should Have; AR-11 |
| ST-26 | `00-traceability.md`, checker and CLI | Thirteen RD-12 rows; checker and CLI default through RD-12; `expected` length 183 | Project traceability contract; AR-22, AR-29 |
| ST-27 | `docs/releasing.md` and `package.json` | The release checklist and `test:audit` script prove `pnpm audit --audit-level high`; no high/critical advisory blocks release | RD-12 AC12; AR-20 |
| ST-28 | `scripts/lib/release-manifest.mjs` | Public helper functions have TSDoc and unit tests; no dead or duplicated pack logic | Coding standards; AR-30 |

## Test Categories

### Specification Tests

| Test File | ST Cases Covered | Component |
| --------- | ---------------- | --------- |
| `tests/quality/release-metadata.spec.test.ts` | ST-1–ST-5 | Version, metadata, changelog |
| `tests/quality/release-workflow.spec.test.ts` | ST-9–ST-17 | Workflows, OIDC, pinning, bootstrap, registry smoke |
| `tests/quality/release-governance.spec.test.ts` | ST-18–ST-25, ST-27 | Governance, support, checklist |
| `tests/quality/release-pack.spec.test.ts` | ST-6–ST-8 | Tarball and source-map oracle |
| `tests/quality/traceability.spec.test.ts` | ST-26 | Traceability |

### Phase and CI proofs (not Vitest)

| Command | ST Cases | When |
| ------- | -------- | ---- |
| `pnpm release:publish --dry-run --allow-dirty` | ST-12, ST-6–ST-8 on real tarballs | Phase 4 and the release dry run |
| `pnpm release:check` | ST-2–ST-8, ST-14 | `pnpm verify` and the release build job |
| `pnpm release:smoke` | ST-17 | After a release |
| `node scripts/apply-branch-protection.mjs --record` | ST-23 | Phase 3 evidence |
| `node scripts/apply-branch-protection.mjs --check` | ST-23 | After going public |
| `pnpm test:audit` | ST-27 | `verify:full` and the CI security job |

### Implementation Tests

| Test File | Description | Priority |
| --------- | ----------- | -------- |
| `tests/quality/release-pack.impl.test.ts` | Shared helpers (ST-28): forbidden path, workspace dependency, private map path, version mismatch, integrity mismatch, flag guards | High |
| `tests/quality/traceability.impl.test.ts` | Existing matrix cases; partial-row blank-title behavior | Medium |

### End-to-End Tests

No browser test is added. The release path is verified by scripts and static
contracts; the existing browser and consumer suites remain the product proof.

## Test Data

### Fixtures Needed

- Temporary pack directories and synthetic tarballs for the implementation
  tests; no checked-in binary fixture.
- The five pending changesets become the real `0.2.0` changelog input.

### Mock Requirements

`gh` and `npm` are never invoked by the contract tests. The implementation
tests pass fixture files or fake command runners, so no network or registry
account is required.

## Verification Checklist

- [ ] All ST cases defined with concrete input/output pairs
- [ ] Every ST case traces to a requirement, spec doc or AR entry
- [ ] Specification tests written BEFORE implementation
- [ ] Specification tests verified to FAIL before implementation
- [ ] All specification tests pass after implementation
- [ ] Implementation tests cover the pack and flag failure modes
- [ ] `pnpm verify` passes per phase; `pnpm verify:full` passes at plan completion
- [ ] `pnpm release:publish --dry-run --allow-dirty` completes without uploading
- [ ] No regressions in the existing suites
