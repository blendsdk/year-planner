#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/**
 * Builds and verifies the GitHub Pages site.
 *
 * The site is one artifact:
 *
 *   /            VitePress home, guide, tutorials and examples
 *   /storybook/  the static Storybook catalogue
 *   /api/        the generated TypeDoc reference
 *
 * The production base is `/year-planner/` because this is a GitHub Pages
 * project site. `DOCS_BASE_PATH` changes it for a custom domain.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..");
const DEFAULT_BASE = "/year-planner/";

/** Normalises a public base path to a leading and trailing slash. */
export function normalizeBase(value) {
  const trimmed = value.replace(/^\/+|\/+$/g, "");
  return trimmed ? `/${trimmed}/` : "/";
}

/**
 * Returns the local `src` and `href` URLs in an HTML document.
 *
 * External URLs, protocol-relative URLs and fragment-only links are skipped.
 * Root-absolute URLs are kept because both VitePress and Storybook emit them
 * under the Pages base.
 *
 * @param html HTML source.
 * @returns Unique local URLs without query strings or fragments.
 */
export function collectLocalUrls(html) {
  const urls = [];
  for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    const url = match[1] ?? "";
    if (!url || /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(url)) continue;
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

/**
 * Resolves a local URL to the file the static server would return.
 *
 * @param pageFile Absolute path of the HTML page.
 * @param url Local URL from the page.
 * @param root Artifact root.
 * @param base Public base path.
 * @returns Absolute path or `undefined` when the URL escapes the artifact.
 */
function resolveUrl(pageFile, url, root, base) {
  let target;
  if (url.startsWith("/")) {
    if (base !== "/" && !url.startsWith(base)) return undefined;
    const path = base === "/" ? url.slice(1) : url.slice(base.length);
    target = resolve(root, path);
  } else {
    target = resolve(dirname(pageFile), url);
  }
  if (target !== root && !target.startsWith(`${root}${sep}`)) return undefined;
  return target;
}

/**
 * Walks generated HTML pages and checks every local link and asset.
 *
 * Directory URLs resolve to `index.html`; extensionless URLs also try `.html`
 * so a clean-URL or `.html` build both pass.
 */
function checkHtmlTree(directory, errors, root, base, budget = { remaining: 2500 }) {
  if (!existsSync(directory) || budget.remaining <= 0) return;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (budget.remaining <= 0) return;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "assets") continue;
      checkHtmlTree(path, errors, root, base, budget);
      continue;
    }
    if (!entry.name.endsWith(".html")) continue;
    budget.remaining -= 1;
    const rel = path.slice(root.length + 1);
    for (const url of collectLocalUrls(readFileSync(path, "utf8"))) {
      const target = resolveUrl(path, url, root, base);
      if (!target) {
        errors.push(`${rel} references a path outside the artifact: ${url}`);
        continue;
      }
      if (
        !existsSync(target) &&
        !existsSync(join(target, "index.html")) &&
        !existsSync(`${target}.html`)
      ) {
        errors.push(`${rel} references missing ${url}`);
      }
    }
  }
}

/**
 * Verifies an existing artifact without building it.
 *
 * @param root Repository root that contains `docs/.vitepress/dist`.
 * @param options Base path override.
 * @returns Error messages; an empty array means the artifact is valid.
 */
export function verifyArtifact(root, options = {}) {
  const base = normalizeBase(options.base ?? process.env.DOCS_BASE_PATH ?? DEFAULT_BASE);
  const artifact = join(root, "docs/.vitepress/dist");
  const errors = [];

  for (const path of [
    "index.html",
    "storybook/index.html",
    "storybook/iframe.html",
    "storybook/index.json",
    "api/index.html",
    "api/core/index.html",
    "api/react/index.html",
  ]) {
    if (!existsSync(join(artifact, path))) errors.push(`missing ${path}`);
  }
  const home = join(artifact, "index.html");
  if (existsSync(home) && !readFileSync(home, "utf8").includes("Year Planner")) {
    errors.push("index.html does not contain the site title");
  }

  checkHtmlTree(artifact, errors, artifact, base);

  const storyIndex = join(artifact, "storybook/index.json");
  if (existsSync(storyIndex)) {
    try {
      const entries = JSON.parse(readFileSync(storyIndex, "utf8")).entries ?? {};
      if (Object.keys(entries).length === 0) errors.push("storybook/index.json has no stories");
    } catch {
      errors.push("storybook/index.json is not valid JSON");
    }
  }

  return errors;
}

/** Runs one command in the repository root. */
function run(command, args, root, extraEnv = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: false,
    env: { ...process.env, ...extraEnv },
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with exit ${result.status ?? "unknown"}`);
  }
}

/**
 * Builds the combined artifact, or checks an existing one.
 *
 * @param root Repository root.
 * @param checkOnly Skip the build and verify only.
 * @param options Base path override.
 * @returns True when the artifact is valid.
 */
export function buildDocsSite(root, checkOnly, options = {}) {
  const base = normalizeBase(options.base ?? process.env.DOCS_BASE_PATH ?? DEFAULT_BASE);
  const storybookBase = normalizeBase(
    process.env.STORYBOOK_BASE ?? `${base === "/" ? "" : base}storybook/`,
  );
  const artifact = join(root, "docs/.vitepress/dist");
  const storybook = join(root, "storybook-static");
  const api = join(root, "docs/api");

  if (!checkOnly) {
    const manifest = join(root, "package.json");
    if (!existsSync(manifest)) throw new Error(`--root has no package.json: ${root}`);
    const pkg = JSON.parse(readFileSync(manifest, "utf8"));
    if (pkg.name !== "year-planner")
      throw new Error(`--root is not the year-planner repository: ${root}`);
    rmSync(artifact, { recursive: true, force: true });
    rmSync(join(root, "docs/.vitepress/cache"), { recursive: true, force: true });
    rmSync(storybook, { recursive: true, force: true });
    rmSync(api, { recursive: true, force: true });
    // pnpm build first: the workspace packages feed Storybook and TypeDoc.
    run("pnpm", ["build"], root);
    run("pnpm", ["storybook:build"], root, { STORYBOOK_BASE: storybookBase });
    run("pnpm", ["docs:build"], root);
    run("pnpm", ["exec", "vitepress", "build", "docs"], root, { DOCS_BASE_PATH: base });
    cpSync(storybook, join(artifact, "storybook"), { recursive: true });
    cpSync(api, join(artifact, "api"), { recursive: true });
  }

  const errors = verifyArtifact(root, { base });
  if (errors.length > 0) {
    for (const error of errors) console.error(`docs-site: ${error}`);
    return false;
  }
  console.log(`docs site ok: ${countFiles(artifact)} files in ${artifact}`);
  console.log(`docs site base: ${base}`);
  return true;
}

/** Parses the CLI arguments. */
function parse(argv) {
  const options = { checkOnly: false, root: REPO_ROOT, base: undefined };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--") continue;
    if (token === "--check-only") options.checkOnly = true;
    else if (token === "--base") {
      const value = argv[index + 1];
      if (!value) throw new Error("--base needs a path");
      options.base = value;
      index += 1;
    } else if (token === "--root") {
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
    process.exitCode = buildDocsSite(options.root, options.checkOnly, options) ? 0 : 1;
  } catch (error) {
    console.error(`docs-site: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
