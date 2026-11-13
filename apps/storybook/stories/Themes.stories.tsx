import {
  createTheme,
  YearPlanner,
  YearPlannerProvider,
  yearPlannerPresets,
} from "@blendsdk/react-year-planner";
import type { PlannerLayer } from "@blendsdk/year-planner-core";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { describeStories } from "./describe";
import { baseItems, groups, resources } from "./fixtures";

const THEME_NAMES = Object.keys(yearPlannerPresets);

/**
 * Theme-gallery layers deliberately omit explicit colours, so the
 * representative items inherit the selected preset. Custom-colour examples
 * live in the Items and Adapters stories.
 */
const themeLayers: PlannerLayer[] = [
  { id: "bookings", name: "Bookings", groupId: "logistics", channel: "ribbon", label: "B" },
  {
    id: "maintenance",
    name: "Maintenance",
    groupId: "logistics",
    channel: "ribbon",
    label: "M",
    pattern: "hatch",
  },
  {
    id: "training",
    name: "Training",
    groupId: "people",
    channel: "ribbon",
    label: "T",
    pattern: "dots",
  },
  { id: "highlight", name: "Highlight", channel: "highlight", label: "H" },
  { id: "holidays", name: "Holidays", channel: "background", label: "H", opacity: 0.55 },
  { id: "notes", name: "Notes", channel: "annotation" },
  { id: "preview", name: "Preview", channel: "foreground" },
];

const meta = {
  title: "Year Planner/01 Themes and Display",
  component: YearPlanner,
  args: {
    year: 2027,
    groups,
    layers: themeLayers,
    resources,
    items: baseItems,
    display: { theme: "material-teal", showISOWeekNumbers: true },
  },
  argTypes: {
    "display.theme": {
      control: "select",
      options: THEME_NAMES,
      description: "One of the 54 palette families or the two monochrome utilities.",
    },
  },
} satisfies Meta<typeof YearPlanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MaterialTeal: Story = {};

export const FluentMarigold: Story = {
  args: { display: { theme: "fluent-marigold", showISOWeekNumbers: true } },
};

export const HighContrast: Story = {
  args: { display: { theme: "high-contrast", showISOWeekNumbers: true } },
};

export const PrintTheme: Story = {
  args: { display: { theme: "print", showISOWeekNumbers: true } },
};

export const HiddenISOWeekNumbers: Story = {
  args: { display: { theme: "material-teal", showISOWeekNumbers: false } },
};

export const Zoom075: Story = {
  args: { display: { theme: "material-teal", zoom: 0.75 } },
};

export const Zoom125: Story = {
  args: { display: { theme: "material-teal", zoom: 1.25 } },
};

export const Zoom150: Story = {
  args: { display: { theme: "material-teal", zoom: 1.5 } },
};

export const LocaleGerman: Story = {
  args: { display: { theme: "material-teal", locale: "de-DE" } },
};

export const LocaleFrench: Story = {
  args: { display: { theme: "material-teal", locale: "fr-FR" } },
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
  args: { display: { theme: "material-teal", density: "expanded", compactMaxLanes: 3 } },
};

export const CompactTwoLanes: Story = {
  args: { display: { theme: "material-teal", density: "compact", compactMaxLanes: 2 } },
};

describeStories({
  MaterialTeal,
  FluentMarigold,
  HighContrast,
  PrintTheme,
  HiddenISOWeekNumbers,
  Zoom075,
  Zoom125,
  Zoom150,
  LocaleGerman,
  LocaleFrench,
  CssVariableOverride,
  ProviderTheme,
  Unstyled,
  HighDensityExpanded,
  CompactTwoLanes,
});
