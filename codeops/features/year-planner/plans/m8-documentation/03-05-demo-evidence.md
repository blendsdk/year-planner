# Demo and Evidence: Documentation, Storybook and API Reference

> **Document**: 03-05-demo-evidence.md
> **Parent**: [Index](00-index.md)

## Overview

RD-11 asks for a runnable demo that demonstrates controlled items, visibility,
selection and a rejection/rollback, and for an honest evidence record. The demo
already implements those routes; this component makes them discoverable, records
the RD-11 evidence, and closes the traceability contract.

## Architecture

### Current Architecture

- `apps/demo/src/App.tsx` reads query parameters at render: `?commands=1`,
  `?interaction=1`, `?ac3=1`, `?print=prt01`, `?security=1`, `?bench=1`.
- `CommandsDemo.tsx` holds controlled `items`, a mock `validateChange` and
  `onChangeRequest`, and modes for accept, reject, timeout and accepted-not-applied.
- The default route holds year/theme/window/density/zoom controls and passes
  `defaultSelection` and `defaultVisibility` to the planner.
- The default page has no navigation to the other routes.

### Proposed Changes

| Change | File |
| ------ | ---- |
| Add a visible route navigation | `apps/demo/src/App.tsx` |
| Document the routes | `README.md`, `docs/getting-started.md` |
| Record RD-11 evidence | `docs/test-report.md` |
| Add the RD-11 AC rows | `codeops/features/year-planner/requirements/00-traceability.md` |
| Extend the checker through RD-11 | `tests/quality/traceability.spec.test.ts` |
| Annotate the existing demo E2E tests | `tests/e2e/commands.spec.ts`, `tests/e2e/interaction.spec.ts` |

## Implementation Details

### Demo navigation

The `demo-chrome` block gains a small link row:

```tsx
<nav aria-label="Demo routes">
  <a href="?">Overview</a>
  <a href="?commands=1">Controlled commands</a>
  <a href="?interaction=1">Interaction</a>
  <a href="?ac3=1">Fluent and MUI buttons</a>
  <a href="?print=prt01">PRT-01 print</a>
</nav>
```

The links reload the page with the query string, which is how the app already
selects a route. No router is added.

### Evidence record

`docs/test-report.md` gains a section with:

- the docs contract, Storybook contract, TSDoc contract and traceability results;
- `pnpm docs:site` artifact composition (base path, API tree, file count);
- the story count and the guide page count;
- the TSDoc result (zero `(undocumented)` entries, release tags reported);
- known gaps: no live Pages deployment, manual NVDA/VoiceOver parked, no
  versioned docs, no Storybook MDX guides.

### Traceability

Add RD-11-AC-01 through RD-11-AC-13 to `00-traceability.md` with the owning test
file and title. Extend `tests/quality/traceability.spec.test.ts` from
`through: 10` to `through: 11`. Add `RD-11-AC-08` to the existing demo E2E titles
that prove controlled items, visibility, selection and rejection/rollback; no new
E2E file and no test-map change.

### Error Handling

| Error Case | Handling Strategy | AR Ref |
| ---------- | ----------------- | ------ |
| An RD-11 AC has no matrix row | Checker fails and names the ID | AR-16 |
| An RD-11 AC has no test title | Checker fails and names the ID | AR-16 |
| The demo route is undiscoverable | README and getting-started document it; the nav links to it | AR-15 |
| The evidence overstates the result | Cite the command and its recorded output; name the gaps | AR-14, AR-20 |

> **Traceability:** every evidence decision above is recorded in
> [00-ambiguity-register.md](00-ambiguity-register.md).

## Testing Requirements

- ST-23 through ST-26 cover the demo route, the traceability rows and the report
  fields.
- The existing Playwright tests remain the runtime proof; no duplicate suite is
  added.
