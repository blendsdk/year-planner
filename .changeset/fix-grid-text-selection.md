---
"@blendsdk/react-year-planner": patch
---

Prevent native text selection while dragging on the year grid. Day numbers, ISO
week numbers, item labels and month labels no longer start a browser selection
during select, paint, move or resize gestures. Inspector content and form controls
inside host slots remain selectable.
