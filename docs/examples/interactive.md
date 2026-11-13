# Interactive demo

This is the real component running in Storybook, embedded at the production
path. The demo frame fits a 14-month window into the available viewport, keeps
date cells and ribbon proxies at 24 px, and shows the host-owned context menu
from the `Demos` group.

<StoryFrame
  story="demos--context-menu"
  title="Year Planner — context menu demo"
  height="660px"
/>

## Try it

- **Right-click a date cell or a project bar** to open the host-owned menu.
- Use the menu actions, `Escape` or a click outside to close it; focus returns
  to the originating cell or item.
- Click a date, then `Shift`-click another date to select a range.
- Double-click an item to open the inspector; drag a bar to move it.

The frame is a separate Storybook preview. The full catalogue is at
[Storybook](https://blendsdk.github.io/year-planner/storybook/); the context
menu contract is in [Host-owned context menu](../how-to/context-menu.md).

## More interaction states

<StoryFrame
  story="demos--paint-layer"
  title="Year Planner — paint a highlight range"
  height="660px"
/>

<StoryFrame
  story="demos--select-range"
  title="Year Planner — select a date range"
  height="660px"
/>

## Why an iframe?

VitePress is a Vue application; the planner is React. The iframe is the
isolation boundary: the planner's stylesheet, CSS variables and React version do
not leak into the docs site, and the demo runs exactly as it does in the
catalogue. The same origin means a demo that stores data locally shares it with
the Storybook full demo.
