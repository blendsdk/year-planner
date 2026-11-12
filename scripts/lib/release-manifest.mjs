import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Shared release-manifest checks used by `release:check` and `release:publish`.
 *
 * The helpers are dependency-free and deliberately pure where possible so the
 * quality tests can exercise every rule with synthetic fixtures before the
 * build. File-system helpers are separate from the pure validators.
 */

/** Repository-relative paths that must exist in every published tarball. */
export const REQUIRED_TARBALL_PATHS = [
  "package/package.json",
  "package/README.md",
  "package/LICENSE",
  "package/CHANGELOG.md",
];

/**
 * Validates the file list of a packed tarball.
 *
 * Only the package manifest, README, LICENSE, CHANGELOG and `dist/**` are
 * allowed. Every required path must be present. Directory entries are ignored.
 *
 * @param paths - Paths printed by `tar -tzf`.
 * @returns Error messages; an empty array means the tarball is valid.
 * @example
 * validateTarballPaths(["package/package.json", "package/dist/index.js"])
 */
export function validateTarballPaths(paths) {
  const errors = [];
  const files = paths.filter((path) => !path.endsWith("/"));
  for (const required of REQUIRED_TARBALL_PATHS) {
    if (!files.includes(required)) errors.push(`missing required file ${required}`);
  }
  if (!files.some((path) => path.startsWith("package/dist/"))) {
    errors.push("missing dist/ files");
  }
  for (const path of files) {
    const segments = path.split("/");
    if (path.startsWith("/") || segments.includes("..")) {
      errors.push(`forbidden path ${path}`);
      continue;
    }
    if (path === "package/package.json") continue;
    if (path === "package/README.md") continue;
    if (path === "package/LICENSE") continue;
    if (path === "package/CHANGELOG.md") continue;
    if (path.startsWith("package/dist/")) continue;
    errors.push(`forbidden path ${path}`);
  }
  return errors;
}

/**
 * Validates a packed package manifest against the repository manifest.
 *
 * The packed version must match, and a package that depends on the core
 * package must pin the exact released core version rather than a range or the
 * workspace protocol.
 *
 * @param manifest - Parsed `package/package.json` from the tarball.
 * @param expected - Repository name, version and released core version.
 * @returns Error messages.
 * @example
 * validatePackedManifest({ name: "x", version: "1.0.0" }, { name: "x", version: "1.0.0", coreVersion: "1.0.0" })
 */
export function validatePackedManifest(manifest, expected) {
  const errors = [];
  if (manifest.name !== expected.name) {
    errors.push(`packed name ${manifest.name ?? "<missing>"} does not match ${expected.name}`);
  }
  if (manifest.version !== expected.version) {
    errors.push(
      `packed version ${manifest.version ?? "<missing>"} does not match manifest version ${expected.version}`,
    );
  }
  const dependency = manifest.dependencies?.["@blendsdk/year-planner-core"];
  if (dependency !== undefined && dependency !== expected.coreVersion) {
    errors.push(`@blendsdk/year-planner-core must be ${expected.coreVersion}, found ${dependency}`);
  }
  if (expected.name === "@blendsdk/react-year-planner" && dependency === undefined) {
    errors.push("React package is missing the core dependency");
  }
  return errors;
}

/**
 * Validates that a source map does not expose a private path.
 *
 * Relative `../src/...` sources are expected. Absolute paths, home-directory
 * paths, Windows drive paths and `file://` URLs are rejected.
 *
 * @param source - Raw `.map` file contents.
 * @param file - Map path used in error messages.
 * @returns Error messages.
 * @example
 * validateSourceMap('{"sources":["../src/index.ts"]}', "dist/index.js.map")
 */
export function validateSourceMap(source, file) {
  let parsed;
  try {
    parsed = JSON.parse(source);
  } catch {
    return [`${file} is not valid JSON`];
  }
  const sources = Array.isArray(parsed.sources) ? parsed.sources : [];
  const errors = [];
  for (const entry of sources) {
    if (typeof entry !== "string") continue;
    if (
      entry.startsWith("/") ||
      entry.startsWith("file://") ||
      /^[A-Za-z]:[\\/]/.test(entry) ||
      entry.includes("/home/") ||
      entry.includes("\\Users\\")
    ) {
      errors.push(`${file} exposes private source path ${entry}`);
    }
  }
  return errors;
}

/**
 * Returns the changelog section for one version.
 *
 * @param changelog - Full changelog markdown.
 * @param version - Version to extract.
 * @returns The section body, or an empty string when the heading is absent.
 * @example
 * changelogSection("## 0.2.0\n\n- fix", "0.2.0")
 */
export function changelogSection(changelog, version) {
  const escaped = version.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const heading = new RegExp(`^## ${escaped}\\s*$`, "m").exec(changelog);
  if (!heading) return "";
  const rest = changelog.slice(heading.index + heading[0].length).replace(/^\n/, "");
  const next = /^## /m.exec(rest);
  return (next ? rest.slice(0, next.index) : rest).trim();
}

/**
 * Builds the GitHub release body.
 *
 * @param input - Version, date, both changelog sections and the docs URL.
 * @returns Markdown release notes.
 * @example
 * buildReleaseNotes({ version: "0.2.1", date: "2026-11-12", coreChangelog: "", reactChangelog: "", docsUrl: "https://example.com" })
 */
export function buildReleaseNotes(input) {
  const core = changelogSection(input.coreChangelog, input.version) || "_No core changes._";
  const react = changelogSection(input.reactChangelog, input.version) || "_No React changes._";
  return [
    `# ${input.version}`,
    "",
    `Released ${input.date}.`,
    "",
    "## Packages",
    "",
    "- [@blendsdk/year-planner-core](https://www.npmjs.com/package/@blendsdk/year-planner-core)",
    "- [@blendsdk/react-year-planner](https://www.npmjs.com/package/@blendsdk/react-year-planner)",
    `- [Documentation](${input.docsUrl})`,
    "",
    "## Core",
    "",
    core,
    "",
    "## React",
    "",
    react,
    "",
  ].join("\n");
}

/**
 * Compares a published integrity with the locally packed tarball.
 *
 * @param published - Integrity reported by `npm view`, if the version exists.
 * @param local - SRI integrity of the local tarball.
 * @param label - Package name and version for the error message.
 * @returns Error messages; an empty array means the content matches or is new.
 * @example
 * validatePublishedIntegrity(undefined, "sha512-abc", "pkg@1.0.0")
 */
export function validatePublishedIntegrity(published, local, label) {
  if (published === undefined) return [];
  if (published !== local) {
    return [`${label} is already published with a different integrity; bump the version`];
  }
  return [];
}

/**
 * Reads both package manifests from a repository root.
 *
 * @param root - Repository root.
 * @returns The parsed core and React manifests.
 * @example
 * readPackageManifests("/repo")
 */
export function readPackageManifests(root) {
  return {
    core: JSON.parse(readFileSync(join(root, "packages/core/package.json"), "utf8")),
    react: JSON.parse(readFileSync(join(root, "packages/react/package.json"), "utf8")),
  };
}

/**
 * Lists pending changeset markdown files.
 *
 * A release must be cut from a version commit that already consumed every
 * changeset; a leftover file would make the next version bump wrong.
 *
 * @param root - Repository root.
 * @returns Pending changeset file names, sorted.
 * @example
 * pendingChangesets("/repo") // []
 */
export function pendingChangesets(root) {
  const directory = join(root, ".changeset");
  if (!existsSync(directory)) return [];
  return readdirSync(directory)
    .filter((name) => name.endsWith(".md"))
    .sort();
}

/**
 * Validates that both packages share one version and have changelog headings.
 *
 * @param manifests - Result of `readPackageManifests`.
 * @returns Error messages.
 * @example
 * validateVersions(readPackageManifests("/repo"))
 */
export function validateVersions(manifests) {
  const errors = [];
  if (manifests.core.version !== manifests.react.version) {
    errors.push(
      `version mismatch: core ${manifests.core.version}, react ${manifests.react.version}`,
    );
  }
  return errors;
}

/**
 * Reads the paths and manifest from a packed tarball.
 *
 * @param tarball - Absolute or relative tarball path.
 * @returns Paths, packed manifest and validation errors.
 * @example
 * inspectTarball("release-packs/blendsdk-react-year-planner-0.2.0.tgz")
 */
export function inspectTarball(tarball) {
  const paths = execFileSync("tar", ["-tzf", tarball], { encoding: "utf8" })
    .split("\n")
    .filter(Boolean);
  const manifest = JSON.parse(
    execFileSync("tar", ["-xOzf", tarball, "package/package.json"], { encoding: "utf8" }),
  );
  return { paths, manifest, errors: validateTarballPaths(paths) };
}

/**
 * Validates source maps from inside a packed tarball.
 *
 * This covers the bytes that will be published even when no build directory
 * exists, such as the credential-free publish job.
 *
 * @param tarball - Packed tarball path.
 * @returns Error messages.
 * @example
 * inspectTarballSourceMaps("release-packs/pkg-0.2.0.tgz")
 */
export function inspectTarballSourceMaps(tarball) {
  const paths = execFileSync("tar", ["-tzf", tarball], { encoding: "utf8" })
    .split("\n")
    .filter((path) => path.startsWith("package/dist/") && path.endsWith(".map"));
  const errors = [];
  for (const path of paths) {
    const source = execFileSync("tar", ["-xOzf", tarball, path], { encoding: "utf8" });
    errors.push(...validateSourceMap(source, path));
  }
  return errors;
}

/**
 * Recursively validates every source map under a directory.
 *
 * @param directory - Directory to scan.
 * @returns Error messages.
 * @example
 * inspectSourceMaps("packages/react/dist")
 */
export function inspectSourceMaps(directory) {
  if (!existsSync(directory)) return [`${directory} does not exist`];
  const errors = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      errors.push(...inspectSourceMaps(path));
    } else if (entry.name.endsWith(".map")) {
      errors.push(...validateSourceMap(readFileSync(path, "utf8"), path));
    }
  }
  return errors;
}
