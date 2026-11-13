/** Browser project order used in every emitted argument list. */
export const PROJECT_ORDER: readonly string[];

/** One spec file on one Playwright project. */
export interface BrowserUnit {
  group: string;
  spec: string;
  project: string;
  seconds: number;
  poppler: boolean;
  workers?: number | null;
}

/** One independently schedulable browser job. */
export interface BrowserShard {
  name: string;
  installs: string[];
  poppler: boolean;
  workers: number;
  units: BrowserUnit[];
  seconds: number;
}

/** A map group enriched with browser runtime facts. */
export interface BrowserGroupEntry {
  id: string;
  group: {
    id: string;
    sources?: string[];
    tests?: string[];
    durationSec?: number;
  };
  projects: string[];
  durationSec: number;
  workers: number | null;
  workersByProject: Record<string, number>;
  poppler: boolean;
}

/** Test count keyed by `spec\u0000project`. */
export type DiscoveryMap = Map<string, number>;

/** Aggregated unit result keyed by `spec\u0000project`. */
export type ResultMap = Map<string, { passed: boolean; durationMs: number }>;

/** Sorts browser project names into the canonical order. */
export declare function sortProjects(projects: Iterable<string>): string[];

/** Reads the browser groups that exist in both the test map and the plan file. */
export declare function browserGroups(
  map: { groups?: Array<Record<string, unknown>> } | null,
  config: { groups?: Record<string, unknown> } | null,
): BrowserGroupEntry[];

/** Resolves the browser group IDs selected for one run. */
export declare function resolveGroupIds(
  map: { groups?: Array<Record<string, unknown>> } | null,
  config: { groups?: Record<string, unknown> } | null,
  selection:
    | {
        mode?: string;
        selected?: Array<{ id: string }>;
        deferred?: Array<{ id: string }>;
      }
    | null
    | undefined,
): string[];

/** Selects browser groups from the changed paths using the test map rules. */
export declare function selectBrowserGroups(input: {
  map: {
    groups?: Array<Record<string, unknown>>;
    policy?: {
      fullOnPaths?: string[];
      ignorePaths?: Array<{ glob: string }>;
      prSmoke?: string[];
    };
  } | null;
  config: { groups?: Record<string, unknown> } | null;
  changed: string[];
  gate?: string;
}): { mode: "full" | "groups" | "none"; groupIds: string[]; reason: string | null };

/** Builds the smallest schedulable browser units. */
export declare function buildUnits(input: {
  map: { groups?: Array<Record<string, unknown>> } | null;
  config: { groups?: Record<string, unknown> } | null;
  groupIds: string[];
  discovery?: DiscoveryMap | null;
}): BrowserUnit[];

/** Packs units into balanced shards. */
export declare function packShards(input: {
  units: BrowserUnit[];
  config: {
    chromiumShards?: number;
    defaultWorkers?: number;
    browserInstall?: Record<string, string[]>;
  } | null;
  chromiumShards?: number;
  workers?: number;
}): BrowserShard[];

/** Converts shards into stable Playwright arguments. */
export declare function shardArguments(shard: BrowserShard): string[];

/** Builds the GitHub Actions matrix for a shard list. */
export declare function toMatrix(shards: BrowserShard[]): {
  include: Array<{
    name: string;
    install: string;
    poppler: boolean;
    workers: number;
    args: string[];
  }>;
};

/** Extracts test counts per spec and project from a Playwright JSON report. */
export declare function parseDiscovery(report: unknown): DiscoveryMap;

/** Normalises a Playwright report file path to a repository-relative path. */
export declare function normaliseSpecFile(file: string | undefined): string;

/** Aggregates one Playwright JSON report into pass/fail results per unit. */
export declare function parseResults(report: unknown): ResultMap;
