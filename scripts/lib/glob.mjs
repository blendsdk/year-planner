/**
 * Minimal repository-relative glob helpers.
 *
 * The project intentionally avoids another dependency for this. The patterns
 * used by the test map need only `**`, `*` and `?`, which this module supports
 * with an anchored regular expression.
 */
import { existsSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";

/** Directories that never contribute to browser planning or fingerprints. */
export const IGNORED_DIRECTORIES = new Set([
  ".cache",
  ".git",
  ".turbo",
  ".vite",
  "coverage",
  "dist",
  "node_modules",
  "playwright-report",
  "release-packs",
  "storybook-static",
  "test-results",
]);

/**
 * Converts a glob pattern into an anchored regular expression.
 *
 * @param {string} pattern - Repository-relative glob.
 * @returns {RegExp} Anchored matcher.
 * @example
 * globToRegExp("src/**\/*.ts").test("src/a/b.ts"); // true
 */
export function globToRegExp(pattern) {
  let source = "^";
  for (let index = 0; index < pattern.length; index += 1) {
    const character = pattern[index];
    if (character === "*" && pattern[index + 1] === "*") {
      source += ".*";
      index += 1;
      if (pattern[index + 1] === "/") index += 1;
    } else if (character === "*") {
      source += "[^/]*";
    } else if (character === "?") {
      source += "[^/]";
    } else {
      source += character.replace(/[.+^${}()|[\]\\]/g, "\\$&");
    }
  }
  return new RegExp(`${source}$`);
}

/**
 * Reports whether a path matches any pattern.
 *
 * @param {Iterable<string>} patterns - Globs.
 * @param {string} path - Repository-relative path.
 * @returns {boolean} True on the first match.
 */
export function matchesAny(patterns, path) {
  for (const pattern of patterns) {
    if (globToRegExp(pattern).test(path)) return true;
  }
  return false;
}

/**
 * Returns the directory prefix before the first wildcard segment.
 *
 * @param {string} pattern - Repository-relative glob.
 * @returns {string} Directory prefix, possibly empty.
 */
function staticPrefix(pattern) {
  const prefix = [];
  for (const segment of pattern.split("/")) {
    if (segment.includes("*") || segment.includes("?")) break;
    prefix.push(segment);
  }
  return prefix.join("/");
}

/**
 * Lists every file under one directory, relative to the repository root.
 *
 * @param {string} root - Repository root.
 * @param {string} directory - Repository-relative directory.
 * @returns {string[]} Repository-relative file paths.
 */
function walkFiles(root, directory) {
  const start = resolve(root, directory);
  const files = [];
  const visit = (current) => {
    let entries;
    try {
      entries = readdirSync(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (IGNORED_DIRECTORIES.has(entry.name)) continue;
        visit(join(current, entry.name));
      } else if (entry.isFile()) {
        files.push(relative(root, join(current, entry.name)).split(sep).join("/"));
      }
    }
  };
  if (existsSync(start) && statSync(start).isDirectory()) visit(start);
  return files;
}

/**
 * Expands repository-relative globs into existing files.
 *
 * @param {string} root - Repository root.
 * @param {Iterable<string>} patterns - Globs or literal paths.
 * @returns {string[]} Sorted, de-duplicated repository-relative paths.
 * @example
 * expandPatterns(process.cwd(), ["packages/react/src/theme.ts"]);
 */
export function expandPatterns(root, patterns) {
  const files = new Set();
  for (const pattern of patterns) {
    if (!pattern.includes("*") && !pattern.includes("?")) {
      const target = resolve(root, pattern);
      if (!existsSync(target)) continue;
      if (statSync(target).isDirectory()) {
        for (const file of walkFiles(root, pattern)) files.add(file);
      } else {
        files.add(pattern);
      }
      continue;
    }
    const matcher = globToRegExp(pattern);
    const candidates = walkFiles(root, staticPrefix(pattern) || ".");
    for (const candidate of candidates) {
      if (matcher.test(candidate)) files.add(candidate);
    }
  }
  return [...files].sort();
}
