# Full construction demo

Northwind Construction's 2027 plan is a working demo, not a screenshot. It uses
the real planner with a host-owned details panel, a host-owned context menu and
browser storage.

<StoryFrame
  story="full-demo--full-demo"
  title="Northwind Construction 2027 plan"
  height="860px"
/>

## What to try

- **Double-click an empty date** to allocate a project. The dialog asks for the
  name, client, type, crew, end date and budget.
- **Right-click a project bar** to edit, duplicate, mark complete or delete it.
- **Delete** is immediate and undoable; use **Undo** in the header.
- **Reload the page**: the plan is stored in `localStorage` on this origin.
- **Search** by name or filter by status; the grid hides non-matching work.
- Switch **All lanes** to **Fit to screen** to see the 24 px fit contract.
- **Reset demo** returns the seed plan.
- **Print A3** prints the hidden annual plan.

## The model

The seed contains eight projects across three crews, three project types and
four milestone annotations. Every project carries construction metadata:

```ts
interface ProjectMeta {
  client: string;
  crew: string;
  budget: number;
}
```

Projects are ordinary `PlannerItem` values, so move, resize, selection,
accessibility, print and the command pipeline are the real component features.

## Storage

The demo writes `year-planner.full-demo.v1` after every accepted change. The
payload is versioned and validated on load; invalid data falls back to the seed.
An intentionally empty plan stays empty, so deleting every project survives a
reload. The **Reset demo** button clears the key.

The data is local to the browser and origin. It is not sent anywhere and does
not sync between devices.

## Source

The demo lives in the Storybook app, not in the published package:
`apps/storybook/stories/full-demo/`. The page you are reading embeds the same
story at `/storybook/iframe.html?id=full-demo--full-demo`.
