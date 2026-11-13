#!/usr/bin/env node
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Fails when any workspace version differs from the published packages.
 *
 * The repository ships three public packages in lockstep and keeps the private
 * apps and the root manifest on the same version. This check is the cheap guard
 * for that invariant; `pnpm version-packages` uses Lockstep to restore it.
 */
const root = process.cwd();
const groups = ["packages", "apps", "spike"];

function readManifest(directory) {
  return JSON.parse(readFileSync(join(directory, "package.json"), "utf8"));
}

const manifests = [];
for (const group of groups) {
  for (const entry of readdirSync(join(root, group), { withFileTypes: true })) {
    if (entry.isDirectory()) {
      manifests.push({
        path: `${group}/${entry.name}`,
        ...readManifest(join(root, group, entry.name)),
      });
    }
  }
}
manifests.push({ path: ".", ...readManifest(root) });

const published = manifests.filter((manifest) => manifest.private !== true);
if (published.length === 0) {
  console.error("No public packages found");
  process.exit(1);
}

const target = published[0].version;
const drift = manifests.filter((manifest) => manifest.version !== target);
for (const manifest of manifests) {
  const marker = manifest.version === target ? "ok" : "DRIFT";
  console.log(
    `${marker.padEnd(6)} ${manifest.name.padEnd(42)} ${manifest.version} ${manifest.path}`,
  );
}

if (drift.length > 0) {
  console.error(
    `\nWorkspace versions must match ${target}. Run \`pnpm version-packages\` to restore lockstep.`,
  );
  process.exit(1);
}
console.log(`\nAll ${manifests.length} workspaces are at ${target}.`);
