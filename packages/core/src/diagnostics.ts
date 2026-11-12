import type { PlannerPeriod } from "./period.js";

/**
 * A stable diagnostic emitted by the pure core.
 * @public
 */
export type DiagnosticLevel = "error" | "warning" | "info";

/**
 * A stable diagnostic code.
 * @public
 */
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
  | "MISSING_RANGE"
  | "DUPLICATE_ID"
  | "UNKNOWN_REFERENCE"
  | "GROUP_CYCLE"
  | "INVALID_GROUP"
  | "INVALID_ITEM"
  | "INVALID_VERSION"
  | "INVALID_ANNOTATION"
  | "INVALID_STYLE"
  | "INVALID_LAYER"
  | "INVALID_RESOURCE"
  | "NOT_EDITABLE"
  | "INVALID_PAINT_TARGET"
  | "INVALID_PAINT_CHANNEL"
  | "STALE_VERSION"
  | "INVALID_PRINT_OPTIONS"
  | "PRINT_FIT_TOO_SMALL"
  | "READ_ONLY"
  | "CONFIRMATION_UNAVAILABLE"
  | "COMMAND_TIMEOUT"
  | "COMMAND_ABORTED"
  | "ACCEPTED_NOT_APPLIED"
  | "CAPACITY_EXCEEDED"
  | "HOST_REJECTED"
  | "VALIDATION_ERROR"
  | "STALE_REVISION"
  | "UNDO_UNAVAILABLE"
  | "INVALID_COMMAND"
  | "INVALID_LOCALE"
  | "TIMED_EDITING_UNSUPPORTED"
  | "INVALID_RENDERER_OPTION";

const DIAGNOSTIC_CODES: readonly DiagnosticCode[] = [
  "INVALID_DATE",
  "UNSUPPORTED_YEAR",
  "INVALID_RANGE",
  "INVALID_INSTANT",
  "INVALID_TIMEZONE",
  "TIMED_PROJECTION_FAILED",
  "INVALID_MONTH",
  "INVALID_MONTH_COUNT",
  "INVALID_CONTEXT_MONTHS",
  "UNSUPPORTED_VIEW_YEAR",
  "MISSING_RANGE",
  "DUPLICATE_ID",
  "UNKNOWN_REFERENCE",
  "GROUP_CYCLE",
  "INVALID_GROUP",
  "INVALID_ITEM",
  "INVALID_VERSION",
  "INVALID_ANNOTATION",
  "INVALID_STYLE",
  "INVALID_LAYER",
  "INVALID_RESOURCE",
  "NOT_EDITABLE",
  "INVALID_PAINT_TARGET",
  "INVALID_PAINT_CHANNEL",
  "STALE_VERSION",
  "INVALID_PRINT_OPTIONS",
  "PRINT_FIT_TOO_SMALL",
  "READ_ONLY",
  "CONFIRMATION_UNAVAILABLE",
  "COMMAND_TIMEOUT",
  "COMMAND_ABORTED",
  "ACCEPTED_NOT_APPLIED",
  "CAPACITY_EXCEEDED",
  "HOST_REJECTED",
  "VALIDATION_ERROR",
  "STALE_REVISION",
  "UNDO_UNAVAILABLE",
  "INVALID_COMMAND",
  "INVALID_LOCALE",
  "TIMED_EDITING_UNSUPPORTED",
  "INVALID_RENDERER_OPTION",
];

const DIAGNOSTIC_CODE_SET: ReadonlySet<string> = new Set(DIAGNOSTIC_CODES);

/**
 * Returns true when a runtime value is a known diagnostic code.
 * @public
 */
export function isDiagnosticCode(value: unknown): value is DiagnosticCode {
  return typeof value === "string" && DIAGNOSTIC_CODE_SET.has(value);
}

/**
 * A typed diagnostic.
 * @public
 */
export interface Diagnostic {
  /** Stable diagnostic code used for programmatic handling. */
  code: DiagnosticCode;
  /** Severity used by the inspector and host diagnostics. */
  level: DiagnosticLevel;
  /** Human-readable message shown to end users. */
  message: string;
  /** Item IDs the diagnostic refers to, when known. */
  itemIds?: string[];
  /** Resource IDs the diagnostic refers to, when known. */
  resourceIds?: string[];
  /** Periods the diagnostic refers to, when known. */
  periods?: PlannerPeriod[];
}

/**
 * Builds a diagnostic with the default error level.
 *
 * @param code - Stable diagnostic code.
 * @param message - Human-readable message shown to end users.
 * @param level - Severity used by the inspector and host diagnostics.
 * @public
 */
export function diagnostic(
  code: DiagnosticCode,
  message: string,
  level: DiagnosticLevel = "error",
): Diagnostic {
  return { code, level, message };
}
