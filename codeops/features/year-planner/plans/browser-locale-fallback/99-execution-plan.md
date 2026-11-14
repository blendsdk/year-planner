# Task T-01: Preserve localized dates in browsers with limited locale data

> **Type**: Task (lightweight) · **Feature**: year-planner · **CodeOps Artifact Schema**: 1
> **Progress**: 3/4 tasks (75%)
> **Reasoning**: high — locale correctness across browser, server and print output
> **Scope mode**: strict
> **Phase baseline tree**: 59b0837e00f4285c6699f075af051ce8dd50698d
> **Last Updated**: 2026-11-14

## Objective

Fix the released Armenian story's English calendar labels and ship the patch.
The user authorized the fix, CodeOps execution and shipping on 2026-11-14.
The same observed browser limitation affects Georgian and Icelandic.

**Smallest viable design:** Keep the existing formatter pipeline and public API.
Add a private, bounded Gregorian date fallback for Armenian, Georgian and Icelandic
using their established short month/weekday names and date patterns. Use native
Intl wherever its requested locale is supported. Reuse Intl for timezone
conversion and numeric parts; do not install a global polyfill or add dependencies.
Accept these known fallback locales without the false `INVALID_LOCALE` diagnostic.
Invalid and otherwise unsupported locales retain the existing English fallback.
Dates, periods, accessible date labels and print output share the same formatters.

**Evidence:** The deployed Armenian story loads Armenian messages but displays
`Sat`, `Jan` and English date labels. Chromium 158 reports no DateTimeFormat support
for `hy-AM`, `ka-GE` or `is-IS`, while Node supports them. `options.ts` rejects those
locales before formatting. The existing browser test does not assert translated
calendar labels.

**Expected modification set:** React locale helpers and regression tests;
`tests/e2e/i18n.spec.ts`; localization and release documentation; package/workspace
versions, changelogs and lockfile through the existing versioning command;
this mini-plan/review evidence and the owning roadmap. Existing `.opencode/**`
changes and the marketing PDF are unrelated work.

**Execution:** Inline implementation; independent correctness/maintainability/
standards review before shipping. No additional specialist or infrastructure
surface is required for this bounded formatter correction. Commit and push the
verified release through the git-commit skill under the user's explicit ship
instruction. Publish through the existing protected Release workflow.

## Tasks

- [x] T-01.1 Add specification regressions for missing browser locale data, calendar headers, full dates, periods, timezone boundaries, runtime language switching and print; confirm red. Verified 2026-11-14: 16 expected unit failures and 4 Chromium failures.
- [x] T-01.2 Implement the bounded fallback and verify targeted React and browser regressions green. Verified 2026-11-14: 52 React tests, React typecheck/build and 4 Chromium tests passed.
- [x] T-01.3 Update localization/release notes, prepare the lockstep patch version, pass the full release gate and independent quality review. Verified 2026-11-14: full gate passes on the isolated release snapshot; independent re-review passed (18/18 browser/native comparisons).
- [ ] T-01.4 Commit and push, merge after passing CI, publish through the existing release workflow, deploy docs and verify npm plus live Armenian rendering.

**Specification files:** `packages/react/src/locale-fallback.spec.test.tsx`,
`tests/e2e/i18n.spec.ts`.

**Task verify:** `pnpm --filter @blendsdk/react-year-planner exec vitest run src/locale-fallback.spec.test.tsx src/i18n.spec.test.tsx src/YearPlanner.spec.test.tsx`

**Task verify evidence:** 52 tests observed on 2026-11-14; before implementation,
16 new locale assertions fail and 36 tests pass.

**Browser verify:** `pnpm exec playwright test tests/e2e/i18n.spec.ts --project=chromium`

**Verify (gate):** `pnpm verify:full`

## Evidence

- Live reproduction: Armenian messages present; weekday headers remain English;
  native `Intl.DateTimeFormat("hy-AM").resolvedOptions().locale` is `en-US`.
- Regression, review and release results will be recorded as each task verifies.
- Red phase: targeted React command observed 16 expected locale failures / 36
  passing tests. Chromium i18n spec observed 4 failures on English weekday labels.
- Green phase: all 52 targeted React tests and all 4 Chromium i18n tests pass,
  including print labels. React typecheck/build pass. The private fallback also
  preserves numbering-system/hour-cycle extensions and native timezone rules.
- Independent review found RV-01 MAJOR and RV-02/RV-03 MINOR. The real Chromium
  numbering-extension probe exposed a gap in the simulated unit environment.
  See `05-review-report.md`; the user explicitly approved all three corrections
  on 2026-11-14. Corrections verified: 54 React tests and 5 Chromium tests pass.
  React typecheck/build and Storybook build pass. Fix-diff re-review uses tree
  `d71a1dfaed94be27cde5a2a78d4545ca1c8659d7`; it passed with no new findings.
- The full gate was intentionally stopped with SIGTERM (exit 143) after the
  review blocker; that interrupted run is not counted as a pass.
- The corrected full gate passed package tests but stopped at the docs contract:
  the pre-existing untracked marketing PDF is a binary under `docs/`. The PDF is
  preserved. Full verification passed in a temporary archive of HEAD plus the
  exact 21 release-change files, with a frozen-lockfile install and input hashes.
  Unrelated workspace changes are not part of that release snapshot.
- The installed progress helper displays the mini-plan's count correctly but
  exits 1 because it requires full-plan index/Implements metadata. This task
  follows the documented lightweight single-file plan contract; no unrelated
  plugin changes were made.

### Full release gate

`pnpm install --frozen-lockfile` and `pnpm verify:full` passed in the isolated
release snapshot. SHA-256 comparison confirms all runtime, tests, docs and
manifest inputs match the working release files; only CodeOps evidence and
derived roadmap status changed after snapshot creation.

| Check | Result |
|---|---|
| Core / React / language tests | 226 / 568 / 10 passed, coverage gates passed |
| Quality contracts | 255 passed |
| Browser matrix | 187 passed, 74 intentional platform/feature skips |
| Timezones | 226 tests passed in each of three timezones |
| Performance suite | 10 passed, 1 skipped |
| Benchmark suite | 11 passed, 11 skipped; report-only initial-render miss recorded |
| Audit | Passed high-severity threshold; 2 moderate advisories reported |
| Release artifacts | API reports, bundle size, docs, packs and release check passed |
| Packed consumer | Types, CSS import and production build passed |
