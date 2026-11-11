import type {
  CommandOutcome,
  PlannerCommand,
  PlannerItem,
  PlannerLayer,
} from "@blendsdk/year-planner-core";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { act, createRef } from "react";
import { describe, expect, it } from "vitest";
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

const base = {
  year: 2016,
  layers: [layer("ribbon")],
  defaultItems: [item("selected", "ribbon")],
};

function openInspectorSetup(overrides: Partial<YearPlannerProps> = {}, itemId = "selected") {
  const ref = createRef<YearPlannerHandle>();
  const view = render(<YearPlanner ref={ref} {...base} {...overrides} />);
  fireEvent.click(
    view.container.querySelector(
      `[data-yp-part="item-proxy"][data-item-id="${itemId}"]`,
    ) as Element,
  );
  return { ref, ...view };
}

describe("RD-06 inspector", () => {
  it("renders the aside, close button and empty hint", () => {
    render(<YearPlanner {...base} />);
    const aside = screen.getByRole("complementary", { name: "Planner inspector" });
    expect(aside).toHaveAttribute("tabindex", "-1");
    expect(screen.getByRole("button", { name: "Close inspector" })).toBeInTheDocument();
    expect(screen.getByText("Select an item or date range.")).toBeInTheDocument();
  });

  it("shows selected item details when a proxy is clicked", () => {
    openInspectorSetup();
    expect(screen.getByRole("heading", { name: "selected" })).toBeInTheDocument();
    expect(screen.getByText("Period")).toBeInTheDocument();
    expect(screen.getByText("Visibility")).toBeInTheDocument();
    expect(screen.getByText("visible")).toBeInTheDocument();
    expect(screen.getByText("Editable")).toBeInTheDocument();
  });

  it("closes locally, respects showInspector=false and reopens from the handle", () => {
    const { ref, unmount } = openInspectorSetup();
    fireEvent.click(screen.getByRole("button", { name: "Close inspector" }));
    expect(screen.queryByRole("complementary", { name: "Planner inspector" })).toBeNull();
    act(() => ref.current?.openInspector());
    expect(screen.getByRole("complementary", { name: "Planner inspector" })).toBeInTheDocument();
    unmount();

    render(<YearPlanner {...base} showInspector={false} />);
    expect(screen.queryAllByRole("complementary", { name: "Planner inspector" })).toHaveLength(0);
  });

  it("lists the active row overflow and selects an entry", () => {
    const items = Array.from({ length: 20 }, (_, index) =>
      item(`item-${index}`, "ribbon", "2016-05-02", "2016-05-05", { title: `Title ${index}` }),
    );
    const { container } = render(
      <YearPlanner
        year={2016}
        layers={[layer("ribbon")]}
        items={items}
        display={{ compactMaxLanes: 2 }}
        defaultSelection={{ dates: [], items: [], focusDate: "2016-05-02" }}
      />,
    );
    expect(screen.getByText("Hidden on this row (18)")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Title 2" }));
    expect(container.querySelector('[data-item-id="item-2"]')).not.toBeNull();
  });

  it("emits move, resize, delete and paint commands", async () => {
    const commands: PlannerCommand[] = [];
    const onChangeRequest = (command: PlannerCommand): CommandOutcome => {
      commands.push(command);
      return { accepted: true, revision: "1" };
    };
    const { ref } = openInspectorSetup({
      activeLayerId: "highlight",
      layers: [layer("ribbon"), layer("highlight", { channel: "highlight" })],
      onChangeRequest,
      interaction: { confirmChange: () => true },
      defaultItems: [item("selected", "ribbon")],
    });
    fireEvent.click(screen.getByRole("button", { name: "Move later" }));
    await waitFor(() => expect(commands).toHaveLength(1));
    expect(commands[0]).toMatchObject({
      type: "move",
      itemId: "selected",
      proposedPeriod: { startDate: "2016-01-11", endDateExclusive: "2016-01-15" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Resize longer" }));
    await waitFor(() => expect(commands).toHaveLength(2));
    expect(commands[1]).toMatchObject({
      type: "resize",
      proposedPeriod: { endDateExclusive: "2016-01-16" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Paint range" }));
    await waitFor(() => expect(commands).toHaveLength(3));
    expect(commands[2]).toMatchObject({ type: "paint", layerId: "highlight", operation: "union" });
    fireEvent.click(screen.getByRole("button", { name: "Erase range" }));
    await waitFor(() => expect(commands).toHaveLength(4));
    expect(commands[3]).toMatchObject({ type: "paint", operation: "subtract" });
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(commands).toHaveLength(5));
    expect(commands[4]).toMatchObject({ type: "delete", itemId: "selected" });
    void ref;
  });

  it("shows retry/dismiss for a timed-out command", async () => {
    let calls = 0;
    const onChangeRequest = (): Promise<CommandOutcome> => {
      calls += 1;
      return new Promise<CommandOutcome>(() => {});
    };
    openInspectorSetup({
      interaction: { commandTimeoutMs: 10 },
      onChangeRequest,
    });
    fireEvent.click(screen.getByRole("button", { name: "Move later" }));
    await waitFor(() => expect(screen.getByText("COMMAND_TIMEOUT")).toBeInTheDocument(), {
      timeout: 5000,
    });
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(calls).toBe(2), { timeout: 5000 });
    await waitFor(() => expect(screen.getByText("COMMAND_TIMEOUT")).toBeInTheDocument(), {
      timeout: 5000,
    });
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByText("COMMAND_TIMEOUT")).toBeNull();
  });

  it("replaces the body with renderInspector but keeps the owned aside", () => {
    render(
      <YearPlanner
        {...base}
        renderInspector={(context) => <div>Custom inspector with {context.items.length} items</div>}
      />,
    );
    expect(screen.getByText(/Custom inspector with/)).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "Planner inspector" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close inspector" })).toBeInTheDocument();
  });

  it("omits hidden selected items from the inspector context", () => {
    render(
      <YearPlanner
        year={2016}
        groups={[{ id: "g", name: "G" }]}
        layers={[layer("ribbon", { groupId: "g" })]}
        items={[item("secret", "ribbon", "2016-01-04", "2016-01-08", { title: "Secret" })]}
        defaultSelection={{ dates: [], items: ["secret"] }}
        defaultVisibility={{
          hiddenGroupIds: ["g"],
          hiddenLayerIds: [],
          hiddenItemIds: [],
        }}
      />,
    );
    expect(screen.queryByRole("heading", { name: "Secret" })).toBeNull();
    expect(screen.getByText("Select an item or date range.")).toBeInTheDocument();
  });

  it("uses createDefaults before activeLayerId and disables create without either", async () => {
    const commands: PlannerCommand[] = [];
    const onChangeRequest = (command: PlannerCommand): CommandOutcome => {
      commands.push(command);
      return { accepted: true, revision: "1" };
    };
    const first = render(
      <YearPlanner
        {...base}
        layers={[
          layer("ribbon"),
          layer("highlight", { channel: "highlight" }),
          layer("other", { channel: "highlight" }),
        ]}
        activeLayerId="other"
        interaction={{ createDefaults: { kind: "highlight", layerId: "highlight" } }}
        onChangeRequest={onChangeRequest}
      />,
    );
    fireEvent.click(first.container.querySelector('[data-date="2016-02-01"]') as Element);
    fireEvent.click(screen.getByRole("button", { name: "Create item" }));
    await waitFor(() => expect(commands).toHaveLength(1));
    expect(commands[0]).toMatchObject({
      type: "create",
      item: { layerId: "highlight", version: 1 },
    });
    first.unmount();

    render(<YearPlanner {...base} />);
    expect(screen.getByRole("button", { name: "Create item" })).toBeDisabled();
  });

  it("disables timed edits but keeps delete", () => {
    const timed = item("timed", "ribbon", "2016-01-04", "2016-01-08", {
      period: {
        kind: "timed",
        start: "2016-01-04T08:00:00Z",
        endExclusive: "2016-01-04T10:00:00Z",
        timeZone: "UTC",
      },
    });
    openInspectorSetup({ items: [timed] }, "timed");
    expect(screen.getByRole("button", { name: "Move later" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Resize longer" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Paint range" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Delete" })).toBeEnabled();
    expect(screen.getByText(/Timed items cannot be moved/)).toBeInTheDocument();
  });
});
