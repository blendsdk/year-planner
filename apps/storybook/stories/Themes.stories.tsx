import { createTheme, YearPlanner, YearPlannerProvider } from "@blendsdk/react-year-planner";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { baseItems, groups, layers, resources } from "./fixtures";

const meta = {
  title: "Year Planner/01 Themes and Display",
  component: YearPlanner,
  args: {
    year: 2027,
    groups,
    layers,
    resources,
    items: baseItems,
    display: { theme: "classic-blue", showISOWeekNumbers: true },
  },
} satisfies Meta<typeof YearPlanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ClassicBlue: Story = {};

export const ClassicYellow: Story = {
  args: { display: { theme: "classic-yellow", showISOWeekNumbers: true } },
};

export const Modern: Story = {
  args: { display: { theme: "modern", showISOWeekNumbers: true } },
};

export const HighContrast: Story = {
  args: { display: { theme: "high-contrast", showISOWeekNumbers: true } },
};

export const PrintTheme: Story = {
  args: { display: { theme: "print", showISOWeekNumbers: true } },
};

export const HiddenISOWeekNumbers: Story = {
  args: { display: { theme: "classic-blue", showISOWeekNumbers: false } },
};

export const Zoom075: Story = {
  args: { display: { theme: "classic-blue", zoom: 0.75 } },
};

export const Zoom125: Story = {
  args: { display: { theme: "classic-blue", zoom: 1.25 } },
};

export const Zoom150: Story = {
  args: { display: { theme: "classic-blue", zoom: 1.5 } },
};

export const LocaleGerman: Story = {
  args: { display: { theme: "classic-blue", locale: "de-DE" } },
};

export const LocaleFrench: Story = {
  args: { display: { theme: "classic-blue", locale: "fr-FR" } },
};

export const CssVariableOverride: Story = {
  args: {
    cssVars: {
      "--yp-ribbon": "#0b6bcb",
      "--yp-weekend": "#fff1f0",
      "--yp-selection-outline": "#d13438",
    },
  },
};

export const ProviderTheme: Story = {
  render: (args) => (
    <YearPlannerProvider theme={createTheme({ ribbon: "#6b4fa1", highlight: "#f2c94c" })}>
      <YearPlanner {...args} />
    </YearPlannerProvider>
  ),
};

export const Unstyled: Story = {
  args: { unstyled: true },
};

export const HighDensityExpanded: Story = {
  args: { display: { theme: "modern", density: "expanded", compactMaxLanes: 3 } },
};

export const CompactTwoLanes: Story = {
  args: { display: { theme: "classic-blue", density: "compact", compactMaxLanes: 2 } },
};
