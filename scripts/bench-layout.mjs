import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildClassicYearLayout,
  buildRibbonLayout,
  validatePlannerData,
} from "../packages/core/dist/index.js";
import { BUDGETS, statusFor } from "./bench-budgets.mjs";
import { buildBenchModel } from "./bench-data.mjs";

/**
 * Node-side layout benchmark.
 *
 * Measures pure layout and ribbon projection without a browser, so a regression
 * in the algorithmic path is separated from React rendering cost.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** Reads a `--name value` argument. */
function argument(name, fallback) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
}

/** Returns a nearest-rank percentile. */
function percentile(values, p) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.max(0, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[index];
}

/** Runs one scenario and returns its samples. */
function measure(items, months, density) {
  const model = buildBenchModel({ items, months });
  const validation = validatePlannerData({ items: model.items, layers: model.layers });
  if (!validation.ok) {
    throw new Error(
      `invalid benchmark model for ${items} items: ${validation.diagnostics
        .map((entry) => entry.code)
        .join(", ")}`,
    );
  }
  const visibility = {
    hiddenGroupIds: [],
    hiddenLayerIds: [],
    hiddenItemIds: [],
  };
  const options = {
    density: density === "overflow" ? "compact" : density,
    compactMaxLanes: density === "overflow" ? 1 : 3,
    displayTimeZone: "UTC",
  };
  const run = () => {
    const layoutResult = buildClassicYearLayout({
      range: { start: { year: 2027, month: 0 }, monthCount: months },
    });
    if (!layoutResult.ok) throw new Error("benchmark layout failed");
    const ribbon = buildRibbonLayout(
      layoutResult.layout,
      { model: validation.model, visibility, filter: {} },
      options,
    );
    return {
      fragments: ribbon.rows.reduce((total, row) => total + row.fragments.length, 0),
      overflow: ribbon.rows.reduce((total, row) => total + row.overflow.length, 0),
    };
  };
  run();
  run();
  const iterations = items >= 10000 ? 10 : 30;
  const samples = [];
  let counts = { fragments: 0, overflow: 0 };
  for (let index = 0; index < iterations; index += 1) {
    const started = performance.now();
    counts = run();
    samples.push(performance.now() - started);
  }
  const p50 = percentile(samples, 50);
  const p95 = percentile(samples, 95);
  const budget = items >= 10000 ? BUDGETS.layout10kP95Ms : BUDGETS.layoutP95Ms;
  return {
    scenario: "layout",
    parameters: { items, months, density },
    iterations,
    p50,
    p95,
    max: Math.max(...samples),
    ...counts,
    budget,
    status: samples.length < 5 ? "not-measured" : statusFor(p95, budget),
  };
}

const itemCounts = (argument("--items", "500,2000,10000") ?? "").split(",").map(Number);
const output = resolve(ROOT, argument("--out", "test-results/bench/layout.json") ?? "");
const results = [];
for (const items of itemCounts) {
  for (const density of ["compact", "expanded", "overflow"]) {
    results.push(measure(items, 14, density));
  }
}
mkdirSync(dirname(output), { recursive: true });
writeFileSync(
  output,
  `${JSON.stringify(
    {
      scenario: "layout",
      generatedAt: new Date().toISOString(),
      runId: process.env.BENCH_RUN_ID ?? "unassigned",
      hardware: "see docs/test-report.md",
      results,
    },
    null,
    2,
  )}\n`,
);
for (const result of results) {
  console.log(
    `layout ${result.parameters.items} items ${result.parameters.density}: p50 ${result.p50.toFixed(2)} ms, p95 ${result.p95.toFixed(2)} ms (${result.status})`,
  );
}
