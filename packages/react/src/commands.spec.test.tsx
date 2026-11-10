import type {
  CommandOutcome,
  PlannerCommand,
  PlannerItem,
  PlannerLayer,
} from "@blendsdk/year-planner-core";
import { render, waitFor } from "@testing-library/react";
import { act, createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import type { YearPlannerHandle, YearPlannerProps } from "./types";
import { YearPlanner } from "./YearPlanner";

const layer = (id: string, overrides: Partial<PlannerLayer> = {}): PlannerLayer => ({
  id,
  name: id,
  channel: "ribbon",
  color: "#1d4e89",
  ...overrides,
});

const item = (
  id: string,
  layerId: string,
  startDate = "2016-01-04",
  endDateExclusive = "2016-01-08",
  overrides: Partial<PlannerItem> = {},
): PlannerItem => ({
  id,
  kind: "activity",
  layerId,
  period: { kind: "all-day", startDate, endDateExclusive },
  title: id,
  version: 1,
  ...overrides,
});

const markers = (container: HTMLElement) =>
  container.querySelectorAll('[data-yp-part="item-fragment"]');

function harness(overrides: Partial<YearPlannerProps> = {}) {
  const ref = createRef<YearPlannerHandle>();
  const onItemsChange = vi.fn();
  const onDiagnostic = vi.fn();
  const onCommitted = vi.fn();
  const onRejected = vi.fn();
  const view = render(
    <YearPlanner
      ref={ref}
      year={2016}
      layers={[layer("ribbon")]}
      defaultItems={[item("a", "ribbon")]}
      onItemsChange={onItemsChange}
      onDiagnostic={onDiagnostic}
      onChangeCommitted={onCommitted}
      onChangeRejected={onRejected}
      {...overrides}
    />,
  );
  return { ref, onItemsChange, onDiagnostic, onCommitted, onRejected, ...view };
}

describe("RD-06 command pipeline: local mode", () => {
  it("deletes an uncontrolled item and emits the next array", async () => {
    const { ref, onItemsChange, container } = harness({
      interaction: { confirmChange: () => true },
    });
    act(() => {
      ref.current?.requestCommand({ type: "delete", itemId: "a", expectedVersion: 1 });
    });
    await waitFor(() => expect(markers(container)).toHaveLength(0));
    expect(onItemsChange).toHaveBeenCalledWith([]);
  });

  it("never mutates controlled items", async () => {
    const { ref, onItemsChange, container } = harness({
      items: [item("a", "ribbon")],
      interaction: { confirmChange: () => true },
    });
    act(() => {
      ref.current?.requestCommand({ type: "delete", itemId: "a", expectedVersion: 1 });
    });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(markers(container)).toHaveLength(1);
    expect(onItemsChange).not.toHaveBeenCalled();
  });

  it("builds move, resize, create and paint commands", async () => {
    const commands: PlannerCommand[] = [];
    const onChangeRequest = (command: PlannerCommand): CommandOutcome => {
      commands.push(command);
      return { accepted: true, revision: "1" };
    };
    const { ref } = harness({
      activeLayerId: "highlight",
      layers: [layer("ribbon"), layer("highlight", { channel: "highlight" })],
      defaultItems: [item("a", "ribbon"), item("b", "ribbon")],
      onChangeRequest,
    });
    act(() => {
      ref.current?.requestCommand({
        type: "move",
        itemId: "a",
        proposedPeriod: {
          kind: "all-day",
          startDate: "2016-01-11",
          endDateExclusive: "2016-01-15",
        },
        expectedVersion: 1,
      });
      ref.current?.requestCommand({
        type: "resize",
        itemId: "b",
        proposedPeriod: {
          kind: "all-day",
          startDate: "2016-01-04",
          endDateExclusive: "2016-01-09",
        },
        expectedVersion: 1,
      });
      ref.current?.requestCommand({
        type: "create",
        item: item("new", "highlight", "2016-01-04", "2016-01-06"),
      });
      ref.current?.requestCommand({
        type: "paint",
        layerId: "highlight",
        period: { kind: "all-day", startDate: "2016-01-04", endDateExclusive: "2016-01-06" },
        operation: "union",
        defaults: { kind: "highlight", title: "Painted" },
        expectedVersions: {},
      });
    });
    await waitFor(() => expect(commands).toHaveLength(4));
    expect(commands[0]).toMatchObject({ type: "move", expectedVersion: 1 });
    expect(commands[1]).toMatchObject({ type: "resize", expectedVersion: 1 });
    expect(commands[2]).toMatchObject({ type: "create" });
    expect(commands[3]).toMatchObject({ type: "paint", layerId: "highlight" });
  });

  it("rejects read-only, stale and invalid commands with typed codes", async () => {
    const { ref, onDiagnostic } = harness({ readOnly: true });
    act(() => {
      ref.current?.requestCommand({
        type: "move",
        itemId: "a",
        proposedPeriod: {
          kind: "all-day",
          startDate: "2016-01-11",
          endDateExclusive: "2016-01-15",
        },
        expectedVersion: 1,
      });
    });
    await waitFor(() =>
      expect(onDiagnostic).toHaveBeenCalledWith(expect.objectContaining({ code: "READ_ONLY" })),
    );

    const stale = harness();
    act(() => {
      stale.ref.current?.requestCommand({
        type: "move",
        itemId: "a",
        proposedPeriod: {
          kind: "all-day",
          startDate: "2016-01-11",
          endDateExclusive: "2016-01-15",
        },
        expectedVersion: 9,
      });
    });
    await waitFor(() =>
      expect(stale.onDiagnostic).toHaveBeenCalledWith(
        expect.objectContaining({ code: "STALE_REVISION" }),
      ),
    );

    const missing = harness();
    act(() => {
      missing.ref.current?.requestCommand({
        type: "delete",
        itemId: "missing",
        expectedVersion: 1,
      });
    });
    await waitFor(() =>
      expect(missing.onDiagnostic).toHaveBeenCalledWith(
        expect.objectContaining({ code: "INVALID_COMMAND" }),
      ),
    );
  });

  it("rejects an invalid paint target", async () => {
    const { ref, onDiagnostic } = harness({ activeLayerId: "ribbon" });
    act(() => {
      ref.current?.requestCommand({
        type: "paint",
        layerId: "ribbon",
        period: { kind: "all-day", startDate: "2016-01-04", endDateExclusive: "2016-01-06" },
        operation: "union",
        defaults: { kind: "highlight" },
        expectedVersions: {},
      });
    });
    await waitFor(() =>
      expect(onDiagnostic).toHaveBeenCalledWith(
        expect.objectContaining({ code: "INVALID_PAINT_TARGET" }),
      ),
    );
  });

  it("redacts hidden item details in command diagnostics", async () => {
    const { ref, onDiagnostic } = harness({
      layers: [layer("ribbon", { defaultVisible: false })],
      defaultItems: [
        item("hidden-item", "ribbon", "2016-01-04", "2016-01-08", { title: "Secret" }),
      ],
    });
    act(() => {
      ref.current?.requestCommand({
        type: "move",
        itemId: "hidden-item",
        proposedPeriod: {
          kind: "all-day",
          startDate: "2016-01-11",
          endDateExclusive: "2016-01-15",
        },
        expectedVersion: 1,
      });
    });
    await waitFor(() => {
      const diagnostic = onDiagnostic.mock.calls[0]?.[0];
      expect(diagnostic.code).toBe("READ_ONLY");
      expect(diagnostic.itemIds).toEqual(["hidden-item"]);
      expect(diagnostic.message).not.toContain("Secret");
      expect(diagnostic.message).not.toContain("2016");
    });
  });

  it("rejects paint with mixed attributes without duplicating items", async () => {
    const { ref, container, onItemsChange } = harness({
      activeLayerId: "highlight",
      layers: [layer("highlight", { channel: "highlight" })],
      defaultItems: [
        item("matching", "highlight", "2016-01-04", "2016-01-08", {
          kind: "highlight",
          title: "H",
        }),
        item("different", "highlight", "2016-01-06", "2016-01-12", {
          kind: "highlight",
          title: "H",
          color: "#ff0000",
        }),
      ],
    });
    act(() => {
      ref.current?.requestCommand({
        type: "paint",
        layerId: "highlight",
        period: { kind: "all-day", startDate: "2016-01-06", endDateExclusive: "2016-01-09" },
        operation: "union",
        defaults: { kind: "highlight", title: "H" },
        expectedVersions: { matching: 1, different: 1 },
      });
    });
    await waitFor(() => expect(onItemsChange).toHaveBeenCalled());
    const next = onItemsChange.mock.calls.at(-1)?.[0] as PlannerItem[];
    expect(next.filter((entry) => entry.id === "different")).toHaveLength(1);
    expect(next.find((entry) => entry.id === "matching")).toBeUndefined();
    expect(container.querySelectorAll('[data-item-id="different"]')).toHaveLength(1);
  });
});

describe("RD-06 command pipeline: host mode", () => {
  it("runs host validation, commits accepted outcomes and rejects failures", async () => {
    const updated = item("a", "ribbon", "2016-01-11", "2016-01-15", {
      title: "Moved",
      version: 2,
    });
    let call = 0;
    const onChangeRequest = (): Promise<CommandOutcome> => {
      call += 1;
      if (call === 1) {
        return Promise.resolve({ accepted: true, revision: "2", updatedItems: [updated] });
      }
      return Promise.resolve({
        accepted: false,
        diagnostics: [{ code: "READ_ONLY", level: "error", message: "Host says no" }],
      });
    };
    const validateChange = vi.fn(() => ({ permitted: true, diagnostics: [] }));
    const { ref, onDiagnostic, onCommitted, onRejected } = harness({
      onChangeRequest,
      validateChange,
      interaction: { confirmChange: () => true },
    });
    act(() => {
      ref.current?.requestCommand({
        type: "move",
        itemId: "a",
        proposedPeriod: {
          kind: "all-day",
          startDate: "2016-01-11",
          endDateExclusive: "2016-01-15",
        },
        expectedVersion: 1,
      });
    });
    await waitFor(() => expect(onCommitted).toHaveBeenCalled());
    expect(validateChange).toHaveBeenCalledWith(
      expect.objectContaining({ type: "move" }),
      expect.objectContaining({ requestId: expect.any(String) }),
    );
    act(() => {
      ref.current?.requestCommand({
        type: "delete",
        itemId: "a",
        expectedVersion: 2,
      });
    });
    await waitFor(() => expect(onRejected).toHaveBeenCalled());
    expect(onDiagnostic).toHaveBeenCalledWith(expect.objectContaining({ code: "READ_ONLY" }));
  });

  it("reports validation denial", async () => {
    const { ref, onRejected, onDiagnostic } = harness({
      validateChange: () => ({
        permitted: false,
        diagnostics: [{ code: "VALIDATION_ERROR", level: "error", message: "No" }],
      }),
    });
    act(() => {
      ref.current?.requestCommand({
        type: "move",
        itemId: "a",
        proposedPeriod: {
          kind: "all-day",
          startDate: "2016-01-11",
          endDateExclusive: "2016-01-15",
        },
        expectedVersion: 1,
      });
    });
    await waitFor(() => expect(onRejected).toHaveBeenCalled());
    expect(onDiagnostic).toHaveBeenCalledWith(
      expect.objectContaining({ code: "VALIDATION_ERROR" }),
    );
  });

  it("times out and surfaces COMMAND_TIMEOUT", async () => {
    const { ref, onRejected, onDiagnostic } = harness({
      interaction: { commandTimeoutMs: 20 },
      onChangeRequest: () => new Promise<CommandOutcome>(() => {}),
    });
    act(() => {
      ref.current?.requestCommand({
        type: "move",
        itemId: "a",
        proposedPeriod: {
          kind: "all-day",
          startDate: "2016-01-11",
          endDateExclusive: "2016-01-15",
        },
        expectedVersion: 1,
      });
    });
    await waitFor(
      () =>
        expect(onDiagnostic).toHaveBeenCalledWith(
          expect.objectContaining({ code: "COMMAND_TIMEOUT" }),
        ),
      { timeout: 1000 },
    );
    expect(onRejected).toHaveBeenCalled();
  });

  it("maps thrown host calls to HOST_REJECTED", async () => {
    const onDiagnostic = vi.fn();
    const { ref } = harness({
      onChangeRequest: () => Promise.reject(new Error("boom")),
      onDiagnostic,
    });
    act(() => {
      ref.current?.requestCommand({
        type: "move",
        itemId: "a",
        proposedPeriod: {
          kind: "all-day",
          startDate: "2016-01-11",
          endDateExclusive: "2016-01-15",
        },
        expectedVersion: 1,
      });
    });
    await waitFor(() =>
      expect(onDiagnostic).toHaveBeenCalledWith(expect.objectContaining({ code: "HOST_REJECTED" })),
    );
  });

  it("undoes and redoes uncontrolled commands; controlled undo is unavailable", async () => {
    const { ref, container, onItemsChange } = harness({
      interaction: { confirmChange: () => true },
    });
    act(() => {
      ref.current?.requestCommand({ type: "delete", itemId: "a", expectedVersion: 1 });
    });
    await waitFor(() => expect(markers(container)).toHaveLength(0));
    act(() => ref.current?.requestUndo());
    await waitFor(() => expect(markers(container)).toHaveLength(1));
    act(() => ref.current?.requestRedo());
    await waitFor(() => expect(markers(container)).toHaveLength(0));
    expect(onItemsChange).toHaveBeenCalled();

    const controlled = harness({ items: [item("a", "ribbon")] });
    act(() => controlled.ref.current?.requestUndo());
    await waitFor(() =>
      expect(controlled.onDiagnostic).toHaveBeenCalledWith(
        expect.objectContaining({ code: "UNDO_UNAVAILABLE" }),
      ),
    );
  });

  it("honors delete confirmation and reports an unavailable handler", async () => {
    const denied = harness({ interaction: { confirmChange: () => false } });
    act(() => {
      denied.ref.current?.requestCommand({ type: "delete", itemId: "a", expectedVersion: 1 });
    });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(markers(denied.container)).toHaveLength(1);

    const original = window.confirm;
    Object.defineProperty(window, "confirm", { value: undefined, configurable: true });
    const unavailable = harness();
    act(() => {
      unavailable.ref.current?.requestCommand({ type: "delete", itemId: "a", expectedVersion: 1 });
    });
    await waitFor(() =>
      expect(unavailable.onDiagnostic).toHaveBeenCalledWith(
        expect.objectContaining({ code: "CONFIRMATION_UNAVAILABLE" }),
      ),
    );
    Object.defineProperty(window, "confirm", { value: original, configurable: true });
  });
});

describe("RD-06 command validation regressions", () => {
  it("commits the same paint IDs that are rendered", async () => {
    let count = 0;
    const createId = (): string => {
      count += 1;
      return `created-${count}`;
    };
    const onCommitted = vi.fn();
    const { ref, container } = harness({
      activeLayerId: "highlight",
      layers: [layer("highlight", { channel: "highlight" })],
      defaultItems: [
        item("h1", "highlight", "2016-01-04", "2016-01-08", { kind: "highlight", title: "H" }),
      ],
      interaction: { createId },
      onChangeCommitted: onCommitted,
    });
    act(() => {
      ref.current?.requestCommand({
        type: "paint",
        layerId: "highlight",
        period: { kind: "all-day", startDate: "2016-01-06", endDateExclusive: "2016-01-09" },
        operation: "union",
        defaults: { kind: "highlight", title: "H" },
        expectedVersions: { h1: 1 },
      });
    });
    await waitFor(() => expect(onCommitted).toHaveBeenCalled());
    const outcome = onCommitted.mock.calls[0]?.[0] as CommandOutcome;
    if (!outcome.accepted) throw new Error("expected acceptance");
    const committedIds = (outcome.updatedItems ?? []).map((entry) => entry.id);
    const renderedIds = Array.from(
      container.querySelectorAll('[data-yp-part="item-fragment"]'),
    ).map((node) => node.getAttribute("data-item-id"));
    expect(committedIds.sort()).toEqual(renderedIds.sort());
  });

  it("rejects duplicate create IDs, reverse periods and one-day violations", async () => {
    const { ref, onDiagnostic } = harness();
    act(() => {
      ref.current?.requestCommand({ type: "create", item: item("a", "ribbon") });
      ref.current?.requestCommand({
        type: "move",
        itemId: "a",
        proposedPeriod: {
          kind: "all-day",
          startDate: "2016-01-08",
          endDateExclusive: "2016-01-04",
        },
        expectedVersion: 1,
      });
    });
    await waitFor(() => {
      const codes = onDiagnostic.mock.calls.map(([entry]) => entry.code);
      expect(codes.filter((code) => code === "INVALID_COMMAND").length).toBeGreaterThanOrEqual(2);
    });
  });

  it("rejects invalid create kinds/periods and same-day resize", async () => {
    const { ref, onDiagnostic } = harness();
    act(() => {
      ref.current?.requestCommand({
        type: "create",
        item: item("bad-kind", "ribbon", "2016-01-04", "2016-01-05", { kind: "nope" as never }),
      });
      ref.current?.requestCommand({
        type: "create",
        item: item("bad-period", "ribbon", "2016-01-04", "2016-01-04"),
      });
      ref.current?.requestCommand({
        type: "resize",
        itemId: "a",
        proposedPeriod: {
          kind: "all-day",
          startDate: "2016-01-04",
          endDateExclusive: "2016-01-04",
        },
        expectedVersion: 1,
      });
    });
    await waitFor(() => {
      const invalid = onDiagnostic.mock.calls.filter(([entry]) => entry.code === "INVALID_COMMAND");
      expect(invalid.length).toBeGreaterThanOrEqual(3);
    });
  });

  it("rejects annotation edits because annotations are host-owned", async () => {
    const { ref, onDiagnostic } = harness({
      layers: [layer("notes", { channel: "annotation" })],
      defaultItems: [item("note", "notes", "2016-01-04", "2016-01-05", { kind: "annotation" })],
    });
    act(() => {
      ref.current?.requestCommand({
        type: "move",
        itemId: "note",
        proposedPeriod: {
          kind: "all-day",
          startDate: "2016-01-05",
          endDateExclusive: "2016-01-06",
        },
        expectedVersion: 1,
      });
    });
    await waitFor(() =>
      expect(onDiagnostic).toHaveBeenCalledWith(
        expect.objectContaining({ code: "INVALID_COMMAND" }),
      ),
    );
  });

  it("rejects undo and redo in read-only mode", async () => {
    const { ref, onDiagnostic } = harness({ readOnly: true });
    act(() => ref.current?.requestUndo());
    act(() => ref.current?.requestRedo());
    await waitFor(() =>
      expect(onDiagnostic).toHaveBeenCalledWith(expect.objectContaining({ code: "READ_ONLY" })),
    );
  });
});
