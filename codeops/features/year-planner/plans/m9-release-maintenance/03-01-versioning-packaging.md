# Versioning and Packaging: Release, Versioning and Maintenance

> **Document**: 03-01-versioning-packaging.md
> **Parent**: [Index](00-index.md)

## Overview

Both packages release in lockstep under one `0.x` version. Changesets owns the
version bump and changelog; pnpm owns the tarball and rewrites the internal
workspace dependency to the exact release version; npm owns the provenance
attestation. This component defines the version, the metadata and the tarball
contents that the release automation consumes.

## Architecture

### Current Architecture

- `.changeset/config.json` has a fixed group for core and React, public access
  and `main` as the base branch.
- Both packages are `0.1.0`; five pending changesets (four minor requests and one
  patch) aggregate to a minor bump.
- `files` is `["dist", "README.md", "LICENSE"]`; no changelog or package README
  exists, and the `LICENSE` is injected by pnpm from the repository root.
- The React dependency is `workspace:*`; `pnpm pack` rewrites it to the exact
  version, while the TypeScript source and repository manifest keep the
  workspace protocol.
- Builds emit `.js`, `.d.ts`, `.map` and `.d.ts.map` files.

### Proposed Changes

| Change | File |
| ------ | ---- |
| Lockstep `0.2.0` version and generated changelogs | `packages/*/package.json`, `packages/*/CHANGELOG.md` |
| Short package landing pages | `packages/*/README.md` |
| Homepage, bugs and public access metadata | `packages/*/package.json` |
| Changelog and README in the tarball allowlist; checked-in package LICENSE | `packages/*/package.json`, `packages/*/LICENSE` |
| Version and deprecation policy | `docs/migration.md` |

## Implementation Details

### Version model

Both packages always share one version. The Changesets fixed group guarantees
it; the release script additionally refuses to publish when the two versions
differ. The first public release is `0.2.0`:

| Package | Before | After |
| ------- | ------ | ----- |
| `@blendsdk/year-planner-core` | `0.1.0` | `0.2.0` |
| `@blendsdk/react-year-planner` | `0.1.0` | `0.2.0` |

`0.x` means the public API is not stable. A minor release may include a
breaking change when the changeset names it and the API report diff is
reviewed. `1.0.0` is declared only when the public surface is frozen.

### Changelog generation

`pnpm version-packages` runs `changeset version`. It consumes every pending
changeset, writes `packages/core/CHANGELOG.md` and
`packages/react/CHANGELOG.md`, and deletes the consumed changeset files. The
generated changelog is committed with the version bump. The release contract
requires a `## <version>` heading in both changelogs before publishing.

### Package metadata

Both manifests gain or keep these fields:

| Field | Value |
| ----- | ----- |
| `license` | `MIT` |
| `repository` | `git+https://github.com/blendsdk/year-planner.git` |
| `homepage` | `https://github.com/blendsdk/year-planner#readme` |
| `bugs` | `https://github.com/blendsdk/year-planner/issues` |
| `publishConfig` | `{ "access": "public" }` |
| `files` | `["dist", "README.md", "LICENSE", "CHANGELOG.md"]`; `LICENSE` is a checked-in copy of the root MIT license |
| `sideEffects` | Core `false`; React `["**/*.css"]` |
| `exports` | Unchanged: core main; React main, `./styles.css`, `./adapters/fluent`, `./adapters/mui` |

The root `THIRD_PARTY_NOTICES.md` stays at the repository root (AR-14). Neither
package bundles a third-party runtime dependency, so the RD's illustrative
manifest entry for notices is not shipped inside each tarball; this deviation is
recorded in AR-14 and the release guide. A small `packages/*/LICENSE` copy is
checked in so `npm pack --dry-run` and `pnpm pack` agree.

### Tarball contents

The release script packs with `pnpm pack --pack-destination <tmp>` and inspects
the tarball manifest before publishing. It enforces:

- only `package.json`, `README.md`, `LICENSE`, `CHANGELOG.md` and `dist/**`;
- no `src/`, `etc/`, `temp/`, `coverage/`, test, story, fixture, photo or
  `node_modules` path;
- the React tarball depends on `@blendsdk/year-planner-core` at exactly the
  released core version, not `workspace:*`;
- every `.map` file contains no absolute path, no home-directory path and no
  `file://` URL; relative `../src/...` sources are expected and allowed;
- the packed version equals the manifest version;
- `npm pack --dry-run --json` reports the same allowlist (after the package
  `LICENSE` copy exists).

### Version and deprecation policy

`docs/migration.md` states:

- patch: fixes and documentation with no public API change;
- minor: additive API or a pre-1.0 breaking change recorded in a changeset;
- major: a breaking change after `1.0.0`;
- a deprecated export stays in the API report with a `@deprecated` note for at
  least one minor release before removal, where practical.

### Error Handling

| Error Case | Handling Strategy | AR Ref |
| ---------- | ----------------- | ------ |
| The two package versions differ | `release:check` and `release:publish` fail and name both versions | AR-2 |
| A changelog has no heading for the version | `release:check` fails and names the package | AR-13 |
| The packed React dependency is `workspace:*` or a range | The publish script fails before uploading | AR-5 |
| The tarball contains a source, test or photo path | The publish script fails and prints the path | AR-15 |
| A source map contains an absolute path | The publish script fails and prints the map | AR-15 |
| A manifest field is missing | The release contract fails and names the field | AR-13 |

> **Traceability:** every structural decision above is recorded in
> [00-ambiguity-register.md](00-ambiguity-register.md).

## Testing Requirements

- `tests/quality/release-metadata.spec.test.ts` owns the static metadata,
  changelog and fixed-group cases (ST-1–ST-5).
- `tests/quality/release-pack.spec.test.ts` owns the tarball and source-map
  cases (ST-6–ST-8) against synthetic fixtures; the real tarballs are proven by
  `release:check` after the build.
- `tests/quality/release-pack.impl.test.ts` owns the shared-helper failure
  modes.
- `pnpm release:check` runs the same checks against the real build in
  `pnpm verify`.
