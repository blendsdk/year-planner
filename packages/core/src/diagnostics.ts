import type { PlannerPeriod } from "./period.js";

/** A stable diagnostic emitted by the pure core. */
export type DiagnosticLevel = "error" | "warning" | "info";

const DIAGNOSTIC_CODES = [
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
] as const;

/** A stable diagnostic code. */
export type DiagnosticCode = (typeof DIAGNOSTIC_CODES)[number];

const DIAGNOSTIC_CODE_SET: ReadonlySet<string> = new Set(DIAGNOSTIC_CODES);

/** Returns true when a runtime value is a known diagnostic code. */
export function isDiagnosticCode(value: unknown): value is DiagnosticCode {
  return typeof value === "string" && DIAGNOSTIC_CODE_SET.has(value);
}

/** A typed diagnostic. */
export interface Diagnostic {
  code: DiagnosticCode;
  level: DiagnosticLevel;
  message: string;
  itemIds?: string[];
  resourceIds?: string[];
  periods?: PlannerPeriod[];
}

/** Builds a diagnostic with the default error level. */
export function diagnostic(
  code: DiagnosticCode,
  message: string,
  level: DiagnosticLevel = "error",
): Diagnostic {
  return { code, level, message };
}
