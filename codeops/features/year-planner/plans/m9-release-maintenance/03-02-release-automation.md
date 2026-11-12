# Release Automation: Release, Versioning and Maintenance

> **Document**: 03-02-release-automation.md
> **Parent**: [Index](00-index.md)

## Overview

Versioning and publishing are separate, human-controlled steps. A maintainer
runs `pnpm version-packages` on a release branch, opens a normal pull request
so every CI check and the DCO check run, and merges it. A manually dispatched
`release.yml` then re-verifies the tree, builds and packs in a credential-free
job, and publishes the validated tarballs in a separate environment-guarded job
with npm provenance over OIDC.

This plan deliberately does not use `changesets/action`. The repository is
private on a plan where GitHub Actions cannot create or approve pull requests,
and a PR created by the default `GITHUB_TOKEN` does not trigger CI. A
human-authored release PR is the smallest design that keeps the DCO, review and
CI gates real.

## Architecture

### Current Architecture

There is no version or release workflow. CI references actions by tag. The
packages have never been published; `npm whoami` is unauthenticated in this
environment.

### Proposed Changes

| Change | File |
| ------ | ---- |
| Release PR procedure and publish workflow | `docs/releasing.md` |
| Manual guarded publish | `.github/workflows/release.yml` |
| Shared pack and manifest checks | `scripts/lib/release-manifest.mjs`, `.d.mts` |
| Pack, validate, publish, release | `scripts/release-publish.mjs`, `.d.mts` |
| Readiness gate | `scripts/release-check.mjs`, `.d.mts` |
| Registry smoke | `scripts/clean-consumer.sh` (`--registry`), `package.json` |
| Version bump script | `package.json` `version-packages` |
| Informational changeset check | `.github/workflows/ci.yml` |

## Implementation Details

### Release PR procedure

1. A maintainer creates `release/<version>` from `main`.
2. `pnpm version-packages` runs `changeset version`, bumps both packages in
   lockstep and writes both changelogs.
3. The maintainer commits with `-s`, pushes the branch and opens a pull
   request.
4. Every CI job, including `dco`, runs because the PR is human-authored.
5. After review and a green gate, the PR is merged.
6. The maintainer dispatches `release.yml` on `main`.

The first `0.2.0` version is committed as part of this milestone; the release
PR procedure applies to `0.2.1` and later.

### `release.yml`

```yaml
name: Release
on:
  workflow_dispatch:
    inputs:
      publish:
        description: Publish the committed versions to npm
        type: boolean
        default: false
      deploy-docs:
        description: Dispatch the Pages deployment after publish
        type: boolean
        default: true
permissions:
  contents: read
concurrency:
  group: npm-release
  cancel-in-progress: false
jobs:
  verify:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - checkout, pnpm, Node 24, install
      - sudo apt-get install -y poppler-utils
      - npx playwright install --with-deps chromium firefox webkit
      - pnpm verify:full
  build:
    needs: verify
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - checkout, pnpm, Node 24, install
      - pnpm build
      - pnpm release:check
      - upload-artifact release-packs (release-packs/)
  publish:
    needs: build
    if: inputs.publish && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment:
      name: npm-production
      url: https://www.npmjs.com/package/@blendsdk/react-year-planner
    permissions:
      contents: write
      id-token: write
      actions: write
    steps:
      - checkout (no install)
      - pnpm/action-setup and setup-node (no install)
      - download-artifact release-packs (path: release-packs)
      - run: node scripts/release-publish.mjs --packs release-packs
        env: GH_TOKEN: ${{ github.token }}
  smoke:
    needs: publish
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - checkout, pnpm, Node 24 (no install)
      - run: pnpm release:smoke
      - if: inputs.deploy-docs
        continue-on-error: true
        run: gh workflow run pages.yml --ref main -f deploy=true
        env: GH_TOKEN: ${{ github.token }}
```

The build job has no `id-token` and produces the exact tarballs that the
publish job uploads. The publish job never installs dependencies or runs build
scripts, so no dependency lifecycle script runs with release credentials. The
registry smoke runs in a separate `smoke` job with only `contents: read`; it
installs nothing in the repository and creates its clean app in a temp dir.

`npm-production` is a GitHub environment with required reviewers and a `main`
deployment-branch policy. It must be created once (see
[03-03](03-03-governance-support.md)); an unprotected environment is not
sufficient.

### `version-packages`

`pnpm version-packages` runs `changeset version`. It consumes the pending
changesets, bumps both packages to the same version, writes both changelogs and
deletes the consumed changeset files. The release PR commits the result.

### `scripts/lib/release-manifest.mjs`

Shared, dependency-free helpers used by both `release-check` and
`release-publish`:

- `readManifests(repoRoot)` — both package manifests, versions and fields;
- `validateVersions(...)` — lockstep equality and changelog headings;
- `inspectTarball(tarball)` — path allowlist, required files, packed manifest,
  exact internal dependency;
- `inspectSourceMaps(directory)` — no absolute, home-directory or `file://`
  path; relative `../src/...` sources are allowed;
- `buildReleaseNotes(...)` — the GitHub release body.

The shared module is unit-tested with fixtures; the scripts are thin command
wrappers. `release:check` writes the validated tarballs to `release-packs/` so
the build job can upload exactly what the publish job will upload. A dry run
uses `TMPDIR` (or `CODEOPS_TMPDIR`) for the pack directory when `--packs` is
not supplied.

### `scripts/release-publish.mjs`

The script is the only publish path. It:

1. Reads both manifests and refuses a version mismatch.
2. Requires a `## <version>` heading in both changelogs.
3. Requires a clean git tree by default; `--allow-dirty` is accepted only with
   `--dry-run`.
4. Builds and packs both packages into `release-packs/` unless `--packs <dir>`
   supplies prebuilt tarballs.
5. Validates each tarball with the shared helpers.
6. For each package in order (core, then React):
   - compares the published tarball integrity with `npm view` when the version
     already exists; a mismatch fails instead of silently skipping;
   - skips with a message when the exact version and integrity already match;
   - otherwise runs `npm publish <tarball> --provenance --access public` with
     `--tag latest`.
7. Creates or updates the GitHub release `v<version>` with notes from both
   changelogs plus links to the npm packages and
   `https://blendsdk.github.io/year-planner/`.
8. Prints a summary table and exits non-zero on the first failure.

Flags:

| Flag | Behavior |
| ---- | -------- |
| `--dry-run` | Runs build, pack and every check; replaces publish with `npm publish --dry-run`; skips the GitHub release |
| `--packs <dir>` | Uses prebuilt tarballs; skips build and pack |
| `--bootstrap` | Publishes without `--provenance` from a local authenticated CLI; used only for the first package creation |
| `--skip-github-release` | Accepted only with `--bootstrap`; leaves the release for the OIDC release |
| `--allow-dirty` | Accepted only with `--dry-run` |

### npm bootstrap and the first provenance release

npm does not allow a trusted publisher for a package that does not exist, and
an OIDC publish of a new package fails. The first publication is therefore a
one-time maintainer action:

```bash
npm login                         # MFA; no token is written to the repository
pnpm release:publish --bootstrap --skip-github-release
# npmjs.com → each package → Settings → Trusted Publisher → GitHub Actions
#   repository: blendsdk/year-planner
#   workflow: release.yml
#   environment: npm-production
#   allowed action: npm publish
```

A newly configured trusted publisher expires if it is not validated within two
days. The bootstrap `0.2.0` carries no provenance and creates no GitHub release.
To validate the trust and publish a provenance-signed release, the maintainer
immediately creates a `0.2.1` patch changeset, merges the release PR and
dispatches `release.yml` within that window. The first announced release is
`0.2.1`; `0.2.0` is the bootstrap. This is recorded in `docs/releasing.md` and in the test report.

### GitHub release notes

The release body contains:

- the version and release date;
- the core changelog section;
- the React changelog section;
- links to `https://www.npmjs.com/package/@blendsdk/year-planner-core`,
  `https://www.npmjs.com/package/@blendsdk/react-year-planner` and
  `https://blendsdk.github.io/year-planner/`.

An existing release is updated with `gh release edit`; a missing one is created
with `gh release create v<version> --notes-file <tmp>`. The tag commit is
checked against `HEAD` before an existing release is edited.

### Rollback

- Within the npm unpublish window, prefer `npm deprecate <pkg>@<version>` with
  a message that names the replacement. Unpublishing is a last resort.
- Delete or edit the GitHub release; never force-push the tag.
- Re-run the docs deployment for the previous commit if the site changed.
- Record the incident in `docs/test-report.md` when it affects published
  behavior.

### Error Handling

| Error Case | Handling Strategy | AR Ref |
| ---------- | ----------------- | ------ |
| Version mismatch between packages | Fail before build; print both versions | AR-2 |
| Missing changelog heading | Fail before build; name the package | AR-13 |
| Tarball contains a forbidden path | Fail before upload; print the path | AR-15 |
| Packed React dependency is not exact | Fail before upload; print the dependency | AR-5 |
| A version is already published with different content | Fail; compare `npm view dist.integrity` | AR-24 |
| A version is already published with identical content | Skip it and continue with the other package | AR-24 |
| The GitHub release already exists | Verify the tag commit, then update its notes | AR-24 |
| npm rejects OIDC (missing trusted publisher) | Fail with the npm error and link the bootstrap section | AR-4 |
| Registry propagation delays the smoke | The smoke retries for up to 60 seconds before failing | AR-12 |
| Docs dispatch fails after publish | The step is `continue-on-error`; the checklist re-runs it | AR-7 |
| The release is dispatched from a non-`main` ref | Both publish and build jobs require `main` | AR-23 |
| A dependency lifecycle script runs during install | The publish job installs nothing; build and pack happen in the credential-free build job | AR-23 |

> **Traceability:** every structural decision above is recorded in
> [00-ambiguity-register.md](00-ambiguity-register.md).

## Testing Requirements

- `tests/quality/release-workflow.spec.test.ts` owns the workflow, permission,
  OIDC, pinning, main-guard, bootstrap and registry-smoke cases (ST-9–ST-17).
- `tests/quality/release-metadata.spec.test.ts` owns the version, metadata and
  changelog cases (ST-1–ST-5).
- `tests/quality/release-pack.spec.test.ts` owns the tarball, exact-dependency
  and source-map cases (ST-6–ST-8) with synthetic fixtures.
- `tests/quality/release-pack.impl.test.ts` owns the shared-helper failure
  modes.
- `pnpm release:publish --dry-run` proves the real build and pack path without
  uploading.
- `pnpm release:check` runs in `pnpm verify` and in the release build job.
