/**
 * Deterministic benchmark data for the layout and browser harnesses.
 *
 * The generator is plain ESM so both the Node benchmark and the Vite demo can
 * import it. A small linear congruential generator keeps every run identical,
 * which lets before/after comparisons describe the render change rather than a
 * different fixture.
 */

const LAYERS = [
  { id: "bookings", name: "Bookings", channel: "ribbon", color: "#1d4e89", label: "B" },
  {
    id: "maintenance",
    name: "Maintenance",
    channel: "ribbon",
    color: "#8358c6",
    label: "M",
    pattern: "hatch",
  },
  { id: "training", name: "Training", channel: "ribbon", color: "#2a9d8f", label: "T" },
  { id: "highlight", name: "Highlight", channel: "highlight", color: "#ffd166", label: "H" },
  { id: "notes", name: "Notes", channel: "annotation", color: "#f6bd60" },
];

/** Returns a fresh copy of the fixed benchmark layers. */
export function benchLayers() {
  return LAYERS.map((layer) => ({ ...layer }));
}

/** Creates a deterministic pseudo-random generator. */
function createRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

/** Adds days to a date key using UTC arithmetic only. */
export function addDays(date, days) {
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day));
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

/**
 * Builds a deterministic planner model.
 *
 * @param {{ items: number, months: number, seed?: number }} input
 * @returns {{ layers: import("@blendsdk/year-planner-core").PlannerLayer[],
 *   items: import("@blendsdk/year-planner-core").PlannerItem[] }}
 */
export function buildBenchModel(input) {
  if (!Number.isInteger(input.items) || input.items < 1) {
    throw new RangeError(`items must be a positive integer: ${input.items}`);
  }
  if (!Number.isInteger(input.months) || input.months < 1) {
    throw new RangeError(`months must be a positive integer: ${input.months}`);
  }
  const seed = input.seed ?? 42;
  const random = createRandom(seed);
  const start = "2027-01-01";
  const totalDays = input.months * 31;
  const items = [];
  for (let index = 0; index < input.items; index += 1) {
    const layer = LAYERS[index % LAYERS.length];
    const offset = Math.floor(random() * totalDays);
    const duration = 1 + (index % 10);
    const item = {
      id: `bench-${String(index).padStart(5, "0")}`,
      kind:
        layer.channel === "highlight"
          ? "highlight"
          : layer.channel === "annotation"
            ? "annotation"
            : "activity",
      layerId: layer.id,
      period: {
        kind: "all-day",
        startDate: addDays(start, offset),
        endDateExclusive: addDays(start, offset + duration),
      },
      title: `Bench item ${index}`,
      version: 1,
    };
    if (layer.channel === "annotation") {
      item.annotation = { label: `N${index % 10}` };
    }
    items.push(item);
  }
  return { layers: benchLayers(), items };
}
