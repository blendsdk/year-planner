import { type PlannerContextMenuRequest, YearPlanner } from "@blendsdk/react-year-planner";
import type { PlannerSelection } from "@blendsdk/year-planner-core";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef, useState } from "react";
import { expect, fireEvent, userEvent, within } from "storybook/test";
import { baseItems, groups, layers, resources } from "./fixtures";

interface LogEntry {
  id: number;
  at: string;
  kind: string;
  detail: string;
}

const meta = {
  title: "Demos/Event Log",
  component: YearPlanner,
  args: {
    year: 2027,
    groups,
    layers,
    resources,
    defaultItems: baseItems,
    activeLayerId: "highlight",
    display: { theme: "material-teal", showISOWeekNumbers: true },
  },
} satisfies Meta<typeof YearPlanner>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Event-log playground: every selection, command and context-menu callback is
 * appended to a timestamped side panel so a first-time reader can see the
 * component's contract while clicking.
 */
export const EventLog: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Timestamped selection, command and context-menu events appear beside the planner as they happen.",
      },
    },
  },
  render: () => {
    const [entries, setEntries] = useState<LogEntry[]>([]);
    const nextId = useRef(0);
    const push = (kind: string, detail: string): void => {
      setEntries((previous) => [
        ...previous.slice(-11),
        { id: nextId.current++, at: new Date().toLocaleTimeString(), kind, detail },
      ]);
    };
    const selection = (next: PlannerSelection): void => {
      push("selection", `${next.dates.length} date range(s), ${next.items.length} item(s)`);
    };
    const context = (request: PlannerContextMenuRequest): void => {
      push("context", `${request.target.kind} from ${request.source}`);
    };
    return (
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <div style={{ minWidth: 0, flex: "1 1 auto" }}>
          <YearPlanner
            year={2027}
            groups={groups}
            layers={layers}
            resources={resources}
            defaultItems={baseItems}
            activeLayerId="highlight"
            display={{ theme: "material-teal", showISOWeekNumbers: true }}
            onSelectionChange={selection}
            onChangeCommitted={(outcome) =>
              push("command", outcome.accepted ? "accepted" : "rejected")
            }
            onContextMenuRequest={context}
          />
        </div>
        <aside
          data-testid="event-log"
          aria-label="Planner event log"
          style={{ width: 280, fontSize: 12 }}
        >
          <h3 style={{ margin: "0 0 8px" }}>Event log</h3>
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            {entries.map((entry) => (
              <li key={entry.id}>
                <time>{entry.at}</time> <strong>{entry.kind}</strong> {entry.detail}
              </li>
            ))}
          </ol>
        </aside>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const cell = canvasElement.querySelector('[role="gridcell"][data-date="2027-02-02"]');
    if (!(cell instanceof HTMLElement)) throw new Error("cell missing");
    await userEvent.click(cell);
    const proxy = canvasElement.querySelector(
      '[data-yp-part="item-proxy"][data-item-id="booking"]',
    );
    if (!(proxy instanceof HTMLElement)) throw new Error("proxy missing");
    fireEvent.contextMenu(proxy);
    const log = within(canvasElement).getByTestId("event-log");
    await expect(log).toHaveTextContent("selection");
    await expect(log).toHaveTextContent("context");
  },
};
