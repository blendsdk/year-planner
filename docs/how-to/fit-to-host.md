# Fit the grid to a host

`display.fit` defaults to `"contain"`. The planner measures its **parent**
element, scales day columns horizontally and chooses a vertical lane budget.
This page shows the host contract and the two escape hatches.

## Give the planner a bounded parent

The component root is content-sized; it cannot observe its own height. Measure
the parent instead. A flex child with `min-height: 0` is the usual layout.

```tsx
<section style={{ height: 680, minHeight: 0, overflow: "hidden" }}>
  <YearPlanner year={2027} items={items} layers={layers} />
</section>
```

Avoid an auto-height wrapper:

```tsx
<!-- The parent grows with the content, so the fit has nothing to measure. -->
<div>
  <YearPlanner year={2027} items={items} layers={layers} />
</div>
```

## What the fit chooses

1. Try the comfortable, compact and dense column profiles in order.
2. Keep a day column at least 24 CSS px wide.
3. Choose the largest 1–3 lane budget that fits the available row height.
4. If even one lane does not fit, keep one lane and scroll inside
   `.yp-viewport`.

A 14-month view at 1280 × 800 is the reference case: one lane, no page scroll.
At 1024 × 768 the dense profile fits or the component scrolls internally.
Content is never clipped.

## Turn the fit off

`fit: "none"` keeps the explicit design-unit geometry. Use it when the host
owns the scale or when you are comparing layout measurements.

```tsx
<YearPlanner year={2027} items={items} layers={layers} display={{ fit: "none" }} />
```

In explicit mode, `display.zoom` scales both axes. In fit mode it scales columns
only and is clamped to the 24 px floor; vertical geometry is fit-driven.

## Measure the host yourself

The built-in `ResizeObserver` runs after mount and ignores zero-size
observations (for example a hidden tab). If you need the fit to react to a
container that changes asynchronously, make sure the parent has a definite
height before the planner mounts, or let the observer settle and then call
`focusDate` / `scrollToDate` on the handle.

## Read more

- [Sizing and fit](../getting-started.md#sizing-and-fit)
- [Performance](../performance.md)
- [Limitations](../limitations.md)
