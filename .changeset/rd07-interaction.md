---
"@blendsdk/year-planner-core": minor
"@blendsdk/react-year-planner": minor
---

React package: add the interaction engine — pointer selection and marquee,
move, resize, paint, erase, create and delete gestures, ephemeral previews, the
full modifier and anchor/focus selection matrix, keyboard navigation, touch
scroll-first policy, disabled-date handling, focus restoration with a polite
live region, and local undo/redo integration.

Core package: add the optional additive `focusItemId` field to
`PlannerSelection`.

`PlannerSelection` gains an optional additive `focusItemId` field.
`InteractionConfig` gains `doubleClick: "inspect" | "none"` (default inspect).
`interaction.touchEditing` and `interaction.marquee` are now active rather than
inert.
