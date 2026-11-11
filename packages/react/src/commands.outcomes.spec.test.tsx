import type {
  CommandOutcome,
  PlannerCommand,
  PlannerItem,
  PlannerLayer,
} from "@blendsdk/year-planner-core";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { act, createRef } from "react";
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

const highlight = (id: string, overrides: Partial<PlannerItem> = {}): PlannerItem =>
  item(id, {
    kind: "highlight",
    layerId: "highlight",
    title: id,
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

function applyPayload(items: PlannerItem[], outcome: CommandOutcome): PlannerItem[] {
  if (!outcome.accepted) return items;
  const updated = new Map((outcome.updatedItems ?? []).map((entry) => [entry.id, entry]));
  const removed = new Set(outcome.removedItemIds ?? []);
  const next: PlannerItem[] = [];
  for (const entry of items) {
    if (removed.has(entry.id)) continue;
    const replacement = updated.get(entry.id);
    if (replacement) {
      next.push(replacement);
      updated.delete(entry.id);
    } else {
      next.push(entry);
    }
  }
  for (const replacement of updated.values()) next.push(replacement);
  return next;
}

function renderPlanner(overrides: Partial<YearPlannerProps> = {}) {
  const ref = createRef<YearPlannerHandle>();
  const onCommitted = vi.fn();
  const onRejected = vi.fn();
  const onDiagnostic = vi.fn();
  const onItemsChange = vi.fn();
  const view = render(
    <YearPlanner
      ref={ref}
      year={2016}
      layers={layers}
      defaultItems={[item("a")]}
      onChangeCommitted={onCommitted}
      onChangeRejected={onRejected}
      onDiagnostic={onDiagnostic}
      onItemsChange={onItemsChange}
      {...overrides}
    />,
  );
  return { ref, onCommitted, onRejected, onDiagnostic, onItemsChange, ...view };
}

function renderControlled(initialItems: PlannerItem[], overrides: Partial<YearPlannerProps> = {}) {
  const ref = createRef<YearPlannerHandle>();
  let items = initialItems;
  const element = (next: PlannerItem[]) => (
    <YearPlanner ref={ref} year={2016} layers={layers} items={next} {...overrides} />
  );
  const view = render(element(items));
  return {
    ref,
    update: (next: PlannerItem[]) => {
      items = next;
      view.rerender(element(items));
    },
    ...view,
  };
}

describe("RD-08 versions and local history", () => {
  it("rejects a stale move without calling the host", async () => {
    const onChangeRequest = vi.fn();
    const { ref, onDiagnostic } = renderPlanner({
      defaultItems: [item("a", { version: 2 })],
      onChangeRequest,
    });
    act(() => ref.current?.requestCommand(move("a", 1)));
    await waitFor(() =>
      expect(onDiagnostic).toHaveBeenCalledWith(
        expect.objectContaining({ code: "STALE_REVISION" }),
      ),
    );
    expect(onChangeRequest).not.toHaveBeenCalled();
  });

  it("rejects stale resize, delete and paint versions", async () => {
    const onChangeRequest = vi.fn();
    const harness = renderPlanner({
      defaultItems: [item("a", { version: 2 }), highlight("h", { version: 2 })],
      activeLayerId: "highlight",
      onChangeRequest,
    });
    act(() => {
      harness.ref.current?.requestCommand({
        type: "resize",
        itemId: "a",
        proposedPeriod: {
          kind: "all-day",
          startDate: "2016-01-04",
          endDateExclusive: "2016-01-09",
        },
        expectedVersion: 1,
      });
      harness.ref.current?.requestCommand({ type: "delete", itemId: "a", expectedVersion: 1 });
      harness.ref.current?.requestCommand({
        type: "paint",
        layerId: "highlight",
        period: { kind: "all-day", startDate: "2016-01-04", endDateExclusive: "2016-01-06" },
        operation: "union",
        defaults: { kind: "highlight" },
        expectedVersions: { h: 1 },
      });
    });
    await waitFor(() => {
      const codes = harness.onDiagnostic.mock.calls.map(([entry]) => entry.code);
      expect(codes.filter((code) => code === "STALE_REVISION").length).toBeGreaterThanOrEqual(3);
    });
    expect(onChangeRequest).not.toHaveBeenCalled();
  });

  it("protects update identity and version at runtime", async () => {
    const onChangeRequest = vi.fn();
    const { ref, onDiagnostic } = renderPlanner({ onChangeRequest });
    act(() => {
      ref.current?.requestCommand({
        type: "update",
        itemId: "a",
        patch: { id: "b" } as never,
        expectedVersion: 1,
      });
      ref.current?.requestCommand({
        type: "update",
        itemId: "a",
        patch: { version: 9 } as never,
        expectedVersion: 1,
      });
    });
    await waitFor(() => {
      const codes = onDiagnostic.mock.calls.map(([entry]) => entry.code);
      expect(codes.filter((code) => code === "INVALID_COMMAND").length).toBe(2);
    });
    expect(onChangeRequest).not.toHaveBeenCalled();
  });

  it("applies an allowed update patch and increments the version", async () => {
    const { ref, onItemsChange } = renderPlanner();
    act(() =>
      ref.current?.requestCommand({
        type: "update",
        itemId: "a",
        patch: { title: "Renamed" },
        expectedVersion: 1,
      }),
    );
    await waitFor(() => expect(onItemsChange).toHaveBeenCalled());
    const next = onItemsChange.mock.calls.at(-1)?.[0] as PlannerItem[];
    expect(next[0]?.title).toBe("Renamed");
    expect(next[0]?.version).toBe(2);
  });

  it("rejects incomplete and duplicate create commands", async () => {
    const onChangeRequest = vi.fn();
    const { ref, onDiagnostic } = renderPlanner({
      onChangeRequest,
    });
    act(() => {
      ref.current?.requestCommand({ type: "create", item: item("a") });
      ref.current?.requestCommand({ type: "create", item: item("") });
      ref.current?.requestCommand({ type: "create", item: item("b", { version: 2 }) });
      ref.current?.requestCommand({ type: "create", item: item("c", { kind: "annotation" }) });
    });
    await waitFor(() => {
      const codes = onDiagnostic.mock.calls.map(([entry]) => entry.code);
      expect(codes.filter((code) => code === "INVALID_COMMAND").length).toBeGreaterThanOrEqual(4);
    });
    expect(onChangeRequest).not.toHaveBeenCalled();
  });

  it("undoes and redoes uncontrolled versions and rejects a stale second update", async () => {
    const { ref, onItemsChange } = renderPlanner();
    act(() =>
      ref.current?.requestCommand({
        type: "update",
        itemId: "a",
        patch: { title: "One" },
        expectedVersion: 1,
      }),
    );
    await waitFor(() => expect(onItemsChange).toHaveBeenCalledTimes(1));
    act(() => ref.current?.requestUndo());
    await waitFor(() => expect(onItemsChange).toHaveBeenCalledTimes(2));
    const undoItems = onItemsChange.mock.calls[1]?.[0] as PlannerItem[] | undefined;
    expect(undoItems?.[0]?.version).toBe(1);
    act(() => ref.current?.requestRedo());
    await waitFor(() => expect(onItemsChange).toHaveBeenCalledTimes(3));
    const redoItems = onItemsChange.mock.calls[2]?.[0] as PlannerItem[] | undefined;
    expect(redoItems?.[0]?.version).toBe(2);

    act(() =>
      ref.current?.requestCommand({
        type: "update",
        itemId: "a",
        patch: { title: "Stale" },
        expectedVersion: 1,
      }),
    );
    await waitFor(() => expect(onItemsChange).toHaveBeenCalledTimes(3));
  });

  it("creates and deletes with local undo", async () => {
    const { ref, onItemsChange } = renderPlanner();
    act(() =>
      ref.current?.requestCommand({
        type: "create",
        item: item("new", { title: "New" }),
      }),
    );
    await waitFor(() => expect(onItemsChange).toHaveBeenCalledTimes(1));
    const createdItems = onItemsChange.mock.calls[0]?.[0] as PlannerItem[] | undefined;
    expect(createdItems?.some((entry) => entry.id === "new")).toBe(true);
    act(() => ref.current?.requestUndo());
    await waitFor(() => expect(onItemsChange).toHaveBeenCalledTimes(2));
    const undoneItems = onItemsChange.mock.calls[1]?.[0] as PlannerItem[] | undefined;
    expect(undoneItems?.some((entry) => entry.id === "new")).toBe(false);
  });

  it("does not create local history in controlled mode", async () => {
    const { ref, onDiagnostic } = renderPlanner({
      items: [item("a")],
    });
    act(() => ref.current?.requestUndo());
    await waitFor(() =>
      expect(onDiagnostic).toHaveBeenCalledWith(
        expect.objectContaining({ code: "UNDO_UNAVAILABLE" }),
      ),
    );
  });
});

describe("RD-08 controlled acceptance", () => {
  it("waits for controlled props before declaring a move applied", async () => {
    const updated = item("a", {
      period: { kind: "all-day", startDate: "2016-01-11", endDateExclusive: "2016-01-15" },
      version: 2,
    });
    const onCommitted = vi.fn();
    const controlled = renderControlled([item("a")], {
      interaction: { commandTimeoutMs: 100 },
      onChangeRequest: (): CommandOutcome => ({
        accepted: true,
        revision: "2",
        updatedItems: [updated],
      }),
      onChangeCommitted: onCommitted,
    });
    act(() => controlled.ref.current?.requestCommand(move()));
    await waitFor(() => expect(onCommitted).toHaveBeenCalledTimes(1));
    controlled.update([updated]);
    await waitFor(() => expect(screen.queryByText("ACCEPTED_NOT_APPLIED")).toBeNull());
  });

  it("shows ACCEPTED_NOT_APPLIED when controlled props never update", async () => {
    const onCommitted = vi.fn();
    const onRejected = vi.fn();
    const controlled = renderControlled([item("a")], {
      interaction: { commandTimeoutMs: 100 },
      onChangeRequest: (): CommandOutcome => ({
        accepted: true,
        revision: "2",
        updatedItems: [item("a", { version: 2 })],
      }),
      onChangeCommitted: onCommitted,
      onChangeRejected: onRejected,
    });
    act(() => controlled.ref.current?.requestCommand(move()));
    await waitFor(() => expect(screen.getByText("ACCEPTED_NOT_APPLIED")).toBeInTheDocument(), {
      timeout: 5000,
    });
    expect(onCommitted).toHaveBeenCalledTimes(1);
    expect(onRejected).not.toHaveBeenCalled();
  });

  it("clears pending when controlled props apply after a delay", async () => {
    const updated = item("a", { version: 2 });
    const controlled = renderControlled([item("a")], {
      interaction: { commandTimeoutMs: 100 },
      onChangeRequest: (): CommandOutcome => ({
        accepted: true,
        revision: "2",
        updatedItems: [updated],
      }),
    });
    act(() => controlled.ref.current?.requestCommand(move()));
    await new Promise((resolve) => setTimeout(resolve, 10));
    controlled.update([updated]);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(screen.queryByText("ACCEPTED_NOT_APPLIED")).toBeNull();
  });

  it("accepts a controlled version bump without a payload", async () => {
    const updated = item("a", { version: 2 });
    const controlled = renderControlled([item("a")], {
      interaction: { commandTimeoutMs: 100 },
      onChangeRequest: (): CommandOutcome => ({ accepted: true, revision: "2" }),
    });
    act(() => controlled.ref.current?.requestCommand(move()));
    controlled.update([updated]);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(screen.queryByText("ACCEPTED_NOT_APPLIED")).toBeNull();
  });

  it("accepts a controlled delete when props remove the item", async () => {
    const controlled = renderControlled([item("a")], {
      interaction: { commandTimeoutMs: 100, confirmChange: () => true },
      onChangeRequest: (): CommandOutcome => ({
        accepted: true,
        revision: "2",
        removedItemIds: ["a"],
      }),
    });
    act(() =>
      controlled.ref.current?.requestCommand({
        type: "delete",
        itemId: "a",
        expectedVersion: 1,
      }),
    );
    controlled.update([]);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(screen.queryByText("ACCEPTED_NOT_APPLIED")).toBeNull();
    expect(controlled.container.querySelector('[data-item-id="a"]')).toBeNull();
  });

  it("accepts a controlled erase that fully covers the source", async () => {
    const source = highlight("h", {
      period: { kind: "all-day", startDate: "2016-01-04", endDateExclusive: "2016-01-12" },
    });
    const controlled = renderControlled([source], {
      activeLayerId: "highlight",
      interaction: { commandTimeoutMs: 100 },
      onChangeRequest: (): CommandOutcome => ({
        accepted: true,
        revision: "2",
        updatedItems: [],
        removedItemIds: ["h"],
      }),
    });
    act(() =>
      controlled.ref.current?.requestCommand({
        type: "paint",
        layerId: "highlight",
        period: { kind: "all-day", startDate: "2016-01-04", endDateExclusive: "2016-01-12" },
        operation: "subtract",
        defaults: { kind: "highlight" },
        expectedVersions: { h: 1 },
      }),
    );
    controlled.update([]);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(screen.queryByText("ACCEPTED_NOT_APPLIED")).toBeNull();
    expect(controlled.container.querySelector('[data-item-id="h"]')).toBeNull();
  });

  it("rejects a controlled paint accepted without a payload", async () => {
    const onCommitted = vi.fn();
    const controlled = renderControlled([highlight("h")], {
      activeLayerId: "highlight",
      onChangeRequest: (): CommandOutcome => ({ accepted: true, revision: "2" }),
      onChangeCommitted: onCommitted,
    });
    act(() =>
      controlled.ref.current?.requestCommand({
        type: "paint",
        layerId: "highlight",
        period: { kind: "all-day", startDate: "2016-01-04", endDateExclusive: "2016-01-06" },
        operation: "union",
        defaults: { kind: "highlight" },
        expectedVersions: { h: 1 },
      }),
    );
    await waitFor(() => expect(screen.getByText("HOST_REJECTED")).toBeInTheDocument());
    expect(onCommitted).not.toHaveBeenCalled();
  });

  it("rejects a controlled union with an empty payload", async () => {
    const controlled = renderControlled([highlight("h")], {
      activeLayerId: "highlight",
      onChangeRequest: (): CommandOutcome => ({
        accepted: true,
        revision: "2",
        updatedItems: [],
        removedItemIds: [],
      }),
    });
    act(() =>
      controlled.ref.current?.requestCommand({
        type: "paint",
        layerId: "highlight",
        period: { kind: "all-day", startDate: "2016-01-04", endDateExclusive: "2016-01-06" },
        operation: "union",
        defaults: { kind: "highlight" },
        expectedVersions: { h: 1 },
      }),
    );
    await waitFor(() => expect(screen.getByText("HOST_REJECTED")).toBeInTheDocument());
  });

  it("rejects a controlled union without a new item", async () => {
    const controlled = renderControlled([highlight("h")], {
      activeLayerId: "highlight",
      onChangeRequest: (): CommandOutcome => ({
        accepted: true,
        revision: "2",
        updatedItems: [highlight("h", { version: 2 })],
        removedItemIds: [],
      }),
    });
    act(() =>
      controlled.ref.current?.requestCommand({
        type: "paint",
        layerId: "highlight",
        period: { kind: "all-day", startDate: "2016-01-04", endDateExclusive: "2016-01-06" },
        operation: "union",
        defaults: { kind: "highlight" },
        expectedVersions: { h: 1 },
      }),
    );
    await waitFor(() => expect(screen.getByText("HOST_REJECTED")).toBeInTheDocument());
  });

  it("applies controlled erase residuals and removals", async () => {
    const residualA = highlight("r1", {
      period: { kind: "all-day", startDate: "2016-01-04", endDateExclusive: "2016-01-05" },
    });
    const residualB = highlight("r2", {
      period: { kind: "all-day", startDate: "2016-01-10", endDateExclusive: "2016-01-12" },
    });
    const source = highlight("h", {
      period: { kind: "all-day", startDate: "2016-01-04", endDateExclusive: "2016-01-12" },
    });
    const updated = [residualA, residualB];
    const controlled = renderControlled([source], {
      activeLayerId: "highlight",
      interaction: { commandTimeoutMs: 100 },
      onChangeRequest: (): CommandOutcome => ({
        accepted: true,
        revision: "2",
        updatedItems: updated,
        removedItemIds: ["h"],
      }),
    });
    act(() =>
      controlled.ref.current?.requestCommand({
        type: "paint",
        layerId: "highlight",
        period: { kind: "all-day", startDate: "2016-01-05", endDateExclusive: "2016-01-10" },
        operation: "subtract",
        defaults: { kind: "highlight" },
        expectedVersions: { h: 1 },
      }),
    );
    controlled.update(
      applyPayload([source], {
        accepted: true,
        revision: "2",
        updatedItems: updated,
        removedItemIds: ["h"],
      }),
    );
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(screen.queryByText("ACCEPTED_NOT_APPLIED")).toBeNull();
  });
});

describe("RD-08 paint and retry", () => {
  it("creates a highlight when paint intersects no visible highlight", async () => {
    const { ref, onItemsChange } = renderPlanner({
      activeLayerId: "highlight",
      defaultItems: [],
    });
    act(() =>
      ref.current?.requestCommand({
        type: "paint",
        layerId: "highlight",
        period: { kind: "all-day", startDate: "2016-01-04", endDateExclusive: "2016-01-06" },
        operation: "union",
        defaults: { kind: "highlight" },
        expectedVersions: {},
      }),
    );
    await waitFor(() => expect(onItemsChange).toHaveBeenCalled());
    const next = onItemsChange.mock.calls.at(-1)?.[0] as PlannerItem[];
    expect(next).toHaveLength(1);
    expect(next[0]).toMatchObject({ kind: "highlight", version: 1 });
  });

  it("rejects a zero-length paint", async () => {
    const onChangeRequest = vi.fn();
    const { ref, onDiagnostic } = renderPlanner({
      activeLayerId: "highlight",
      onChangeRequest,
    });
    act(() =>
      ref.current?.requestCommand({
        type: "paint",
        layerId: "highlight",
        period: { kind: "all-day", startDate: "2016-01-04", endDateExclusive: "2016-01-04" },
        operation: "union",
        defaults: { kind: "highlight" },
        expectedVersions: {},
      }),
    );
    await waitFor(() =>
      expect(onDiagnostic).toHaveBeenCalledWith(
        expect.objectContaining({ code: "INVALID_COMMAND" }),
      ),
    );
    expect(onChangeRequest).not.toHaveBeenCalled();
  });

  it("keeps mixed-attribute highlights separate", async () => {
    const { ref, onItemsChange } = renderPlanner({
      activeLayerId: "highlight",
      defaultItems: [
        highlight("matching", {
          title: "H",
          period: { kind: "all-day", startDate: "2016-01-04", endDateExclusive: "2016-01-08" },
        }),
        highlight("different", {
          title: "H",
          color: "#ff0000",
          period: { kind: "all-day", startDate: "2016-01-06", endDateExclusive: "2016-01-12" },
        }),
      ],
    });
    act(() =>
      ref.current?.requestCommand({
        type: "paint",
        layerId: "highlight",
        period: { kind: "all-day", startDate: "2016-01-06", endDateExclusive: "2016-01-09" },
        operation: "union",
        defaults: { kind: "highlight", title: "H" },
        expectedVersions: { matching: 1, different: 1 },
      }),
    );
    await waitFor(() => expect(onItemsChange).toHaveBeenCalled());
    const next = onItemsChange.mock.calls.at(-1)?.[0] as PlannerItem[];
    expect(next.filter((entry) => entry.id === "different")).toHaveLength(1);
    expect(next.find((entry) => entry.id === "matching")).toBeUndefined();
  });

  it("passes revision tokens through to callbacks", async () => {
    const onCommitted = vi.fn();
    const onRejected = vi.fn();
    const harness = renderPlanner({
      onChangeRequest: (command) =>
        command.type === "move" && command.expectedVersion === 1
          ? { accepted: true, revision: "r7" }
          : { accepted: false, diagnostics: [], latestRevision: "r8" },
      onChangeCommitted: onCommitted,
      onChangeRejected: onRejected,
    });
    act(() => harness.ref.current?.requestCommand(move()));
    await waitFor(() =>
      expect(onCommitted).toHaveBeenCalledWith(expect.objectContaining({ revision: "r7" })),
    );
    act(() => harness.ref.current?.requestCommand(move("a", 2)));
    await waitFor(() => expect(onRejected).toHaveBeenCalled());
    expect(onRejected.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ latestRevision: "r8" }),
    );
  });

  it("shows a capacity rejection once and keeps the item", async () => {
    const { ref, onRejected, onItemsChange } = renderPlanner({
      onChangeRequest: (): CommandOutcome => ({
        accepted: false,
        diagnostics: [{ code: "CAPACITY_EXCEEDED", level: "error", message: "Full" }],
      }),
    });
    act(() => ref.current?.requestCommand(move()));
    await waitFor(() => expect(onRejected).toHaveBeenCalledTimes(1));
    expect(screen.getByText("CAPACITY_EXCEEDED")).toBeInTheDocument();
    expect(onItemsChange).not.toHaveBeenCalled();
  });

  it("blocks a host rejection even when it carries warnings only", async () => {
    const { ref, onRejected, onItemsChange } = renderPlanner({
      onChangeRequest: (): CommandOutcome => ({
        accepted: false,
        diagnostics: [{ code: "CAPACITY_EXCEEDED", level: "warning", message: "Check" }],
      }),
    });
    act(() => ref.current?.requestCommand(move()));
    await waitFor(() => expect(onRejected).toHaveBeenCalledTimes(1));
    expect(onItemsChange).not.toHaveBeenCalled();
  });

  it("keeps a warning visible until dismiss", async () => {
    const { ref } = renderPlanner({
      validateChange: () => ({
        permitted: true,
        diagnostics: [{ code: "INVALID_RANGE", level: "warning", message: "Warning text" }],
      }),
      onChangeRequest: () => accepted,
    });
    act(() => ref.current?.requestCommand(move()));
    await waitFor(() => expect(screen.getByText("Warning text")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByText("Warning text")).toBeNull();
  });

  it("retries a timed-out move and clears feedback on success", async () => {
    let calls = 0;
    const { ref } = renderPlanner({
      interaction: { commandTimeoutMs: 10 },
      onChangeRequest: (): Promise<CommandOutcome> => {
        calls += 1;
        return calls === 1
          ? new Promise<CommandOutcome>(() => {})
          : Promise.resolve({ accepted: true, revision: "2" });
      },
    });
    act(() => ref.current?.openInspector());
    act(() => ref.current?.requestCommand(move()));
    await waitFor(() => expect(screen.getByText("COMMAND_TIMEOUT")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(calls).toBe(2));
    await waitFor(() => expect(screen.queryByText("COMMAND_TIMEOUT")).toBeNull());
  });

  it("does not offer retry for a failed delete", async () => {
    const { ref } = renderPlanner({
      interaction: { commandTimeoutMs: 10, confirmChange: () => true },
      onChangeRequest: (): Promise<CommandOutcome> => new Promise<CommandOutcome>(() => {}),
    });
    act(() => ref.current?.openInspector());
    act(() => ref.current?.requestCommand({ type: "delete", itemId: "a", expectedVersion: 1 }));
    await waitFor(() => expect(screen.getByText("COMMAND_TIMEOUT")).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: "Retry" })).toBeNull();
  });

  it("does not offer retry for a timed-out create", async () => {
    const { ref } = renderPlanner({
      interaction: { commandTimeoutMs: 10 },
      onChangeRequest: (): Promise<CommandOutcome> => new Promise<CommandOutcome>(() => {}),
    });
    act(() => ref.current?.openInspector());
    act(() => ref.current?.requestCommand({ type: "create", item: item("new") }));
    await waitFor(() => expect(screen.getByText("COMMAND_TIMEOUT")).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: "Retry" })).toBeNull();
  });

  it("rejects a third capacity booking even when the dock layer is hidden", async () => {
    const dockA: PlannerItem = {
      ...item("dock-a", {
        kind: "reservation",
        layerId: "dock",
        period: {
          kind: "all-day",
          startDate: "2027-01-10",
          endDateExclusive: "2027-01-20",
        },
      }),
    };
    const dockB: PlannerItem = {
      ...item("dock-b", {
        kind: "reservation",
        layerId: "dock",
        period: {
          kind: "all-day",
          startDate: "2027-01-12",
          endDateExclusive: "2027-01-18",
        },
      }),
    };
    const dockC: PlannerItem = {
      ...item("dock-c", {
        kind: "reservation",
        layerId: "ribbon",
        period: {
          kind: "all-day",
          startDate: "2027-01-14",
          endDateExclusive: "2027-01-16",
        },
      }),
    };
    const onDiagnostic = vi.fn();
    const { ref, onItemsChange } = renderPlanner({
      year: 2027,
      layers: [...layers, { id: "dock", name: "Dock", channel: "ribbon", color: "#2a9d8f" }],
      defaultItems: [dockA, dockB],
      defaultVisibility: {
        hiddenGroupIds: [],
        hiddenLayerIds: ["dock"],
        hiddenItemIds: [],
      },
      activeLayerId: "ribbon",
      onDiagnostic,
      onChangeRequest: (command): CommandOutcome => {
        if (command.type !== "create") return accepted;
        const overlaps = [dockA, dockB].filter(
          (entry) =>
            entry.period.kind === "all-day" &&
            command.item.period.kind === "all-day" &&
            entry.period.startDate < command.item.period.endDateExclusive &&
            command.item.period.startDate < entry.period.endDateExclusive,
        );
        return overlaps.length >= 2
          ? {
              accepted: false,
              diagnostics: [{ code: "CAPACITY_EXCEEDED", level: "error", message: "Dock is full" }],
            }
          : accepted;
      },
    });
    act(() => ref.current?.requestCommand({ type: "create", item: dockC }));
    await waitFor(() =>
      expect(onDiagnostic).toHaveBeenCalledWith(
        expect.objectContaining({ code: "CAPACITY_EXCEEDED" }),
      ),
    );
    expect(onItemsChange).not.toHaveBeenCalled();
  });

  it("renders a host diagnostic message as text, not HTML", async () => {
    const { ref, container } = renderPlanner({
      onChangeRequest: (): CommandOutcome => ({
        accepted: false,
        diagnostics: [{ code: "HOST_REJECTED", level: "error", message: "<b>blocked</b>" }],
      }),
    });
    act(() => ref.current?.requestCommand(move()));
    await waitFor(() => expect(container.textContent).toContain("<b>blocked</b>"));
    expect(container.querySelector("b")).toBeNull();
  });

  it("passes a synthesized uncontrolled paint payload to the committed callback", async () => {
    const onCommitted = vi.fn();
    const harness = renderPlanner({
      activeLayerId: "highlight",
      defaultItems: [highlight("h")],
      onChangeRequest: () => accepted,
      onChangeCommitted: onCommitted,
    });
    act(() =>
      harness.ref.current?.requestCommand({
        type: "paint",
        layerId: "highlight",
        period: { kind: "all-day", startDate: "2016-01-05", endDateExclusive: "2016-01-08" },
        operation: "subtract",
        defaults: { kind: "highlight" },
        expectedVersions: { h: 1 },
      }),
    );
    await waitFor(() => expect(onCommitted).toHaveBeenCalledTimes(1));
    const outcome = onCommitted.mock.calls[0]?.[0] as CommandOutcome;
    if (!outcome.accepted) throw new Error("expected acceptance");
    expect(outcome.updatedItems?.length).toBeGreaterThan(0);
    expect(outcome.removedItemIds).toEqual(["h"]);
  });
});
