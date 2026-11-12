import type {
  CommandContext,
  CommandOutcome,
  Diagnostic,
  DiagnosticCode,
  DiagnosticLevel,
  PlannerCommand,
  PlannerItem,
  ValidationResult,
} from "@blendsdk/year-planner-core";
import type { PlannerState } from "../state.js";

/**
 * Feedback shown for a rejected, timed-out or unapplied command.
 * @public
 */
export interface CommandFeedback {
  /** Stable diagnostic code. */
  code: DiagnosticCode;
  /** Highest severity among the diagnostics that produced the feedback. */
  level: DiagnosticLevel;
  /** Human-readable message; never HTML. */
  message: string;
  /** The command that failed. */
  command: PlannerCommand;
  /** Whether the inspector may offer a retry. */
  retryable: boolean;
}

/**
 * Terminal result of a command request.
 * @public
 */
export type CommandRequestResult =
  | "accepted"
  | "rejected"
  | "accepted-not-applied"
  | "ignored"
  | "confirmation-denied";

/**
 * The last terminal result, used by the command-status announcer.
 * @public
 */
export interface CommandSettlement {
  /** Terminal result. */
  result: CommandRequestResult;
  /** Command that produced the result. */
  command: PlannerCommand;
  /** Diagnostics that explain the result; empty for a clean acceptance. */
  diagnostics: Diagnostic[];
}

/**
 * Inputs for the command request pipeline.
 * @public
 */
export interface CommandPipelineInput {
  /** Planner state that owns items, visibility, filter and selection. */
  state: PlannerState;
  /** Global read-only guardrail. */
  readOnly?: boolean;
  /** Layer that accepts paint/create commands. */
  activeLayerId?: string;
  /** Factory for new item IDs. */
  createId?: () => string;
  /** Factory for request IDs. */
  requestId?: () => string;
  /** Command timeout in milliseconds; defaults to 15000. */
  commandTimeoutMs?: number;
  /** Optional host-wide revision token. */
  baseRevision?: string;
  /** Layout/visibility/filter/mode signature; item changes are checked separately. */
  contextKey?: string;
  /** Confirmation hook for destructive commands. */
  confirmChange?: (command: PlannerCommand) => boolean | Promise<boolean>;
  /** Host validation for a proposed command. */
  validateChange?: (
    command: PlannerCommand,
    context: CommandContext,
    signal?: AbortSignal,
  ) => ValidationResult | Promise<ValidationResult>;
  /** Host command request. */
  onChangeRequest?: (
    command: PlannerCommand,
    context: CommandContext,
    signal?: AbortSignal,
  ) => CommandOutcome | Promise<CommandOutcome>;
  /** Called with an accepted outcome. */
  onChangeCommitted?: (outcome: CommandOutcome) => void;
  /** Called with a rejected outcome. */
  onChangeRejected?: (outcome: CommandOutcome) => void;
  /** Receives normalized validation, command and terminal diagnostics. */
  onDiagnostic?: (diagnostic: Diagnostic) => void;
}

/**
 * Command pipeline state and actions.
 * @public
 */
export interface CommandPipeline {
  /** Item IDs with an active command. */
  pendingItemIds: ReadonlySet<string>;
  /** Failure feedback; `undefined` after an accepted or ignored result. */
  feedback: CommandFeedback | undefined;
  /** Non-blocking warning/info diagnostics, newest last, capped. */
  notices: readonly Diagnostic[];
  /** Last terminal result, consumed by the status announcer. */
  lastSettled: CommandSettlement | undefined;
  /** Requests a command and resolves with its terminal result. */
  requestCommand: (command: PlannerCommand) => Promise<CommandRequestResult>;
  /** Retries the failed command when the failure is replay-safe. */
  retry: () => Promise<CommandRequestResult | undefined>;
  /** Clears feedback and notices. */
  dismiss: () => void;
  /** Applies the previous uncontrolled snapshot. */
  requestUndo: () => void;
  /** Applies the next uncontrolled snapshot. */
  requestRedo: () => void;
}

/**
 * Local replacement set produced by the pure reducer.
 * @public
 */
export interface LocalCommandResult {
  /** New or changed items. */
  updatedItems: PlannerItem[];
  /** Removed source IDs. */
  removedItemIds: string[];
}
