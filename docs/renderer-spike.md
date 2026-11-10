# Renderer Spike — M0 Evidence

> **Date**: 2026-11-10
> **Gate**: RD-05/RD-06 renderer evidence gate (requirements AR #11, #12, #36, #57)
> **Verdict**: **PASSED WITH NOTES** — HTML/CSS is the canonical renderer; SVG remains an optional internal shape/selection plane. No public renderer switch.
> **Evidence harness**: `spike/renderer/` (`pnpm build && pnpm measure`)
> **Raw measurements**: [`spike/renderer/evidence/measurements.json`](../spike/renderer/evidence/measurements.json)

---

## Purpose

The requirements deliberately do not choose HTML or SVG by ideology. This spike
compares four rendering strategies on the same classic 14-month view and the same
sample intervals, then records the evidence that drives the M2 renderer choice.

The spike is **throwaway evidence**. It is not the product entry point, it is not
published, and it exposes no `renderer` prop.

## Compared variants

| Variant | Cells and labels | Ribbons | Item proxies | Optional SVG |
|---|---|---|---|---|
| `html-only` | HTML | HTML buttons | The ribbon button itself | None |
| `html-svg` | HTML | SVG paths | Transparent HTML buttons over the shapes | Ribbon/selection plane |
| `svg-shapes` | SVG rectangles and text | SVG paths | Transparent HTML buttons | Cell/ribbon plane |
| `full-svg-row` | HTML except February 2027, which is fully SVG | SVG paths | Transparent HTML buttons | One full month row |

Sample data: cross-month interval, cross-year interval, three overlaps, a
one-day interval, a long multi-month interval, and a selected range. The layout
is 14 months × 37 fixed columns (427 dated cells plus 91 blank slots).

## Method

`spike/renderer/measure.mjs`:

1. Builds a static site with Vite and serves it locally.
2. Opens every variant in Chromium, Firefox and WebKit at 2040 × 1400.
3. Counts rows, slots, dated cells, ribbons and proxies.
4. Measures each ribbon/proxy against its first and last date-cell bounds.
5. Exercises keyboard focus on a date cell and on the SVG February row.
6. Runs axe-core 4.14 with `resultTypes: ["violations"]`.
7. Captures full-page screenshots.
8. Generates an A3 PDF in Chromium and reads it with `pdfinfo`.
9. Reads the Vite manifest for gzip sizes and counts source lines.

## Results

### Geometry, keyboard and accessibility

All 12 combinations (3 browsers × 4 variants) produced identical counts:

| Measurement | Result |
|---|---|
| Month rows | 14 |
| Day slots | 518 (14 × 37) |
| Dated cells | 427 |
| Ribbon fragments | 13 |
| Rendered proxies | 13 for SVG variants, 0 extra for HTML-only |
| DOM nodes | 1,228–1,231 |
| Alignment | 0 misaligned; max deviation 0 px (Chromium/WebKit) and 0.5 px (Firefox SVG variants) |
| Date keyboard | `2026-12-01` → ArrowRight → `2026-12-02` in all variants and browsers |
| SVG row keyboard | `2027-02-01` → ArrowRight → `2027-02-02` in all variants and browsers |
| axe serious/critical | 0 in all 12 combinations |
| Cross-month identity | 2 fragments, rows `2027-01` and `2027-02`, one item ID |

### Print (Chromium)

| Variant | Pages | Page size |
|---|---|---|
| `html-only` | 1 | 1191.12 × 842.88 pt (A3 landscape) |
| `html-svg` | 1 | 1191.12 × 842.88 pt (A3 landscape) |
| `svg-shapes` | 1 | 1191.12 × 842.88 pt (A3 landscape) |
| `full-svg-row` | 1 | 1191.12 × 842.88 pt (A3 landscape) |

Firefox and WebKit were not used for PDF generation because Playwright only
supports `page.pdf()` in Chromium. Their screen rendering, focus and axe results
are included.

### Size

The spike uses one shared engine with a strategy configuration, so the Vite
chunks measure the **shared harness**, not an isolated production renderer:

| Variant | JS gzip | CSS gzip | Total route gzip |
|---|---|---|---|
| `html-only` | 7.04 kB | 1.22 kB | 8.26 kB |
| `html-svg` | 7.05 kB | 1.22 kB | 8.27 kB |
| `svg-shapes` | 7.05 kB | 1.22 kB | 8.26 kB |
| `full-svg-row` | 7.08 kB | 1.22 kB | 8.29 kB |

Source size of the shared harness: `grid.ts` 229 lines, `render.ts` 584 lines,
and four 16–17-line variant modules. The near-identical route sizes are expected:
all variants share the DOM helpers and sample data. An isolated production
bundle would be smaller; the difference between strategies is not large enough
to decide the gate.

## Observations

- **HTML-only** is the smallest conceptual surface: one coordinate system, one
  focusable element per ribbon, and no overlay/proxy alignment problem.
  Rectangular month-row fragments do not need vector shapes.
- **HTML + SVG** adds selection outlines and optional connectors cleanly, but
  introduces a second coordinate system and transparent proxy overlays. All
  measured geometry still aligned exactly because both layers use the same
  prefix widths.
- **SVG shapes** forced every cell, date label and focus target into SVG. It
  passed in all three tested browsers, but it increases the accessibility
  surface and makes custom React content, resize handles and annotation slots
  harder to compose.
- **Full-SVG row** gave no measured advantage over the hybrid. It is the highest
  risk for host content and screen-reader behavior.
- **Connectors** are easy to draw but easy to mislead: an unconstrained line
  between a December fragment ending at the right edge and a January fragment
  starting at the left edge crosses the whole grid. The spike now draws a
  connector only when the horizontal gap is at most 120 px. This supports the
  requirements' default `connectorMode: 'none'`.
- The **selection rectangle** is the clearest SVG value: arbitrary marquee and
  focus outlines are natural vector shapes, while ribbons are rectangles.

## Decision

| Question | Decision |
|---|---|
| Default cell/label renderer | HTML/CSS |
| Default ribbon renderer | HTML elements positioned from the pure layout |
| SVG use | Optional internal shape plane for marquee/selection outlines and constrained connectors |
| Full-SVG layout | Not adopted |
| Public `renderer` prop | Not exposed |
| Core layout | Remains renderer-agnostic data |
| Connector default | `none` |
| Revisit trigger | A future requirement for non-rectangular shapes or exported vector art |

## Limitations

- The spike uses plain DOM, not React; Fluent UI/MUI content nesting is not
  measured. The hybrid's HTML proxies are the intended integration point.
- The spike does not have a full item inspector or a roving item-proxy tab stop.
- Only date-cell keyboard navigation is measured.
- No manual screen-reader audit was performed; axe is automated evidence only.
- PDF output is Chromium-only; Firefox/WebKit print output is unverified.
- Bundle sizes are shared-harness sizes, not isolated production budgets.
- One window (2027) and one theme are measured.

## Artifacts

| Artifact | Path |
|---|---|
| Harness | `spike/renderer/` |
| Measurements | `spike/renderer/evidence/measurements.json` |
| Screenshots | `spike/renderer/evidence/*.png` |
| A3 PDFs | `spike/renderer/evidence/*-a3.pdf` |
| ADR | `docs/adr/0001-renderer-strategy.md` |
