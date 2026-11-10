import { YearPlanner } from "@blendsdk/react-year-planner";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import {
  baseItems,
  booking,
  groups,
  holiday,
  item,
  layers,
  overflowItems,
  resources,
} from "./fixtures";

function ItemFragmentSlot({ children }: { children?: ReactNode }) {
  return <span data-yp-slot="item-fragment">{children}</span>;
}

function DayCellSlot({ children }: { children?: ReactNode }) {
  return <span data-yp-slot="day-cell">{children}</span>;
}

function RootSlot({ children }: { children?: ReactNode }) {
  return <div data-yp-slot="root">{children}</div>;
}

function HeaderSlot({ children }: { children?: ReactNode }) {
  return <div data-yp-slot="header">{children}</div>;
}

function FooterSlot({ children }: { children?: ReactNode }) {
  return <div data-yp-slot="footer">{children}</div>;
}

function MonthLabelSlot({ children }: { children?: ReactNode }) {
  return <strong data-yp-slot="month">{children}</strong>;
}

function WeekdayHeaderSlot({ children }: { children?: ReactNode }) {
  return <em data-yp-slot="weekday">{children}</em>;
}

const meta = {
  title: "Year Planner/05 Slots and Date Metadata",
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

export const HolidayDateMeta: Story = {
  args: {
    getDateMeta: (date) =>
      date === "2027-12-24" || date === "2027-12-31"
        ? {
            holiday: true,
            label: "HOL",
            background: "#ffe8d6",
            color: "#7f4f24",
            ariaLabel: "Company holiday",
          }
        : undefined,
  },
};

export const DisabledDates: Story = {
  args: {
    getDateMeta: (date) =>
      date >= "2027-12-20" && date < "2028-01-02" ? { disabled: true } : undefined,
  },
};

export const CustomCellContent: Story = {
  args: {
    getDateMeta: (date) =>
      date === "2027-02-14"
        ? { content: <span aria-hidden="true">♥</span>, label: "Event" }
        : undefined,
    renderCell: (context) =>
      context.date === "2027-02-01" ? <span className="story-cell-note">Kickoff</span> : null,
  },
};

export const CustomItemContent: Story = {
  args: {
    renderItem: (context) => (
      <span style={{ marginLeft: 4, opacity: 0.8 }}>[{context.item.status ?? "open"}]</span>
    ),
  },
};

export const CustomAnnotation: Story = {
  args: {
    items: [holiday],
    renderAnnotation: () => <span>Custom annotation</span>,
  },
};

export const CustomTooltip: Story = {
  args: {
    items: [booking],
    renderTooltip: (context) => (
      <span>
        {context.item.title} / {context.item.status}
      </span>
    ),
  },
};

export const CustomOverflow: Story = {
  args: {
    items: overflowItems,
    display: { theme: "classic-blue", compactMaxLanes: 2 },
    renderOverflow: (context) => (
      <div>
        Custom overflow: {context.hiddenCount} items on {context.row.rowId}
      </div>
    ),
  },
};

export const EmptyStateSlot: Story = {
  render: () => (
    <YearPlanner
      renderEmpty={() => <div style={{ padding: 24 }}>Choose a year to render the planner.</div>}
    />
  ),
};

export const ItemFragmentWrapper: Story = {
  args: { components: { ItemFragment: ItemFragmentSlot } },
};

export const DayCellWrapper: Story = {
  args: { components: { DayCell: DayCellSlot } },
};

export const StructuralWrappers: Story = {
  args: {
    components: {
      Root: RootSlot,
      Header: HeaderSlot,
      Footer: FooterSlot,
      MonthLabel: MonthLabelSlot,
      WeekdayHeader: WeekdayHeaderSlot,
    },
  },
};

export const AllSlotsTogether: Story = {
  args: {
    items: [booking, holiday],
    components: {
      ItemFragment: ItemFragmentSlot,
      DayCell: DayCellSlot,
      MonthLabel: MonthLabelSlot,
      WeekdayHeader: WeekdayHeaderSlot,
    },
    getDateMeta: (date) =>
      date === "2027-02-01" ? { label: "Start", background: "#e8f4ff" } : undefined,
    renderCell: (context) => (context.date === "2027-02-02" ? <span>slot</span> : null),
    renderItem: (context) => (
      <span style={{ marginLeft: 4 }}>{context.selected ? "selected" : "item"}</span>
    ),
    renderAnnotation: () => <span>OH</span>,
    renderTooltip: (context) => <span>tooltip: {context.item.title}</span>,
  },
};

export const ItemClassNameAndStyle: Story = {
  args: {
    items: [
      item("styled", "bookings", "2027-02-01", "2027-02-06", {
        title: "Styled item",
        className: "story-styled-item",
        style: { fontWeight: 700, textDecoration: "underline" },
      }),
    ],
  },
};

export const ManyOneDayItems: Story = {
  args: {
    items: Array.from({ length: 12 }, (_, index) =>
      item(
        `one-day-${index}`,
        index % 2 === 0 ? "bookings" : "training",
        `2027-03-${String(index + 1).padStart(2, "0")}`,
        `2027-03-${String(index + 2).padStart(2, "0")}`,
        { title: `Day ${index + 1}` },
      ),
    ),
  },
};
