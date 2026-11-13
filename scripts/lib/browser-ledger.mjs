/**
 * Content-addressed result ledger for the local browser suite.
 *
 * A passing browser unit is reused only when every input that can change its
 * behaviour still hashes to the same value: the spec, its relative helpers, its
 * snapshots, the owning feature sources, the test configuration and the runtime
 * toolchain. The ledger never treats "it ran before" as evidence on its own.
 *
 * The file lives under `.cache/`, which is ignored by Git. CI does not use the
 * ledger because every runner starts from a clean checkout.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { expandPatterns } from "./glob.mjs";

/**
 * Application inputs every browser unit depends on.
 *
 * Browser tests navigate the demo, Storybook and documentation sites instead
 * of importing the component directly, so a change in those applications can
 * change any result even when no package source file moved.
 */
const GLOBAL_SOURCES = [
  "apps/demo/index.html",
  "apps/demo/vite.config.ts",
  "apps/demo/src/**",
  "apps/storybook/.storybook/**",
  "apps/storybook/stories/**",
  "docs/**/*.md",
  "docs/.vitepress/config.ts",
  "docs/.vitepress/theme/**",
  "docs/public/**",
];

/** Files that describe how the browser suite is built and executed. */
const CONFIG_FILES = [
  "package.json",
  "pnpm-lock.yaml",
  "tsconfig.base.json",
  "playwright.config.ts",
  "playwright.ci.config.ts",
  "codeops/test-map.json",
  "codeops/browser-plan.json",
];

/**
 * Computes the SHA-256 of a string.
 *
 * @param {string} text - Input text.
 * @returns {string} Lower-case hexadecimal digest.
 */
export function sha256Text(text) {
  return createHash("sha256").update(text).digest("hex");
}

/**
 * Computes the SHA-256 of one file, or `missing` when it cannot be read.
 *
 * @param {string} path - Absolute file path.
 * @returns {string} Digest or `missing`.
 */
export function sha256File(path) {
  try {
    return sha256Text(readFileSync(path));
  } catch {
    return "missing";
  }
}

/**
 * Serialises a value with sorted object keys.
 *
 * Sorting makes fingerprints stable across property insertion order, which is
 * what lets a ledger survive unrelated refactors.
 *
 * @param {unknown} value - JSON-compatible value.
 * @returns {string} Canonical JSON.
 */
export function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    const keys = Object.keys(value).sort();
    return `{${keys
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

/**
 * Resolves one relative import to a source file.
 *
 * @param {string} root - Repository root.
 * @param {string} from - Importing repository-relative file.
 * @param {string} specifier - Relative import string.
 * @returns {string|undefined} Resolved repository-relative path.
 */
function resolveImport(root, from, specifier) {
  const base = join(dirname(from), specifier);
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    base.replace(/\.js$/, ".ts"),
    base.replace(/\.js$/, ".tsx"),
    join(base, "index.ts"),
  ];
  for (const candidate of candidates) {
    const normalised = relative(root, resolve(root, candidate)).split(sep).join("/");
    if (existsSync(resolve(root, normalised)) && statSync(resolve(root, normalised)).isFile()) {
      return normalised;
    }
  }
  return undefined;
}

/**
 * Collects a spec file, its relative helper imports and its snapshots.
 *
 * @param {string} root - Repository root.
 * @param {string} spec - Repository-relative spec path.
 * @returns {string[]} Input files for the fingerprint.
 */
export function collectSpecInputs(root, spec) {
  const files = new Set([spec]);
  const queue = [spec];
  while (queue.length > 0) {
    const current = queue.pop();
    if (!current) continue;
    let source;
    try {
      source = readFileSync(resolve(root, current), "utf8");
    } catch {
      continue;
    }
    for (const match of source.matchAll(/from\s+["'](\.[^"']+)["']/g)) {
      const resolved = resolveImport(root, current, match[1] ?? "");
      if (resolved && !files.has(resolved)) {
        files.add(resolved);
        queue.push(resolved);
      }
    }
  }
  for (const snapshot of expandPatterns(root, [`${spec}-snapshots/**`])) files.add(snapshot);
  return [...files].sort();
}

/**
 * Reads the runtime facts that make a browser result reproducible.
 *
 * @param {string} root - Repository root.
 * @param {string} configFile - Playwright config file used for the run.
 * @returns {Record<string, string>} Environment record.
 */
export function collectEnvironment(root, configFile) {
  const playwrightManifest = join(root, "node_modules/@playwright/test/package.json");
  let playwright = "unknown";
  try {
    playwright = JSON.parse(readFileSync(playwrightManifest, "utf8")).version ?? "unknown";
  } catch {
    playwright = "unknown";
  }
  return {
    platform: process.platform,
    arch: process.arch,
    node: process.versions.node,
    playwright,
    browsers: sha256File(join(root, "node_modules/playwright-core/browsers.json")),
    browsersPath: process.env.PLAYWRIGHT_BROWSERS_PATH ?? "default",
    config: configFile,
  };
}

/**
 * Computes the fingerprint for one browser unit.
 *
 * @param {object} input - Fingerprint input.
 * @param {string} input.root - Repository root.
 * @param {object} input.unit - Browser unit.
 * @param {string[]} input.sourcePatterns - Source globs from the owning map group.
 * @param {string} input.mapHash - Hash of the test map.
 * @param {Record<string, string>} input.environment - Runtime record.
 * @param {Map<string, string>} [input.cache] - File hash cache reused across units.
 * @returns {{fingerprint: string, files: Record<string, string>}} Fingerprint and file digests.
 */
export function fingerprintUnit({ root, unit, sourcePatterns, mapHash, environment, cache }) {
  const hashes = cache ?? new Map();
  const digest = (file) => {
    if (!hashes.has(file)) hashes.set(file, sha256File(resolve(root, file)));
    return hashes.get(file);
  };
  const files = {};
  const inputs = [...GLOBAL_SOURCES, ...collectSpecInputs(root, unit.spec), ...sourcePatterns];
  for (const file of expandPatterns(root, inputs)) files[file] = digest(file);
  // Configuration files are literal paths, not globs, and must be present in
  // the payload even when they do not exist (the digest is then `missing`).
  for (const file of CONFIG_FILES) files[file] = digest(file);
  const payload = canonicalJson({
    files,
    environment,
    mapHash,
    group: unit.group,
    project: unit.project,
    spec: unit.spec,
  });
  return { fingerprint: sha256Text(payload), files };
}

/**
 * Returns the stable ledger key for one unit.
 *
 * @param {object} unit - Browser unit.
 * @returns {string} Ledger key.
 */
export function unitKey(unit) {
  return `${unit.spec}\u0000${unit.project}\u0000${unit.group}`;
}

/**
 * Reads the ledger, returning an empty ledger for a missing or corrupt file.
 *
 * @param {string} file - Ledger path.
 * @returns {{schema: number, entries: Record<string, object>}} Ledger.
 */
export function readLedger(file) {
  try {
    const parsed = JSON.parse(readFileSync(file, "utf8"));
    if (parsed?.schema === 1 && parsed.entries && typeof parsed.entries === "object") {
      return parsed;
    }
  } catch {
    // A missing or unreadable ledger simply means nothing is cached.
  }
  return { schema: 1, entries: {} };
}

/**
 * Writes the ledger, creating its directory.
 *
 * @param {string} file - Ledger path.
 * @param {{schema: number, entries: Record<string, object>}} ledger - Ledger.
 * @returns {void}
 */
export function writeLedger(file, ledger) {
  mkdirSync(dirname(file), { recursive: true });
  const ordered = Object.fromEntries(
    Object.entries(ledger.entries).sort(([left], [right]) => left.localeCompare(right)),
  );
  writeFileSync(file, `${JSON.stringify({ schema: 1, entries: ordered }, null, 2)}\n`);
}

/**
 * Reports whether a unit has a passing entry for its current fingerprint.
 *
 * @param {{entries: Record<string, object>}} ledger - Ledger.
 * @param {object} unit - Browser unit.
 * @param {string} fingerprint - Current fingerprint.
 * @returns {boolean} True when the unit can be reused.
 */
export function isCached(ledger, unit, fingerprint) {
  const entry = ledger.entries[unitKey(unit)];
  return entry?.status === "passed" && entry.fingerprint === fingerprint;
}

/**
 * Records a passing unit.
 *
 * @param {{entries: Record<string, object>}} ledger - Ledger to mutate.
 * @param {object} unit - Browser unit.
 * @param {string} fingerprint - Current fingerprint.
 * @param {number} durationMs - Observed duration.
 * @returns {void}
 */
export function recordPass(ledger, unit, fingerprint, durationMs) {
  ledger.entries[unitKey(unit)] = {
    fingerprint,
    status: "passed",
    durationMs,
    group: unit.group,
    spec: unit.spec,
    project: unit.project,
    recordedAt: new Date().toISOString(),
  };
}

/**
 * Removes a unit from the cache after a failure.
 *
 * @param {{entries: Record<string, object>}} ledger - Ledger to mutate.
 * @param {object} unit - Browser unit.
 * @returns {void}
 */
export function recordFailure(ledger, unit) {
  delete ledger.entries[unitKey(unit)];
}

/**
 * Summarises a ledger for status output.
 *
 * @param {{entries: Record<string, object>}} ledger - Ledger.
 * @returns {{total: number, passed: number, oldest: string|null}} Summary.
 */
export function ledgerSummary(ledger) {
  const entries = Object.values(ledger.entries);
  const passed = entries.filter((entry) => entry.status === "passed");
  const dates = passed
    .map((entry) => entry.recordedAt)
    .filter(Boolean)
    .sort();
  return { total: entries.length, passed: passed.length, oldest: dates[0] ?? null };
}
