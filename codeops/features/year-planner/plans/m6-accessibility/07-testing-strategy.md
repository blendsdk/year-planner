# Testing Strategy: Accessibility and Keyboard Experience

> **Document**: 07-testing-strategy.md
> **Parent**: [Index](00-index.md)

## Testing Overview

### Coverage Goals

| Code type | Target |
| --------- | ------ |
| Pure label/contrast/row helpers | 95% |
| React rendering and interaction | 90% |
| CSS and visual states | covered by snapshots and computed-style checks |
| Browser keyboard and axe evidence | all RD-09 acceptance states |

- Test names state behaviour: `should [expected] when [condition]`.
- Real YearPlanner instances are used; only the host command and browser boundaries are mocked.
- Specification tests are written before implementation and are the immutable oracle for the
  behaviour in this plan.

## 🚨 Specification Test Cases (MANDATORY — NON-NEGOTIABLE)

### Semantics and names

| # | Input / Scenario | Expected Output / Behavior | Source |
|---|------------------|----------------------------|--------|
| ST-1 | A date cell with 3 visible items | Name contains the formatted date and `3 items` | 03-01 §Date cell name / AR-2 |
| ST-2 | A visible ISO week number | Name contains `ISO week N` | 03-01 §Date cell name / AR-2 |
| ST-3 | Holiday date, selected date | Name contains `holiday` and `selected` | 03-01 §Date cell name / AR-2 |
| ST-4 | Host `DateMeta.ariaLabel = "Pay day"` | Cell name is exactly `Pay day` | 03-01 §Date cell name / AR-2 |
| ST-5 | Selection covers three dates | Those cells have `aria-selected="true"`; others `"false"` | 03-01 §Selected dates / AR-2 |
| ST-6 | Ribbon proxy for a selected, clipped, hatch-layer item with status | Name contains title, period, layer, `hatch pattern`, status, `selected`, `partially visible` | 03-01 §Item proxy name / AR-3 |
| ST-7 | Annotation proxy with label `OH` and title `Holiday` | Name starts with `OH`, also contains `Holiday` | 03-01 §Item proxy name / AR-3 |
| ST-8 | Item hidden by `hiddenItemIds` | No DOM node, no item-list button, no overflow entry, absent from cell count | 03-01 §Hidden items / AR-13 |
| ST-9 | Default render | Root is `region` with the planner label; grid `aria-describedby` includes generated help | 03-01 §Grid and region / AR-15 |
| ST-10 | Non-dated filler cell | `aria-hidden="true"` and no tab index; it stays a gridcell to keep 37 columns per row | 03-01 §Grid and region / AR-2 |

### Focus and keyboard

| # | Input / Scenario | Expected Output / Behavior | Source |
|---|------------------|----------------------------|--------|
| ST-11 | Default 14-month layout | Exactly one dated cell has `tabindex=0` | 03-02 §Tab order / AR-10 |
| ST-12 | First date disabled by `getDateMeta` | First enabled date has `tabindex=0`; no other cell does | 03-02 §Active date resolution / AR-10 |
| ST-13 | ArrowRight on a valid date, next date disabled | Focus moves to the next enabled date | 03-02 §Tab order / AR-10 |
| ST-14 | Home / End in a month row | First / last enabled date in that row is focused | 03-02 §Home and End / AR-14 |
| ST-15 | Shift+ArrowRight | Selection extends from the anchor and the range is announced | 03-02 §Tab order / AR-14 |
| ST-16 | Default layout | Exactly one proxy and one overflow button have `tabindex=0`; the overflow button belongs to the active row | 03-02 §Overflow roving tab stop / AR-9 |
| ST-17 | Focus the skip link and press Enter | Inspector opens and the item-list section receives focus | 03-02 §Skip link / AR-1 |
| ST-18 | Move an item by gesture, then commit; move by an inspector button; delete from the inspector | Gesture commit returns focus to the item proxy; the inspector move button keeps focus; delete falls back to the nearest date | 03-02 §Focus restoration and inspector policy / AR-17 |
| ST-19 | Hide the focused item | Focus moves to the nearest enabled date and the polite region announces it | 03-02 §Focus restoration / AR-10 |
| ST-20 | Close the inspector with an item active | Focus returns to the item proxy; with no item, to the active date | 03-04 §Inspector changes / AR-1 |

### Announcements and status

| # | Input / Scenario | Expected Output / Behavior | Source |
|---|------------------|----------------------------|--------|
| ST-21 | Host request stays pending | Visible text `Change pending`; one polite announcement on the transition | 03-03 §Mapping / AR-7 |
| ST-22 | Host accepts | Visible text `Change accepted`; one polite announcement | 03-03 §Mapping / AR-7 |
| ST-23 | Host rejects with `CAPACITY_EXCEEDED` | Visible `Change rejected: …`; one assertive announcement | 03-03 §Mapping / AR-8 |
| ST-24 | Timeout, `STALE_REVISION`, `COMMAND_ABORTED` | Visible text names the timeout/stale/aborted outcome; assertive announcement | 03-03 §Mapping / AR-8 |
| ST-25 | Host accepts but props never change | Visible `Change accepted but not applied`; one polite announcement | 03-03 §Mapping / AR-7 |
| ST-26 | Select two items and three dates | Polite selection announcement contains the counts | 03-03 §Selection and visibility text / AR-8 |
| ST-27 | Hide an item through the handle | Polite visibility announcement; visible item count drops | 03-03 §Selection and visibility text / AR-8 |
| ST-28 | Settle two identical rejections in sequence | Two announcements, one per settlement; no duplicate for one settlement | 03-03 §Announce once / AR-8 |
| ST-29 | Reject a move for item `booking` | Feedback has a stable id; `booking` proxy `aria-describedby` references it; message visible | 03-03 §Error association / AR-13 |

### Item list and inspector

| # | Input / Scenario | Expected Output / Behavior | Source |
|---|------------------|----------------------------|--------|
| ST-30 | Three visible items | Item list shows `All visible items (3)` and three buttons | 03-04 §Behaviour / AR-1 |
| ST-31 | Active row has two overflow items | Item list includes them, marked `hidden on this month` | 03-04 §Behaviour / AR-1 |
| ST-32 | One item hidden | Item list count and buttons exclude it | 03-04 §Hidden items / AR-13 |
| ST-33 | Activate an item-list button | Item is selected and its proxy receives focus | 03-04 §Behaviour / AR-1 |
| ST-34 | Select one item | Inspector shows its title, kind, layer, period, status, visibility and actions | 03-04 §Inspector changes / AR-1 |
| ST-35 | `renderInspector` replaces the body | Planner-owned item list, close button and skip target still render | 03-04 §Inspector changes / AR-1 |

### Visual accessibility

| # | Input / Scenario | Expected Output / Behavior | Source |
|---|------------------|----------------------------|--------|
| ST-36 | All five presets | Chosen ribbon text has at least 4.5:1 contrast | 03-05 §Measured results / AR-5 |
| ST-37 | All five presets | Focus ring has at least 3:1 against the surface | 03-05 §Measured results / AR-5 |
| ST-38 | All five presets | Border has at least 3:1 against the surface | 03-05 §Measured results / AR-6 |
| ST-39 | Default theme | `laneHeight` is 24; proxy height is 24; handles and overflow are at least 24×24 | 03-05 §Target size / AR-4 |
| ST-40 | Selected, holiday and overflow states | Non-colour cue present: outline/weight/underline or `+N` text | 03-05 §Non-colour state cues / AR-11 |
| ST-41 | Forced-colours media query | CSS defines system-colour borders and `Highlight` outlines | 03-05 §Forced colours / AR-11 |
| ST-42 | Reduced-motion media query | CSS disables animation/transition and smooth scrolling | 03-05 §Reduced motion / AR-11 |
| ST-43 | Print media | Command status, skip link and live regions are hidden; print pages stay `aria-hidden` | 03-05 §Print / AR-11 |

### Browser and axe evidence

| # | Input / Scenario | Expected Output / Behavior | Source |
|---|------------------|----------------------------|--------|
| ST-44 | axe on classic-blue, classic-yellow, high-contrast, compact, expanded, overflow, error, AC3 and 36-month states | No serious or critical violations | RD-09 AC7 / AR-16 |
| ST-45 | Keyboard-only flow | Grid focus, arrows, Shift+Arrow, Space, Enter, item list, move-by-week all succeed | RD-09 AC1 / AR-14 |
| ST-46 | Hidden item in the browser accessibility tree | No button/name/tooltip/item-list entry for the hidden item | RD-09 AC4 / AR-13 |
| ST-47 | Item proxies with host `renderItem` content | No nested interactive controls; axe `nested-interactive` and the DOM scan pass | RD-09 AC14 / AR-20 |
| ST-48 | Visible week numbers and item labels | axe `label-content-name-mismatch` reports zero nodes | RD-09 AC3 / AR-2 |

## Test Categories

### Specification Tests

| File | ST Cases | Component |
| ---- | -------- | --------- |
| `packages/react/src/a11y.spec.test.ts` | ST-1..ST-7, ST-36..ST-40 | Pure helpers |
| `packages/react/src/announcements.spec.test.ts` | ST-21..ST-28 | Command status mapping |
| `packages/react/src/interaction/row.spec.test.ts` | ST-14 | Row bounds |
| `packages/react/src/accessibility.spec.test.tsx` | ST-5, ST-8..ST-13, ST-15..ST-20, ST-29..ST-35 | React rendering |
| `packages/react/src/styles.spec.test.tsx` | ST-41..ST-43 | CSS contract |
| `tests/e2e/accessibility.spec.ts` | ST-44..ST-48 | Browser evidence |

### Implementation Tests

| File | Description | Priority |
| ---- | ----------- | -------- |
| `packages/react/src/a11y.impl.test.ts` | Hex parsing, non-hex fallback, clipping, empty labels | High |
| `packages/react/src/accessibility.impl.test.tsx` | Multi-fragment names, timed items, context months, hidden selection, custom inspector | High |
| `packages/react/src/announcements.impl.test.ts` | Unknown codes, empty diagnostics, repeated settlements | Medium |
| `packages/react/src/interaction/row.impl.test.ts` | Disabled edges, missing rows, month boundaries | Medium |

### Integration Tests

| Test | Components | Description |
| ---- | ---------- | ----------- |
| `accessibility.spec.test.tsx` | YearPlanner, Inspector, CellLayer, ItemLayer | Keyboard, names, item list, announcements |
| `commands.lifecycle.spec.test.tsx` | Pipeline, status bar | Existing lifecycle plus new visible status |
| `inspector.spec.test.tsx` | Inspector, ItemList | Hidden filtering and overflow |

### End-to-End Tests

| Scenario | Steps | Expected Result |
| -------- | ----- | --------------- |
| Keyboard-only select and inspect | Tab, arrows, Shift+Arrow, Space, Enter | Selection JSON and inspector match |
| Skip link | Tab to skip link, Enter | Item list focused, no grid traversal |
| Move by week | Select item, focus inspector, press Move later | Item period shifts seven days |
| Hidden item | Hide focused item | Focus fallback, no hidden DOM, polite announcement |
| axe matrix | Six demo states | No serious/critical violations |

## Test Data

### Fixtures Needed

- Default 2027 items: booking, maintenance, training, highlight, holiday.
- 20 overflow items on one row.
- A hidden layer item and a hidden item id.
- A disabled first date and a disabled mid-row date.
- A timed item and an annotation item.
- 36-month range.
- Themes: classic-blue, classic-yellow, high-contrast, modern, print.

### Mock Requirements

- Controlled host for accept, reject, timeout, stale, aborted and never-apply.
- No browser or DOM mocks beyond the existing `getBoundingClientRect` stub in interaction tests.
- `axe-core` is injected into the page; no new dependency.
- AC14’s “HTML validation” is covered by axe `nested-interactive` plus an explicit DOM scan for
  interactive descendants inside proxies. A full HTML validator is not installed and is not added
  (AR-20).
- The 18 → 24 px lane-height change is a requirements supersession; ST-39 replaces the old
  theme-test constant (AR-19).

## Manual Screen-Reader Protocol

Record the following in `docs/accessibility.md`:

1. Browser, operating system, AT name and version, date.
2. Tab to the skip link; confirm it is announced and opens the item list.
3. Confirm the grid name and keyboard-help description.
4. Move across dates; confirm date, count, selected and holiday states.
5. Tab to an item proxy; confirm title, period, layer, status and selection.
6. Select and inspect; confirm the inspector heading and item list.
7. Trigger a rejected command; confirm one assertive announcement and visible feedback.
8. Hide the focused item; confirm the focus fallback announcement.

A recorded NVDA or VoiceOver session is an open evidence item (AR-12). The plan records an Orca
smoke check where the Linux host supports it.

## Verification Checklist

- [ ] All ST cases defined with concrete input/output pairs
- [ ] Every ST case traces to a spec section or AR entry
- [ ] Specification tests written before implementation
- [ ] Specification tests fail before implementation
- [ ] All specification tests pass after implementation
- [ ] Implementation tests cover edges and internals
- [ ] axe matrix passes in Chromium
- [ ] Visual snapshots updated for lane and contrast changes
- [ ] No regressions in the existing 207 core and 405 React tests
- [ ] `pnpm verify:full` passes
