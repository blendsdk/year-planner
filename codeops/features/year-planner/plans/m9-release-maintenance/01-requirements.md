# Requirements: Release, Versioning and Maintenance

> **Document**: 01-requirements.md
> **Parent**: [Index](00-index.md)
> **Source**: [RD-12](../../requirements/RD-12-release-maintenance.md) — the OWNING requirements doc

## Scope of this plan (delta view)

### In this plan

- RD-12 Must Have — the fixed Changesets group (already configured), lockstep
  `0.2.0`, generated per-package changelogs, SemVer/deprecation policy, OIDC
  publishing, core-before-React order, exact core dependency, GitHub release,
  package metadata, branch protection, governance files, security process and
  the release checklist.
- RD-12 Should Have — a manually approved release workflow, a `changeset status`
  PR check, grouped Dependabot updates and a registry smoke install.
- A human-authored release PR procedure: the repository cannot use the
  Changesets action because Actions cannot create/approve PRs on this plan and
  a `GITHUB_TOKEN` PR would not trigger CI (AR-3).
- RD-12 acceptance criteria 1–13.
- The RD-12 release is implemented and dry-run proven; publication remains a
  maintainer action because this environment has no npm credentials and the
  repository is private.

### Deferred / out of this plan

- The actual first npm publication, npm trusted-publisher configuration,
  repository visibility change, branch-protection application, environment
  creation and live docs deployment — owner actions documented in
  `docs/releasing.md` (AR-9, AR-25, AR-27).
- Commercial licensing, CLA, paid support, a hosted service, marketplace
  listing, multi-major docs versioning and LTS branches — RD-12 out of scope.
- Issue #4 auto-fit and any product behavior change.
- A one-shot `NPM_TOKEN` bootstrap. The repository stores no npm token; the
  first package creation is a local authenticated maintainer action. `0.2.0` is
  the bootstrap; `0.2.1` is the first provenance-signed release (AR-4).

## Plan-local decisions

| Decision | Chosen | AR Ref |
| -------- | ------ | ------ |
| First version | `0.2.0` from the five pending changesets | AR-2 |
| Release trigger | Human release PR; manual release dispatch | AR-3 |
| Publish path | pnpm pack then `npm publish <tarball> --provenance` | AR-5 |
| Bootstrap | Manual `0.2.0`, then `0.2.1` via OIDC within two days | AR-4 |
| GitHub release | One `v<version>` tag with changelog and package links | AR-6 |
| Docs deploy | Release dispatches the Pages workflow | AR-7 |
| Branch protection | Script with `--check`/`--apply`, run after going public | AR-8 |
| Changeset check | Informational `changeset status --since=origin/main` job | AR-10 |
| Dependency updates | Grouped weekly Dependabot | AR-11 |
| Registry smoke | `clean-consumer.sh --registry` after publish | AR-12 |
| Package docs | Generated changelogs plus short package READMEs and LICENSE copies | AR-13 |
| Notices | Root `THIRD_PARTY_NOTICES.md` only (recorded deviation) | AR-14 |
| Source maps | Keep, assert no private paths | AR-15 |
| Action pinning | Full commit SHA for every `uses:` | AR-19 |
| Credentials | Build and publish split; no install in the publish job | AR-23 |
| Owner setup | Environment, reporting, alerts, Pages, trusted publisher | AR-27 |
| Traceability | RD-12 rows; release-time ACs marked `partial` with blank title | AR-22, AR-29 |

## Acceptance Criteria

The RD owns its acceptance criteria. This plan adds no plan-local ACs; every
RD-12 AC maps to a spec-test case in [07-testing-strategy.md](07-testing-strategy.md)
and to a row in `00-traceability.md`.

## Security scope

| Concern | This plan |
| ------- | --------- |
| Authentication | npm trusted publishing uses GitHub OIDC (`id-token: write`); no npm token is stored. The manual bootstrap uses the maintainer's local npm session, not a repository secret (AR-4). |
| Authorization | The release job uses the `npm-production` environment with required reviewers; only `main` can dispatch it (AR-23). |
| Secrets | None in workflows. `GITHUB_TOKEN` is the only credential; permissions are job-scoped (AR-23). |
| Supply chain | Every action is pinned to a full commit SHA; package contents are allowlisted and inspected before publish (AR-19, AR-15). |
| Injection | The publish script uses argument arrays and no shell interpolation for package names or versions. |
| Data | Release artifacts contain code and synthetic fixtures only; no photos, test fixtures or private paths (AR-15). |
| Existing gates | `pnpm verify:full` and `pnpm audit --audit-level high` remain required before release. |
