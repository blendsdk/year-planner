# Theme and documentation review

> **Date**: 2026-11-13
> **Scope**: Functional layout guide, 56-theme catalogue and active-example migration
> **Status**: Implemented and verified; visual-design rights confirmed; commit/push authorised
> **CodeOps Artifact Schema**: 1

## Deliverables

| Artifact | Purpose |
| --- | --- |
| `docs/classic-year-layout.md` | Functional description of the implemented month/day grid, labels, context months, theming and A3 print output |
| `docs/migration.md` | Replacement names for `classic-blue`, `classic-yellow` and `modern` |
| `packages/react/src/theme.ts` | 19 Material 2014 families, 35 Fluent UI v9 families, two monochrome utilities and the `material-teal` default |
| `packages/react/src/styles.css` | New default tokens, monochrome utility values and readable print ribbon labels; the published copy is minified |
| `tests/quality/css-minify.spec.test.ts` | Contract for the published CSS minifier |
| Demo and Storybook selectors | Catalogue-driven Material, Fluent and utility options |
| 2016/2017 fixtures | `material-teal` and `fluent-marigold` replacements, including PRT-01 |
| Visual and print baselines | Regenerated for the new default and representative themes |
| React `THIRD_PARTY_NOTICES.md` | Packed palette attribution for Material 2014 and Fluent UI v9 |

## Catalogue design

The public name union contains exactly 56 values. Material rows use shades 50,
100, 500 and 900. Fluent rows use `colorNeutralBackground2`, family
`Background2`, `BorderActive` and `Foreground2`. The shared expansion maps the
four roles to the existing 24 tokens:

- white page surface and `#f5f5f5` context;
- muted, light and accent roles to the existing surface, weekend, highlight,
  annotation, ribbon and selection tokens;
- black primary text, `#333333` muted text, white inverse text and `#424242`
  borders;
- the strong shade for focus, selection and foreground when it reaches 3:1 on
  every base cell surface. The three Material families whose 900 shade does not
  (yellow, amber and orange) carry black as their stored strong colour.

`material-teal` is the default for `createTheme()` and the component. Removed
names have no aliases: they follow the existing host-name fallback and keep the
supplied class name. All presets retain the shared geometry, and `print` alone
keeps `printScale: 1`.

The catalogue is stored as compact local colour blocks, not as a runtime
dependency on MUI or Fluent UI. The source stylesheet stays readable; the
package build writes a minified `dist/styles.css`. This keeps the React entry
and the total installed set within the existing size gates without relaxing a
budget.

## Functional guide and consumer migration

The guide replaces the historical fidelity review. It documents the 14-month
window, the fixed 37 Saturday-first columns, mirrored month labels, date and ISO
week placement, blank slots, context months, all 56 presets, the removed names,
token overrides and A3 pagination/fit behaviour. The single historical inbound
link in the completed M1 plan now points at the current guide.

Demo and full-demo selectors are generated from the preset catalogue and grouped
into Material 2014, Fluent UI v9 and Utility sections. The Themes story exposes
the catalogue through its theme control and keeps dedicated Material, Fluent and
utility stories. Theme examples use token defaults for representative items;
independent custom-colour examples remain explicit.

The 2016 grid uses `material-teal`; the 2017 grid and PRT-01 use
`fluent-marigold`. Dates, layout, interaction, page counts and text assertions
are unchanged.

## Substantive review

| Challenge | Resolution |
| --- | --- |
| The catalogue could become a runtime MUI/Fluent dependency | The React package stores only local colour data and keeps both design systems optional |
| 54 palette families could drift from the approved upstream values | Tables are generated from the installed public palettes and the spec test checks the exact role mapping for representative families |
| A strong shade may fail 3:1 on light cell surfaces | Every preset is measured on surface, muted, weekend and context; yellow, amber and orange use black |
| Ribbon text could be unreadable on light accents | The existing readable-text helper derives the screen and print ribbon label from the actual accent; all presets meet 4.5:1 |
| The 56-family table could exceed the bundle budget | Compact local blocks plus minified published CSS keep the React entry at 44.71 kB / 60 kB and the total at 67.95 kB / 68 kB |
| The functional guide could leave a stale historical link | The fidelity review is removed; the M1 execution record, docs index and VitePress sidebar point at the functional guide |
| Storybook and demo selectors could keep removed names | Both selectors are generated from `yearPlannerPresets`; no removed name remains in active examples |
| Visual baselines could silently pass with old colours | Baselines for Chromium, Firefox and WebKit were regenerated; the print matrix now covers 15/28/29-month boundaries |
| Axe coverage could miss the print utility | The Chromium axe matrix now includes `print` in addition to Material, Fluent, high-contrast, overflow, error and 36-month states |
| A CSS-only preset catalogue would duplicate the JS one | Only the two utility classes remain in CSS; palette values flow through the component's CSS variables |
| Minifying CSS could alter values or cascade layers | The minifier has a specification test for layers, custom properties, `calc()` and media-query spacing |
| A generator could add a new runtime support surface | No generator is shipped; the table is static source data and the build script is small and dependency-free |

## Verification

| Check | Observed result |
| --- | --- |
| React unit/component suite | 542 tests passed in 51 files; theme catalogue and contrast checks included |
| Core suite | 226 tests passed |
| Quality contracts | 216 tests passed in 28 files; traceability covers 196 criteria |
| Browser matrix | 172 passed, 74 existing project-specific skips (246 total) |
| Visual matrix | 42 passed across Chromium, Firefox and WebKit; baselines regenerated |
| Print matrix | 11 passed, 22 skips; 12/14/15/18/24/28/29/36-month pages and PRT-01 verified from PDFs |
| Axe matrix | 9 Chromium states passed, including `print`; no serious or critical violations |
| Contrast | All 56 presets meet 4.5:1 ribbon text and 3:1 focus/border on every base cell surface; primary and muted text meet 4.5:1 |
| Bundle size | React entry + CSS 44.71 kB / 60 kB; total 67.95 kB / 68 kB |
| Storybook | 183 stories across 16 files; static build and story contracts pass |
| Docs site | 429 files; classic layout page builds; site links and Storybook/TypeDoc embeds pass |
| Package contents | React tarball includes `THIRD_PARTY_NOTICES.md`; published CSS is minified; tarball allowlist passes |
| Licence and notices | Three identical licence copies; palette attribution in the packed React notices; changeset pending |
| Strict performance | 10 passed, 1 existing project-specific skip |
| Report-only benchmark | 21 pass, 7 miss, 1 above the 2x ceiling; initial-render p95 1327.90 ms versus the 400 ms budget, recorded without changing enforcement |
| Audit | No high/critical findings; two moderate dev-only advisories reported |
| Full gate | `pnpm verify:full` passed; the later theme-gallery story refinement was verified with `pnpm storybook:build`, `pnpm test:quality` and the Chromium Storybook spec |

The full gate includes typecheck, lint, coverage, quality contracts, licence
report, build, API report, size, Storybook, TypeDoc, docs site, pack checks,
release checks, Playwright, three timezones, audit, strict performance, the
report-only benchmark and the clean consumer. Report-only benchmark misses remain
documented; no budget or threshold was relaxed.

The browser gate found an unrelated preview server occupying the default demo
port. The Playwright config now accepts `PLAYWRIGHT_DEMO_PORT`, and the final run
used a free port. The default remains `4173`; the security spec reads the same
port variable.

## Publication boundary

Local implementation is complete. The user confirmed on 2026-11-13 that the
visual-design rights question is resolved and authorised the commit and push.
This work does not perform a release: no tag, versioning, registry publication
or Pages deployment is included. Release-time registry, provenance, Pages and
branch-protection actions remain in `docs/releasing.md`.
