# Current State: Release, Versioning and Maintenance

> **Document**: 02-current-state.md
> **Parent**: [Index](00-index.md)

## Existing Implementation

### What Exists

- A pnpm workspace with two public packages at `0.1.0` and a private root,
  demo and Storybook app.
- A Changesets `fixed` group for both packages, public access, `main` base
  branch and five pending changesets (four minor requests and one patch)
  covering RD-06 through RD-09.
- Full package validation: `publint`, `attw --profile esm-only`, TypeScript
  declarations, API reports, size budgets and the packed consumer check.
- CI with verify, browser, docs-site, DCO, security and performance jobs.
- A manual Pages workflow with OIDC deployment and a `main`-only guard.
- `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, a short `SECURITY.md`, issue and PR
  templates, a catch-all `.github/CODEOWNERS`, MIT `LICENSE` and generated
  `THIRD_PARTY_NOTICES.md`.
- `docs/migration.md` with SemVer and deprecation guidance;
  `docs/renderer-spike.md` and the renderer ADR required by the release
  checklist.
- `scripts/clean-consumer.sh`, which packs both packages and proves types, CSS
  and a production Vite build from tarballs.

### Relevant Files

| File | Purpose | Changes Needed |
| ---- | ------- | -------------- |
| `.changeset/config.json` | Fixed group and access | Keep; contract asserts the fixed group |
| `.changeset/*.md` | Five pending release notes | Consumed by `changeset version` |
| `packages/core/package.json`, `packages/react/package.json` | Versions and metadata | Bump to `0.2.0`; add homepage, bugs, publishConfig, changelog/README to `files` |
| `packages/*/CHANGELOG.md` | Package changelogs | New (generated) |
| `packages/*/README.md` | Package landing pages | New |
| `scripts/release-publish.mjs`, `.d.mts` | Pack, validate, publish, release | New |
| `scripts/release-check.mjs`, `.d.mts` | Release readiness gate | New |
| `scripts/apply-branch-protection.mjs`, `.d.mts` | Protection apply/check | New |
| `scripts/clean-consumer.sh` | Consumer proof | Add `--registry` |
| `.github/workflows/release.yml` | Manual publish | New |
| `.github/workflows/ci.yml` | CI | Pin actions; add `changeset` job |
| `.github/workflows/pages.yml` | Docs deploy | Pin actions |
| `.github/CODEOWNERS` | Review ownership | Extend the existing catch-all |
| `.github/dependabot.yml` | Dependency updates | New |
| `SUPPORT.md` | Support policy | New |
| `SECURITY.md` | Response process | Expand |
| `docs/releasing.md` | Release checklist | New |
| `docs/migration.md` | SemVer/deprecation | Add the `0.2.0` first-release note |
| `README.md`, `CONTRIBUTING.md` | Community links | Add release/support links |
| `tests/quality/release-metadata.spec.test.ts`, `release-workflow.spec.test.ts`, `release-governance.spec.test.ts` | Static contracts | New |
| `tests/quality/release-pack.spec.test.ts`, `release-pack.impl.test.ts` | Pack/source-map oracle and helper cases | New |

### Code Analysis

**Versions and changesets.** Both packages are `0.1.0`. Five changesets are
pending: `accessible-planner.md`, `fix-grid-text-selection.md`,
`rd06-react-view.md`, `rd07-interaction.md` and `rd08-command-lifecycle.md`
(four minor requests and one patch). `changeset status` reports a minor bump
for both packages. A probe run of `changeset version` produced `0.2.0` for both
and generated `CHANGELOG.md` in each package. The fixed group works.

**Packaging.** `pnpm pack` rewrites the React package's
`"@blendsdk/year-planner-core": "workspace:*"` to the exact matching version
(`0.2.0` in the probe). The current tarball contains `dist`, `package.json`,
declarations and source maps; it does not contain a README or changelog because
those files do not exist. `pnpm pack` injects the root LICENSE; `npm pack
--dry-run` reports 85 entries for core and no LICENSE because there is no
package-level copy. The plan adds a checked-in `packages/*/LICENSE` so both
packers agree.

**npm authentication.** `npm whoami` returns 401 in this environment. npm
11.19.0 is installed, which supports OIDC trusted publishing and
`npm publish --provenance`. Trusted publishing cannot be configured for a
package that does not exist, so the first publish of each package must be a
manual authenticated action; all later publishes can use OIDC.

**Release automation.** There is no version or release workflow. CI actions are
referenced by tags (`actions/checkout@v4`, `pnpm/action-setup@v4`, and so on),
not full commit SHAs. There is no `changeset status` job and no Dependabot
configuration. The repository setting
`can_approve_pull_request_reviews` is `false`, so a `changesets/action` release
PR could not be created; a PR created by `GITHUB_TOKEN` would not trigger CI.
The repository has no `npm-production` environment.

**Governance.** `SECURITY.md` has supported-versions, private-reporting and
scope sections, but no triage or coordinated-disclosure steps. `.github/CODEOWNERS`
exists with a catch-all owner. There is no `SUPPORT.md`, no release checklist
and no README link to the security or conduct policies. Private vulnerability
reporting returns 404 and Dependabot security alerts are disabled. The
repository is private and `main` has no branch protection; the GitHub API
returns HTTP 403 because the current plan cannot protect branches on a private
repository. A single code owner cannot approve their own PR, so a second
reviewer is a protection prerequisite.

**Docs and assets.** `docs/renderer-spike.md` and
`docs/adr/0001-renderer-strategy.md` exist and are linked from the
documentation index. No photo or `_reference/` material is present; the docs
contract asserts this.

**Actions resolved for pinning.** `actions/checkout@v4`
`11d5960a326750d5838078e36cf38b85af677262`, `actions/setup-node@v4`
`49933ea5288caeca8642d1e84afbd3f7d6820020`, `actions/upload-artifact@v4`
`ea165f8d65b6e75b540449e92b4886f43607fa02`,
`actions/upload-pages-artifact@v3`
`56afc609e74202658d3ffba0e8f6dda462b719fa`,
`actions/configure-pages@v5`
`983d7736d9b0ae728b81ab479565c72886d7745b`,
`actions/deploy-pages@v4`
`d6db90164ac5ed86f2b6aed7e0febac5b3c0c03e`, and `pnpm/action-setup@v4`
commit `b906affcce14559ad1aafd4ab0e942779e9f58b1` (the tag ref is an annotated
tag object; the commit SHA is used). No `changesets/action` is used.

## Gaps Identified

### Gap 1: The first release has no version or changelog

**Current Behavior:** Both packages are `0.1.0`; five changesets are pending;
no package changelog exists.
**Required Behavior:** Both packages at `0.2.0`, with a changelog per package
and a documented SemVer policy.
**Fix Required:** Run `changeset version`, commit the generated changelogs and
extend the version policy.

### Gap 2: Package metadata is incomplete

**Current Behavior:** No `homepage`, `bugs`, `publishConfig` or changelog in
`files`; no package README or package LICENSE.
**Required Behavior:** Correct repository/homepage/bugs/license/exports/access
metadata and an allowlisted tarball.
**Fix Required:** Update both manifests and add short package READMEs.

### Gap 3: No guarded release workflow

**Current Behavior:** Nothing versions or publishes; actions are tag-pinned.
**Required Behavior:** A human release PR procedure, a manual
environment-guarded publish workflow, OIDC provenance, core-before-React order
and a GitHub release.
**Fix Required:** Add the release procedure to `docs/releasing.md`, add
`release.yml`, the publish/check scripts; pin every action.

### Gap 4: No release readiness gate

**Current Behavior:** `verify` proves code quality but not release metadata,
changelog presence, tarball contents or provenance wiring.
**Required Behavior:** A repeatable `release:check` and contract tests.
**Fix Required:** Add the check script, contract tests and a `verify` hook.

### Gap 5: Governance and support are incomplete

**Current Behavior:** A catch-all CODEOWNERS, but no support policy or release
checklist; the security process stops at reporting; private reporting and
Dependabot alerts are disabled.
**Required Behavior:** Path-specific CODEOWNERS, `SUPPORT.md`, an expanded
`SECURITY.md`, a release checklist, owner setup commands and README/CONTRIBUTING
links.
**Fix Required:** Extend the documents and links.

### Gap 6: Branch protection cannot be applied yet

**Current Behavior:** The repository is private; the branch-protection API
returns HTTP 403 on the current GitHub plan.
**Required Behavior:** Required CI, DCO and review on `main`, no direct pushes,
applied after the repository becomes public and a second reviewer exists.
**Fix Required:** Add an idempotent apply/check script and document the
release-time step and reviewer prerequisite.

## Dependencies

### Internal Dependencies

- RD-01 through RD-11: CI, package metadata, API reports, docs site, release
  evidence and traceability.
- The five pending changesets and the Changesets fixed group.
- The existing consumer, Pages and quality-test infrastructure.

### External Dependencies

- npm 11.19.0+ for OIDC provenance; Node 24 in the release workflow.
- GitHub Actions and the `npm-production` environment.
- `gh` CLI for branch protection and release creation.
- The npm registry account and package ownership (maintainer-owned).

## Risks and Concerns

| Risk | Likelihood | Impact | Mitigation |
| ---- | ---------- | ------ | ---------- |
| First publish cannot use OIDC because the packages do not exist | High | High | Manual bootstrap from the maintainer CLI, then trusted publishing (AR-4) |
| `workspace:*` leaks into the published manifest | Med | High | Pack with pnpm and assert the tarball dependency equals the core version |
| A release workflow publishes before approval | Low | High | Manual dispatch plus the `npm-production` required-reviewer environment |
| A private repo cannot enable branch protection | High | Med | Script plus a documented apply step after going public (AR-8) |
| Source maps expose absolute build paths | Low | Med | `release:check` scans every map for absolute/private paths |
| Action tags move under a release | Med | High | Pin every action to a full commit SHA and contract-test it |
| First release notes omit a package | Med | Low | Generate release notes from both changelogs and assert both headings |
