# Ambiguity Register: Year Planner for React

> **Status**: ✅ GATE PASSED — all 36 items resolved
> **Last Updated**: 2026-11-10 08:01
> **Bulk acceptance note**: On 2026-11-10 the user directed “proceed” after the
> presented defaults table and the preceding design decisions. Those defaults are
> recorded below as the user's accepted resolution. Any later change is a new
> register entry and an RD amendment.
> **CodeOps Artifact Schema**: 1

| # | Category | Ambiguity / Gap | Options Presented | User Decision | Status |
|---|----------|-----------------|-------------------|---------------|--------|
| 1 | Scope | Commercial model | Commercial license / MIT + DCO; open core; source-available | **MIT + DCO; no CLA; no commercial license.** User: “let go apache-2.0 or MIT all the way”; MIT selected. | ✅ Resolved |
| 2 | Naming | Product and package names | Various brand names; scoped vs unscoped | **Product “Year Planner for React”, brand “YearPlanner”; packages `@blendsdk/year-planner-core` and `@blendsdk/react-year-planner`.** User proposed the scope and accepted the hyphenated refinement. | ✅ Resolved |
| 3 | Scope | Repository location and visibility | Separate vs BlendSDK monorepo; public vs private first | **Separate repo `blendsdk/year-planner`; private first, public at first release.** User: create repo at `blendsdk/year-planner`; default accepted. | ✅ Resolved |
| 4 | Scope | R1 feature boundary | Full handoff platform vs focused annual planner | **Focused R1:** date core, 12–36 month layout, layers/visibility, ribbons/overlaps/overflow, select/paint/erase/create/move/resize/cancel, local undo, keyboard, theming, customization, print, controlled items, mock validation, Storybook/docs. | ✅ Resolved |
| 5 | Scope | Timed events in R1 | Full timed editing / display projection only / exclude | **Validate and project timed periods for display; timed editing deferred.** | ✅ Resolved |
| 6 | Scope | Resource/capacity engine | Built-in capacity engine / mock validation only / exclude | **No built-in capacity engine; include a mock validation and rollback example.** | ✅ Resolved |
| 7 | Scope | Data provider and loading states | Provider API / controlled items only | **Controlled `items` only in R1; provider/loading/error states deferred.** | ✅ Resolved |
| 8 | Scope | Undo/redo ownership | Local only / controlled host / both | **Local uncontrolled undo/redo in R1; controlled hosts own history.** | ✅ Resolved |
| 9 | Scope | Demo scope | Two domains / one demo + Storybook | **One annual planner demo + Storybook in R1; second domain P1.** | ✅ Resolved |
| 10 | Scope | Aggregated density, resource timeline, recurrence, scenarios, dependencies, split/merge, batch moves, RTL, week start, timed editing, SVG/PDF export, CJS/UMD, commercial support | Include / defer | **All deferred and documented; not stubbed or claimed.** | ✅ Resolved |
| 11 | Technical | Renderer strategy | HTML-first / SVG-first / hybrid / evidence-based | **Renderer-agnostic core; HTML hypothesis; M0 spike compares HTML, SVG and hybrid; evidence decides.** User: use SVG only if it genuinely helps. | ✅ Resolved |
| 12 | Technical | SVG scope and constraints | Full SVG / shape plane / connectors only | **SVG allowed for shape/connector/selection planes; no full SVG calendar and no `foreignObject`; HTML owns content, focus and interaction.** | ✅ Resolved |
| 13 | Behavior | Dynamic month semantics | Fixed 14 / configurable 12+ | **37 columns fixed; month rows dynamic; default classic 14; min 12; soft max 36; `year` + `contextMonths` preset or explicit `range`.** | ✅ Resolved |
| 14 | UX | Print policy for 12–36 months | Single A3 fit / paginate / both | **A3 landscape baseline; paginate rows for larger windows; Chromium print baseline; PDF verification.** | ✅ Resolved |
| 15 | Technical | Theming model | Design-system dependency / CSS variables + tokens | **CSS variables, `@layer`, typed `createTheme`, optional provider, theme presets, `unstyled`; no mandatory design system.** | ✅ Resolved |
| 16 | Behavior | Customization and holidays | Built-in holiday DB / host data | **Host-supplied annotations and `getDateMeta`; no built-in holiday truth; custom cell color/text/background; slots decorate, component owns hit surface.** | ✅ Resolved |
| 17 | Behavior | Selection data model | Single union / separate date and item selection | **Separate `dates` and `items`; anchor/focus; controlled/uncontrolled; no conflation.** | ✅ Resolved |
| 18 | UX | Modifier and marquee semantics | Various matrices | **Plain/Shift/Ctrl/Cmd matrix; Shift extends range; Ctrl/Cmd toggles; marquee defaults to item intersection; date-range drag via select tool; multi-item move explicit and atomic.** | ✅ Resolved |
| 19 | UX | Touch behavior | Automatic drag / scroll-first / explicit mode | **Scroll-first; explicit Touch edit mode enables drag/select; no accidental edits while scrolling.** | ✅ Resolved |
| 20 | Behavior | Keyboard model | Grid traversal / roving focus / item list | **Roving date focus, Shift+Arrow range, Space/Enter, Escape, Delete confirmation; inspector provides move/resize/paint alternatives; focus restoration.** | ✅ Resolved |
| 21 | Non-functional | Accessibility target | WCAG 2.2 AA / best effort | **WCAG 2.2 AA target; axe + keyboard + manual screen-reader audit; no AA claim until evidence.** | ✅ Resolved |
| 22 | Non-functional | Support matrix | Broad legacy / modern | **Latest 2 Chrome/Edge/Firefox/Safari; React 18.2+ and 19; Node 24 CI; print Chromium; mobile basic; SSR-safe client entry.** | ✅ Resolved |
| 23 | Non-functional | Performance budget | Unbounded / measured | **Benchmark 500/2k/10k items; 60 Hz drag target; record hardware/browser; no unmeasured claims; bundle budget.** | ✅ Resolved |
| 24 | Security | Security/privacy model | Host-only / component guardrails | **Host owns auth/authorization; component must not leak hidden data via DOM/ARIA/tooltips/exports; no telemetry; no raw HTML; CSP-safe; untrusted metadata escaped.** | ✅ Resolved |
| 25 | Documentation | Docs and API reference architecture | Storybook only / Storybook + TypeDoc / VitePress | **Storybook as public site; TypeDoc at `/api`; API Extractor report; TSDoc source of truth; VitePress optional later.** | ✅ Resolved |
| 26 | Technical | Package format and exports | ESM/CJS / ESM-only / UMD | **ESM-only R1; React peer 18.2+/19; exports map; CSS export; `publint` + `attw`; no UMD.** | ✅ Resolved |
| 27 | Release | Versioning and publishing | Independent / lockstep | **Lockstep Changesets fixed group; both packages same version; npm OIDC provenance; `0.x` until stable.** | ✅ Resolved |
| 28 | Legal | Copyright holder | Person / BlendSDK / contributors | **BlendSDK** (user may override before release). | ✅ Resolved |
| 29 | Product | Open-source audience and success | Generic / focused | **React product teams building long-range planners (workforce leave, campaigns, maintenance; logistics secondary). Success = adoption, docs quality, issues, contributors — not revenue.** | ✅ Resolved |
| 30 | Legal | Photos, legacy code, trade dress, third-party licenses | Include / exclude | **Exclude source photos and legacy code from public repo; clean-room implementation; original themes/data; third-party notices; photos only if rights cleared separately.** | ✅ Resolved |
| 31 | Quality | Test tooling and strategy | Ad hoc / structured | **Vitest + RTL + Playwright + axe + visual/print tests; spec tests derived from RDs; TZ and browser matrix; clean-consumer pack test.** | ✅ Resolved |
| 32 | Support | Maintenance/support policy | SLA / best effort | **Best-effort community support; no SLA; security policy; release cadence documented.** | ✅ Resolved |
| 33 | Technical | Fluent UI/MUI integration | Hard dependency / adapters | **Fluent UI v9 priority; thin optional token adapters; MUI optional; no hard dependency; CSS variables and slots remain the contract.** | ✅ Resolved |
| 34 | Behavior | Localization and week start | Full i18n/RTL / fixed | **LTR R1; Saturday-first fixed; Intl month/weekday labels; RTL and configurable week start P1.** | ✅ Resolved |
| 35 | Technical | CSS isolation | Global styles / scoped | **`yp-`/`--yp-` prefix; `@layer`; `:where` low specificity; no global resets; no `!important`; stable `data-*` styling contract.** | ✅ Resolved |
| 36 | Technical | SVG spike gate | Adopt SVG by default / evidence | **M0 spike compares HTML-only, HTML+SVG connectors, SVG shapes+HTML proxies and a limited full-SVG row; must-have criteria decide; no production commitment before evidence.** | ✅ Resolved |

## Resolution notes

- **AR-1:** MIT license text already added; DCO required in `CONTRIBUTING.md`.
- **AR-11/12/36:** The renderer choice is evidence-based. The core layout remains
  renderer-agnostic. The default HTML hypothesis is not a production commitment.
- **AR-17/18:** The selection matrix will be specified in RD-07 and tested by
  Playwright. No selection behavior is left to implementation preference.
- **AR-21:** “WCAG 2.2 AA target” is not a claim of conformance. The release
  notes must state the audit status honestly.
- **AR-24:** Hidden item details must be absent from the DOM and accessibility
  tree. Visibility is presentation, not authorization.
- **AR-29:** Open-source audience is intentionally focused; no commercial
  licensing or revenue requirement.
