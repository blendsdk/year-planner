import {
  type CommandOutcome,
  type Diagnostic,
  diagnostic,
  type PlannerCommand,
  type PlannerItem,
  type ValidationResult,
} from "@blendsdk/year-planner-core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PlannerState } from "../state.js";
import {
  commandStillCurrent,
  highestLevel,
  isApplied,
  isRetryable,
  normalizeOutcome,
  normalizeValidation,
  primaryDiagnostic,
  type RetrySource,
} from "./apply.js";
import { applyHostOutcome, commandItemIds, defaultId, localCommandItems } from "./local.js";
import type {
  CommandFeedback,
  CommandPipeline,
  CommandPipelineInput,
  CommandRequestResult,
  CommandSettlement,
} from "./types.js";
import { buildContext, checkLocal, failure } from "./validate.js";

type RequestPhase = "validating" | "requesting" | "applying";
type RequestStatus = "active" | "settled" | "obsolete";

interface ActiveRequest {
  id: string;
  command: PlannerCommand;
  itemIds: string[];
  phase: RequestPhase;
  status: RequestStatus;
  controller: AbortController;
  deadline: ReturnType<typeof setTimeout> | undefined;
  applicationTimer: ReturnType<typeof setTimeout> | undefined;
  outcome: CommandOutcome | undefined;
  cancel: (result: "ignored") => void;
  applicationResolve:
    | ((result: "accepted" | "accepted-not-applied" | "ignored") => void)
    | undefined;
}

const MAX_NOTICES = 5;

function isAbortError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name?: unknown }).name === "AbortError"
  );
}

function noticeKey(entry: Diagnostic): string {
  return `${entry.code}:${entry.message}`;
}

function mergeNotices(previous: readonly Diagnostic[], next: readonly Diagnostic[]): Diagnostic[] {
  const merged = [...previous];
  for (const entry of next) {
    if (entry.level === "error") continue;
    if (merged.some((candidate) => noticeKey(candidate) === noticeKey(entry))) continue;
    merged.push(entry);
  }
  return merged.slice(-MAX_NOTICES);
}

/**
 * Owns the command request path used by the inspector, the handle and gestures.
 *
 * Local checks run first, then host validation and the host request share one
 * deadline. A response settles only the active request. Controlled acceptance
 * waits for props; uncontrolled acceptance re-checks versions before applying.
 */
export function useCommandPipeline(input: CommandPipelineInput): CommandPipeline {
  const { state } = input;
  const [pendingItemIds, setPendingItemIds] = useState<ReadonlySet<string>>(new Set());
  const [feedback, setFeedback] = useState<CommandFeedback | undefined>(undefined);
  const [notices, setNotices] = useState<readonly Diagnostic[]>([]);
  const [lastSettled, setLastSettled] = useState<CommandSettlement | undefined>(undefined);
  const activeRequests = useRef(new Map<string, ActiveRequest>());
  const usedRequestIds = useRef(new Set<string>());
  const undoStack = useRef<PlannerItem[][]>([]);
  const redoStack = useRef<PlannerItem[][]>([]);
  const mounted = useRef(true);
  const itemsRef = useRef(state.items);
  itemsRef.current = state.items;
  const contextKeyRef = useRef(input.contextKey);

  const createId = input.createId ?? defaultId;
  const requestIdFactory = input.requestId ?? defaultId;
  const timeoutMs = input.commandTimeoutMs ?? 15000;

  const syncPending = useCallback(() => {
    if (!mounted.current) return;
    const next = new Set<string>();
    for (const request of activeRequests.current.values()) {
      for (const id of request.itemIds) next.add(id);
    }
    setPendingItemIds(next);
  }, []);

  const clearTimers = useCallback((request: ActiveRequest) => {
    if (request.deadline !== undefined) {
      clearTimeout(request.deadline);
      request.deadline = undefined;
    }
    if (request.applicationTimer !== undefined) {
      clearTimeout(request.applicationTimer);
      request.applicationTimer = undefined;
    }
  }, []);

  const finishRequest = useCallback(
    (request: ActiveRequest, result: CommandRequestResult, diagnostics: Diagnostic[]) => {
      if (request.status !== "active") return;
      request.status = "settled";
      clearTimers(request);
      activeRequests.current.delete(request.id);
      syncPending();
      if (mounted.current) setLastSettled({ result, command: request.command, diagnostics });
    },
    [clearTimers, syncPending],
  );

  const invalidateRequest = useCallback(
    (request: ActiveRequest) => {
      if (request.status !== "active") return;
      request.status = "obsolete";
      clearTimers(request);
      activeRequests.current.delete(request.id);
      request.controller.abort();
      syncPending();
      request.cancel("ignored");
      request.applicationResolve?.("ignored");
    },
    [clearTimers, syncPending],
  );

  const emitDiagnostics = useCallback(
    (entries: readonly Diagnostic[]) => {
      if (!mounted.current) return;
      for (const entry of entries) {
        try {
          input.onDiagnostic?.(entry);
        } catch {
          // Host diagnostics must not re-enter or break the lifecycle.
        }
      }
    },
    [input],
  );

  const addNotices = useCallback((entries: readonly Diagnostic[]) => {
    if (!mounted.current) return;
    setNotices((previous) => mergeNotices(previous, entries));
  }, []);

  const notifyCommitted = useCallback(
    (outcome: CommandOutcome) => {
      if (!mounted.current) return;
      try {
        input.onChangeCommitted?.(outcome);
      } catch {
        // A host callback error must not turn an applied change into a rejection.
      }
    },
    [input],
  );

  const notifyRejected = useCallback(
    (outcome: CommandOutcome) => {
      if (!mounted.current) return;
      try {
        input.onChangeRejected?.(outcome);
      } catch {
        // A host callback error must not re-enter the lifecycle.
      }
    },
    [input],
  );

  const showRejection = useCallback(
    (
      command: PlannerCommand,
      diagnostics: Diagnostic[],
      retryable: boolean,
      outcome?: CommandOutcome,
    ) => {
      const primary =
        primaryDiagnostic(diagnostics) ??
        diagnostic("HOST_REJECTED", "The host rejected the command");
      if (mounted.current) {
        setFeedback({
          code: primary.code,
          level: highestLevel(diagnostics),
          message: primary.message,
          command,
          retryable,
        });
      }
      addNotices(diagnostics);
      emitDiagnostics(diagnostics);
      notifyRejected(outcome ?? { accepted: false, diagnostics });
    },
    [addNotices, emitDiagnostics, notifyRejected],
  );

  const rejectLocal = useCallback(
    (command: PlannerCommand, result: ReturnType<typeof failure>): CommandRequestResult => {
      if (mounted.current) {
        setLastSettled({ result: "rejected", command, diagnostics: [result.diagnostic] });
      }
      showRejection(command, [result.diagnostic], result.feedback.retryable);
      return "rejected";
    },
    [showRejection],
  );

  const rejectDiagnostics = useCallback(
    (
      request: ActiveRequest,
      diagnostics: Diagnostic[],
      source: RetrySource,
      outcome?: CommandOutcome,
    ): CommandRequestResult => {
      finishRequest(request, "rejected", diagnostics);
      const primary =
        primaryDiagnostic(diagnostics) ??
        diagnostic("HOST_REJECTED", "The host rejected the command");
      showRejection(
        request.command,
        diagnostics,
        isRetryable(request.command, primary.code, source),
        outcome,
      );
      return "rejected";
    },
    [finishRequest, showRejection],
  );

  const rejectOutcome = useCallback(
    (
      request: ActiveRequest,
      outcome: Extract<CommandOutcome, { accepted: false }>,
    ): CommandRequestResult => {
      finishRequest(request, "rejected", outcome.diagnostics);
      const primary =
        primaryDiagnostic(outcome.diagnostics) ??
        diagnostic("HOST_REJECTED", "The host rejected the command");
      showRejection(
        request.command,
        outcome.diagnostics,
        isRetryable(request.command, primary.code, "explicit"),
        outcome,
      );
      return "rejected";
    },
    [finishRequest, showRejection],
  );

  const rejectTimeout = useCallback(
    (request: ActiveRequest): CommandRequestResult => {
      const entry = diagnostic("COMMAND_TIMEOUT", "The host command timed out");
      request.controller.abort();
      finishRequest(request, "rejected", [entry]);
      showRejection(
        request.command,
        [entry],
        isRetryable(request.command, "COMMAND_TIMEOUT", "timeout"),
      );
      return "rejected";
    },
    [finishRequest, showRejection],
  );

  const rejectThrown = useCallback(
    (request: ActiveRequest): CommandRequestResult => {
      const entry = diagnostic("HOST_REJECTED", "The host command failed");
      finishRequest(request, "rejected", [entry]);
      showRejection(
        request.command,
        [entry],
        isRetryable(request.command, "HOST_REJECTED", "thrown"),
      );
      return "rejected";
    },
    [finishRequest, showRejection],
  );

  const nextRequestId = useCallback((): string => {
    const base = requestIdFactory();
    if (!usedRequestIds.current.has(base)) {
      usedRequestIds.current.add(base);
      return base;
    }
    let suffix = 2;
    while (usedRequestIds.current.has(`${base}#${suffix}`)) suffix += 1;
    const next = `${base}#${suffix}`;
    usedRequestIds.current.add(next);
    return next;
  }, [requestIdFactory]);

  const localStateWithLatestItems = useCallback(
    (): PlannerState => ({
      ...state,
      model: { ...state.model, items: itemsRef.current },
    }),
    [state],
  );

  const applyLocal = useCallback(
    (request: ActiveRequest, outcome: Extract<CommandOutcome, { accepted: true }>): boolean => {
      const local = localCommandItems(localStateWithLatestItems(), request.command, createId);
      if (!local) return false;
      const effective: CommandOutcome =
        request.command.type === "paint" || (!outcome.updatedItems && !outcome.removedItemIds)
          ? {
              ...outcome,
              updatedItems: local.updatedItems,
              removedItemIds: local.removedItemIds,
            }
          : outcome;
      const previous = itemsRef.current;
      let applied = false;
      try {
        applied = state.applyLocalItems((items) => applyHostOutcome(items, effective));
      } catch {
        // The local array was replaced before onItemsChange threw. Treat the
        // apply as successful so a host callback error cannot become a rejection.
        applied = true;
      }
      if (!applied) return false;
      undoStack.current = [...undoStack.current.slice(-49), previous];
      redoStack.current = [];
      notifyCommitted(effective);
      return true;
    },
    [createId, localStateWithLatestItems, notifyCommitted, state],
  );

  const run = useCallback(
    async (command: PlannerCommand): Promise<CommandRequestResult> => {
      let local: ReturnType<typeof checkLocal>;
      try {
        local = checkLocal(state, command, {
          ...(input.readOnly ? { readOnly: true } : {}),
          ...(input.activeLayerId ? { activeLayerId: input.activeLayerId } : {}),
        });
      } catch {
        return rejectLocal(
          command,
          failure(command, "INVALID_COMMAND", "The command is malformed"),
        );
      }
      if (!local.ok) return rejectLocal(command, local);

      let itemIds: string[];
      try {
        itemIds = commandItemIds(command);
      } catch {
        return rejectLocal(
          command,
          failure(command, "INVALID_COMMAND", "The command is malformed"),
        );
      }
      for (const pending of activeRequests.current.values()) {
        if (pending.itemIds.some((id) => itemIds.includes(id))) {
          return rejectLocal(
            command,
            failure(command, "INVALID_COMMAND", "A command is already pending for this item"),
          );
        }
      }

      const requestId = nextRequestId();
      const context = buildContext(requestId, input.baseRevision);
      const controller = new AbortController();
      let cancelRequest!: (result: "ignored") => void;
      const cancelled = new Promise<"ignored">((resolve) => {
        cancelRequest = resolve;
      });
      const request: ActiveRequest = {
        id: requestId,
        command,
        itemIds,
        phase: "validating",
        status: "active",
        controller,
        deadline: undefined,
        applicationTimer: undefined,
        outcome: undefined,
        cancel: cancelRequest,
        applicationResolve: undefined,
      };
      activeRequests.current.set(requestId, request);
      syncPending();
      if (mounted.current) {
        setFeedback(undefined);
        setNotices([]);
        setLastSettled(undefined);
      }

      if (command.type === "delete") {
        const confirm = input.confirmChange;
        let approved = false;
        try {
          if (confirm) {
            approved = await confirm(command);
          } else if (typeof window !== "undefined" && typeof window.confirm === "function") {
            approved = window.confirm(input.confirmDeleteMessage ?? "Delete this item?");
          } else {
            const result = failure(
              command,
              "CONFIRMATION_UNAVAILABLE",
              "No confirmation handler is available",
            );
            finishRequest(request, "rejected", [result.diagnostic]);
            showRejection(command, [result.diagnostic], result.feedback.retryable);
            return "rejected";
          }
        } catch {
          approved = false;
        }
        if (request.status !== "active") return "ignored";
        if (!approved) {
          finishRequest(request, "confirmation-denied", []);
          return "confirmation-denied";
        }
        if (!commandStillCurrent(itemsRef.current, command)) {
          const result = failure(command, "STALE_REVISION", "Item version is stale");
          return rejectDiagnostics(request, [result.diagnostic], "other");
        }
      }

      let deadlineFired = false;
      const deadline = new Promise<"timeout">((resolve) => {
        request.deadline = setTimeout(() => {
          deadlineFired = true;
          resolve("timeout");
        }, timeoutMs);
      });

      try {
        if (input.validateChange) {
          let validation: ValidationResult | "timeout" | "ignored";
          try {
            validation = await Promise.race([
              Promise.resolve(input.validateChange(command, context, controller.signal)),
              deadline,
              cancelled,
            ]);
          } catch (error) {
            if (request.status !== "active") return "ignored";
            if (isAbortError(error)) {
              return rejectDiagnostics(
                request,
                [diagnostic("COMMAND_ABORTED", "The host aborted validation")],
                "other",
              );
            }
            const entry = diagnostic("VALIDATION_ERROR", "Host validation failed");
            return rejectDiagnostics(request, [entry], "other");
          }
          if (request.status !== "active") return "ignored";
          if (validation === "timeout" && deadlineFired) return rejectTimeout(request);
          const normalized = normalizeValidation(validation);
          if (!normalized) {
            const entry = diagnostic(
              "VALIDATION_ERROR",
              "Host validation returned an invalid result",
            );
            return rejectDiagnostics(request, [entry], "other");
          }
          if (normalized.hasError) {
            return rejectDiagnostics(request, normalized.diagnostics, "other");
          }
          if (!normalized.permitted) {
            const diagnostics = [...normalized.diagnostics];
            if (!diagnostics.some((entry) => entry.level === "error")) {
              diagnostics.push(
                diagnostic("VALIDATION_ERROR", "Host validation rejected the command"),
              );
            }
            return rejectDiagnostics(request, diagnostics, "other");
          }
          addNotices(normalized.diagnostics);
          emitDiagnostics(normalized.diagnostics);
        }

        if (request.status !== "active") return "ignored";
        request.phase = "requesting";

        if (!input.onChangeRequest) {
          if (state.itemsControlled) {
            return rejectDiagnostics(
              request,
              [
                diagnostic(
                  "INVALID_COMMAND",
                  "A controlled command requires an onChangeRequest handler",
                ),
              ],
              "other",
            );
          }
          if (!commandStillCurrent(itemsRef.current, command)) {
            return rejectDiagnostics(
              request,
              [diagnostic("STALE_REVISION", "Item version is stale")],
              "other",
            );
          }
          if (!applyLocal(request, { accepted: true, revision: "local" })) {
            return rejectDiagnostics(
              request,
              [diagnostic("INVALID_COMMAND", "The command could not be applied")],
              "other",
            );
          }
          finishRequest(request, "accepted", []);
          return "accepted";
        }

        let response: CommandOutcome | "timeout" | "ignored";
        try {
          response = await Promise.race([
            Promise.resolve(input.onChangeRequest(command, context, controller.signal)),
            deadline,
            cancelled,
          ]);
        } catch (error) {
          if (request.status !== "active") return "ignored";
          if (isAbortError(error)) {
            return rejectDiagnostics(
              request,
              [diagnostic("COMMAND_ABORTED", "The host aborted the command")],
              "other",
            );
          }
          return rejectThrown(request);
        }
        if (request.status !== "active") return "ignored";
        if (response === "timeout" && deadlineFired) return rejectTimeout(request);

        const normalized = normalizeOutcome(response, command, state.itemsControlled);
        if (!normalized.ok) return rejectDiagnostics(request, [normalized.diagnostic], "thrown");
        const outcome = normalized.outcome;
        if (!outcome.accepted) return rejectOutcome(request, outcome);

        clearTimers(request);
        if (!state.itemsControlled) {
          if (!commandStillCurrent(itemsRef.current, command)) {
            return rejectDiagnostics(
              request,
              [diagnostic("STALE_REVISION", "Item version is stale")],
              "other",
            );
          }
          if (!applyLocal(request, outcome)) {
            return rejectDiagnostics(
              request,
              [diagnostic("INVALID_COMMAND", "The command could not be applied")],
              "other",
            );
          }
          finishRequest(request, "accepted", []);
          return "accepted";
        }

        notifyCommitted(outcome);
        request.outcome = outcome;
        request.phase = "applying";
        let resolveApplication!: (result: "accepted" | "accepted-not-applied" | "ignored") => void;
        const application = new Promise<"accepted" | "accepted-not-applied" | "ignored">(
          (resolve) => {
            resolveApplication = resolve;
          },
        );
        request.applicationResolve = resolveApplication;
        if (isApplied(itemsRef.current, command, outcome)) resolveApplication("accepted");
        request.applicationTimer = setTimeout(
          () => resolveApplication("accepted-not-applied"),
          timeoutMs,
        );
        const applicationResult = await Promise.race([application, cancelled]);
        if (request.status !== "active") return "ignored";
        if (applicationResult === "ignored") return "ignored";
        if (applicationResult === "accepted-not-applied") {
          const entry = diagnostic(
            "ACCEPTED_NOT_APPLIED",
            "The host accepted the change but did not apply it",
          );
          finishRequest(request, "accepted-not-applied", [entry]);
          if (mounted.current) {
            setFeedback({
              code: "ACCEPTED_NOT_APPLIED",
              level: "error",
              message: entry.message,
              command,
              retryable: false,
            });
          }
          emitDiagnostics([entry]);
          return "accepted-not-applied";
        }
        finishRequest(request, "accepted", []);
        return "accepted";
      } catch {
        if (request.status !== "active") return "ignored";
        return rejectThrown(request);
      } finally {
        clearTimers(request);
      }
    },
    [
      addNotices,
      applyLocal,
      clearTimers,
      emitDiagnostics,
      finishRequest,
      input,
      nextRequestId,
      notifyCommitted,
      rejectDiagnostics,
      rejectLocal,
      rejectOutcome,
      rejectThrown,
      rejectTimeout,
      showRejection,
      state,
      syncPending,
      timeoutMs,
    ],
  );

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      for (const request of activeRequests.current.values()) invalidateRequest(request);
      activeRequests.current.clear();
    };
  }, [invalidateRequest]);

  useEffect(() => {
    if (contextKeyRef.current === input.contextKey) return;
    contextKeyRef.current = input.contextKey;
    for (const request of activeRequests.current.values()) {
      if (request.phase !== "applying") invalidateRequest(request);
    }
  }, [input.contextKey, invalidateRequest]);

  useEffect(() => {
    for (const request of activeRequests.current.values()) {
      if (request.phase === "validating" && !commandStillCurrent(state.items, request.command)) {
        invalidateRequest(request);
      }
      if (
        request.phase === "applying" &&
        request.outcome &&
        isApplied(state.items, request.command, request.outcome)
      ) {
        request.applicationResolve?.("accepted");
      }
    }
  }, [invalidateRequest, state.items]);

  const requestCommand = useCallback((command: PlannerCommand) => run(command), [run]);

  const requestUndo = useCallback(() => {
    if (input.readOnly) {
      input.onDiagnostic?.(diagnostic("READ_ONLY", "Undo is disabled in read-only mode"));
      return;
    }
    if (state.itemsControlled) {
      input.onDiagnostic?.(diagnostic("UNDO_UNAVAILABLE", "Undo is host-owned"));
      return;
    }
    const previous = undoStack.current.pop();
    if (!previous) return;
    redoStack.current = [...redoStack.current.slice(-49), itemsRef.current];
    state.applyLocalItems(previous);
  }, [input, state]);

  const requestRedo = useCallback(() => {
    if (input.readOnly) {
      input.onDiagnostic?.(diagnostic("READ_ONLY", "Redo is disabled in read-only mode"));
      return;
    }
    if (state.itemsControlled) {
      input.onDiagnostic?.(diagnostic("UNDO_UNAVAILABLE", "Redo is host-owned"));
      return;
    }
    const next = redoStack.current.pop();
    if (!next) return;
    undoStack.current = [...undoStack.current.slice(-49), itemsRef.current];
    state.applyLocalItems(next);
  }, [input, state]);

  const retry = useCallback(() => {
    if (!feedback?.retryable) return Promise.resolve(undefined);
    return run(feedback.command);
  }, [feedback, run]);

  const dismiss = useCallback(() => {
    setFeedback(undefined);
    setNotices([]);
  }, []);

  return useMemo(
    () => ({
      pendingItemIds,
      feedback,
      notices,
      lastSettled,
      requestCommand,
      retry,
      dismiss,
      requestUndo,
      requestRedo,
    }),
    [
      dismiss,
      feedback,
      lastSettled,
      notices,
      pendingItemIds,
      requestCommand,
      requestRedo,
      requestUndo,
      retry,
    ],
  );
}
