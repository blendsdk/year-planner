#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

/**
 * Minifies the published planner stylesheet.
 *
 * The source file stays readable. The package build writes a compact copy so
 * the installed CSS stays inside the bundle-size budget. The transformation
 * removes comments and redundant whitespace only; it does not rewrite values,
 * selectors or cascade layers.
 *
 * @param source - CSS text.
 * @returns Compact CSS text.
 *
 * @example
 * ```js
 * minifyCss(":root { color: red; }"); // ":root{color:red}"
 * ```
 */
export function minifyCss(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{}:;,>])\s*/g, "$1")
    .replace(/;}/g, "}")
    .trim();
}

const [, , input, output] = process.argv;
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!input || !output) {
    console.error("usage: minify-css.mjs <input.css> <output.css>");
    process.exit(2);
  }
  writeFileSync(output, minifyCss(readFileSync(input, "utf8")));
}
