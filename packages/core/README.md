# @blendsdk/year-planner-core

Pure TypeScript dates, intervals, validation, visibility, classic-year layout,
ribbon lanes and print planning for **Year Planner for React**.

This package has no React or DOM dependency. It is ESM-only.

```bash
pnpm add @blendsdk/year-planner-core
```

```ts
import { buildClassicYearLayout } from "@blendsdk/year-planner-core";

const result = buildClassicYearLayout({ year: 2027 });
if (result.ok) {
  console.log(result.layout.rows.length); // 14
}
```

See the [repository](https://github.com/blendsdk/year-planner) for the full
guides, the React package and the API reference. MIT licensed.
