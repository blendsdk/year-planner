#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  buildReleaseNotes,
  changelogSection,
  inspectSourceMaps,
  inspectTarball,
  pendingChangesets,
  readPackageManifests,
  validatePackedManifest,
  validatePublishedIntegrity,
  validateVersions,
} from "./lib/release-manifest.mjs";

/**
 * Packs, validates and publishes the two packages, then creates the GitHub
 * release.
 *
 * The normal mode requires a clean tracked tree and publishes core before
 * React with npm provenance. `--dry-run` proves the same path without
 * uploading. `--bootstrap` is the one-time first-package creation without
 * provenance. `--packs` consumes tarballs built by a credential-free job.
 */

const DOCS_URL = "https://blendsdk.github.io/year-planner/";

/**
 * Parses the command-line flags.
 *
 * @param argv - Arguments after the script name.
 * @returns The parsed options.
 * @throws When an option is unknown or a flag is used in an unsafe combination.
 * @example
 * parseReleaseFlags(["--dry-run", "--allow-dirty"])
 */
export function parseReleaseFlags(argv) {
  const options = {
    dryRun: false,
    bootstrap: false,
    skipGithubRelease: false,
    allowDirty: false,
    packs: undefined,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--dry-run") options.dryRun = true;
    else if (token === "--bootstrap") options.bootstrap = true;
    else if (token === "--skip-github-release") options.skipGithubRelease = true;
    else if (token === "--allow-dirty") options.allowDirty = true;
    else if (token === "--packs") {
      const value = argv[index + 1];
      if (!value) throw new Error("--packs needs a directory");
      options.packs = value;
      index += 1;
    } else {
      throw new Error(`unknown option: ${token}`);
    }
  }
  if (options.allowDirty && !options.dryRun) {
    throw new Error("--allow-dirty is only valid with --dry-run");
  }
  if (options.skipGithubRelease && !options.bootstrap) {
    throw new Error("--skip-github-release is only valid with --bootstrap");
  }
  if (options.bootstrap && options.dryRun) {
    throw new Error("--bootstrap and --dry-run cannot be combined");
  }
  return options;
}

/** Runs one command and inherits stdout/stderr. */
function run(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: options.cwd ?? process.cwd(),
    stdio: options.capture ? ["ignore", "pipe", "pipe"] : "inherit",
    encoding: "utf8",
  });
}

/** Returns the current commit. */
function headCommit() {
  return run("git", ["rev-parse", "HEAD"], { capture: true }).trim();
}

/** Refuses a dirty tracked tree. */
function requireCleanTree(options) {
  const status = run("git", ["status", "--porcelain", "--untracked-files=no"], {
    capture: true,
  }).trim();
  if (status && !options.allowDirty) {
    throw new Error(`working tree has tracked changes:\n${status}`);
  }
}

/** Returns the SRI integrity of a local tarball. */
function localIntegrity(tarball) {
  return `sha512-${createHash("sha512").update(readFileSync(tarball)).digest("base64")}`;
}

/** Returns the published integrity, or undefined when the version is absent. */
function publishedIntegrity(name, version) {
  try {
    return run("npm", ["view", `${name}@${version}`, "dist.integrity"], { capture: true }).trim();
  } catch {
    return undefined;
  }
}

/** Packs both packages into the requested directory. */
function packPackages(root, destination) {
  const directory = join(root, destination);
  mkdirSync(directory, { recursive: true });
  for (const name of ["@blendsdk/year-planner-core", "@blendsdk/react-year-planner"]) {
    run("pnpm", ["--filter", name, "pack", "--pack-destination", directory], { cwd: root });
  }
  return {
    core: join(directory, `blendsdk-year-planner-core-${readVersion(root, "core")}.tgz`),
    react: join(directory, `blendsdk-react-year-planner-${readVersion(root, "react")}.tgz`),
  };
}

/** Reads one package version. */
function readVersion(root, key) {
  return readPackageManifests(root)[key].version;
}

/** Validates the changelog headings and versions. */
function validateRelease(root, manifests) {
  const errors = validateVersions(manifests);
  for (const [key, path] of [
    ["core", "packages/core/CHANGELOG.md"],
    ["react", "packages/react/CHANGELOG.md"],
  ]) {
    const changelog = readFileSync(join(root, path), "utf8");
    if (!changelogSection(changelog, manifests[key].version)) {
      errors.push(`${path} has no ## ${manifests[key].version} section`);
    }
  }
  if (errors.length > 0) throw new Error(errors.join("\n"));
}

/** Inspects and validates both tarballs. */
function inspectRelease(tarballs, manifests) {
  const errors = [];
  for (const [key, tarball] of Object.entries(tarballs)) {
    if (!existsSync(tarball)) {
      errors.push(`missing tarball ${tarball}`);
      continue;
    }
    const inspection = inspectTarball(tarball);
    errors.push(...inspection.errors);
    errors.push(
      ...validatePackedManifest(inspection.manifest, {
        name: manifests[key].name,
        version: manifests[key].version,
        coreVersion: manifests.core.version,
      }),
    );
  }
  return errors;
}

/** Publishes one tarball unless the identical version already exists. */
function publishTarball(tarball, name, version, options) {
  const integrity = publishedIntegrity(name, version);
  if (integrity !== undefined) {
    const errors = validatePublishedIntegrity(
      integrity,
      localIntegrity(tarball),
      `${name}@${version}`,
    );
    if (errors.length > 0) throw new Error(errors.join("\n"));
    console.log(`skip ${name}@${version}: already published with identical content`);
    return false;
  }
  const args = ["publish", tarball, "--access", "public", "--tag", "latest"];
  if (options.bootstrap) {
    console.log(`bootstrap ${name}@${version}: publishing without provenance`);
  } else {
    args.push("--provenance");
  }
  if (options.dryRun) {
    args.push("--dry-run");
    console.log(`[dry-run] npm ${args.join(" ")}`);
    run("npm", args);
    return false;
  }
  run("npm", args);
  console.log(`published ${name}@${version}`);
  return true;
}

/** Creates or updates the single v<version> GitHub release. */
function publishGithubRelease(root, version, options) {
  if (options.dryRun || options.skipGithubRelease) {
    console.log("[dry-run] GitHub release skipped");
    return;
  }
  const notes = buildReleaseNotes({
    version,
    date: new Date().toISOString().slice(0, 10),
    coreChangelog: readFileSync(join(root, "packages/core/CHANGELOG.md"), "utf8"),
    reactChangelog: readFileSync(join(root, "packages/react/CHANGELOG.md"), "utf8"),
    docsUrl: DOCS_URL,
  });
  const notesFile = join(root, "release-packs", `release-notes-${version}.md`);
  mkdirSync(join(root, "release-packs"), { recursive: true });
  writeFileSync(notesFile, notes);
  const tag = `v${version}`;
  let exists = true;
  try {
    run("gh", ["release", "view", tag], { capture: true });
  } catch {
    exists = false;
  }
  if (exists) {
    const repo = run("gh", ["repo", "view", "--json", "nameWithOwner", "--jq", ".nameWithOwner"], {
      capture: true,
    }).trim();
    const tagCommit = run("gh", ["api", `repos/${repo}/commits/${tag}`, "--jq", ".sha"], {
      capture: true,
    }).trim();
    if (tagCommit !== headCommit()) {
      throw new Error(`release ${tag} points at ${tagCommit}, not HEAD ${headCommit()}`);
    }
    run("gh", ["release", "edit", tag, "--notes-file", notesFile]);
    console.log(`updated GitHub release ${tag}`);
  } else {
    run("gh", ["release", "create", tag, "--title", tag, "--notes-file", notesFile]);
    console.log(`created GitHub release ${tag}`);
  }
}

/** Runs the release. */
export function release(root, options) {
  requireCleanTree(options);
  const manifests = readPackageManifests(root);
  const changesets = pendingChangesets(root);
  if (changesets.length > 0) {
    throw new Error(`pending changesets: ${changesets.join(", ")}; run pnpm version-packages`);
  }
  validateRelease(root, manifests);
  let tarballs = options.packs
    ? {
        core: join(options.packs, `blendsdk-year-planner-core-${manifests.core.version}.tgz`),
        react: join(options.packs, `blendsdk-react-year-planner-${manifests.react.version}.tgz`),
      }
    : undefined;
  if (!tarballs) {
    run("pnpm", ["build"], { cwd: root });
    tarballs = packPackages(root, "release-packs");
  }
  const errors = inspectRelease(tarballs, manifests);
  errors.push(...inspectSourceMaps(join(root, "packages/core/dist")));
  errors.push(...inspectSourceMaps(join(root, "packages/react/dist")));
  if (errors.length > 0) throw new Error(errors.join("\n"));

  const published = [];
  if (publishTarball(tarballs.core, manifests.core.name, manifests.core.version, options)) {
    published.push(manifests.core.name);
  }
  if (publishTarball(tarballs.react, manifests.react.name, manifests.react.version, options)) {
    published.push(manifests.react.name);
  }
  publishGithubRelease(root, manifests.core.version, options);
  if (options.dryRun) {
    console.log(`release ${manifests.core.version}: dry-run validated core and React`);
  } else {
    console.log(
      `release ${manifests.core.version}: ${published.length > 0 ? published.join(", ") : "nothing to publish"}`,
    );
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    release(process.cwd(), parseReleaseFlags(process.argv.slice(2)));
  } catch (error) {
    console.error(`release: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
