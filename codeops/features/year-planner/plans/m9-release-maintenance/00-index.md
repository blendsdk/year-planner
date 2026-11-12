# Release, Versioning and Maintenance Implementation Plan

> **Feature**: Reproducible lockstep release automation, package metadata, governance and support documents, and an honest release checklist for the first public publication
> **Status**: Execution Complete
> **Created**: 2026-11-12 19:55
> **Implements**: year-planner/RD-12
> **CodeOps Artifact Schema**: 1

## Overview

RD-12 turns the repository from a verified development tree into a release-ready
open-source project. The code and documentation are complete through RD-11; the
packages are still `0.1.0`, unpublished, and carry no package changelogs,
homepage, bug tracker or publish configuration. A catch-all CODEOWNERS exists;
five changesets are pending. There is no version or release
workflow, no branch protection, no support policy and no written release
sequence; CODEOWNERS exists with a catch-all owner. Six reviewed changesets are waiting to become the first
release.

This plan adds no product behavior. It makes the first release repeatable: a
Changesets fixed group bumps both packages to one version; a maintainer opens a
normal release PR so DCO and CI run; and a manually approved `release.yml`
builds and packs in a credential-free job, publishes core then React with
`npm publish --provenance` over GitHub OIDC, creates one `v<version>` GitHub
release and dispatches the docs deployment. The npm bootstrap exception is
recorded: `0.2.0` is published manually to create the packages, then `0.2.1`
is the first provenance-signed release.

The repository is private, the current GitHub plan cannot enable branch
protection, and no npm maintainer is authenticated in this environment. The plan
therefore implements and proves every automatable step, records the two verified
external constraints, and leaves the owner-only actions — first-package
bootstrap, repository visibility, branch-protection apply and the actual
publish — in a release checklist that names the exact commands.

## Minimum-Sufficient Baseline

**Original goal:** deliver RD-12's versioning, release automation, package
metadata, governance and maintenance contract so the first public release is
reproducible and auditable.

**Smallest viable design:** keep Changesets and the existing pnpm workspace;
commit the lockstep `0.2.0` version and generated changelogs; add package
metadata and short READMEs; add two workflows (version PR, manual release); add
one publish script that packs with pnpm and publishes with npm; add one release
check script; add governance documents and a release checklist; pin every
action to a commit SHA; extend the existing consumer check with a registry mode.

**Excluded machinery:** no new release framework, no semantic-release, no
self-hosted registry, no npm token secret, no Vercel/Netlify deployment, no
multi-major documentation versioning, no LTS branches and no paid support
surface. The existing Changesets CLI, GitHub Actions, pnpm pack and npm
provenance are reused.

**Approved complexity:** None beyond RD-mandated release machinery. The two
workflows, the publish script and the branch-protection script are the release
surface named by RD-12; each is tested by a contract or a dry run.

## Document Index

| #   | Document                                                        | Description                                      |
| --- | --------------------------------------------------------------- | ------------------------------------------------ |
| AR  | [Ambiguity Register](00-ambiguity-register.md)                  | Zero-Ambiguity Gate decisions (audit trail)      |
| PF  | [Preflight Report](00-preflight-report.md)                      | Independent audit, findings and resolutions      |
| 00  | [Index](00-index.md)                                            | This document — overview and navigation          |
| 01  | [Requirements](01-requirements.md)                              | RD-12 delta view and plan-local decisions        |
| 02  | [Current State](02-current-state.md)                            | Existing versions, workflows, metadata and gaps  |
| 03  | [Versioning and Packaging](03-01-versioning-packaging.md)       | Lockstep versions, changelogs, metadata, packs   |
| 04  | [Release Automation](03-02-release-automation.md)               | Human release PR, OIDC publish, docs dispatch    |
| 05  | [Governance and Support](03-03-governance-support.md)           | Community files, security process, protection    |
| 07  | [Testing Strategy](07-testing-strategy.md)                      | ST-cases and verification                        |
| 99  | [Execution Plan](99-execution-plan.md)                          | Phases, sessions and task checklist              |

## Quick Reference

### Commands added or changed

```bash
pnpm version-packages   # changeset version (lockstep bump + changelogs)
pnpm release:check      # versions, changelogs, metadata, packs, source maps
pnpm release:publish    # pack core then React, publish with provenance
pnpm release:publish --dry-run   # the same checks without publishing
pnpm release:smoke      # clean npm install of the released versions
pnpm verify             # gains release:check after the build
```

### Key Decisions

| Decision | Outcome | AR |
| -------- | ------- | -- |
| Scope | RD-12 only; release operations stay owner actions | AR-1 |
| First version | `0.2.0`, lockstep from the five pending changesets | AR-2 |
| Trigger | Human release PR; `release.yml` is manual | AR-3 |
| npm auth | Manual `0.2.0` bootstrap, then `0.2.1` via OIDC | AR-4, AR-5 |
| GitHub release | One `v<version>` tag with changelog and package links | AR-6 |
| Docs | Release dispatches the existing Pages workflow | AR-7 |
| Protection | Idempotent script; requires a second reviewer and a public repo | AR-8, AR-9 |
| Governance | CODEOWNERS, SUPPORT, expanded SECURITY, release checklist | AR-16–AR-18, AR-20 |
| Pinning | Every action at a full commit SHA | AR-19 |
| Credentials | Build and publish split; publish installs nothing | AR-23 |
| Owner setup | Environment, private reporting, alerts, Pages, trusted publisher | AR-27 |
| Traceability | RD-12-AC-01..13; manual release ACs recorded as `partial` | AR-22 |

## Specialist Agents

| Role | Kind | Use | AR Ref |
| ---- | ---- | --- | ------ |
| `security-auditor` | reviewer | Phase 2 — OIDC scope, workflow permissions, environment guard, publish script; re-checked in Phase 3 | AR-4, AR-23 |
| `correctness-reviewer` | reviewer | Every phase — version/metadata accuracy, pack and checklist correctness | AR-2, AR-5, AR-24 |

_Detection evidence: `.opencode/agents/security-auditor.md` and
`.opencode/agents/correctness-reviewer.md` already exist, and
`codeops/codeops.json` sets strict quality with independent review. The plan
adds release workflows with `id-token: write`, `contents: write` and a publish
script, so a workflow security review is warranted. No new specialist is
proposed; candidate creation is reserved authority._

## Related Files

| File | Role |
| ---- | ---- |
| `codeops/features/year-planner/requirements/RD-12-release-maintenance.md` | Owning requirements |
| `codeops/features/year-planner/requirements/00-traceability.md` | AC matrix; gains RD-12 rows |
| `.changeset/config.json` | Fixed group and access policy |
| `.changeset/*.md` | Six pending release notes consumed by `changeset version` |
| `packages/core/package.json`, `packages/react/package.json` | Version, metadata, files and exports |
| `packages/core/CHANGELOG.md`, `packages/react/CHANGELOG.md` | Generated per-package changelogs |
| `packages/core/README.md`, `packages/react/README.md` | Short package landing pages |
| `scripts/lib/release-manifest.mjs`, `.d.mts` | Shared version, tarball and source-map checks |
| `scripts/release-publish.mjs`, `scripts/release-publish.d.mts` | Pack, validate, publish and release |
| `scripts/release-check.mjs`, `scripts/release-check.d.mts` | Release readiness gate |
| `scripts/apply-branch-protection.mjs`, `scripts/apply-branch-protection.d.mts` | Idempotent protection apply/check |
| `scripts/clean-consumer.sh` | Packed consumer; gains `--registry` |
| `.github/workflows/release.yml` | Manual, environment-guarded publish |
| `.github/workflows/ci.yml`, `.github/workflows/pages.yml` | Pinned actions; `changeset` job |
| `.github/CODEOWNERS` | Review ownership |
| `.github/dependabot.yml` | Grouped dependency updates |
| `SUPPORT.md` | Best-effort support policy |
| `SECURITY.md` | Expanded response process |
| `docs/releasing.md` | Release checklist, bootstrap, rollback |
| `docs/migration.md` | SemVer and deprecation policy (extended) |
| `README.md`, `CONTRIBUTING.md` | Community and release links |
| `tests/quality/release-metadata.spec.test.ts` | Version, metadata and changelog contract |
| `tests/quality/release-workflow.spec.test.ts` | Workflow, OIDC, pinning and guard contract |
| `tests/quality/release-governance.spec.test.ts` | Governance, support and checklist contract |
| `tests/quality/release-pack.spec.test.ts` | Tarball, manifest and source-map oracle |
| `tests/quality/release-pack.impl.test.ts` | Shared-helper failure modes |
