import type { CommandSettlement } from "./commands.js";

/** Visible and announced form of the current command state. */
export interface CommandStatusView {
  /** Short visible text. */
  text: string;
  /** Visual severity. */
  level: "info" | "success" | "warning" | "error";
  /** Live-region politeness for the announcement. */
  announcement: "polite" | "assertive" | "none";
}

const ERROR_PREFIX: Record<string, string> = {
  COMMAND_TIMEOUT: "Change timed out",
  COMMAND_ABORTED: "Change aborted",
  STALE_REVISION: "Change is stale",
  HOST_REJECTED: "Change rejected",
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
export function commandStatusView(input: {
  pending: boolean;
  settled: CommandSettlement | undefined;
}): CommandStatusView | undefined {
  if (input.pending) {
    return { text: "Change pending", level: "info", announcement: "polite" };
  }
  const settled = input.settled;
  if (!settled) return undefined;
  if (settled.result === "accepted") {
    return { text: "Change accepted", level: "success", announcement: "polite" };
  }
  if (settled.result === "accepted-not-applied") {
    return {
      text: "Change accepted but not applied",
      level: "warning",
      announcement: "polite",
    };
  }
  if (settled.result === "confirmation-denied") {
    return { text: "Change cancelled", level: "info", announcement: "polite" };
  }
  if (settled.result === "rejected") {
    const primary = settled.diagnostics[0];
    const prefix = ERROR_PREFIX[primary?.code ?? ""] ?? "Change rejected";
    const message = primary?.message?.trim() || "The host rejected the change";
    return {
      text: `${prefix}: ${message}`,
      level: "error",
      announcement: "assertive",
    };
  }
  return undefined;
}
