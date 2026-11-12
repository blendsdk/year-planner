# @blendsdk/react-year-planner

A classic 14-month, Saturday-first, 37-column year planner for React, with
continuous ribbons, controlled selection and visibility, command validation,
A3 print output and themeable CSS.

The package is ESM-only and requires React 19.

```bash
pnpm add @blendsdk/react-year-planner react react-dom
```

```tsx
import { YearPlanner } from "@blendsdk/react-year-planner";
import "@blendsdk/react-year-planner/styles.css";

export function PlanningPage() {
  return <YearPlanner year={2027} />;
}
```

See the [repository](https://github.com/blendsdk/year-planner) for the
quickstart, guides and Storybook catalogue. MIT licensed.
