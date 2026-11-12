/** A package manifest subset used by the release checks. */
export interface ReleaseManifest {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
}

/** Input for `buildReleaseNotes`. */
export interface ReleaseNotesInput {
  version: string;
  date: string;
  coreChangelog: string;
  reactChangelog: string;
  docsUrl: string;
}

/** Result of reading a packed tarball. */
export interface TarballInspection {
  paths: string[];
  manifest: ReleaseManifest;
  errors: string[];
}

/** Repository-relative paths that must exist in every published tarball. */
export declare const REQUIRED_TARBALL_PATHS: readonly string[];

/** Validates the file list of a packed tarball. */
export declare function validateTarballPaths(paths: string[]): string[];

/** Validates a packed manifest against the repository manifest. */
export declare function validatePackedManifest(
  manifest: ReleaseManifest,
  expected: { name: string; version: string; coreVersion: string },
): string[];

/** Validates that a source map does not expose a private path. */
export declare function validateSourceMap(source: string, file: string): string[];

/** Returns the changelog section for one version. */
export declare function changelogSection(changelog: string, version: string): string;

/** Builds the GitHub release body. */
export declare function buildReleaseNotes(input: ReleaseNotesInput): string;

/** Reads both package manifests from a repository root. */
export declare function readPackageManifests(root: string): {
  core: ReleaseManifest;
  react: ReleaseManifest;
};

/** Validates that both packages share one version. */
export declare function validateVersions(manifests: {
  core: ReleaseManifest;
  react: ReleaseManifest;
}): string[];

/** Reads the paths and manifest from a packed tarball. */
export declare function inspectTarball(tarball: string): TarballInspection;

/** Recursively validates every source map under a directory. */
export declare function inspectSourceMaps(directory: string): string[];
