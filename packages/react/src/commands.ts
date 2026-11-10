import {
  type CommandContext,
  type CommandOutcome,
  canCreateItem,
  canDeleteItem,
  type Diagnostic,
  type DiagnosticCode,
  diagnostic,
  eraseItems,
  getItemEditability,
  getResolvedLayerPolicy,
  isLayerEffectivelyHidden,
  type PlannerCommand,
  type PlannerItem,
  type PlannerLayer,
  type PlannerPeriod,
  paintItems,
  type ValidationResult,
} from "@blendsdk/year-planner-core";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PlannerState } from "./state.js";

/** Feedback shown for a rejected or timed-out command. */
export interface CommandFeedback {
  code: DiagnosticCode;
  message: string;
  command: PlannerCommand;
  retryable: boolean;
}

/** Inputs for the command request pipeline. */
export interface CommandPipelineInput {
  state: PlannerState;
  readOnly?: boolean;
  activeLayerId?: string;
  createId?: () => string;
  requestId?: () => string;
  commandTimeoutMs?: number;
  confirmChange?: (command: PlannerCommand) => boolean | Promise<boolean>;
  validateChange?: (
    command: PlannerCommand,
    context: CommandContext,
  ) => ValidationResult | Promise<ValidationResult>;
  onChangeRequest?: (
    command: PlannerCommand,
    context: CommandContext,
  ) => CommandOutcome | Promise<CommandOutcome>;
  onChangeCommitted?: (outcome: CommandOutcome) => void;
  onChangeRejected?: (outcome: CommandOutcome) => void;
  onDiagnostic?: (diagnostic: Diagnostic) => void;
}

/** Command pipeline state and actions. */
export interface CommandPipeline {
  pendingItemIds: ReadonlySet<string>;
  feedback: CommandFeedback | undefined;
  requestCommand: (command: PlannerCommand) => Promise<boolean>;
  retry: () => Promise<boolean>;
  dismiss: () => void;
  requestUndo: () => void;
  requestRedo: () => void;
}

let fallbackCounter = 0;

/** Returns a stable new item ID from the host factory or a UUID/fallback. */
export function createPlannerId(interaction?: { createId?: () => string }): string {
  return interaction?.createId?.() ?? defaultId();
}

function defaultId(): string {
  const cryptoObject = globalThis.crypto;
  if (cryptoObject && typeof cryptoObject.randomUUID === "function") {
    return cryptoObject.randomUUID();
  }
  fallbackCounter += 1;
  return `yp-${fallbackCounter}`;
}

function commandItemIds(command: PlannerCommand): string[] {
  if (command.type === "create") return [command.item.id];
  if (command.type === "paint") return Object.keys(command.expectedVersions);
  return [command.itemId];
}

function failure(
  command: PlannerCommand,
  code: DiagnosticCode,
  message: string,
  retryable = false,
  itemIds?: string[],
): { ok: false; diagnostic: Diagnostic; feedback: CommandFeedback } {
  const entry: Diagnostic = {
    ...diagnostic(code, message),
    ...(itemIds ? { itemIds } : {}),
  };
  return {
    ok: false,
    diagnostic: entry,
    feedback: { code, message, command, retryable },
  };
}

function isAllDay(period: PlannerPeriod): period is PlannerPeriod & { kind: "all-day" } {
  return period.kind === "all-day";
}

function layerFor(
  model: { layers: PlannerLayer[] },
  layerId: string | undefined,
): PlannerLayer | undefined {
  return layerId ? model.layers.find((layer) => layer.id === layerId) : undefined;
}

function applyHostOutcome(items: PlannerItem[], outcome: CommandOutcome): PlannerItem[] {
  if (!outcome.accepted) return items;
  const updated = outcome.updatedItems;
  const removed = outcome.removedItemIds;
  if (!updated && !removed) return items;
  const remove = new Set([...(removed ?? []), ...(updated ?? []).map((item) => item.id)]);
  const next = items.filter((item) => !remove.has(item.id));
  for (const item of updated ?? []) next.push(item);
  return next;
}

function localCommandItems(
  state: PlannerState,
  command: PlannerCommand,
  createId: () => string,
): { updatedItems: PlannerItem[]; removedItemIds: string[] } | undefined {
  switch (command.type) {
    case "create":
      return {
        updatedItems: [{ ...command.item, version: 1 }],
        removedItemIds: [],
      };
    case "update": {
      const source = state.model.items.find((item) => item.id === command.itemId);
      if (!source) return undefined;
      return {
        updatedItems: [{ ...source, ...command.patch, id: source.id, version: source.version + 1 }],
        removedItemIds: [],
      };
    }
    case "move":
    case "resize": {
      const source = state.model.items.find((item) => item.id === command.itemId);
      if (!source) return undefined;
      return {
        updatedItems: [{ ...source, period: command.proposedPeriod, version: source.version + 1 }],
        removedItemIds: [],
      };
    }
    case "delete":
      return { updatedItems: [], removedItemIds: [command.itemId] };
    case "paint": {
      const layer = layerFor(state.model, command.layerId);
      if (!layer || !isAllDay(command.period)) return undefined;
      const context = {
        model: state.model,
        visibility: state.visibility,
        filter: state.filter,
        activeLayerId: command.layerId,
        createId,
        expectedVersions: command.expectedVersions,
      };
      const result =
        command.operation === "union"
          ? paintItems(context, command.layerId, command.period, command.defaults)
          : eraseItems(context, command.layerId, command.period);
      if (!result.ok) return undefined;
      return { updatedItems: result.updatedItems, removedItemIds: result.removedItemIds };
    }
  }
}

/**
 * Owns the command request path used by the inspector and imperative handle.
 *
 * Local read-only/version checks run first, then host validation and the host
 * request with a timeout. Uncontrolled mode applies the same local reducer;
 * controlled mode never mutates props.
 */
export function useCommandPipeline(input: CommandPipelineInput): CommandPipeline {
  const { state } = input;
  const [pendingItemIds, setPendingItemIds] = useState<ReadonlySet<string>>(new Set());
  const [feedback, setFeedback] = useState<CommandFeedback | undefined>(undefined);
  const undoStack = useRef<PlannerItem[][]>([]);
  const redoStack = useRef<PlannerItem[][]>([]);
  const mounted = useRef(true);
  const pendingRef = useRef(new Set<string>());
  const inFlight = useRef<Set<string>>(new Set());

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const createId = input.createId ?? defaultId;
  const requestIdFactory = input.requestId ?? defaultId;
  const timeoutMs = input.commandTimeoutMs ?? 15000;

  const applyLocal = useCallback(
    (command: PlannerCommand): boolean => {
      if (state.itemsControlled) return false;
      const result = localCommandItems(state, command, createId);
      if (!result) return false;
      const snapshot = state.items;
      const next = applyHostOutcome(snapshot, {
        accepted: true,
        revision: "local",
        updatedItems: result.updatedItems,
        removedItemIds: result.removedItemIds,
      });
      undoStack.current = [...undoStack.current.slice(-49), snapshot];
      redoStack.current = [];
      state.applyLocalItems(next);
      return true;
    },
    [state, createId],
  );

  const reject = useCallback(
    (failureResult: { diagnostic: Diagnostic; feedback: CommandFeedback }): false => {
      input.onDiagnostic?.(failureResult.diagnostic);
      setFeedback(failureResult.feedback);
      input.onChangeRejected?.({
        accepted: false,
        diagnostics: [failureResult.diagnostic],
      });
      return false;
    },
    [input],
  );

  const checkLocal = useCallback(
    (
      command: PlannerCommand,
    ): { ok: true } | { ok: false; diagnostic: Diagnostic; feedback: CommandFeedback } => {
      if (input.readOnly) {
        return failure(command, "READ_ONLY", "The planner is read-only");
      }
      const context = {
        model: state.model,
        visibility: state.visibility,
        filter: state.filter,
        mode: state.interactionMode,
        ...(input.readOnly ? { readOnly: true } : {}),
        ...(input.activeLayerId ? { activeLayerId: input.activeLayerId } : {}),
      };
      if (command.type === "create") {
        if (!command.item.layerId || command.item.version !== 1) {
          return failure(command, "INVALID_COMMAND", "Create requires a complete item");
        }
        const check = canCreateItem(command.item.layerId, {
          ...context,
          activeLayerId: command.item.layerId,
        });
        if (!check.editable) {
          return failure(command, "READ_ONLY", `Create is not allowed: ${check.reason}`, false, [
            command.item.id,
          ]);
        }
        return { ok: true };
      }
      if (command.type === "paint") {
        const layer = layerFor(state.model, command.layerId);
        if (layer?.channel !== "highlight" || command.layerId !== input.activeLayerId) {
          return failure(
            command,
            "INVALID_PAINT_TARGET",
            "Paint target is not an active highlight layer",
          );
        }
        if (!isAllDay(command.period)) {
          return failure(command, "INVALID_COMMAND", "Paint requires an all-day range");
        }
        if (
          isLayerEffectivelyHidden(layer.id, state) ||
          layer.locked ||
          layer.readOnly ||
          !getResolvedLayerPolicy(layer.id, state.model).allowPaint
        ) {
          return failure(command, "READ_ONLY", "Paint layer is not editable", false, [layer.id]);
        }
        if (
          state.interactionMode !== "auto" &&
          state.interactionMode !== "paint" &&
          state.interactionMode !== "erase"
        ) {
          return failure(command, "READ_ONLY", "Interaction mode does not allow paint");
        }
        for (const [itemId, version] of Object.entries(command.expectedVersions)) {
          const item = state.model.items.find((entry) => entry.id === itemId);
          if (!item) {
            return failure(command, "INVALID_COMMAND", "Paint references an unknown item", false, [
              itemId,
            ]);
          }
          if (item.version !== version) {
            return failure(command, "STALE_REVISION", "Item version is stale", false, [itemId]);
          }
        }
        return { ok: true };
      }
      const source = state.model.items.find((item) => item.id === command.itemId);
      if (!source) {
        return failure(command, "INVALID_COMMAND", "Command references an unknown item", false, [
          command.itemId,
        ]);
      }
      if (command.type === "delete") {
        const check = canDeleteItem(command.itemId, context);
        if (!check.editable) {
          return failure(command, "READ_ONLY", `Delete is not allowed: ${check.reason}`, false, [
            command.itemId,
          ]);
        }
      } else {
        const action = command.type === "update" ? "move" : command.type;
        const check = getItemEditability(command.itemId, action, context);
        if (!check.editable) {
          return failure(command, "READ_ONLY", `Edit is not allowed: ${check.reason}`, false, [
            command.itemId,
          ]);
        }
      }
      if (command.type !== "update" && source.version !== command.expectedVersion) {
        return failure(command, "STALE_REVISION", "Item version is stale", false, [command.itemId]);
      }
      if (command.type === "update" && source.version !== command.expectedVersion) {
        return failure(command, "STALE_REVISION", "Item version is stale", false, [command.itemId]);
      }
      if (command.type === "move" || command.type === "resize") {
        if (!isAllDay(command.proposedPeriod) || !isAllDay(source.period)) {
          return failure(
            command,
            "TIMED_EDITING_UNSUPPORTED",
            "Timed editing is not supported",
            false,
            [command.itemId],
          );
        }
      }
      return { ok: true };
    },
    [input, state],
  );

  const run = useCallback(
    async (command: PlannerCommand): Promise<boolean> => {
      const local = checkLocal(command);
      if (!local.ok) return reject(local);
      const ids = commandItemIds(command);
      if (ids.some((id) => pendingRef.current.has(id))) {
        return reject(
          failure(command, "INVALID_COMMAND", "A command is already pending for this item"),
        );
      }

      if (command.type === "delete") {
        const confirm = input.confirmChange;
        let approved = false;
        try {
          if (confirm) {
            approved = await confirm(command);
          } else if (typeof window !== "undefined" && typeof window.confirm === "function") {
            approved = window.confirm("Delete this item?");
          } else {
            return reject(
              failure(command, "CONFIRMATION_UNAVAILABLE", "No confirmation handler is available"),
            );
          }
        } catch {
          approved = false;
        }
        if (!approved) return false;
      }

      const requestId = requestIdFactory();
      const context: CommandContext = { requestId };
      if (input.validateChange) {
        try {
          const validation = await input.validateChange(command, context);
          if (!validation.permitted) {
            const entries =
              validation.diagnostics.length > 0
                ? validation.diagnostics
                : [diagnostic("VALIDATION_ERROR", "Host validation rejected the command")];
            setFeedback({
              code: (entries[0]?.code as DiagnosticCode | undefined) ?? "VALIDATION_ERROR",
              message: entries[0]?.message ?? "Host validation rejected the command",
              command,
              retryable: false,
            });
            for (const entry of entries) input.onDiagnostic?.(entry);
            input.onChangeRejected?.({ accepted: false, diagnostics: entries });
            return false;
          }
        } catch {
          return reject(failure(command, "VALIDATION_ERROR", "Host validation failed", false));
        }
      }

      for (const id of ids) pendingRef.current.add(id);
      setPendingItemIds(new Set(pendingRef.current));
      inFlight.current.add(requestId);

      const finishPending = (): void => {
        for (const id of ids) pendingRef.current.delete(id);
        inFlight.current.delete(requestId);
        if (mounted.current) setPendingItemIds(new Set(pendingRef.current));
      };

      if (!input.onChangeRequest) {
        const applied = applyLocal(command);
        finishPending();
        if (applied) {
          const result = localCommandItems(state, command, createId);
          input.onChangeCommitted?.({
            accepted: true,
            revision: "local",
            ...(result
              ? { updatedItems: result.updatedItems, removedItemIds: result.removedItemIds }
              : {}),
          });
        }
        return applied;
      }

      try {
        let timer: ReturnType<typeof setTimeout> | undefined;
        const timeout = new Promise<"timeout">((resolve) => {
          timer = setTimeout(() => resolve("timeout"), timeoutMs);
        });
        const outcome = await Promise.race([
          Promise.resolve(input.onChangeRequest(command, context)),
          timeout,
        ]);
        if (timer) clearTimeout(timer);
        if (!mounted.current || !inFlight.current.has(requestId)) return false;
        if (outcome === "timeout") {
          finishPending();
          return reject(failure(command, "COMMAND_TIMEOUT", "The host command timed out", true));
        }
        if (!outcome.accepted) {
          finishPending();
          setFeedback({
            code: (outcome.diagnostics[0]?.code as DiagnosticCode | undefined) ?? "HOST_REJECTED",
            message: outcome.diagnostics[0]?.message ?? "The host rejected the command",
            command,
            retryable: true,
          });
          for (const entry of outcome.diagnostics) input.onDiagnostic?.(entry);
          input.onChangeRejected?.(outcome);
          return false;
        }
        if (!state.itemsControlled) {
          const result = localCommandItems(state, command, createId);
          const next = applyHostOutcome(state.items, {
            ...outcome,
            ...(outcome.updatedItems || outcome.removedItemIds
              ? {}
              : result
                ? { updatedItems: result.updatedItems, removedItemIds: result.removedItemIds }
                : {}),
          });
          undoStack.current = [...undoStack.current.slice(-49), state.items];
          redoStack.current = [];
          state.applyLocalItems(next);
        }
        finishPending();
        input.onChangeCommitted?.(outcome);
        return true;
      } catch {
        finishPending();
        return reject(failure(command, "HOST_REJECTED", "The host command failed", true));
      }
    },
    [applyLocal, checkLocal, createId, input, reject, requestIdFactory, state, timeoutMs],
  );

  const requestCommand = useCallback((command: PlannerCommand) => run(command), [run]);

  const requestUndo = useCallback(() => {
    if (state.itemsControlled) {
      input.onDiagnostic?.(diagnostic("UNDO_UNAVAILABLE", "Undo is host-owned"));
      return;
    }
    const previous = undoStack.current.pop();
    if (!previous) return;
    redoStack.current = [...redoStack.current.slice(-49), state.items];
    state.applyLocalItems(previous);
  }, [input, state]);

  const requestRedo = useCallback(() => {
    if (state.itemsControlled) {
      input.onDiagnostic?.(diagnostic("UNDO_UNAVAILABLE", "Redo is host-owned"));
      return;
    }
    const next = redoStack.current.pop();
    if (!next) return;
    undoStack.current = [...undoStack.current.slice(-49), state.items];
    state.applyLocalItems(next);
  }, [input, state]);

  const retry = useCallback(() => {
    if (!feedback?.retryable) return Promise.resolve(false);
    return run(feedback.command);
  }, [feedback, run]);

  const dismiss = useCallback(() => setFeedback(undefined), []);

  return {
    pendingItemIds,
    feedback,
    requestCommand,
    retry,
    dismiss,
    requestUndo,
    requestRedo,
  };
}
