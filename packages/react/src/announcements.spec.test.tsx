import type { PlannerCommand } from "@blendsdk/year-planner-core";
import { describe, expect, it } from "vitest";
import { commandStatusView } from "./announcements.js";
import type { CommandSettlement } from "./commands.js";

const command: PlannerCommand = {
  type: "move",
  itemId: "booking",
  expectedVersion: 1,
  proposedPeriod: {
    kind: "all-day",
    startDate: "2027-02-01",
    endDateExclusive: "2027-02-03",
  },
};

function settled(
  result: CommandSettlement["result"],
  code?: string,
  message = "message",
): CommandSettlement {
  return {
    result,
    command,
    diagnostics: code === undefined ? [] : [{ code: code as never, level: "error", message }],
  };
}

describe("command status mapping", () => {
  it("prefers the pending state", () => {
    expect(commandStatusView({ pending: true, settled: settled("accepted") })).toEqual({
      text: "Change pending",
      level: "info",
      announcement: "polite",
    });
  });

  it("maps accepted, not-applied and cancelled outcomes", () => {
    expect(commandStatusView({ pending: false, settled: settled("accepted") })).toMatchObject({
      text: "Change accepted",
      level: "success",
      announcement: "polite",
    });
    expect(
      commandStatusView({ pending: false, settled: settled("accepted-not-applied") }),
    ).toMatchObject({
      text: "Change accepted but not applied",
      level: "warning",
      announcement: "polite",
    });
    expect(
      commandStatusView({ pending: false, settled: settled("confirmation-denied") }),
    ).toMatchObject({
      text: "Change cancelled",
      level: "info",
      announcement: "polite",
    });
  });

  it("names timeout, aborted, stale and host rejection as assertive errors", () => {
    const cases = [
      ["COMMAND_TIMEOUT", "Change timed out: message"],
      ["COMMAND_ABORTED", "Change aborted: message"],
      ["STALE_REVISION", "Change is stale: message"],
      ["HOST_REJECTED", "Change rejected: message"],
      ["CAPACITY_EXCEEDED", "Change rejected: message"],
    ] as const;
    for (const [code, text] of cases) {
      expect(commandStatusView({ pending: false, settled: settled("rejected", code) })).toEqual({
        text,
        level: "error",
        announcement: "assertive",
      });
    }
  });

  it("returns undefined for ignored or missing settlements", () => {
    expect(commandStatusView({ pending: false, settled: undefined })).toBeUndefined();
    expect(commandStatusView({ pending: false, settled: settled("ignored") })).toBeUndefined();
  });
});
