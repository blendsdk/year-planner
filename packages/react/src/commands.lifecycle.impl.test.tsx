import type {
  CommandContext,
  CommandOutcome,
  PlannerItem,
  PlannerLayer,
} from "@blendsdk/year-planner-core";
import { render, waitFor } from "@testing-library/react";
import { act, createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import type { YearPlannerHandle, YearPlannerProps } from "./types";
import { YearPlanner } from "./YearPlanner";

const layer: PlannerLayer = {
  id: "ribbon",
  name: "Ribbon",
  channel: "ribbon",
  color: "#1d4e89",
};

const item = (id = "a", version = 1): PlannerItem => ({
  id,
  kind: "activity",
  layerId: "ribbon",
  period: { kind: "all-day", startDate: "2016-01-04", endDateExclusive: "2016-01-08" },
  title: id,
  version,
});

const move = (itemId = "a", version = 1) => ({
  type: "move" as const,
  itemId,
  proposedPeriod: {
    kind: "all-day" as const,
    startDate: "2016-01-11",
    endDateExclusive: "2016-01-15",
  },
  expectedVersion: version,
});

const accepted: CommandOutcome = { accepted: true, revision: "1" };

function malformedOutcome(value: unknown): CommandOutcome {
  // @ts-expect-error - runtime hosts are untyped; this test exercises normalization.
  return value;
}

function harness(overrides: Partial<YearPlannerProps> = {}) {
  const ref = createRef<YearPlannerHandle>();
  const onCommitted = vi.fn();
  const onRejected = vi.fn();
  const onDiagnostic = vi.fn();
  const onItemsChange = vi.fn();
  const view = render(
    <YearPlanner
      ref={ref}
      year={2016}
      layers={[layer]}
      defaultItems={[item()]}
      onChangeCommitted={onCommitted}
      onChangeRejected={onRejected}
      onDiagnostic={onDiagnostic}
      onItemsChange={onItemsChange}
      {...overrides}
    />,
  );
  return { ref, onCommitted, onRejected, onDiagnostic, onItemsChange, ...view };
}

describe("RD-08 lifecycle internals", () => {
  it("settles a synchronous accepted response exactly once", async () => {
    const { ref, onCommitted } = harness({
      onChangeRequest: () => accepted,
    });
    act(() => ref.current?.requestCommand(move()));
    await waitFor(() => expect(onCommitted).toHaveBeenCalledTimes(1));
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(onCommitted).toHaveBeenCalledTimes(1);
  });

  it("normalizes an unknown diagnostic code to HOST_REJECTED", async () => {
    const { ref, onDiagnostic, onRejected } = harness({
      onChangeRequest: () =>
        malformedOutcome({
          accepted: false,
          diagnostics: [{ code: "NOT_A_REAL_CODE", level: "error", message: "Rejected" }],
        }),
    });
    act(() => ref.current?.requestCommand(move()));
    await waitFor(() => expect(onRejected).toHaveBeenCalledTimes(1));
    expect(onDiagnostic).toHaveBeenCalledWith(expect.objectContaining({ code: "HOST_REJECTED" }));
  });

  it("rejects an accepted outcome with a malformed item payload", async () => {
    const { ref, onDiagnostic, onItemsChange } = harness({
      onChangeRequest: () =>
        malformedOutcome({
          accepted: true,
          revision: "1",
          updatedItems: [{ id: "a" }],
        }),
    });
    act(() => ref.current?.requestCommand(move()));
    await waitFor(() =>
      expect(onDiagnostic).toHaveBeenCalledWith(expect.objectContaining({ code: "HOST_REJECTED" })),
    );
    expect(onItemsChange).not.toHaveBeenCalled();
  });

  it("reuses no request ID when the factory repeats a value", async () => {
    const contexts: CommandContext[] = [];
    const { ref } = harness({
      interaction: { requestId: () => "same-id" },
      onChangeRequest: (_command, context) => {
        contexts.push(context);
        return accepted;
      },
    });
    act(() => ref.current?.requestCommand(move()));
    await waitFor(() => expect(contexts).toHaveLength(1));
    act(() => ref.current?.requestCommand(move("a", 2)));
    await waitFor(() => expect(contexts).toHaveLength(2));
    expect(contexts.map((context) => context.requestId)).toEqual(["same-id", "same-id#2"]);
  });

  it("does not call callbacks for an abort-ignoring host after unmount", async () => {
    let signal: AbortSignal | undefined;
    const onCommitted = vi.fn();
    const onRejected = vi.fn();
    const { ref, unmount } = harness({
      onChangeRequest: (_command, _context, received) => {
        signal = received;
        return new Promise<CommandOutcome>(() => {});
      },
      onChangeCommitted: onCommitted,
      onChangeRejected: onRejected,
    });
    act(() => ref.current?.requestCommand(move()));
    await waitFor(() => expect(signal).toBeDefined());
    unmount();
    expect(signal?.aborted).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(onCommitted).not.toHaveBeenCalled();
    expect(onRejected).not.toHaveBeenCalled();
  });

  it("keeps an unrelated item request alive when another item settles", async () => {
    const contexts: CommandContext[] = [];
    const { ref, onCommitted } = harness({
      defaultItems: [item("a"), item("b")],
      onChangeRequest: (_command, context) => {
        contexts.push(context);
        return accepted;
      },
    });
    act(() => ref.current?.requestCommand(move("a")));
    act(() => ref.current?.requestCommand(move("b")));
    await waitFor(() => expect(onCommitted).toHaveBeenCalledTimes(2));
    expect(contexts).toHaveLength(2);
  });
});
