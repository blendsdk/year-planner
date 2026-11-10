# RD-12: Release, Versioning and Maintenance

> **Document**: RD-12-release-maintenance.md
> **Status**: Draft
> **Created**: 2026-11-10
> **Project**: Year Planner for React
> **Depends On**: RD-01 through RD-11
> **CodeOps Artifact Schema**: 1

---

## Feature Overview

Defines how the two packages are versioned, published, maintained and supported.
The project is MIT open source with a DCO; there is no commercial license or
CLA. Releases are lockstep and provenance-signed.

---

## Functional Requirements

### Must Have

- [ ] Changesets `fixed` group for `@blendsdk/year-planner-core` and
  `@blendsdk/react-year-planner`; both packages always share one version.
- [ ] Pre-1.0 `0.x` versioning until the public API is stable; changelog per
  package; SemVer rules documented.
- [ ] npm trusted publishing via GitHub Actions OIDC; `npm publish --provenance`;
  no long-lived `NPM_TOKEN`.
- [ ] Publish core before React; React depends on the exact core version.
- [ ] GitHub release with tag, changelog and package links.
- [ ] Repository starts private and becomes public at the first release after
  license/asset review.
- [ ] Branch protection on `main`: required CI checks, DCO, review, no direct
  pushes.
- [ ] Issue/PR templates, CODE_OF_CONDUCT, SECURITY, CODEOWNERS and a support
  policy stating best-effort community support with no SLA.
- [ ] Security response process: private vulnerability reporting, triage,
  coordinated disclosure, dependency updates.
- [ ] Release checklist: `pnpm verify`, API report, docs build, Storybook build,
  print sample, browser/React matrix, changelog, provenance.
- [ ] `DEFERRED.md` and README limitations reviewed before release.
- [ ] Version/deprecation policy: breaking changes in major versions; deprecation
  notes at least one minor before removal where practical.
- [ ] Package `repository`, `homepage`, `bugs`, `license`, `exports` and
  `publishConfig.access=public` are correct.

### Should Have

- [ ] A `release` workflow manual approval for the first public release.
- [ ] A `changeset status` check in PRs.
- [ ] Renovate/Dependabot with grouped minor updates.
- [ ] A post-release smoke install from npm in a clean environment.

### Won't Have (Out of Scope)

- Commercial licensing, CLA, paid support tiers or SLAs.
- A hosted SaaS, backend or marketplace listing.
- Multi-major documentation versioning in R1.
- Long-term support branches before 1.0.

---

## Technical Requirements

### Release workflow

```text
PR → CI (typecheck, lint, unit, e2e, visual, a11y, print, build, api-report)
  → DCO + review + branch protection
  → merge to main
  → changesets release PR
  → merge release PR
  → GitHub Actions release job (OIDC)
  → npm publish core, then react (provenance)
  → GitHub release + docs deploy
  → clean install smoke test
```

### Package metadata

```json
{
  "license": "MIT",
  "repository": { "type": "git", "url": "https://github.com/blendsdk/year-planner" },
  "publishConfig": { "access": "public" },
  "exports": { ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" } }
}
```

### Support policy

- Best-effort community support through GitHub issues/discussions.
- No SLA, no guaranteed response time, no 24/7 support.
- Security reports handled privately; critical fixes prioritized.
- Release cadence: as needed; no fixed calendar promise.

### Complexity

Release automation: **M**. Governance/support: **S**.

---

## Integration Points

- RD-01 supplies CI and package metadata.
- RD-10 supplies the release gate evidence.
- RD-11 supplies docs/Storybook artifacts for the release.
- All RDs supply acceptance criteria to the release checklist.

---

## Scope Decisions

| Decision | Options Considered | Chosen | Rationale | AR Ref |
|---|---|---|---|---|
| Versioning | Independent, lockstep | Lockstep | Coupled core/React packages | AR #27 |
| Publishing auth | Token, OIDC | OIDC provenance | No long-lived secrets | AR #27 |
| Repo visibility | Public immediately, private first | Private first, public at release | Avoid publishing uncleared assets | AR #3, #30 |
| Support | SLA, best effort | Best effort | Open-source project, no commercial model | AR #32 |
| License | MIT, Apache, dual | MIT + DCO | User decision | AR #1 |

---

## Security Considerations

- **Data sensitivity**: Release artifacts contain code and synthetic fixtures
  only.
- **Input validation**: Release workflow validates package contents and versions
  before publishing.
- **Authentication & authorization**: npm OIDC trusted publishing; GitHub
  environment protection; least-privilege permissions.
- **Injection risks**: No secrets in build logs; no untrusted scripts from PRs
  with release credentials.
- **Encryption needs**: HTTPS for npm/GitHub; provenance attestations.
- **Rate limiting**: N/A.
- **Infrastructure**: No servers; GitHub Actions only. Branch protection and
  required checks.

---

## Acceptance Criteria

1. [ ] Both packages publish the same version from one Changesets release.
2. [ ] `npm publish --provenance` succeeds through GitHub OIDC; no long-lived
   npm token is stored.
3. [ ] React package depends on the exact matching core version.
4. [ ] A fresh install from npm in a clean Vite app renders the component and
   imports CSS successfully.
5. [ ] The GitHub release links the changelog, packages and docs.
6. [ ] Branch protection requires CI, DCO and review on `main`.
7. [ ] `SECURITY.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md` and issue/PR
   templates exist and are linked from the README.
8. [ ] The support policy states best-effort support and no SLA.
9. [ ] The release checklist includes `pnpm verify`, API report, docs build,
   Storybook build, print sample, browser/React matrix and changelog.
10. [ ] The first public release occurs only after license and asset review;
    photos/legacy code are absent.
11. [ ] Security requirements verified: OIDC only, least-privilege CI, no secrets,
    no untrusted release scripts.
