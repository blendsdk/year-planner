# @blendsdk/react-year-planner

A classic 14-month, Saturday-first, 37-column year planner for React, with
continuous ribbons, controlled selection and visibility, command validation,
A3 print output and themeable CSS. It ships 19 Material 2014 families, 35 Fluent
UI v9 families and two monochrome utility presets.

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
quickstart, guides and Storybook catalogue.

## License

[Year Planner Internal Use License 1.0](LICENSE): source-available and free for
internal business use and modification, including internal cloud hosting and
delivery to authorized users' browsers. Redistribution and customer-facing SaaS
require separate permission. Earlier MIT grants remain valid for material they
cover. See the [licensing guide](https://blendsdk.github.io/year-planner/licensing)
for deployment, contractor and output-sharing examples.

Palette data is attributed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
