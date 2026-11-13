import type { ReactNode } from "react";

/**
 * Props for the bounded Storybook demo frame.
 */
export interface DemoShellProps {
  /** Short title shown at the left of the hint bar. */
  title: string;
  /** Instruction shown next to the title. */
  hint: ReactNode;
  /** Last request or action, shown at the right of the hint bar. */
  status: ReactNode;
  /** Planner and any host-owned menu. */
  children: ReactNode;
}

/**
 * Gives a planner story a real host box.
 *
 * Storybook sizes the story root to its content, so an unconstrained planner
 * grows to its natural 14-row height and `display.fit` has nothing to measure.
 * This shell reserves the canvas viewport, keeps the hint and the last action
 * visible above the grid, and hands the remaining box to the planner.
 *
 * The host box is the shell's second child, which is what the planner measures
 * to compute its fit. Do not add a wrapper between them without giving it an
 * explicit height, or the fit falls back to the content height again.
 */
export function DemoShell({ title, hint, status, children }: DemoShellProps): ReactNode {
  return (
    <div
      style={{
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        overflow: "hidden",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          flexWrap: "wrap",
          gap: 12,
          padding: "8px 12px",
          borderBottom: "1px solid #d9e2e8",
          background: "#f7fafb",
          fontSize: 13,
          color: "#1b2329",
        }}
      >
        <strong>{title}</strong>
        <span>{hint}</span>
        <span
          data-testid="demo-status"
          role="status"
          style={{ marginLeft: "auto", color: "#4a5a63" }}
        >
          {status}
        </span>
      </div>
      <div style={{ flex: "1 1 0", minHeight: 0, overflow: "hidden" }}>{children}</div>
    </div>
  );
}
