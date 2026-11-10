import type { PlannerPeriod } from "./period.js";

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
  | "HOST_REJECTED"
  | "VALIDATION_ERROR"
  | "STALE_REVISION"
  | "UNDO_UNAVAILABLE"
  | "INVALID_COMMAND"
  | "INVALID_LOCALE"
  | "TIMED_EDITING_UNSUPPORTED"
  | "INVALID_RENDERER_OPTION";

export interface Diagnostic {
  code: DiagnosticCode;
  level: DiagnosticLevel;
  message: string;
  itemIds?: string[];
  resourceIds?: string[];
  periods?: PlannerPeriod[];
}

export function diagnostic(
  code: DiagnosticCode,
  message: string,
  level: DiagnosticLevel = "error",
): Diagnostic {
  return { code, level, message };
}
