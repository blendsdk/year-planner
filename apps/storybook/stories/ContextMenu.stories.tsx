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
import { useState } from "react";
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
    display: { theme: "classic-blue", showISOWeekNumbers: true },
  },
} satisfies Meta<typeof YearPlanner>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Closes a request and returns focus to the originating cell or item. */
function close(request: PlannerContextMenuRequest | undefined, clear: () => void): void {
  request?.restoreFocus();
  clear();
}

/**
 * Fluent UI v9 menu rendered by the host from `onContextMenuRequest`.
 *
 * The planner only reports the target and coordinates; the menu lives in the
 * host's Fluent provider and calls `restoreFocus` when it closes.
 */
export const FluentMenuExample: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Host-owned Fluent UI v9 menu anchored at the pointer; the planner raises the request and never renders a menu itself.",
      },
    },
  },
  render: () => {
    const [request, setRequest] = useState<PlannerContextMenuRequest>();
    return (
      <FluentProvider theme={webLightTheme}>
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
                if (!data.open) close(request, () => setRequest(undefined));
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
                  <FluentMenuItem onClick={() => close(request, () => setRequest(undefined))}>
                    New item here
                  </FluentMenuItem>
                  <FluentMenuItem onClick={() => close(request, () => setRequest(undefined))}>
                    Hide layer
                  </FluentMenuItem>
                  <FluentMenuItem onClick={() => close(request, () => setRequest(undefined))}>
                    Delete
                  </FluentMenuItem>
                </FluentMenuList>
              </FluentMenuPopover>
            </FluentMenu>
          </div>
        )}
      </FluentProvider>
    );
  },
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
          "Host-owned MUI menu opened at the pointer coordinates; the planner contract is identical and design-system neutral.",
      },
    },
  },
  render: () => {
    const [request, setRequest] = useState<PlannerContextMenuRequest>();
    return (
      <ThemeProvider theme={createTheme()}>
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
        <MuiMenu
          open={request !== undefined}
          onClose={() => close(request, () => setRequest(undefined))}
          anchorReference="anchorPosition"
          anchorPosition={
            request ? { top: request.clientY, left: request.clientX } : { top: 0, left: 0 }
          }
        >
          <MuiMenuItem onClick={() => close(request, () => setRequest(undefined))}>
            New item here
          </MuiMenuItem>
          <MuiMenuItem onClick={() => close(request, () => setRequest(undefined))}>
            Hide layer
          </MuiMenuItem>
          <MuiMenuItem onClick={() => close(request, () => setRequest(undefined))}>
            Delete
          </MuiMenuItem>
        </MuiMenu>
      </ThemeProvider>
    );
  },
};
