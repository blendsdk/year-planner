import type { PlannerCommand } from "@blendsdk/year-planner-core";
import { describe, expect, it } from "vitest";
import { commandStatusView } from "./announcements.js";
import type { CommandSettlement } from "./commands.js";

const command: PlannerCommand = {
  type: "delete",
  itemId: "booking",
  expectedVersion: 1,
};

function settlement(
  result: CommandSettlement["result"],
  diagnostics: CommandSettlement["diagnostics"] = [],
): CommandSettlement {
  return { result, command, diagnostics };
}

describe("command status internals", () => {
  it("falls back to the default rejection message when diagnostics are empty", () => {
    expect(commandStatusView({ pending: false, settled: settlement("rejected") })).toMatchObject({
      text: "Change rejected: The host rejected the change",
      level: "error",
    });
  });

  it("falls back to the generic rejection prefix for an unknown code", () => {
    expect(
      commandStatusView({
        pending: false,
        settled: settlement("rejected", [
          { code: "SOMETHING_NEW" as never, level: "error", message: "Try later" },
        ]),
      }),
    ).toMatchObject({ text: "Change rejected: Try later" });
  });

  it("returns an identical view for repeated identical settlements", () => {
    const one = commandStatusView({ pending: false, settled: settlement("accepted") });
    const two = commandStatusView({ pending: false, settled: settlement("accepted") });
    expect(one).toEqual(two);
  });

  it("keeps pending ahead of a stale settlement", () => {
    expect(
      commandStatusView({
        pending: true,
        settled: settlement("rejected", [
          { code: "HOST_REJECTED" as never, level: "error", message: "Old" },
        ]),
      }),
    ).toMatchObject({ text: "Change pending" });
  });
});
