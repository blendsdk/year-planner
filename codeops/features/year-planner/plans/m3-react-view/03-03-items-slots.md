# Items, Annotations and Slots: M3 React View

> **Document**: 03-03-items-slots.md
> **Parent**: [Index](00-index.md)

## Overview

Renders M2 ribbon descriptors as accessible DOM, including proxies, resize
handles, annotations, overflow, tooltips and all host slots. Custom renderers
decorate content; they never replace the hit surface, focus target or ARIA.

## Geometry

`buildRibbonLayout` returns design units. `geometry.ts` scales every fragment
once:

```ts
export function scaleFragment(fragment: RibbonFragment, zoom: number): ScaledFragment;
export function rowTemplate(row: MonthRowLayout, zoom: number): string;
```

The item layer places fragments at `x * zoom` and `y * zoom`. Fragment height
is scaled but lane height remains readable at 0.75.

## Fragment DOM

```html
<div data-yp-part="item-fragment" data-item-id="..." data-fragment-index="0"
     data-yp-channel="ribbon" data-yp-selected="false" data-yp-pending="false"
     class="yp-fragment yp-fragment-ribbon" style="left:..;top:..;width:..;height:..">
  <div role="button" tabindex="-1" aria-pressed="false" aria-label="Title, Feb 1 - Feb 4"
       data-yp-part="item-proxy" class="yp-proxy">
    ...default label + renderItem content (inside ItemFragment slot)...
  </div>
  <button type="button" data-yp-part="resize-start" tabindex="-1" aria-label="Resize start"></button>
  <button type="button" data-yp-part="resize-end" tabindex="-1" aria-label="Resize end"></button>
</div>
```

- The item-proxy group uses **one** roving tab stop: only the active proxy has
  `tabindex="0"`; every other proxy and both handles use `-1`. Arrow keys move
  within the group (implementation test).
- The proxy contains no interactive element. `renderItem` content is additive
  and must not contain interactive descendants; a development warning fires if
  it does (checked by scanning rendered DOM for `button`, `a`, `input`,
  `select`, `textarea`, `[tabindex]` inside the proxy).
- Resize handles are siblings, not tab stops; RD-07 wires pointer/keyboard
  resizing.
- `aria-pressed` reflects selection. No `aria-selected` on a button.
- Default label: `item.title ?? item.id`; annotation default label:
  `annotation.label ?? title ?? id`.
- Fragment colors: item `color` overrides layer `color`; annotations use
  `annotation.background`; text uses `item.textColor`.
- `className`/`style`/`color`/`textColor` are **trusted host presentation
  fields**. `style` is filtered through an allowlist (`background`,
  `backgroundColor`, `color`, `borderColor`, `fontWeight`, `fontStyle`,
  `textDecoration`, `opacity`) and any value containing `url(`, `expression(`,
  `@import` or `javascript:` is dropped. `metadata` is never read.
- Layer identity adds `data-yp-layer`, a legend label, a pattern class
  (`solid`/`hatch`/`dots`) and a text label so identity is not color-only.
  `layer.opacity` multiplies the fragment opacity (default 1).

## Channels

| Channel | Rendering |
|---|---|
| `background`, `highlight` | Backdrop band over the day area, `pointer-events: none`, opacity `0.45 × layer.opacity` |
| `ribbon` | Lane-positioned proxy with label and selection |
| `annotation` | 14 px badge at the top of the row, label from `annotation.label` |
| `foreground` | Full-row proxy outline; not lane-packed |

`display.showAnnotations === false` omits annotation fragments only.

## Overflow

- `RibbonRow.overflowCount > 0` renders one `button[data-yp-part="overflow-button"]`
  at the row's right edge with text `+N`.
- Clicking toggles a popover `data-yp-part="overflow-popover"` anchored to the
  row; `renderOverflow` replaces its content.
- `OverflowRenderContext` is exactly:

```ts
interface OverflowRenderContext {
  row: MonthRowLayout;       // owning month row
  hiddenCount: number;       // RibbonRow.overflowCount
  items: readonly PlannerItem[]; // deduplicated visible overflow items
}
```

The implementation resolves the matching `RibbonRow` internally; the public
context does not expose renderer descriptors.

- The popover lists items with title and date span, in first-fragment order.
  Selecting an entry selects the item and moves focus.
- Escape and outside pointerdown close it; focus returns to the button.
- Hidden items never appear.

## Tooltip

- Shows on proxy hover/focus after no delay; hides on leave/blur/Escape.
- Default content: title and localized date span of the source period.
- `renderTooltip` replaces content.
- Positioned fixed within the root using the target's `getBoundingClientRect`;
  clamped to the viewport; no portal.
- Hidden or absent items never open a tooltip.

## Slots

### Structural (`components`)

`Root`, `Header`, `Footer`, `MonthLabel`, `WeekdayHeader`, `DayCell`,
`ItemFragment`, `Inspector`, `Tooltip` are wrapper components receiving
`className`, `style`, `children`. The planner owns the outer semantic element
and every focus/hit surface:

- `ItemFragment` wraps **content inside the proxy**, not the fragment wrapper;
  the proxy, resize handles and data attributes stay planner-owned.
- `DayCell` wraps content inside the dated cell; the gridcell, ARIA and hit
  surface stay planner-owned.
- `Inspector` wraps content inside the aside; the aside, close button and focus
  target stay planner-owned.
- `Tooltip` wraps content inside the overlay.

### Slot and context types

```ts
interface YearPlannerSlotProps { className?: string; style?: CSSProperties; children?: ReactNode; }
type YearPlannerSlot = ComponentType<YearPlannerSlotProps>;
interface YearPlannerComponents {
  Root?: YearPlannerSlot; Header?: YearPlannerSlot; Footer?: YearPlannerSlot;
  MonthLabel?: YearPlannerSlot; WeekdayHeader?: YearPlannerSlot; DayCell?: YearPlannerSlot;
  ItemFragment?: YearPlannerSlot; Inspector?: YearPlannerSlot; Tooltip?: YearPlannerSlot;
}
interface DateMetaContext { isWeekend: boolean; isContextMonth: boolean; itemIds: readonly string[]; }
interface DateMeta {
  holiday?: boolean; label?: string; background?: string; color?: string;
  className?: string; style?: CSSProperties; disabled?: boolean;
  ariaLabel?: string; content?: ReactNode;
}
interface CellRenderContext extends DateMetaContext {
  date: DateKey; year: number; monthIndex: number; columnIndex: number;
}
interface ItemRenderContext {
  item: PlannerItem; fragment: RibbonFragment; fragmentIndex: number;
  fragmentCount: number; selected: boolean; readOnly: boolean;
}
interface AnnotationRenderContext { item: PlannerItem; fragment: RibbonFragment; }
interface TooltipRenderContext { item: PlannerItem; fragment?: RibbonFragment; }
```

`InspectorRenderContext` is defined in 03-05. `DateMeta` is defined in 03-03
above. All context objects are immutable snapshots.

### Render slots

| Slot | Placement | Contract |
|---|---|---|
| `renderCell` | Inside the dated cell after the date number | Additive; cell ARIA and hit surface stay |
| `renderItem` | Inside the proxy after the default label | Additive; proxy/handles stay; no interactive descendants |
| `renderAnnotation` | Inside the annotation fragment | Replaces default annotation content |
| `renderOverflow` | Inside the popover | Replaces the list content |
| `renderEmpty` | Empty layout/inspector state | Replaces the default message |
| `renderInspector` | Inside the aside | Replaces default inspector body |
| `renderTooltip` | Inside the tooltip surface | Replaces default content |

`renderLoading`/`renderError` are not implemented.

## `getDateMeta`

Called once per dated cell per render with:

```ts
{ isWeekend, isContextMonth, itemIds } // itemIds = effectively visible items intersecting the date
```

Returns optional `holiday`, `label`, `background`, `color`, `className`,
`style`, `disabled`, `ariaLabel`, `content`.

- Base cell background/text come from `getDateMeta`; weekend/context classes
  remain underneath.
- `label` renders as a small visible cell label (top-left).
- `ariaLabel` replaces the cell's accessible name; otherwise the localized date
  is used.
- `holiday: true` adds `data-yp-holiday="true"` and the `yp-holiday` class; it
  invents no text or color.
- `disabled` sets `aria-disabled="true"`, removes the cell from the tab order
  and rejects `selectRange`/click selection for that date with a no-op.
- `content` is rendered after the date number.
- Annotation fragments overlay their badge; annotation priority sorts badges,
  not cells.
- No holiday data is invented.

## Hidden data

- `visibleItems(context)` filters before fragment projection.
- Slots receive only visible items/fragments; `InspectorRenderContext.items` is
  the **effectively visible** selected items only.
- Overflow and tooltip read only visible fragments.
- Hidden item IDs, titles or periods never reach DOM attributes, slot contexts
  or diagnostics beyond the IDs RD-04 allows.

## Testing Requirements

- Cross-month/year fragments, lane positions, exact scaled widths.
- Proxy/button semantics, one roving tab stop, no nested interactive controls,
  handles as siblings.
- Annotation label/background/text color, `showAnnotations` toggle.
- Background/foreground channel behavior and layer opacity.
- Overflow button/popover context, hidden exclusion, Escape/focus return.
- Tooltip default/render slot, hidden exclusion.
- `getDateMeta` background/text/label/aria/holiday/disabled/content and
  annotation overlay.
- `renderCell`/`renderItem`/`ItemFragment` cannot remove the hit surface, proxy
  or ARIA.
- Item `style` allowlist and metadata strings never appear as HTML/CSS.
