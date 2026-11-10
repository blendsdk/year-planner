import type { LayerGroup, PlannerItem, PlannerLayer, Resource } from "@blendsdk/year-planner-core";

export const groups: LayerGroup[] = [
  { id: "ops", name: "Operations" },
  { id: "logistics", name: "Logistics", parentGroupId: "ops" },
  { id: "people", name: "People" },
];

export const layers: PlannerLayer[] = [
  {
    id: "bookings",
    name: "Bookings",
    groupId: "logistics",
    channel: "ribbon",
    color: "#1d4e89",
    label: "B",
    sortOrder: 0,
  },
  {
    id: "maintenance",
    name: "Maintenance",
    groupId: "logistics",
    channel: "ribbon",
    color: "#8358c6",
    label: "M",
    pattern: "hatch",
    sortOrder: 1,
  },
  {
    id: "training",
    name: "Training",
    groupId: "people",
    channel: "ribbon",
    color: "#2a9d8f",
    label: "T",
    pattern: "dots",
    sortOrder: 2,
  },
  {
    id: "holidays",
    name: "Holidays",
    channel: "background",
    color: "#ffd166",
    label: "H",
    opacity: 0.55,
  },
  {
    id: "notes",
    name: "Notes",
    channel: "annotation",
    color: "#f6bd60",
  },
  {
    id: "preview",
    name: "Preview",
    channel: "foreground",
    color: "#e76f51",
  },
];

export const resources: Resource[] = [
  { id: "alice", name: "Alice", type: "person" },
  { id: "bob", name: "Bob", type: "person" },
  { id: "room-a", name: "Room A", type: "room" },
];

export const item = (
  id: string,
  layerId: string,
  startDate: string,
  endDateExclusive: string,
  overrides: Partial<PlannerItem> = {},
): PlannerItem => ({
  id,
  kind: "activity",
  layerId,
  period: { kind: "all-day", startDate, endDateExclusive },
  title: id,
  version: 1,
  ...overrides,
});

export const booking = item("booking", "bookings", "2027-01-28", "2027-02-07", {
  title: "Winter booking",
  status: "confirmed",
  assignments: [{ resourceId: "alice" }],
});

export const maintenance = item("maintenance", "maintenance", "2027-02-03", "2027-02-12", {
  title: "Maintenance window",
  status: "tentative",
  assignments: [{ resourceId: "bob" }],
});

export const training = item("training", "training", "2027-02-08", "2027-02-11", {
  title: "Team training",
  status: "confirmed",
});

export const holiday = item("holiday", "notes", "2027-02-01", "2027-02-02", {
  kind: "annotation",
  title: "Company holiday",
  annotation: { label: "OH", background: "#ffd166", priority: 2 },
});

export const background = item("background", "holidays", "2027-02-05", "2027-02-15", {
  kind: "highlight",
  title: "Holiday period",
});

export const preview = item("preview", "preview", "2027-03-01", "2027-03-05", {
  title: "Preview range",
});

export const timed = item("timed", "bookings", "2027-03-04", "2027-03-05", {
  title: "Timed event",
  period: {
    kind: "timed",
    start: "2027-03-04T08:00:00Z",
    endExclusive: "2027-03-04T10:30:00Z",
    timeZone: "UTC",
  },
});

export const overflowItems: PlannerItem[] = Array.from({ length: 20 }, (_, index) =>
  item(`overflow-${String(index).padStart(2, "0")}`, "bookings", "2027-04-01", "2027-04-04", {
    title: `Overflow ${index + 1}`,
  }),
);

export const baseItems = [booking, maintenance, training, holiday, background, preview];

export const storyLayers = layers;
export const storyGroups = groups;
export const storyResources = resources;
