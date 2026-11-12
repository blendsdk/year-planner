import type { PlannerSelection, VisibilityState } from "@blendsdk/year-planner-core";
import { useEffect, useMemo, useRef, useState } from "react";
import { selectionSummary } from "./a11y.js";
import { type CommandStatusView, commandStatusView } from "./announcements.js";
import type { CommandSettlement } from "./commands.js";

/**
 * Inputs for the announcement hook.
 */
export interface UseAnnouncementsInput {
  /** True while at least one command is pending. */
  pending: boolean;
  /** Last terminal command result. */
  settled: CommandSettlement | undefined;
  /** Whether failure feedback is still visible. */
  feedbackVisible: boolean;
  /** Current selection. */
  selection: PlannerSelection;
  /** Current visibility state. */
  visibility: VisibilityState;
  /** Number of effectively visible items. */
  visibleItemCount: number;
}

/**
 * Messages and visible status owned by the announcement hook.
 */
export interface AnnouncementState {
  /** Visible status bar view, or `undefined`. */
  status: CommandStatusView | undefined;
  /** Polite command message. */
  polite: string | undefined;
  /** Assertive command error message. */
  assertive: string | undefined;
  /** Polite selection message. */
  selection: string | undefined;
  /** Polite visibility message. */
  visibility: string | undefined;
}

function selectionSignature(selection: PlannerSelection): string {
  return JSON.stringify({ dates: selection.dates, items: selection.items });
}

function visibilitySignature(visibility: VisibilityState): string {
  return JSON.stringify({
    groups: [...visibility.hiddenGroupIds].sort(),
    layers: [...visibility.hiddenLayerIds].sort(),
    items: [...visibility.hiddenItemIds].sort(),
    channels: [...(visibility.hiddenChannels ?? [])].sort(),
  });
}

function announce(setter: (value: string | undefined) => void, message: string): void {
  setter(undefined);
  if (typeof queueMicrotask === "function") {
    queueMicrotask(() => setter(message));
  } else {
    setter(message);
  }
}

/**
 * Owns command, selection and visibility announcements.
 *
 * Pending and accepted outcomes use the polite channel; rejected outcomes use
 * the assertive channel. The first render never announces a seeded selection or
 * visibility state. Each settlement object identity produces one announcement.
 *
 * @param input - Pipeline, selection and visibility state.
 * @returns Visible status and the live-region messages.
 */
export function useAnnouncements(input: UseAnnouncementsInput): AnnouncementState {
  const [polite, setPolite] = useState<string | undefined>(undefined);
  const [assertive, setAssertive] = useState<string | undefined>(undefined);
  const [selection, setSelection] = useState<string | undefined>(undefined);
  const [visibility, setVisibility] = useState<string | undefined>(undefined);
  const wasPending = useRef(false);
  const lastSelection = useRef(selectionSignature(input.selection));
  const lastVisibility = useRef(visibilitySignature(input.visibility));

  useEffect(() => {
    if (input.pending && !wasPending.current) announce(setPolite, "Change pending");
    wasPending.current = input.pending;
  }, [input.pending]);

  useEffect(() => {
    if (!input.settled) return;
    const view = commandStatusView({ pending: false, settled: input.settled });
    if (!view || view.announcement === "none") return;
    setPolite(undefined);
    setAssertive(undefined);
    const setter = view.announcement === "assertive" ? setAssertive : setPolite;
    if (typeof queueMicrotask === "function") {
      queueMicrotask(() => setter(view.text));
    } else {
      setter(view.text);
    }
  }, [input.settled]);

  useEffect(() => {
    const signature = selectionSignature(input.selection);
    if (signature === lastSelection.current) return;
    lastSelection.current = signature;
    setSelection(selectionSummary(input.selection));
  }, [input.selection]);

  useEffect(() => {
    const signature = visibilitySignature(input.visibility);
    if (signature === lastVisibility.current) return;
    lastVisibility.current = signature;
    setVisibility(
      `Visibility changed: ${input.visibleItemCount} visible ${
        input.visibleItemCount === 1 ? "item" : "items"
      }`,
    );
  }, [input.visibleItemCount, input.visibility]);

  const status = useMemo(() => {
    const view = commandStatusView({ pending: input.pending, settled: input.settled });
    if (view?.level === "error" && !input.feedbackVisible) return undefined;
    return view;
  }, [input.feedbackVisible, input.pending, input.settled]);

  return { status, polite, assertive, selection, visibility };
}
