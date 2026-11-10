# ADR 0001: Renderer Strategy

> **Status**: Accepted
> **Date**: 2026-11-10
> **Deciders**: Year Planner maintainers
> **Evidence**: [`docs/renderer-spike.md`](../renderer-spike.md)

## Context

The core produces a renderer-agnostic layout: 14 month rows, 37 fixed day
columns, prefix widths and row bounds. The React adapter must render that
geometry, continuous ribbons that cross month rows, overlapping lanes,
selection, annotations, focus targets and print output.

The requirements intentionally do not commit to HTML or SVG before evidence
(AR #11, #12, #36, #57). A spike compared HTML-only, HTML with an SVG shape
plane, SVG shapes with HTML proxies, and a limited full-SVG row.

## Decision

1. **HTML/CSS is the canonical renderer** for cells, date labels, month bands,
   item proxies and focus.
2. **Ribbons are HTML elements** positioned from the pure layout fragments.
   A one-day item is one slot wide; an eight-day item spans eight slots.
3. **SVG is an optional internal shape plane** for marquee/selection outlines
   and constrained connectors. It is not the cell or proxy layer.
4. **No full-SVG layout** is adopted.
5. **No public renderer switch** is exposed. The seam is internal so a future
   evidence-backed change does not break the public API.
6. **Connectors default to `none`.** A connector is drawn only when fragments
   are horizontally close; long cross-row lines are misleading.
7. The core layout remains renderer-agnostic data shared by HTML, print and
   hit-testing.

## Consequences

### Positive

- One coordinate system and one focus model for cells and items.
- Host React content (Fluent UI v9, MUI, custom slots) composes naturally inside
  HTML cells and proxies.
- Keyboard focus, ARIA and axe behavior are straightforward.
- Print uses the same HTML layout and CSS transform that the product already
  needs.
- The SVG plane can be added later for marquee/selection without changing the
  public contract.

### Negative

- Continuous ribbons are rectangular per month row; non-rectangular shapes
  require the optional SVG plane.
- Very large windows may require attention to DOM size, but the measurement
  shows 1,228–1,231 nodes for the 14-month spike.
- The optional SVG overlay adds a second layer to keep aligned and tested.

### Neutral

- SVG is not rejected; it is limited to the shape/selection plane.
- The decision is reversible internally because the core is pure data.

## Evidence Summary

| Criterion | Evidence |
|---|---|
| Geometry | 0 misaligned ribbons/proxies across 3 browsers; max 0.5 px |
| Cross-month identity | One item ID across January and February fragments |
| Keyboard | Date focus works in all variants; SVG row also works in all 3 browsers |
| Accessibility | axe 0 serious/critical in all 12 combinations |
| Print | 1 A3 landscape page in Chromium for all variants |
| Size | Shared harness 8.26–8.29 kB gzip; no material strategy difference |
| Complexity | HTML-only has one coordinate system; SVG variants add an overlay/proxy layer |

## Alternatives Rejected

| Alternative | Reason |
|---|---|
| Full SVG default | No measured benefit; higher risk for host content, focus and slots |
| SVG cells with HTML proxies | Passed measurements, but larger accessibility and composition surface |
| HTML with unconstrained SVG connectors | Misleading shapes across month rows |
| Public renderer switch | Premature API surface with no production need |

## Follow-up

- Implement M2 ribbons with the HTML renderer.
- Add the internal SVG shape plane only when marquee/selection requires it.
- Re-run `pnpm --dir spike/renderer measure` after a renderer or probe change.
- Revisit this ADR if non-rectangular shapes or vector export become required.
