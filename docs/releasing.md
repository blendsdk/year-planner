# Releasing Year Planner for React

> **Scope**: the first public release and every later lockstep release.
> **Owner**: the maintainer. The repository stores no npm token.

## Pre-release checklist

- [ ] Root and package `LICENSE` files match; all three package manifests
      declare `SEE LICENSE IN LICENSE`. Review the [licensing guide](licensing.md),
      earlier licence grants, contribution rights and asset provenance before
      publishing the licence change. The visual-design rights question was
      confirmed resolved by the owner on 2026-11-13.
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
- [ ] The fit evidence at 1280 × 800 and 1024 × 768 is current
      (`tests/e2e/fit.spec.ts`).
- [ ] The performance evidence is current (`docs/benchmarks/rd13-baseline.md`)
      and the strict RD-13 suite passes.
- [ ] The context-menu demo and the six Demos play stories are present and
      Storybook builds with Demos first.
- [ ] `DEFERRED.md` and the README limitations still match the release.
- [ ] `docs/renderer-spike.md` and `docs/adr/0001-renderer-strategy.md` are
      current.
- [ ] `pnpm audit --audit-level high` reports no high or critical advisory.
- [ ] No unpublished reference-image material, photos or private fixtures are
      tracked.

## Version

1. Create `release/<version>` from `main`.
2. Run `pnpm version-packages`.
3. Review all three `CHANGELOG.md` files and the lockstep version.
   `pnpm version-packages` runs Changesets and then Lockstep, which aligns the
   root, demo, Storybook and spike workspaces to the same version. Run
   `pnpm test:versions` to verify the invariant.
4. Commit with `git commit -s` so the commit carries
   `Signed-off-by: <name> <email>`, then open a pull request. Every CI job,
   including the sign-off (`dco`) check, runs because the PR is human-authored.
5. Merge after review and a green gate. `0.3.0` was the unprovenanced
   bootstrap; `0.3.1` is the first provenance-signed release.

The origin certification and contribution grant are defined in
[CONTRIBUTING.md](https://github.com/blendsdk/year-planner/blob/main/CONTRIBUTING.md).
They use project-specific terms rather than DCO 1.1; `dco` is the sign-off job's
historical identifier.

Do not use the Changesets GitHub action. This repository cannot create or approve PRs
with the default workflow token on its current plan, and a token-created PR
would not trigger CI.

## Bootstrap the first packages (0.3.0 only, completed)

npm cannot configure a trusted publisher for a package that does not exist.
The first publication was a one-time manual step, completed on 2026-11-13:

```bash
npm login   # MFA; no token is written to the repository
pnpm release:publish --bootstrap --skip-github-release
```

This published `0.3.0` core, React and languages without provenance and without
a GitHub release. Trusted publishing was then configured from the CLI for
**each** package:

```bash
npm trust github <package> \
  --file release.yml \
  --repo blendsdk/year-planner \
  --env npm-production \
  --allow-publish
```

A new trusted publisher expires if it is not validated within two days, so the
`0.3.1` release follows immediately. `0.3.1` is the first announced,
provenance-signed release; `0.3.0` is the bootstrap. `0.2.0` is never
published.

## Visibility, license and one-time owner setup

Run these steps once, after the license and asset review above:

1. Enable private vulnerability reporting:
   `gh api -X PUT repos/blendsdk/year-planner/private-vulnerability-reporting`.
2. Enable Dependabot alerts:
   `gh api -X PUT repos/blendsdk/year-planner/vulnerability-alerts`.
3. Change visibility only after private vulnerability reporting is enabled:
   `gh repo edit blendsdk/year-planner --visibility public --accept-visibility-change-consequences`.
4. Enable GitHub Pages with **GitHub Actions** as the source. The Docs site
   workflow uploads `docs/.vitepress/dist`: VitePress at `/year-planner/`,
   Storybook at `/year-planner/storybook/` and TypeDoc at `/year-planner/api/`.
5. Create the `npm-production` environment with required reviewers and a
   `main` deployment-branch policy (Settings → Environments).
6. Configure the npm trusted publisher for all three packages (see the
   bootstrap section).
7. Add a second reviewer or collaborator, then apply branch protection:
   `node scripts/apply-branch-protection.mjs --apply`.

`THIRD_PARTY_NOTICES.md` stays at the repository root. Neither package bundles
third-party runtime code, so no package ships it.

The internal-use licence applies to the copies offered under it. It does not
revoke earlier MIT grants. Record the licence change in release notes; do not
describe these restricted releases as open source or re-label earlier releases.

## Publish

1. Dispatch **Release** on `main` with `publish=true` (and `deploy-docs=true`).
2. Approve the `npm-production` environment.
3. The workflow re-runs `pnpm verify:full`, builds and packs in a
   credential-free job, publishes core, React and languages with
   `npm publish --provenance`, creates the `v<version>` GitHub release, runs
   the registry smoke and dispatches the Pages deployment.
4. Verify the provenance badge on all three npm package pages.
5. Verify the GitHub release links all three packages and the documentation site.

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

## Current owner-action state (2026-11-13)

The maintainer account `blendjs` is authenticated for local bootstrap
publishing. CI publishes with OIDC trusted publishing and stores no npm token.

| Item | Current state |
| ---- | ------------- |
| Repository visibility | public |
| Branch protection | unavailable (HTTP 403 on the current plan) |
| `npm-production` environment | created; reviewer `blendsdk`; `main` branch policy |
| Private vulnerability reporting | not enabled |
| Dependabot security alerts | disabled |
| npm authentication | `blendjs` (local bootstrap) |
| npm packages | `0.3.0` published (bootstrap, no provenance) |
| Trusted publishers | configured for all three packages via `release.yml` and `npm-production` |

Re-check the remaining owner actions before the next release; do not treat the
bootstrap publication as provenance evidence.

## Branch protection

`node scripts/apply-branch-protection.mjs --check` reports the current state.
`--record` prints the state and exits zero, so an unavailable protection can be
recorded without failing a phase. `--apply` requires:

- a public repository;
- a second eligible reviewer (the sole code owner cannot approve their own PR);
- the `verify`, `browsers`, `docs-site`, `dco` and `security` checks.

The `performance` job is a release gate, not a per-PR required check; it runs
in `pnpm verify:full`.
