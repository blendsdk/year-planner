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
> Expectations are fixed before implementation. ST cases are grouped by the
> phase that implements them so each phase gate is reachable.

### Phase 1 — Selection policy

| # | Input / Scenario | Expected Output / Behavior | Source |
|---|------------------|----------------------------|--------|
| ST-1 | Plain click `2027-02-01` with dates and item `a` selected | Dates `[2027-02-01, 2027-02-02)`, items empty, `anchorDate=focusDate=2027-02-01`, item anchors/focus cleared | RD-07 selection policy / AR-5 |
| ST-2 | Plain click item `b` while a date is selected | Items `[b]`, dates empty, `anchorItemId=focusItemId=b`, date anchor/focus cleared | RD-07 selection policy / AR-3 |
| ST-3 | Anchor Feb 1, focus Feb 3; Shift+click Feb 5 | Dates `[2027-02-01, 2027-02-06)`, items empty, anchor Feb 1, focus Feb 5 | RD-07 anchor/focus / AR-5 |
| ST-4 | No anchor, focus Feb 2; Shift+click Feb 4 | Anchor becomes Feb 2; dates `[2027-02-02, 2027-02-05)` | RD-07 anchor/focus / AR-5 |
| ST-5 | Mod+click unselected Feb 3 with item `a` selected | Dates `[2027-02-03, 2027-02-04)`, items `[a]` kept, focus Feb 3, anchor Feb 3 | RD-07 selection policy / AR-5 |
| ST-6 | Dates `[Feb 1, Feb 6)`; Mod+click Feb 3 | Dates `[Feb 1, Feb 3)` and `[Feb 4, Feb 6)`, anchor kept, focus Feb 3 | RD-07 split rule / AR-5 |
| ST-7 | One selected date Feb 3; Mod+click Feb 3 | Dates empty, `anchorDate` cleared, `focusDate=Feb 3`, item state unchanged | RD-07 anchor/focus / AR-5 |
| ST-8 | Visual order `[a,b,c,d]`, anchor `b`; Shift+click `d` | Items `[b,c,d]`, dates empty, anchor `b`, focus `d` | RD-07 Shift item range / AR-6 |
| ST-9 | No item anchor; Shift+click `c` with visual order `[a,b,c]` | Anchor becomes `c`; items `[c]`; dates empty | RD-07 anchor/focus / AR-6 |
| ST-10 | Item `a` selected, date selected; Mod+click item `c` | Items `[a,c]`, dates kept, focus `c`, anchor kept | RD-07 Ctrl/Cmd item toggle |
| ST-11 | One selected item `a`; Mod+click `a` | Items empty, `anchorItemId` cleared, `focusItemId` stays `a`; dates kept | RD-07 anchor/focus |
| ST-12 | Ctrl/Cmd+Shift click on a date or item | Selection deep-equals the input; no diagnostic callback | RD-07 reserved combination / AR-7 |
| ST-13 | Ctrl/Cmd+Shift date drag | Selection deep-equals the input; no diagnostic | RD-07 reserved combination / AR-7 |
| ST-14 | Visible `[a,b,c]`, item `b` and a date selected; Ctrl/Cmd+A | Items `[a,b,c]`, dates empty, date anchor/focus cleared, item anchor cleared, focus `c` | RD-07 Ctrl/Cmd+A |
| ST-15 | Marquee intersects `[b,c]` while `[a]` and dates selected | Items `[b,c]`, dates empty, all anchors cleared, focus `c` | RD-07 marquee replace |
| ST-16 | Shift+marquee intersects `[c]` with `[a,b]` selected | Items `[a,b,c]`, dates empty, item anchor cleared, focus `c` | RD-07 Shift marquee |
| ST-17 | Mod+marquee intersects `[a,c]` with `[a,b]`, dates selected | Items `[b,c]`, dates kept, item anchor cleared, focus `c` | RD-07 Ctrl/Cmd marquee |
| ST-18 | Ranges `[Feb 5,Feb 8)`, `[Feb 1,Feb 3)`, `[Feb 2,Feb 5)`, `[Feb 10,Feb 10)` | Normalized to `[Feb 1, Feb 8)`; empty range dropped | RD-07 normalization / AR-5 |
| ST-19 | Remove Feb 3 from `[Feb 1, Feb 6)` | `[Feb 1, Feb 3)` and `[Feb 4, Feb 6)` | RD-07 split rule |
| ST-20 | Visible items with equal start dates but different row/lane/ID | Sorted by start, row, lane, ID; hidden item excluded | RD-07 visual order / AR-6 |
| ST-21 | `clearSelection()` on a selection with every field set | Dates, items, date anchors/focus and item anchors/focus all cleared | RD-07 Escape / AR-5 |
| ST-22 | Drag a date range across disabled Feb 3 | Selection splits into ranges excluding Feb 3; no disabled date is selected | RD-07 AC18 / AR-25 |

### Phase 2 — Gesture engine, coordinates and marquee

| # | Input / Scenario | Expected Output / Behavior | Source |
|---|------------------|----------------------------|--------|
| ST-23 | Pending gesture moves 2 px with threshold 4 | State stays `pending`; no preview/commit | RD-07 threshold / AR-9 |
| ST-24 | Pending gesture moves exactly 4 px | State becomes `active` | RD-07 threshold / AR-9 |
| ST-25 | Pointer 10 px from the right viewport edge | Auto-scroll delta x is positive and at most 12; center pointer gives `{0,0}` | RD-07 auto-scroll / AR-12 |
| ST-26 | 2027 layout, zoom 1.25, `scrollLeft=200`, `scrollTop=0`, header 36, viewport `{0,0,1200,800}`, point `(266.25, 36.5)` | `pointToDate` returns `2026-12-04` | RD-07 coordinates / AR-11 |
| ST-27 | Same view with `density:"expanded"` or five lanes; pointer in row 2 | Row is found through `ribbonRow.top/height`, not `layout.rowHeight`; date is in the second month | RD-07 coordinates / AR-11 |
| ST-28 | Pointer down on a blank slot | No gesture starts; no date is invented | RD-07 blank cells / AR-11 |
| ST-29 | Pointer down on a valid date, then move over blank slots | Last valid date is held; release uses it; no phantom date | RD-07 blank cells / AR-11 |
| ST-30 | Drag from Jan 31 to Feb 2 across two rows | Range is chronological `[Jan 31, Feb 3)`, not a rectangular cell block | RD-07 cross-row rule |
| ST-31 | Marquee intersects two fragments of one item | Item ID appears once | RD-07 marquee / AR-13 |
| ST-32 | Marquee over hidden item, overflow lane and highlight fragment | None of those IDs are returned | RD-07 hit-test / AR-13 |
| ST-33 | Marquee press at A, release at B without a final pointermove | Rectangle is A→B from the pointerup design point | RD-07 marquee / AR-13 |
| ST-34 | Move a 10-day `[Jan 28, Feb 7)` item with grab offset 0 to Feb 2 | Proposed `[Feb 2, Feb 12)`; 10 calendar days | RD-07 AC7 / AR-15 |
| ST-35 | Move `[Jan 28, Feb 7)` grabbed on Jan 30 and dragged to Feb 3 | Proposed start Feb 1; 10-day duration preserved | RD-07 grab offset / AR-15 |
| ST-36 | Resize end of `[Feb 1, Feb 6)` to Feb 1 | Proposed `[Feb 1, Feb 2)`; one-day minimum | RD-07 AC8 / AR-15 |
| ST-37 | Resize start of `[Feb 1, Feb 6)` to Feb 5 | Proposed `[Feb 5, Feb 6)`; one-day minimum | RD-07 AC8 / AR-15 |
| ST-38 | Resize end before start or start past end | Completion is `invalid` with `INVALID_COMMAND`; no command | RD-07 AC8 / AR-15 |
| ST-39 | Drag anchor Feb 6 to focus Feb 2 | Paint/create range is chronological `[Feb 2, Feb 7)` | RD-07 range rule |
| ST-40 | Controlled host recreates equal items/visibility/filter arrays; real content change | Equal-content re-render does not cancel; real `ribbons.signature` change cancels | RD-07 cancellation / AR-21 |
| ST-41 | Interaction mode changes mid-gesture | Gesture cancels; no command; focus restored | RD-07 AC14 / AR-21 |

### Phase 3 — Pointer wiring, commands and previews

| # | Input / Scenario | Expected Output / Behavior | Source |
|---|------------------|----------------------------|--------|
| ST-42 | Pointer down on the grid, then move | `setPointerCapture(pointerId)` called once on the root | RD-07 pointer capture / AR-10 |
| ST-43 | `pointercancel` during active gesture | Idle; no completion; original item and focus unchanged | RD-07 cancellation / AR-21 |
| ST-44 | `lostpointercapture` during active gesture | Same cancellation as ST-43 | RD-07 cancellation / AR-21 |
| ST-45 | Escape during active move | Gesture cancelled; source item and focus restored; no command | RD-07 AC9 |
| ST-46 | Mode changes from `auto` to `select` mid-drag | Gesture cancels; no command; focus restored | RD-07 AC14 |
| ST-47 | Year/range, items, visibility or filter content changes mid-drag | Gesture cancels; no command | RD-07 AC14 / AR-21 |
| ST-48 | Select mode drag Jan 28 → Feb 6 | Selection `[2027-01-28, 2027-02-07)`; exactly two transient `selection-preview` fragments (Jan and Feb) | RD-07 AC1 |
| ST-49 | Pointer moves 3 px then releases | One plain date selection; exactly one `onSelectionChange`; no command | RD-07 threshold / AR-9 |
| ST-50 | Drag beyond 4 px, then release | One range/gesture result; the following native click is suppressed | RD-07 click exclusivity / AR-9 |
| ST-51 | Click a host `<button>` inside a cell | Button handler runs; selection unchanged; no gesture | RD-06 AC3 / AR-33 |
| ST-52 | Press Delete/Arrow/Ctrl+A in a host `<input>` inside a cell | Planner handlers do not run; input keeps its keys | RD-06 AC3 / AR-33 |
| ST-53 | Move 10-day item to a cross-month target | Duration preserved; two proposed-row fragments | RD-07 AC7 |
| ST-54 | Move across a year boundary (Dec 28 → Jan 2) | Duration preserved; December and January fragments | RD-07 move / AR-15 |
| ST-55 | Resize end to a valid shorter range | One resize command; one-day minimum respected | RD-07 AC8 |
| ST-56 | Resize end before start | `INVALID_COMMAND`; no command; original item visible; focus restored | RD-07 AC8 / AR-15 |
| ST-57 | Paint `[Jun 10, Jun 12)` over `[Jun 10, Jun 14)` | One highlight `[Jun 10, Jun 14)`; one paint command | RD-07 AC6 |
| ST-58 | Erase `[Jun 14, Jun 17)` from `[Jun 10, Jun 21)` | Two highlights `[Jun 10, Jun 14)` and `[Jun 17, Jun 21)`; undo restores original | RD-07 AC5 |
| ST-59 | Paint range intersects a visible locked highlight | `expectedVersions` excludes the locked item; command is not rejected by its version | RD-04 paint reducer / AR-16 |
| ST-60 | Paint with no active highlight layer | `INVALID_PAINT_TARGET`; no command | RD-07 paint target / AR-17 |
| ST-61 | Create drag with `createDefaults` | Complete create item with layer, kind, version 1, stable ID | RD-07 AC13 |
| ST-62 | Create with only `activeLayerId` | Layer falls back to `activeLayerId`; ID uses `createPlannerId` | RD-07 AC13 / AR-16 |
| ST-63 | Create with no defaults and no active layer | `INVALID_COMMAND`; no command | RD-07 AC13 / AR-17 |
| ST-64 | Delete with confirmation denied/allowed | Denied keeps the item and sends no command; allowed sends delete | RD-07 delete / AC13 |
| ST-65 | Any active drag | Canonical item array and periods unchanged; preview only | RD-07 previews / AR-14 |
| ST-66 | Selection after pointerup; controlled selection with ranges | Persistent `data-yp-part="selection"` fragments remain rendered | RD-07 selection state / AR-14 |
| ST-67 | Pointerdown over a persistent preview or marquee | Preview/marquee has `pointer-events: none`; the event reaches the cell/item | RD-07 preview / AR-14 |
| ST-68 | Pointer down on an annotation, or a resize handle when resize is not editable | Annotation selects/inspects only; non-editable handle falls back to item click selection; no edit command | RD-07 hit test / AR-24 |
| ST-69 | Host rejects a move or times out | Original item and focus remain; feedback shown; no phantom fragment; RD-08 owns rollback | RD-07 previews / AR-26 |
| ST-70 | Move an item to a date outside the visible window | Unknown date is not treated as disabled; command is emitted with the requested period | RD-07 move / AR-25 |

### Phase 4 — Keyboard, focus, touch and undo

| # | Input / Scenario | Expected Output / Behavior | Source |
|---|------------------|----------------------------|--------|
| ST-71 | ArrowRight on a cell | Focus moves to the next enabled date, one tab stop | RD-07 keyboard / AC11 |
| ST-72 | Shift+ArrowRight twice from Feb 1; Ctrl/Cmd+Shift+Arrow | Selection `[Feb 1, Feb 4)`; anchor Feb 1, focus Feb 3; reserved modifier changes nothing | RD-07 Shift+Arrow / AC11 / AR-7 |
| ST-73 | Space on a focused date/item | Toggles that date/item without clearing the other selection kind | RD-07 Space / AC11 |
| ST-74 | Enter on an item proxy | Selects the item and opens the inspector | RD-07 Enter / AC11 |
| ST-75 | Escape with an active gesture, then idle, then again | First cancels; second clears selection; third is a no-op | RD-07 Escape |
| ST-76 | Ctrl/Cmd+A with filter/visibility active | Selects only effectively visible items; clears dates | RD-07 AC3 / visibility precedence |
| ST-77 | Delete with focused item, one selected item, or multiple selected items | Focused item wins; else the sole selected item; else no-op with `INVALID_COMMAND` | RD-07 delete / AR-18 |
| ST-78 | Disabled Feb 2; ArrowRight from Feb 1 | Focus lands on Feb 3; disabled cell stays `aria-disabled` and never `tabindex=0` | RD-07 AC18 |
| ST-79 | Move/paint range containing a disabled date | `INVALID_COMMAND`; no command; original restored | RD-07 AC18 / AR-25 |
| ST-80 | Commit move, then lane repack | Focus returns to the item's first visible fragment | RD-07 AC15 |
| ST-81 | Hide/remove the focused selected item | Item pruned from selection; focus moves to the nearest enabled date; polite live region announces the fallback | RD-07 AC15 |
| ST-82 | Undo/redo move, resize, paint, erase, create, update, delete | Each restores/reapplies; redo is cleared by a new edit | RD-07 AC16 / AR-22 |
| ST-83 | Controlled items; request undo/redo | No local history; `UNDO_UNAVAILABLE`; items props unchanged | RD-07 AC16 |
| ST-84 | Read-only planner or locked item; pointer move/resize/delete | No gesture/preview starts; imperative command still rejects `READ_ONLY`; no local mutation | RD-07 AC10 / AC19 |
| ST-85 | Drag a timed item | `TIMED_EDITING_UNSUPPORTED`; no command | RD-07 timed rule |
| ST-86 | Touch pointer with `touchEditing` off/auto | No gesture; native scrolling remains | RD-07 touch / AC12 / AR-20 |
| ST-87 | Touch pointer with `touchEditing: "on"` | Gesture starts; `touch-action: none` only while on | RD-07 touch / AC12 / AR-20 |
| ST-88 | Double-click item with default / `doubleClick: "none"` | Default opens and focuses the inspector; `none` keeps single-click behavior but does not focus it | RD-07 Should Have / AR-23 |
| ST-89 | Controlled selection; plain click and drag | Exactly one `onSelectionChange` per gesture; host value wins; no local mutation | RD-07 controlled selection |
| ST-90 | Uncontrolled `defaultSelection` then click | Default seeds once; click updates local selection and emits once | RD-07 controlled selection |

### Phase 5 — End-to-end and release evidence

| # | Input / Scenario | Expected Output / Behavior | Source |
|---|------------------|----------------------------|--------|
| ST-91 | Playwright drag Jan 28 → Feb 6 in the interaction demo | Selection JSON shows `[2027-01-28, 2027-02-07)`; two transient previews during drag | RD-07 AC1 |
| ST-92 | Playwright marquee over three ribbons | Selection JSON has exactly the three item IDs; no dates | RD-07 AC4 |
| ST-93 | Playwright move and resize with the mouse | Duration preserved; invalid resize shows a diagnostic and keeps the item | RD-07 AC7, AC8 |
| ST-94 | Playwright paint/erase then undo | Erase splits and undo restores; paint unions | RD-07 AC5, AC6 |
| ST-95 | Playwright keyboard-only path | Arrow, Shift+Arrow, Space, Enter and inspector move-by-week work | RD-07 AC11 |
| ST-96 | Touch-enabled Chromium swipe with editing off/on | Off/auto scrolls and selects nothing; on selects and does not scroll | RD-07 AC12 |
| ST-97 | Playwright mode change mid-drag | Preview cleared, no command, focus restored | RD-07 AC14 |
| ST-98 | Storybook, API report and size checks | Static build includes interaction stories; `focusItemId`/`doubleClick` reported; under 60 kB; no new dependency | AR-30, AR-31, AR-36 |

## Test Categories

### Specification Tests

| Test file | ST cases | Component |
| --- | --- | --- |
| `packages/react/src/interaction/selection.spec.test.tsx` | ST-1–ST-22 | Selection policy |
| `packages/react/src/interaction/gesture.spec.test.tsx` | ST-23–ST-41 | FSM, coordinates, marquee, cancellation |
| `packages/react/src/interaction/pointer.spec.test.tsx` | ST-42–ST-70 | Pointer wiring, commands, previews |
| `packages/react/src/interaction/keyboard.spec.test.tsx` | ST-71–ST-90 | Keyboard, focus, touch, undo |
| `packages/react/src/interaction.integration.spec.test.tsx` | ST-89–ST-90 | Controlled/uncontrolled composition |
| `tests/e2e/interaction.spec.ts` | ST-91–ST-97 | Real browser gestures and touch |
| Release checks | ST-98 | Storybook/API/size |

### Implementation Tests

| Test file | Description | Priority |
| --- | --- | --- |
| `packages/react/src/interaction/selection.impl.test.tsx` | Range edge cases, adjacent merge, empty inputs | High |
| `packages/react/src/interaction/gesture.impl.test.tsx` | Threshold edges, tie-breaks, design→screen conversion | High |
| `packages/react/src/interaction/pointer.impl.test.tsx` | Capture fallback, click suppression, rAF coalescing | High |
| `packages/react/src/interaction/keyboard.impl.test.tsx` | Disabled-date edges, focus fallbacks, read-only | High |
| `packages/react/src/interaction/builders.impl.test.tsx` | Paint/create builders, ID fallback, locked item exclusion | High |

### Integration Tests

| Test | Components | Description |
| --- | --- | --- |
| Controlled selection | YearPlanner + interaction | One emission per click/drag; host selection wins |
| Uncontrolled undo | YearPlanner + pipeline | Every command type undoes/redoes |
| Inspector parity | Inspector + builders | Inspector and gesture produce identical paint commands |
| Host controls | CellLayer/ItemLayer + interaction | Buttons/inputs keep their pointer and key events |

### End-to-End Tests

| Scenario | Steps | Expected Result |
| --- | --- | --- |
| Cross-month select | Drag Jan 28 → Feb 6 | Range and two previews |
| Marquee | Drag rectangle over three items | Exactly three IDs |
| Move | Drag item body to a cross-month target | Duration preserved |
| Resize | Drag end/start handles | Minimum one day; invalid rejects |
| Paint/erase | Drag on highlight layer | Split/union; undo restores |
| Keyboard | Arrows/Shift/Space/Enter | Focus, range, toggle, inspector |
| Touch | Real CDP swipe off/on | Scroll vs select |
| Cancellation | Change mode mid-drag | No command |

## Test Data

### Fixtures Needed

- 2027 14-month layout with December 2026 and January 2028 context rows.
- Three overlapping ribbon items in `bookings`, `maintenance`, `training`.
- One highlight item `[Jun 10, Jun 21)` in an active `highlight` layer.
- One locked/read-only highlight for paint expected-version exclusion.
- One annotation item.
- One timed item.
- Disabled date `2027-03-10`.
- A host `<button>` and `<input>` in cells (AC3 fixture).

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
- [ ] Playwright passes in Chromium, Firefox, WebKit and the touch project
- [ ] Storybook and API report build
- [ ] Bundle stays within 60 kB gzip
