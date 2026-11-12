# Requirements: Documentation, Storybook and API Reference

> **Document**: 01-requirements.md
> **Parent**: [Index](00-index.md)
> **Source**: [RD-11](../../requirements/RD-11-documentation.md) — the OWNING requirements doc

## Scope of this plan (delta view)

### In this plan

- RD-11 Must Have — README quickstart, the fourteen documentation topics, an
  exhaustive Storybook site, TSDoc/API Extractor/TypeDoc, the GitHub Pages
  artifact, the runnable demo, the clean consumer, the test report and
  `DEFERRED.md`.
- RD-11 Should Have — Fluent UI v9 and MUI copy-paste examples, a migration and
  versioning page, and a checked-in architecture diagram.
- RD-11 acceptance criteria 1–13.
- The existing RD-10 evidence is cited, never recomputed.

### Deferred / out of this plan

- RD-12 release, versioning execution, package publication and maintenance —
  the next milestone.
- Issue #4 auto-fit — still an open product decision.
- A live GitHub Pages deployment — the RD keeps the repository private first and
  enables Pages at the public release (AR-2).
- Storybook MDX guide pages and a VitePress site — out of scope (AR-3).
- New accessibility or performance measurements — the RD-09/RD-10 evidence is
  the source of truth (AR-20).
- Live Pages publication — build and upload only; the deploy job is manual and
  `main`-only (AR-2, AR-9).

## Plan-local decisions

| Decision | Chosen | AR Ref |
| -------- | ------ | ------ |
| Guide layout | Flat `docs/*.md`, `docs/README.md` topic map, split `react-view.md` | AR-3, AR-4 |
| Quickstart shape | Complete README example plus an expanded getting-started page | AR-5 |
| Storybook gaps | PRT-01 + wrapper stories, built-in viewport, relative URLs | AR-6, AR-7, AR-23, AR-27 |
| API enforcement | Release tags, zero undocumented entries, fatal TypeDoc validation | AR-10, AR-11 |
| Docs artifact | `scripts/build-docs-site.mjs`; build packages first; root output | AR-8, AR-24 |
| Pages workflow | Build/upload on push, manual `main` deploy, PR docs-site job | AR-9, AR-25 |
| Quickstart install | Packed-tarball path until RD-12 publishes | AR-5, AR-26 |
| Honesty rules | Measured status, named misses, no conformance claim | AR-14, AR-18 |
| Traceability | RD-11 rows (partial first), checker and CLI through RD-11 | AR-16, AR-31 |
| Contract tests | Five spec + two impl files under `tests/quality/` | AR-17, AR-32 |
| Task verification | Full gate for full-on paths; phase baseline tree | AR-30 |

## Acceptance Criteria

The RD owns its acceptance criteria. This plan adds no plan-local ACs; every
RD-11 AC maps to a spec-test case in [07-testing-strategy.md](07-testing-strategy.md)
and to a row in `00-traceability.md`.

## Security scope

| Concern | This plan |
| ------- | --------- |
| Input validation, injection, XSS | No runtime input path is added. Guide examples use React escaping and no raw HTML; the docs contract scans fenced code blocks for `dangerouslySetInnerHTML`, `innerHTML` and `__html` (AR-29). |
| Authentication, authorization, rate limiting, encryption | N/A — no endpoint, service or credential is added. |
| Secrets | None. The Pages deploy uses GitHub OIDC (`id-token: write`), not a stored secret (AR-9). |
| Infrastructure | Least-privilege workflow permissions, no `pull_request_target`, no `write-all`, manual `main`-only deploy (AR-9). The Phase 4 security auditor reviews the workflow. |
| Data | Synthetic fixtures only; no real employee, patient or booking data. The docs asset allowlist excludes the unpublished `_reference/` material (AR-29). |
| Existing security suite | Unchanged and still required by `pnpm verify:full`. |
