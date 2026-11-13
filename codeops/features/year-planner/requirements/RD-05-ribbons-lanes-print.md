# RD-05: Continuous Ribbons, Lanes, Overflow and Print

> **Document**: RD-05-ribbons-lanes-print.md
> **Status**: Implemented — print theme and boundary matrix verified
> **Created**: 2026-11-10
> **Project**: Year Planner for React
> **Depends On**: RD-02, RD-03, RD-04
> **CodeOps Artifact Schema**: 1

---

## Feature Overview

Projects logical intervals into continuous visual shapes clipped to month rows.
A single item produces one or more fragments; every fragment keeps the item ID
and selection state. Overlapping items receive deterministic visual lanes, and
compact mode exposes an accessible overflow representation.

Ribbons are never stored as per-day cells. A one-day item is one slot wide; an
eight-day item spans eight whole slots, including variable weekend widths, with
no per-day gaps or cell borders through the shape.

---

## Functional Requirements

### Must Have

- [ ] Fragment projection intersects each visible item period with every month
  row using half-open comparisons; empty intersections produce no fragment.
- [ ] Each fragment carries: item ID, row ID, clipped start/end dates, start
  column, end-exclusive column, x, width, lane, height, continuation flags and
  the original period.
- [ ] All fragments of one item share the same logical identity; selecting or
  moving any fragment selects/moves the one canonical item.
- [ ] A true start/end uses a rounded cap; a fragment clipped by a month row
  uses a square/open-ended visual so it does not look like a separate event.
- [ ] Cross-month and cross-year fragments never fill unrelated dates or the
  rectangular space between rows.
- [ ] Items outside the visible window are omitted without modifying canonical
  dates.
- [ ] Fragments are partitioned by render channel. Background highlights
  composite in a backdrop plane and do not consume ribbon lanes; ribbon items
  consume lanes; annotations use fill/badge areas; foreground is reserved for
  preview/active operations.
- [ ] Lane allocation is deterministic: sort by start date ascending, then
  longer duration first, then layer `sortOrder` ascending, then
  `displayPriority` descending, then stable item ID; assign the lowest free lane;
  reuse the previous row's lane for the same item when free.
- [ ] Two items whose date intervals overlap cannot share a lane in the same
  row. Touching half-open intervals may share a lane.
- [ ] Compact density: default maximum of 3 visible lanes; hidden fragments
  produce a per-row overflow count and an accessible overflow list with item
  titles, intervals and selection actions.
- [ ] Expanded density: all lanes are rendered; the row grows; page scroll
  remains usable.
- [ ] Aggregated density is deferred and must not be presented as implemented.
- [ ] A pure shape-descriptor output is renderer-agnostic; HTML is the default
  renderer, SVG is an evidence-based option for the shape/connector plane.
- [ ] Print: A3 landscape baseline; 12–36 month windows paginate by month rows
  with no clipped row; weekends, month labels, ISO weeks and ribbons remain
  aligned. Print colors are exact.
- [ ] A hit index maps fragment IDs and bounds for pointer/keyboard lookup.
- [ ] Hiding a layer/group may repack lanes; canonical items and host validation
  stay unchanged.

### Should Have

- [ ] Optional gutter connectors between fragments when `connectorMode` is
  `edge-path`; default `none`.
- [ ] A deterministic layout signature for tests and memoization.
- [ ] Per-row memoization so pointer previews do not re-render unchanged rows.

### Won't Have (Out of Scope)

- Per-day rounded tiles, per-cell event storage or freehand pixel storage.
- Canvas/WebGL-only rendering.
- Aggregated heatmap density — deferred.
- Resource timeline lanes — deferred.
- SVG/PDF file export — deferred.

---

## Technical Requirements

### Fragment descriptor

```ts
interface RibbonFragment {
  itemId: string;
  rowId: string;
  sourcePeriod: PlannerPeriod;
  clippedStart: DateKey;
  clippedEndExclusive: DateKey;
  startColumn: number;
  endColumnExclusive: number;
  x: number;
  width: number;
  lane: number;
  height: number;
  isStartClipped: boolean;
  isEndClipped: boolean;
  channel: RenderChannel;
}
```

### Geometry invariants

- `x = prefixWidths[startColumn]`;
- `width = prefixWidths[endColumnExclusive] - x`;
- a 1-day interval has width of exactly one slot;
- an 8-day interval spanning two weekends has the sum of the eight slot widths;
- fragments never inherit CSS cell borders or gaps;
- cross-row clipping preserves total selected days.

### Overflow model

- Per row, count fragments whose lane is at or above `compactMaxLanes`.
- The overflow chip displays the count and opens a focus-managed list.
- Overflow items remain selectable and inspectable.
- Hidden items never appear in the overflow list.

### Print model

- `print={{ page: 'A3', mode: 'paginate' | 'fit', rowsPerPage?: number }}`.
- Default **paginate** rules:
  - 12–14 months: one A3 landscape page;
  - 15–28 months: two pages;
  - 29–36 months: three pages;
  - default rows per page = 14; `rowsPerPage` must be 1–14. (14 rows/page
    yields exactly 1/2/3 pages for 12–14/15–28/29–36.)
- `fit`: scale all rows onto one A3 page; if the resulting scale would make
  date text smaller than 7 pt, emit a diagnostic and require paginate.
- `@media print` removes interactive chrome, uses `print-color-adjust: exact`,
  and never splits a month row across pages.
- A3 landscape is 420×297 mm; the PDF check uses `pdfinfo` and `pdftoppm`.

### Renderer evidence gate

Before RD-05/RD-06 implementation, the M0 spike must compare:

| Variant | Required evidence |
|---|---|
| HTML-only | Visual continuity, print, keyboard focus, custom content |
| HTML + SVG connectors/selection | Added visual value and low complexity |
| SVG shapes + HTML proxies | Alignment, focus, custom content, print |
| Limited full-SVG row | Documented accessibility/custom-content limits |

Criteria: visual fidelity, 60 Hz pointer preview, A3 print, axe/keyboard,
Fluent/MUI content, bundle size and code size. **Owner:** architecture lead
(requirements owner). **Enforcement:** RD-12 release checklist requires
`docs/renderer-spike.md` and the ADR; RD-05 AC14 is the gate. HTML-only is the fallback. No public renderer switch is exposed before
the gate passes.

### Complexity

Fragment projection: **M**. Lane packing: **M**. Print pagination: **M**.

---

## Integration Points

- RD-03 supplies row bounds and prefix widths.
- RD-04 supplies visible/canonical items and channels.
- RD-06 renders shape descriptors in HTML/SVG and draws labels/proxies.
- RD-07 uses fragment bounds for hit-testing and drag previews.
- RD-10 verifies geometry, visual seams and print output.

---

## Scope Decisions

| Decision | Options Considered | Chosen | Rationale | AR Ref |
|---|---|---|---|---|
| Event storage | Per-day cells, intervals | Intervals + fragments | Continuous shapes and overlap support | AR #77 |
| Default renderer | HTML, SVG, hybrid | HTML hypothesis; spike decides | Evidence-based; no ideological choice | AR #11, #36 |
| Compact lanes | 2, 3, 5 | 3 + overflow | Handoff default; readable annual rows | AR #76 |
| Aggregated density | Implement, defer | Defer | Not required for R1 | AR #10 |
| Connectors | Always, off, optional | Off by default | Avoid misleading cross-row shapes | AR #12 |
| Print | Single page, paginate | Paginate | Dynamic month windows | AR #14 |

---

## Security Considerations

- **Data sensitivity**: Fragment descriptors include item IDs and intervals;
  hidden items must not be included.
- **Input validation**: Periods and offsets are validated by RD-02/RD-04.
- **Authentication & authorization**: Host-owned; visibility is not permission.
- **Injection risks**: No raw HTML in labels or tooltips; React escapes text.
- **Encryption needs**: N/A.
- **Rate limiting**: N/A.
- **Infrastructure**: N/A.

---

## Acceptance Criteria

1. [ ] `hl-cross-month` `[2027-01-28, 2027-02-07)` renders one January fragment
   for Jan 28–31 and one February fragment for Feb 1–6, both with the same item
   ID and no colored unrelated dates.
2. [ ] A one-day interval renders exactly one slot width; an eight-day interval
   spanning two weekends renders the exact sum of eight slot widths.
3. [ ] Three overlapping items on Feb 1–3 render in three distinct lanes and
   each fragment is independently inspectable.
4. [ ] `hl-cross-year` `[2026-12-28, 2027-01-04)` renders December 2026 and
   January 2027 fragments with one identity.
5. [ ] Hiding one of three overlapping layers repacks the remaining lanes without
   changing item IDs, periods or assignments.
6. [ ] Twenty concurrent items in compact mode show exactly three lanes and an
   overflow count of 17; the overflow list contains all 17 items and is keyboard
   accessible.
7. [ ] Expanded mode renders all twenty items and the row height grows without
   clipping.
8. [ ] A hidden item never appears in an overflow list or tooltip.
9. [ ] With default `rowsPerPage: 14`, A3 print of 14 months has no clipped row,
   all month labels and weekends aligned; 18, 24 and 36-month prints paginate
   without splitting a month row.
10. [ ] The layout signature is identical for identical inputs and changes when
    an item, visibility state or month window changes.
11. [ ] PRT-01: the 2017 `fluent-marigold` theme with OH annotations, ISO week numbers and
    a ribbon prints on one A3 landscape page with all rows aligned and colors
    preserved.
12. [ ] `fit` on an 18-month window scales to one page; if the scale would make
    date text smaller than 7 pt, a diagnostic is emitted and paginate is
    required.
13. [ ] With default `rowsPerPage: 14`, a 36-month window renders 36 rows and
    prints three pages; 15/28/29-month boundary windows print 2/2/3 pages; the
    1,332-cell grid remains operable and keyboard reachable.
14. [ ] The M0 renderer spike produces `docs/renderer-spike.md` and an ADR with
    the four variants, criteria and a recorded decision; no public renderer
    switch exists before that decision.
15. [ ] Security requirements verified: hidden items excluded, labels escaped,
    no raw HTML.
