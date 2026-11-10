import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const BUDGET_KB = 60;

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

const files = [
  ...coreJavaScriptFiles("packages/core/dist"),
  "packages/react/dist/index.js",
  "packages/react/dist/adapters/fluent.js",
  "packages/react/dist/adapters/mui.js",
  "packages/react/dist/styles.css",
];

let total = 0;
for (const file of files) {
  const size = gzipSync(readFileSync(file)).byteLength;
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

const totalKb = total / 1024;
console.log(
  `Core + React package (JS + CSS): ${totalKb.toFixed(2)} kB gzip / ${BUDGET_KB} kB budget`,
);

if (totalKb > BUDGET_KB) {
  console.error(`Bundle budget exceeded: ${totalKb.toFixed(2)} kB > ${BUDGET_KB} kB`);
  process.exit(1);
}
