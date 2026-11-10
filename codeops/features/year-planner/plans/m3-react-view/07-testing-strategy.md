# Testing Strategy: M3 React View

> **Document**: 07-testing-strategy.md
> **Parent**: [Index](00-index.md)

## Testing Overview

### Coverage Goals

| Code type | Target |
|---|---|
| Core contracts/helpers | 95% lines/branches/functions/statements |
| React view, state, commands, inspector, print | 80% lines/branches/functions/statements |
| E2E | Render, themes, inspector, scroll/zoom, 14/24/36 print, CSP |

The existing `packages/react/vitest.config.ts` enforces 80% across all four
metrics; core stays at 95%. No test dependency is added.

## Specification Test Cases

> Expectations come from RD-06, the 03-documents and the Ambiguity Register.
> If an implementation disagrees, the implementation is wrong.

### Contracts and theme (Phase 1 except ST-5)

| # | Input / Scenario | Expected Output / Behavior | Source |
|---|---|---|---|
| ST-1 | `emptySelection()`; `selectionItemIds({items:["b","a","b"]})` | `{dates:[],items:[]}`; `["b","a"]` | RD-04 |
| ST-2 | `createTheme({ ribbon:"#8358c6" })` | Ribbon overridden; other 23 tokens equal `classic-blue`; input unmutated | AR-4 |
| ST-3 | `themeToCssVars(createTheme())` | Exactly 24 `--yp-*` keys; `--yp-row-height:"90px"`, `--yp-font-size:"14px"`, `--yp-print-scale":"0.72"`, `--yp-font-weight":"400"`; camelCase kebabed | AR-4 |
| ST-4 | All five presets | 24 tokens each; `rowHeight/laneHeight/monthBandWidth/weekendWidth/weekdayWidth` are 90/18/70/40/55 (token-only; the rendered AC1 check is ST-27) | RD-06 AC1 |
| ST-5 | Theme `rowHeight:100`, `weekdayWidth:60`; `printScale:0.5` | Rendered row height 100; weekday columns 60; print fallback scale 0.5 only when no plan | AR-4 |

### View shell (Phase 2)

| # | Input / Scenario | Expected Output / Behavior | Source |
|---|---|---|---|
| ST-6 | Provider theme `{ribbon:"#111111"}` + `display.theme:"classic-yellow"` | Yellow preset wins and the provider is ignored while `display.theme` is set; with no `display.theme`, the provider ribbon applies | AR-5 |
| ST-7 | `cssVars={{"--yp-ribbon":"#123456","--yp-custom":"7"}}` | Root style has both; ribbon renders `#123456` | RD-06 AC2 |
| ST-8 | `unstyled` | Root has `yp-unstyled`; computed border/background removed; grid structure, focus ring and print font size remain; 37 cells/row remain | RD-06 AC5 |
| ST-9 | `display.zoom:0.5` and `1.75` | Effective 0.75/1.5; one `INVALID_RANGE` each | AR-11 |
| ST-10 | `year={2016}` | 14 rows; `aria-rowcount=16`; 37 gridcells/row; 74 columnheaders; mirrored month bands | RD-03/RD-06 |
| ST-11 | 36-month range | 36 rows; `aria-rowcount=38`; `aria-colcount=37`; 39 grid tracks | RD-06 |
| ST-12 | No year/range | `role="status"`; message contains "required"; `renderEmpty` content | RD-06 |
| ST-13 | Zoom 0.75/1.0/1.5 | Row height 67.5/90/135 px; first weekday cell 41.25/55/82.5 px; fragment x/width multiplied identically | RD-06 AC13 |
| ST-14 | `locale="de-DE"` | Month "März"; weekday "Mo"; date number formatted by `Intl.NumberFormat` | RD-06 |
| ST-15 | `locale="not-a-locale"` | Falls back to `en-US`; `INVALID_LOCALE`; still renders 14 rows | AR-13 |
| ST-16 | Node SSR `renderToString` | Grid and labels present; reserved month count; no browser-global access; repeat calls identical | RD-06 AC10 |
| ST-17 | jsdom `renderToString` + `hydrateRoot` | Hydration completes; `console.error` spy receives no mismatch warning | RD-06 AC10 |
| ST-18 | Two planners with blue/yellow; `showISOWeekNumbers` | Distinct `data-yp-theme`/variables; unique `useId` values; ISO week "53" visible for 2016-01-01; `dir="ltr"` | RD-06 AC7 |
| ST-19 | `scrollToDate("2016-07-01")`; ResizeObserver callback | July cell horizontally centered; resize increments geometry without error; no throw when observer missing | RD-06 AC13 |
| ST-20 | `pointToFragment`/`pointToDate` at 0.75/1.0/1.5 | Point maps to the same fragment/date after scroll and zoom offsets; boundary outside returns `undefined` | RD-06 AC13 |
| ST-21 | Invalid density, compactMaxLanes 0, laneHeight 0, zone "Mars/Olympus", connector `edge-path` | Defaults used; `INVALID_COMMAND`/`INVALID_TIMEZONE`/`INVALID_RENDERER_OPTION`; no throw | AR-13/F-15 |
| ST-22 | `items` + `defaultItems` | Controlled wins; one dev warning; default ignored | AR-6 |
| ST-23 | `defaultVisibility` + `defaultVisible:false`; handle hide/show | Seeded hidden IDs; reducer updates; `onVisibilityChange`; hidden ancestor still wins | RD-04/RD-06 |
| ST-24 | `selection`/`defaultSelection`; `selectRange`; disabled date | Controlled wins; uncontrolled updates; `clearSelection` empties; disabled date no-op | RD-06 |
| ST-25 | `filter`/`defaultFilter`; `setFilter` | Filtered items disappear; callback fires; layer/resource/status/search compose | RD-06 |
| ST-26 | Timed item `2027-01-31T23:30Z → 2027-02-01T01:00Z`, zone UTC | Fragment on Jan 31 and Feb 1; original period preserved; invalid zone falls back to UTC | AR-2/AR-13 |
| ST-27 | Theme geometry tokens + explicit `units` | Theme 100/60 applies; `units={{rowHeight:80}}` wins; switching presets keeps dates/positions | AR-4 |

### Items, annotations and slots (Phase 3)

| # | Input / Scenario | Expected Output / Behavior | Source |
|---|---|---|---|
| ST-28 | Item `[2027-01-28, 2027-02-07)` | Two fragments, one item ID; Jan/Feb; widths 190/315 | RD-05/RD-06 |
| ST-29 | Three overlapping ribbon items | Lanes 0/1/2; y 18/36/54 px | RD-05/RD-06 |
| ST-30 | One-day item at zoom 1 | Proxy width 55 px, height 18 px | RD-05/RD-06 |
| ST-31 | Fragment DOM | Wrapper + `role=button` proxy + two sibling resize buttons; only active proxy `tabindex=0`; others `-1`; no nested interactive element | RD-06 AC3/AC9 |
| ST-32 | Selection | Selected proxy `aria-pressed=true`; others false; no `aria-selected` on button | RD-06 |
| ST-33 | Hidden group/layer/item/channel/filter | No fragment, proxy, tooltip or overflow entry | RD-06 AC18 |
| ST-34 | Annotation with label/background/textColor | Badge label/colors applied; `showAnnotations:false` hides it | RD-04/RD-06 |
| ST-35 | Background/highlight/foreground + opacity/pattern | Backdrop full-row, `pointer-events:none`, opacity 0.45×layer opacity; foreground outline; no lanes; pattern class and layer label | RD-05/RD-06 |
| ST-36 | 20 overlapping items compact | `+17` button; popover has 17 entries with titles/periods; `OverflowRenderContext` uses the month row, hidden count and visible items | RD-06 AC15 |
| ST-37 | Overflow keyboard | Enter/Space opens; Escape closes and returns focus | RD-06 AC15 |
| ST-38 | Hover/focus item | Tooltip shows title + localized span; hidden item never shows | RD-06 |
| ST-39 | `renderTooltip` | Custom content replaces default inside the owned overlay | RD-06 |
| ST-40 | `getDateMeta` | Background/text/label/content applied; `ariaLabel` overrides name; `holiday` adds data/class; disabled sets `aria-disabled` and `tabindex=-1`; no invented holiday | RD-06 AC4 |
| ST-41 | `getDateMeta` + annotation | Base cell meta applies; annotation overlays; priority sorts annotations only | RD-06 AC4 |
| ST-42 | `renderCell`/`renderItem`/`ItemFragment` | Extra content appears; cell ARIA/hit surface and proxy/handles remain; slot cannot replace them | RD-06 AC8/AC9 |
| ST-43 | `renderAnnotation`/`renderOverflow`/`renderEmpty` | Custom content appears in owned containers | RD-06 |
| ST-44 | Item metadata `<img src=x>`/`url(javascript:)`; item style allowlist | Metadata never appears as HTML/CSS; disallowed style properties/values dropped | RD-06 AC18 |
| ST-45 | `unstyled` with items | Structure, proxies, focus and print geometry remain | RD-06 AC5 |
| ST-46 | `ItemFragment` slot | Wraps proxy content only; proxy and handles remain | RD-06 AC9 |
| ST-47 | `renderItem` returns a `<button>` | Dev warning; planner still renders its proxy; no nested interactive element | RD-06 AC3 |

### State and commands (Phase 4)

| # | Input / Scenario | Expected Output / Behavior | Source |
|---|---|---|---|
| ST-48 | `defaultItems` + handle delete | Item removed; `onItemsChange` once with new array | RD-06 AC14 |
| ST-49 | Controlled `items` + handle delete | Props not mutated; no visual removal until rerender | RD-06 AC14 |
| ST-50 | Handle `move`/`resize`/`create`/`paint` | One command each with exact period/version/defaults/layer | RD-06 AC17 |
| ST-51 | Read-only planner/item/layer | `READ_ONLY`; items/versions unchanged | RD-06 AC17 |
| ST-52 | Version mismatch | `STALE_REVISION`; no mutation | RD-08 |
| ST-53 | `validateChange` denies | `VALIDATION_ERROR`; `onChangeRejected`; no mutation | RD-06 |
| ST-54 | Host timeout 20 ms | `COMMAND_TIMEOUT`; retry available; late settlement ignored | RD-06 AC16 |
| ST-55 | Host rejects/throws | `HOST_REJECTED`; feedback; retry | RD-06 AC16 |
| ST-56 | Host accepts with updated/removed IDs | `onChangeCommitted`; uncontrolled state applies exactly once | RD-06 AC14 |
| ST-57 | Uncontrolled delete→undo→redo | Prior item/version restored; redo removes; `onItemsChange` each time | AR-20 |
| ST-58 | Controlled undo | `UNDO_UNAVAILABLE`; no change | AR-20 |
| ST-59 | Confirmation false / unavailable | No-op / `CONFIRMATION_UNAVAILABLE`; no mutation | AR-19 |
| ST-60 | Paint mixed matching/non-matching attributes, local and host outcome | Non-matching items preserved once; host `updatedItems`/`removedItemIds` remove-then-insert produces no duplicates | F-13 |
| ST-61 | Hidden item command diagnostic | `itemIds` only; no title/period/date | RD-06 AC18 |

### Inspector (Phase 5)

| # | Input / Scenario | Expected Output / Behavior | Source |
|---|---|---|---|
| ST-62 | Default render | Aside labelled "Planner inspector"; close button; empty hint | RD-06 AC15 |
| ST-63 | Proxy click / selected item | Opens; shows title, layer, period, visibility/editability | RD-06 AC15 |
| ST-64 | `showInspector={false}` / close / `openInspector` | Hidden / local hide / reopened | RD-06 AC15 |
| ST-65 | Active row overflow | Lists overflow items; click selects/focuses | RD-06 AC15 |
| ST-66 | Action buttons | Delete; move ±7 days; resize ±1 day; paint/erase range; create with defaults | RD-06 AC17 |
| ST-67 | Rejected/timed-out command | Feedback code; Retry repeats command; Dismiss clears; both keyboard reachable | RD-06 AC16 |
| ST-68 | `renderInspector` | Replaces body; aside, close button, focus and ARIA remain | RD-06 |
| ST-69 | Hidden selected item | Omitted from `InspectorRenderContext.items` and details | RD-06 AC18 |
| ST-70 | Create with `createDefaults.layerId` vs `activeLayerId` vs neither | Defaults win, then active, then disabled | AR-29 |
| ST-71 | Timed item move/resize/paint | `TIMED_EDITING_UNSUPPORTED`; delete still available | RD-07 |
| ST-72 | Keyboard traversal | Aside/close/actions reachable with Tab; focus returns to item on close | RD-06 AC15 |

### Print and adapters (Phase 6)

| # | Input / Scenario | Expected Output / Behavior | Source |
|---|---|---|---|
| ST-73 | 14/24/36 months paginate | 1/2/3 print pages; 36 → 14/14/8; A3 page size | RD-06 AC12 |
| ST-74 | Print page | Month labels, weekday headers, weekends, ISO weeks, ribbons/annotations present | RD-06 AC12 |
| ST-75 | Fit mode | One page at plan scale; `PRINT_FIT_TOO_SMALL` forwarded; no auto-fallback | RD-05/RD-06 |
| ST-76 | `display.theme:"print"` | Weekend differentiation and channels survive; white/black base | RD-06 AC12 |
| ST-77 | Fluent full/partial | Expected vars; missing omitted; no Fluent import | RD-06 AC3 |
| ST-78 | MUI full/partial | Expected vars; missing omitted; no MUI import | RD-06 AC3 |
| ST-79 | Package/build mapping | `package.json` exports and Vite entries map both adapters; source adapter files exist; `test:size` asserts built adapter JS after build | RD-06 |
| ST-80 | CSS static | Every selector scoped under `.yp-root`/`@layer`; no `!important`; no global reset | RD-06 AC6 |
| ST-81 | CSP E2E | Documented `style-src-attr 'unsafe-inline'` header renders; malicious metadata makes no request | RD-06 AC11 |
| ST-82 | Real Fluent/MUI fixture | Fluent v9 and MUI Buttons render in cells and the inspector; no button nested in a proxy | RD-06 AC3 (AR-27) |
| ST-83 | Print with `units={{ monthBand: 80, weekday: 60 }}` | `ribbon.totalWidth` changes; print page surface width and scale use it; content still fits A3 | R-03 |
| ST-84 | `connectorMode:"edge-path"` | `INVALID_RENDERER_OPTION`; no connectors; view still renders | AR-9 |
| ST-85 | Package manifest | `type: "module"`; no `require` condition; Vite format is `es`; no CJS/UMD files declared | AR-30 |

## Test Categories

### Specification Tests

| Test file | ST cases | Phase |
|---|---|---|
| `packages/core/src/contracts.spec.test.ts` | ST-1 | 1 |
| `packages/react/src/theme.spec.test.tsx` | ST-2–ST-4 | 1 |
| `packages/react/src/YearPlanner.spec.test.tsx` | ST-5–ST-15, ST-18–ST-27, ST-84 | 2 |
| `packages/react/src/YearPlanner.ssr.spec.test.tsx` | ST-16 | 2 |
| `packages/react/src/YearPlanner.hydration.spec.test.tsx` | ST-17 | 2 |
| `packages/react/src/items.spec.test.tsx` | ST-28–ST-47 | 3 |
| `packages/react/src/commands.spec.test.tsx` | ST-48–ST-61 | 4 |
| `packages/react/src/inspector.spec.test.tsx` | ST-62–ST-72 | 5 |
| `packages/react/src/print.spec.test.tsx` | ST-73–ST-76, ST-83 | 6 |
| `packages/react/src/adapters.spec.test.tsx` | ST-77–ST-79, ST-82, ST-85 | 6 |
| `tests/e2e/classic-year.spec.ts` | ST-80–ST-81 + visuals/print | 7 |

### Implementation Tests

| Test file | Description | Priority |
|---|---|---|
| `packages/core/src/contracts.impl.test.ts` | Helpers, dedupe, immutability | High |
| `packages/react/src/theme.impl.test.tsx` | Token conversion, preset completeness, provider merge | High |
| `packages/react/src/geometry.impl.test.tsx` | Zoom scale, clamp, template widths, point mapping | High |
| `packages/react/src/state.impl.test.tsx` | Controlled/uncontrolled hooks, diagnostics | High |
| `packages/react/src/commands.impl.test.tsx` | Every local apply, timeout edge, undo bounds | High |
| `packages/react/src/items.impl.test.tsx` | Empty cells, channel heights, focus, disabled dates | High |
| `packages/react/src/inspector.impl.test.tsx` | Close/open transitions, empty state, layer path | High |
| `packages/react/src/print.impl.test.tsx` | Fit/paginate fallback, page count, scale | Medium |
| `packages/react/src/adapters.impl.test.tsx` | Partial mappings, ignored keys | Medium |

### Integration Tests

| Test | Components | Description |
|---|---|---|
| Full planner | Core model + ribbons + React view | Validate → visibility → ribbons → render 14/36 months |
| Inspector edit | View + state + commands | Delete in uncontrolled mode updates DOM, versions and undo |
| Print plan | Core print + print tree | Page count, scales and content match the plan |

### End-to-End Tests

`tests/e2e/classic-year.spec.ts`:

- 2016 classic-blue and 2017 classic-yellow visuals (updated snapshots).
- Item rendering, inspector and tooltip at 2027.
- 14/24/36-month A3 PDF page counts and page size in Chromium.
- Zoom 1.5 and `scrollToDate` keep the July cell visible.
- CSS scoping check and CSP response header with malicious metadata.

## Test Data

- Classic 2016 and 2027 layouts (14 rows).
- Ranges of 14, 24 and 36 months.
- One group tree (`ops` → `logistics`), ribbon/bookings and annotation/notes
  layers, background and foreground layers, one resource.
- Cross-month booking `[2027-01-28, 2027-02-07)`.
- Twenty overlapping items for overflow.
- Timed item for read-only editing tests.
- Holidays supplied only through annotations/`getDateMeta`.

## Verification Checklist

- [x] All specification cases have concrete input/output pairs
- [x] Every case traces to a requirement, design doc or AR entry
- [x] Every ST case belongs to the phase that implements its subject
- [ ] Specification tests are written before implementation
- [ ] Red phase recorded for each phase
- [ ] All specification tests pass after implementation
- [ ] Implementation tests cover edge cases and internals
- [ ] `pnpm verify` passes per task and `pnpm verify:full` at completion
- [ ] React coverage stays at or above 80%; core at or above 95%
- [ ] PDF page counts prove 1/2/3 A3 output
