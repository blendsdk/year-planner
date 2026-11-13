import { type PlannerContextMenuRequest, YearPlanner } from "@blendsdk/react-year-planner";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fireEvent, userEvent, within } from "storybook/test";
import { baseItems, groups, layers, resources } from "./fixtures";

const meta = {
  title: "Demos",
  component: YearPlanner,
  args: {
    year: 2027,
    groups,
    layers,
    resources,
    defaultItems: baseItems,
    activeLayerId: "highlight",
    display: { theme: "classic-blue", showISOWeekNumbers: true },
  },
} satisfies Meta<typeof YearPlanner>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Returns one date cell from the story canvas. */
function cell(canvasElement: HTMLElement, date: string): HTMLElement {
  const element = canvasElement.querySelector(`[role="gridcell"][data-date="${date}"]`);
  if (!(element instanceof HTMLElement)) throw new Error(`cell ${date} missing`);
  return element;
}

/** Returns the first proxy for one item. */
function proxy(canvasElement: HTMLElement, itemId: string): HTMLElement {
  const element = canvasElement.querySelector(
    `[data-yp-part="item-proxy"][data-item-id="${itemId}"]`,
  );
  if (!(element instanceof HTMLElement)) throw new Error(`proxy ${itemId} missing`);
  return element;
}

/** Selects a range with a plain click and a Shift-click. */
export const SelectRange: Story = {
  parameters: {
    docs: {
      description: {
        story: "Click a start date, hold Shift and click an end date to select a range.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(cell(canvasElement, "2027-02-01"));
    await userEvent.keyboard("{Shift>}");
    await userEvent.click(cell(canvasElement, "2027-02-05"));
    await userEvent.keyboard("{/Shift}");
    await expect(cell(canvasElement, "2027-02-05")).toHaveAttribute("aria-selected", "true");
    await expect(cell(canvasElement, "2027-02-03")).toHaveAttribute("aria-selected", "true");
  },
};

/** Moves a selected item one week later from the inspector. */
export const MoveItem: Story = {
  parameters: {
    docs: {
      description: {
        story: "Select an item, then use Move later in the inspector to shift its period.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(proxy(canvasElement, "booking"));
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Move later" }));
    await expect(canvas.getByRole("complementary", { name: "Planner inspector" })).toBeVisible();
  },
};

/** Extends a selected item from the inspector. */
export const ResizeItem: Story = {
  parameters: {
    docs: {
      description: {
        story: "Select an item, then use Resize longer to extend its end date.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(proxy(canvasElement, "maintenance"));
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Resize longer" }));
    await expect(canvas.getByRole("complementary", { name: "Planner inspector" })).toBeVisible();
  },
};

/** Paints a highlight range with a pointer drag. */
export const PaintLayer: Story = {
  args: { interaction: { mode: "paint" } },
  parameters: {
    docs: {
      description: {
        story: "Drag across dates in paint mode to add a highlight range to the active layer.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const start = cell(canvasElement, "2027-02-01");
    const end = cell(canvasElement, "2027-02-05");
    const startRect = start.getBoundingClientRect();
    const endRect = end.getBoundingClientRect();
    const point = (rect: DOMRect) => ({
      bubbles: true,
      cancelable: true,
      button: 0,
      pointerId: 1,
      isPrimary: true,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2,
    });
    fireEvent.pointerDown(start, point(startRect));
    fireEvent.pointerMove(end, point(endRect));
    fireEvent.pointerUp(end, point(endRect));
    await expect(canvasElement.querySelector('[data-yp-channel="highlight"]')).not.toBeNull();
  },
};

/** Moves keyboard focus across dates. */
export const KeyboardNavigation: Story = {
  parameters: {
    docs: {
      description: {
        story: "Focus a date cell and use the arrow keys to move the roving focus.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const start = cell(canvasElement, "2027-02-01");
    start.focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(document.activeElement).toHaveAttribute("data-date", "2027-02-02");
  },
};

/** Raises a host-owned context-menu request from a right-click. */
export const ContextMenu: Story = {
  parameters: {
    docs: {
      description: {
        story: "Right-click an item to raise a host-owned request; the demo shows the payload.",
      },
    },
  },
  render: () => {
    const [request, setRequest] = useState<PlannerContextMenuRequest>();
    return (
      <div>
        <YearPlanner
          year={2027}
          groups={groups}
          layers={layers}
          resources={resources}
          defaultItems={baseItems}
          activeLayerId="highlight"
          display={{ theme: "classic-blue", showISOWeekNumbers: true }}
          onContextMenuRequest={setRequest}
        />
        <output data-testid="demo-context" style={{ display: "block", marginTop: 8 }}>
          {request ? `${request.target.kind}:${request.source}` : "No request yet"}
        </output>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    fireEvent.contextMenu(proxy(canvasElement, "booking"));
    await expect(within(canvasElement).getByTestId("demo-context")).toHaveTextContent(
      "item:pointer",
    );
  },
};
