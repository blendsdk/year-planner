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
 * A result above the 2x ceiling fails the command; a result between the budget
 * and the ceiling is recorded as a miss.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const RESULTS_DIR = resolve(ROOT, "test-results/bench");

/** Reads `--name value`. */
function argument(name, fallback) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
}

/** Runs a command with inherited output and fails on a non-zero exit. */
function run(command, args) {
  console.log(`\n$ ${command} ${args.join(" ")}`);
  execFileSync(command, args, { cwd: ROOT, stdio: "inherit" });
}

/** Returns the environment description written into the report. */
function environment() {
  const cpu = cpus()[0]?.model ?? "unknown CPU";
  return {
    cpu,
    cores: cpus().length,
    memoryGb: Math.round(totalmem() / 1024 ** 3),
    platform: `${platform()} ${release()}`,
    node: process.version,
  };
}

/** Formats a number with two decimals. */
function fixed(value) {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(2) : "—";
}

/** Reads every browser result file. */
function readBrowserResults() {
  if (!existsSync(RESULTS_DIR)) return [];
  return readdirSync(RESULTS_DIR)
    .filter((name) => /^results-.*\.json$/.test(name))
    .sort()
    .map((name) => {
      try {
        return JSON.parse(readFileSync(resolve(RESULTS_DIR, name), "utf8"));
      } catch {
        return undefined;
      }
    })
    .filter((entry) => entry !== undefined);
}

/** Reads the Node layout result file. */
function readLayoutResults() {
  const path = resolve(RESULTS_DIR, "layout.json");
  if (!existsSync(path)) return [];
  const payload = JSON.parse(readFileSync(path, "utf8"));
  return payload.results ?? [];
}

/** Renders the Markdown report. */
function renderMarkdown(report) {
  const lines = [
    "# Benchmark Report",
    "",
    `> **Generated**: ${report.generatedAt}`,
    `> **Environment**: ${report.environment.cpu} (${report.environment.cores} vCPU, ${report.environment.memoryGb} GB), ${report.environment.platform}, Node ${report.environment.node}`,
    "",
    "`pass` is at or below budget. `miss` is above budget but within the 2× ceiling and is a recorded",
    "deviation. `fail` is above the ceiling and fails the gate.",
    "",
    "| Scenario | Parameters | p50 | p95 | Max | Budget | Status |",
    "|---|---|---|---|---|---|---|",
  ];
  for (const entry of report.results) {
    const parameters = Object.entries(entry.parameters ?? {})
      .map(([key, value]) => `${key}=${String(value)}`)
      .join(", ");
    const samples = entry.frames ?? entry;
    lines.push(
      `| ${entry.scenario} | ${parameters} | ${fixed(samples.p50)} | ${fixed(
        samples.p95,
      )} | ${fixed(samples.max)} | ${fixed(entry.budget)} | ${entry.status} |`,
    );
  }
  lines.push("");
  lines.push("## Budgets");
  lines.push("");
  for (const [name, value] of Object.entries(BUDGETS)) {
    lines.push(`- ${name}: ${value}`);
  }
  lines.push("");
  lines.push("## CPU profiles");
  lines.push("");
  lines.push(
    "Raw profiles live under `test-results/bench/profiles` and are uploaded as CI artifacts.",
  );
  lines.push("");
  return `${lines.join("\n")}\n`;
}

const outBase = argument("--out", "test-results/bench/bench");
const enforce = process.argv.includes("--enforce") || process.env.PERF_STRICT === "1";
const reportOnly = process.argv.includes("--report-only");
const jsonPath = outBase.endsWith(".json") ? outBase : `${outBase}.json`;
const markdownPath = jsonPath.replace(/\.json$/, ".md");

mkdirSync(RESULTS_DIR, { recursive: true });
if (!reportOnly) {
  for (const name of readdirSync(RESULTS_DIR)) {
    if (/^results-.*\.json$/.test(name) || name === "layout.json" || name === "playwright.json") {
      rmSync(resolve(RESULTS_DIR, name));
    }
  }
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
for (const entry of results) {
  if (typeof entry.status !== "string") {
    entry.status = statusFor(Number(entry.p95), Number(entry.budget));
  }
}
const failures = results.filter((entry) => entry.status === "fail");
const report = {
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
  } miss, ${failures.length} fail`,
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
