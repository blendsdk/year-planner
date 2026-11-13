# Examples

The site ships with a live Storybook catalogue and a set of focused examples.
Everything below runs the real component; nothing is a mock.

| Example | What it shows |
| --- | --- |
| [Full construction demo](./full-demo.md) | A working 2027 construction plan with localStorage, allocation and context actions |
| [Interactive demo](./interactive.md) | Fit-to-host grid, selection, context menu and hover tooltips |
| [Themes](./themes.md) | Five presets, token overrides and dark surfaces |
| [Print](./print.md) | A3 pagination, fit-one-page and the print theme |
| [Design systems](./adapters.md) | Fluent UI v9 and MUI token adapters |
| [Story index](../stories.md) | Every built story, grouped and searchable |
| [Storybook](https://blendsdk.github.io/year-planner/storybook/) | The full manager with addons |

## Run the examples locally

```bash
pnpm install --frozen-lockfile
pnpm storybook        # Storybook at http://localhost:6006
pnpm docs:dev         # this site at http://localhost:5173/year-planner/
```

The docs dev server proxies `/year-planner/storybook` to the Storybook dev
server, so the embeds work while you edit either side.
