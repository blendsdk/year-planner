# Findings Ledger: Release, Versioning and Maintenance

> **Purpose**: durable record of post-phase review rulings. One row per finding;
> identifiers and area tokens only, never prose.

| Finding | Phase | Severity | Area | Ruling |
| ------- | ----- | -------- | ---- | ------ |
| RV-001 | final | CRITICAL | release-publish/--packs | fixed — source maps are scanned inside the tarballs, no build tree required |
| RV-002 | final | MAJOR | release-check/pending-changesets | fixed — the guard is release:publish only; verify accepts a pending changeset |
| RV-003 | final | MAJOR | release-workflow/actions-write | fixed — docs dispatch moved to the publish job; smoke is read-only |
| RV-004 | final | MINOR | changelogs/RD-references | fixed — the generated changelogs no longer name an RD |
| RV-005 | final | MINOR | 00-index/count | fixed — five reviewed changesets |
| RV-006 | final | MINOR | ci/changeset-fetch | fixed — full `git fetch origin main` |
| RV-007 | final | MINOR | .opencode | rejected — the snapshot baseline included untracked tooling; no commit touched `.opencode` |
| RV-008 | final | OBSERVATION | release-manifest/changelog-boundary | fixed — exact version heading boundary |
| RV-009 | final | OBSERVATION | release-publish/flag-guards | fixed — `--packs` rejects a flag value; skip log is distinct |
| RV-010 | final | OBSERVATION | traceability/AC-11 | fixed — evidence names the workflow pinning proof |
| SA-001 | final | MAJOR | release-publish/--packs | fixed — same as RV-001 |
| SA-002 | final | MAJOR | release-workflow/actions-write | fixed — same as RV-003 |
| SA-003 | final | MINOR | release-workflow/token-scope | fixed — `persist-credentials: false` and `RELEASE_GITHUB_TOKEN` only |
| SA-004 | final | MINOR | release-publish/flag-guards | fixed — CI rejects `--bootstrap`; `--packs` rejects a flag value |
| SA-005 | final | MINOR | release-manifest/traversal | fixed — `..` and absolute entries rejected |
| SA-006 | final | MINOR | security/reporting-fallback | fixed — public minimal-issue fallback; visibility requires private reporting |
| SA-007 | final | INFO | ci/base-ref | fixed — `BASE_REF` environment variable |
| SA-008 | final | INFO | release-workflow/timeout | fixed — publish job timeout |
| SA-009 | final | INFO | release-workflow/pnpm | fixed — pnpm setup removed from the publish job |
| SA-010 | final | INFO | release-workflow/non-main | fixed — a failing guard job on a non-main dispatch |
