#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { cpus, platform, release, totalmem } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { BUDGETS, statusFor } from "./bench-budgets.mjs";

/**
 * Benchmark orchestrator.
 *
 * Runs the Node layout benchmark and the production/development browser
 * benchmark, then aggregates every result into one JSON and one Markdown file.
 * It is report-first so a pre-optimization baseline can be captured honestly;
 * `--enforce` (or `PERF_STRICT=1`) gates the 2x ceiling and the issue-3 oracle.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const RESULTS_DIR = resolve(ROOT, "test-results/bench");
const PROFILE_DIR = resolve(RESULTS_DIR, "profiles");
const RUN_ID = new Date().toISOString();

/** Scenarios every complete benchmark run must produce. */
const REQUIRED_SCENARIOS = [
  "layout",
  "initial-render",
  "initial-render-window",
  "drag",
  "drag-expanded",
  "overflow",
  "issue3-production",
  "drag-36-months",
  "issue3-dev",
];

/** Budgets the benchmark actually measures. */
const MEASURED_BUDGETS = {
  layoutP95Ms: BUDGETS.layoutP95Ms,
  layout10kP95Ms: BUDGETS.layout10kP95Ms,
  initialRenderP95Ms: BUDGETS.initialRenderP95Ms,
  dragP95Ms: BUDGETS.dragP95Ms,
  overflowMs: BUDGETS.overflowMs,
};

/** Reads `--name value`. */
function argument(name, fallback) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
}

/** Runs a command with inherited output and fails on a non-zero exit. */
function run(command, args) {
  console.log(`\n$ ${command} ${args.join(" ")}`);
  execFileSync(command, args, {
    cwd: ROOT,
    stdio: "inherit",
    env: { ...process.env, BENCH_RUN_ID: RUN_ID, ...(enforce ? { PERF_STRICT: "1" } : {}) },
  });
}

/** Returns the environment description written into the report. */
function environment() {
  const cpu = cpus()[0]?.model ?? "unknown CPU";
  let playwright = "unknown";
  try {
    const manifest = JSON.parse(
      readFileSync(resolve(ROOT, "node_modules/@playwright/test/package.json"), "utf8"),
    );
    playwright = manifest.version ?? "unknown";
  } catch {
    // The version is optional evidence; a missing manifest is recorded as unknown.
  }
  return {
    cpu,
    cores: cpus().length,
    memoryGb: Math.round(totalmem() / 1024 ** 3),
    platform: `${platform()} ${release()}`,
    node: process.version,
    playwright,
  };
}

/** Formats a number with two decimals. */
function fixed(value) {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(2) : "—";
}

/** Reads every browser result file; an unreadable file is a harness error. */
function readBrowserResults() {
  if (!existsSync(RESULTS_DIR)) return [];
  return readdirSync(RESULTS_DIR)
    .filter((name) => /^results-.*\.json$/.test(name))
    .sort()
    .map((name) => {
      const path = resolve(RESULTS_DIR, name);
      try {
        return JSON.parse(readFileSync(path, "utf8"));
      } catch (error) {
        throw new Error(`Unreadable benchmark result ${path}: ${String(error)}`);
      }
    });
}

/** Reads the Node layout result file. */
function readLayoutResults() {
  const path = resolve(RESULTS_DIR, "layout.json");
  if (!existsSync(path)) return [];
  const payload = JSON.parse(readFileSync(path, "utf8"));
  return (payload.results ?? []).map((entry) => ({ runId: payload.runId, ...entry }));
}

/** Renders the Markdown report. */
function renderMarkdown(report) {
  const lines = [
    "# Benchmark Report",
    "",
    `> **Generated**: ${report.generatedAt}`,
    `> **Run**: \`${report.runId}\``,
    `> **Environment**: ${report.environment.cpu} (${report.environment.cores} vCPU, ${report.environment.memoryGb} GB), ${report.environment.platform}, Node ${report.environment.node}, Playwright ${report.environment.playwright}`,
    "",
    "`pass` is at or below budget. `miss` is above budget but within the 2× ceiling and is a recorded",
    "deviation. `fail` is above the ceiling and fails the enforcing gate. `n` is the sample count;",
    "with fewer than five samples the nearest-rank p95 equals the maximum.",
    "",
    "| Scenario | Parameters | n | p50 | p95 | Max | Budget | Status |",
    "|---|---|---:|---:|---:|---:|---:|---|",
  ];
  for (const entry of report.results) {
    const parameters = Object.entries(entry.parameters ?? {})
      .map(([key, value]) => `${key}=${String(value)}`)
      .join(", ");
    const samples = entry.frames ?? entry;
    lines.push(
      `| ${entry.scenario} | ${parameters} | ${samples.n ?? "—"} | ${fixed(
        samples.p50,
      )} | ${fixed(samples.p95)} | ${fixed(samples.max)} | ${fixed(entry.budget)} | ${
        entry.status
      } |`,
    );
  }
  lines.push("");
  lines.push("## Budgets");
  lines.push("");
  for (const [name, value] of Object.entries(MEASURED_BUDGETS)) {
    lines.push(`- ${name}: ${value}`);
  }
  lines.push("");
  lines.push("## CPU profiles");
  lines.push("");
  lines.push(
    "Raw profiles live under `test-results/bench/profiles`, named with the run id, and are uploaded",
  );
  lines.push("as CI artifacts.");
  lines.push("");
  return `${lines.join("\n")}\n`;
}

const outBase = argument("--out", "test-results/bench/bench");
const jsonPath = outBase.endsWith(".json") ? outBase : `${outBase}.json`;
const markdownPath = jsonPath.replace(/\.json$/, ".md");
const enforce = process.argv.includes("--enforce") || process.env.PERF_STRICT === "1";
const reportOnly = process.argv.includes("--report-only");

mkdirSync(RESULTS_DIR, { recursive: true });
if (!reportOnly) {
  for (const name of readdirSync(RESULTS_DIR)) {
    if (/^results-.*\.json$/.test(name) || name === "layout.json" || name === "playwright.json") {
      rmSync(resolve(RESULTS_DIR, name));
    }
  }
  rmSync(PROFILE_DIR, { recursive: true, force: true });
}

if (!reportOnly) {
  run("pnpm", ["build"]);
  run("pnpm", ["--filter", "@blendsdk/year-planner-demo", "build"]);
  run("node", ["scripts/bench-layout.mjs", "--out", "test-results/bench/layout.json"]);
  run("pnpm", ["exec", "playwright", "test", "-c", "playwright.bench.config.ts"]);
} else {
  console.log("Report-only: aggregating existing results");
}

const layoutResults = readLayoutResults();
const browserResults = readBrowserResults();
const results = [...layoutResults, ...browserResults];
if (results.length === 0) {
  console.error("No benchmark results were produced");
  process.exit(1);
}

const runIds = new Set(results.map((entry) => entry.runId).filter(Boolean));
if (runIds.size > 1 && !process.argv.includes("--allow-mixed")) {
  console.error(`Mixed benchmark runs: ${[...runIds].join(", ")}`);
  process.exit(1);
}

const missingScenarios = REQUIRED_SCENARIOS.filter(
  (scenario) => !results.some((entry) => entry.scenario === scenario),
);
if (missingScenarios.length && !reportOnly) {
  console.error(`Missing benchmark scenarios: ${missingScenarios.join(", ")}`);
  process.exit(1);
}

for (const entry of results) {
  const samples = entry.frames ?? entry;
  if (!Number.isFinite(samples.p95)) {
    console.error(`Result ${entry.scenario} has no p95 value`);
    process.exit(1);
  }
  entry.status = statusFor(samples.p95, entry.budget);
}

const failures = results.filter(
  (entry) =>
    entry.status === "fail" && entry.project !== "bench-dev" && entry.scenario !== "issue3-dev",
);
const reportRunId = runIds.size === 1 ? [...runIds][0] : RUN_ID;
const report = {
  runId: reportRunId,
  generatedAt: new Date().toISOString(),
  environment: environment(),
  results,
};
mkdirSync(dirname(resolve(ROOT, jsonPath)), { recursive: true });
writeFileSync(resolve(ROOT, jsonPath), `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(resolve(ROOT, markdownPath), renderMarkdown(report));

console.log(`\nWrote ${jsonPath} and ${markdownPath}`);
console.log(
  `Results: ${results.filter((entry) => entry.status === "pass").length} pass, ${
    results.filter((entry) => entry.status === "miss").length
  } miss, ${failures.length} above the 2x ceiling (development results excluded)`,
);
if (failures.length) {
  for (const entry of failures) {
    const samples = entry.frames ?? entry;
    console.error(
      `${enforce ? "FAIL" : "RECORDED"} ${entry.scenario}: p95 ${fixed(
        samples.p95,
      )} > ${fixed(entry.budget)} budget`,
    );
  }
  if (enforce) {
    console.error("Enforcing mode: the 2x ceiling was exceeded.");
    process.exit(1);
  }
  console.error("Report mode: results recorded; use --enforce or PERF_STRICT=1 to gate.");
}
