# Ambiguity Register: Year Planner for React

> **Status**: ✅ GATE PASSED — all 79 items resolved (36 discovery + 34 preflight remediation + 8 reference rows + 1 runtime compatibility)
> **Last Updated**: 2026-11-10 08:30
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
| 7 | Scope | Data provider and loading states | Provider API / controlled + uncontrolled props | **Controlled `items` primary; `defaultItems`/`onItemsChange` for uncontrolled; provider/loading/error states deferred.** | ✅ Resolved |
| 8 | Scope | Undo/redo ownership | Local only / controlled host / both | **Local uncontrolled undo/redo in R1; controlled hosts own history.** | ✅ Resolved |
| 9 | Scope | Demo scope | Two domains / one demo + Storybook | **One annual planner demo + Storybook in R1; second domain P1.** | ✅ Resolved |
| 10 | Scope | Aggregated density, resource timeline, recurrence, scenarios, dependencies, split/merge, batch moves, RTL, week start, timed editing, SVG/PDF export, CJS/UMD, commercial support | Include / defer | **All deferred and documented; not stubbed or claimed.** | ✅ Resolved |
| 11 | Technical | Renderer strategy | HTML-first / SVG-first / hybrid / evidence-based | **Renderer-agnostic core; HTML hypothesis; M0 spike compares HTML, SVG and hybrid; evidence decides.** User: use SVG only if it genuinely helps. | ✅ Resolved |
| 12 | Technical | SVG scope and constraints | Full SVG / shape plane / connectors only | **SVG allowed for shape/connector/selection planes; no full SVG calendar and no `foreignObject`; HTML owns content, focus and interaction.** | ✅ Resolved |
| 13 | Behavior | Dynamic month semantics | Fixed 14 / configurable 12+ | **37 columns fixed; month rows dynamic; default classic 14; min 12; hard max 36; `year` + `contextMonths` preset or explicit `range` (month 0–11).** | ✅ Resolved |
| 14 | UX | Print policy for 12–36 months | Single A3 fit / paginate / both | **A3 landscape baseline; paginate rows for larger windows; Chromium print baseline; PDF verification.** | ✅ Resolved |
| 15 | Technical | Theming model | Design-system dependency / CSS variables + tokens | **CSS variables, `@layer`, typed `createTheme`, optional provider, theme presets, `unstyled`; no mandatory design system.** | ✅ Resolved |
| 16 | Behavior | Customization and holidays | Built-in holiday DB / host data | **Host-supplied annotations and `getDateMeta`; no built-in holiday truth; custom cell color/text/background; slots decorate, component owns hit surface.** | ✅ Resolved |
| 17 | Behavior | Selection data model | Single union / separate date and item selection | **Separate `dates` and `items`; anchor/focus; controlled/uncontrolled; no conflation.** | ✅ Resolved |
| 18 | UX | Modifier and marquee semantics | Various matrices | **Plain/Shift/Ctrl/Cmd matrix; Shift extends range; Ctrl/Cmd toggles; marquee defaults to item intersection; date-range drag via select tool; batch multi-item move deferred (AR #38).** | ✅ Resolved |
| 19 | UX | Touch behavior | Automatic drag / scroll-first / explicit mode | **Scroll-first; explicit Touch edit mode enables drag/select; no accidental edits while scrolling.** | ✅ Resolved |
| 20 | Behavior | Keyboard model | Grid traversal / roving focus / item list | **Roving date focus, Shift+Arrow range, Space/Enter, Escape, Delete confirmation; inspector provides move/resize/paint alternatives; focus restoration.** | ✅ Resolved |
| 21 | Non-functional | Accessibility target | WCAG 2.2 AA / best effort | **WCAG 2.2 AA target; axe + keyboard + manual screen-reader audit; no AA claim until evidence.** | ✅ Resolved |
| 22 | Non-functional | Support matrix | Broad legacy / modern | **Latest 2 Chrome/Edge/Firefox/Safari; React 18.2+ and 19; Node 24 CI; print Chromium; mobile basic; SSR-safe client entry.** | ✅ Resolved |
| 23 | Non-functional | Performance budget | Unbounded / measured | **Benchmark 500/2k/10k items; 60 Hz drag target; record hardware/browser; no unmeasured claims; bundle budget.** | ✅ Resolved |
| 24 | Security | Security/privacy model | Host-only / component guardrails | **Host owns auth/authorization; component must not leak hidden data via DOM/ARIA/tooltips/inspector/print; no telemetry; no raw HTML; CSP documented; untrusted metadata escaped.** | ✅ Resolved |
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

## Preflight remediation decisions (AR-37–AR-70)

> **Provenance:** independent preflight audit on 2026-11-10; the user directed
> “proceed.” Each row records the remediation adopted in the RD amendments.

| # | Category | Ambiguity / Gap | Options Presented | User Decision | Status |
|---|----------|-----------------|-------------------|---------------|--------|
| 37 | Data & state | One item has one period, but erase must leave two intervals | Interval-set per item / split into separate items / invalid hole | **One item = one period. Paint unions highlight items; erase splits the affected item into up to two new items with new IDs. Controlled paint returns `updatedItems`.** | ✅ Resolved |
| 38 | Scope | Multi-item move/bulk contradicted deferred scope | Include atomic bulk / defer | **Batch multi-move and `bulk` command deferred from R1.** | ✅ Resolved |
| 39 | Security/behavior | No read-only/locked/policy model | Host-only / item+layer+group flags | **Add `readOnly`/`locked` on items and `policy.allowMove/allowResize/allowPaint/allowCreate/allowDelete` on layers/groups, plus global `readOnly`.** | ✅ Resolved |
| 40 | Behavior | Paint target, create defaults and delete confirmation undefined | Active layer prop / first highlight layer / host callbacks | **Add `activeLayerId`, `createDefaults`, `createId`, `confirmChange`; paint requires an active highlight layer; delete requires confirmation.** | ✅ Resolved |
| 41 | Integration | Numeric item versions vs string base revision inconsistent | Per-item version / global revision / both | **Per-item numeric `version` is authoritative; `baseRevision` is optional pass-through; `CommandOutcome.revision` is a required host token not used for item stale detection.** | ✅ Resolved |
| 42 | Integration | `update` patch can change identity; warnings/bulk outcomes undefined | Allowlist patch / atomic-only bulk | **Patch is `Partial<Omit<PlannerItem,'id'|'version'>>`; warnings are displayed but non-blocking; bulk deferred.** | ✅ Resolved |
| 43 | Data & state | Entity interfaces incomplete/duplicated | Separate annotation entity / item kind | **Annotations are `PlannerItem.kind:'annotation'`; publish exact interfaces for groups, layers, items, resources and assignments; remove milestone/parent/scenario from R1.** | ✅ Resolved |
| 44 | Behavior | Selection policy and modifier transitions incomplete | Various matrices | **Define `DateInterval`, normalized date sets, full plain/Shift/Ctrl/Cmd matrix, anchor/focus transitions, and coexistence rules in RD-07.** | ✅ Resolved |
| 45 | Behavior | Dynamic window base, context tint and 36-month coverage | 0–11 / 1–12; soft/hard max | **Month is 0–11; `highlightYear` defaults to start year; 36 is a hard max; add 12/24/36 tests.** | ✅ Resolved |
| 46 | Behavior | Timed periods accepted but no display zone/edit policy | UTC default / host locale / exclude | **Add `displayTimeZone` default `UTC`; project for display; reject timed move/resize with `TIMED_EDITING_UNSUPPORTED`.** | ✅ Resolved |
| 47 | UX | Print pagination and PRT-01 incomplete | One page / paginate / fit | **12–14 months fit one A3 page; 15–28 paginate two; 29–36 paginate three; `fit` scales one page; add exact 2017-yellow PRT-01.** | ✅ Resolved |
| 48 | Non-functional | Performance targets, density and verify gate inconsistent | 50/60 fps; compact/expanded; verify split | **60 Hz = 16.7 ms; benchmark compact/expanded/overflow separately; `verify` is fast and `verify:full` includes E2E/visual/a11y/print; size check in release gate.** | ✅ Resolved |
| 49 | UX/API | Loading/error slots and inspector/tooltip undefined | Remove/defer / define inspector | **Remove R1 loading/error slots; add component-owned inspector/item list with `renderInspector`, and a tooltip contract with hidden-data redaction.** | ✅ Resolved |
| 50 | Accessibility | Item proxy button contains nested actions; invalid ARIA | Nested button / wrapper + overlay / action menu | **Fragment wrapper with a focusable non-button proxy or button without nested controls; resize handles are siblings; Fluent/MUI actions live in the inspector. Use `aria-pressed`.** | ✅ Resolved |
| 51 | SSR | Host locale/calendar causes hydration mismatch | Host default / explicit locale | **Add `locale` default `en-US`, force Gregorian calendar, `displayTimeZone` default `UTC`; test SSR with differing server/client locales.** | ✅ Resolved |
| 52 | Security | “CSP-safe” undefined; inline CSS vars and raw styles | Strict CSP / documented style-src allowance | **Document `style-src-attr` allowance; treat `style`/`cssVars` as trusted host input; reject remote URLs in untrusted metadata; add CSP test.** | ✅ Resolved |
| 53 | Security | Hidden data can leak via diagnostics, selection, counts | Redact / exclude | **Hidden items removed from selection/inspector/counts; diagnostics for hidden items are generic/redacted; add tests.** | ✅ Resolved |
| 54 | UX | Scroll, zoom and pointer transform undefined | Fixed canvas / scroll+zoom | **Add scroll container, sticky headers, zoom 0.75–1.5, min column widths, ResizeObserver invalidation, pointer-to-design-unit transform and `scrollToDate`.** | ✅ Resolved |
| 55 | API | Uncontrolled items/defaults not exposed | Controlled-only / uncontrolled props | **Add `defaultItems`/`onItemsChange`, `defaultVisibility`, `defaultSelection`; local undo in uncontrolled mode.** | ✅ Resolved |
| 56 | API | Public props/slots/handle/theme types unspecified | Prose / exact interfaces | **Publish exact interfaces for props, slots, components, handle and theme tokens in RD-06.** | ✅ Resolved |
| 57 | Technical | M0 renderer gate has no criteria/artifact | Adopt HTML / adopt SVG / evidence | **M0 spike with named criteria, owner, `docs/renderer-spike.md`, decision ADR and HTML fallback; no production renderer switch before the gate.** | ✅ Resolved |
| 58 | Behavior | Failure paths (invalid data, thrown promises, unmount, mid-drag updates) undefined | Blank / partial / fallback | **Per-entity validation with non-blanking fallback; map thrown/rejected/aborted calls; cancel on unmount; cancel gesture on prop/window changes; accepted-but-not-applied terminal state.** | ✅ Resolved |
| 59 | Quality | Must Have acceptance coverage incomplete | Add ACs / defer features | **Add create/update/delete/paint/redo/annotation-inspect/warning ACs; remove deferred batch/bulk ACs.** | ✅ Resolved |
| 60 | Data | Classic view at 1600/9999 needs out-of-range context months | Extend range / restrict view years | **Date core 1600–9999; classic view years 1601–9998; reject other view years with a diagnostic.** | ✅ Resolved |
| 61 | Technical | Core `CSSProperties` imports a React type | React type / neutral style record | **Core uses `Record<string, string | number>`; React layer maps to `CSSProperties`.** | ✅ Resolved |
| 62 | Technical | Adapter peer dependencies inconsistent | Hard dep / optional peer | **Declare Fluent/MUI as optional peers via `peerDependenciesMeta`; adapters remain tree-shakable subpaths.** | ✅ Resolved |
| 63 | Quality | Handoff acceptance traceability not machine-readable; PRT-01 partial | Range mapping / case-to-test IDs | **Add case-to-test matrix and exact PRT-01 acceptance.** | ✅ Resolved |
| 64 | Technical | TypeDoc 0.28.0 lacks TS6 peer support | Pin 0.28.0 / floor 0.28.20 | **Pin `>=0.28.20 <0.29`; verify in M0.** | ✅ Resolved |
| 65 | Release | Supply-chain/package contents underspecified | Ad hoc / pinned actions + files allowlist | **Pin GitHub Actions by SHA, explicit permissions, `files` allowlist, `sideEffects`, `npm pack --dry-run`, SCA command.** | ✅ Resolved |
| 66 | Documentation | Some AR references in RDs point to unrelated rows | Leave / correct | **Correct RD AR references and add the remediation rows above.** | ✅ Resolved |
| 67 | Accessibility | Layer identity can be color-only; host colors may fail contrast | Color-only / label+pattern+legend | **Require layer label/pattern/legend; host colors are host responsibility and documented.** | ✅ Resolved |
| 68 | Process | Accessibility/spec tests/API report scheduled too late | Phase C / Phase A | **Move a11y semantics, spec-test harness and API report into Phase A; manual audits/release evidence stay in Phase C.** | ✅ Resolved |
| 69 | Quality | Browser matrix overstates tested browsers | Claim all / state approximations | **State Chromium/Firefox/WebKit coverage; Edge uses Chromium, Safari approximates WebKit; add real smoke tests where available.** | ✅ Resolved |
| 70 | Operations | Private repo vs public GH Pages sequencing | Public immediately / private first | **Keep docs build in CI; enable Pages at public release (confirm GitHub plan).** | ✅ Resolved |

| # | Category | Ambiguity / Gap | Options Presented | User Decision | Status |
|---|----------|-----------------|-------------------|---------------|--------|
| 71 | Technical | TypeScript version | TS7 / TS6 / side-by-side | **TS6.0.3 for R1; TS7 canary only.** | ✅ Resolved |
| 72 | Data | Date-only representation | JS Date / Temporal / validated string | **Validated `DateKey` string + integer civil-day math.** | ✅ Resolved |
| 73 | Data | Interval boundary | Closed / half-open | **Half-open `[start, endExclusive)`.** | ✅ Resolved |
| 74 | Behavior | Visibility/group precedence | Child override / parent wins | **Parent group wins; layer then item then filter/channel.** | ✅ Resolved |
| 75 | Technical | Classic 37-slot geometry | 35 / 37 / 42 columns | **37 fixed columns; 12 weekend + 25 weekday; 39 grid columns including bands.** | ✅ Resolved |
| 76 | UX | Compact lane density | 2 / 3 / 5 lanes | **3 visible lanes + overflow count/list.** | ✅ Resolved |
| 77 | Technical | Event storage | Per-day cells / intervals + fragments | **Interval identity + per-row fragments; never per-day event storage.** | ✅ Resolved |
| 78 | Technical | PNG/SVG print | Raster / vector / browser print | **Browser A3 print with vector CSS/SVG shapes; no raster canvas.** | ✅ Resolved |
| 79 | Technical (runtime) | Vite 8/Vitest 5 native binary compatibility | Force Vite 8 / fallback Vite 7 | **Vite 7.3.8 + Vitest 3.2.7 are the verified reference-environment fallback; Vite 8/Vitest 5 remain the target where native bindings support the CPU.** | ✅ Resolved |

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
