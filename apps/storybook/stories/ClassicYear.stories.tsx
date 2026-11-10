import { YearPlanner } from "@blendsdk/react-year-planner";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Classic Year/Grid",
  component: YearPlanner,
  args: {
    year: 2016,
    display: { theme: "classic-blue", showISOWeekNumbers: true },
  },
} satisfies Meta<typeof YearPlanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Blue2016: Story = {};

export const Yellow2017: Story = {
  args: {
    year: 2017,
    display: { theme: "classic-yellow", showISOWeekNumbers: true },
  },
};

export const TwelveMonths: Story = {
  args: {
    year: 2027,
    contextMonths: { before: 0, after: 0 },
    display: { theme: "modern", showISOWeekNumbers: true },
  },
};

export const ThirtySixMonths: Story = {
  args: {
    range: { start: { year: 2027, month: 0 }, monthCount: 36 },
    display: { theme: "classic-blue", showISOWeekNumbers: true },
  },
};
