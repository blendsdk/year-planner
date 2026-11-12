#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { cpus, platform, release, totalmem } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Captures the Node, OS, CPU, Playwright and browser versions used for a test
 * run. Missing browsers are recorded as `not-installed`; a version is never
 * guessed.
 */

const ROOT = resolve(fileURLToPath(import.meta.url), "../..");

/** Reads the installed Playwright package version. */
function playwrightVersion() {
  try {
    const manifest = JSON.parse(
      readFileSync(resolve(ROOT, "node_modules/@playwright/test/package.json"), "utf8"),
    );
    return manifest.version ?? "unknown";
  } catch {
    return "unknown";
  }
}

/** Runs a command and returns its trimmed first line. */
function commandVersion(command, args) {
  try {
    return execFileSync(command, args, { cwd: ROOT, encoding: "utf8" }).trim().split("\n")[0];
  } catch {
    return "unknown";
  }
}

/** Returns the default browser launchers. */
async function defaultLaunchers() {
  const playwright = await import("@playwright/test");
  return {
    chromium: () => playwright.chromium.launch(),
    firefox: () => playwright.firefox.launch(),
    webkit: () => playwright.webkit.launch(),
  };
}

/**
 * Collects one environment record.
 *
 * @param {Record<string, () => Promise<{ version(): string }>>} [launchers]
 * @returns {Promise<Record<string, string>>}
 */
export async function collectEnvironment(launchers) {
  const resolved = launchers ?? (await defaultLaunchers());
  const browsers = {};
  for (const [name, launch] of Object.entries(resolved)) {
    try {
      const browser = await launch();
      browsers[name] = browser.version();
      await browser.close();
    } catch {
      browsers[name] = "not-installed";
    }
  }
  return {
    date: new Date().toISOString(),
    os: `${platform()} ${release()}`,
    cpu: cpus()[0]?.model ?? "unknown",
    cores: String(cpus().length),
    memoryGb: String(Math.round(totalmem() / 1024 ** 3)),
    node: process.version,
    pnpm: commandVersion("pnpm", ["--version"]),
    playwright: playwrightVersion(),
    ...browsers,
  };
}

/** Renders the key/value evidence file. */
export function renderEnvironment(environment) {
  return `${Object.entries(environment)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n")}\n`;
}

/** Reads `--out <path>`. */
function outputPath() {
  const index = process.argv.indexOf("--out");
  if (index !== -1 && process.argv[index + 1]) return process.argv[index + 1];
  return "test-results/environment.txt";
}

const invokedDirectly =
  process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if (invokedDirectly) {
  const environment = await collectEnvironment();
  const output = resolve(ROOT, outputPath());
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, renderEnvironment(environment));
  console.log(`Wrote ${output}`);
  if (!existsSync(output)) process.exit(1);
}
