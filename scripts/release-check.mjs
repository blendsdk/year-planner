#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  changelogSection,
  inspectSourceMaps,
  inspectTarball,
  inspectTarballSourceMaps,
  readPackageManifests,
  validatePackedManifest,
  validateTarballPaths,
  validateVersions,
} from "./lib/release-manifest.mjs";

/**
 * Release readiness gate.
 *
 * Validates the checked-in versions and changelogs, packs both packages into
 * `release-packs/`, inspects the tarballs and source maps, and compares the
 * npm dry-run file list with the same allowlist. It never publishes.
 */

/** Runs one command and returns stdout. */
function capture(command, args, cwd) {
  return execFileSync(command, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

/** Packs both packages into release-packs/. */
function pack(root, manifests) {
  const destination = join(root, "release-packs");
  mkdirSync(destination, { recursive: true });
  for (const name of [manifests.core.name, manifests.react.name]) {
    capture("pnpm", ["--filter", name, "pack", "--pack-destination", destination], root);
  }
  return {
    core: join(destination, `blendsdk-year-planner-core-${manifests.core.version}.tgz`),
    react: join(destination, `blendsdk-react-year-planner-${manifests.react.version}.tgz`),
  };
}

/** Returns the npm dry-run file list, prefixed with package/. */
function npmDryRunPaths(root, directory) {
  const output = capture(
    "npm",
    ["pack", "--dry-run", "--json", "--ignore-scripts"],
    join(root, directory),
  );
  const parsed = JSON.parse(output);
  const files = parsed[0]?.files ?? [];
  return files.map((entry) => `package/${entry.path}`);
}

/**
 * Runs the release readiness check.
 *
 * @param root - Repository root.
 * @returns Error messages; an empty array means the release is ready.
 * @example
 * checkRelease(process.cwd())
 */
export function checkRelease(root) {
  const manifests = readPackageManifests(root);
  const errors = validateVersions(manifests);
  for (const [key, path] of [
    ["core", "packages/core/CHANGELOG.md"],
    ["react", "packages/react/CHANGELOG.md"],
  ]) {
    if (!changelogSection(readFileSync(join(root, path), "utf8"), manifests[key].version)) {
      errors.push(`${path} has no ## ${manifests[key].version} section`);
    }
  }
  for (const directory of ["packages/core/dist", "packages/react/dist"]) {
    if (!existsSync(join(root, directory))) errors.push(`${directory} is missing; run pnpm build`);
  }
  if (errors.length > 0) return errors;

  const tarballs = pack(root, manifests);
  for (const [key, tarball] of Object.entries(tarballs)) {
    if (!existsSync(tarball)) {
      errors.push(`missing tarball ${tarball}`);
      continue;
    }
    const inspection = inspectTarball(tarball);
    errors.push(...inspection.errors);
    errors.push(...inspectTarballSourceMaps(tarball));
    errors.push(
      ...validatePackedManifest(inspection.manifest, {
        name: manifests[key].name,
        version: manifests[key].version,
        coreVersion: manifests.core.version,
      }),
    );
  }
  errors.push(...inspectSourceMaps(join(root, "packages/core/dist")));
  errors.push(...inspectSourceMaps(join(root, "packages/react/dist")));
  for (const [directory, key] of [
    ["packages/core", "core"],
    ["packages/react", "react"],
  ]) {
    for (const error of validateTarballPaths(npmDryRunPaths(root, directory))) {
      errors.push(`npm pack --dry-run in ${directory}: ${error}`);
    }
    if (!existsSync(join(root, directory, "README.md"))) {
      errors.push(`${directory}/README.md is missing`);
    }
    if (!existsSync(join(root, directory, "LICENSE"))) {
      errors.push(`${directory}/LICENSE is missing`);
    }
    if (!existsSync(join(root, directory, "CHANGELOG.md"))) {
      errors.push(`${directory}/CHANGELOG.md is missing`);
    }
    console.log(`${manifests[key].name}@${manifests[key].version}: checked`);
  }
  return errors;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const errors = checkRelease(process.cwd());
    if (errors.length > 0) {
      for (const error of errors) console.error(`release:check: ${error}`);
      process.exitCode = 1;
    } else {
      console.log("release:check passed: versions, changelogs, tarballs and source maps");
    }
  } catch (error) {
    console.error(`release:check: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
