import { type PlannerContextMenuRequest, YearPlanner } from "@blendsdk/react-year-planner";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { expect, fireEvent, userEvent, within } from "storybook/test";
import { describeContextTarget } from "./context-menu-demo";
import { DemoShell } from "./DemoShell";
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

/** Entries the demo host offers for every request. */
const CONTEXT_ACTIONS = ["New item here", "Hide layer", "Delete"] as const;

/** Keeps the demo menu inside the viewport. */
function menuPosition(x: number, y: number): { left: number; top: number } {
  if (typeof window === "undefined") return { left: x, top: y };
  return {
    left: Math.min(x, Math.max(8, window.innerWidth - 214)),
    top: Math.min(y, Math.max(8, window.innerHeight - 174)),
  };
}

/**
 * Host-owned context-menu demo.
 *
 * The planner reports what was right-clicked; this component is the host. It
 * renders its own menu at the pointer, closes on an action or Escape, and
 * returns focus through `request.restoreFocus`. Nothing here ships with the
 * package: the host owns the menu, the styling and the actions.
 */
function ContextMenuDemo(): ReactNode {
  const [request, setRequest] = useState<PlannerContextMenuRequest>();
  const [status, setStatus] = useState("No request yet");
  const menuRef = useRef<HTMLDivElement>(null);

  const close = (action: string): void => {
    request?.restoreFocus();
    setStatus(`${action} · focus restored`);
    setRequest(undefined);
  };

  // Move focus into the menu so Escape and the arrow-free menu items work.
  useEffect(() => {
    if (!request) return;
    menuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();
  }, [request]);

  // A click outside dismisses the menu and returns focus to the target.
  useEffect(() => {
    if (!request) return;
    const onPointerDown = (event: PointerEvent): void => {
      if (
        menuRef.current &&
        event.target instanceof Node &&
        !menuRef.current.contains(event.target)
      ) {
        request.restoreFocus();
        setStatus("Dismissed · focus restored");
        setRequest(undefined);
      }
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    return () => window.removeEventListener("pointerdown", onPointerDown, true);
  }, [request]);

  const position = request ? menuPosition(request.clientX, request.clientY) : { left: 0, top: 0 };

  return (
    <DemoShell
      title="Context menu demo"
      hint="Right-click a date cell or a ribbon item. This menu is rendered by the host, not the planner."
      status={status}
    >
      <YearPlanner
        year={2027}
        groups={groups}
        layers={layers}
        resources={resources}
        defaultItems={baseItems}
        activeLayerId="highlight"
        showInspector={false}
        display={{ theme: "classic-blue", showISOWeekNumbers: true }}
        onContextMenuRequest={(next) => {
          setRequest(next);
          setStatus(`${describeContextTarget(next.target)} · ${next.source}`);
        }}
      />
      {request && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Host-owned context menu"
          data-testid="demo-menu"
          style={{
            position: "fixed",
            left: position.left,
            top: position.top,
            zIndex: 20,
            minWidth: 190,
            padding: 4,
            border: "1px solid #71818b",
            borderRadius: 6,
            background: "#ffffff",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.18)",
            fontSize: 13,
          }}
          onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            close("Dismissed");
          }}
        >
          <div
            role="presentation"
            style={{
              padding: "4px 8px",
              borderBottom: "1px solid #d9e2e8",
              color: "#4a5a63",
              fontSize: 11,
            }}
          >
            {describeContextTarget(request.target)}
          </div>
          {CONTEXT_ACTIONS.map((action) => (
            <button
              key={action}
              type="button"
              role="menuitem"
              onClick={() => close(action)}
              style={{
                display: "block",
                width: "100%",
                padding: "6px 8px",
                border: 0,
                background: "transparent",
                textAlign: "left",
                font: "inherit",
                cursor: "pointer",
              }}
            >
              {action}
            </button>
          ))}
        </div>
      )}
    </DemoShell>
  );
}

/** Raises a host-owned context-menu request from a right-click. */
export const ContextMenu: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Right-click a date cell or a ribbon item. The planner raises a host-owned request; this demo renders its own menu and returns focus when it closes.",
      },
    },
  },
  render: () => <ContextMenuDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    fireEvent.contextMenu(proxy(canvasElement, "booking"));
    const menu = await canvas.findByRole("menu");
    await expect(menu).toBeVisible();
    await expect(menu).toHaveTextContent("item booking");
    await userEvent.click(within(menu).getByRole("menuitem", { name: "Hide layer" }));
    await expect(canvas.queryByRole("menu")).toBeNull();
    await expect(canvas.getByTestId("demo-status")).toHaveTextContent(
      "Hide layer · focus restored",
    );

    fireEvent.contextMenu(cell(canvasElement, "2027-03-20"));
    const dateMenu = await canvas.findByRole("menu");
    await expect(dateMenu).toHaveTextContent("date 2027-03-20");
    await userEvent.keyboard("{Escape}");
    await expect(canvas.queryByRole("menu")).toBeNull();
  },
};
