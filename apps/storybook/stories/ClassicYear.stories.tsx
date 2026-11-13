import { YearPlanner } from "@blendsdk/react-year-planner";
import {
  getPlannerLanguage,
  getPlannerMessages,
  plannerLanguages,
} from "@blendsdk/year-planner-languages";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { describeStories } from "./describe";

const layers = [
  { id: "bookings", name: "Bookings", channel: "ribbon" as const, color: "#1d4e89", label: "B" },
  {
    id: "maintenance",
    name: "Maintenance",
    channel: "ribbon" as const,
    color: "#8358c6",
    label: "M",
    pattern: "hatch" as const,
  },
  { id: "notes", name: "Notes", channel: "annotation" as const, color: "#f6bd60" },
];

const items = [
  {
    id: "booking",
    kind: "activity" as const,
    layerId: "bookings",
    period: { kind: "all-day" as const, startDate: "2027-01-28", endDateExclusive: "2027-02-07" },
    title: "Winter booking",
    version: 1,
    status: "confirmed",
  },
  {
    id: "maintenance",
    kind: "activity" as const,
    layerId: "maintenance",
    period: { kind: "all-day" as const, startDate: "2027-02-03", endDateExclusive: "2027-02-12" },
    title: "Maintenance",
    version: 1,
  },
  {
    id: "holiday",
    kind: "annotation" as const,
    layerId: "notes",
    period: { kind: "all-day" as const, startDate: "2027-02-01", endDateExclusive: "2027-02-02" },
    title: "Company holiday",
    version: 1,
    annotation: { label: "OH", background: "#ffd166" },
  },
];

const meta = {
  title: "Classic Year/Grid",
  component: YearPlanner,
  args: {
    year: 2016,
    display: { theme: "material-teal", showISOWeekNumbers: true },
  },
} satisfies Meta<typeof YearPlanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MaterialTeal2016: Story = {};

export const FluentMarigold2017: Story = {
  args: {
    year: 2017,
    display: { theme: "fluent-marigold", showISOWeekNumbers: true },
  },
};

/** Switches the complete UI between every bundled language at runtime. */
function LanguageSelectorDemo() {
  const [languageId, setLanguageId] = useState("en");
  const language = getPlannerLanguage(languageId) ?? getPlannerLanguage("en");
  const locale = language?.locale ?? "en-US";
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <label style={{ font: "14px system-ui", display: "flex", gap: 8, alignItems: "center" }}>
        Language
        <select
          data-testid="storybook-language"
          value={languageId}
          onChange={(event) => setLanguageId(event.target.value)}
        >
          {plannerLanguages.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.nativeName} ({entry.locale})
            </option>
          ))}
        </select>
      </label>
      <YearPlanner
        year={2016}
        layers={layers}
        defaultItems={items}
        display={{ theme: "material-teal", showISOWeekNumbers: true, locale }}
        messages={getPlannerMessages(locale)}
      />
    </div>
  );
}

export const LanguageSelector: Story = {
  render: () => <LanguageSelectorDemo />,
};

export const GermanLocale: Story = {
  args: {
    year: 2016,
    layers,
    defaultItems: items,
    display: { theme: "material-teal", showISOWeekNumbers: true, locale: "de-DE" },
    messages: getPlannerMessages("de-DE"),
  },
};

export const ArmenianLocale: Story = {
  args: {
    year: 2016,
    layers,
    defaultItems: items,
    display: { theme: "material-teal", showISOWeekNumbers: true, locale: "hy-AM" },
    messages: getPlannerMessages("hy-AM"),
  },
};

export const TwelveMonths: Story = {
  args: {
    year: 2027,
    contextMonths: { before: 0, after: 0 },
    display: { theme: "material-teal", showISOWeekNumbers: true },
  },
};

export const ThirtySixMonths: Story = {
  args: {
    range: { start: { year: 2027, month: 0 }, monthCount: 36 },
    display: { theme: "material-teal", showISOWeekNumbers: true },
  },
};

export const ItemsAndInspector: Story = {
  args: {
    year: 2027,
    layers,
    items,
    defaultSelection: { dates: [], items: ["booking"] },
    display: { theme: "material-teal", showISOWeekNumbers: true },
  },
};

export const PrintTheme: Story = {
  args: {
    year: 2027,
    layers,
    items,
    print: { mode: "fit" },
    display: { theme: "print", showISOWeekNumbers: true },
  },
};

export const HighContrast: Story = {
  args: {
    year: 2027,
    layers,
    items,
    display: { theme: "high-contrast", showISOWeekNumbers: true },
  },
};

describeStories({
  MaterialTeal2016,
  FluentMarigold2017,
  LanguageSelector,
  GermanLocale,
  ArmenianLocale,
  TwelveMonths,
  ThirtySixMonths,
  ItemsAndInspector,
  PrintTheme,
  HighContrast,
});
