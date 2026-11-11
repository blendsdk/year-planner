# Announcements and Status: Accessibility Plan

> **Document**: 03-03-announcements-status.md
> **Parent**: [Index](00-index.md)

## Overview

RD-09 requires seven command outcomes to be announced once and visible: pending, accepted,
rejected, timeout, stale, aborted and accepted-not-applied. The existing component only announces
three of them through a visually hidden polite region. This specification separates three concerns:

1. a **visible** status bar for sighted users;
2. a **hidden polite** announcer for pending, accepted, cancelled, selection and visibility;
3. a **hidden assertive** announcer for rejected and error outcomes.

Separating the visible text from the live regions prevents double announcements while keeping the
outcome visible. The existing `data-yp-part="command-status"` hook is preserved for tests and hosts.

## Architecture

### Current Architecture

- `YearPlanner.tsx` keeps `commandAnnouncement` in a visually hidden `role="status"` paragraph.
- The effect maps only `accepted`, `rejected` and `accepted-not-applied`.
- `InspectorFeedback` renders failure details, retry and dismiss.
- `pipeline.lastSettled` carries the result, command and diagnostics.

### Proposed Changes

| Surface | Location | Live? |
| ------- | -------- | ----- |
| Visible status bar | Root, above the viewport | No |
| Polite announcer | Hidden `p` | `aria-live="polite"` |
| Assertive announcer | Hidden `p` | `role="alert"` |
| Focus fallback | Existing hidden `p` | `aria-live="polite"` |
| Selection and visibility | Hidden `p` | `aria-live="polite"` |

## Implementation Details

### Status model

The mapping is a pure function in `packages/react/src/announcements.ts`:

```ts
/** Visible and announced form of the current command state. */
export interface CommandStatusView {
  text: string;
  level: "info" | "success" | "warning" | "error";
  announcement: "polite" | "assertive" | "none";
}

/** Maps the pipeline state to the visible status view. */
export function commandStatusView(input: {
  pending: boolean;
  settled: CommandSettlement | undefined;
}): CommandStatusView | undefined;
```

The effects live in `packages/react/src/useAnnouncements.ts`; the bar is
`packages/react/src/render/StatusBar.tsx`. `YearPlanner.tsx` stays near its current size and only
renders the returned messages (PF-001).

### Mapping

| Pipeline state | Visible text | Level | Announcer |
| -------------- | ------------ | ----- | --------- |
| Pending item | `Change pending` | info | polite |
| `accepted` | `Change accepted` | success | polite |
| `accepted-not-applied` | `Change accepted but not applied` | warning | polite |
| `confirmation-denied` | `Change cancelled` | info | polite |
| `rejected` + `COMMAND_TIMEOUT` | `Change timed out: <message>` | error | assertive |
| `rejected` + `COMMAND_ABORTED` | `Change aborted: <message>` | error | assertive |
| `rejected` + `STALE_REVISION` | `Change is stale: <message>` | error | assertive |
| `rejected` + `HOST_REJECTED` | `Change rejected: <message>` | error | assertive |
| `rejected` + other code | `Change rejected: <message>` | error | assertive |
| `ignored` / no settlement | — | — | none |

The message is always React text. Diagnostic messages are never inserted as HTML.

### Announce once

- A `wasPending` ref fires the polite announcement only on the `false → true` pending transition.
- The settlement effect depends on the `lastSettled` object identity, which changes once per
  settlement. It resets the announcement to `undefined` and re-sets it in a microtask so repeated
  identical text is announced again for a new settlement.
- The selection effect compares a stable signature (`dates` + `items`) and skips the first render.
- The visibility effect compares hidden group/layer/item/channel signatures and skips the first
  render.
- Settlement `ignored` and `confirmation-denied` do not produce a failure announcement.

### Selection and visibility text

| Change | Message |
| ------ | ------- |
| Selection cleared | `Selection cleared` |
| Items and dates | `Selection: N items, M days` |
| Dates only | `Selection: M days` |
| Items only | `Selection: N items` |
| Visibility changed | `Visibility changed: N items visible` |

### Visible status bar

`YearPlanner` renders the status as the first child of the content fragment:

```tsx
<p
  className="yp-command-status"
  data-yp-part="command-status"
  data-yp-level={status.level}
  hidden={!status}
>
  {status?.text}
</p>
```

CSS gives it `flex: 0 0 100%`, a quiet background, and `:empty { display: none }`. The root uses
`flex-wrap: wrap` so the bar sits above the viewport and inspector without changing the idle
layout. Print hides the bar.

When the user presses **Dismiss**, `pipeline.feedback` becomes `undefined`. An error-level status
is then hidden too, so a dismissed error does not leave a red bar behind (PF-010). Accepted and
cancelled statuses are not tied to feedback and remain until the next command.

### Error association

`YearPlanner` generates a stable feedback id and passes it to the inspector and item layer. The
inspector feedback section uses that id. An item proxy adds the id to `aria-describedby` when the
failed command targets that item. Paint failures keep their date range in the visible message and
are announced assertively; they do not attach to a proxy.

## Error Handling

| Error Case | Handling Strategy | AR Ref |
| ---------- | ----------------- | ------ |
| Host throws a non-Error | Pipeline normalizes to a diagnostic; status uses its message | AR-7 |
| Diagnostic message is empty | Fall back to `The host rejected the change` | AR-7 |
| Two settlements in one tick | The later settlement replaces the earlier visible text; each object identity announces once | AR-8 |
| Inspector closed | The status bar and live regions remain in the root | AR-7 |
| `renderInspector` replaces the body | Feedback id remains on the planner-owned feedback section only when the default body renders | AR-13 |

## Testing Requirements

- Unit tests for the mapping table, pending transition and duplicate suppression.
- Integration tests asserting the visible status text and one announcement per settlement.
- Playwright tests for accepted, rejected, timeout, stale, aborted and accepted-not-applied.
- axe scan in the error state.
