# Governance and Support: Release, Versioning and Maintenance

> **Document**: 03-03-governance-support.md
> **Parent**: [Index](00-index.md)

## Overview

This component owns the non-code release surface: who reviews, how the project
is supported, how vulnerabilities are handled, how `main` is protected and how
the repository becomes public. It also owns the release checklist that ties the
versioning and automation components to the owner-only actions.

## Architecture

### Current Architecture

`CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, a short `SECURITY.md`, the issue
templates, the PR template and a catch-all `.github/CODEOWNERS` exist. There is
no support policy, no release checklist and no branch protection. The
repository is private; the branch-protection API returns HTTP 403 on the
current plan. The `npm-production` environment does not exist, private
vulnerability reporting returns 404 and Dependabot security alerts are
disabled.

### Proposed Changes

| Change | File |
| ------ | ---- |
| Path-specific review ownership | `.github/CODEOWNERS` (extend) |
| Best-effort support policy | `SUPPORT.md` |
| Expanded vulnerability process | `SECURITY.md` |
| Release checklist and owner actions | `docs/releasing.md` |
| Protection apply/check | `scripts/apply-branch-protection.mjs`, `.d.mts` |
| Grouped dependency updates and alerts | `.github/dependabot.yml` |
| Community links | `README.md`, `CONTRIBUTING.md` |
| Informational `changeset status` PR check | `.github/workflows/ci.yml` |

## Implementation Details

### CODEOWNERS

The existing catch-all line stays; path-specific entries are added:

```text
*                                   @blendsdk
/packages/                          @blendsdk
/.github/workflows/                 @blendsdk
/.changeset/                        @blendsdk
/SECURITY.md                        @blendsdk
/docs/releasing.md                  @blendsdk
```

### Support policy

`SUPPORT.md` states:

- best-effort community support through GitHub issues;
- no SLA, no guaranteed response time and no 24/7 support;
- security reports go through private vulnerability reporting, never a public
  issue;
- the current `0.x` line is supported; older pre-1.0 minors are best effort;
- releases happen as needed, with no fixed calendar promise;
- no commercial support tier, CLA or paid license.

### Security response process

`SECURITY.md` gains:

| Stage | Commitment |
| ----- | ---------- |
| Report | GitHub private vulnerability reporting; include version, reproduction and impact |
| Acknowledgement | Within 3 business days |
| Triage | Within 10 business days; severity and affected versions confirmed |
| Fix | Critical and high issues prioritized; a patched release is prepared privately |
| Disclosure | Coordinated, normally within 90 days or an agreed date; credit offered |
| Dependency updates | Dependabot alerts plus `pnpm audit --audit-level high`; high/critical findings block release |

The page keeps the existing scope statement: visibility is presentation, not
authorization, and hosts remain responsible for tenant isolation and data.

### Branch protection

`scripts/apply-branch-protection.mjs`:

- `--check` reads `repos/{owner}/{repo}/branches/main/protection` and compares
  the required settings;
- `--record` prints the same status and exits 0, so the release evidence can
  record an unavailable protection without failing the phase;
- `--apply` sends the same settings with `gh api --method PUT`;
- `--repo <owner/name>` overrides the repository resolved from `git remote`;
- `--check`/`--apply` exit non-zero when GitHub returns 403 because the
  repository is private on a plan without protection; `--record` exits 0 after
  printing the constraint;
- exits non-zero with a clear message when fewer than two eligible reviewers
  exist, because a single code owner cannot approve their own PR.

Required settings:

| Setting | Value |
| ------- | ----- |
| Required checks | `verify`, `browsers`, `docs-site`, `dco`, `security` |
| Strict status checks | true |
| Required reviews | 1, dismiss stale; code-owner review is advisory because the sole code owner cannot self-approve |
| Enforce for admins | true |
| Force pushes | false |
| Deletions | false |
| Conversation resolution | true |
| Push restrictions | none (review-based protection) |

The `performance` job is a release gate, not a per-PR required check: it takes
up to 60 minutes and `pnpm verify:full` remains mandatory in the release
workflow. This is recorded in the checklist.

A second reviewer or collaborator must exist before the script is applied.
The script checks reviewer eligibility and reports the prerequisite. The
CODEOWNERS file routes review, but `require_code_owner_reviews` stays false so
a second collaborator can approve the sole owner's PR.

### Repository visibility and monthly owner setup

`docs/releasing.md` owns the one-time sequence:

1. Complete the license and asset review: MIT `LICENSE`, DCO, no CLA, no
   unpublished reference-image material, no photos, synthetic fixtures only.
2. Confirm `pnpm verify:full` and `pnpm audit --audit-level high` are green.
3. Enable private vulnerability reporting and Dependabot alerts:
   `gh api -X PUT repos/blendsdk/year-planner/private-vulnerability-reporting`
   and `gh api -X PUT repos/blendsdk/year-planner/vulnerability-alerts`.
4. Change visibility with
   `gh repo edit blendsdk/year-planner --visibility public --accept-visibility-change-consequences`.
5. Enable Pages with GitHub Actions as the source.
6. Create the `npm-production` environment with required reviewers and a
   `main` deployment-branch policy.
7. Bootstrap-publish `0.2.0` (manual, no provenance, no GitHub release).
8. Configure the npm trusted publisher for both packages and publish `0.2.1`
   through the release workflow within the two-day validation window.
9. Apply branch protection after confirming a second reviewer exists.

### Dependabot

`.github/dependabot.yml`:

- npm ecosystem at `/`, weekly, grouped minor and patch updates, major updates
  separate, limit 5 open PRs;
- GitHub Actions ecosystem at `/`, weekly, grouped updates;
- labels `dependencies`, assignee `blendsdk`.

### Release checklist

`docs/releasing.md` contains these sections:

| Section | Contents |
| ------- | -------- |
| Pre-release | `pnpm verify:full`, `pnpm release:check`, API report, docs build, Storybook build, print sample, browser/React matrix, `DEFERRED.md`/README limitations review, `docs/renderer-spike.md` and renderer ADR |
| Visibility and license review | Owner visibility sequence, asset review, private reporting, Dependabot alerts, Pages, environment, branch protection; third-party notices stay at the repository root and no package ships them |
| Version | Release PR review, lockstep version, changelogs, no pending changesets, DCO sign-off |
| Bootstrap | `npm login`, `pnpm release:publish --bootstrap --skip-github-release`, trusted-publisher fields, two-day validation window, `0.2.1` provenance release |
| Publish | Dispatch `release.yml` on `main` with `publish=true`, approve `npm-production`, verify provenance and the GitHub release |
| Post-release | `pnpm release:smoke`, docs deployment, README/docs status update, install check, announcement |
| Rollback | Deprecate, edit/delete the GitHub release, redeploy docs, record the incident |

### README and CONTRIBUTING links

README gains a Community section linking `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`,
`SECURITY.md`, `SUPPORT.md`, `docs/releasing.md`, the issue chooser and the
pull-request template. CONTRIBUTING links the
release checklist and the changeset requirement.

### Error Handling

| Error Case | Handling Strategy | AR Ref |
| ---------- | ----------------- | ------ |
| Branch protection is unavailable | `--check` reports the 403 and the release step; it does not fail `verify` | AR-8 |
| Fewer than two eligible reviewers | `--check` and `--apply` fail with the prerequisite message | AR-8 |
| The environment is missing or unprotected | The checklist setup step creates it; a check records `reviewers` and the branch policy | AR-23 |
| A CODEOWNERS path does not exist | The contract test fails and names the path | AR-18 |
| The support policy claims an SLA | The docs contract rejects SLA language | AR-16 |
| The security process omits a stage | The release contract fails and names the stage | AR-17 |
| Private vulnerability reporting is disabled | The contract test asserts the checklist contains the enable command; the owner runs it | AR-17 |
| The visibility checklist omits the asset review | The contract fails and names the step | AR-9 |
| A required check name drifts | The branch-protection check reports the missing context | AR-8 |

> **Traceability:** every structural decision above is recorded in
> [00-ambiguity-register.md](00-ambiguity-register.md).

## Testing Requirements

- `tests/quality/release-governance.spec.test.ts` owns the governance, support,
  security, CODEOWNERS, checklist and visibility cases (ST-18–ST-25 and ST-27).
- `node scripts/apply-branch-protection.mjs --record` is run once during
  execution to record the current 403 and reviewer prerequisites; `--check` is
  run after the repository becomes public.
- No browser or network test is added.
