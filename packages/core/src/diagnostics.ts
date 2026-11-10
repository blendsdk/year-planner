/** A stable diagnostic emitted by the pure core. */
export type DiagnosticLevel = "error" | "warning" | "info";

export type DiagnosticCode =
  | "INVALID_DATE"
  | "UNSUPPORTED_YEAR"
  | "INVALID_RANGE"
  | "INVALID_INSTANT"
  | "INVALID_TIMEZONE"
  | "TIMED_PROJECTION_FAILED"
  | "INVALID_MONTH"
  | "INVALID_MONTH_COUNT"
  | "INVALID_CONTEXT_MONTHS"
  | "UNSUPPORTED_VIEW_YEAR"
  | "MISSING_RANGE";

export interface Diagnostic {
  code: DiagnosticCode;
  level: DiagnosticLevel;
  message: string;
  itemIds?: string[];
  resourceIds?: string[];
  periods?: unknown[];
}

export function diagnostic(
  code: DiagnosticCode,
  message: string,
  level: DiagnosticLevel = "error",
): Diagnostic {
  return { code, level, message };
}
