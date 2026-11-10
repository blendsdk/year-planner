# Testing Strategy: RD-07 Interaction Engine

> **Document**: 07-testing-strategy.md
> **Parent**: [Index](00-index.md)

## Testing Overview

### Coverage Goals

| Code type | Target |
| --------- | ------ |
| Selection/gesture pure logic | 95% lines, 90% branches |
| React interaction wiring | 85% lines, 80% branches |
| Demo / stories | Build and E2E evidence |

- Test names state behavior: `should [expected behavior] when [condition]`.
- The immutable-oracle rule applies: a failing ST case means the implementation
  is wrong, never the test.
- Existing RD-06 tests must remain green.

## 🚨 Specification Test Cases (MANDATORY — NON-NEGOTIABLE)

> These cases derive from RD-07, the component specs and the Ambiguity Register.
> Expectations are fixed before implementation.

### Selection policy

| # | Input / Scenario | Expected Output / Behavior | Source |
|---|------------------|----------------------------|--------|
| ST-1 | Plain click on `2027-02-01` with prior dates and item `a` selected | Dates `[2027-02-01, 2027-02-02)`, items empty, `anchorDate=focusDate=2027-02-01`, item anchors/focus cleared | RD-07 selection policy / AR-5 |
| ST-2 | Plain click item `b` while a date is selected | Items `[b]`, dates empty, `anchorItemId=focusItemId=b`, date anchor/focus cleared | RD-07 selection policy / AR-3 |
| ST-3 | Selection anchor Feb 1, focus Feb 3; Shift+click Feb 5 | Dates `[2027-02-01, 2027-02-06)`, items empty, anchor Feb 1, focus Feb 5 | RD-07 anchor/focus / AR-5 |
| ST-4 | No anchor, focus Feb 2; Shift+click Feb 4 | Anchor becomes Feb 2; dates `[2027-02-02, 2027-02-05)` | RD-07 anchor/focus |
| ST-5 | Mod+click unselected Feb 3 with item `a` selected | Dates `[2027-02-03, 2027-02-04)`, items `[a]` kept, focus Feb 3, anchor Feb 3 | RD-07 selection policy |
| ST-6 | Dates `[Feb 1, Feb 6)`; Mod+click Feb 3 | Dates `[Feb 1, Feb 3)` and `[Feb 4, Feb 6)`, anchor kept, focus Feb 3 | RD-07 split rule / AR-5 |
| ST-7 | One selected date Feb 3; Mod+click Feb 3 | Dates empty, `anchorDate` cleared, `focusDate=Feb 3` | RD-07 anchor/focus |
| ST-8 | Visual order `[a,b,c,d]`, anchor item `b`; Shift+click `d` | Items `[b,c,d]`, dates empty, anchor `b`, focus `d` | RD-07 Shift item range / AR-6 |
| ST-9 | Item `a` selected, dates selected; Mod+click item `c` | Items `[a,c]`, dates kept, focus `c`, anchor kept | RD-07 Ctrl/Cmd item toggle |
| ST-10 | Ctrl/Cmd+Shift click on date or item | Selection object deep-equals the input; no diagnostic callback | RD-07 reserved combination / AR-7 |
| ST-11 | Visible items `[a,b,c]`, item `b` and a date selected; Ctrl/Cmd+A | Items `[a,b,c]`, dates empty, no item anchor, focus `c` | RD-07 Ctrl/Cmd+A |
| ST-12 | Marquee intersects `[b,c]` while items `[a]` and dates are selected | Items `[b,c]`, dates empty, no anchor, focus `c` | RD-07 marquee replace |
| ST-13 | Shift+marquee intersects `[c]` with items `[a,b]` | Items `[a,b,c]`, dates empty | RD-07 Shift marquee |
| ST-14 | Mod+marquee intersects `[a,c]` with items `[a,b]`, dates selected | Items `[b,c]`, dates kept, focus `c` | RD-07 Ctrl/Cmd marquee |
| ST-15 | Ranges `[Feb 5,Feb 8)`, `[Feb 1,Feb 3)`, `[Feb 2,Feb 5)`, `[Feb 10,Feb 10)` | Normalized to `[Feb 1, Feb 8)`; empty range dropped | RD-07 normalization / AR-5 |
| ST-16 | Remove Feb 3 from `[Feb 1, Feb 6)` | `[Feb 1, Feb 3)` and `[Feb 4, Feb 6)` | RD-07 split rule |
| ST-17 | Visible items with equal start dates but different row/lane/ID | Sorted by start, row, lane, ID; hidden item excluded | RD-07 visual start order / AR-6 |

### Gesture engine and coordinates

| # | Input / Scenario | Expected Output / Behavior | Source |
|---|------------------|----------------------------|--------|
| ST-18 | Pending gesture moves 2 px with threshold 4 | State stays `pending`; no preview/commit | RD-07 threshold / AR-9 |
| ST-19 | Pending gesture moves exactly 4 px | State becomes `active` | RD-07 threshold / AR-9 |
| ST-20 | Pointer down on the grid, then move | `setPointerCapture(pointerId)` called once on the root | RD-07 pointer capture / AR-10 |
| ST-21 | `pointercancel` during active gesture | State returns idle; completion is `none`; original item unchanged | RD-07 cancellation / AR-21 |
| ST-22 | Escape during an active move | Gesture cancelled; source item and focus restored; no command | RD-07 Escape / AC9 |
| ST-23 | Interaction mode changes from `auto` to `select` mid-drag | Gesture cancelled; no command; focus restored | RD-07 cancellation / AC14 |
| ST-24 | Year/range changes mid-drag | Gesture cancelled; no command | RD-07 cancellation / AC14 |
| ST-25 | Items array identity changes mid-drag | Gesture cancelled; no command | RD-07 cancellation / AC14 |
| ST-26 | Visibility object changes mid-drag | Gesture cancelled; no command | RD-07 cancellation / AC14 |
| ST-27 | Pointer 10 px from the right viewport edge | Auto-scroll delta x is positive and at most 12; center pointer gives `{0,0}` | RD-07 auto-scroll / AR-12 |
| ST-28 | Point maps with `scrollLeft=200`, `zoom=1.25`, sticky header | Returned date matches the prefix-width column; no rounding drift | RD-07 coordinate mapping / AR-11 |
| ST-29 | Pointer down on a blank slot; pointer move over blanks | No gesture start; the last valid date is held; no phantom date | RD-07 blank cells / AR-11 |
| ST-30 | Drag from Jan 31 to Feb 2 across two rows | Range is chronological `[Jan 31, Feb 3)`, not a rectangular cell block | RD-07 cross-row rule |
| ST-31 | Marquee intersects two fragments of one item | Item ID appears once | RD-07 marquee / AR-13 |
| ST-32 | Marquee over hidden item, overflow lane and highlight fragment | None of those IDs are returned | RD-07 hit-test / AR-13 |
| ST-33 | Disabled Feb 2; ArrowRight from Feb 1; pointer down on Feb 2 | Focus moves to Feb 3; pointer gesture never starts | RD-07 disabled dates / AC18 |
| ST-34 | Touch pointer with `touchEditing` off/auto/on | Off/auto start no gesture; on starts a gesture; `touch-action: none` only on | RD-07 touch / AC12 / AR-20 |

### Pointer wiring, commands and previews

| # | Input / Scenario | Expected Output / Behavior | Source |
|---|------------------|----------------------------|--------|
| ST-35 | Select mode drag Jan 28 → Feb 6 | Selection `[2027-01-28, 2027-02-07)`; exactly two `selection-preview` fragments (Jan and Feb rows) | RD-07 AC1 |
| ST-36 | Pointer moves 3 px then releases | One plain date click selection; no command; exactly one selection emission | RD-07 threshold / AR-9 |
| ST-37 | Pointer moves 5 px in select mode then releases | One range selection; the following click is suppressed | RD-07 click exclusivity / AR-9 |
| ST-38 | Auto mode empty-cell drag | Marquee item selection with exactly the intersecting visible IDs | RD-07 marquee default |
| ST-39 | Shift+marquee and Mod+marquee | Shift adds; Mod toggles; dates follow ST-13/ST-14 | RD-07 AC4 |
| ST-40 | Move 10-day `[Jan 28, Feb 7)` to Feb 2 | Proposed period `[Feb 2, Feb 12)`; 10 calendar days; two-row fragments | RD-07 AC7 |
| ST-41 | Grab a Jan 28 item at Jan 30 and drag to Feb 3 | Proposed start Feb 1; duration preserved | RD-07 grab offset / AR-15 |
| ST-42 | Resize end of `[Feb 1, Feb 6)` to Feb 4 | Proposed `[Feb 1, Feb 5)`; one-day minimum enforced | RD-07 resize / AC8 |
| ST-43 | Resize end before start | `INVALID_COMMAND`; no command; original item visible; focus restored | RD-07 AC8 / AR-15 |
| ST-44 | Paint `[Jun 10, Jun 12)` over `[Jun 10, Jun 14)` | One highlight `[Jun 10, Jun 14)`; one paint command with expected versions | RD-07 AC6 |
| ST-45 | Erase `[Jun 14, Jun 17)` from `[Jun 10, Jun 21)` | Two highlights `[Jun 10, Jun 14)` and `[Jun 17, Jun 21)`; undo restores original | RD-07 AC5 |
| ST-46 | Paint with no active highlight layer | `INVALID_PAINT_TARGET`; no command | RD-07 paint target / AR-17 |
| ST-47 | Create drag `[Feb 1, Feb 4)` with create defaults | Complete create item with layer, kind, version 1 and stable ID | RD-07 AC13 |
| ST-48 | Create with no defaults and no active layer | `INVALID_COMMAND`; no command | RD-07 AC13 / AR-17 |
| ST-49 | Delete with confirmation denied/allowed | Denied keeps the item and sends no command; allowed sends delete | RD-07 delete / AC13 |
| ST-50 | Any active drag | Canonical item array and periods are unchanged; preview only | RD-07 previews / AR-14 |
| ST-51 | Successful move commit | Preview disappears; moved item fragments render; focus on the item | RD-07 AC15 |
| ST-52 | Escape during move | Preview disappears; original period and focus restored | RD-07 AC9 |
| ST-53 | Double-click item with default / `doubleClick: "none"` | Default opens the inspector; `none` does not | RD-07 Should Have / AR-23 |
| ST-54 | Click a host `<button>` inside a cell | Button handler runs; no selection change and no gesture | RD-06 AC3 / AR-33 |
| ST-55 | Pointer down on an annotation | Selects/inspects only; no move/resize/delete command | RD-07 hit test / AR-24 |
| ST-56 | Touch editing on/off; any preview | `touch-action: none` only on; previews have `aria-hidden="true"` | RD-07 touch / AR-20, AR-34 |

### Keyboard, focus, undo and editability

| # | Input / Scenario | Expected Output / Behavior | Source |
|---|------------------|----------------------------|--------|
| ST-57 | ArrowRight on a cell | Focus moves to the next enabled date, one tab stop | RD-07 keyboard / AC11 |
| ST-58 | Shift+ArrowRight twice from Feb 1 | Selection `[Feb 1, Feb 4)`; anchor Feb 1, focus Feb 3 | RD-07 Shift+Arrow / AC11 |
| ST-59 | Space on a focused date/item | Toggles that date/item without clearing the other selection kind | RD-07 Space / AC11 |
| ST-60 | Enter on an item proxy | Selects the item and opens the inspector | RD-07 Enter / AC11 |
| ST-61 | Escape during gesture, then idle, then again | First cancels; second clears selection; third is a no-op | RD-07 Escape |
| ST-62 | Delete on a read-only/locked item | `READ_ONLY`; confirmation is not called; no delete command | RD-07 AC10 |
| ST-63 | Ctrl/Cmd+A with filter/visibility active | Selects only effectively visible items; clears dates | RD-07 AC3 / visibility precedence |
| ST-64 | Disabled Feb 2; ArrowRight from Feb 1 | Focus lands on Feb 3; disabled cell stays `aria-disabled` and never `tabindex=0` | RD-07 AC18 |
| ST-65 | Commit move, then lane repack; hide/remove item | Focus returns to the item's first visible fragment; hidden/removed falls back to a date cell | RD-07 AC15 |
| ST-66 | Hide a selected item through visibility props | Item is pruned from selection; focus moves to a nearby enabled date | RD-07 focus / AC15 |
| ST-67 | Undo/redo move, resize, paint, erase, create, update, delete | Each restores/reapplies; redo is cleared by a new edit | RD-07 AC16 / AR-22 |
| ST-68 | Controlled items; request undo/redo | No local history entry; `UNDO_UNAVAILABLE`; items props unchanged | RD-07 AC16 |
| ST-69 | Read-only planner or locked item; pointer move/resize/delete | Pipeline rejects `READ_ONLY`; no local mutation | RD-07 AC10 |
| ST-70 | Drag a timed item | `TIMED_EDITING_UNSUPPORTED`; no command | RD-07 timed rule |
| ST-71 | Host rejects a move or times out | Original item and focus remain; feedback shown; no phantom fragment | RD-07 AC9 / AR-29 |
| ST-72 | Resize range containing a disabled date | `INVALID_COMMAND`; no command; original restored | RD-07 disabled dates / AR-25 |

### End-to-end and release evidence

| # | Input / Scenario | Expected Output / Behavior | Source |
|---|------------------|----------------------------|--------|
| ST-73 | Playwright drag from Jan 28 to Feb 6 in the interaction demo | Controlled selection JSON shows `[2027-01-28, 2027-02-07)`; two preview fragments during drag | RD-07 AC1 |
| ST-74 | Playwright marquee over three ribbons | Selection JSON has exactly the three item IDs; no dates | RD-07 AC4 |
| ST-75 | Playwright move and resize with the mouse | Duration preserved; invalid resize shows a diagnostic and keeps the item | RD-07 AC7, AC8 |
| ST-76 | Playwright paint/erase then undo | Erase splits and undo restores; paint unions | RD-07 AC5, AC6 |
| ST-77 | Playwright keyboard-only path | Arrow, Shift+Arrow, Space, Enter and inspector move-by-week work | RD-07 AC11 |
| ST-78 | Playwright touch/mode-change scenarios | Touch off/auto does not edit; on selects; mode change cancels | RD-07 AC12, AC14 |
| ST-79 | Storybook static build | Build succeeds; interaction stories are present | AR-30 |
| ST-80 | API report, size and dependency check | `focusItemId`/`doubleClick` reported; under 60 kB; no new dependency | AR-31, AR-36 |

## Test Categories

### Specification Tests

| Test file | ST cases | Component |
| --- | --- | --- |
| `packages/react/src/interaction/selection.spec.test.tsx` | ST-1–ST-17 | Selection policy |
| `packages/react/src/interaction/gesture.spec.test.tsx` | ST-18–ST-34 | FSM, marquee, auto-scroll |
| `packages/react/src/interaction/pointer.spec.test.tsx` | ST-35–ST-56 | Pointer wiring, commands, previews |
| `packages/react/src/interaction/keyboard.spec.test.tsx` | ST-57–ST-72 | Keyboard, focus, undo, editability |
| `tests/e2e/interaction.spec.ts` | ST-73–ST-78 | Real browser gestures |
| Release checks | ST-79–ST-80 | Storybook/API/size |

### Implementation Tests

| Test file | Description | Priority |
| --- | --- | --- |
| `packages/react/src/interaction/selection.impl.test.tsx` | Range edge cases, adjacent merge, empty inputs | High |
| `packages/react/src/interaction/gesture.impl.test.tsx` | Threshold edges, tie-breaks, cancellation matrix | High |
| `packages/react/src/interaction/pointer.impl.test.tsx` | Capture fallback, click suppression, rAF coalescing | High |
| `packages/react/src/interaction/keyboard.impl.test.tsx` | Disabled-date edges, focus fallbacks, read-only | High |
| `packages/react/src/interaction.integration.spec.test.tsx` | View composition with controlled/uncontrolled state | Med |

### Integration Tests

| Test | Components | Description |
| --- | --- | --- |
| Controlled selection | YearPlanner + interaction | One emission per click/drag; host selection wins |
| Uncontrolled undo | YearPlanner + pipeline | Every command type undoes/redoes |
| Inspector parity | Inspector + builders | Inspector and gesture produce identical paint commands |

### End-to-End Tests

| Scenario | Steps | Expected Result |
| --- | --- | --- |
| Cross-month select | Drag Jan 28 → Feb 6 | Range and two previews |
| Marquee | Drag rectangle over three items | Exactly three IDs |
| Move | Drag item body | Duration preserved |
| Resize | Drag end handle | Minimum one day; invalid rejects |
| Paint/erase | Drag on highlight layer | Split/union; undo restores |
| Keyboard | Arrows/Shift/Space/Enter | Focus, range, toggle, inspector |
| Touch | Toggle off/auto/on | No accidental edit; on selects |
| Cancellation | Change mode mid-drag | No command |

## Test Data

### Fixtures Needed

- 2027 14-month layout with December 2026 and January 2028 context rows.
- Three overlapping ribbon items in `bookings`, `maintenance`, `training`.
- One highlight item `[Jun 10, Jun 21)` in an active `highlight` layer.
- One annotation item.
- One timed item.
- Disabled date `2027-03-10`.
- A host `<button>` in a cell and in the inspector (AC3 fixture).

### Mock Requirements

- `window.confirm` for delete confirmation (jsdom).
- `setPointerCapture`/`releasePointerCapture` feature detection (jsdom lacks them).
- `requestAnimationFrame` for auto-scroll and coalescing.
- No mocked planner logic; real core helpers and real command pipeline.

## Verification Checklist

- [ ] All specification test cases defined with concrete input/output pairs
- [ ] Every ST case traces to RD-07 or an AR entry
- [ ] Specification tests written before implementation
- [ ] Specification tests verified to fail before implementation
- [ ] Specification tests pass after implementation
- [ ] Implementation tests cover edges, cancellation, focus and rAF
- [ ] Existing RD-06 tests remain green
- [ ] Playwright passes in Chromium, Firefox and WebKit
- [ ] Storybook and API report build
- [ ] Bundle stays within 60 kB gzip
