import { YearPlanner } from "@blendsdk/react-year-planner";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within } from "storybook/test";
import { describeStories } from "./describe";
import { baseItems, groups, layers, overflowItems, resources } from "./fixtures";

const meta = {
  title: "Year Planner/10 Accessibility",
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

export const ClassicBlue: Story = {};

export const ClassicYellow: Story = {
  args: { display: { theme: "classic-yellow", showISOWeekNumbers: true } },
};

export const HighContrast: Story = {
  args: { display: { theme: "high-contrast", showISOWeekNumbers: true } },
};

export const SelectedItem: Story = {
  args: { defaultSelection: { dates: [], items: ["booking"] } },
};

export const DateRangeSelected: Story = {
  args: {
    defaultSelection: {
      dates: [{ startDate: "2027-02-01", endDateExclusive: "2027-02-08" }],
      items: [],
    },
  },
};

export const HolidayAndDisabled: Story = {
  args: {
    getDateMeta: (date) =>
      date === "2027-02-01"
        ? { holiday: true, label: "Holiday" }
        : date === "2027-02-10"
          ? { disabled: true, label: "Closed" }
          : undefined,
  },
};

export const Overflow: Story = {
  args: { defaultItems: [...baseItems, ...overflowItems] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getAllByRole("button", { name: /Show .* hidden items/ }).at(0);
    if (button) await userEvent.click(button);
  },
};

export const HiddenItem: Story = {
  args: {
    defaultVisibility: {
      hiddenGroupIds: [],
      hiddenLayerIds: [],
      hiddenItemIds: ["booking"],
    },
  },
};

export const ItemListInspector: Story = {
  args: { defaultSelection: { dates: [], items: ["maintenance", "training"] } },
};

export const LongWindow36: Story = {
  args: {
    year: undefined,
    range: { start: { year: 2027, month: 0 }, monthCount: 36 },
    defaultItems: baseItems,
  },
};

export const ExpandedDensity: Story = {
  args: { display: { theme: "classic-blue", density: "expanded", showISOWeekNumbers: true } },
};

export const SkipLinkFocused: Story = {
  play: async ({ canvasElement }) => {
    const link = canvasElement.querySelector<HTMLElement>(".yp-skip-link");
    link?.focus();
  },
};

export const AcceptedStatus: Story = {
  args: {
    defaultSelection: { dates: [], items: ["booking"] },
    onChangeRequest: () => ({ accepted: true, revision: String(Date.now()) }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Move later" }));
  },
};

export const RejectedStatus: Story = {
  args: {
    defaultSelection: { dates: [], items: ["booking"] },
    onChangeRequest: () => ({
      accepted: false,
      diagnostics: [
        {
          code: "CAPACITY_EXCEEDED",
          level: "error",
          message: "The host rejected the change",
        },
      ],
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Move later" }));
  },
};

describeStories({
  ClassicBlue,
  ClassicYellow,
  HighContrast,
  SelectedItem,
  DateRangeSelected,
  HolidayAndDisabled,
  Overflow,
  HiddenItem,
  ItemListInspector,
  LongWindow36,
  ExpandedDensity,
  SkipLinkFocused,
  AcceptedStatus,
  RejectedStatus,
});
