import type { PlannerItem, PlannerLayer } from "@blendsdk/year-planner-core";

/** Input for the deterministic benchmark model. */
export interface BenchModelInput {
  /** Number of items to generate. */
  items: number;
  /** Number of month rows in the window. */
  months: number;
  /** Seed for the deterministic generator; defaults to 42. */
  seed?: number;
}

/** The fixed benchmark layers. */
export function benchLayers(): PlannerLayer[];

/** Adds days to a date key using UTC arithmetic only. */
export function addDays(date: string, days: number): string;

/** Builds a deterministic planner model. */
export function buildBenchModel(input: BenchModelInput): {
  layers: PlannerLayer[];
  items: PlannerItem[];
};
