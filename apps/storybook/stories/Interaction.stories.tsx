import { YearPlanner } from "@blendsdk/react-year-planner";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { describeStories } from "./describe";
import { baseItems, groups, layers, overflowItems, resources } from "./fixtures";

const meta = {
  title: "Year Planner/09 Interaction",
  component: YearPlanner,
  args: {
    year: 2027,
    groups,
    layers,
    resources,
    defaultItems: baseItems,
    activeLayerId: "highlight",
    display: { theme: "classic-blue", showISOWeekNumbers: true },
  },
} satisfies Meta<typeof YearPlanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AutoMode: Story = {};

export const InspectMode: Story = {
  args: { interaction: { mode: "inspect" } },
};

export const SelectMode: Story = {
  args: { interaction: { mode: "select" } },
};

export const PaintMode: Story = {
  args: { interaction: { mode: "paint" } },
};

export const EraseMode: Story = {
  args: { interaction: { mode: "erase" } },
};

export const CreateMode: Story = {
  args: {
    interaction: {
      mode: "create",
      createDefaults: { kind: "activity", layerId: "bookings" },
    },
  },
};

export const MoveMode: Story = {
  args: { interaction: { mode: "move" } },
};

export const ResizeMode: Story = {
  args: { interaction: { mode: "resize" } },
};

export const SelectedDateRange: Story = {
  args: {
    defaultSelection: {
      dates: [{ startDate: "2027-02-01", endDateExclusive: "2027-02-08" }],
      items: [],
      anchorDate: "2027-02-01",
      focusDate: "2027-02-07",
    },
  },
};

export const MultipleDateRanges: Story = {
  args: {
    defaultSelection: {
      dates: [
        { startDate: "2027-02-01", endDateExclusive: "2027-02-04" },
        { startDate: "2027-02-08", endDateExclusive: "2027-02-11" },
      ],
      items: [],
    },
  },
};

export const SelectedItem: Story = {
  args: {
    defaultSelection: {
      dates: [],
      items: ["booking"],
      anchorItemId: "booking",
      focusItemId: "booking",
    },
  },
};

export const MultipleSelectedItems: Story = {
  args: {
    defaultSelection: {
      dates: [],
      items: ["booking", "maintenance", "training"],
      anchorItemId: "booking",
      focusItemId: "training",
    },
  },
};

export const ItemRangeSelection: Story = {
  args: {
    defaultSelection: {
      dates: [],
      items: ["booking", "maintenance"],
      anchorItemId: "booking",
      focusItemId: "maintenance",
    },
  },
};

export const SelectAllVisible: Story = {
  args: {
    defaultSelection: {
      dates: [],
      items: ["booking", "maintenance", "training", "holiday", "background", "preview"],
    },
  },
};

export const DisabledDates: Story = {
  args: {
    getDateMeta: (date) =>
      date >= "2027-03-08" && date < "2027-03-15" ? { disabled: true, label: "Off" } : undefined,
  },
};

export const ReadOnlyInteraction: Story = {
  args: {
    readOnly: true,
    defaultSelection: { dates: [], items: ["booking"] },
  },
};

export const LockedLayer: Story = {
  args: {
    layers: layers.map((layer) =>
      layer.id === "maintenance" ? { ...layer, locked: true } : layer,
    ),
    defaultSelection: { dates: [], items: ["maintenance"] },
  },
};

export const TouchEditingOff: Story = {
  args: { interaction: { touchEditing: "off", mode: "select" } },
};

export const TouchEditingAuto: Story = {
  args: { interaction: { touchEditing: "auto", mode: "select" } },
};

export const TouchEditingOn: Story = {
  args: { interaction: { touchEditing: "on", mode: "select" } },
};

export const DoubleClickDisabled: Story = {
  args: {
    interaction: { doubleClick: "none" },
    defaultSelection: { dates: [], items: ["booking"] },
  },
};

export const AnnotationSelected: Story = {
  args: {
    defaultSelection: { dates: [], items: ["holiday"], focusItemId: "holiday" },
  },
};

export const HiddenSelectedItem: Story = {
  args: {
    defaultSelection: { dates: [], items: ["booking"] },
    defaultVisibility: {
      hiddenGroupIds: [],
      hiddenLayerIds: ["bookings"],
      hiddenItemIds: [],
    },
  },
};

export const MarqueeItemsMode: Story = {
  args: { interaction: { marquee: "items", mode: "auto" } },
};

export const MarqueeDatesMode: Story = {
  args: { interaction: { marquee: "dates", mode: "auto" } },
};

export const OverflowInteraction: Story = {
  args: {
    defaultItems: [...baseItems, ...overflowItems],
    interaction: { mode: "auto" },
  },
};

describeStories({
  AutoMode,
  InspectMode,
  SelectMode,
  PaintMode,
  EraseMode,
  CreateMode,
  MoveMode,
  ResizeMode,
  SelectedDateRange,
  MultipleDateRanges,
  SelectedItem,
  MultipleSelectedItems,
  ItemRangeSelection,
  SelectAllVisible,
  DisabledDates,
  ReadOnlyInteraction,
  LockedLayer,
  TouchEditingOff,
  TouchEditingAuto,
  TouchEditingOn,
  DoubleClickDisabled,
  AnnotationSelected,
  HiddenSelectedItem,
  MarqueeItemsMode,
  MarqueeDatesMode,
  OverflowInteraction,
});
