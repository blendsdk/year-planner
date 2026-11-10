import type {
  CommandContext,
  CommandOutcome,
  PlannerCommand,
  PlannerItem,
  PlannerLayer,
} from "@blendsdk/year-planner-core";
import { render, waitFor } from "@testing-library/react";
import { act, createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import type { YearPlannerHandle } from "./types";
import { YearPlanner } from "./YearPlanner";

const layers: PlannerLayer[] = [
  { id: "ribbon", name: "Ribbon", channel: "ribbon", color: "#1d4e89" },
];

const item = (id = "a"): PlannerItem => ({
  id,
  kind: "activity",
  layerId: "ribbon",
  period: { kind: "all-day", startDate: "2016-01-04", endDateExclusive: "2016-01-08" },
  title: id,
  version: 1,
});

const move = (itemId = "a", version = 1): Parameters<YearPlannerHandle["requestCommand"]>[0] => ({
  type: "move",
  itemId,
  proposedPeriod: { kind: "all-day", startDate: "2016-01-11", endDateExclusive: "2016-01-15" },
  expectedVersion: version,
});

describe("command pipeline internals", () => {
  it("uses the host request-ID factory", async () => {
    const onChangeRequest = vi.fn((): CommandOutcome => ({ accepted: true, revision: "1" }));
    const ref = createRef<YearPlannerHandle>();
    render(
      <YearPlanner
        ref={ref}
        year={2016}
        layers={layers}
        defaultItems={[item()]}
        interaction={{ requestId: () => "request-7" }}
        onChangeRequest={onChangeRequest}
      />,
    );
    act(() => ref.current?.requestCommand(move()));
    await waitFor(() => expect(onChangeRequest).toHaveBeenCalled());
    expect(onChangeRequest).toHaveBeenCalledWith(expect.anything(), { requestId: "request-7" });
  });

  it("blocks a second command for a pending item", async () => {
    let resolveFirst: ((outcome: CommandOutcome) => void) | undefined;
    const onChangeRequest = vi.fn(
      () =>
        new Promise<CommandOutcome>((resolve) => {
          resolveFirst = resolve;
        }),
    );
    const onDiagnostic = vi.fn();
    const ref = createRef<YearPlannerHandle>();
    render(
      <YearPlanner
        ref={ref}
        year={2016}
        layers={layers}
        defaultItems={[item()]}
        onChangeRequest={onChangeRequest}
        onDiagnostic={onDiagnostic}
      />,
    );
    act(() => ref.current?.requestCommand(move()));
    act(() => ref.current?.requestCommand(move()));
    await waitFor(() =>
      expect(onDiagnostic).toHaveBeenCalledWith(
        expect.objectContaining({ code: "INVALID_COMMAND" }),
      ),
    );
    resolveFirst?.({ accepted: true, revision: "1" });
  });

  it("applies a host acceptance without payload in uncontrolled mode", async () => {
    const onItemsChange = vi.fn();
    const ref = createRef<YearPlannerHandle>();
    render(
      <YearPlanner
        ref={ref}
        year={2016}
        layers={layers}
        defaultItems={[item()]}
        onItemsChange={onItemsChange}
        onChangeRequest={() => ({ accepted: true, revision: "1" })}
      />,
    );
    act(() => ref.current?.requestCommand(move()));
    await waitFor(() => expect(onItemsChange).toHaveBeenCalled());
    const next = onItemsChange.mock.calls[0]?.[0] as PlannerItem[];
    expect(next[0]?.period).toEqual({
      kind: "all-day",
      startDate: "2016-01-11",
      endDateExclusive: "2016-01-15",
    });
    expect(next[0]?.version).toBe(2);
  });

  it("does not call the host when validation denies", async () => {
    const onChangeRequest = vi.fn();
    const ref = createRef<YearPlannerHandle>();
    render(
      <YearPlanner
        ref={ref}
        year={2016}
        layers={layers}
        defaultItems={[item()]}
        validateChange={() => ({ permitted: false, diagnostics: [] })}
        onChangeRequest={onChangeRequest}
      />,
    );
    act(() => ref.current?.requestCommand(move()));
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(onChangeRequest).not.toHaveBeenCalled();
  });

  it("ignores a late settlement after timeout", async () => {
    let resolveLate: ((outcome: CommandOutcome) => void) | undefined;
    const onCommitted = vi.fn();
    const onDiagnostic = vi.fn();
    const ref = createRef<YearPlannerHandle>();
    render(
      <YearPlanner
        ref={ref}
        year={2016}
        layers={layers}
        defaultItems={[item()]}
        interaction={{ commandTimeoutMs: 10 }}
        onChangeRequest={() =>
          new Promise<CommandOutcome>((resolve) => {
            resolveLate = resolve;
          })
        }
        onChangeCommitted={onCommitted}
        onDiagnostic={onDiagnostic}
      />,
    );
    act(() => ref.current?.requestCommand(move()));
    await waitFor(() =>
      expect(onDiagnostic).toHaveBeenCalledWith(
        expect.objectContaining({ code: "COMMAND_TIMEOUT" }),
      ),
    );
    resolveLate?.({ accepted: true, revision: "late" });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(onCommitted).not.toHaveBeenCalled();
  });

  it("ignores undo when the stack is empty", () => {
    const ref = createRef<YearPlannerHandle>();
    render(<YearPlanner ref={ref} year={2016} layers={layers} defaultItems={[item()]} />);
    expect(() => act(() => ref.current?.requestUndo())).not.toThrow();
  });
});
