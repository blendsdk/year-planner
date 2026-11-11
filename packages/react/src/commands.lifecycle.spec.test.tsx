import type {
  CommandContext,
  CommandOutcome,
  PlannerCommand,
  PlannerItem,
  PlannerLayer,
  ValidationResult,
} from "@blendsdk/year-planner-core";
import { render, waitFor } from "@testing-library/react";
import { act, createRef, type ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import type { YearPlannerHandle, YearPlannerProps } from "./types";
import { YearPlanner } from "./YearPlanner";

const ribbonLayer: PlannerLayer = {
  id: "ribbon",
  name: "Ribbon",
  channel: "ribbon",
  color: "#1d4e89",
};

const highlightLayer: PlannerLayer = {
  id: "highlight",
  name: "Highlight",
  channel: "highlight",
  color: "#ffd166",
};

const layers = [ribbonLayer, highlightLayer];

const item = (id: string, overrides: Partial<PlannerItem> = {}): PlannerItem => ({
  id,
  kind: "activity",
  layerId: "ribbon",
  period: { kind: "all-day", startDate: "2016-01-04", endDateExclusive: "2016-01-08" },
  title: id,
  version: 1,
  ...overrides,
});

const move = (itemId = "a", version = 1): PlannerCommand => ({
  type: "move",
  itemId,
  proposedPeriod: {
    kind: "all-day",
    startDate: "2016-01-11",
    endDateExclusive: "2016-01-15",
  },
  expectedVersion: version,
});

const accepted: CommandOutcome = { accepted: true, revision: "1" };

function deferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

interface PlannerHarness {
  ref: React.RefObject<YearPlannerHandle | null>;
  rerender: (extra?: Partial<YearPlannerProps>) => void;
  unmount: () => void;
  container: HTMLElement;
}

function renderPlanner(overrides: Partial<YearPlannerProps> = {}): PlannerHarness {
  const ref = createRef<YearPlannerHandle>();
  const element = (extra: Partial<YearPlannerProps> = {}): ReactElement => (
    <YearPlanner
      ref={ref}
      year={2016}
      layers={layers}
      defaultItems={[item("a")]}
      {...overrides}
      {...extra}
    />
  );
  const view = render(element());
  return {
    ref,
    rerender: (extra = {}) => view.rerender(element(extra)),
    unmount: view.unmount,
    container: view.container,
  };
}

function malformedOutcome(value: unknown): CommandOutcome {
  // @ts-expect-error - runtime hosts are untyped; this test exercises normalization.
  return value;
}

describe("RD-08 request context and validation", () => {
  it("uses the request ID factory", async () => {
    let context: CommandContext | undefined;
    const harness = renderPlanner({
      interaction: { requestId: () => "request-7" },
      onChangeRequest: (_command, received) => {
        context = received;
        return accepted;
      },
    });
    act(() => harness.ref.current?.requestCommand(move()));
    await waitFor(() => expect(context?.requestId).toBe("request-7"));
    expect(context).toEqual({ requestId: "request-7" });
  });

  it("includes baseRevision when supplied", async () => {
    const contexts: CommandContext[] = [];
    const harness = renderPlanner({
      baseRevision: "rev-9",
      onChangeRequest: (_command, context) => {
        contexts.push(context);
        return accepted;
      },
    });
    act(() => harness.ref.current?.requestCommand(move()));
    await waitFor(() => expect(contexts).toHaveLength(1));
    expect(contexts[0]).toEqual({ requestId: expect.any(String), baseRevision: "rev-9" });
  });

  it("omits baseRevision when it is not supplied", async () => {
    let context: CommandContext | undefined;
    const harness = renderPlanner({
      onChangeRequest: (_command, received) => {
        context = received;
        return accepted;
      },
    });
    act(() => harness.ref.current?.requestCommand(move()));
    await waitFor(() => expect(context).toBeDefined());
    expect(context).not.toHaveProperty("baseRevision");
  });

  it("uses the current baseRevision for each command", async () => {
    const contexts: CommandContext[] = [];
    const harness = renderPlanner({
      baseRevision: "a",
      onChangeRequest: (_command, context) => {
        contexts.push(context);
        return accepted;
      },
    });
    act(() => harness.ref.current?.requestCommand(move()));
    await waitFor(() => expect(contexts).toHaveLength(1));
    harness.rerender({ baseRevision: "b" });
    act(() => harness.ref.current?.requestCommand(move("a", 2)));
    await waitFor(() => expect(contexts).toHaveLength(2));
    expect(contexts[0]?.baseRevision).toBe("a");
    expect(contexts[1]?.baseRevision).toBe("b");
  });

  it("runs local checks before host validation", async () => {
    const onChangeRequest = vi.fn();
    const validateChange = vi.fn();
    const onDiagnostic = vi.fn();
    const harness = renderPlanner({
      readOnly: true,
      onChangeRequest,
      validateChange,
      onDiagnostic,
    });
    act(() => harness.ref.current?.requestCommand(move()));
    await waitFor(() =>
      expect(onDiagnostic).toHaveBeenCalledWith(expect.objectContaining({ code: "READ_ONLY" })),
    );
    expect(validateChange).not.toHaveBeenCalled();
    expect(onChangeRequest).not.toHaveBeenCalled();
  });

  it("runs a synchronous host validation before the request", async () => {
    const onChangeRequest = vi.fn(() => accepted);
    const onCommitted = vi.fn();
    const harness = renderPlanner({
      validateChange: () => ({ permitted: true, diagnostics: [] }),
      onChangeRequest,
      onChangeCommitted: onCommitted,
    });
    act(() => harness.ref.current?.requestCommand(move()));
    await waitFor(() => expect(onCommitted).toHaveBeenCalledTimes(1));
    expect(onChangeRequest).toHaveBeenCalledTimes(1);
  });

  it("waits for an asynchronous host validation", async () => {
    const validation = deferred<ValidationResult>();
    const onChangeRequest = vi.fn(() => accepted);
    const harness = renderPlanner({
      validateChange: () => validation.promise,
      onChangeRequest,
    });
    act(() => harness.ref.current?.requestCommand(move()));
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(onChangeRequest).not.toHaveBeenCalled();
    validation.resolve({ permitted: true, diagnostics: [] });
    await waitFor(() => expect(onChangeRequest).toHaveBeenCalledTimes(1));
  });

  it("blocks an error diagnostic even when permitted is true", async () => {
    const onChangeRequest = vi.fn();
    const onRejected = vi.fn();
    const onDiagnostic = vi.fn();
    const harness = renderPlanner({
      validateChange: () => ({
        permitted: true,
        diagnostics: [{ code: "CAPACITY_EXCEEDED", level: "error", message: "Full" }],
      }),
      onChangeRequest,
      onChangeRejected: onRejected,
      onDiagnostic,
    });
    act(() => harness.ref.current?.requestCommand(move()));
    await waitFor(() => expect(onRejected).toHaveBeenCalledTimes(1));
    expect(onChangeRequest).not.toHaveBeenCalled();
    expect(onDiagnostic).toHaveBeenCalledWith(
      expect.objectContaining({ code: "CAPACITY_EXCEEDED" }),
    );
  });

  it("allows a warning diagnostic and displays it", async () => {
    const onChangeRequest = vi.fn(() => accepted);
    const onCommitted = vi.fn();
    const onDiagnostic = vi.fn();
    const harness = renderPlanner({
      validateChange: () => ({
        permitted: true,
        diagnostics: [{ code: "INVALID_RANGE", level: "warning", message: "Check the range" }],
      }),
      onChangeRequest,
      onChangeCommitted: onCommitted,
      onDiagnostic,
    });
    act(() => harness.ref.current?.requestCommand(move()));
    await waitFor(() => expect(onCommitted).toHaveBeenCalledTimes(1));
    expect(onDiagnostic).toHaveBeenCalledWith(expect.objectContaining({ level: "warning" }));
  });

  it("synthesizes VALIDATION_ERROR when validation denies without diagnostics", async () => {
    const onRejected = vi.fn();
    const harness = renderPlanner({
      validateChange: () => ({ permitted: false, diagnostics: [] }),
      onChangeRejected: onRejected,
    });
    act(() => harness.ref.current?.requestCommand(move()));
    await waitFor(() => expect(onRejected).toHaveBeenCalledTimes(1));
    expect(onRejected.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        accepted: false,
        diagnostics: [expect.objectContaining({ code: "VALIDATION_ERROR" })],
      }),
    );
  });

  it("maps a thrown validation to a generic VALIDATION_ERROR", async () => {
    const onChangeRequest = vi.fn();
    const onDiagnostic = vi.fn();
    const harness = renderPlanner({
      validateChange: () => {
        throw new Error("secret validation detail");
      },
      onChangeRequest,
      onDiagnostic,
    });
    act(() => harness.ref.current?.requestCommand(move()));
    await waitFor(() =>
      expect(onDiagnostic).toHaveBeenCalledWith(
        expect.objectContaining({ code: "VALIDATION_ERROR" }),
      ),
    );
    expect(onChangeRequest).not.toHaveBeenCalled();
    expect(harness.container.textContent).not.toContain("secret validation detail");
  });

  it("times out host validation and aborts its signal", async () => {
    let signal: AbortSignal | undefined;
    const onChangeRequest = vi.fn();
    const onDiagnostic = vi.fn();
    const harness = renderPlanner({
      interaction: { commandTimeoutMs: 20 },
      validateChange: (_command, _context, received) => {
        signal = received;
        return new Promise<ValidationResult>(() => {});
      },
      onChangeRequest,
      onDiagnostic,
    });
    act(() => harness.ref.current?.requestCommand(move()));
    await waitFor(() =>
      expect(onDiagnostic).toHaveBeenCalledWith(
        expect.objectContaining({ code: "COMMAND_TIMEOUT" }),
      ),
    );
    expect(signal?.aborted).toBe(true);
    expect(onChangeRequest).not.toHaveBeenCalled();
  });

  it("times out the host request and aborts its signal", async () => {
    let signal: AbortSignal | undefined;
    const onDiagnostic = vi.fn();
    const onRejected = vi.fn();
    const harness = renderPlanner({
      interaction: { commandTimeoutMs: 20 },
      onChangeRequest: (_command, _context, received) => {
        signal = received;
        return new Promise<CommandOutcome>(() => {});
      },
      onDiagnostic,
      onChangeRejected: onRejected,
    });
    act(() => harness.ref.current?.requestCommand(move()));
    await waitFor(() =>
      expect(onDiagnostic).toHaveBeenCalledWith(
        expect.objectContaining({ code: "COMMAND_TIMEOUT" }),
      ),
    );
    expect(signal?.aborted).toBe(true);
    expect(onRejected).toHaveBeenCalledTimes(1);
  });

  it("ignores a late accepted response after a timeout", async () => {
    const response = deferred<CommandOutcome>();
    const onCommitted = vi.fn();
    const onDiagnostic = vi.fn();
    const harness = renderPlanner({
      interaction: { commandTimeoutMs: 20 },
      onChangeRequest: () => response.promise,
      onChangeCommitted: onCommitted,
      onDiagnostic,
    });
    act(() => harness.ref.current?.requestCommand(move()));
    await waitFor(() =>
      expect(onDiagnostic).toHaveBeenCalledWith(
        expect.objectContaining({ code: "COMMAND_TIMEOUT" }),
      ),
    );
    response.resolve(accepted);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(onCommitted).not.toHaveBeenCalled();
  });

  it("keeps concurrent request IDs distinct when the factory collides", async () => {
    const first = deferred<CommandOutcome>();
    const second = deferred<CommandOutcome>();
    const contexts: CommandContext[] = [];
    let call = 0;
    const harness = renderPlanner({
      defaultItems: [item("a"), item("b")],
      interaction: { requestId: () => "same-id" },
      onChangeRequest: (_command, context) => {
        contexts.push(context);
        call += 1;
        return call === 1 ? first.promise : second.promise;
      },
    });
    act(() => harness.ref.current?.requestCommand(move("a")));
    act(() => harness.ref.current?.requestCommand(move("b")));
    await waitFor(() => expect(contexts).toHaveLength(2));
    expect(new Set(contexts.map((context) => context.requestId)).size).toBe(2);
    first.resolve(accepted);
    second.resolve(accepted);
  });

  it("invalidates a validating request when an affected item changes", async () => {
    const validation = deferred<ValidationResult>();
    const onChangeRequest = vi.fn();
    const onCommitted = vi.fn();
    const onRejected = vi.fn();
    const harness = renderPlanner({
      items: [item("a")],
      validateChange: () => validation.promise,
      onChangeRequest,
      onChangeCommitted: onCommitted,
      onChangeRejected: onRejected,
    });
    act(() => harness.ref.current?.requestCommand(move()));
    harness.rerender({ items: [item("a", { version: 2 })] });
    validation.resolve({ permitted: true, diagnostics: [] });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(onChangeRequest).not.toHaveBeenCalled();
    expect(onCommitted).not.toHaveBeenCalled();
    expect(onRejected).not.toHaveBeenCalled();
  });

  it("invalidates a requesting request when the year window changes", async () => {
    const response = deferred<CommandOutcome>();
    const onCommitted = vi.fn();
    const onItemsChange = vi.fn();
    const harness = renderPlanner({
      onChangeRequest: () => response.promise,
      onChangeCommitted: onCommitted,
      onItemsChange,
    });
    act(() => harness.ref.current?.requestCommand(move()));
    harness.rerender({ year: 2017 });
    response.resolve(accepted);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(onCommitted).not.toHaveBeenCalled();
    expect(onItemsChange).not.toHaveBeenCalled();
  });

  it("invalidates a requesting request when the interaction mode changes", async () => {
    const response = deferred<CommandOutcome>();
    const onCommitted = vi.fn();
    const harness = renderPlanner({
      onChangeRequest: () => response.promise,
      onChangeCommitted: onCommitted,
    });
    act(() => harness.ref.current?.requestCommand(move()));
    harness.rerender({ interaction: { mode: "select" } });
    response.resolve(accepted);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(onCommitted).not.toHaveBeenCalled();
  });

  it("aborts an in-flight request on unmount without callbacks", async () => {
    let signal: AbortSignal | undefined;
    const response = deferred<CommandOutcome>();
    const onCommitted = vi.fn();
    const onRejected = vi.fn();
    const harness = renderPlanner({
      onChangeRequest: (_command, _context, received) => {
        signal = received;
        return response.promise;
      },
      onChangeCommitted: onCommitted,
      onChangeRejected: onRejected,
    });
    act(() => harness.ref.current?.requestCommand(move()));
    await waitFor(() => expect(signal).toBeDefined());
    harness.unmount();
    expect(signal?.aborted).toBe(true);
    response.resolve(accepted);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(onCommitted).not.toHaveBeenCalled();
    expect(onRejected).not.toHaveBeenCalled();
  });
});

describe("RD-08 malformed outcomes and concurrency", () => {
  it("rejects a null outcome without mutation", async () => {
    const onDiagnostic = vi.fn();
    const onItemsChange = vi.fn();
    const harness = renderPlanner({
      onChangeRequest: () => malformedOutcome(null),
      onDiagnostic,
      onItemsChange,
    });
    act(() => harness.ref.current?.requestCommand(move()));
    await waitFor(() =>
      expect(onDiagnostic).toHaveBeenCalledWith(expect.objectContaining({ code: "HOST_REJECTED" })),
    );
    expect(onItemsChange).not.toHaveBeenCalled();
  });

  it("rejects an accepted outcome without a revision", async () => {
    const onDiagnostic = vi.fn();
    const harness = renderPlanner({
      onChangeRequest: () => malformedOutcome({ accepted: true }),
      onDiagnostic,
    });
    act(() => harness.ref.current?.requestCommand(move()));
    await waitFor(() =>
      expect(onDiagnostic).toHaveBeenCalledWith(expect.objectContaining({ code: "HOST_REJECTED" })),
    );
  });

  it("rejects a non-boolean accepted flag", async () => {
    const onDiagnostic = vi.fn();
    const harness = renderPlanner({
      onChangeRequest: () => malformedOutcome({ accepted: "yes", revision: "1" }),
      onDiagnostic,
    });
    act(() => harness.ref.current?.requestCommand(move()));
    await waitFor(() =>
      expect(onDiagnostic).toHaveBeenCalledWith(expect.objectContaining({ code: "HOST_REJECTED" })),
    );
  });

  it("maps a thrown host request to a generic HOST_REJECTED", async () => {
    const onDiagnostic = vi.fn();
    const harness = renderPlanner({
      onChangeRequest: () => {
        throw new Error("secret host detail");
      },
      onDiagnostic,
    });
    act(() => harness.ref.current?.requestCommand(move()));
    await waitFor(() =>
      expect(onDiagnostic).toHaveBeenCalledWith(expect.objectContaining({ code: "HOST_REJECTED" })),
    );
    expect(harness.container.textContent).not.toContain("secret host detail");
  });

  it("rejects a second command for a pending item", async () => {
    const response = deferred<CommandOutcome>();
    const onDiagnostic = vi.fn();
    const harness = renderPlanner({
      onChangeRequest: () => response.promise,
      onDiagnostic,
    });
    act(() => harness.ref.current?.requestCommand(move("a")));
    act(() => harness.ref.current?.requestCommand(move("a")));
    await waitFor(() =>
      expect(onDiagnostic).toHaveBeenCalledWith(
        expect.objectContaining({ code: "INVALID_COMMAND" }),
      ),
    );
    response.resolve(accepted);
  });

  it("allows unrelated items to be pending together", async () => {
    const first = deferred<CommandOutcome>();
    const second = deferred<CommandOutcome>();
    const onCommitted = vi.fn();
    let call = 0;
    const harness = renderPlanner({
      defaultItems: [item("a"), item("b")],
      onChangeRequest: () => {
        call += 1;
        return call === 1 ? first.promise : second.promise;
      },
      onChangeCommitted: onCommitted,
    });
    act(() => harness.ref.current?.requestCommand(move("a")));
    act(() => harness.ref.current?.requestCommand(move("b")));
    first.resolve(accepted);
    second.resolve(accepted);
    await waitFor(() => expect(onCommitted).toHaveBeenCalledTimes(2));
  });

  it("does not cancel a validating request when an unrelated item changes", async () => {
    const validation = deferred<ValidationResult>();
    const onChangeRequest = vi.fn(() => accepted);
    const onCommitted = vi.fn();
    const harness = renderPlanner({
      items: [item("a"), item("b")],
      validateChange: (command) =>
        command.type === "move" && command.itemId === "a"
          ? validation.promise
          : { permitted: true, diagnostics: [] },
      onChangeRequest,
      onChangeCommitted: onCommitted,
    });
    act(() => harness.ref.current?.requestCommand(move("a")));
    act(() => harness.ref.current?.requestCommand(move("b")));
    await waitFor(() => expect(onCommitted).toHaveBeenCalledTimes(1));
    validation.resolve({ permitted: true, diagnostics: [] });
    await waitFor(() => expect(onCommitted).toHaveBeenCalledTimes(2));
  });
});

describe("RD-08 delete confirmation", () => {
  it("treats a denied confirmation as a no-op", async () => {
    const onChangeRequest = vi.fn();
    const onRejected = vi.fn();
    const harness = renderPlanner({
      interaction: { confirmChange: () => false },
      onChangeRequest,
      onChangeRejected: onRejected,
    });
    act(() =>
      harness.ref.current?.requestCommand({ type: "delete", itemId: "a", expectedVersion: 1 }),
    );
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(onChangeRequest).not.toHaveBeenCalled();
    expect(onRejected).not.toHaveBeenCalled();
    expect(harness.container.querySelector('[data-item-id="a"]')).not.toBeNull();
  });

  it("reports an unavailable confirmation handler", async () => {
    const original = window.confirm;
    Object.defineProperty(window, "confirm", { value: undefined, configurable: true });
    const onDiagnostic = vi.fn();
    const harness = renderPlanner({ onDiagnostic });
    act(() =>
      harness.ref.current?.requestCommand({ type: "delete", itemId: "a", expectedVersion: 1 }),
    );
    await waitFor(() =>
      expect(onDiagnostic).toHaveBeenCalledWith(
        expect.objectContaining({ code: "CONFIRMATION_UNAVAILABLE" }),
      ),
    );
    Object.defineProperty(window, "confirm", { value: original, configurable: true });
  });
});

describe("RD-08 request identity", () => {
  it("generates a distinct ID for each command", async () => {
    const contexts: CommandContext[] = [];
    const harness = renderPlanner({
      onChangeRequest: (_command, context) => {
        contexts.push(context);
        return accepted;
      },
    });
    act(() => harness.ref.current?.requestCommand(move()));
    await waitFor(() => expect(contexts).toHaveLength(1));
    act(() => harness.ref.current?.requestCommand(move("a", 2)));
    await waitFor(() => expect(contexts).toHaveLength(2));
    expect(contexts[0]?.requestId).not.toBe(contexts[1]?.requestId);
  });
});
