import { YearPlanner } from "@blendsdk/react-year-planner";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  baseItems,
  booking,
  groups,
  holiday,
  layers,
  maintenance,
  overflowItems,
  resources,
  timed,
  training,
} from "./fixtures";

const meta = {
  title: "Year Planner/04 Inspector",
  component: YearPlanner,
  args: {
    year: 2027,
    groups,
    layers,
    resources,
    items: baseItems,
    defaultSelection: { dates: [], items: ["booking"] },
    display: { theme: "classic-blue", showISOWeekNumbers: true },
  },
} satisfies Meta<typeof YearPlanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SelectedBooking: Story = {};

export const SelectedMaintenance: Story = {
  args: { defaultSelection: { dates: [], items: ["maintenance"] } },
};

export const MultipleSelectedItems: Story = {
  args: { defaultSelection: { dates: [], items: ["booking", "maintenance", "training"] } },
};

export const OverflowOnActiveRow: Story = {
  args: {
    items: overflowItems,
    defaultSelection: { dates: [], items: [], focusDate: "2027-04-01" },
  },
};

export const ReadOnly: Story = {
  args: { readOnly: true },
};

export const TimedItem: Story = {
  args: {
    items: [timed],
    defaultSelection: { dates: [], items: ["timed"] },
  },
};

export const AnnotationHostOwned: Story = {
  args: {
    items: [holiday],
    defaultSelection: { dates: [], items: ["holiday"] },
  },
};

export const HiddenSelection: Story = {
  args: {
    items: [booking],
    defaultVisibility: {
      hiddenGroupIds: ["logistics"],
      hiddenLayerIds: [],
      hiddenItemIds: [],
    },
    defaultSelection: { dates: [], items: ["booking"] },
  },
};

export const CustomInspector: Story = {
  args: {
    renderInspector: (context) => (
      <div>
        <p>{context.items.length} selected item(s)</p>
        <button type="button" onClick={() => context.actions.close()}>
          Close from slot
        </button>
      </div>
    ),
  },
};

export const InspectorClosed: Story = {
  args: { showInspector: false },
};

export const NoSelection: Story = {
  args: { defaultSelection: { dates: [], items: [] } },
};

export const SelectionWithOverflow: Story = {
  args: {
    items: [...baseItems, ...overflowItems],
    defaultSelection: { dates: [], items: ["booking"], focusDate: "2027-04-01" },
  },
};

export const MaintenanceLocked: Story = {
  args: {
    layers: layers.map((layer) =>
      layer.id === "maintenance" ? { ...layer, locked: true } : layer,
    ),
    defaultSelection: { dates: [], items: ["maintenance"] },
  },
};
