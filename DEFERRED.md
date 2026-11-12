# Deferred Capabilities

R1 is the classic annual planner. The capabilities below are **not implemented**
and are not stubbed. Each entry names the reason and, where one exists, the
workaround a host can use today.

| Capability | Why it is deferred | Workaround today |
| ---------- | ------------------ | ---------------- |
| Resource timeline | R1 is a year grid, not a per-resource scheduler | Use one planner per resource or a host-side split |
| Recurrence | The model stores concrete items, not recurrence rules | Expand recurrence into concrete items on the host |
| Scenarios | No alternate-model overlay or comparison view | Render two planners side by side |
| Dependencies | No edge model or critical-path calculation | Draw dependencies in host overlays |
| Split/merge | No split or merge command pair | Delete and create items through commands |
| Batch multi-move/bulk | Commands target one item at a time | Issue several commands or one host-side batch |
| Data provider/loading/error states | The component is data-in, events-out; it does not fetch | Load data in the host and pass `items` |
| Controlled-host undo | The host owns history; the component exposes command outcomes | Keep a host undo stack and re-apply `items` |
| Timed editing | R1 edits all-day date ranges | Project timed data to date ranges or edit on the host |
| RTL | Layout and keyboard mirroring are not implemented | Keep the planner LTR in an RTL page |
| Week start | The grid is Saturday-first with 37 fixed columns | No supported override in R1 |
| Aggregated density | Density is per planner, not a zoomed-out aggregate | Use `zoom` or a smaller window |
| SVG/PDF export | The renderer is HTML/CSS plus the browser print path | Print to PDF from the browser |
| Optimizer | No scheduling or resource optimization | Optimize on the host before rendering |
| Full headless composition | The core is usable, but the React package is the supported composition | Use the core layout directly for custom rendering |
| Shadow DOM | No Shadow DOM boundary support | Render in the light DOM |
| Milestones | No zero-duration milestone primitive | Use a one-day item or an annotation |
| Parent/child activities | No hierarchy beyond layers and groups | Use layers or a host-side grouping |
| Non-Gregorian calendars | The temporal core is Gregorian | Convert dates on the host |
| Drag between layers/resources | Drag moves in time, not across layers | Reassign `layerId` through a host command |
| Second demo | One demo covers the integration states | Use the Storybook stories for more states |
| CJS/UMD | The packages are ESM-only | Use a dynamic `import()` or an ESM-aware bundler |
| Commercial support | The project is MIT and community-supported | Open an issue in the repository |

None of these is described as implemented anywhere in the documentation. The
accessibility and performance pages state their evidence status separately; this
list is about product scope.
