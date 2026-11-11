# Security and Privacy: Quality Gates Plan

> **Document**: 03-04-security-privacy.md
> **Parent**: [Index](00-index.md)

## Overview

RD-10 turns the existing security guardrails into a verified gate: hidden items must be absent from
every rendered surface, XSS payloads must stay inert, the component must emit no network or
telemetry request, and the dependency audit must have no high or critical advisory. The plan also
adds the missing license report and updates the security notes with the audit result.

The component is not a confidentiality boundary. Hidden data still exists in the host's JavaScript
state; the guarantee is that the planner does not render, announce, expose or print it. The host
remains authoritative for authorization and persistence.

## Architecture

### Current Architecture

- Hidden items are excluded from fragments and proxies
  (`packages/react/src/items.spec.test.tsx:188-204`), tooltips clear when an item becomes hidden
  (`:466-485`), and the inspector omits hidden selected items
  (`packages/react/src/inspector.spec.test.tsx:175-…`).
- Metadata is never rendered as HTML, and unsafe item styles are filtered
  (`packages/react/src/items.spec.test.tsx:487-505`, `packages/react/src/safeStyle.ts`).
- `docs/security.md` documents the trust boundary, output safety, CSP and limitations.
- There is no print hidden-data test, no network spy, no audit script and no license report.
- `pnpm audit` currently reports **2 critical** `tinypool` advisories through Vitest 3.2.7, plus 5
  moderate advisories.

### Proposed Changes

| Artifact | Change |
| -------- | ------ |
| `packages/react/src/security.spec.test.tsx` | Hidden/XSS/network spec tests |
| `packages/react/src/security.impl.test.tsx` | Safe-style and validation edge cases |
| `tests/e2e/security.spec.ts` | Cross-origin request log, hidden-data DOM scan, CSP |
| `package.json` | Vitest 4.1.12 and coverage 4.1.12; `test:audit`, `test:licenses` |
| `scripts/write-licenses.mjs` | Generate/check `THIRD_PARTY_NOTICES.md` from `pnpm -r licenses list --prod` and `pnpm licenses list --dev` |
| `THIRD_PARTY_NOTICES.md` | Checked-in runtime and development-tooling report |
| `docs/security.md` | Audit result, accepted moderate risk, RD-10 evidence |

## Implementation Details

### Hidden-data contract

One sentinel item is used across every surface:

```ts
const hiddenItem = {
  id: "secret-item",
  kind: "activity",
  layerId: "bookings",
  period: { kind: "all-day", startDate: "2027-02-01", endDateExclusive: "2027-02-04" },
  title: "TOPSECRET-HIDDEN",
  version: 1,
};
```

The test renders a **valid** planner so a zero-item empty state cannot make the leak assertions
pass vacuously:

```tsx
<YearPlanner
  year={2027}
  layers={[bookingsLayer, notesLayer]}
  defaultItems={[hiddenItem, visibleControl]}
  defaultVisibility={{ hiddenGroupIds: [], hiddenLayerIds: [], hiddenItemIds: ["secret-item"] }}
/>
```

Before the leak assertions, the test asserts that the grid, at least one visible proxy, the item
list and the print page are present. The layer-hidden and group-hidden variants use the same
control item.

| Surface | Assertion |
| ------- | --------- |
| DOM | `container.innerHTML` does not contain `TOPSECRET-HIDDEN` or `secret-item`; a visible control item is present |
| ARIA | No accessible name, description, label or `aria-*` value contains the title |
| Tooltip | No tooltip appears on hover or focus at the hidden item's dates |
| Item list | The inspector's item list does not contain the title |
| Inspector | The inspector renders no details for the hidden item |
| Print | The hidden print tree does not contain the title |
| Overflow | No overflow entry or count includes the hidden item |
| Diagnostics | Local hidden-item diagnostics keep the id but omit the title and dates |

The same test runs with a layer-hidden item and a group-hidden item to prove precedence. The demo's
`?security=1` route adds a hidden sentinel plus a visible control, and the E2E test asserts the
visible grid and proxy count before any leak assertion.

### XSS contract

| Input | Expected |
| ----- | -------- |
| Title `<img src=x onerror=alert(1)>` | Rendered as text; no `img` element |
| Metadata `{ html: "<script>alert(1)</script>" }` | Never read or rendered |
| `style.backgroundImage: "url(javascript:alert(1))"` | Dropped |
| `style.color: "red; background:url(https://attacker.example)"` | Invalid value dropped; no CSS injection |
| `className: "x\" onmouseover=\"alert(1)"` | React escapes the attribute value |
| Annotation label `<b>OH</b>` | Rendered as text; no `b` element |

The test also scans the React package source for `dangerouslySetInnerHTML` and fails if the token
appears in production source. Test fixtures are excluded.

### Network and telemetry contract

Unit test spies:

```ts
const fetchSpy = vi.spyOn(globalThis, "fetch");
const xhrSpy = vi.spyOn(globalThis, "XMLHttpRequest");
const socketSpy = vi.spyOn(globalThis, "WebSocket");
const beacon = vi.fn();
Object.defineProperty(navigator, "sendBeacon", { configurable: true, value: beacon });
```

Render the planner, move the pointer, select dates, open the inspector, open and close overflow, and
assert every spy and the beacon stub have zero calls. Add `EventSource` and `Image` sinks to the
same assertion. No analytics package is imported by either package; a source scan fails on `fetch(`,
`XMLHttpRequest`, `sendBeacon`, `EventSource` or `WebSocket` in production source.

Playwright test:

```ts
const unexpected: string[] = [];
let loaded = false;
page.on("request", (request) => {
  if (!loaded) return;
  const url = new URL(request.url());
  if (url.protocol === "data:" || url.protocol === "blob:") return;
  const allowed =
    url.origin === "http://127.0.0.1:4173" &&
    (url.pathname.startsWith("/src/") ||
      url.pathname.startsWith("/@vite/") ||
      url.pathname.startsWith("/node_modules/") ||
      url.pathname === "/" ||
      url.pathname.endsWith(".css"));
  if (!allowed) unexpected.push(request.url());
});
await page.goto("/?security=1");
await expect(page.getByRole("grid")).toBeVisible();
await page.waitForTimeout(500);
loaded = true;
// interact
expect(unexpected).toEqual([]);
```

The assertion allows only the dev-server document, module, HMR and CSS paths after load. A
same-origin analytics POST, `<img src="/pixel">`, `EventSource` or CSS `url(/pixel)` is rejected.
`data:` and `blob:` URLs are checked before the origin test.

### Parser fuzz

`packages/core/src/fuzz.spec.test.ts` is a deterministic fuzz/property test for the date, period and
validation parsers. It generates 1,000 cases from a seeded LCG:

- impossible dates (`2027-02-30`, `0000-01-01`, `9999-12-31`), malformed strings and valid leap-day
  boundaries;
- periods with `start >= end`, timed instants without a zone, invalid display time zones and
  out-of-window years;
- duplicate item/layer/group ids and references to unknown entities.

Every case must return a diagnostic or a normalized value; none may throw an uncaught exception.
The expected codes are `INVALID_DATE`, `INVALID_RANGE`, `UNSUPPORTED_YEAR`, `DUPLICATE_ID` and
`UNKNOWN_REFERENCE` as defined by the core contracts. This is deterministic, not random per run.

### Dependency audit

- Upgrade `vitest` and `@vitest/coverage-v8` from 3.2.7 to 4.1.12 in the root, core and React
  package manifests, then regenerate the lockfile. Vitest 4 supports Vite 7 and Node 24 and removes
  the affected `tinypool` path. Run `pnpm why tinypool` and the full suite after the upgrade.
- Keep Vite 7.3.8 because Vite 8 crashes on the reference CPU (Intel i5-3470S without AVX2).
- Run `pnpm audit --audit-level high`. The command exits non-zero on any high or critical advisory.
- Record remaining moderate advisories in `docs/security.md` with their dependency path and the
  reason they are development-only. Do not claim a clean audit for severities that were not checked.
- Assert the CI least-privilege contract in `tests/quality/ci-contract.spec.test.ts`: top-level
  `permissions: contents: read`, no `secrets.*` reference, no `pull_request_target`, no `write-all`,
  and no hard-coded token or private key. This is the AC16 "least-privilege CI, no secrets" half.
  A source scan also rejects `eval`, `new Function`, `child_process` and raw HTML in production
  source.

### License report

`scripts/write-licenses.mjs`:

```bash
node scripts/write-licenses.mjs --write   # regenerate THIRD_PARTY_NOTICES.md
node scripts/write-licenses.mjs --check   # fail when stale
```

The script runs `pnpm -r licenses list --prod --json` for runtime dependencies and
`pnpm licenses list --dev --json` for development tooling, groups packages by license, and writes:

```markdown
# Third-Party Notices

## Runtime dependencies

The published library bundles no third-party runtime code. React and React DOM are peer
dependencies supplied by the host. The demo's runtime dependencies are listed below.

## Development tooling (not distributed)

| Package | Version | License | Repository |
|---|---|---|---|
...
```

`pnpm test:licenses` runs `--check` in `verify`. The file is checked in and reviewed when a
dependency changes.

### CSP

The existing documented policy remains:

```text
style-src-attr 'unsafe-inline'
```

The Playwright CSP test already loads the demo with that header and asserts the grid and items
render while no attacker URL is requested. RD-10 adds the hidden-data scan to the same page and
records the policy in the test report. No remote style URL is executed from untrusted metadata; the
style allowlist and the CSP test cover that path.

## Code Examples

### Hidden print assertion

```ts
const printHtml = container.querySelector('[data-yp-part="print-pages"]')?.innerHTML ?? "";
expect(printHtml).not.toContain("TOPSECRET-HIDDEN");
```

### Audit command

```bash
pnpm audit --audit-level high
```

## Error Handling

| Error Case | Handling Strategy | AR Ref |
| ---------- | ----------------- | ------ |
| Hidden title appears anywhere | Fail the test with the surface name and the leaked string | AR-18 |
| XSS payload creates an element | Fail; treat as a critical defect and stop | AR-18 |
| Network spy records a call | Fail with the call stack; no telemetry is allowed | AR-19 |
| Audit command cannot reach the registry | CI retries once, then reports the failure; never report a clean audit without output | AR-16 |
| Audit finds a high/critical advisory | Block; upgrade, patch or remove the path; do not accept silently | AR-15, AR-16 |
| License output is stale | `test:licenses --check` fails with the diff | AR-17 |
| Vitest 4 upgrade breaks the suite | Fix the suite; if impossible, stop and record the blocker with evidence | AR-15 |

> **Traceability:** AR-15 through AR-19 own the decisions in this document.

## Testing Requirements

- Hidden item absent from DOM, ARIA, tooltip, item list, inspector, print and overflow.
- XSS title, metadata, style, className and annotation label remain inert.
- No `fetch`, XHR, beacon or WebSocket call during render or interaction.
- Playwright records no cross-origin request.
- `pnpm audit --audit-level high` exits clean after the Vitest upgrade.
- `THIRD_PARTY_NOTICES.md` is current.
- The seeded parser fuzz returns diagnostics and never throws.
- The CSP test still renders the grid and items.
