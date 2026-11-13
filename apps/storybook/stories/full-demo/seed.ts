import type { PlannerItem, PlannerLayer } from "@blendsdk/year-planner-core";

/** The demo plan year. Fixed so screenshots and tests are reproducible. */
export const DEMO_YEAR = 2027;

/** localStorage key for the construction plan. */
export const STORAGE_KEY = "year-planner.full-demo.v1";

/** Project metadata stored on each planner item. */
export interface ProjectMeta {
  /** Client name shown in the details panel. */
  client: string;
  /** Crew assigned to the project. */
  crew: string;
  /** Budget in GBP. */
  budget: number;
}

/** Layers used by the construction plan. */
export const LAYERS: PlannerLayer[] = [
  { id: "build", name: "New build", channel: "ribbon", color: "#1d4e89", label: "B" },
  { id: "renovation", name: "Renovation", channel: "ribbon", color: "#8358c6", label: "R" },
  { id: "service", name: "Service", channel: "ribbon", color: "#2a9d8f", label: "S" },
  { id: "milestones", name: "Milestones", channel: "annotation", color: "#f6bd60" },
];

/** A complete project item with its construction metadata. */
function project(
  id: string,
  layerId: string,
  startDate: string,
  endDateExclusive: string,
  title: string,
  status: "planned" | "active" | "complete",
  meta: ProjectMeta,
): PlannerItem {
  return {
    id,
    kind: "activity",
    layerId,
    period: { kind: "all-day", startDate, endDateExclusive },
    title,
    status,
    version: 1,
    metadata: meta,
  };
}

/** A one-day milestone annotation. */
function milestone(
  id: string,
  date: string,
  title: string,
  label: string,
  background: string,
  priority: number,
): PlannerItem {
  return {
    id,
    kind: "annotation",
    layerId: "milestones",
    period: { kind: "all-day", startDate: date, endDateExclusive: nextDay(date) },
    title,
    version: 1,
    annotation: { label, background, priority },
  };
}

/** Returns the next ISO date for a one-day annotation. */
function nextDay(date: string): string {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + 1);
  return value.toISOString().slice(0, 10);
}

/**
 * Seed plan for Northwind Construction.
 *
 * Eight projects across 2027, three crews and four milestones. The values are
 * synthetic; no client or budget is real.
 */
export const SEED_ITEMS: PlannerItem[] = [
  project("fd-northline", "build", "2027-01-11", "2027-04-04", "Northline warehouse", "active", {
    client: "Northline Logistics",
    crew: "Crew B",
    budget: 2_100_000,
  }),
  project("fd-riverside", "build", "2027-02-02", "2027-05-29", "Riverside offices", "active", {
    client: "Riverside Holdings",
    crew: "Crew A",
    budget: 4_200_000,
  }),
  project("fd-harbor", "renovation", "2027-03-09", "2027-07-31", "Harbor retrofit", "active", {
    client: "Port Authority",
    crew: "Crew C",
    budget: 2_800_000,
  }),
  project(
    "fd-school",
    "service",
    "2027-06-14",
    "2027-08-21",
    "School roof replacement",
    "planned",
    { client: "Northgate School", crew: "Crew B", budget: 640_000 },
  ),
  project(
    "fd-clinic",
    "renovation",
    "2027-09-01",
    "2027-12-19",
    "Mercy clinic fit-out",
    "planned",
    { client: "Mercy Clinic", crew: "Crew C", budget: 1_100_000 },
  ),
  project("fd-bridge", "service", "2027-09-21", "2027-10-03", "Bridge inspection", "complete", {
    client: "County Roads",
    crew: "Crew B",
    budget: 85_000,
  }),
  project("fd-parking", "build", "2027-10-05", "2028-01-15", "Civic parking deck", "planned", {
    client: "Civic Center",
    crew: "Crew A",
    budget: 3_600_000,
  }),
  project("fd-closeout", "service", "2027-12-06", "2027-12-23", "Year-end closeout", "planned", {
    client: "Various clients",
    crew: "Crew A",
    budget: 120_000,
  }),
  milestone("fd-ms-permit", "2027-02-01", "Riverside permit", "P", "#ffd166", 3),
  milestone("fd-ms-steel", "2027-03-20", "Steel delivery", "S", "#9dc7ff", 2),
  milestone("fd-ms-handover", "2027-07-28", "Harbor handover", "H", "#b9e4d0", 3),
  milestone("fd-ms-audit", "2027-11-10", "Safety audit", "A", "#f4a261", 2),
];
