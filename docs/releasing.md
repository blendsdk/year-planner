# Releasing Year Planner for React

> **Scope**: the first public release and every later lockstep release.
> **Owner**: the maintainer. The repository stores no npm token.

## Pre-release checklist

- [ ] `pnpm verify:full` passes on `main` (typecheck, lint, unit, component,
      browser, print, visual, accessibility, timezone, performance, benchmark
      and clean-consumer suites).
- [ ] `pnpm release:check` passes (versions, changelogs, tarballs, source maps,
      `npm pack --dry-run`).
- [ ] `pnpm api-report:ci` is clean and both API reports are reviewed.
- [ ] `pnpm docs:site` builds Storybook at `/` and TypeDoc at `/api`, and
      `pnpm docs:site -- --check-only` passes.
- [ ] The print sample renders (PRT-01 and the A3 page counts).
- [ ] The browser/React matrix is green for the supported React 19 line.
- [ ] `DEFERRED.md` and the README limitations still match the release.
- [ ] `docs/renderer-spike.md` and `docs/adr/0001-renderer-strategy.md` are
      current.
- [ ] `pnpm audit --audit-level high` reports no high or critical advisory.
- [ ] No unpublished reference-image material, photos or private fixtures are
      tracked.

## Version

1. Create `release/<version>` from `main`.
2. Run `pnpm version-packages`.
3. Review both `CHANGELOG.md` files and the lockstep version.
4. Commit with `git commit -s` so the commit carries
   `Signed-off-by: <name> <email>`, then open a pull request. Every CI job,
   including the DCO (`dco`) check, runs because the PR is human-authored.
5. Merge after review and a green gate. The first `0.2.0` version is already
   committed; this procedure starts at `0.2.1`.

Do not use the Changesets GitHub action. This repository cannot create or approve PRs
with the default workflow token on its current plan, and a token-created PR
would not trigger CI.

## Bootstrap the first packages (0.2.0 only)

npm cannot configure a trusted publisher for a package that does not exist.
The first publication is a one-time manual step:

```bash
npm login   # MFA; no token is written to the repository
pnpm release:publish --bootstrap --skip-github-release
```

This publishes `0.2.0` core then React without provenance and without a GitHub
release. Then, on npmjs.com for **each** package:

1. Open **Settings → Trusted Publisher → GitHub Actions**.
2. Repository: `blendsdk/year-planner`.
3. Workflow filename: `release.yml`.
4. Environment: `npm-production`.
5. Allowed action: `npm publish`.

A new trusted publisher expires if it is not validated within two days. Create
an `0.2.1` patch changeset immediately, merge its release PR and run the
release workflow within that window. `0.2.1` is the first announced,
provenance-signed release; `0.2.0` is the bootstrap.

## Visibility, license and one-time owner setup

Run these steps once, after the license and asset review above:

1. Enable private vulnerability reporting:
   `gh api -X PUT repos/blendsdk/year-planner/private-vulnerability-reporting`.
2. Enable Dependabot alerts:
   `gh api -X PUT repos/blendsdk/year-planner/vulnerability-alerts`.
3. Change visibility only after private vulnerability reporting is enabled:
   `gh repo edit blendsdk/year-planner --visibility public --accept-visibility-change-consequences`.
4. Enable GitHub Pages with **GitHub Actions** as the source.
5. Create the `npm-production` environment with required reviewers and a
   `main` deployment-branch policy (Settings → Environments).
6. Configure the npm trusted publisher for both packages (see the bootstrap
   section).
7. Add a second reviewer or collaborator, then apply branch protection:
   `node scripts/apply-branch-protection.mjs --apply`.

`THIRD_PARTY_NOTICES.md` stays at the repository root. Neither package bundles
third-party runtime code, so no package ships it.

## Publish

1. Dispatch **Release** on `main` with `publish=true` (and `deploy-docs=true`).
2. Approve the `npm-production` environment.
3. The workflow re-runs `pnpm verify:full`, builds and packs in a
   credential-free job, publishes core then React with
   `npm publish --provenance`, creates the `v<version>` GitHub release, runs
   the registry smoke and dispatches the Pages deployment.
4. Verify the provenance badge on both npm package pages.
5. Verify the GitHub release links both packages and the documentation site.

## Post-release

- Run `pnpm release:smoke` (a clean npm install of the exact versions).
- Confirm `https://blendsdk.github.io/year-planner/` serves Storybook and
  `/api/`.
- Update the README and `docs/README.md` status from "not published" to the
  published version.
- Announce the release with the changelog and the package links.

## Rollback

- Prefer `npm deprecate <pkg>@<version>` with a message that names the
  replacement. Unpublishing is a last resort.
- Edit or delete the GitHub release; never force-push the tag.
- Redeploy the docs for the previous commit if the site changed.
- Record the incident in `docs/test-report.md` when it affects published
  behavior.

## Current owner-action state (2026-11-12)

The implementation environment has no npm credentials and the repository is
private. These are the verified states to re-check at release time:

| Item | Current state |
| ---- | ------------- |
| Repository visibility | private |
| Branch protection | unavailable (HTTP 403 on the current plan) |
| `npm-production` environment | not created |
| Private vulnerability reporting | not enabled |
| Dependabot security alerts | disabled |
| npm authentication | not authenticated |

Run the setup steps above as the maintainer; do not treat the plan's dry-run
evidence as a live publication.

## Branch protection

`node scripts/apply-branch-protection.mjs --check` reports the current state.
`--record` prints the state and exits zero, so an unavailable protection can be
recorded without failing a phase. `--apply` requires:

- a public repository (the current private plan returns HTTP 403);
- a second eligible reviewer (the sole code owner cannot approve their own PR);
- the `verify`, `browsers`, `docs-site`, `dco` and `security` checks.

The `performance` job is a release gate, not a per-PR required check; it runs
in `pnpm verify:full`.
