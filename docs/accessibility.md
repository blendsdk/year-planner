# Accessibility Guide

> **Scope**: semantics, focus, keyboard, announcements, contrast and evidence
> **Status**: Implemented; automated evidence green; manual NVDA/VoiceOver audit parked
> **Conformance claim**: none. A WCAG 2.2 AA statement is published only after the manual audit.

## Conformance claim

None. The automated evidence is green, but the manual NVDA/VoiceOver audit is
parked; a WCAG 2.2 AA statement is published only after that audit.

## What is covered

The planner targets WCAG 2.2 AA for the classic year view. The implementation provides:

- a labelled planner region and a labelled 37-column ARIA grid;
- one roving tab stop for date cells, item proxies and the active row’s overflow button;
- item proxies with names that include title, period, layer, pattern, status, selection and
  clipping;
- a keyboard-reachable **All visible items** list inside the inspector;
- polite and assertive live regions for commands, selection, visibility and focus fallback;
- a visible command status bar;
- contrast-safe ribbon, border and focus colours in every built-in preset;
- 24 px minimum targets for planner-owned controls;
- forced-colours, reduced-motion and print rules;
- hidden items excluded from the DOM, names, counts, overflow and the item list.

## Keyboard map

| Key | Action |
| --- | ------ |
| `Tab` | Skip link → one date cell → one item proxy → one overflow button → inspector |
| Arrow keys | Move date focus by day or week; disabled dates are skipped |
| `Shift` + arrow | Extend the date selection from the anchor |
| `Home` / `End` | First / last enabled date in the focused month row |
| `Space` | Toggle the focused date or item |
| `Enter` | Inspect the focused date or item |
| `Escape` | Cancel a gesture, then clear selection; close the overflow dialog |
| `Delete` | Delete the focused item after host confirmation |
| `Ctrl`/`Cmd` + `A` | Select every effectively visible item |

PageUp/PageDown are not implemented; they are optional in the requirements.

## Semantics

| Part | Contract |
| ---- | -------- |
| Root | `role="region"` with `ariaLabel` |
| Grid | `role="grid"`, `aria-rowcount`, `aria-colcount=37`, `"<label> grid"` name, generated shortcut description |
| Row | `role="row"` |
| Date cell | `role="gridcell"`, `aria-selected`, name with date, item count, ISO week, holiday and disabled state |
| Item proxy | `role="button"`, `aria-pressed`, rich `aria-label`, no nested interactive controls |
| Resize handles | Sibling buttons, `tabindex=-1`, 24×24 hit area |
| Overflow | `aria-expanded`, `aria-controls`, `aria-haspopup="dialog"`, one roving tab stop |
| Inspector | Labelled `aside`, close button, selected details, active-row overflow, visible item list |
| Live regions | Visible status bar; hidden polite command/selection/visibility regions; hidden `role="alert"` errors |

The item overlay is a **sibling of the ARIA grid**, not a child. Item buttons remain focusable
without breaking the rule that a `row` owns only grid cells.

## Names and states

A date cell with two items might read:

`"Feb 1, 2027, ISO week 5, 2 items, selected"`.

An item proxy might read:

`"Winter booking, Jan 28, 2027 - Feb 6, 2027, layer Bookings, selected"`.

Selected state is also visible through an outline, bold text and underline. Holidays use a dotted
underline and the word `holiday` in the name. Overflow uses `+N` text.

## Contrast evidence

| Preset | Ribbon | Chosen text | Ratio | Focus ring | Border |
| ------ | ------ | ----------- | ----- | ---------- | ------ |
| classic-blue | `#76bfe5` | `#1b2329` | 7.85 | 5.28 | 4.03 |
| classic-yellow | `#f6f368` | `#24251d` | 13.22 | 5.33 | 3.58 |
| modern | `#243b53` | `#ffffff` | 11.50 | 4.24 | 3.54 |
| high-contrast | `#000000` | `#ffffff` | 21.00 | 8.59 | 21.00 |
| print | `#2f5d8a` | `#ffffff` | 6.88 | 21.00 | 21.00 |

The ribbon text is computed from the actual fragment background, so a host layer colour (for
example a dark blue bookings layer) still gets readable text. A host that uses a non-hex colour can
override `--yp-ribbon-text` through `cssVars`.

## Target size

| Control | Size |
| ------- | ---- |
| Date cell | 55×90 design px (scaled by zoom) |
| Item proxy | 24 px high in compact density |
| Resize handle | 24×24 hit area, 3 px visual line |
| Overflow button | at least 24×24 |
| Overflow entry | 28 px high with 2 px spacing |
| Inspector buttons | at least 26 px high |
| Skip link | padded focus target |

Three compact lanes at 24 px plus the 18 px lane top equal the existing 90 px row height, so lane
capacity is unchanged.

## Automated evidence

`tests/e2e/accessibility.spec.ts` injects the existing `axe-core` dependency into the demo and
scans the planner root with the WCAG 2.0/2.1/2.2 A+AA tags in Chromium:

| State | Result |
| ----- | ------ |
| classic-blue, compact | no serious or critical violations |
| classic-yellow, compact | no serious or critical violations |
| high-contrast, compact | no serious or critical violations |
| expanded density | no serious or critical violations |
| open overflow dialog | no serious or critical violations |
| command error feedback | no serious or critical violations |
| AC3 Fluent UI/MUI buttons | no serious or critical violations |
| 36-month window | no serious or critical violations |
| forced colours | focus ring remains visible |

The browser file also checks keyboard selection, exactly one tab stop per composite, the skip link,
move-by-week, hidden-item removal, an unclipped proxy focus ring, a distinct selected-cell focus,
forced-colours focus visibility and nested-control absence.

## Manual screen-reader protocol

Run this on a Windows host with NVDA or a macOS host with VoiceOver. Record the browser, OS, AT
version and date in [test-report.md](test-report.md).

1. Tab to **Skip to item list**; confirm the link is announced and opens the item list.
2. Confirm the grid announces the planner name and the shortcut description.
3. Move across dates; confirm date, item count, ISO week, holiday and selected states.
4. Tab to an item proxy; confirm title, period, layer, pattern, status and selection.
5. Select and inspect; confirm the inspector heading, selected details and item list.
6. Trigger a rejected command; confirm one assertive announcement and the visible status.
7. Hide the focused item; confirm focus moves to a nearby date and is announced.
8. Open the overflow dialog; confirm the count, the entries and Escape focus return.

### Current evidence status

- **Parked by user decision on 2026-11-11.** The manual NVDA/VoiceOver audit is low priority and is
  not an R1 blocker. This Linux workspace cannot run either named screen reader.
- Orca 50.2 and `xvfb-run` are present. Orca attached to Chrome’s AT-SPI tree, but the smoke run
  reached Chrome’s first-run UI instead of the planner and produced no planner speech output. It is
  **not** recorded as manual evidence.
- Revisit when a Windows or macOS host with NVDA or VoiceOver is available, and before any WCAG
  conformance statement. No conformance statement is published today.

## Known limitations

- The manual NVDA/VoiceOver audit is parked; no WCAG conformance claim is made.
  The measured boundaries are listed in [limitations.md](limitations.md).
- Item proxies are outside grid navigation; the item list is the parallel path required by the
  keyboard model.
- Compact item proxies are 24 px high; hosts that override `laneHeight` below 24 px take ownership
  of target size.
- `renderItem` content inside a proxy is host-owned and must not add interactive controls. The
  planner warns in development and the axe matrix checks for nesting.
- A full HTML validator is not installed; the nested-control risk is covered by axe
  `nested-interactive` and a DOM scan.
- Deferred capabilities are listed in [DEFERRED.md](../DEFERRED.md).
