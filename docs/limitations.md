# Limitations

> **Scope**: what R1 does not implement, and the honest boundaries of the
> evidence. The full list is in [DEFERRED.md](https://github.com/blendsdk/year-planner/blob/main/DEFERRED.md).

## Deferred capabilities

R1 is a classic annual planner. It does not implement a resource timeline,
recurrence, scenarios, dependencies, split/merge, batch multi-move or bulk edits,
a data provider with loading/error states, controlled-host undo, timed editing,
RTL, configurable week start, aggregated density, SVG/PDF export, an optimizer,
full headless composition, Shadow DOM, milestones, parent/child activities,
non-Gregorian calendars, drag between layers/resources, a second demo, CJS/UMD or
commercial support.

These are not stubbed or presented as implemented. A host that needs one of them
must build it outside the component or wait for a later release.

## Bundle

The package is ESM-only and ships a single React entry. Per-export tree-shaking
is deferred; importing one helper still pulls the component bundle. The packed
React entry plus CSS is measured under the 60 kB target, and the combined
core + React + adapters + CSS surface stays under the 68 kB guard. Use the
size report rather than assuming a per-export split.

## Fit and target size

The fit keeps date cells and ribbon item proxies at least 24 × 24 CSS px.
Annotation chips keep their 14 px design height (their proxy is 12 px high);
they are compact markers layered above the grid and are exempt from the ribbon
proxy floor. A host that needs a larger annotation target should hide the
annotation channel (`display.showAnnotations: false`) and present its own
marker.

Fit measurement needs a bounded host region. An auto-height page host makes the
vertical budget follow the content height, so the grid does not shrink; use a
fixed height, `height: 100%` with `min-height: 0`, or `display: flex` with a
scrollable region.

## Browsers

The automated matrix runs one Playwright-bundled Chromium, Firefox and WebKit
version per engine. Edge and Safari are represented by those engines; real Edge
and Safari runners are not part of R1. A browser version newer or older than the
recorded one is not claimed.

## Accessibility and the manual audit

Automated axe checks, keyboard tests and contrast evidence are green. The manual
NVDA/VoiceOver audit is parked because no Windows or macOS assistive-technology
host is available on the project. No WCAG conformance claim is made. See
[accessibility.md](accessibility.md).

## Performance

The initial render, the 10,000-item drag and the 10,000-item overflow
open/close miss their budgets. The numbers
describe the reference host only. See [performance.md](performance.md).

## Publication

The packages are not on a public registry. The documentation site will be built
and uploaded by the release pipeline but is not published until the release step
enables GitHub Pages.
Storybook 10 provides the viewport in core; the legacy
`@storybook/addon-viewport` package is not used.

## Documentation

The guides are repository markdown. The published site is Storybook plus the
TypeDoc API reference; a separate documentation site (VitePress) is out of scope
for R1. Versioned docs for multiple major releases are also out of scope.
