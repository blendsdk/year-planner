# Independent review: browser locale fallback

> **Status**: Passed — all three findings resolved; no new findings.
> **Date**: 2026-11-14
> **Reviewer**: Independent general-agent packet in the phase-reviewer role.
> **Scope**: Correctness, maintainability, standards and compatibility.

| Finding | Severity | Evidence | Recommended correction |
|---|---|---|---|
| RV-01 | MAJOR | In real Chromium, `hy-AM-u-hc-h12-nu-arab` produces `4 հնվ, 2027 թ., 01:05 PM` instead of native Node's `٤ հնվ, ٢٠٢٧ թ., ٠١:٠٥ PM`. Missing NumberFormat locale data drops the requested numbering extension. The regression fixture simulated missing DateTimeFormat data only. | Explicitly provide the parsed numbering system to both fallback NumberFormat instances; verify this extension in Chromium. |
| RV-02 | MINOR | Icelandic 12-hour fallback inserts U+202F before the day period while native `.format()` returns U+0020. | Match the native ordinary space and assert exact-string parity. |
| RV-03 | MINOR | The unknown extension `hy-AM-u-hc-h25` is ignored by native DateTimeFormat, but forwarding `h25` as an explicit option throws and causes raw ISO output. | Allowlist the four supported hour cycles and otherwise retain the default. |

The reviewer independently verified all 36 month names, 21 weekday names and the
default date patterns against native Node. No additional machinery is required.
The recommended resolution is to fix all three findings, rerun targeted unit and
real-browser tests, then perform the one permitted fix-diff re-review.

**User ruling:** On 2026-11-14, the user selected **Fix all three (Recommended)**:
apply the bounded formatter corrections, rerun tests and independent re-review,
then continue shipping `0.3.2`. All findings are accepted for correction; none is
waived or dismissed.

## Correction evidence

- Red: the more accurate numeric-locale fixture and clock cases produced three
  unit failures. Built Storybook in Chromium failed the Arabic-digit assertion.
- Green: 54 targeted React tests, React typecheck/build, Storybook build and all
  five Chromium i18n tests pass, including the built component's Arabic digits.
- The single independent fix-diff re-review uses baseline tree
  `d71a1dfaed94be27cde5a2a78d4545ca1c8659d7`.
- The first full release gate was stopped after the blocking review result
  (SIGTERM, exit 143). The corrected full gate passed on the isolated release
  snapshot; see the execution plan for counts and workspace isolation evidence.

## Independent fix-diff re-review

The reviewer confirmed all three corrections with **18/18 real Chromium/native
Node exact-string comparisons**. Arabic and Devanagari digits match native
formatting, Icelandic 12-hour spacing matches, and unknown clock extensions
produce localized periods. The reviewer also checked the passing 54-test React
and five-test Chromium logs. No new findings or additional scope were introduced.
