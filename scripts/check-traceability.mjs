#!/usr/bin/env node
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { checkTraceability } from "./lib/traceability.mjs";

/**
 * Command-line entry point for the traceability check.
 *
 * Usage: `node scripts/check-traceability.mjs [--through N] [--root DIR]`
 * Exit code 0 means every checked acceptance criterion has a matrix row and a
 * proving title; any failure prints each missing or malformed item.
 */
function main() {
  const args = process.argv.slice(2);
  let through = 12;
  let root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  for (let index = 0; index < args.length; index += 1) {
    const flag = args[index];
    const value = args[index + 1];
    if (flag === "--through" && value !== undefined) {
      through = Number(value);
      index += 1;
    } else if (flag === "--root" && value !== undefined) {
      root = resolve(value);
      index += 1;
    }
  }
  if (!Number.isInteger(through) || through < 1) {
    console.error("--through must be a positive integer");
    process.exit(2);
  }
  const result = checkTraceability(root, { through });
  if (result.ok) {
    console.log(`Traceability check passed: ${result.expected.length} acceptance criteria`);
    return;
  }
  console.error("Traceability check failed:");
  if (result.missingMatrix.length) {
    console.error(
      `  missing matrix rows (${result.missingMatrix.length}): ${result.missingMatrix.join(", ")}`,
    );
  }
  if (result.missingTitle.length) {
    console.error(
      `  missing titles (${result.missingTitle.length}): ${result.missingTitle.join(", ")}`,
    );
  }
  if (result.duplicates.length) {
    console.error(
      `  duplicate matrix rows (${result.duplicates.length}): ${result.duplicates.join(", ")}`,
    );
  }
  if (result.unknown.length) {
    console.error(`  unknown criteria (${result.unknown.length}): ${result.unknown.join(", ")}`);
  }
  for (const error of result.errors) console.error(`  ${error}`);
  process.exit(1);
}

main();
