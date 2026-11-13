/** One ledger record. */
export interface LedgerEntry {
  fingerprint: string;
  status: "passed";
  durationMs: number;
  group: string;
  spec: string;
  project: string;
  recordedAt: string;
}

/** The ledger file shape. */
export interface BrowserLedger {
  schema: number;
  entries: Record<string, LedgerEntry>;
}

/** Computes the SHA-256 of a string. */
export declare function sha256Text(text: string): string;

/** Computes the SHA-256 of one file, or `missing` when it cannot be read. */
export declare function sha256File(path: string): string;

/** Serialises a value with sorted object keys. */
export declare function canonicalJson(value: unknown): string;

/** Collects a spec file, its relative helper imports and its snapshots. */
export declare function collectSpecInputs(root: string, spec: string): string[];

/** Reads the runtime facts that make a browser result reproducible. */
export declare function collectEnvironment(
  root: string,
  configFile: string,
): Record<string, string>;

/** Computes the fingerprint for one browser unit. */
export declare function fingerprintUnit(input: {
  root: string;
  unit: { group: string; spec: string; project: string };
  sourcePatterns: string[];
  mapHash: string;
  environment: Record<string, string>;
  cache?: Map<string, string>;
}): { fingerprint: string; files: Record<string, string> };

/** Returns the stable ledger key for one unit. */
export declare function unitKey(unit: { group: string; spec: string; project: string }): string;

/** Reads the ledger, returning an empty ledger for a missing or corrupt file. */
export declare function readLedger(file: string): BrowserLedger;

/** Writes the ledger, creating its directory. */
export declare function writeLedger(file: string, ledger: BrowserLedger): void;

/** Reports whether a unit has a passing entry for its current fingerprint. */
export declare function isCached(
  ledger: BrowserLedger,
  unit: { group: string; spec: string; project: string },
  fingerprint: string,
): boolean;

/** Records a passing unit. */
export declare function recordPass(
  ledger: BrowserLedger,
  unit: { group: string; spec: string; project: string },
  fingerprint: string,
  durationMs: number,
): void;

/** Removes a unit from the cache after a failure. */
export declare function recordFailure(
  ledger: BrowserLedger,
  unit: { group: string; spec: string; project: string },
): void;

/** Summarises a ledger for status output. */
export declare function ledgerSummary(ledger: BrowserLedger): {
  total: number;
  passed: number;
  oldest: string | null;
};
