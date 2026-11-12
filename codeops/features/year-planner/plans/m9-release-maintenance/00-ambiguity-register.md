# Ambiguity Register: Release, Versioning and Maintenance

> **Status**: ✅ GATE PASSED — 30 resolved, 0 open
> **Last Updated**: 2026-11-12 20:20
> **Policy**: `--auto-design` active — eligible technical decisions delegated; publication timing, repository visibility, branch protection application and the actual npm publish are user-owned release actions

| # | Category | Ambiguity / Gap | Options Presented | Decision | Status |
|---|----------|-----------------|-------------------|----------|--------|
| AR-1 | Scope | Which roadmap items this plan covers | RD-12 only / RD-12 plus issue #4 / RD-12 plus a new feature | **RD-12 only.** Issue #4 and any product change stay out. The live npm publication, repository visibility change and branch-protection application are release operations, not implementation scope. | ✅ Resolved — user milestone directive |
| AR-2 | Data & state | Which version the first public release uses | Keep `0.1.0` / let Changesets compute `0.2.0` / reset to `0.0.0` | **`0.2.0`.** Five pending changesets (four minor, one patch) aggregate to a minor bump; `changeset version` bumps both packages lockstep to `0.2.0`. | ✅ Resolved — delegated |
| AR-3 | Technical unknowns | How versioning is triggered | `changesets/action` release PR / a human release PR plus a manual release workflow / local publishing only | **A human release PR plus a manual release workflow.** GitHub Actions cannot create/approve PRs on this private plan, and a `GITHUB_TOKEN` PR would not trigger CI. The maintainer runs `pnpm version-packages`, opens a normal PR so DCO/CI run, merges, then dispatches `release.yml`. No `changesets/action` dependency. | ✅ Resolved — delegated |
| AR-4 | Security & compliance | npm cannot configure trusted publishing for a package that does not exist | One-shot `NPM_TOKEN` secret / manual first publish from an authenticated maintainer CLI / skip trusted publishing | **Manual bootstrap via `npm login` + MFA, then configure the trusted publisher, then immediately publish `0.2.1` through OIDC within the two-day validation window.** No token is stored in GitHub. The bootstrap `0.2.0` carries no provenance; `0.2.1` is the first announced, provenance-signed release. | ✅ Resolved — delegated (npm registry constraint) |
| AR-5 | Technical unknowns | How the tarball gets an exact core dependency and provenance | `pnpm publish --provenance` / `npm publish` from the workspace / `pnpm pack` then `npm publish <tarball> --provenance` | **`pnpm pack` then `npm publish <tarball> --provenance`.** Packing rewrites `workspace:*` to the exact core version; npm supplies the OIDC provenance attestation. | ✅ Resolved — delegated |
| AR-6 | Naming & terminology | Tag and release naming for a lockstep release | Per-package tags / one `v<version>` tag / no tag | **One `v<version>` tag and one GitHub release**, with notes that link both npm packages, the changelogs and `https://blendsdk.github.io/year-planner/`. | ✅ Resolved — delegated |
| AR-7 | Integration points | Whether the release also deploys the docs site | Separate manual step / dispatch the Pages workflow from the release workflow / skip | **Dispatch `pages.yml` with `deploy: true`** after a successful publish, guarded by a `deploy-docs` input and `continue-on-error`; the Pages workflow remains the single deployment path. | ✅ Resolved — delegated |
| AR-8 | Technical unknowns | Branch protection cannot be configured while private; a single code owner cannot approve their own PR | Document only / an idempotent script plus a release-time apply step / apply now / relax review | **An idempotent `scripts/apply-branch-protection.mjs` with `--check` and `--apply`.** It requires a second eligible reviewer before applying; the current private plan returns HTTP 403. Protection is applied after the repository becomes public. | ✅ Resolved — delegated |
| AR-9 | Security & compliance | Who changes repository visibility | Automate / owner action at release / keep private | **Owner action at release**, after the license/asset review in `docs/releasing.md`. The plan supplies the checklist and the `gh` command; it does not change visibility. | ✅ Resolved — user-owned release action |
| AR-10 | Integration points | The Should Have `changeset status` check | Block PRs without changesets / informational check / skip | **An informational `changeset` job** with `fetch-depth: 0` and `continue-on-error: true`, running `changeset status --since=origin/main`. It reports the pending release and stays green for docs-only PRs. | ✅ Resolved — delegated |
| AR-11 | Dependencies | Renovate or Dependabot | Renovate app / Dependabot config / none | **Dependabot** with weekly grouped minor/patch updates for npm and GitHub Actions, plus security alerts enabled at release. | ✅ Resolved — delegated |
| AR-12 | Integration points | The Should Have post-release smoke install | A new script / extend the packed consumer / skip | **Extend `scripts/clean-consumer.sh` with `--registry`**: install the exact published versions from npm and run the same typecheck and Vite build, with a bounded retry for registry propagation. | ✅ Resolved — delegated |
| AR-13 | Data & state | Package changelogs and READMEs | Root only / generated changelogs plus short package READMEs / no package docs | **Changesets-generated `packages/*/CHANGELOG.md` plus short package READMEs and a checked-in `LICENSE` copy**, all included in `files`. | ✅ Resolved — delegated |
| AR-14 | Data & state | Whether `THIRD_PARTY_NOTICES.md` ships in each package | Copy into every package / keep at the repository root / drop | **Keep the generated notices at the repository root.** Neither package bundles third-party runtime code. This deviates from the RD's illustrative manifest entry and is recorded in the release guide. | ✅ Resolved — delegated (recorded deviation) |
| AR-15 | Security & compliance | Source maps in the published tarballs | Exclude all maps / keep maps and scan for private paths / publish declarations only | **Keep the maps and assert no absolute path, home directory or `file://` URL.** Relative `../src/...` sources are expected and allowed. The maps aid debugging; they do not ship `sourcesContent`. | ✅ Resolved — delegated |
| AR-16 | UX & presentation | Where the support policy lives | `SUPPORT.md` / README only / a docs page | **`SUPPORT.md` at the root plus a README link.** It states best-effort community support, no SLA and the security-report path. | ✅ Resolved — delegated |
| AR-17 | Security & compliance | How detailed the security response process is | Keep the current short policy / add triage, disclosure and dependency-update steps / a separate process doc | **Expand `SECURITY.md`** with supported versions, private reporting, acknowledgement, triage, coordinated disclosure and dependency updates; the checklist enables private reporting and alerts. | ✅ Resolved — delegated |
| AR-18 | Integration points | CODEOWNERS coverage | One catch-all owner / path-specific owners / no CODEOWNERS | **Extend the existing `.github/CODEOWNERS`** with package, workflow, changeset, security and release-checklist paths. | ✅ Resolved — delegated |
| AR-19 | Security & compliance | GitHub Actions pinning | Tags / full commit SHAs / a pinning bot | **Full commit SHAs for every `uses:` in every workflow.** Annotated tag object SHAs are resolved to their commit SHA; the contract rejects a tag or branch ref. | ✅ Resolved — delegated |
| AR-20 | UX & presentation | Where the release checklist lives | `docs/releasing.md` / `RELEASING.md` at the root / the PR template | **`docs/releasing.md`**, linked from the README and `CONTRIBUTING.md`. It owns bootstrap, release, rollback, visibility, environment and branch-protection steps. | ✅ Resolved — delegated |
| AR-21 | Data & state | Version and deprecation policy ownership | A new page / extend `docs/migration.md` / README only | **Extend `docs/migration.md`** with the `0.2.0` first-release note; it already owns SemVer and deprecation. Link it from the release checklist. | ✅ Resolved — delegated |
| AR-22 | Integration points | How RD-12 joins traceability | Leave it / add rows and extend the checker through RD-12 / waive | **Add RD-12-AC-01..13 rows and extend the checker and CLI through RD-12.** Release-time manual ACs are `partial` with a blank proving file/title and explicit evidence. | ✅ Resolved — delegated |
| AR-23 | Security & compliance | Release workflow permissions and credential lifetime | `write-all` / job-scoped least privilege / a personal token | **Split build from publish.** The build job has no `id-token` and produces the tarballs; the publish job has `contents: write`, `id-token: write` and `actions: write`, installs nothing, and is protected by the `npm-production` environment with required reviewers and a `main` branch policy. | ✅ Resolved — delegated |
| AR-24 | Edge cases | Re-running a release after a partial failure | Fail on the existing version / compare integrity then skip / require a manual rollback | **Compare `npm view <pkg>@<version> dist.integrity` with the packed tarball.** Identical content is skipped; different content fails. An existing GitHub release is updated only when its tag commit matches `HEAD`. | ✅ Resolved — delegated |
| AR-25 | Technical unknowns | What can actually run in this environment | Publish now / dry-run only / skip automation | **Dry-run only.** There is no npm authentication, the repository is private, and the GitHub plan cannot enable branch protection. The plan proves packing, metadata, workflow shape and the registry smoke script; the maintainer runs the release steps. | ✅ Resolved — user-owned release blocker |
| AR-26 | Technical unknowns | Whether the release workflow is validated before the repository is public | Leave it to the first release / static contracts plus a dry run / a temporary test workflow | **Static workflow contracts, `release:check` and `release:publish --dry-run`.** No action is executed against npm before the maintainer enables it. | ✅ Resolved — delegated |
| AR-27 | Integration points | Owner-only setup is currently absent: no `npm-production` environment, private vulnerability reporting 404, Dependabot alerts disabled | Automate all / document exact commands and record the current state / ignore | **Document the exact `gh api`/UI setup and record the current state.** The checklist creates the environment, enables private reporting and alerts, enables Pages and configures the trusted publisher; the plan does not mutate these settings. | ✅ Resolved — delegated (owner action) |
| AR-28 | Ordering & sequencing | The first `0.2.0` version is committed in this milestone, before any release PR exists | Create a release PR for `0.2.0` / commit the first version and use the PR flow from `0.2.1` / skip versioning | **Commit `0.2.0` in this milestone; the human release-PR procedure starts at `0.2.1`.** This keeps the milestone self-contained and is stated in the release guide. | ✅ Resolved — delegated |
| AR-29 | Data & state | The traceability checker's `partial` behavior | Assume partial always skips title proof / document the exact blank-cell format / mark every AC proven | **A partial row uses `partial` with empty proving-file and proving-title cells and a non-empty evidence cell.** The checker skips title proof only for a blank title; the plan documents this and adds a checker message for a partial row that still names a title. | ✅ Resolved — delegated |
| AR-30 | Technical unknowns | One release contract file would mix metadata, workflows and governance | One file / three files by concern / no contract | **Three spec files** (`release-metadata`, `release-workflow`, `release-governance`) plus `release-pack.spec.test.ts` and `release-pack.impl.test.ts`, matching the repository's split-contract pattern. | ✅ Resolved — delegated |

## Resolution Notes

### Authority summary

- AR-1, AR-9 and AR-25 are **user-owned** scope and release-operation decisions.
- AR-4 is a **delegated resolution of an external registry constraint**. npm does
  not permit a trusted publisher for a package that does not yet exist; the only
  no-token path is a manual bootstrap.
- AR-2, AR-3, AR-5 through AR-8, AR-10 through AR-24 and AR-26 through AR-30 are
  **eligible technical decisions** inside RD-12. They add no product behavior,
  no runtime dependency and no paid service.

### Delegated provenance

```text
Authority: AI — delegated by --auto-design
Eligibility: release automation, versioning, package metadata, governance documents, branch
  protection provisioning and verification wiring inside RD-12
Objective: make the first public release reproducible, lockstep, provenance-signed and
  maintainable — versioned packages, a guarded OIDC release workflow, governance/support files,
  branch protection and an honest release checklist
Evidence: codeops/features/year-planner/requirements/RD-12-release-maintenance.md;
  codeops/features/year-planner/requirements/00-traceability.md; .changeset/config.json and five
  pending changesets; packages/*/package.json (0.1.0, no homepage/bugs/publishConfig/CHANGELOG);
  .github/workflows/ci.yml and pages.yml; .github/CODEOWNERS (catch-all exists);
  scripts/clean-consumer.sh; README.md; CONTRIBUTING.md; SECURITY.md; docs/migration.md (SemVer
  exists); docs/renderer-spike.md; docs/adr/0001-renderer-strategy.md; `gh repo view` (private),
  branch-protection API (HTTP 403), workflow permissions (`can_approve_pull_request_reviews`
  false), environments (none), private-vulnerability-reporting (404), vulnerability-alerts
  (disabled), `npm whoami` (unauthenticated), npm trusted-publishing documentation (bootstrap
  limitation and two-day validation window)
Rejected alternatives: named per row above
Strongest counterargument: the milestone could stop at documentation and leave all release
  automation for later. But RD-12 requires the fixed Changesets group, OIDC publishing, package
  metadata, branch protection and the governance set; without them the first release is manual and
  unauditable. The chosen path automates every step that does not require a registry account or a
  GitHub plan change, and records the remaining owner actions explicitly.
Confidence: High — every automatable deliverable is a checked-in file, script, workflow or
  contract test; the external limitations (npm bootstrap, private-repo branch protection, absent
  environment/settings) are verified against the live registry and GitHub API
Hardening: two independent preflight auditors re-checked the npm bootstrap, pack rewrite, action
  pins, workflow permissions, environment absence, branch-protection constraint, changeset count
  and test-map behavior against the repository and installed tools; all critical/major findings
  are resolved in this revision
Policy version: 1
Root invocation ID: rd12-release-2026-11-12
Reopen triggers: npm enables trusted publishing for new packages; the repository becomes public
  before the plan completes; the GitHub plan gains branch protection while private; a second
  maintainer is added; the user supplies npm credentials or asks for an automated first publish
```
