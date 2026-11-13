# Internal-use licence review

> **Date**: 2026-11-13
> **Scope**: Local licence finalization authorized in AR #18
> **Status**: Finalized and verified; visual-design rights confirmed; commit/push authorised
> **Completed**: 2026-11-13 16:47
> **CodeOps Artifact Schema**: 1

## Deliverables

| Artifact | Purpose |
| --- | --- |
| Root and both package `LICENSE` files | Complete Year Planner Internal Use License 1.0, with identical text |
| `docs/licensing.md` | Permission scenarios, transition guidance and review limits |
| `CONTRIBUTING.md` | Signed origin certification and prospective copyright/patent contribution grant |
| Both package manifests and existing contract checks | `SEE LICENSE IN LICENSE`; packed licence inclusion |
| Active README, support, release and notice documents | Consistent source-available wording |
| `.changeset/internal-use-license.md` | Pending lockstep minor licence-change note |

## Substantive review

The review compared the complete terms with the requested free-internal-use,
no-redistribution and no-customer-SaaS model. The public guide contains the
scenario matrix. This is a drafting and repository-consistency review, not a
legal opinion or an independent ownership investigation.

| Challenge | Resolution in the delivered text |
| --- | --- |
| “Noncommercial” would exclude internal use by businesses | Section 2 explicitly permits for-profit internal use without a fee, revenue threshold or user limit |
| A React application supplies copies to browsers | Section 3 expressly permits internal browser/device delivery and private infrastructure |
| Cloud hosting and contractors could be prohibited as redistribution | Section 3 grants limited copies and access for contracted work, with use, protection and deletion duties |
| A vendor could label customer SaaS as each customer's internal use | Sections 3–4 distinguish contracted deployments from shared/white-label planner services and external user access |
| Free SaaS or an output-only API could bypass a paid-service restriction | Section 4 covers free/paid and direct/indirect services, including planning requests returned only as outputs |
| Sharing a client's construction schedule could accidentally breach the licence | Sections 2 and 5 allow planning one's own customer work and sharing static outputs, including their rendered appearance |
| A fork or modified package could claim unrestricted redistribution | Sections 1 and 4 cover portions, modified versions, compiled code and embedded products |
| An absolute redistribution ban could contradict GitHub's separate service grant | Section 6 preserves the scope of separately granted in-service viewing/forking rights |
| Relicensing could falsely claim to withdraw prior MIT rights | Section 8 and the guide preserve earlier grants, including unchanged material already offered under MIT |
| The maintainer might lack distribution rights in future contributions | The prospective contribution grant explicitly authorizes redistribution, sublicensing and commercial derivatives; private changes are excluded |
| DCO 1.1 assumes an open-source licence | Replaced the policy with a project-specific origin certification and grant accepted via sign-off; the CI job's historical `dco` identifier is explained |
| A custom licence could silently relicense dependencies or claim others' ownership | Sections 1, 7 and 8 preserve third-party licences and limit each grant to controlled rights |
| A licence change could retroactively change future recipients' terms | Section 12 preserves the terms of copies already received under this version |
| Missing operational legal terms | Sections 6–12 cover notices, ownership, separate grants, termination/cure, warranty, liability and interpretation |

## Verification evidence

| Check | Observed result |
| --- | --- |
| Specification-first licence contract run | 2 expected failures, 23 passed before replacing AGPL text and MIT metadata |
| Full quality-contract run after alignment | 27 files, 211 tests passed |
| Final contribution-policy documentation checks | 3 files, 30 tests passed after clarifying the historical `dco` job name |
| Three licence files | Byte-identical, 10,784 bytes each |
| SHA-256 of each licence | `176d1e96d352da3f890269c0f3dd12684a25b80bc3cdca06319bb9094549b370` |
| Manifest JSON and inclusion | Both parse; both declare `SEE LICENSE IN LICENSE` and include `LICENSE` |
| `pnpm test:licenses` | `THIRD_PARTY_NOTICES.md is current`; only the project introduction changed |
| Strict test-map check | `map ok` |
| `bash -n scripts/toolchain-check.sh` | Passed; ShellCheck is not installed in this environment |
| Scoped whitespace check | Passed |
| `pnpm verify:full` | Completed successfully; required because package manifests and scripts are full-on map paths |
| Unit/component coverage | Core: 24 files, 226 tests passed; React: 51 files, 535 tests passed |
| Typecheck, lint, build, API, size and site | Passed; Biome checked 284 files; combined docs site contains 429 files |
| Browser matrix | 168 passed, 66 existing skips; no skip or quarantine changed |
| Timezones | 226 core tests passed in each of UTC, Pacific/Kiritimati and America/Los_Angeles |
| Dependency audit | Gate passed: no high/critical findings; two moderate advisories reported |
| Strict performance suite | 10 passed, 1 existing project-specific skip |
| Benchmark runner | 11 passed, 11 existing project-specific skips; report-only measurements: 17 pass, 11 miss, 1 above the 2x ceiling |
| Report-only benchmark detail | Initial-render p95 1262.60 ms versus 400 ms budget; recorded without changing enforcement policy |
| Package checks and clean consumer | `publint`, `attw`, release checks, packed types/CSS and production consumer build passed |
| Actual packed licences | Both generated 0.3.0 tarballs contain the exact root LICENSE and `SEE LICENSE IN LICENSE` metadata |
| Local links and neutral wording | 52 local links across nine current documents resolved; neutral wording checked |

The full command succeeds because the separate benchmark report is configured
as report-only. Its misses are not evidence of meeting every performance budget.
The strict performance suite passed independently. The validation did not alter
runtime source, test skips, performance budgets or enforcement settings.

The quality run initially found three missing matrix entries from the earlier
approved requirement revisions and a documentation keyword false positive.
The missing entries now explicitly record pending theme/guide work as partial.
The exact acceptance-count assertion increased from 193 to 196. No runtime
assertions or coverage thresholds were relaxed. The ambiguous documentation
line was clarified without changing its meaning.

Baseline: the existing uncommitted working tree on `main`, including the earlier
licence and requirement preparation. Unrelated `.opencode` changes are not part
of this work. Full gate selection follows `codeops/test-map.json`; scoped passes
alone are not a release signal.

## Publication boundary and remaining work

| Item | Owner / boundary |
| --- | --- |
| Visual-design rights clarification | Resolved by the user on 2026-11-13; the rights question is closed for the commit and push |
| Licensor identity | Existing BlendSDK attribution retained; no BV legal identity supplied or invented |
| Commercial solution rights | Depends on ownership and valid contribution/dependency grants; no price or paid terms supplied |
| Repository/package publication | Commit and push authorised; no tag, versioning, registry publication or Pages deployment performed by this review |
| Theme refresh | Complete: 19 Material + 35 Fluent families, two utilities and default `material-teal` |
| Functional guide | Complete: the fidelity review is replaced and its historical inbound link updated |

The earlier AGPL preparation was local and superseded before publication.
Historical requirement and completed-plan records retain their old context;
current requirements and the refresh register point to the internal-use model.

## Cleanup

No task-authored scratch files remain. The command transcript was summarized
here before its temporary shell log was removed. Existing runtime-managed cache
directories and unrelated temporary files were preserved. Standard ignored
build/test outputs remain available for inspection in `release-packs/`,
`test-results/`, `playwright-report/`, package/demo `dist/`, `storybook-static/`,
`docs/api/` and `docs/.vitepress/dist/`; these are regenerated by project commands.
