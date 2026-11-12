import {
  type CommandContext,
  canCreateItem,
  canDeleteItem,
  type Diagnostic,
  type DiagnosticCode,
  diagnostic,
  diffDays,
  getItemEditability,
  getResolvedLayerPolicy,
  isLayerEffectivelyHidden,
  type PlannerCommand,
  type PlannerLayer,
  validateAllDayPeriod,
} from "@blendsdk/year-planner-core";
import type { PlannerState } from "../state.js";
import { ITEM_KINDS, isAllDay, isValidPeriod, layerFor } from "./local.js";
import type { CommandFeedback } from "./types.js";

const COMMAND_TYPES = new Set(["create", "update", "move", "resize", "delete", "paint"]);

/**
 * Options used by local command checks.
 */
export interface LocalCheckOptions {
  /** Global read-only guardrail. */
  readOnly?: boolean;
  /** Layer that accepts paint/create commands. */
  activeLayerId?: string;
}

/**
 * Failure data shared by local checks and host rejections.
 */
export interface CommandFailure {
  ok: false;
  diagnostic: Diagnostic;
  feedback: CommandFeedback;
}

/**
 * Options for building a failure.
 */
export interface FailureOptions {
  /** Whether the inspector may offer a retry. */
  retryable?: boolean;
  /** Item IDs implicated by the failure. */
  itemIds?: string[];
  /** Resource IDs implicated by the failure. */
  resourceIds?: string[];
  /** Offending periods. */
  periods?: Diagnostic["periods"];
  /** Diagnostic severity; defaults to error. */
  level?: Diagnostic["level"];
}

/**
 * Builds a failure with a diagnostic and matching feedback.
 */
export function failure(
  command: PlannerCommand,
  code: DiagnosticCode,
  message: string,
  options: FailureOptions = {},
): CommandFailure {
  const level = options.level ?? "error";
  const entry: Diagnostic = {
    ...diagnostic(code, message, level),
    ...(options.itemIds ? { itemIds: options.itemIds } : {}),
    ...(options.resourceIds ? { resourceIds: options.resourceIds } : {}),
    ...(options.periods ? { periods: options.periods } : {}),
  };
  return {
    ok: false,
    diagnostic: entry,
    feedback: {
      code,
      level,
      message,
      command,
      retryable: options.retryable ?? false,
    },
  };
}

/**
 * Returns true for a positive integer version.
 */
export function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function layerAllowsPaint(layer: PlannerLayer, state: PlannerState): boolean {
  return (
    !isLayerEffectivelyHidden(layer.id, state) &&
    !layer.locked &&
    !layer.readOnly &&
    getResolvedLayerPolicy(layer.id, state.model).allowPaint
  );
}

/**
 * Runs every local check before any host call.
 *
 * Local checks are authoritative for read-only state, identity protection,
 * versions, paint targets, editability and ranged editing rules.
 */
export function checkLocal(
  state: PlannerState,
  command: PlannerCommand,
  options: LocalCheckOptions,
): { ok: true } | CommandFailure {
  if (options.readOnly) {
    return failure(command, "READ_ONLY", "The planner is read-only");
  }
  if (!COMMAND_TYPES.has(command.type)) {
    return failure(command, "INVALID_COMMAND", "Unknown command type");
  }
  const context = {
    model: state.model,
    visibility: state.visibility,
    filter: state.filter,
    mode: state.interactionMode,
    ...(options.readOnly ? { readOnly: true } : {}),
    ...(options.activeLayerId ? { activeLayerId: options.activeLayerId } : {}),
  };

  if (command.type === "create") {
    const item = command.item;
    if (
      !item.id ||
      !item.layerId ||
      item.version !== 1 ||
      !ITEM_KINDS.includes(item.kind) ||
      !isValidPeriod(item.period)
    ) {
      return failure(command, "INVALID_COMMAND", "Create requires a complete item");
    }
    if (item.kind === "annotation") {
      return failure(command, "INVALID_COMMAND", "Annotation items are host-owned");
    }
    if (state.model.items.some((entry) => entry.id === item.id)) {
      return failure(command, "INVALID_COMMAND", "Create uses a duplicate item ID", {
        itemIds: [item.id],
      });
    }
    const check = canCreateItem(command.item.layerId, {
      ...context,
      activeLayerId: command.item.layerId,
    });
    if (!check.editable) {
      return failure(command, "READ_ONLY", `Create is not allowed: ${check.reason}`, {
        itemIds: [command.item.id],
      });
    }
    return { ok: true };
  }

  if (command.type === "paint") {
    const layer = layerFor(state.model, command.layerId);
    if (layer?.channel !== "highlight" || command.layerId !== options.activeLayerId) {
      return failure(
        command,
        "INVALID_PAINT_TARGET",
        "Paint target is not an active highlight layer",
      );
    }
    if (!isAllDay(command.period)) {
      return failure(command, "INVALID_COMMAND", "Paint requires an all-day range", {
        periods: [command.period],
      });
    }
    const periodDiagnostics = validateAllDayPeriod(command.period);
    if (periodDiagnostics.length > 0) {
      const primary =
        periodDiagnostics[0] ??
        diagnostic("INVALID_RANGE", "Paint range must contain at least one day");
      return failure(command, primary.code, primary.message, {
        periods: [command.period],
        itemIds: [layer.id],
      });
    }
    if (!layerAllowsPaint(layer, state)) {
      return failure(command, "READ_ONLY", "Paint layer is not editable", {
        itemIds: [layer.id],
      });
    }
    if (
      state.interactionMode !== "auto" &&
      state.interactionMode !== "paint" &&
      state.interactionMode !== "erase"
    ) {
      return failure(command, "READ_ONLY", "Interaction mode does not allow paint");
    }
    for (const [itemId, version] of Object.entries(command.expectedVersions)) {
      if (!isPositiveInteger(version)) {
        return failure(command, "INVALID_COMMAND", "Paint versions must be positive integers", {
          itemIds: [itemId],
        });
      }
      const item = state.model.items.find((entry) => entry.id === itemId);
      if (!item) {
        return failure(command, "INVALID_COMMAND", "Paint references an unknown item", {
          itemIds: [itemId],
        });
      }
      if (item.version !== version) {
        return failure(command, "STALE_REVISION", "Item version is stale", {
          itemIds: [itemId],
        });
      }
    }
    return { ok: true };
  }

  if (!isPositiveInteger(command.expectedVersion)) {
    return failure(command, "INVALID_COMMAND", "Expected version must be a positive integer");
  }

  const source = state.model.items.find((item) => item.id === command.itemId);
  if (!source) {
    return failure(command, "INVALID_COMMAND", "Command references an unknown item", {
      itemIds: [command.itemId],
    });
  }
  if (source.kind === "annotation") {
    return failure(command, "INVALID_COMMAND", "Annotation items are host-owned", {
      itemIds: [command.itemId],
    });
  }
  if (
    command.type === "update" &&
    (typeof command.patch !== "object" ||
      command.patch === null ||
      Array.isArray(command.patch) ||
      Object.hasOwn(command.patch, "id") ||
      Object.hasOwn(command.patch, "version"))
  ) {
    return failure(command, "INVALID_COMMAND", "Update cannot change identity or version", {
      itemIds: [command.itemId],
    });
  }
  if (command.type === "delete") {
    const check = canDeleteItem(command.itemId, context);
    if (!check.editable) {
      return failure(command, "READ_ONLY", `Delete is not allowed: ${check.reason}`, {
        itemIds: [command.itemId],
      });
    }
  } else {
    const action = command.type === "update" ? "move" : command.type;
    const check = getItemEditability(command.itemId, action, context);
    if (!check.editable) {
      return failure(command, "READ_ONLY", `Edit is not allowed: ${check.reason}`, {
        itemIds: [command.itemId],
      });
    }
  }
  if (source.version !== command.expectedVersion) {
    return failure(command, "STALE_REVISION", "Item version is stale", {
      itemIds: [command.itemId],
    });
  }
  if (command.type === "move" || command.type === "resize") {
    if (!isAllDay(command.proposedPeriod) || !isAllDay(source.period)) {
      return failure(command, "TIMED_EDITING_UNSUPPORTED", "Timed editing is not supported", {
        itemIds: [command.itemId],
      });
    }
    if (
      !isValidPeriod(command.proposedPeriod) ||
      diffDays(command.proposedPeriod.startDate, command.proposedPeriod.endDateExclusive) < 1
    ) {
      return failure(command, "INVALID_COMMAND", "Proposed period must contain at least one day", {
        itemIds: [command.itemId],
        periods: [command.proposedPeriod],
      });
    }
  }
  return { ok: true };
}

/**
 * Builds the context passed to host validation and requests.
 */
export function buildContext(requestId: string, baseRevision: string | undefined): CommandContext {
  return {
    requestId,
    ...(baseRevision !== undefined ? { baseRevision } : {}),
  };
}
