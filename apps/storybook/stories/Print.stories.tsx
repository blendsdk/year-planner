import { YearPlanner } from "@blendsdk/react-year-planner";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { baseItems, groups, layers, resources } from "./fixtures";

const meta = {
  title: "Year Planner/06 Print Planning",
  component: YearPlanner,
  parameters: {
    docs: {
      description: {
        component:
          "Use the browser print preview to inspect the hidden A3 page tree. Paginate renders 1/2/3 pages for 12–14 / 15–28 / 29–36 months; fit renders one scaled page and warns below 7 pt.",
      },
    },
  },
  args: {
    year: 2027,
    groups,
    layers,
    resources,
    items: baseItems,
    display: { theme: "classic-blue", showISOWeekNumbers: true },
    print: { page: "A3", mode: "paginate" },
  },
} satisfies Meta<typeof YearPlanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PaginateFourteenMonths: Story = {};

export const PaginateTwentyFourMonths: Story = {
  args: { range: { start: { year: 2027, month: 0 }, monthCount: 24 } },
};

export const PaginateThirtySixMonths: Story = {
  args: { range: { start: { year: 2027, month: 0 }, monthCount: 36 } },
};

export const PaginateSevenRowsPerPage: Story = {
  args: {
    range: { start: { year: 2027, month: 0 }, monthCount: 14 },
    print: { page: "A3", mode: "paginate", rowsPerPage: 7 },
  },
};

export const FitFourteenMonths: Story = {
  args: { print: { page: "A3", mode: "fit" } },
};

export const FitTwentyFourMonths: Story = {
  args: {
    range: { start: { year: 2027, month: 0 }, monthCount: 24 },
    print: { page: "A3", mode: "fit" },
  },
};

export const PrintTheme: Story = {
  args: { display: { theme: "print", showISOWeekNumbers: true } },
};

export const PrintThemeThirtySixMonths: Story = {
  args: {
    range: { start: { year: 2027, month: 0 }, monthCount: 36 },
    display: { theme: "print", showISOWeekNumbers: true },
  },
};

export const HighContrastPrint: Story = {
  args: { display: { theme: "high-contrast", showISOWeekNumbers: true } },
};

export const PrintWithoutISOWeekNumbers: Story = {
  args: { display: { theme: "print", showISOWeekNumbers: false } },
};
