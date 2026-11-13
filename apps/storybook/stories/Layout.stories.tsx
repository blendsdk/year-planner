import { YearPlanner } from "@blendsdk/react-year-planner";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { describeStories } from "./describe";
import { baseItems, groups, layers, resources } from "./fixtures";

const meta = {
  title: "Year Planner/02 Layouts and Windows",
  component: YearPlanner,
  args: {
    year: 2027,
    groups,
    layers,
    resources,
    items: baseItems,
    display: { theme: "material-teal", showISOWeekNumbers: true },
  },
} satisfies Meta<typeof YearPlanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ClassicFourteenMonths: Story = {};

export const TwelveMonths: Story = {
  args: { range: { start: { year: 2027, month: 0 }, monthCount: 12 } },
};

export const EighteenMonths: Story = {
  args: { range: { start: { year: 2027, month: 0 }, monthCount: 18 } },
};

export const TwentyFourMonths: Story = {
  args: { range: { start: { year: 2027, month: 0 }, monthCount: 24 } },
};

export const ThirtySixMonths: Story = {
  args: { range: { start: { year: 2027, month: 0 }, monthCount: 36 } },
};

export const NoContextMonths: Story = {
  args: { contextMonths: { before: 0, after: 0 } },
};

export const TwoContextMonths: Story = {
  args: { contextMonths: { before: 2, after: 2 } },
};

export const HighlightPreviousYear: Story = {
  args: { year: 2027, highlightYear: 2026 },
};

export const EarliestViewYear: Story = {
  args: { year: 1601 },
};

export const LatestViewYear: Story = {
  args: { year: 9998 },
};

export const ThirtySixMonthsExpanded: Story = {
  args: {
    range: { start: { year: 2027, month: 0 }, monthCount: 36 },
    display: { theme: "material-teal", density: "expanded" },
  },
};

describeStories({
  ClassicFourteenMonths,
  TwelveMonths,
  EighteenMonths,
  TwentyFourMonths,
  ThirtySixMonths,
  NoContextMonths,
  TwoContextMonths,
  HighlightPreviousYear,
  EarliestViewYear,
  LatestViewYear,
  ThirtySixMonthsExpanded,
});
