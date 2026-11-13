# RD-12: Release, Versioning and Maintenance

> **Document**: RD-12-release-maintenance.md
> **Status**: Implemented — licence and notices verified; visual-design rights confirmed; commit/push authorised
> **Created**: 2026-11-10
> **Project**: Year Planner for React
> **Depends On**: RD-01 through RD-11
> **CodeOps Artifact Schema**: 1

---

## Feature Overview

Defines how the two packages are versioned, published, maintained and supported.
The project uses Year Planner Internal Use License 1.0 with a signed origin
certification and contribution grant. Commercial solution terms and pricing remain deferred.
Releases are lockstep and provenance-signed.

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
- [ ] Branch protection on `main`: required CI checks, sign-off, review, no direct
  pushes.
- [ ] Issue/PR templates, CODE_OF_CONDUCT, SECURITY, CODEOWNERS and a support
  policy stating best-effort community support with no SLA.
- [ ] Security response process: private vulnerability reporting, triage,
  coordinated disclosure, dependency updates.
- [ ] Release checklist: `pnpm verify:full`, API report, docs build, Storybook
  build, print sample, browser/React matrix, changelog, provenance, package
  contents check, `docs/renderer-spike.md` + renderer ADR.
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

- Commercial solution terms, pricing, paid support tiers or SLAs.
- A hosted SaaS, backend or marketplace listing.
- Multi-major documentation versioning in R1.
- Long-term support branches before 1.0.

---

## Technical Requirements

### Release workflow

```text
PR → CI (typecheck, lint, unit, e2e, visual, a11y, print, build, api-report)
  → sign-off + review + branch protection
  → merge to main
  → changesets release PR
  → merge release PR
  → GitHub Actions release job (OIDC)
  → npm publish core, then react (provenance)
  → GitHub release + docs deploy
  → clean install smoke test
```

### Package metadata

React package manifest (the core package uses the same fields without
`./styles.css` and adapter exports):

```json
{
  "type": "module",
  "license": "SEE LICENSE IN LICENSE",
  "repository": { "type": "git", "url": "https://github.com/blendsdk/year-planner" },
  "homepage": "https://github.com/blendsdk/year-planner#readme",
  "bugs": { "url": "https://github.com/blendsdk/year-planner/issues" },
  "publishConfig": { "access": "public" },
  "files": ["dist", "README.md", "LICENSE", "CHANGELOG.md", "THIRD_PARTY_NOTICES.md"],
  "sideEffects": ["**/*.css"],
  "exports": {
    ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" },
    "./styles.css": "./dist/styles.css",
    "./adapters/fluent": { "types": "./dist/adapters/fluent.d.ts", "import": "./dist/adapters/fluent.js" },
    "./adapters/mui": { "types": "./dist/adapters/mui.d.ts", "import": "./dist/adapters/mui.js" }
  }
}
```

- GitHub Actions are pinned to full commit SHAs and run with explicit
  `permissions`.
- `pnpm audit --prod` (or an equivalent SCA tool) runs in CI; high/critical
  findings block release.
- `npm pack --dry-run` is reviewed before publishing; no source maps pointing at
  private paths, no test fixtures, no photos.

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
| Support | SLA, best effort | Best effort | Community support; no paid tier approved | AR #32 |
| License | Internal-use source-available terms | Year Planner Internal Use License 1.0 + signed origin certification + contribution grant | Free internal business use; redistribution and external services require separate permission | [Refresh AR #18](../plans/licensing-and-theme-refresh/00-ambiguity-register.md) |

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
6. [ ] Branch protection requires CI, sign-off (job `dco`) and review on `main`.
7. [ ] `SECURITY.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md` and issue/PR
   templates exist and are linked from the README.
8. [ ] The support policy states best-effort support and no SLA.
9. [ ] The release checklist includes `pnpm verify:full`, API report, docs build,
   Storybook build, print sample, browser/React matrix, changelog and
   `npm pack --dry-run` review.
10. [ ] The first public release occurs only after license and asset review;
    photos/legacy code are absent.
11. [ ] GitHub Actions are pinned to full commit SHAs; `npm pack --dry-run`
    contains only the `files` allowlist.
12. [ ] `pnpm audit --prod` (or equivalent SCA) reports no high/critical
    vulnerabilities before release.
13. [ ] Security requirements verified: OIDC only, least-privilege CI, no secrets,
     no untrusted release scripts.
14. [ ] Project/package notices state the internal-use licence consistently, retain the
     existing BlendSDK attribution and preserve third-party licences. The React
     package includes the palette notices. A lockstep minor changeset records
      the pre-1.0 licence break; the later preset change gets its own release note.
      The user confirmed the visual-design rights question resolved on
      2026-11-13 and authorised the commit/push; package publication is a
      separate release action. Earlier MIT grants remain valid. See
      [refresh AR #16, #18](../plans/licensing-and-theme-refresh/00-ambiguity-register.md).
