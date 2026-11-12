/** Options accepted by the release script. */
export interface ReleaseOptions {
  dryRun: boolean;
  bootstrap: boolean;
  skipGithubRelease: boolean;
  allowDirty: boolean;
  packs?: string;
}

/** Parses the release CLI flags. */
export declare function parseReleaseFlags(argv: string[]): ReleaseOptions;

/** Runs the release for a repository root. */
export declare function release(root: string, options: ReleaseOptions): void;
