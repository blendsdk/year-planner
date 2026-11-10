# Requirements: RD-07 Interaction Engine, Selection and Keyboard

> **Document**: 01-requirements.md
> **Parent**: [Index](00-index.md)
> **Source**: [RD-07](../../requirements/RD-07-interaction-selection.md) — the OWNING requirements doc

## Scope of this plan (delta view)

### In this plan

- RD-07 interaction modes, 4 px threshold and exclusive click/drag behavior (AR-8, AR-9).
- RD-07 Pointer Events, capture, cancel, coordinate mapping and edge auto-scroll (AR-10–AR-12).
- RD-07 canonical selection with controlled/uncontrolled state and the full modifier matrix (AR-3–AR-7).
- RD-07 marquee behavior and visual-order item ranges (AR-13, AR-6).
- RD-07 move, resize, paint, erase, create and delete gestures through the existing pipeline (AR-15–AR-17).
- RD-07 keyboard matrix, focus restoration, disabled dates and gesture cancellation (AR-18, AR-19, AR-21, AR-25).
- RD-07 touch policy using the existing `touchEditing` prop (AR-20).
- RD-07 local undo/redo integration and double-click Should Have (AR-22, AR-23).
- Ephemeral previews, host-controlled controls, annotation inspect-only behavior (AR-14, AR-24, AR-33).
- Storybook, docs, API report, demo and browser evidence (AR-30, AR-31).

### Deferred / out of this plan

- **Alt+drag subtraction** — RD-07 Should Have, disabled by default; no modifier path is enabled (AR-1).
- **Batch multi-move and `bulk` commands** — RD-07 Won't Have (AR-1).
- **Split/merge reservations, drag between resources/layers, freehand painting, scheduling, RTL pointer behavior** — RD-07 Won't Have.
- **Rollback, stale-response cancellation, controlled-host history** — RD-08.
- **Announcements and full WCAG audit** — RD-09.
- **Performance/security browser matrix** — RD-10.
- **Publication and release** — RD-11/RD-12.

## Plan-local decisions

| Decision | Chosen | AR Ref |
| --- | --- | --- |
| Item focus field | Additive optional `focusItemId` in `PlannerSelection` | AR-3 |
| Selection policy location | Internal pure React module | AR-4 |
| Date range normalization | Sort + merge overlap/adjacent + split on toggle | AR-5 |
| Visual item order | Start date, row, lane, ID | AR-6 |
| Mode matrix | inspect/select never edit; paint/erase/create above threshold; move/resize scoped | AR-8 |
| Touch toggle | Host-controlled `touchEditing` prop, no built-in chrome | AR-20 |
| Double-click | `interaction.doubleClick: "inspect" \| "none"`, default inspect/focus | AR-23 |
| Focus announcement | Minimal polite live region when focus falls back | AR-34 |
| Heading navigation | Presentation-only in this slice | AR-37 |
| Selection callback timing | One emission on pointerup; immediate for click/keyboard | AR-27 |
| Verify command | `pnpm verify` per task; `pnpm verify:full` per phase/completion | AR-29 |

## Acceptance Criteria

The RD owns AC1–AC19. This plan adds only local completion criteria:

1. [ ] Every RD-07 AC maps to at least one ST case in `07-testing-strategy.md`.
2. [ ] RD-06 public props, handle, click selection and arrow-focus behavior remain green.
3. [ ] No new runtime dependency and the combined package stays within the 60 kB gzip budget.
4. [ ] `focusItemId` and `doubleClick` appear in the API report; docs describe touch as host-controlled.
5. [ ] Storybook builds and includes interaction stories for every observable RD-07 state.
