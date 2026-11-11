/** Parsed acceptance criteria for one requirements document. */
export interface ParsedAcceptanceCriteria {
  rd: string;
  numbers: number[];
  error?: string;
}

/** One row of the canonical acceptance-criteria matrix. */
export interface MatrixRow {
  id: string;
  rd: string;
  ac: string;
  status: string;
  file: string;
  title: string;
  evidence: string;
  raw: string;
}

/** Parsed matrix rows plus any structural errors found while reading them. */
export interface ParsedMatrix {
  rows: MatrixRow[];
  errors: string[];
}

/** In-memory repository used to exercise the checker without disk access. */
export interface TraceabilityFixture {
  rds: Record<string, string>;
  matrix: string;
  tests: Record<string, string>;
}

/** Complete result of one traceability run. */
export interface TraceabilityResult {
  ok: boolean;
  expected: string[];
  missingMatrix: string[];
  missingTitle: string[];
  duplicates: string[];
  unknown: string[];
  errors: string[];
}

/** Reads one RD document and returns its acceptance-criterion numbers. */
export function parseAcceptanceCriteria(source: string, file: string): ParsedAcceptanceCriteria;

/** Parses the canonical acceptance-criteria table. */
export function parseMatrixRows(source: string): ParsedMatrix;

/** Returns the acceptance-criterion identifiers declared by the matrix. */
export function parseMatrixIds(source: string): Set<string>;

/** Returns every acceptance-criterion identifier named in a real test title. */
export function parseTitleIds(source: string): Set<string>;

/** Runs the full traceability check. */
export function checkTraceability(
  root: string,
  options?: { through?: number; fixture?: TraceabilityFixture },
): TraceabilityResult;
