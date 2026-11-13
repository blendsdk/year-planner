/**
 * Pure planning helpers for the sharded browser suite.
 *
 * The CodeOps test map owns which spec files belong to which feature group.
 * This module adds only the runtime facts the map schema does not carry:
 * which Playwright projects a group runs on, how long it takes, and how the
 * units are packed into independent CI shards.
 *
 * Keeping the functions pure makes the packing deterministic and lets the
 * quality tests exercise it without launching a browser.
 */
import { matchesAny } from "./glob.mjs";

/** Browser project order used in every emitted argument list. */
export const PROJECT_ORDER = Object.freeze([
  "chromium",
  "firefox",
  "webkit",
  "touch-chromium",
  "mobile-chromium",
  "mobile-webkit",
]);

/**
 * Sorts browser project names into the canonical order.
 *
 * @param {Iterable<string>} projects - Project names.
 * @returns {string[]} Sorted project names.
 */
export function sortProjects(projects) {
  const seen = [...new Set(projects)];
  return seen.sort((left, right) => {
    const leftIndex = PROJECT_ORDER.indexOf(left);
    const rightIndex = PROJECT_ORDER.indexOf(right);
    const leftRank = leftIndex === -1 ? PROJECT_ORDER.length : leftIndex;
    const rightRank = rightIndex === -1 ? PROJECT_ORDER.length : rightIndex;
    return leftRank - rightRank || left.localeCompare(right);
  });
}

/**
 * Reads the browser groups that exist in both the test map and the plan file.
 *
 * The map remains authoritative for spec ownership. A group present only in
 * the plan file is ignored, and a map group with no plan entry falls back to
 * the three desktop browsers.
 *
 * @param {object} map - Parsed `codeops/test-map.json`.
 * @param {object} config - Parsed `codeops/browser-plan.json`.
 * @returns {Array<{id: string, group: object, projects: string[], durationSec: number, poppler: boolean}>}
 *   Browser groups in map order.
 */
export function browserGroups(map, config) {
  const planned = config?.groups ?? {};
  return (map?.groups ?? [])
    .filter((group) => planned[group.id] !== undefined)
    .map((group) => {
      const entry = planned[group.id];
      return {
        id: group.id,
        group,
        projects: sortProjects(entry.projects ?? ["chromium", "firefox", "webkit"]),
        durationSec: Number(entry.durationSec ?? group.durationSec ?? 60),
        workers: entry.workers === undefined ? null : Math.max(1, Math.trunc(entry.workers)),
        workersByProject: entry.workersByProject ?? {},
        poppler: entry.poppler === true,
      };
    });
}

/**
 * Resolves the browser group IDs selected for one run.
 *
 * A missing selection means the selector was unavailable, so every browser
 * group runs. `full` also means every group. `none` means no group. Otherwise
 * the union of selected and deferred groups is used, because release-tier
 * groups are reported as deferred at the PR gate but still belong to the
 * browser plan. IDs that are not browser groups are ignored.
 *
 * @param {object} map - Parsed test map.
 * @param {object} config - Parsed browser plan.
 * @param {object|null|undefined} selection - `codeops-test select --json` result.
 * @returns {string[]} Selected browser group IDs in map order.
 */
export function resolveGroupIds(map, config, selection) {
  const ids = browserGroups(map, config).map((entry) => entry.id);
  if (!selection) return ids;
  if (selection.mode === "none") return [];
  if (selection.mode === "full") return ids;
  const selected = new Set([
    ...(selection.selected ?? []).map((entry) => entry.id),
    ...(selection.deferred ?? []).map((entry) => entry.id),
  ]);
  return ids.filter((id) => selected.has(id));
}

/**
 * Selects browser groups from the changed paths using the test map rules.
 *
 * The browser planner applies the same source, test, ignore and full-on globs
 * as the CodeOps selector, but only for browser groups. It fails closed: a
 * changed path that no group owns selects every browser group, because a new
 * file may change behaviour that the map does not describe yet.
 *
 * @param {object} input - Selection input.
 * @param {object} input.map - Parsed test map.
 * @param {object} input.config - Parsed browser plan.
 * @param {string[]} input.changed - Repository-relative changed paths.
 * @param {string} [input.gate="pr"] - Gate name.
 * @returns {{mode: "full"|"groups"|"none", groupIds: string[], reason: string|null}}
 *   Selection result.
 * @example
 * selectBrowserGroups({ map, config, changed: ["packages/react/src/theme.ts"] }).mode; // "groups"
 */
export function selectBrowserGroups({ map, config, changed, gate = "pr" }) {
  const browser = browserGroups(map, config);
  const allIds = browser.map((entry) => entry.id);
  if (gate === "release" || gate === "acceptance" || gate === "full") {
    return { mode: "full", groupIds: allIds, reason: "gate" };
  }
  if (changed.length === 0) {
    return { mode: "none", groupIds: [], reason: "no-change" };
  }

  const policy = map?.policy ?? {};
  const fullOn = policy.fullOnPaths ?? [];
  if (changed.some((path) => matchesAny(fullOn, path))) {
    return { mode: "full", groupIds: allIds, reason: "full-on-path" };
  }

  const ignored = (policy.ignorePaths ?? []).map((entry) => entry.glob);
  const relevant = changed.filter((path) => !matchesAny(ignored, path));
  if (relevant.length === 0) {
    return { mode: "none", groupIds: [], reason: "ignored" };
  }

  const owned = (map?.groups ?? []).flatMap((group) => [
    ...(group.sources ?? []),
    ...(group.tests ?? []),
  ]);
  if (relevant.some((path) => !matchesAny(owned, path))) {
    return { mode: "full", groupIds: allIds, reason: "unknown-path" };
  }

  const selected = new Set();
  for (const entry of browser) {
    const patterns = [...(entry.group.sources ?? []), ...(entry.group.tests ?? [])];
    if (relevant.some((path) => matchesAny(patterns, path))) selected.add(entry.id);
  }
  if (gate === "pr") {
    for (const id of policy.prSmoke ?? []) {
      if (allIds.includes(id)) selected.add(id);
    }
  }
  if (selected.size === 0) {
    return { mode: "none", groupIds: [], reason: "no-browser-change" };
  }
  return {
    mode: "groups",
    groupIds: allIds.filter((id) => selected.has(id)),
    reason: null,
  };
}

/**
 * Builds the smallest schedulable browser units.
 *
 * One unit is one spec file on one Playwright project. Discovery counts make
 * the estimate proportional to the real test count; without discovery each
 * spec/project pair receives an equal share of the group duration.
 *
 * @param {object} input - Planning input.
 * @param {object} input.map - Parsed test map.
 * @param {object} input.config - Parsed browser plan.
 * @param {string[]} input.groupIds - Group IDs to include.
 * @param {Map<string, number>|null} [input.discovery] - Counts keyed by `spec\u0000project`.
 * @returns {Array<{group: string, spec: string, project: string, seconds: number, poppler: boolean}>}
 *   Units in deterministic order.
 * @example
 * buildUnits({ map, config, groupIds: ["e2e.print"], discovery: null });
 */
export function buildUnits({ map, config, groupIds, discovery = null }) {
  const wanted = new Set(groupIds);
  const units = [];
  for (const entry of browserGroups(map, config)) {
    if (!wanted.has(entry.id)) continue;
    const specs = [...(entry.group.tests ?? [])].sort();
    const pairs = [];
    let totalWeight = 0;
    for (const spec of specs) {
      for (const project of entry.projects) {
        const weight = Math.max(1, discovery?.get(`${spec}\u0000${project}`) ?? 1);
        totalWeight += weight;
        pairs.push({ spec, project, weight });
      }
    }
    for (const pair of pairs) {
      units.push({
        group: entry.id,
        spec: pair.spec,
        project: pair.project,
        seconds: totalWeight === 0 ? 0 : (entry.durationSec * pair.weight) / totalWeight,
        poppler: entry.poppler,
        workers: entry.workersByProject[pair.project] ?? entry.workers ?? null,
      });
    }
  }
  return units;
}

/**
 * Packs units into balanced shards.
 *
 * Desktop Chromium units are balanced across `chromiumShards` buckets with a
 * longest-processing-time greedy pass. Firefox and WebKit each get one shard,
 * and the touch/mobile projects share a final shard. This keeps each job to a
 * single browser download where possible.
 *
 * @param {object} input - Packing input.
 * @param {Array<{group: string, spec: string, project: string, seconds: number, poppler: boolean}>} input.units
 *   Browser units.
 * @param {object} input.config - Parsed browser plan.
 * @param {number} [input.chromiumShards] - Chromium bucket count.
 * @param {number} [input.workers] - Playwright workers per shard.
 * @returns {Array<{name: string, installs: string[], poppler: boolean, workers: number, units: object[], seconds: number}>}
 *   Deterministic shard list.
 */
export function packShards({ units, config, chromiumShards, workers }) {
  const shardCount = Math.max(1, Math.trunc(chromiumShards ?? config?.chromiumShards ?? 2));
  const workerCount = Math.max(1, Math.trunc(workers ?? config?.defaultWorkers ?? 2));
  const chromium = units.filter((unit) => unit.project === "chromium");
  const desktop = units.filter((unit) => unit.project === "firefox" || unit.project === "webkit");
  const mobile = units.filter(
    (unit) =>
      unit.project !== "chromium" && unit.project !== "firefox" && unit.project !== "webkit",
  );

  const shards = [];
  if (chromium.length > 0) {
    const buckets = Array.from({ length: Math.min(shardCount, chromium.length) }, () => []);
    const loads = buckets.map(() => 0);
    for (const unit of [...chromium].sort(compareUnits)) {
      let target = 0;
      for (let index = 1; index < buckets.length; index += 1) {
        if (loads[index] < loads[target]) target = index;
      }
      buckets[target].push(unit);
      loads[target] += unit.seconds;
    }
    buckets.forEach((bucket, index) => {
      if (bucket.length === 0) return;
      shards.push(makeShard(`chromium-${index + 1}`, bucket, config, workerCount));
    });
  }

  for (const project of ["firefox", "webkit"]) {
    const bucket = desktop.filter((unit) => unit.project === project);
    if (bucket.length > 0) {
      shards.push(makeShard(project, bucket, config, workerCount));
    }
  }

  if (mobile.length > 0) {
    shards.push(makeShard("mobile", mobile, config, workerCount));
  }

  return shards;
}

/**
 * Compares two units for deterministic packing.
 *
 * @param {object} left - First unit.
 * @param {object} right - Second unit.
 * @returns {number} Sort order.
 */
function compareUnits(left, right) {
  return (
    right.seconds - left.seconds ||
    left.spec.localeCompare(right.spec) ||
    left.group.localeCompare(right.group)
  );
}

/**
 * Creates one shard object with its install list and totals.
 *
 * @param {string} name - Shard name.
 * @param {object[]} units - Units assigned to the shard.
 * @param {object} config - Parsed browser plan.
 * @param {number} workers - Playwright workers.
 * @returns {object} Shard description.
 */
function makeShard(name, units, config, workers) {
  const installs = new Set();
  for (const unit of units) {
    for (const browser of config?.browserInstall?.[unit.project] ?? [unit.project]) {
      installs.add(browser);
    }
  }
  // A shard inherits the strictest group limit. PDF generation and print
  // assertions are not safe in parallel, so those groups pin one worker.
  const limits = units.map((unit) => unit.workers ?? workers);
  const effectiveWorkers = Math.max(1, Math.min(workers, ...limits));
  return {
    name,
    installs: [...installs].sort(),
    poppler: units.some((unit) => unit.poppler),
    workers: effectiveWorkers,
    units: [...units].sort((left, right) => left.spec.localeCompare(right.spec)),
    seconds: Number(units.reduce((total, unit) => total + unit.seconds, 0).toFixed(2)),
  };
}

/**
 * Converts shards into stable Playwright arguments.
 *
 * @param {object} shard - Shard description.
 * @returns {string[]} Spec paths followed by repeated `--project` flags.
 */
export function shardArguments(shard) {
  const specs = [...new Set(shard.units.map((unit) => unit.spec))].sort();
  const projects = sortProjects(new Set(shard.units.map((unit) => unit.project)));
  return [...specs, ...projects.map((project) => `--project=${project}`)];
}

/**
 * Builds the GitHub Actions matrix for a shard list.
 *
 * @param {object[]} shards - Shards from `packShards`.
 * @returns {{include: Array<{name: string, install: string, poppler: boolean, workers: number, args: string[]}>}}
 *   Matrix payload.
 */
export function toMatrix(shards) {
  return {
    include: shards.map((shard) => ({
      name: shard.name,
      install: shard.installs.join(" "),
      poppler: shard.poppler,
      workers: shard.workers,
      args: shardArguments(shard),
    })),
  };
}

/**
 * Extracts test counts per spec and project from a Playwright JSON report.
 *
 * `playwright test --list --reporter=json` uses the same shape as a normal
 * report, so the planner can reuse it.
 *
 * @param {object} report - Parsed Playwright JSON output.
 * @returns {Map<string, number>} Counts keyed by `spec\u0000project`.
 * @example
 * parseDiscovery({ suites: [] }).size // 0
 */
export function parseDiscovery(report) {
  const counts = new Map();
  const visit = (suite) => {
    for (const spec of suite.specs ?? []) {
      const file = normaliseSpecFile(spec.file ?? suite.file);
      for (const test of spec.tests ?? []) {
        const key = `${file}\u0000${test.projectName ?? ""}`;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
    for (const child of suite.suites ?? []) visit(child);
  };
  for (const suite of report?.suites ?? []) visit(suite);
  return counts;
}

/**
 * Normalises a Playwright report file path to a repository-relative path.
 *
 * @param {string|undefined} file - File from a suite or spec.
 * @returns {string} Repository-relative path.
 */
export function normaliseSpecFile(file) {
  if (!file) return "";
  return file.startsWith("tests/") ? file : `tests/e2e/${file}`;
}

/**
 * Aggregates one Playwright JSON report into pass/fail results per unit.
 *
 * A unit counts as passed only when it executed at least one expected test and
 * no test failed, timed out, was interrupted or reported flaky. A unit that is
 * entirely skipped is not cacheable.
 *
 * @param {object} report - Parsed Playwright JSON report.
 * @returns {Map<string, {passed: boolean, durationMs: number}>} Results keyed by
 *   `spec\u0000project`.
 */
export function parseResults(report) {
  const grouped = new Map();
  const visit = (suite) => {
    for (const spec of suite.specs ?? []) {
      const file = normaliseSpecFile(spec.file ?? suite.file);
      for (const test of spec.tests ?? []) {
        const key = `${file}\u0000${test.projectName ?? ""}`;
        const entry = grouped.get(key) ?? { passed: 0, failed: 0, durationMs: 0 };
        const results = test.results ?? [];
        const duration = results.reduce((total, result) => total + (result.duration ?? 0), 0);
        entry.durationMs += duration;
        const status = test.status ?? "";
        const failedResult = results.some((result) =>
          ["failed", "timedOut", "interrupted"].includes(result.status),
        );
        if (status === "expected" && !failedResult) entry.passed += 1;
        else if (status === "skipped") {
          // Skipped tests contribute their time but never make a unit cacheable
          // on their own.
        } else entry.failed += 1;
        grouped.set(key, entry);
      }
    }
    for (const child of suite.suites ?? []) visit(child);
  };
  for (const suite of report?.suites ?? []) visit(suite);

  const results = new Map();
  for (const [key, entry] of grouped) {
    results.set(key, {
      passed: entry.failed === 0 && entry.passed > 0,
      durationMs: entry.durationMs,
    });
  }
  return results;
}
