# Execution Plan: Release, Versioning and Maintenance

> **Document**: 99-execution-plan.md
> **Parent**: [Index](00-index.md)
> **Last Updated**: 2026-11-12 20:36
> **Progress**: 13/55 tasks (24%)
> **CodeOps Artifact Schema**: 1

## Overview

Implement RD-12 in five phases: versioning and package metadata, release
automation, governance and support, release dry-run evidence, and the
traceability/evidence close-out. Every phase follows the specification-first
order: write the contract, prove red, implement, prove green, add
implementation tests, verify.

**🚨 Update this document after EACH completed task!**

---

## Implementation Phases

| Phase | Title | Tasks |
| ----- | ----- | ----- |
| 1 | Versioning and package metadata | 13 |
| 2 | Release automation | 15 |
| 3 | Governance and support | 13 |
| 4 | Release dry run and owner-action evidence | 7 |
| 5 | Traceability, evidence and final gate | 7 |

**Total: 55 tasks across 5 phases**

> **⚠️ EXECUTION RULE — APPLIES TO EVERY AGENT EXECUTING THIS PLAN:**
>
> Only the **numbered task lines** (`1.1.1`, `2.3.2`, …) count toward the Progress header. The
> `Deliverables` checkboxes are review reminders, not tasks. Every numbered task line appears
> exactly once. On implementation mark `[~]` with a timestamp; on verify pass promote to `[x]`;
> update the Progress header after every task. On a blocker mark `[!]` and append `Blocked: <reason>`.
>
> **Task gate scope:** `packages/*/package.json`, `scripts/**`, `package.json`, lockfiles and
> `.github/**` are full-on paths in `codeops/test-map.json`; those task gates run `pnpm verify`.
> `docs/**` is ignored by the map, so docs-only tasks still run `pnpm verify` manually because the
> contract tests read the docs. Phase gates run `pnpm verify`; the plan gate is `pnpm verify:full`, matching the
> documented phase/plan ladder. The quality project runs before the build, so the real tarball
> proof is `release:check` after the build in Phase 4.

---

## Phase 1: Versioning and package metadata

> **Phase baseline tree**: 5d4e0c72e6fb8a56a9063da604b726e79d78bb38
> **Lenses**: correctness, data and migration
> **Reasoning**: high — a wrong version, changelog or tarball becomes the published contract.

### Step 1.1: Specification tests

**Reference**: [03-01](03-01-versioning-packaging.md) · ST-1–ST-8 · AR-2, AR-5, AR-13, AR-15
**Objective**: Prove the version, changelog, metadata and tarball contracts are incomplete.

- [x] 1.1.1 [spec-author] Write the fixed-group, lockstep-version, changelog and metadata cases with `RD-12-AC-01`, `RD-12-AC-11` — `tests/quality/release-metadata.spec.test.ts` ✅ (completed: 2026-11-12 20:45)
- [x] 1.1.2 [spec-author] Write the tarball, exact-dependency and source-map cases with `RD-12-AC-03`, `RD-12-AC-11` — `tests/quality/release-pack.spec.test.ts` ✅ (completed: 2026-11-12 20:47)
- [x] 1.1.3 Run the new tests and record the red result — `pnpm test:quality` ✅ (completed: 2026-11-12 20:48)

### Step 1.2: Implementation

**Reference**: [03-01](03-01-versioning-packaging.md) · AR-2, AR-5, AR-13, AR-14, AR-15
**Objective**: Produce the lockstep `0.2.0` version, generated changelogs, package READMEs and complete metadata.

- [x] 1.2.1 Add the `version-packages` script — `package.json` ✅ (completed: 2026-11-12 20:29)
- [x] 1.2.2 Run `changeset version` and commit the lockstep `0.2.0` bump with both changelogs — `packages/*/package.json`, `packages/*/CHANGELOG.md` ✅ (completed: 2026-11-12 20:29)
- [x] 1.2.3 Add short package READMEs — `packages/core/README.md`, `packages/react/README.md` ✅ (completed: 2026-11-12 20:30)
- [x] 1.2.4 Add checked-in package LICENSE copies matching the root — `packages/core/LICENSE`, `packages/react/LICENSE` ✅ (completed: 2026-11-12 20:30)
- [x] 1.2.5 Add homepage, bugs, publishConfig and the files allowlist — `packages/core/package.json`, `packages/react/package.json` ✅ (completed: 2026-11-12 20:30)
- [x] 1.2.6 Add the first-release note to the SemVer and deprecation policy — `docs/migration.md` ✅ (completed: 2026-11-12 20:31)
- [x] 1.2.7 Add the shared release-manifest helpers and declarations — `scripts/lib/release-manifest.mjs`, `scripts/lib/release-manifest.d.mts` ✅ (completed: 2026-11-12 20:31)

### Step 1.3: Green, implementation tests and verify

- [x] 1.3.1 Prove green for ST-1–ST-8 — `pnpm test:quality` ✅ (completed: 2026-11-12 20:32)
- [x] 1.3.2 Add shared-helper failure cases (forbidden path, version mismatch, private map path) — `tests/quality/release-pack.impl.test.ts` ✅ (completed: 2026-11-12 20:32)
- [x] 1.3.3 Verify the phase — `pnpm verify` ✅ (completed: 2026-11-12 20:36)

**Deliverables**:
- [x] Both packages at `0.2.0` with generated changelogs
- [x] Complete package metadata, README, LICENSE and allowlisted files
- [x] Shared release-manifest helpers present
- [x] All phase verification passing

**Test slices**: `verification` (task); package manifests and scripts are full-on
**Task verify**: `pnpm verify` (full gate)
**Verify (gate)**: `pnpm verify`

---

## Phase 2: Release automation

> **Phase baseline tree**: recorded at phase start by the exec-plan skill.
> **Lenses**: correctness, security
> **Reasoning**: high — a bad workflow or publish order can publish the wrong artifact with credentials.

### Step 2.1: Specification tests

**Reference**: [03-02](03-02-release-automation.md) · ST-9–ST-17 · AR-3–AR-7, AR-19, AR-23, AR-24
**Objective**: Prove the release procedure, workflow, publish script and bootstrap documentation are missing.

- [ ] 2.1.1 [spec-author] Write the release-PR, workflow, main-guard, OIDC, permission and pinning cases with `RD-12-AC-02`, `RD-12-AC-13` — `tests/quality/release-workflow.spec.test.ts`
- [ ] 2.1.2 [spec-author] Write the publish-order, integrity, release-notes and bootstrap cases with `RD-12-AC-02`, `RD-12-AC-05` — `tests/quality/release-workflow.spec.test.ts`
- [ ] 2.1.3 Run the new tests and record the red result — `pnpm test:quality`

### Step 2.2: Implementation

**Reference**: [03-02](03-02-release-automation.md) · AR-3–AR-7, AR-19, AR-23, AR-24
**Objective**: Add the publish/check scripts, the guarded workflow, the pinned actions, the changeset job and the release guide.

- [ ] 2.2.1 Add the pack, validate, publish and release script — `scripts/release-publish.mjs`, `scripts/release-publish.d.mts`
- [ ] 2.2.2 Add the release readiness checker — `scripts/release-check.mjs`, `scripts/release-check.d.mts`
- [ ] 2.2.3 Add the manual, environment-guarded release workflow with separate build and publish jobs — `.github/workflows/release.yml`
- [ ] 2.2.4 Add `release:check`, `release:publish`, `release:smoke`, the `verify` hook and `release-packs/` to the ignore list — `package.json`, `.gitignore`
- [ ] 2.2.5 Pin every action to a full commit SHA — `.github/workflows/ci.yml`, `.github/workflows/pages.yml`, `.github/workflows/release.yml`
- [ ] 2.2.6 Add the informational `changeset status` job with `fetch-depth: 0` — `.github/workflows/ci.yml`
- [ ] 2.2.7 Add `--registry` to the consumer smoke with a bounded retry — `scripts/clean-consumer.sh`
- [ ] 2.2.8 Add the release-PR, bootstrap, publish and rollback guide — `docs/releasing.md`

### Step 2.3: Green, implementation tests and verify

- [ ] 2.3.1 Prove green for ST-9–ST-17 — `pnpm test:quality`
- [ ] 2.3.2 Add integrity-mismatch and flag-guard cases — `tests/quality/release-pack.impl.test.ts`
- [ ] 2.3.3 Prove the real build and pack path without publishing — `pnpm release:publish --dry-run --allow-dirty`
- [ ] 2.3.4 Verify the phase — `pnpm verify`

**Deliverables**:
- [ ] Manual release workflow with OIDC, main guard and split build/publish
- [ ] Publish/check scripts with shared validation
- [ ] Every action pinned to a commit SHA
- [ ] Release guide and registry smoke present
- [ ] All phase verification passing

**Test slices**: `verification` (task); workflows and scripts are full-on
**Task verify**: `pnpm verify` (full gate)
**Verify (gate)**: `pnpm verify`

---

## Phase 3: Governance and support

> **Phase baseline tree**: recorded at phase start by the exec-plan skill.
> **Lenses**: security, correctness
> **Reasoning**: high — branch protection, disclosure and support promises are public commitments.

### Step 3.1: Specification tests

**Reference**: [03-03](03-03-governance-support.md) · ST-18–ST-25, ST-27 · AR-8–AR-11, AR-16–AR-20
**Objective**: Prove CODEOWNERS, support, security response, branch protection, checklist and audit gate are incomplete.

- [ ] 3.1.1 [spec-author] Write the governance, support, security, CODEOWNERS, checklist and audit cases with `RD-12-AC-06`–`RD-12-AC-10`, `RD-12-AC-12` — `tests/quality/release-governance.spec.test.ts`
- [ ] 3.1.2 Run the new tests and record the red result — `pnpm test:quality`

### Step 3.2: Implementation

**Reference**: [03-03](03-03-governance-support.md) · AR-8–AR-11, AR-16–AR-20, AR-27
**Objective**: Add the governance files, protection script, dependency updates and release checklist.

- [ ] 3.2.1 Add path-specific review ownership — `.github/CODEOWNERS`
- [ ] 3.2.2 Add the best-effort support policy — `SUPPORT.md`
- [ ] 3.2.3 Expand the vulnerability response process — `SECURITY.md`
- [ ] 3.2.4 Add the idempotent branch-protection script with the reviewer prerequisite — `scripts/apply-branch-protection.mjs`, `scripts/apply-branch-protection.d.mts`
- [ ] 3.2.5 Add grouped Dependabot updates — `.github/dependabot.yml`
- [ ] 3.2.6 Add the pre-release, visibility/license, owner-setup, post-release and rollback sections — `docs/releasing.md`
- [ ] 3.2.7 Link the community and release documents — `README.md`, `CONTRIBUTING.md`
- [ ] 3.2.8 Review `DEFERRED.md` and the README limitations against the release scope — `DEFERRED.md`, `README.md`

### Step 3.3: Green, implementation tests and verify

- [ ] 3.3.1 Prove green for ST-18–ST-25 and ST-27 — `pnpm test:quality`
- [ ] 3.3.2 Record the branch-protection plan and reviewer constraints — `node scripts/apply-branch-protection.mjs --record`
- [ ] 3.3.3 Verify the phase — `pnpm verify`

**Deliverables**:
- [ ] Path-specific CODEOWNERS, support policy and expanded security process
- [ ] Branch-protection script and recorded 403/reviewer constraints
- [ ] Dependabot and complete release checklist
- [ ] Community links from the README
- [ ] All phase verification passing

**Test slices**: `verification` (task); workflows and docs are full-on
**Task verify**: `pnpm verify` (full gate)
**Verify (gate)**: `pnpm verify`

---

## Phase 4: Release dry run and owner-action evidence

> **Phase baseline tree**: recorded at phase start by the exec-plan skill.
> **Lenses**: correctness, security
> **Reasoning**: high — this phase proves the real tarballs and records exactly which release steps remain owner-only.

### Step 4.1: Dry run

- [ ] 4.1.1 Run the full release dry run — `pnpm release:publish --dry-run --allow-dirty`
- [ ] 4.1.2 Inspect both packed manifests, tarball path lists, source maps and the npm dry-run allowlist — `pnpm release:check`

### Step 4.2: Owner-action evidence

- [ ] 4.2.1 Record the branch-protection 403, missing environment and disabled security settings — `docs/releasing.md`
- [ ] 4.2.2 Verify the changeset status check behavior — `pnpm changeset status --since=origin/main`
- [ ] 4.2.3 Verify the registry smoke script shape without publishing — `bash -n scripts/clean-consumer.sh`

### Step 4.3: Verify

- [ ] 4.3.1 Run the fast gate — `pnpm verify`
- [ ] 4.3.2 Confirm no upload or visibility change occurred — `git status --short`, `gh repo view`

**Deliverables**:
- [ ] Dry-run tarball evidence with no upload
- [ ] Recorded owner-only release actions
- [ ] Fast gate passing
- [ ] No repository visibility or registry change

**Test slices**: `verification` (task)
**Task verify**: `pnpm verify` (full gate)
**Verify (gate)**: `pnpm verify`

---

## Phase 5: Traceability, evidence and final gate

> **Phase baseline tree**: recorded at phase start by the exec-plan skill.
> **Lenses**: correctness, maintainability
> **Reasoning**: high — the milestone closes only when every AC has an honest status.

### Step 5.1: Traceability

**Reference**: [03-03](03-03-governance-support.md) · ST-26 · AR-22, AR-29
**Objective**: Add the RD-12 rows and extend the checker through RD-12.

- [ ] 5.1.1 Add RD-12-AC-01..13 rows with explicit `proven`/`partial` status and blank title/file for partial rows — `codeops/features/year-planner/requirements/00-traceability.md`
- [ ] 5.1.2 Extend the traceability test and CLI default through RD-12; update the expected count to 183 — `tests/quality/traceability.spec.test.ts`, `scripts/check-traceability.mjs`, `scripts/lib/traceability.mjs`
- [ ] 5.1.3 Prove the matrix — `node scripts/check-traceability.mjs --through 12`

### Step 5.2: Evidence

- [ ] 5.2.1 Record the RD-12 evidence, dry-run results and release-time manual steps; update the hard-coded report expectations — `docs/test-report.md`, `tests/quality/ci-contract.spec.test.ts`
- [ ] 5.2.2 Update the roadmap to the plan and final stage — `codeops/features/year-planner/00-roadmap.md`

### Step 5.3: Final gate

- [ ] 5.3.1 Run the release gate — `pnpm verify:full`
- [ ] 5.3.2 Rebuild and verify the docs artifact — `pnpm docs:site -- --check-only`

**Deliverables**:
- [ ] Thirteen RD-12 rows with honest statuses
- [ ] Checker and CLI through RD-12
- [ ] RD-12 evidence and owner-action record
- [ ] Full release gate passing

**Test slices**: `core.unit`, `react.unit`, `verification` (task); final gate release
**Task verify**: `pnpm verify` (full gate)
**Verify (gate)**: `pnpm verify:full`

---

## Dependencies

```
Phase 1 (version/metadata) ──► Phase 2 (release automation) ──► Phase 4 (dry run)
        │                                │
        └────────► Phase 3 (governance) ─┴────────► Phase 5 (evidence)
```

Phase 2 needs the `0.2.0` version, changelogs and shared helpers from Phase 1.
Phase 3 extends the release guide created in Phase 2. Phase 4 needs all scripts
and the release guide. Phase 5 needs every contract green.

---

## Success Criteria

**Feature is complete when:**

1. ✅ All phases completed
2. ✅ `pnpm verify:full` passes
3. ✅ Both packages are at one `0.2.0` version with changelogs, README, LICENSE and complete metadata
4. ✅ `pnpm release:publish --dry-run` packs and validates both tarballs without uploading
5. ✅ The manual release workflow is OIDC-only, environment-guarded, main-only and fully SHA-pinned
6. ✅ Governance, support, security and release checklist documents exist and are linked
7. ✅ Branch-protection, environment and owner-only release actions are recorded honestly
8. ✅ Traceability covers RD-12
9. ✅ Post-completion project re-analysis (handled by the exec-plan skill)
