import type { PlannerItem, PlannerLayer } from "@blendsdk/year-planner-core";
import { act, fireEvent, render, waitFor } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import type { YearPlannerHandle } from "./types.js";
import { YearPlanner } from "./YearPlanner.js";

const layers: PlannerLayer[] = [
  {
    id: "bookings",
    name: "Bookings",
    channel: "ribbon",
    label: "B",
    pattern: "hatch",
    color: "#1d4e89",
  },
  { id: "notes", name: "Notes", channel: "annotation", color: "#f6bd60" },
];

const items: PlannerItem[] = [
  {
    id: "booking",
    kind: "activity",
    layerId: "bookings",
    period: { kind: "all-day", startDate: "2027-02-01", endDateExclusive: "2027-02-04" },
    title: "Winter booking",
    status: "confirmed",
    version: 1,
  },
  {
    id: "holiday",
    kind: "annotation",
    layerId: "notes",
    period: { kind: "all-day", startDate: "2027-03-09", endDateExclusive: "2027-03-10" },
    title: "Holiday",
    annotation: { label: "OH" },
    version: 1,
  },
];

const bookingFixture = items[0];
if (!bookingFixture) throw new Error("booking fixture missing");

function setup() {
  return render(
    <YearPlanner
      year={2027}
      layers={layers}
      defaultItems={items}
      defaultSelection={{
        dates: [{ startDate: "2027-02-01", endDateExclusive: "2027-02-03" }],
        items: [],
      }}
      display={{ showISOWeekNumbers: true }}
    />,
  );
}

describe("RD-09-AC-01/02/03: semantics", () => {
  it("labels the root region and the grid as a nested pair", () => {
    const { container } = setup();
    const root = container.querySelector('[data-yp-part="root"]') as HTMLElement;
    const grid = container.querySelector('[data-yp-part="grid"]') as HTMLElement;
    expect(root).toHaveAttribute("role", "region");
    expect(root).toHaveAttribute("aria-label", "Year planner 2027");
    expect(grid).toHaveAttribute("aria-label", "Year planner 2027 grid");
    const describedBy = grid.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(container.querySelector(`[id="${describedBy}"]`)?.textContent).toContain("arrow keys");
  });

  it("includes the date, item count and selected state on a cell", () => {
    const { container } = setup();
    const cell = container.querySelector('[data-date="2027-02-01"]') as HTMLElement;
    expect(cell).toHaveAttribute("role", "gridcell");
    expect(cell).toHaveAttribute("aria-selected", "true");
    expect(cell).toHaveAccessibleName(/Feb 1, 2027/);
    expect(cell).toHaveAccessibleName(/1 item/);
    expect(cell).toHaveAccessibleName(/selected/);
    expect(cell.querySelector(".yp-day-number")).not.toHaveAttribute("aria-hidden");
  });

  it("marks unselected cells and includes the ISO week when shown", () => {
    const { container } = setup();
    const weekCell = container.querySelector('[data-date="2027-01-01"]') as HTMLElement;
    expect(weekCell).toHaveAccessibleName(/ISO week 53/);
    expect(weekCell).toHaveAttribute("aria-selected", "false");
  });

  it("describes the item proxy with title, period, layer, pattern, status and selection", () => {
    const { container } = setup();
    const proxy = container.querySelector(
      '[data-yp-part="item-proxy"][data-item-id="booking"]',
    ) as HTMLElement;
    const name = proxy.getAttribute("aria-label") ?? "";
    expect(name).toContain("Winter booking");
    expect(name).toContain("Feb 1, 2027 - Feb 3, 2027");
    expect(name).toContain("layer B");
    expect(name).toContain("hatch pattern");
    expect(name).toContain("status confirmed");
    expect(name).toContain("not selected");
  });

  it("keeps the annotation label and title in the proxy name", () => {
    const { container } = setup();
    const proxy = container.querySelector(
      '[data-yp-part="item-proxy"][data-item-id="holiday"]',
    ) as HTMLElement;
    const name = proxy.getAttribute("aria-label") ?? "";
    expect(name).toContain("OH");
    expect(name).toContain("Holiday");
  });

  it("hides decorative non-date cells from the accessibility tree", () => {
    const { container } = setup();
    const filler = container.querySelector(".yp-cell.yp-outside") as HTMLElement;
    expect(filler).toHaveAttribute("aria-hidden", "true");
    expect(filler).not.toHaveAttribute("tabindex");
  });
});

describe("RD-09-AC-04/11/12: item list", () => {
  it("lists every visible item and excludes hidden items", () => {
    const { container } = render(
      <YearPlanner
        year={2027}
        layers={layers}
        defaultItems={[...items, { ...bookingFixture, id: "hidden", title: "Hidden booking" }]}
        defaultVisibility={{
          hiddenGroupIds: [],
          hiddenLayerIds: [],
          hiddenItemIds: ["hidden"],
        }}
      />,
    );
    const list = container.querySelector('[data-yp-part="item-list"]') as HTMLElement;
    expect(list).not.toBeNull();
    expect(list.textContent).toContain("All visible items (2)");
    expect(list.textContent).toContain("Winter booking");
    expect(list.textContent).toContain("Holiday");
    expect(list.textContent).not.toContain("Hidden booking");
    expect(list.querySelectorAll('[data-yp-part="item-list-entry"]')).toHaveLength(2);
  });

  it("marks an item that is hidden on the active month row", () => {
    const crowded: PlannerItem[] = ["a", "b", "c"].map((id) => ({
      ...bookingFixture,
      id,
      title: `Booking ${id}`,
    }));
    const { container } = render(
      <YearPlanner
        year={2027}
        layers={layers}
        defaultItems={crowded}
        defaultSelection={{ dates: [], items: [], focusDate: "2027-02-01" }}
        display={{ compactMaxLanes: 1 }}
      />,
    );
    const list = container.querySelector('[data-yp-part="item-list"]') as HTMLElement;
    expect(list.textContent).toContain("hidden on this month");
  });

  it("selects and focuses the item when a list entry is pressed", async () => {
    const { container } = render(<YearPlanner year={2027} layers={layers} defaultItems={items} />);
    const entry = container.querySelector(
      '[data-yp-part="item-list-entry"][data-yp-item-id="booking"]',
    ) as HTMLElement;
    fireEvent.click(entry);
    const proxy = container.querySelector(
      '[data-yp-part="item-proxy"][data-item-id="booking"]',
    ) as HTMLElement;
    await waitFor(() => expect(proxy).toHaveFocus());
    expect(proxy).toHaveAttribute("aria-pressed", "true");
  });

  it("keeps the planner item list when a custom inspector body is supplied", () => {
    const { container } = render(
      <YearPlanner
        year={2027}
        layers={layers}
        defaultItems={items}
        renderInspector={() => <p>Custom inspector</p>}
      />,
    );
    expect(container.querySelector('[data-yp-part="item-list"]')).not.toBeNull();
    expect(container.textContent).toContain("Custom inspector");
  });

  it("shows selected item details in the inspector", () => {
    const { container } = render(
      <YearPlanner
        year={2027}
        layers={layers}
        defaultItems={items}
        defaultSelection={{ dates: [], items: ["booking"] }}
      />,
    );
    const inspector = container.querySelector('[data-yp-part="inspector"]') as HTMLElement;
    expect(inspector.textContent).toContain("Winter booking");
    expect(inspector.textContent).toContain("activity");
    expect(inspector.textContent).toContain("Bookings");
    expect(inspector.textContent).toContain("Feb 1, 2027 - Feb 3, 2027");
  });
});

describe("RD-09-AC-02/05: focus model", () => {
  it("keeps exactly one date cell, one proxy and one overflow button in the tab order", () => {
    const crowded: PlannerItem[] = ["a", "b", "c"].map((id) => ({
      ...bookingFixture,
      id,
      title: `Booking ${id}`,
    }));
    const { container } = render(
      <YearPlanner
        year={2027}
        layers={layers}
        defaultItems={crowded}
        defaultSelection={{ dates: [], items: [], focusDate: "2027-02-01" }}
        display={{ compactMaxLanes: 1 }}
      />,
    );
    expect(container.querySelectorAll('[role="gridcell"][tabindex="0"]')).toHaveLength(1);
    expect(container.querySelectorAll('[data-yp-part="item-proxy"][tabindex="0"]')).toHaveLength(1);
    expect(
      container.querySelectorAll('[data-yp-part="overflow-button"][tabindex="0"]'),
    ).toHaveLength(1);
    const button = container.querySelector(
      '[data-yp-part="overflow-button"][tabindex="0"]',
    ) as HTMLElement;
    expect(button.closest("[data-yp-row-id]")).toHaveAttribute("data-yp-row-id", "2027-02");
  });

  it("falls back to the nearest enabled date when the first date is disabled", () => {
    const { container } = render(
      <YearPlanner
        year={2027}
        layers={layers}
        defaultItems={items}
        getDateMeta={(date) => (date === "2026-12-01" ? { disabled: true } : undefined)}
      />,
    );
    const tabbable = container.querySelector('[role="gridcell"][tabindex="0"]') as HTMLElement;
    expect(tabbable).toHaveAttribute("data-date", "2026-12-02");
    expect(container.querySelectorAll('[role="gridcell"][tabindex="0"]')).toHaveLength(1);
  });

  it("moves to the first and last enabled date of a row with Home and End", () => {
    const { container } = render(
      <YearPlanner
        year={2027}
        layers={layers}
        defaultItems={items}
        defaultSelection={{ dates: [], items: [], focusDate: "2027-02-15" }}
      />,
    );
    const cell = container.querySelector('[data-date="2027-02-15"]') as HTMLElement;
    fireEvent.keyDown(cell, { key: "Home" });
    expect(container.querySelector('[role="gridcell"][tabindex="0"]')).toHaveAttribute(
      "data-date",
      "2027-02-01",
    );
    fireEvent.keyDown(container.querySelector('[data-date="2027-02-01"]') as HTMLElement, {
      key: "End",
    });
    expect(container.querySelector('[role="gridcell"][tabindex="0"]')).toHaveAttribute(
      "data-date",
      "2027-02-28",
    );
  });

  it("opens the inspector and focuses the item list from the skip link", async () => {
    const { container } = render(<YearPlanner year={2027} layers={layers} defaultItems={items} />);
    const link = container.querySelector(".yp-skip-link") as HTMLElement;
    expect(link).not.toBeNull();
    expect(link.getAttribute("href")).toBe(
      `#${container.querySelector('[data-yp-part="item-list"]')?.getAttribute("id")}`,
    );
    fireEvent.click(link);
    const list = container.querySelector('[data-yp-part="item-list"]') as HTMLElement;
    await waitFor(() => expect(list).toHaveFocus());
  });

  it("keeps one proxy tab stop after select-all includes backdrop items", () => {
    const { container } = render(
      <YearPlanner
        year={2027}
        layers={layers}
        defaultItems={[
          ...items,
          {
            ...bookingFixture,
            id: "backdrop",
            layerId: "notes",
            kind: "highlight",
            title: "Backdrop",
          },
        ]}
      />,
    );
    fireEvent.keyDown(container.querySelector('[data-yp-part="grid"]') as HTMLElement, {
      key: "a",
      ctrlKey: true,
    });
    expect(container.querySelectorAll('[data-yp-part="item-proxy"][tabindex="0"]')).toHaveLength(1);
    expect(
      container.querySelector('[data-yp-part="grid"]')?.getAttribute("aria-multiselectable"),
    ).toBe("true");
  });

  it("keeps focus on the inspector move action after acceptance", async () => {
    const { container } = render(
      <YearPlanner
        year={2027}
        layers={layers}
        defaultItems={items}
        defaultSelection={{ dates: [], items: ["booking"] }}
      />,
    );
    const move = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Move later"),
    ) as HTMLButtonElement;
    move.focus();
    fireEvent.click(move);
    await waitFor(() => expect(move).toHaveFocus());
  });
});

describe("RD-09-AC-05/06: announcements", () => {
  const moveButton = (container: HTMLElement) =>
    Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Move later"),
    ) as HTMLButtonElement;

  it("shows and announces a pending then accepted move once", async () => {
    let resolve!: (value: { accepted: true; revision: string }) => void;
    const response = new Promise<{ accepted: true; revision: string }>((done) => {
      resolve = done;
    });
    const { container } = render(
      <YearPlanner
        year={2027}
        layers={layers}
        defaultItems={items}
        defaultSelection={{ dates: [], items: ["booking"] }}
        onChangeRequest={() => response}
      />,
    );
    fireEvent.click(moveButton(container));
    const status = container.querySelector('[data-yp-part="command-status"]') as HTMLElement;
    const polite = container.querySelector('[data-yp-part="command-announcer"]') as HTMLElement;
    await waitFor(() => expect(status).toHaveTextContent("Change pending"));
    expect(polite).toHaveTextContent("Change pending");
    resolve({ accepted: true, revision: "2" });
    await waitFor(() => expect(status).toHaveTextContent("Change accepted"));
    await waitFor(() => expect(polite.textContent).toBe("Change accepted"));
  });

  it("shows and assertively announces a rejection with the feedback association", async () => {
    const { container } = render(
      <YearPlanner
        year={2027}
        layers={layers}
        defaultItems={items}
        defaultSelection={{ dates: [], items: ["booking"] }}
        onChangeRequest={() => ({
          accepted: false,
          diagnostics: [{ code: "CAPACITY_EXCEEDED", level: "error", message: "Full" }],
        })}
      />,
    );
    fireEvent.click(moveButton(container));
    const status = container.querySelector('[data-yp-part="command-status"]') as HTMLElement;
    const alert = container.querySelector('[data-yp-part="error-announcer"]') as HTMLElement;
    await waitFor(() => expect(status).toHaveTextContent("Change rejected: Full"));
    expect(alert).toHaveAttribute("role", "alert");
    await waitFor(() => expect(alert.textContent).toBe("Change rejected: Full"));
    const liveWithText = Array.from(
      container.querySelectorAll('[aria-live], [role="alert"]'),
    ).filter((element) => element.textContent?.includes("Change rejected"));
    expect(liveWithText).toHaveLength(1);
    const feedback = container.querySelector('[data-yp-part="inspector-feedback"]') as HTMLElement;
    expect(feedback).not.toBeNull();
    const proxy = container.querySelector(
      '[data-yp-part="item-proxy"][data-item-id="booking"]',
    ) as HTMLElement;
    expect(proxy.getAttribute("aria-describedby")).toContain(feedback.id);
  });

  it("announces a selection change politely", async () => {
    const { container } = render(
      <YearPlanner
        year={2027}
        layers={layers}
        defaultItems={items}
        defaultSelection={{ dates: [], items: [], focusDate: "2027-02-01" }}
      />,
    );
    fireEvent.click(container.querySelector('[data-date="2027-02-01"]') as HTMLElement);
    const selection = container.querySelector(
      '[data-yp-part="selection-announcer"]',
    ) as HTMLElement;
    await waitFor(() => expect(selection).toHaveTextContent("Selection: 0 items, 1 day"));
  });

  it("announces a timeout assertively", async () => {
    const { container } = render(
      <YearPlanner
        year={2027}
        layers={layers}
        defaultItems={items}
        defaultSelection={{ dates: [], items: ["booking"] }}
        interaction={{ commandTimeoutMs: 25 }}
        onChangeRequest={() => new Promise(() => {})}
      />,
    );
    fireEvent.click(moveButton(container));
    const alert = container.querySelector('[data-yp-part="error-announcer"]') as HTMLElement;
    await waitFor(() => expect(alert).toHaveTextContent("Change timed out"), { timeout: 2000 });
  });

  it("hides a dismissed error status while keeping accepted status", async () => {
    const { container } = render(
      <YearPlanner
        year={2027}
        layers={layers}
        defaultItems={items}
        defaultSelection={{ dates: [], items: ["booking"] }}
        onChangeRequest={() => ({
          accepted: false,
          diagnostics: [{ code: "CAPACITY_EXCEEDED", level: "error", message: "Full" }],
        })}
      />,
    );
    fireEvent.click(moveButton(container));
    const status = container.querySelector('[data-yp-part="command-status"]') as HTMLElement;
    await waitFor(() => expect(status).toHaveTextContent("Change rejected"));
    const dismiss = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Dismiss",
    ) as HTMLButtonElement;
    fireEvent.click(dismiss);
    await waitFor(() =>
      expect(container.querySelector('[data-yp-part="command-status"]')).toBeNull(),
    );
  });

  it("announces a visibility change and the remaining visible count", async () => {
    const ref = createRef<YearPlannerHandle>();
    const { container } = render(
      <YearPlanner ref={ref} year={2027} layers={layers} defaultItems={items} />,
    );
    await act(async () => ref.current?.hideItem("booking"));
    const announcement = container.querySelector(
      '[data-yp-part="visibility-announcer"]',
    ) as HTMLElement;
    await waitFor(() =>
      expect(announcement).toHaveTextContent("Visibility changed: 1 visible item"),
    );
  });
});
