import type { DateKey } from "./date.js";
import type { Diagnostic } from "./diagnostics.js";
import type { PaintDefaults } from "./model/paint.js";
import type { PlannerItem } from "./model/types.js";
import type { PlannerPeriod } from "./period.js";

/** A date range selected by the host or interaction layer. */
export interface SelectionDateRange {
  /** First selected date. */
  startDate: DateKey;
  /** First date after the selected range. */
  endDateExclusive: DateKey;
}

/**
 * Canonical selection state shared by the React view and the interaction
 * layer. Date ranges and item IDs may be selected together.
 */
export interface PlannerSelection {
  /** Selected date ranges. */
  dates: SelectionDateRange[];
  /** Selected item IDs. */
  items: string[];
  /** Anchor date for Shift extension. */
  anchorDate?: DateKey;
  /** Focused date. */
  focusDate?: DateKey;
  /** Anchor item for Shift item ranges. */
  anchorItemId?: string;
  /** Focused item for keyboard and item-range transitions. */
  focusItemId?: string;
}

/** Host-side result of validating a proposed command. */
export interface ValidationResult {
  /** False blocks the command. */
  permitted: boolean;
  /** Diagnostics to display. */
  diagnostics: Diagnostic[];
}

/** Context passed with every command request. */
export interface CommandContext {
  /** Unique request identity; used to ignore stale responses. */
  requestId: string;
  /** Optional host-wide revision token. */
  baseRevision?: string;
}

/** The canonical command union used by the view and command pipeline. */
export type PlannerCommand =
  | { type: "create"; item: PlannerItem }
  | {
      type: "update";
      itemId: string;
      patch: Partial<Omit<PlannerItem, "id" | "version">>;
      expectedVersion: number;
    }
  | {
      type: "move";
      itemId: string;
      proposedPeriod: PlannerPeriod;
      expectedVersion: number;
    }
  | {
      type: "resize";
      itemId: string;
      proposedPeriod: PlannerPeriod;
      expectedVersion: number;
    }
  | { type: "delete"; itemId: string; expectedVersion: number }
  | {
      type: "paint";
      layerId: string;
      period: PlannerPeriod;
      operation: "union" | "subtract";
      defaults: PaintDefaults;
      expectedVersions: Record<string, number>;
    };

/** The authoritative host response to a command request. */
export type CommandOutcome =
  | {
      accepted: true;
      revision: string;
      updatedItems?: PlannerItem[];
      removedItemIds?: string[];
    }
  | {
      accepted: false;
      diagnostics: Diagnostic[];
      latestRevision?: string;
    };
