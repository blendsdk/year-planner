import { YearPlanner } from "@blendsdk/react-year-planner";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { describeStories } from "./describe";
import {
  background,
  baseItems,
  booking,
  groups,
  holiday,
  item,
  layers,
  maintenance,
  overflowItems,
  preview,
  resources,
  timed,
  training,
} from "./fixtures";

const meta = {
  title: "Year Planner/03 Items, Annotations and Overflow",
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

export const RibbonsAndAnnotations: Story = {};

export const CrossMonthBooking: Story = {
  args: { items: [booking] },
};

export const CrossYearBooking: Story = {
  args: {
    items: [
      item("cross-year", "bookings", "2026-12-28", "2027-01-08", {
        title: "Cross-year booking",
      }),
    ],
  },
};

export const ThreeOverlappingLanes: Story = {
  args: {
    items: [
      item("lane-a", "bookings", "2027-02-01", "2027-02-08", { title: "Lane A" }),
      item("lane-b", "maintenance", "2027-02-01", "2027-02-08", { title: "Lane B" }),
      item("lane-c", "training", "2027-02-01", "2027-02-08", { title: "Lane C" }),
    ],
  },
};

export const TouchingIntervalsShareLane: Story = {
  args: {
    items: [
      item("first", "bookings", "2027-02-01", "2027-02-04", { title: "First" }),
      item("second", "bookings", "2027-02-04", "2027-02-08", { title: "Second" }),
    ],
  },
};

export const LongDurationFirst: Story = {
  args: {
    items: [
      item("short", "bookings", "2027-02-01", "2027-02-03", { title: "Short" }),
      item("long", "maintenance", "2027-02-01", "2027-02-12", { title: "Long" }),
    ],
  },
};

export const AnnotationsOnly: Story = {
  args: { items: [holiday] },
};

export const BackgroundAndForeground: Story = {
  args: { items: [background, preview] },
};

export const LayerPatterns: Story = {
  args: {
    layers: layers.map((layer) =>
      layer.id === "bookings"
        ? { ...layer, pattern: "solid" as const }
        : layer.id === "maintenance"
          ? { ...layer, pattern: "hatch" as const }
          : layer,
    ),
    items: [
      item("solid", "bookings", "2027-02-01", "2027-02-06", { title: "Solid" }),
      item("hatch", "maintenance", "2027-02-01", "2027-02-06", { title: "Hatch" }),
      item("dots", "training", "2027-02-01", "2027-02-06", { title: "Dots" }),
    ],
  },
};

export const CompactOverflow: Story = {
  args: { items: overflowItems },
};

export const ExpandedOverflow: Story = {
  args: {
    items: overflowItems,
    display: { theme: "classic-blue", density: "expanded" },
  },
};

export const TwoVisibleLanes: Story = {
  args: {
    items: overflowItems,
    display: { theme: "classic-blue", density: "compact", compactMaxLanes: 2 },
  },
};

export const TimedItem: Story = {
  args: { items: [timed] },
};

export const TimedAndAllDay: Story = {
  args: { items: [timed, booking, maintenance] },
};

export const HiddenLayer: Story = {
  args: {
    defaultVisibility: {
      hiddenGroupIds: [],
      hiddenLayerIds: ["maintenance"],
      hiddenItemIds: [],
    },
  },
};

export const HiddenGroup: Story = {
  args: {
    defaultVisibility: {
      hiddenGroupIds: ["logistics"],
      hiddenLayerIds: [],
      hiddenItemIds: [],
    },
  },
};

export const HiddenAnnotations: Story = {
  args: { display: { theme: "classic-blue", showAnnotations: false } },
};

export const NoItems: Story = {
  args: { items: [] },
};

export const OneDayItems: Story = {
  args: {
    items: [
      item("day-a", "bookings", "2027-02-01", "2027-02-02", { title: "One day" }),
      item("day-b", "maintenance", "2027-02-03", "2027-02-04", { title: "Another day" }),
    ],
  },
};

export const ItemsOutsideWindow: Story = {
  args: {
    items: [item("outside", "bookings", "2025-01-01", "2025-01-10", { title: "Outside" })],
  },
};

export const CollidingItemColors: Story = {
  args: {
    items: [
      item("red", "bookings", "2027-02-01", "2027-02-06", {
        title: "Red override",
        color: "#c1121f",
        textColor: "#ffffff",
      }),
      item("green", "bookings", "2027-02-06", "2027-02-11", {
        title: "Green override",
        color: "#2a9d8f",
        textColor: "#ffffff",
      }),
    ],
  },
};

export const TrainingAndBookings: Story = {
  args: {
    items: [item("ops", "bookings", "2027-02-01", "2027-02-20", { title: "Operations" }), training],
  },
};

describeStories({
  RibbonsAndAnnotations,
  CrossMonthBooking,
  CrossYearBooking,
  ThreeOverlappingLanes,
  TouchingIntervalsShareLane,
  LongDurationFirst,
  AnnotationsOnly,
  BackgroundAndForeground,
  LayerPatterns,
  CompactOverflow,
  ExpandedOverflow,
  TwoVisibleLanes,
  TimedItem,
  TimedAndAllDay,
  HiddenLayer,
  HiddenGroup,
  HiddenAnnotations,
  NoItems,
  OneDayItems,
  ItemsOutsideWindow,
  CollidingItemColors,
  TrainingAndBookings,
});
