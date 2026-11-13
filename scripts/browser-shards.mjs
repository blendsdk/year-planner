#!/usr/bin/env node
/**
 * Sharded browser runner with a local result ledger.
 *
 * Usage:
 *
 *   node scripts/browser-shards.mjs plan [--gate pr|release] [--json] [--github-output FILE]
 *   node scripts/browser-shards.mjs run --shard <name> [--ci]
 *   node scripts/browser-shards.mjs affected [--baseline REF] [--paths a,b] [--dry-run]
 *   node scripts/browser-shards.mjs status [--json]
 *
 * `plan` applies the test map's source and full-on globs to the changed paths,
 * then packs the affected browser units into independent shards.
 * `run` executes one shard; CI calls it once per matrix entry.
 * `affected` is the local command: it runs only the selected units whose inputs
 * changed since the last passing result, and records new passes in the ledger.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { availableParallelism } from "node:os";
import { join, resolve } from "node:path";
import {
  collectEnvironment,
  fingerprintUnit,
  isCached,
  ledgerSummary,
  readLedger,
  recordFailure,
  recordPass,
  sha256Text,
  writeLedger,
} from "./lib/browser-ledger.mjs";
import {
  buildUnits,
  packShards,
  parseDiscovery,
  parseResults,
  selectBrowserGroups,
  shardArguments,
  toMatrix,
} from "./lib/browser-plan.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const MAP_FILE = "codeops/test-map.json";
const PLAN_FILE = "codeops/browser-plan.json";
const LEDGER_FILE = process.env.CODEOPS_BROWSER_LEDGER ?? ".cache/browser-ledger.json";

/** Reads one JSON file relative to the repository root. */
function readJson(file) {
  return JSON.parse(readFileSync(join(ROOT, file), "utf8"));
}

/** Parses `--name value` and boolean flags. */
function parseArgs(argv) {
  const options = { command: argv[0] ?? "plan", flags: new Set(), values: {} };
  const valueFlags = new Set([
    "gate",
    "baseline",
    "shard",
    "workers",
    "chromium-shards",
    "config",
    "report",
    "github-output",
    "ledger",
    "paths",
  ]);
  for (let index = 1; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const name = token.slice(2);
    if (valueFlags.has(name)) {
      const value = argv[index + 1];
      if (value === undefined) throw new Error(`--${name} needs a value`);
      options.values[name] = value;
      index += 1;
    } else {
      options.flags.add(name);
    }
  }
  return options;
}

/** Returns the comparison base for local selection. */
function defaultBaseline() {
  const probe = spawnSync("git", ["rev-parse", "--verify", "--quiet", "origin/main"], {
    cwd: ROOT,
    stdio: "ignore",
  });
  return probe.status === 0 ? "origin/main" : "HEAD";
}

/**
 * Runs one git command and returns its non-empty output lines.
 *
 * `null` means the command failed; the caller must not confuse that with an
 * empty change set.
 */
function gitLines(args) {
  const result = spawnSync("git", args, { cwd: ROOT, encoding: "utf8" });
  if (result.status !== 0) return null;
  return result.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * Collects committed, staged, unstaged and untracked paths.
 *
 * Three-dot comparison is used so a feature branch is measured from its merge
 * base. `undefined` means git could not answer; the planner then runs every
 * group instead of silently skipping work.
 */
function collectChangedPaths(base) {
  const committed =
    base && base !== "HEAD" ? gitLines(["diff", "--name-only", `${base}...HEAD`]) : [];
  if (committed === null) return undefined;
  const working = [
    gitLines(["diff", "--name-only"]),
    gitLines(["diff", "--name-only", "--cached"]),
    gitLines(["ls-files", "--others", "--exclude-standard"]),
  ];
  if (working.some((entry) => entry === null)) return undefined;
  return [
    ...new Set([...committed, ...working.flat()].map((path) => path.split("\\").join("/"))),
  ].sort();
}

/** Discovers Playwright test counts per spec and project. */
function discover(probeConfig) {
  const result = spawnSync(
    "pnpm",
    ["exec", "playwright", "test", "--list", "--reporter=json", "-c", probeConfig],
    { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  );
  if (result.status !== 0) return null;
  const start = result.stdout.indexOf("{");
  if (start === -1) return null;
  try {
    return parseDiscovery(JSON.parse(result.stdout.slice(start)));
  } catch {
    return null;
  }
}

/** Builds the complete plan from the map, the browser config and the selection. */
function computePlan(options) {
  const map = readJson(MAP_FILE);
  const config = readJson(PLAN_FILE);
  const gate = options.values.gate ?? "pr";
  const baseline = options.values.baseline ?? defaultBaseline();
  const changedPaths = options.values.paths
    ? options.values.paths
        .split(",")
        .map((path) => path.trim())
        .filter(Boolean)
    : skipChanges(options)
      ? []
      : collectChangedPaths(baseline);
  const changed = changedPaths ?? [];
  const selection =
    changedPaths === undefined
      ? selectBrowserGroups({ map, config, changed: [], gate: "release" })
      : selectBrowserGroups({ map, config, changed, gate });
  if (changedPaths === undefined) {
    selection.reason = "git-unavailable";
  }
  const groupIds = selection.groupIds;
  const workers = Number(options.values.workers ?? config.defaultWorkers ?? 2);
  const chromiumShards = Number(options.values["chromium-shards"] ?? config.chromiumShards ?? 2);

  let discovery = null;
  if (groupIds.length > 0) {
    discovery = discover("playwright.config.ts");
  }
  const units = buildUnits({ map, config, groupIds, discovery });
  const shards = packShards({ units, config, chromiumShards, workers });
  return {
    schema: 1,
    gate,
    baseline,
    mode: selection.mode,
    reason: selection.reason,
    changed,
    groupIds,
    units,
    shards,
  };
}

/** Returns true when the gate always runs every browser group. */
function skipChanges(options) {
  const gate = options.values.gate ?? "pr";
  return gate === "release" || gate === "acceptance" || gate === "full";
}

/** Executes one Playwright invocation and returns its exit status. */
function runPlaywright({ args, configFile, workers, reportFile }) {
  mkdirSync(join(ROOT, "test-results"), { recursive: true });
  const result = spawnSync(
    "pnpm",
    ["exec", "playwright", "test", "-c", configFile, ...args, "--workers", String(workers)],
    {
      cwd: ROOT,
      stdio: "inherit",
      env: { ...process.env, PLAYWRIGHT_JSON_FILE: join(ROOT, reportFile) },
    },
  );
  return result.status ?? 1;
}

/** Reads a Playwright JSON report, or null when it is missing. */
function readReport(file) {
  try {
    return JSON.parse(readFileSync(join(ROOT, file), "utf8"));
  } catch {
    return null;
  }
}

/** Translates a plan into a JSON document for humans and CI. */
function planDocument(plan) {
  return {
    schema: 1,
    gate: plan.gate,
    baseline: plan.baseline,
    mode: plan.mode,
    reason: plan.reason,
    changed: plan.changed.length,
    selectedGroups: plan.groupIds,
    units: plan.units.length,
    shards: plan.shards.map((shard) => ({
      name: shard.name,
      installs: shard.installs,
      poppler: shard.poppler,
      workers: shard.workers,
      seconds: shard.seconds,
      specs: [...new Set(shard.units.map((unit) => unit.spec))].sort(),
      projects: [...new Set(shard.units.map((unit) => unit.project))].sort(),
    })),
    matrix: toMatrix(plan.shards),
  };
}

/** Writes the GitHub Actions outputs for the plan job. */
function writeGithubOutput(file, plan) {
  const matrix = JSON.stringify(toMatrix(plan.shards));
  const lines = [
    `matrix=${matrix}`,
    `shards=${plan.shards.length}`,
    `mode=${plan.mode}`,
    `groups=${plan.groupIds.join(",")}`,
  ];
  writeFileSync(resolve(ROOT, file), `${lines.join("\n")}\n`);
}

/** Prints one plan in text form. */
function printPlan(plan) {
  console.log(`mode: ${plan.mode}${plan.reason ? ` (${plan.reason})` : ""}`);
  console.log(`groups: ${plan.groupIds.join(", ") || "none"}`);
  console.log(`units: ${plan.units.length}`);
  for (const shard of plan.shards) {
    const specs = new Set(shard.units.map((unit) => unit.spec));
    console.log(
      `  ${shard.name.padEnd(12)} ${String(shard.units.length).padStart(3)} units, ` +
        `${shard.seconds.toFixed(0).padStart(4)} s, ${shard.installs.join("+") || "none"}, ` +
        `${specs.size} spec(s)`,
    );
  }
}

/** Runs the `plan` command. */
function commandPlan(options) {
  const plan = computePlan(options);
  const document = planDocument(plan);
  if (options.values["github-output"]) {
    writeGithubOutput(options.values["github-output"], plan);
  }
  if (options.flags.has("json")) {
    process.stdout.write(`${JSON.stringify(document, null, 2)}\n`);
  } else {
    printPlan(plan);
  }
  return 0;
}

/** Runs the `run` command for one precomputed shard. */
function commandRun(options) {
  const name = options.values.shard;
  if (!name) throw new Error("run needs --shard <name>");
  const plan = computePlan(options);
  const shard = plan.shards.find((entry) => entry.name === name);
  if (!shard) {
    console.error(`[browser] shard ${name} is not part of this plan.`);
    return 1;
  }
  const configFile = options.flags.has("ci")
    ? "playwright.ci.config.ts"
    : (options.values.config ?? "playwright.config.ts");
  return runPlaywright({
    args: shardArguments(shard),
    configFile,
    workers: Number(options.values.workers ?? shard.workers),
    reportFile: options.values.report ?? `test-results/browser-${name}.json`,
  });
}

/** Runs the local affected command with ledger reuse. */
function commandAffected(options) {
  const plan = computePlan(options);
  if (plan.units.length === 0) {
    console.log("[browser] no affected browser group; nothing to run.");
    return 0;
  }

  const map = readJson(MAP_FILE);
  const groups = new Map((map.groups ?? []).map((group) => [group.id, group]));
  const mapHash = sha256Text(readFileSync(join(ROOT, MAP_FILE)));
  const ledgerFile = options.values.ledger ?? LEDGER_FILE;
  const ledgerPath = resolve(ROOT, ledgerFile);
  const ledger = readLedger(ledgerPath);
  const environment = collectEnvironment(ROOT, "playwright.config.ts");
  const hashes = new Map();
  const fingerprints = new Map();
  const pending = [];
  const cached = [];

  for (const unit of plan.units) {
    const group = groups.get(unit.group);
    const { fingerprint } = fingerprintUnit({
      root: ROOT,
      unit,
      sourcePatterns: group?.sources ?? [],
      mapHash,
      environment,
      cache: hashes,
    });
    fingerprints.set(unit, fingerprint);
    if (isCached(ledger, unit, fingerprint)) cached.push(unit);
    else pending.push(unit);
  }

  console.log(
    `[browser] ${plan.units.length} unit(s): ${cached.length} cached, ${pending.length} to run.`,
  );
  if (options.flags.has("json")) {
    process.stdout.write(
      `${JSON.stringify(
        {
          units: plan.units.length,
          cached: cached.map((unit) => ({ spec: unit.spec, project: unit.project })),
          pending: pending.map((unit) => ({
            spec: unit.spec,
            project: unit.project,
            group: unit.group,
          })),
        },
        null,
        2,
      )}\n`,
    );
  }
  if (options.flags.has("dry-run") || pending.length === 0) {
    if (pending.length === 0) console.log("[browser] every affected unit is already cached.");
    return 0;
  }

  // The docs and Storybook specs serve built artifacts, not the dev server.
  // Rebuild them before running so a stale catalogue cannot pass or fail.
  if (pending.some((unit) => unit.group === "e2e.docs") && !options.flags.has("no-build")) {
    console.log("[browser] building Storybook and documentation artifacts...");
    const build = spawnSync("pnpm", ["docs:site"], { cwd: ROOT, stdio: "inherit" });
    if (build.status !== 0) return build.status ?? 1;
  }

  const byProject = new Map();
  for (const unit of pending) {
    const list = byProject.get(unit.project) ?? [];
    list.push(unit);
    byProject.set(unit.project, list);
  }

  const workers = Number(
    options.values.workers ?? Math.max(1, Math.min(4, Math.floor(availableParallelism() / 2))),
  );
  let exitCode = 0;
  for (const [project, units] of [...byProject].sort(([left], [right]) =>
    left.localeCompare(right),
  )) {
    const specs = [...new Set(units.map((unit) => unit.spec))].sort();
    const reportFile = `test-results/browser-local-${project}.json`;
    const limit = Math.min(...units.map((unit) => unit.workers ?? workers));
    const projectWorkers = Math.max(1, Math.min(workers, limit));
    console.log(`[browser] ${project}: ${specs.length} spec(s), ${projectWorkers} worker(s).`);
    const status = runPlaywright({
      args: [...specs, `--project=${project}`],
      configFile: options.values.config ?? "playwright.config.ts",
      workers: projectWorkers,
      reportFile,
    });
    const results = parseResults(readReport(reportFile) ?? {});
    for (const unit of units) {
      const result = results.get(`${unit.spec}\u0000${unit.project}`);
      if (status === 0 && result?.passed) {
        recordPass(ledger, unit, fingerprints.get(unit), result.durationMs);
      } else {
        recordFailure(ledger, unit);
      }
    }
    if (status !== 0) exitCode = status;
  }

  writeLedger(ledgerPath, ledger);
  const summary = ledgerSummary(ledger);
  console.log(`[browser] ledger: ${summary.passed} passing unit(s) in ${ledgerFile}.`);
  return exitCode;
}

/** Prints the current ledger summary. */
function commandStatus(options) {
  const ledgerFile = options.values.ledger ?? LEDGER_FILE;
  const ledger = readLedger(resolve(ROOT, ledgerFile));
  const summary = ledgerSummary(ledger);
  if (options.flags.has("json")) {
    process.stdout.write(
      `${JSON.stringify({ ...summary, file: ledgerFile, entries: ledger.entries }, null, 2)}\n`,
    );
    return 0;
  }
  console.log(`ledger: ${ledgerFile}`);
  console.log(`passing units: ${summary.passed} / ${summary.total}`);
  console.log(`oldest pass: ${summary.oldest ?? "none"}`);
  return 0;
}

/** Dispatches one command. */
function main() {
  const options = parseArgs(process.argv.slice(2));
  switch (options.command) {
    case "plan":
      return commandPlan(options);
    case "run":
      return commandRun(options);
    case "affected":
      return commandAffected(options);
    case "status":
      return commandStatus(options);
    default:
      console.error(`unknown command: ${options.command}`);
      console.error("usage: browser-shards.mjs <plan|run|affected|status> [options]");
      return 2;
  }
}

process.exitCode = main();
