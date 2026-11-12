import type { DateKey } from "./date.js";
import type { Diagnostic } from "./diagnostics.js";
import type { PaintDefaults } from "./model/paint.js";
import type { PlannerItem } from "./model/types.js";
import type { PlannerPeriod } from "./period.js";

/**
 * A date range selected by the host or interaction layer.
 * @public
 */
export interface SelectionDateRange {
  /** First selected date. */
  startDate: DateKey;
  /** First date after the selected range. */
  endDateExclusive: DateKey;
}

/**
 * Canonical selection state shared by the React view and the interaction
 * layer. Date ranges and item IDs may be selected together.
 * @public
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

/**
 * Host-side result of validating a proposed command.
 * @public
 */
export interface ValidationResult {
  /** False blocks the command. */
  permitted: boolean;
  /** Diagnostics to display. */
  diagnostics: Diagnostic[];
}

/**
 * Context passed with every command request.
 * @public
 */
export interface CommandContext {
  /** Unique request identity; used to ignore stale responses. */
  requestId: string;
  /** Optional host-wide revision token. */
  baseRevision?: string;
}

/**
 * The canonical command union used by the view and command pipeline.
 * @public
 */
export type PlannerCommand =
  | {
      /** Creates one item on the active layer. */
      type: "create";
      /** Complete item to create. */
      item: PlannerItem;
    }
  | {
      /** Updates fields of one existing item. */
      type: "update";
      /** ID of the item to update. */
      itemId: string;
      /** Fields to replace; the id and version are not patchable. */
      patch: Partial<Omit<PlannerItem, "id" | "version">>;
      /** Version the host expects; a mismatch rejects the command. */
      expectedVersion: number;
    }
  | {
      /** Moves one item to a new period. */
      type: "move";
      /** ID of the item to move. */
      itemId: string;
      /** Destination period. */
      proposedPeriod: PlannerPeriod;
      /** Version the host expects; a mismatch rejects the command. */
      expectedVersion: number;
    }
  | {
      /** Resizes one item to a new period. */
      type: "resize";
      /** ID of the item to resize. */
      itemId: string;
      /** Destination period. */
      proposedPeriod: PlannerPeriod;
      /** Version the host expects; a mismatch rejects the command. */
      expectedVersion: number;
    }
  | {
      /** Deletes one item. */
      type: "delete";
      /** ID of the item to delete. */
      itemId: string;
      /** Version the host expects; a mismatch rejects the command. */
      expectedVersion: number;
    }
  | {
      /** Paints or erases a date range on one layer. */
      type: "paint";
      /** Layer that receives the paint command. */
      layerId: string;
      /** Date range to paint or erase. */
      period: PlannerPeriod;
      /** Adds the range to an item or removes it. */
      operation: "union" | "subtract";
      /** Defaults for a newly created paint item. */
      defaults: PaintDefaults;
      /** Versions of the items the range touches. */
      expectedVersions: Record<string, number>;
    };

/**
 * The authoritative host response to a command request.
 * @public
 */
export type CommandOutcome =
  | {
      /** True when the host applied or accepted the command. */
      accepted: true;
      /** Host revision token after the change. */
      revision: string;
      /** Items the host created or changed; ids in `removedItemIds` are deleted. */
      updatedItems?: PlannerItem[];
      /** IDs removed by the command. */
      removedItemIds?: string[];
    }
  | {
      /** False when the host rejected the command. */
      accepted: false;
      /** Reasons shown to the user and sent to `onDiagnostic`. */
      diagnostics: Diagnostic[];
      /** Host revision token the rejection was based on, when known. */
      latestRevision?: string;
    };
