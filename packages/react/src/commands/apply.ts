import {
  type CommandOutcome,
  type Diagnostic,
  type DiagnosticLevel,
  isDiagnosticCode,
  type PlannerCommand,
  type PlannerItem,
  type PlannerPeriod,
} from "@blendsdk/year-planner-core";

/** A host failure source, used to decide whether a retry is safe. */
export type RetrySource = "explicit" | "timeout" | "thrown" | "other";

/** Normalized validation result. */
export interface NormalizedValidation {
  /** Host permit flag. */
  permitted: boolean;
  /** Normalized diagnostics. */
  diagnostics: Diagnostic[];
  /** True when any diagnostic blocks. */
  hasError: boolean;
}

/** Result of normalizing a host outcome. */
export type NormalizedOutcome =
  | { ok: true; outcome: CommandOutcome }
  | { ok: false; diagnostic: Diagnostic };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPlannerPeriod(value: unknown): value is PlannerPeriod {
  if (!isRecord(value)) return false;
  if (value.kind === "all-day") {
    return typeof value.startDate === "string" && typeof value.endDateExclusive === "string";
  }
  if (value.kind === "timed") {
    return (
      typeof value.start === "string" &&
      typeof value.endExclusive === "string" &&
      typeof value.timeZone === "string"
    );
  }
  return false;
}

function isItemLike(value: unknown): value is PlannerItem {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.layerId === "string" &&
    typeof value.version === "number" &&
    Number.isInteger(value.version) &&
    value.version > 0 &&
    isPlannerPeriod(value.period)
  );
}

function stringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.filter((entry): entry is string => typeof entry === "string");
}

function strictStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  if (!value.every((entry): entry is string => typeof entry === "string")) return undefined;
  return value;
}

function periodArray(value: unknown): PlannerPeriod[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.filter(isPlannerPeriod);
}

/** Returns a safe generic host-rejection diagnostic. */
export function hostRejected(message = "The host rejected the command"): Diagnostic {
  return { code: "HOST_REJECTED", level: "error", message };
}

/**
 * Normalizes one host diagnostic.
 *
 * Unknown codes become `HOST_REJECTED`; malformed levels default to error;
 * non-string messages are replaced with a generic message. Optional item,
 * resource and period arrays are preserved when they have the right shape.
 */
export function normalizeDiagnostic(value: unknown): Diagnostic {
  if (!isRecord(value)) return hostRejected();
  const code = isDiagnosticCode(value.code) ? value.code : "HOST_REJECTED";
  const level: DiagnosticLevel =
    value.level === "warning" || value.level === "info" || value.level === "error"
      ? value.level
      : "error";
  const message =
    typeof value.message === "string" && value.message.trim().length > 0
      ? value.message
      : "The host rejected the command";
  const itemIds = stringArray(value.itemIds);
  const resourceIds = stringArray(value.resourceIds);
  const periods = periodArray(value.periods);
  return {
    code,
    level,
    message,
    ...(itemIds ? { itemIds } : {}),
    ...(resourceIds ? { resourceIds } : {}),
    ...(periods ? { periods } : {}),
  };
}

/** Normalizes a host validation result, or returns `undefined` when malformed. */
export function normalizeValidation(value: unknown): NormalizedValidation | undefined {
  if (
    !isRecord(value) ||
    typeof value.permitted !== "boolean" ||
    !Array.isArray(value.diagnostics)
  ) {
    return undefined;
  }
  const diagnostics = value.diagnostics.map((entry) => normalizeDiagnostic(entry));
  return {
    permitted: value.permitted,
    diagnostics,
    hasError: diagnostics.some((entry) => entry.level === "error"),
  };
}

function paintPayloadProblem(
  command: Extract<PlannerCommand, { type: "paint" }>,
  updatedItems: PlannerItem[],
  removedItemIds: string[],
): Diagnostic | undefined {
  const updatedIds = new Set(updatedItems.map((item) => item.id));
  const removed = new Set(removedItemIds);
  for (const id of Object.keys(command.expectedVersions)) {
    const covered = updatedIds.has(id) || (command.operation === "union" && removed.has(id));
    if (!covered) {
      return hostRejected("Paint outcome does not cover every expected source");
    }
    if (command.operation === "subtract" && !removed.has(id)) {
      return hostRejected("Erase outcome must remove every expected source");
    }
  }
  if (command.operation === "union") {
    const created = updatedItems.some(
      (item) => !Object.hasOwn(command.expectedVersions, item.id) && item.version === 1,
    );
    if (!created) return hostRejected("Paint outcome is missing the created item");
  }
  return undefined;
}

/**
 * Normalizes a host command outcome.
 *
 * The whole result is validated before any mutation. Controlled paint outcomes
 * must prove they covered every expected source and, for a union, created at
 * least one new item.
 */
export function normalizeOutcome(
  value: unknown,
  command: PlannerCommand,
  controlled: boolean,
): NormalizedOutcome {
  if (!isRecord(value)) return { ok: false, diagnostic: hostRejected() };
  if (value.accepted === true) {
    if (typeof value.revision !== "string") {
      return { ok: false, diagnostic: hostRejected("The host accepted without a revision") };
    }
    let updatedItems: PlannerItem[] | undefined;
    if (value.updatedItems !== undefined) {
      if (!Array.isArray(value.updatedItems) || !value.updatedItems.every(isItemLike)) {
        return { ok: false, diagnostic: hostRejected("The host returned invalid items") };
      }
      updatedItems = value.updatedItems;
    }
    let removedItemIds: string[] | undefined;
    if (value.removedItemIds !== undefined) {
      removedItemIds = strictStringArray(value.removedItemIds);
      if (!removedItemIds) {
        return { ok: false, diagnostic: hostRejected("The host returned invalid removed IDs") };
      }
    }
    if (updatedItems && removedItemIds) {
      const updatedIds = new Set(updatedItems.map((item) => item.id));
      if (removedItemIds.some((id) => updatedIds.has(id))) {
        return {
          ok: false,
          diagnostic: hostRejected("The host returned an item as both updated and removed"),
        };
      }
    }
    if (controlled && command.type === "paint") {
      if (!updatedItems || !removedItemIds) {
        return { ok: false, diagnostic: hostRejected("Paint outcomes require a complete payload") };
      }
      const problem = paintPayloadProblem(command, updatedItems, removedItemIds);
      if (problem) return { ok: false, diagnostic: problem };
    }
    return {
      ok: true,
      outcome: {
        accepted: true,
        revision: value.revision,
        ...(updatedItems ? { updatedItems } : {}),
        ...(removedItemIds ? { removedItemIds } : {}),
      },
    };
  }
  if (value.accepted === false) {
    if (!Array.isArray(value.diagnostics)) {
      return { ok: false, diagnostic: hostRejected() };
    }
    const diagnostics = value.diagnostics.map((entry) => normalizeDiagnostic(entry));
    if (diagnostics.length === 0) diagnostics.push(hostRejected());
    return {
      ok: true,
      outcome: {
        accepted: false,
        diagnostics,
        ...(typeof value.latestRevision === "string"
          ? { latestRevision: value.latestRevision }
          : {}),
      },
    };
  }
  return { ok: false, diagnostic: hostRejected() };
}

/**
 * Returns true when a command still targets the current item versions.
 *
 * A create is current only while its ID is unused. Update/move/resize/delete
 * require the exact expected version. Paint requires every expected version.
 */
export function commandStillCurrent(
  items: readonly PlannerItem[],
  command: PlannerCommand,
): boolean {
  if (command.type === "create") {
    return !items.some((item) => item.id === command.item.id);
  }
  if (command.type === "paint") {
    return Object.entries(command.expectedVersions).every(([id, version]) =>
      items.some((item) => item.id === id && item.version === version),
    );
  }
  const source = items.find((item) => item.id === command.itemId);
  return source?.version === command.expectedVersion;
}

/**
 * Returns true when the controlled props prove an accepted outcome landed.
 *
 * Create waits for the ID, delete for absence, update/move/resize for an
 * advanced version, and paint for every payload entry plus every removal.
 */
export function isApplied(
  items: readonly PlannerItem[],
  command: PlannerCommand,
  outcome: CommandOutcome,
): boolean {
  if (!outcome.accepted) return false;
  if (command.type === "create") {
    const item = items.find((entry) => entry.id === command.item.id);
    const expectedVersion = outcome.updatedItems?.find(
      (entry) => entry.id === command.item.id,
    )?.version;
    return item !== undefined && (expectedVersion === undefined || item.version >= expectedVersion);
  }
  if (command.type === "delete") {
    return !items.some((entry) => entry.id === command.itemId);
  }
  if (command.type === "paint") {
    const updated = outcome.updatedItems ?? [];
    const removed = outcome.removedItemIds ?? [];
    const updatedApplied = updated.every((expected) => {
      const item = items.find((entry) => entry.id === expected.id);
      return item !== undefined && item.version >= expected.version;
    });
    const removedApplied = removed.every((id) => !items.some((entry) => entry.id === id));
    return updatedApplied && removedApplied;
  }
  const item = items.find((entry) => entry.id === command.itemId);
  if (!item) return false;
  if (command.type === "update" || command.type === "move" || command.type === "resize") {
    const expectedVersion = outcome.updatedItems?.find(
      (entry) => entry.id === command.itemId,
    )?.version;
    return (
      item.version > command.expectedVersion &&
      (expectedVersion === undefined || item.version >= expectedVersion)
    );
  }
  return false;
}

/** Returns true when a failed command may be retried without replay risk. */
export function isRetryable(
  command: PlannerCommand,
  code: Diagnostic["code"],
  source: RetrySource,
): boolean {
  if (command.type === "delete") return false;
  if (source === "timeout") {
    return command.type === "update" || command.type === "move" || command.type === "resize";
  }
  if (source === "explicit" && code === "HOST_REJECTED") {
    return (
      command.type === "create" ||
      command.type === "paint" ||
      command.type === "update" ||
      command.type === "move" ||
      command.type === "resize"
    );
  }
  if (source === "thrown") {
    return command.type === "update" || command.type === "move" || command.type === "resize";
  }
  return false;
}

/** Returns the highest diagnostic level in a list. */
export function highestLevel(diagnostics: readonly Diagnostic[]): DiagnosticLevel {
  if (diagnostics.some((entry) => entry.level === "error")) return "error";
  if (diagnostics.some((entry) => entry.level === "warning")) return "warning";
  return "info";
}

/** Returns the first error diagnostic, else the first diagnostic. */
export function primaryDiagnostic(diagnostics: readonly Diagnostic[]): Diagnostic | undefined {
  return diagnostics.find((entry) => entry.level === "error") ?? diagnostics[0];
}
