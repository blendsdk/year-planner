# Ambiguity Register: Licensing and Theme Refresh

> **Status**: Licence, functional guide and 56-theme catalogue verified; visual-design rights confirmed; ready to commit and push
> **Last Updated**: 2026-11-13 18:40
> **Feature**: year-planner
> **CodeOps Artifact Schema**: 1

## Planning boundaries

- **Planning target:** functional layout documentation, replacement Material and
  Fluent palette themes, and replacement of MIT with a free internal-use,
  source-available licence restricting redistribution and external SaaS.
- **Context artifacts:** current theme implementation and styles, adapters,
  demo/Storybook, accessibility/print/visual tests, package/release contracts,
  documentation, requirements and historical plans.
- **Authorized modification set:** this plan directory; requirements RD-01,
  RD-03, RD-05, RD-06, RD-09, RD-10, RD-11 and RD-12; their requirement index,
  traceability and roadmap entries. The user selected “Approve scope
  (Recommended)” in the first planning question round.
- **Execution boundary:** AR #18 supersedes the AGPL direction and the pause in
  AR #17. The user authorized delivery and review of the complete internal-use
  licence. This includes the three licence copies, metadata, active notices,
  contribution terms, release note and licence checks. The theme execution plan
  remains incomplete; no commit, push or publication has taken place.

## Decisions

| # | Category | Ambiguity / Gap | Options Presented | User Decision | Status |
|---|----------|-----------------|-------------------|---------------|--------|
| 1 | Scope ambiguities | Feature, plan location and requirement modification authority | Plan plus affected requirement alignment / plan documents only | Approve scope under `year-planner`, plan `licensing-and-theme-refresh`, with the modification set above | ✅ Resolved |
| 2 | Feature gaps | Material palette source and family inventory | All 19 named Material 2014 families / Material 3 seed-based tonal themes | “19 named families (Recommended)” | ✅ Resolved |
| 3 | Feature gaps | Fluent palette source and family inventory | All 35 named Fluent UI v9 palette families / selected families | “All 35 families (Recommended)” | ✅ Resolved |
| 4 | Security & compliance (sensitive) | Exact AGPL version grant | `AGPL-3.0-only` / `AGPL-3.0-or-later` | User selected “AGPL-only, commercial later (Recommended)”: `AGPL-3.0-only` | ✅ Resolved |
| 5 | Scope ambiguities; stakeholder conflicts (sensitive) | Whether commercial licensing remains deferred | AGPL-only with commercial later / expand commercial planning now | Deferred: commercial terms and offering · owner: user · revisit: a future request to plan commercial licensing | ⏸ Deferred |
| 6 | Integration points | Licence checkpoint sequence | Plan approval, focused rights clarification, then a verified AGPL-first push | User accepted this sequence in the licensing-direction question; rights clarification is tracked in AR #16 | ✅ Resolved |
| 7 | Naming & terminology; data & state | Functional documentation name, content and treatment of historical references | Rename and replace / rewrite existing file | User selected “Rename and replace (Recommended)”: `docs/classic-year-layout.md`, with the single historical link updated | ✅ Resolved |
| 8 | Behavioral gaps; edge cases | Removed preset names, aliases, blue/yellow families, print and high-contrast utilities | Replace three colour presets and redesign utilities / remove all five names | User approved removal of `classic-blue`, `classic-yellow`, `modern` without aliases; 54 official families including blue/yellow; retain redesigned monochrome `high-contrast` and `print` | ✅ Resolved |
| 9 | UX & presentation | New default preset and light-surface presentation | `material-teal` / `fluent-teal` | User selected `material-teal`; all 54 palette themes use light surfaces | ✅ Resolved |
| 10 | Technical unknowns; integration points | Palette-to-token mapping, public naming and dependency boundary | Direct static-data design below | User selected “Approve details (Recommended)”, accepting the recorded recommendation | ✅ Resolved |
| 11 | Non-functional gaps | Contrast and geometry guarantees across all new themes | Contrast/geometry contract below | User selected “Approve details (Recommended)”, accepting the recorded recommendation | ✅ Resolved |
| 12 | UX & presentation; feature gaps | Theme selection in demo/Storybook and visual/print fixture migration | Integration contract below | User selected “Approve details (Recommended)”, accepting the recorded recommendation | ✅ Resolved |
| 13 | Integration points; data & state | Licence notices, package/version boundary and publication scope | Licensing boundary below | User selected “Approve details (Recommended)”, accepting the recorded recommendation | ✅ Resolved |
| 14 | Non-functional gaps | Verification commands and specification-first contract updates | Proportional planning checks; existing selector for implementation; required full gates | User selected “Approve details (Recommended)”, confirming the recorded gate ladder | ✅ Resolved |
| 15 | Naming & terminology | Repository wording about development tools | Neutral project wording | User requested no mention of the development method; use neutral wording throughout the plan, documentation, licence notices and release notes | ✅ Resolved |
| 16 | Security & compliance (sensitive) | Rights clarification before licence publication | Continue planning, clarify rights before licence push | User confirmed on 2026-11-13: “the visual design right are resolved”; the visual-design rights question is closed for the commit and push | ✅ Resolved |
| 17 | Scope ambiguities | Immediate work and pause boundary | User-directed change of sequence | User: “create the license documents first the pause”; prepare the root and two package licence documents, then pause | ✅ Resolved |
| 18 | Scope; licensing; contribution rights | Replace AGPL and finalize the internal-use licence now | User-directed internal-use model; tailored terms to cover browser delivery | User authorizes delivery and review of the full licence; free internal business use, no redistribution or external SaaS; source-available model supersedes AR #4, #6, #13 and #17 where inconsistent | ✅ Resolved |

## Resolution notes

### AR #18 — Current licensing authority

Completed locally on 2026-11-13. The [licence review](01-license-review.md)
records the scenario review, metadata/pack checks and successful full command,
including its report-only benchmark misses. No publication occurred.

The user requested free internal use while restricting redistribution and SaaS
offered to others, so the maintainer can build and sell complete solutions.
The user then authorized: “create and finalize a good license now so we can
continue. I authorize you to deliver the full license and review it too”.

The resulting Year Planner Internal Use License 1.0 is project-specific. It
expressly permits internal browser copies, controlled affiliates, contracted
development and infrastructure, private changes and sharing static outputs.
It excludes external user access, redistributed applications and services that
process others' planning requests. Earlier MIT grants, third-party terms and
GitHub's separate in-service rights remain intact. The contribution policy
adds a prospective copyright/patent grant to BlendSDK for intentionally
submitted contributions; ordinary use does not grant rights in private changes.

Review found that DCO 1.1 explicitly refers to an open-source licence. The
project therefore uses its own origin certification and contribution grant
through the existing `Signed-off-by` mechanism. The CI job retains its
historical `dco` identifier; the policy does not claim to be DCO 1.1.

The existing BlendSDK attribution is retained. No BV identity, jurisdiction,
price, storefront, support tier or paid solution terms have been invented.
AR #16 was resolved by the user on 2026-11-13: the visual-design rights question
is confirmed closed, and the user authorised the commit and push. The licence
review is a consistency review, not an independent legal opinion. The former
AGPL decision and paused checkpoint below are historical and do not control
current work.

### AR #2, #3, #7–#12 and #15 — Implemented catalogue and guide

Completed locally on 2026-11-13. The React package now exposes the 19 Material
2014 families, the 35 Fluent UI v9 families and the monochrome `high-contrast`
and `print` utilities. `material-teal` is the default. The removed names have no
aliases and follow the existing host-name fallback. All presets keep the
24-token shape and shared geometry; the unit suite measures every preset on all
base cell surfaces, and the axe matrix covers representative Material, Fluent
and utility states.

The functional guide replaces the fidelity review at
`docs/classic-year-layout.md`; its historical inbound link, documentation index
and VitePress sidebar are updated. Demo and Storybook selectors enumerate the
whole catalogue, the 2016 fixture is `material-teal`, the 2017 PRT-01 fixture is
`fluent-marigold`, and visual/print baselines are regenerated.

The catalogue is stored as a compact local table and the published CSS is
minified from the readable source. The React entry remains far below its 60 kB
budget; the total installed set stays within the existing 68 kB ceiling. No size
budget, coverage threshold, test skip or performance setting was relaxed.
Verification details are in [the theme and documentation review](02-theme-and-docs-review.md).

### AR #1 — Scope and existing requirements (historical)

At the start of planning, the requested changes affected current contracts
rather than a new component feature. The requirements then bound MIT (RD-01 and
RD-12), the preset list and default (RD-06), and old visual/print/documentation
expectations (RD-03, RD-05, RD-09, RD-10 and RD-11). Their historical
implementation records are context, not authority to repeat superseded
behaviour. AR #18 later replaced the licensing model, and the theme refresh was
implemented as recorded above.

### AR #2 — Material inventory

The approved families are red, pink, purple, deep purple, indigo, blue, light
blue, cyan, teal, green, light green, lime, yellow, amber, orange, deep orange,
brown, grey and blue grey. The source is the Material 2014 named palette
documented at <https://mui.com/material-ui/customization/color/> and available
through the existing MUI installation. Shade-to-token mapping is AR #10.

### AR #3 — Fluent inventory

A read-only inspection of the public `webLightTheme` export in installed
`@fluentui/react-components` 9.75.1 confirmed these 35 palette families:

Red, Green, DarkOrange, Yellow, Berry, LightGreen, Marigold, DarkRed, Cranberry,
Pumpkin, Peach, Gold, Brass, Brown, Forest, Seafoam, DarkGreen, LightTeal, Teal,
Steel, Blue, RoyalBlue, Cornflower, Navy, Lavender, Purple, Grape, Lilac, Pink,
Magenta, Plum, Beige, Mink, Platinum and Anchor.

The inventory uses all public `colorPalette*` families, not only the smaller
subset exposing `Background3`. Shade-to-token mapping is AR #10.

### AR #4 and AR #5 — Historical AGPL selection; superseded by AR #18

User's exact response to the licence-version question:

> I don't know which one to choose? Perhaps we could do the commercial license
> anyway and worry about the copyright later. What do you say?

This initial response requested advice rather than authorizing a licence or
commercial terms. Both AGPL variants can coexist with a separate commercial
grant for rights the licensor owns or is authorized to license. Choosing a
licence does not determine ownership of third-party visual material. No
reference-image comparison or rights clearance has been completed. Earlier MIT
grants are not revoked by changing future distribution terms.

An independent design challenger reviewed this sensitive decision. It agreed
that both AGPL variants permit a later commercial offering where the licensor
has sufficient rights, but recommended clarifying licensing authority before
the licence push. Its strongest counterargument was that the original may have
inspired only functional ideas; uncertainty is not evidence of infringement.

The initial recommendation was `AGPL-3.0-only` with commercial work
deferred. The challenge adds a focused ownership/provenance clarification before
recommending publication; it does not change the licence-version preference or
establish a legal conclusion. The user subsequently selected “AGPL-only,
commercial later (Recommended)”, approving `AGPL-3.0-only`, commercial deferral
and focused rights clarification before the licence push.
Confidence is high on the version distinction and moderate on the proposed
publication sequence because the rights facts are incomplete.

Primary references: [AGPL section 14](https://www.gnu.org/licenses/agpl-3.0.en.html#section14)
and [GNU FAQ on parallel licensing](https://www.gnu.org/licenses/gpl-faq.en.html#ReleaseUnderGPLAndNF).

### AR #6 — Historical licence-first checkpoint

The first scope question explicitly proposed an AGPL-first push after plan
approval. The user approved that scope, then approved focused rights
clarification before publication. Push behavior is specified through the
git-commit skill in push mode and the project's verification gates. AR #16 was
resolved on 2026-11-13, so the push is no longer blocked by the rights question.

### AR #13 and AR #16 — Source declaration and resolved rights question

The user confirms that the project source was created for this project and
that outside code is limited to declared dependencies. This declaration covers
the source and declared dependencies. The separate visual-design question was
also confirmed resolved by the user on 2026-11-13. The plan records that user
confirmation; it does not replace an independent legal opinion. No further
rights clarification is required before the authorised commit and push.

### AR #15 — Neutral wording

Describe the project, its behavior and its licence without discussing the
development method. Do not invent an authorship or rights-clearance assertion.

### AR #7 — Functional documentation and link authorization

The user approved renaming/replacing the review as
`docs/classic-year-layout.md`. It describes actual grid coordinates, labels,
context months, theming and print behavior. The modification set additionally
includes the single link in
`codeops/features/year-planner/plans/m1-foundation-core/99-execution-plan.md`,
solely to identify the current functional guide accurately. Historical
implementation results are not re-certified.

### AR #10 — Approved direct theme design

- Preserve the existing public 24-token theme shape and factory/provider API.
  Public names are `material-<kebab-family>` and `fluent-<kebab-family>`.
- Keep small static palette tables in the React package, using the installed
  MUI 9.5.0 and Fluent UI 9.75.1 public palette values. No runtime dependency,
  generator or new public factory is needed. A private helper expands a palette
  row into the existing frozen theme structure.
- Material input roles: muted = 50, light = 100, accent = 500, strong = 900.
  Fluent input roles: muted = `colorNeutralBackground2`, light = family
  `Background2`, accent = family `BorderActive`, strong = family `Foreground2`.
- Map surface to white; surfaceMuted to muted; weekend, highlight and annotation
  to light; context to `#f5f5f5`; ribbon to accent; selectionFill to accent at
  18% opacity. Primary text is black, muted text `#333333`, inverse text white,
  border `#424242`. Focus/selection outlines and foreground use strong when it
  reaches 3:1 against every base cell surface; otherwise black.
- Retain the existing shared geometry/typography; keep printScale = 1 for print
  and 0.72 for other presets. The two utility presets use black/white/grey only.
- `getPresetTheme()` returns undefined for removed names. Unknown/custom names,
  including removed names passed as strings, follow the current provider/default
  fallback and retain the supplied host class name. No aliases or new warnings.
- Keep the existing CSS-variable application path. Update default base values,
  remove duplicated obsolete preset rules and derive screen/print ribbon labels
  from the same readable text colour. Preset selection remains through
  `display.theme`; custom CSS classes and explicit CSS-variable overrides remain
  available. No separate CSS-only catalogue is introduced.

### AR #11 — Approved visual invariants

All 56 themes retain layout geometry. Built-in labels on their actual cell
surfaces and ribbon/header labels meet 4.5:1 text contrast; focus/selection
outlines and grid borders meet 3:1 against the base cell surfaces. Use the
existing contrast helpers and browser tests. Host-supplied colours retain the
existing documented host responsibility. Keep current coverage and size budgets.

A read-only palette feasibility probe confirmed 54 families and identified
Material amber/orange/yellow as needing neutral focus fallbacks. It also showed
that the initially considered `#424242` muted text and `#616161` borders were
too light for some Fluent tints; the proposed darker neutrals above address
those measured cases. This probe is design evidence, not implementation tests.

### AR #12 — Approved demo and migration coverage

Populate demo and full-demo Storybook selectors from the preset catalogue,
grouped into Material, Fluent and utility sections. The theme stories expose
both palette families through existing Storybook controls plus utility stories.
Update every active example, default, API report and affected test reference.
Replace the 2016 blue fixture with `material-teal`, and the 2017 yellow fixture
with `fluent-marigold`, including the designated print fixture. Keep dates,
layout and interaction assertions. Cover all presets with token/render checks;
use representative visual baselines and existing accessibility/print suites.
Theme examples use token defaults for their representative items so the chosen
palette is visible; independent custom-colour examples remain explicit.

### AR #13 — Current licence and release boundary (amended by AR #18)

Use identical complete Year Planner Internal Use License 1.0 terms in the root
and two package LICENSE files, with `SEE LICENSE IN LICENSE` in both published
manifests. Retain the existing `Copyright (c) 2026 BlendSDK` attribution
in the project/package notices; do not invent a BV name. Align active README,
contributor, release and licence-report wording. Preserve third-party licences
and add the upstream palette attribution to the React package's packed notices.
Record the pre-1.0 licence change in a lockstep minor changeset for both packages;
record the later preset change separately. Local finalization does not publish
the change. AR #16 is resolved, so the repository push is authorised; package
versioning, registry publication and release tags require a separate release
action.

### AR #14 — Approved verification ladder

User requested: do not run full verification unless needed. Planning changes
receive structural, Markdown-link and test-map validation. The map passed
`node "$CODEOPS_PLUGIN_ROOT/bin/codeops-test.mjs" check --strict` on 2026-11-13.
During implementation, use the existing task selector with the execution
baseline and explicit specification-file includes; invalid maps, selection
errors and shared paths fall back to the configured full command. The project's
`pnpm verify` fast gate and `pnpm verify:full` release gate remain authoritative
at their required boundaries; `pnpm verify:full` is required before the licence
push and final acceptance. Package manifests, app integration and the notice
generator are full-on paths in the existing map. Revise superseded specification
expectations from the approved requirements first, observe red, implement, then
observe green. Do not add a new test runner or map policy.

## Systematic review coverage

All twelve ambiguity categories are represented above. Selected domain lenses:

- **Web application:** theme application, accessibility, CSS boundaries,
  browser rendering and print behavior. No new network/authentication workflow
  has been requested.
- **Data and migration:** public preset-name compatibility, fallback behavior,
  release metadata and existing published licence grants. No stored planner-data
  schema migration has been requested.

The user originally reviewed the decisions in batches and confirmed the register
with “Approve details (Recommended)”, then explicitly amended the sequence in
AR #17. Sixteen decisions are resolved, one commercial-scope decision remains
deferred, and AR #16 was resolved by the user on 2026-11-13. AR #18 subsequently
changed the licensing model and authorized immediate finalization. The old
passed gate does not certify the theme work; the theme and documentation review
does.

## Historical paused checkpoint — 2026-11-13 15:44 (superseded by AR #18)

- Prepared `LICENSE`, `packages/core/LICENSE` and `packages/react/LICENSE`.
  Each contains the existing BlendSDK copyright attribution, an explicit
  `AGPL-3.0-only` project notice and the complete unmodified GNU AGPL v3 text.
- Validation: all three documents are byte-identical; the licence body matches
  <https://www.gnu.org/licenses/agpl-3.0.txt> byte-for-byte; scoped whitespace
  validation passed. No full verification was run for this paused preparation.
- Package manifests and existing licence-contract tests still target MIT.
  Their coordinated update and verification remain pending.
- Planning state: this register is complete; the eight authorized RDs and
  requirement README have partial revision edits. Other plan documents,
  traceability updates and roadmap synchronization have not been authored.
- Resume by finishing the plan and evidence alignment, accounting for these
  already-prepared licence files. Do not infer a completed implementation phase,
  passing product tests, rights clearance or publication from this checkpoint.
- No temporary files were created for this checkpoint.
