import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

/**
 * Bundle size gate.
 *
 * Two measurements answer two different questions:
 *
 * - the React package entry plus its stylesheet is what a consumer adds on
 *   top of the core package, and it must stay under 60 kB gzip;
 * - the complete installed set (core, React, both adapters and CSS) must stay
 *   under the accepted 66 kB ceiling.
 */
import { BUDGETS } from "./bench-budgets.mjs";

const REACT_BUDGET_KB = BUDGETS.reactEntryCssKb;
const TOTAL_BUDGET_KB = BUDGETS.totalInstalledKb;

/** Recursively lists the emitted JavaScript files under one directory. */
function coreJavaScriptFiles(directory) {
  const entries = readdirSync(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...coreJavaScriptFiles(path));
    else if (entry.name.endsWith(".js")) files.push(path);
  }
  return files;
}

/** Returns the gzip size of one file in bytes. */
function gzipBytes(file) {
  return gzipSync(readFileSync(file)).byteLength;
}

const reactFiles = ["packages/react/dist/index.js", "packages/react/dist/styles.css"];
const totalFiles = [
  ...coreJavaScriptFiles("packages/core/dist"),
  "packages/react/dist/index.js",
  "packages/react/dist/adapters/fluent.js",
  "packages/react/dist/adapters/mui.js",
  "packages/react/dist/styles.css",
];

let reactTotal = 0;
for (const file of reactFiles) {
  const size = gzipBytes(file);
  reactTotal += size;
  console.log(`${file}: ${(size / 1024).toFixed(2)} kB gzip`);
}

let total = 0;
for (const file of totalFiles) {
  const size = gzipBytes(file);
  total += size;
  console.log(`${file}: ${(size / 1024).toFixed(2)} kB gzip`);
}

const entrySource = readFileSync("packages/react/dist/index.js", "utf8");
if (!entrySource.startsWith('"use client";')) {
  console.error("React entry is missing the use client directive");
  process.exit(1);
}
if (entrySource.includes("process.env")) {
  console.error("React entry contains an unguarded process.env reference");
  process.exit(1);
}

const reactKb = reactTotal / 1024;
const totalKb = total / 1024;
console.log(
  `React entry + CSS (ESM + styles): ${reactKb.toFixed(2)} kB gzip / ${REACT_BUDGET_KB} kB budget`,
);
console.log(
  `Total installed (core + React + adapters + CSS): ${totalKb.toFixed(2)} kB gzip / ${TOTAL_BUDGET_KB} kB budget`,
);

let failed = false;
if (reactKb > REACT_BUDGET_KB) {
  console.error(`React package budget exceeded: ${reactKb.toFixed(2)} kB > ${REACT_BUDGET_KB} kB`);
  failed = true;
}
if (totalKb > TOTAL_BUDGET_KB) {
  console.error(`Total bundle budget exceeded: ${totalKb.toFixed(2)} kB > ${TOTAL_BUDGET_KB} kB`);
  failed = true;
}
if (failed) process.exit(1);
