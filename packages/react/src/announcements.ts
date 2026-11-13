import type { CommandSettlement } from "./commands.js";
import { defaultPlannerMessages, type PlannerMessages } from "./messages.js";

/**
 * Visible and announced form of the current command state.
 */
export interface CommandStatusView {
  /** Short visible text. */
  text: string;
  /** Visual severity. */
  level: "info" | "success" | "warning" | "error";
  /** Live-region politeness for the announcement. */
  announcement: "polite" | "assertive" | "none";
}

const ERROR_CODE_KEYS: Record<
  string,
  keyof Pick<
    PlannerMessages,
    "commandTimedOut" | "commandAborted" | "commandStale" | "commandRejected"
  >
> = {
  COMMAND_TIMEOUT: "commandTimedOut",
  COMMAND_ABORTED: "commandAborted",
  STALE_REVISION: "commandStale",
  HOST_REJECTED: "commandRejected",
};

/**
 * Maps the pipeline state to visible and announced status text.
 *
 * Pending wins over the previous settlement. A rejection is assertive because a
 * failed change needs immediate attention; accepted and cancelled outcomes stay
 * polite. `ignored` settlements are lifecycle noise and produce no status.
 *
 * @param input - Current pending flag and last settlement.
 * @returns The status view, or `undefined` when there is nothing to show.
 *
 * @example
 * ```ts
 * commandStatusView({
 *   pending: false,
 *   settled: { result: "accepted", command, diagnostics: [] },
 * });
 * // { text: "Change accepted", level: "success", announcement: "polite" }
 * ```
 */
export function commandStatusView(
  input: {
    pending: boolean;
    settled: CommandSettlement | undefined;
  },
  messages: PlannerMessages = defaultPlannerMessages,
): CommandStatusView | undefined {
  if (input.pending) {
    return { text: messages.commandPending, level: "info", announcement: "polite" };
  }
  const settled = input.settled;
  if (!settled) return undefined;
  if (settled.result === "accepted") {
    return { text: messages.commandAccepted, level: "success", announcement: "polite" };
  }
  if (settled.result === "accepted-not-applied") {
    return {
      text: messages.commandAcceptedNotApplied,
      level: "warning",
      announcement: "polite",
    };
  }
  if (settled.result === "confirmation-denied") {
    return { text: messages.commandCancelled, level: "info", announcement: "polite" };
  }
  if (settled.result === "rejected") {
    const primary = settled.diagnostics[0];
    const key = ERROR_CODE_KEYS[primary?.code ?? ""] ?? "commandRejected";
    const message = primary?.message?.trim() || messages.commandHostRejected;
    return {
      text: `${messages[key]}: ${message}`,
      level: "error",
      announcement: "assertive",
    };
  }
  return undefined;
}
