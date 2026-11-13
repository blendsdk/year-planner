import { YearPlanner } from "@blendsdk/react-year-planner";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { describeStories } from "./describe";
import {
  baseItems,
  booking,
  groups,
  layers,
  maintenance,
  overflowItems,
  resources,
  training,
} from "./fixtures";

const meta = {
  title: "Year Planner/07 State and Filtering",
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

export const ControlledVisibility: Story = {
  args: {
    visibility: {
      hiddenGroupIds: [],
      hiddenLayerIds: ["maintenance"],
      hiddenItemIds: [],
      hiddenChannels: [],
    },
  },
};

export const HiddenGroupByDefault: Story = {
  args: {
    defaultVisibility: {
      hiddenGroupIds: ["logistics"],
      hiddenLayerIds: [],
      hiddenItemIds: [],
      hiddenChannels: [],
    },
  },
};

export const HiddenItemByDefault: Story = {
  args: {
    defaultVisibility: {
      hiddenGroupIds: [],
      hiddenLayerIds: [],
      hiddenItemIds: ["booking"],
      hiddenChannels: [],
    },
  },
};

export const HiddenChannel: Story = {
  args: {
    defaultVisibility: {
      hiddenGroupIds: [],
      hiddenLayerIds: [],
      hiddenItemIds: [],
      hiddenChannels: ["ribbon"],
    },
  },
};

export const FilterByStatus: Story = {
  args: { defaultFilter: { statuses: ["confirmed"] } },
};

export const FilterBySearch: Story = {
  args: { defaultFilter: { search: "maintenance" } },
};

export const FilterByLayer: Story = {
  args: { defaultFilter: { layerIds: ["bookings"] } },
};

export const FilterByResource: Story = {
  args: { defaultFilter: { resourceIds: ["alice"] } },
};

export const FilterNoMatches: Story = {
  args: { defaultFilter: { search: "does-not-exist" } },
};

export const SelectedItem: Story = {
  args: { defaultSelection: { dates: [], items: ["booking"] } },
};

export const SelectedItems: Story = {
  args: {
    defaultSelection: { dates: [], items: ["booking", "maintenance", "training"] },
  },
};

export const SelectionWithDates: Story = {
  args: {
    defaultSelection: {
      dates: [{ startDate: "2027-02-01", endDateExclusive: "2027-02-06" }],
      items: [],
      anchorDate: "2027-02-01",
      focusDate: "2027-02-05",
    },
  },
};

export const ReadOnlyPlanner: Story = {
  args: { readOnly: true, defaultSelection: { dates: [], items: ["booking"] } },
};

export const ReadOnlyLockedLayer: Story = {
  args: {
    readOnly: true,
    layers: layers.map((layer) => (layer.id === "bookings" ? { ...layer, locked: true } : layer)),
  },
};

export const OverlappingSelectionAndOverflow: Story = {
  args: {
    items: [...baseItems, ...overflowItems],
    defaultSelection: { dates: [], items: ["booking"], focusDate: "2027-04-01" },
  },
};

export const NoYear: Story = {
  render: () => <YearPlanner />,
};

export const InvalidWindow: Story = {
  args: { range: { start: { year: 2027, month: 0 }, monthCount: 10 } },
};

export const TwoIndependentInstances: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: 24 }}>
      <YearPlanner {...args} year={2016} display={{ theme: "material-teal" }} items={[]} />
      <YearPlanner {...args} year={2017} display={{ theme: "fluent-marigold" }} items={[]} />
    </div>
  ),
};

export const MaintenanceAndBookings: Story = {
  args: { items: [booking, maintenance, training] },
};

describeStories({
  ControlledVisibility,
  HiddenGroupByDefault,
  HiddenItemByDefault,
  HiddenChannel,
  FilterByStatus,
  FilterBySearch,
  FilterByLayer,
  FilterByResource,
  FilterNoMatches,
  SelectedItem,
  SelectedItems,
  SelectionWithDates,
  ReadOnlyPlanner,
  ReadOnlyLockedLayer,
  OverlappingSelectionAndOverflow,
  NoYear,
  InvalidWindow,
  TwoIndependentInstances,
  MaintenanceAndBookings,
});
