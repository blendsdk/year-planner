#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/**
 * Builds and verifies the GitHub Pages artifact.
 *
 * Storybook is the site root and the generated TypeDoc reference is copied to
 * `/api`. The build runs the workspace package build first because the private
 * Storybook app resolves the public packages through their `dist` exports; a
 * clean checkout has no `dist` until `pnpm build` runs.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..");

/**
 * Returns the relative `src` and `href` URLs in an HTML document.
 *
 * External URLs, protocol-relative URLs, fragment-only links and root-absolute
 * paths are skipped; Storybook emits relative `./` URLs that work under any
 * subpath.
 *
 * @param html HTML source.
 * @returns Unique relative URLs without query strings or fragments.
 */
export function collectRelativeUrls(html) {
  const urls = [];
  for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    const url = match[1] ?? "";
    if (!url || /^(?:[a-z]+:|\/\/|#)/i.test(url) || url.startsWith("/")) continue;
    urls.push(url.split("#")[0].split("?")[0]);
  }
  return [...new Set(urls)];
}

/** Counts files under a directory. */
function countFiles(directory) {
  let count = 0;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    count += entry.isDirectory() ? countFiles(join(directory, entry.name)) : 1;
  }
  return count;
}

/** Walks a bounded set of generated HTML pages and checks relative links. */
function checkHtmlTree(directory, errors, bound, budget = { remaining: 250 }) {
  if (!existsSync(directory) || budget.remaining <= 0) return;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (budget.remaining <= 0) return;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "assets") continue;
      checkHtmlTree(path, errors, bound, budget);
      continue;
    }
    if (!entry.name.endsWith(".html")) continue;
    budget.remaining -= 1;
    for (const url of collectRelativeUrls(readFileSync(path, "utf8"))) {
      const resolved = resolve(directory, url);
      if (resolved !== resolve(bound) && !resolved.startsWith(`${resolve(bound)}${sep}`)) {
        errors.push(`${path} references an escaping path ${url}`);
        continue;
      }
      if (!existsSync(resolved)) {
        errors.push(`${path} references missing ${url}`);
      }
    }
  }
}

/**
 * Verifies an existing artifact without building it.
 *
 * @param root Repository root that contains `storybook-static/`.
 * @returns Error messages; an empty array means the artifact is valid.
 */
export function verifyArtifact(root) {
  const artifact = join(root, "storybook-static");
  const errors = [];
  if (!existsSync(join(artifact, "index.html"))) {
    errors.push("missing storybook-static/index.html");
  }
  for (const path of ["api/index.html", "api/core/index.html", "api/react/index.html"]) {
    if (!existsSync(join(artifact, path))) errors.push(`missing ${path}`);
  }
  for (const page of ["index.html", "iframe.html"]) {
    const file = join(artifact, page);
    if (!existsSync(file)) continue;
    const html = readFileSync(file, "utf8");
    for (const match of html.matchAll(/(?:src|href)="(\/[^"]*)"/g)) {
      errors.push(`${page} uses a root-absolute URL ${match[1] ?? ""}`);
    }
    for (const url of collectRelativeUrls(html)) {
      if (!existsSync(join(artifact, url))) errors.push(`${page} references missing ${url}`);
    }
  }
  const landing = join(artifact, "api/index.html");
  if (existsSync(landing)) {
    for (const url of collectRelativeUrls(readFileSync(landing, "utf8"))) {
      if (!existsSync(join(artifact, "api", url))) {
        errors.push(`api/index.html references missing ${url}`);
      }
    }
  }
  checkHtmlTree(join(artifact, "api", "core"), errors, artifact);
  checkHtmlTree(join(artifact, "api", "react"), errors, artifact);
  return errors;
}

/** Runs one command in the repository root. */
function run(command, args, root) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: false,
    env: process.env,
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with exit ${result.status ?? "unknown"}`);
  }
}

/**
 * Builds the artifact, or checks an existing one.
 *
 * @param root Repository root.
 * @param checkOnly Skip the build and verify only.
 * @returns True when the artifact is valid.
 */
export function buildDocsSite(root, checkOnly) {
  const artifact = join(root, "storybook-static");
  if (!checkOnly) {
    const manifest = join(root, "package.json");
    if (!existsSync(manifest)) throw new Error(`--root has no package.json: ${root}`);
    const pkg = JSON.parse(readFileSync(manifest, "utf8"));
    if (pkg.name !== "year-planner")
      throw new Error(`--root is not the year-planner repository: ${root}`);
    rmSync(artifact, { recursive: true, force: true });
    rmSync(join(root, "docs/api"), { recursive: true, force: true });
    run("pnpm", ["build"], root);
    run("pnpm", ["storybook:build"], root);
    run("pnpm", ["docs:build"], root);
    cpSync(join(root, "docs/api"), join(artifact, "api"), { recursive: true });
  }
  const errors = verifyArtifact(root);
  if (errors.length > 0) {
    for (const error of errors) console.error(`docs-site: ${error}`);
    return false;
  }
  console.log(`docs site ok: ${countFiles(artifact)} files in ${artifact}`);
  return true;
}

/** Parses the CLI arguments. */
function parse(argv) {
  const options = { checkOnly: false, root: REPO_ROOT };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--") continue;
    if (token === "--check-only") options.checkOnly = true;
    else if (token === "--root") {
      const value = argv[index + 1];
      if (!value) throw new Error("--root needs a directory");
      options.root = resolve(value);
      index += 1;
    } else {
      throw new Error(`unknown option: ${token}`);
    }
  }
  return options;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const options = parse(process.argv.slice(2));
    process.exitCode = buildDocsSite(options.root, options.checkOnly) ? 0 : 1;
  } catch (error) {
    console.error(`docs-site: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
