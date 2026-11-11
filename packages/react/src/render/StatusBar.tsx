import type { ReactNode } from "react";
import type { CommandStatusView } from "../announcements.js";

/** Props for the visible command status bar. */
export interface StatusBarProps {
  /** Current status, or `undefined` when idle. */
  status: CommandStatusView | undefined;
}

/**
 * Renders the visible command status summary.
 *
 * The bar is deliberately not a live region: hidden announcers own speech so a
 * sighted message never causes a duplicate announcement.
 */
export function StatusBar({ status }: StatusBarProps): ReactNode {
  if (!status) return null;
  return (
    <p className="yp-command-status" data-yp-part="command-status" data-yp-level={status.level}>
      {status.text}
    </p>
  );
}
