# Traceability and Public API: Quality Gates Plan

> **Document**: 03-01-traceability-api.md
> **Parent**: [Index](00-index.md)

## Overview

RD-10 AC2 requires every acceptance criterion from RD-01 through RD-10 to have a test ID in
`requirements/00-traceability.md` and a spec-test title that repeats that ID. The current matrix is
partial, and most later RDs use short prefixes such as `RD-04 visibility precedence`. This
specification defines a deterministic checker, the matrix rows, the title convention and the public
API smoke contract. It changes no product behavior.

## Architecture

### Current Architecture

- `codeops/features/year-planner/requirements/00-traceability.md` lists handoff cases and a subset
  of R1 cases (lines 55–63).
- Core temporal tests already use IDs such as `RD-02-AC-01/02` and `RD-03-AC-07/08/09/10/14`.
- RD-04 through RD-09 use descriptive suite names without AC IDs.
- The API Extractor reports at `packages/core/etc/year-planner-core.api.md` and
  `packages/react/etc/react-year-planner.api.md` are checked in and verified by `api-report:ci`.

### Proposed Changes

| Artifact | Change |
| -------- | ------ |
| `scripts/lib/traceability.mjs` | Pure parser and checker for RD files, matrix rows and test titles |
| `scripts/check-traceability.mjs` | CLI wrapper; exits 1 with a precise missing-ID list |
| `vitest.quality.config.ts` | Root Node test project for `tests/quality/**/*.spec.test.ts` |
| `tests/quality/traceability.spec.test.ts` | ST-1/ST-2 oracle |
| `tests/quality/public-api.spec.test.ts` | Runtime export smoke and golden list |
| `tests/quality/public-api.golden.json` | Checked-in runtime export names |
| `tests/quality/coverage-contract.spec.test.ts` | Threshold and script contract |
| `tests/quality/repo-contract.spec.test.ts` | RD-01 process/repository acceptance contract |
| `requirements/00-traceability.md` | Full RD-01..RD-10 rows |
| Spec tests | Add `RD-XX-AC-NN` to every proving title |

## Implementation Details

### New Module: `scripts/lib/traceability.mjs`

The module is deliberately dependency-free and testable with fixture directories.

```js
/**
 * Reads one RD file and returns its acceptance-criterion numbers.
 * @param {string} source - Markdown source.
 * @param {string} file - File name used in error messages.
 * @returns {{ rd: string, numbers: number[] }}
 */
export function parseAcceptanceCriteria(source, file);

/**
 * Extracts every zero-padded test ID from the traceability matrix.
 * @param {string} source - Matrix Markdown.
 * @returns {Set<string>}
 */
export function parseMatrixIds(source);

/**
 * Extracts IDs that appear as literal describe/it/test titles in a source file.
 * Comments, fixture strings and ordinary prose never count.
 * @param {string} source - TypeScript or JavaScript source.
 * @returns {Set<string>}
 */
export function parseTitleIds(source);

/**
 * Runs the full check over a repository root.
 * @param {string} root - Repository root.
 * @param {{ through?: number, fixture?: { rds?: Record<string,string>, matrix?: string, tests?: Record<string,string> } }} [options]
 * @returns {{ ok: boolean, missingMatrix: string[], missingTitle: string[], duplicates: string[], errors: string[] }}
 */
export function checkTraceability(root, options = {});
```

`through` defaults to `10`. Phase 1 uses `through: 9` because the RD-10 tests are authored across
the later phases; Phase 7 switches to the full `10`. The CLI accepts `--through <n>`.

`tests/quality/repo-contract.spec.test.ts` is the proving file for RD-01's process/repository
acceptance criteria (install, typecheck, build, pack, consumer, CI, DCO, license, verify, secrets and
security). It asserts the real manifests, scripts and workflow, not just that files exist.

The checker applies these rules:

1. Scan `codeops/features/year-planner/requirements/RD-0[1-9]-*.md` and `RD-10-*.md` up to
   `through`. RD-11 and RD-12 are added when their plans execute; they are not implemented by this
   plan.
2. Parse only the `## Acceptance Criteria` section. A numbered line is `^(\d+)\.\s+\[[ x]\]`.
3. Build `RD-XX-AC-NN` with a two-digit AC number.
4. Parse only the canonical `## Acceptance criteria` table. Handoff tables are navigation and are
   not parsed, so they cannot create false duplicates.
5. Require every ID in the canonical table. Report duplicates and unknown IDs.
6. Require a non-empty `Status`, an existing `Proving test file`, and a title literal containing the
   ID (or a slash-expanded form) in that file. A `partial`/`deviation` row requires a non-empty
   evidence note.
7. Reject a matrix row whose file exists but whose title is missing, or whose ID appears only in
   another file.
8. Scan `packages/**/*.spec.test.ts`, `packages/**/*.spec.test.tsx`, `tests/e2e/*.spec.ts`,
   `tests/perf/*.spec.ts` and `tests/quality/*.spec.test.ts`. The traceability test's own title
   counts; only title literals count, so fixture data cannot satisfy a missing ID.
9. Count an ID only when it is inside a `describe(...)`, `it(...)` or `test(...)` title literal.
   `it.skip`, `test.skip`, `it.todo` and commented titles do not count.
10. Also accept a suite title such as `RD-02-AC-01/02` by expanding slash-separated AC numbers.
11. Fail when an RD yields zero ACs, when the parsed AC count differs from the expected contiguous
    sequence, or when the matrix has a row without a proven file/title.

### RD-10 acceptance-criterion title map

Every RD-10 acceptance criterion needs a literal title. The matrix rows point at these files:

| AC | Proving title lives in |
| -- | ---------------------- |
| AC1 (`verify:full`) | `tests/quality/ci-contract.spec.test.ts` |
| AC2 (traceability) | `tests/quality/traceability.spec.test.ts` |
| AC3 (coverage/API) | `tests/quality/coverage-contract.spec.test.ts`, `tests/quality/public-api.spec.test.ts` |
| AC4 (browsers/React 19) | `tests/e2e/quality-visual.spec.ts`, `tests/e2e/mobile.spec.ts`, `packages/react/src/react19.spec.test.tsx` |
| AC5 (timezones) | `tests/quality/ci-contract.spec.test.ts` (asserts the script) |
| AC6 (A3 print) | `tests/e2e/print-matrix.spec.ts` |
| AC7 (axe/manual) | `tests/e2e/accessibility.spec.ts` |
| AC8 (hidden data) | `packages/react/src/security.spec.test.tsx`, `tests/e2e/security.spec.ts` |
| AC9 (XSS) | `packages/react/src/security.spec.test.tsx` |
| AC10 (no network) | `packages/react/src/security.spec.test.tsx`, `tests/e2e/security.spec.ts` |
| AC11 (performance) | `tests/perf/bench.spec.ts` |
| AC12 (size) | `tests/quality/coverage-contract.spec.test.ts`, `tests/quality/package-scripts.spec.test.ts` |
| AC13 (CSP) | `tests/e2e/security.spec.ts` |
| AC14 (clean consumer) | `tests/quality/package-scripts.spec.test.ts`, `scripts/clean-consumer.sh` |
| AC15 (SSR) | `packages/react/src/YearPlanner.ssr.spec.test.tsx`, `YearPlanner.hydration.spec.test.tsx` |
| AC16 (security) | `tests/quality/audit-contract.spec.test.ts`, `tests/quality/ci-contract.spec.test.ts` |

The executor adds the exact ID to the relevant `describe`/`test` title. No AC is left to an
unreferenced script.

### Matrix format

The matrix keeps its existing handoff tables and adds one canonical table:

```markdown
## Acceptance criteria

| Test ID | RD | AC | Status | Proving test file | Proving title | Evidence / deviation |
|---|---|---|---|---|---|---|
| RD-01-AC-01 | RD-01 | 1 | proven | `tests/quality/repo-contract.spec.test.ts` | `RD-01-AC-01` | `pnpm install --frozen-lockfile` |
| RD-10-AC-07 | RD-10 | 7 | partial | `tests/e2e/accessibility.spec.ts` | `RD-10-AC-07` | manual NVDA/VoiceOver parked; axe complete |
| RD-10-AC-12 | RD-10 | 12 | proven | `tests/quality/coverage-contract.spec.test.ts` | `RD-10-AC-12` | React entry+CSS 40.55 / 60 kB; total 63.36 / 65 kB |
```

The `Test ID` column is the machine-readable source. The checker requires every row to have a
non-empty `Status`, an existing `Proving test file`, and a `Proving title` containing the ID. A
`partial` or `deviation` status requires a non-empty evidence note; `proven` and `ci` require a
non-empty evidence note too, so every row carries its proof. RD-10 AC7 is `partial` because the
manual NVDA/VoiceOver half is parked; no conformance claim is made. Existing handoff tables remain
as navigation and are not parsed as the canonical list.

### Public API contract

`tests/quality/public-api.spec.test.ts`:

```ts
import * as core from "../../packages/core/src/index.js";
import * as react from "../../packages/react/src/index.js";
import golden from "./public-api.golden.json" with { type: "json" };

// Every runtime export is present, defined and has the expected kind.
// Type-only exports are covered by the checked-in API Extractor reports.
```

The golden file is intentionally small and reviewed:

```json
{
  "core": ["addDays", "buildClassicYearLayout", "..."],
  "react": ["YearPlanner", "createTheme", "..."]
}
```

Adding or removing a runtime export requires updating the golden file in the same change. The test
fails on an accidental removal and on an unreviewed addition. Type-only exports are enforced by
`pnpm api-report:ci`, which fails when the public `.api.md` surface changes without a report update.

### Root quality project

`vitest.quality.config.ts`:

```ts
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@blendsdk/year-planner-core": fileURLToPath(
        new URL("./packages/core/src/index.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "node",
    include: ["tests/quality/**/*.spec.test.ts", "tests/quality/**/*.impl.test.ts"],
    testTimeout: 30_000,
  },
});
```

`pnpm test:quality` runs this config. The root `verify` script runs it after `pnpm test` and before
`pnpm build`.

### Tooling typecheck

The root `typecheck` runs only package scripts. The plan adds:

- `tsconfig.tools.json` covering `tests/quality`, `tests/perf`, `vitest.quality.config.ts` and
  `playwright.bench.config.ts`;
- `apps/demo/tsconfig.json` with `noEmit` for the demo, including the benchmark route;
- `typecheck:tools` and a demo `typecheck` script, both called by `pnpm verify`.

This closes the gap where a new quality or benchmark test could be syntactically valid JavaScript
but type-invalid TypeScript. The scripts themselves stay plain `.mjs` so the Node 20.19 floor holds.

### Clean consumer extension

`scripts/clean-consumer.sh` keeps its packed-tarball install and Vite build, then adds:

1. `tsc --noEmit` against the packed `.d.ts` files, importing `YearPlanner`, `YearPlannerProps`,
   `PlannerItem` and `createTheme`;
2. a tree-shaken entry that imports only `createTheme` and asserts the built bundle does not contain
   the `YearPlanner` marker string (or a documented equivalent size check).

The exact marker is named in the script and asserted by `package-scripts.spec.test.ts`; the consumer
must not rely on a default-import side effect to keep the API alive.

### Coverage contract

`tests/quality/coverage-contract.spec.test.ts` imports both package Vitest configs and asserts:

- core thresholds are at least 90 for lines and branches;
- React thresholds are at least 80 for lines and branches;
- `package.json` exposes `typecheck:tools`, `test:coverage`, `test:quality` and `api-report:ci`;
- `scripts/check-size.mjs` measures the React entry+CSS against 60 kB and the
  core+React+adapters+CSS total against 65 kB, and prints both.

This prevents a future change from silently lowering the RD-10 floor. The current 95/80 values pass
with room.

## Code Examples

### Failure output

```text
Traceability check failed:
  missing matrix rows (1): RD-07-AC-19
  missing titles (2): RD-05-AC-13, RD-09-AC-16
  duplicate matrix rows (1): RD-04-AC-04
```

### Passing title

```ts
describe("RD-03-AC-07/08/09/10/14: dynamic windows", () => {
  it("RD-03-AC-07: builds a 12-month window", () => { ... });
});
```

## Error Handling

| Error Case | Handling Strategy | AR Ref |
| ---------- | ----------------- | ------ |
| RD file missing or unreadable | Fail with the expected path and stop | AR-3 |
| Acceptance section missing | Fail with the file path; do not guess ACs from the whole document | AR-3 |
| Duplicate matrix ID | Fail and list every duplicate | AR-3 |
| Unknown matrix ID | Fail and name the RD/AC that does not exist | AR-3 |
| ID only in a comment or fixture | Not counted; only title literals count | AR-3 |
| Checker scans itself | Its own title counts; fixture data cannot satisfy a missing ID because only title literals count | AR-3 |
| Matrix row points at a missing file or title | Checker fails and names the row | AR-3 |
| Skipped or todo test title | Does not count | AR-3 |
| RD with no acceptance section | Checker fails; it never treats zero ACs as success | AR-3 |
| Public export removed | Golden-file diff fails | AR-4 |
| Type export changed | API Extractor report check fails | AR-4 |

> **Traceability:** AR-3 and AR-4 own the decisions in this document.

## Testing Requirements

- Checker unit cases: complete fixture passes; missing matrix row fails; missing title fails;
  duplicate ID fails; slash-expanded title passes; comment-only ID fails; skipped/todo title fails;
  matrix row with a missing file fails; matrix row whose file lacks the title fails; an RD with an
  empty acceptance section fails.
- Public API: golden list equals runtime keys; every entry is defined; type surface remains covered
  by `api-report:ci`.
- Coverage contract: current thresholds pass; a lowered fixture threshold fails.
