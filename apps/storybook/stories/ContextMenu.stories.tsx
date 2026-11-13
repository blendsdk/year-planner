import type { PlannerContextMenuRequest } from "@blendsdk/react-year-planner";
import { YearPlanner } from "@blendsdk/react-year-planner";
import {
  Menu as FluentMenu,
  MenuItem as FluentMenuItem,
  MenuList as FluentMenuList,
  MenuPopover as FluentMenuPopover,
  MenuTrigger as FluentMenuTrigger,
  FluentProvider,
  webLightTheme,
} from "@fluentui/react-components";
import {
  createTheme,
  Menu as MuiMenu,
  MenuItem as MuiMenuItem,
  ThemeProvider,
} from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ReactNode, useState } from "react";
import { describeContextTarget } from "./context-menu-demo";
import { DemoShell } from "./DemoShell";
import { describeStories } from "./describe";
import { baseItems, groups, layers, resources } from "./fixtures";

const meta = {
  title: "Year Planner/Context Menu",
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

/** Entries the host examples offer for every request. */
const CONTEXT_ACTIONS = ["New item here", "Hide layer", "Delete"] as const;

/**
 * Fluent UI v9 host example.
 *
 * The planner only reports the target and coordinates. The menu, its provider
 * and its actions belong to the host; closing it returns focus to the
 * originating cell or item through `request.restoreFocus`.
 */
function FluentMenuDemo(): ReactNode {
  const [request, setRequest] = useState<PlannerContextMenuRequest>();
  const [status, setStatus] = useState("No request yet");

  const close = (action: string): void => {
    request?.restoreFocus();
    setStatus(`${action} · focus restored`);
    setRequest(undefined);
  };

  return (
    <FluentProvider theme={webLightTheme} style={{ display: "block", height: "100dvh" }}>
      <DemoShell
        title="Fluent UI v9 menu"
        hint="Right-click a date cell, a ribbon item or an annotation chip."
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
          display={{ theme: "material-teal", showISOWeekNumbers: true }}
          onContextMenuRequest={(next) => {
            setRequest(next);
            setStatus(describeContextTarget(next.target));
          }}
        />
        {request && (
          <div
            style={{
              position: "fixed",
              left: request.clientX,
              top: request.clientY,
              width: 0,
              height: 0,
            }}
          >
            <FluentMenu
              open
              onOpenChange={(_event, data) => {
                if (!data.open) close("Dismissed");
              }}
            >
              <FluentMenuTrigger disableButtonEnhancement>
                <button
                  type="button"
                  aria-label="Context menu anchor"
                  tabIndex={-1}
                  style={{ width: 1, height: 1, opacity: 0 }}
                />
              </FluentMenuTrigger>
              <FluentMenuPopover>
                <FluentMenuList>
                  {CONTEXT_ACTIONS.map((action) => (
                    <FluentMenuItem key={action} onClick={() => close(action)}>
                      {action}
                    </FluentMenuItem>
                  ))}
                </FluentMenuList>
              </FluentMenuPopover>
            </FluentMenu>
          </div>
        )}
      </DemoShell>
    </FluentProvider>
  );
}

/**
 * MUI host example.
 *
 * `anchorReference="anchorPosition"` opens the menu exactly at the pointer.
 * The planner contract is identical and design-system neutral.
 */
function MuiMenuDemo(): ReactNode {
  const [request, setRequest] = useState<PlannerContextMenuRequest>();
  const [status, setStatus] = useState("No request yet");

  const close = (action: string): void => {
    request?.restoreFocus();
    setStatus(`${action} · focus restored`);
    setRequest(undefined);
  };

  return (
    <ThemeProvider theme={createTheme()}>
      <DemoShell
        title="MUI menu"
        hint="Right-click a date cell, a ribbon item or an annotation chip."
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
          display={{ theme: "material-teal", showISOWeekNumbers: true }}
          onContextMenuRequest={(next) => {
            setRequest(next);
            setStatus(describeContextTarget(next.target));
          }}
        />
        <MuiMenu
          open={request !== undefined}
          onClose={() => close("Dismissed")}
          anchorReference="anchorPosition"
          anchorPosition={
            request ? { top: request.clientY, left: request.clientX } : { top: 0, left: 0 }
          }
        >
          {CONTEXT_ACTIONS.map((action) => (
            <MuiMenuItem key={action} onClick={() => close(action)}>
              {action}
            </MuiMenuItem>
          ))}
        </MuiMenu>
      </DemoShell>
    </ThemeProvider>
  );
}

/**
 * Fluent UI v9 menu rendered by the host from `onContextMenuRequest`.
 *
 * The planner raises the request and never renders a menu itself. Right-click a
 * date cell, a ribbon item or an annotation chip.
 */
export const FluentMenuExample: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Right-click a date cell or an item. The host renders this Fluent UI v9 menu at the pointer and returns focus when it closes; the planner never renders a menu itself.",
      },
    },
  },
  render: () => <FluentMenuDemo />,
};

/**
 * MUI menu rendered by the host from `onContextMenuRequest`.
 *
 * The menu uses `anchorReference="anchorPosition"` so it opens exactly at the
 * pointer, and returns focus on close.
 */
export const MuiMenuExample: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Right-click a date cell or an item. The host renders this MUI menu at the pointer; the planner contract is identical and design-system neutral.",
      },
    },
  },
  render: () => <MuiMenuDemo />,
};

describeStories({ FluentMenuExample, MuiMenuExample });
