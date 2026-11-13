import { YearPlanner, type YearPlannerHandle } from "@blendsdk/react-year-planner";
import type {
  CommandOutcome,
  PlannerCommand,
  PlannerItem,
  PlannerLayer,
  PlannerModel,
  VisibilityState,
} from "@blendsdk/year-planner-core";
import { paintItems } from "@blendsdk/year-planner-core";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef, useState } from "react";
import { describeStories } from "./describe";

type HostMode =
  | "accepted"
  | "pending"
  | "rejected"
  | "stale"
  | "timeout"
  | "never-apply"
  | "warning"
  | "retry"
  | "capacity";

type HostAction = "move" | "resize" | "paint" | "create" | "delete";

const layers: PlannerLayer[] = [
  { id: "bookings", name: "Bookings", channel: "ribbon", color: "#1d4e89", label: "B" },
  { id: "highlight", name: "Highlight", channel: "highlight", color: "#ffd166", label: "H" },
  { id: "dock", name: "Dock", channel: "ribbon", color: "#2a9d8f", label: "D" },
];

const initialItems: PlannerItem[] = [
  {
    id: "booking",
    kind: "activity",
    layerId: "bookings",
    period: { kind: "all-day", startDate: "2027-01-28", endDateExclusive: "2027-02-07" },
    title: "Winter booking",
    version: 1,
  },
  {
    id: "highlight",
    kind: "highlight",
    layerId: "highlight",
    period: { kind: "all-day", startDate: "2027-06-10", endDateExclusive: "2027-06-21" },
    title: "Highlight",
    version: 1,
  },
  {
    id: "dock-a",
    kind: "reservation",
    layerId: "dock",
    period: { kind: "all-day", startDate: "2027-01-10", endDateExclusive: "2027-01-20" },
    title: "Dock A",
    version: 1,
  },
  {
    id: "dock-b",
    kind: "reservation",
    layerId: "dock",
    period: { kind: "all-day", startDate: "2027-01-12", endDateExclusive: "2027-01-18" },
    title: "Dock B",
    version: 1,
  },
];

const visibility: VisibilityState = {
  hiddenGroupIds: [],
  hiddenLayerIds: [],
  hiddenItemIds: [],
};

function applyPayload(items: PlannerItem[], outcome: CommandOutcome): PlannerItem[] {
  if (!outcome.accepted) return items;
  const updated = new Map((outcome.updatedItems ?? []).map((entry) => [entry.id, entry]));
  const removed = new Set(outcome.removedItemIds ?? []);
  const next: PlannerItem[] = [];
  for (const entry of items) {
    if (removed.has(entry.id)) continue;
    const replacement = updated.get(entry.id);
    if (replacement) {
      next.push(replacement);
      updated.delete(entry.id);
    } else {
      next.push(entry);
    }
  }
  for (const replacement of updated.values()) next.push(replacement);
  return next;
}

interface StoryProps {
  mode: HostMode;
  action: HostAction;
  triggerLabel: string;
  note: string;
}

/**
 * A controlled host story for one RD-08 state.
 *
 * The trigger button sends one command through the public pipeline. Drag the
 * booking or paint a range to see the pending gesture preview.
 */
function CommandStateStory({ mode, action, triggerLabel, note }: StoryProps) {
  const ref = useRef<YearPlannerHandle>(null);
  const idCounter = useRef(10);
  const retryCount = useRef(0);
  const [items, setItems] = useState<PlannerItem[]>(initialItems);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const [diagnostics, setDiagnostics] = useState<string[]>([]);
  const createId = (): string => {
    idCounter.current += 1;
    return `story-${idCounter.current}`;
  };

  const resultFor = (
    command: PlannerCommand,
  ): { outcome: CommandOutcome; next?: PlannerItem[] } => {
    const current = itemsRef.current;
    if (command.type === "create") {
      const item = { ...command.item, version: 1 };
      return {
        outcome: { accepted: true, revision: "next", updatedItems: [item] },
        next: [...current, item],
      };
    }
    if (command.type === "delete") {
      return {
        outcome: { accepted: true, revision: "next", removedItemIds: [command.itemId] },
        next: current.filter((entry) => entry.id !== command.itemId),
      };
    }
    if (command.type === "paint") {
      if (command.period.kind !== "all-day")
        return { outcome: { accepted: true, revision: "next" } };
      const model: PlannerModel = { groups: [], layers, items: current, resources: [] };
      const result = paintItems(
        {
          model,
          visibility,
          filter: {},
          activeLayerId: command.layerId,
          createId,
          expectedVersions: command.expectedVersions,
        },
        command.layerId,
        command.period,
        command.defaults,
      );
      const outcome: CommandOutcome = result.ok
        ? {
            accepted: true,
            revision: "next",
            updatedItems: result.updatedItems,
            removedItemIds: result.removedItemIds,
          }
        : { accepted: false, diagnostics: result.diagnostics };
      return { outcome, next: applyPayload(current, outcome) };
    }
    const source = current.find((entry) => entry.id === command.itemId);
    if (!source) return { outcome: { accepted: true, revision: "next" } };
    const next: PlannerItem =
      command.type === "update"
        ? { ...source, ...command.patch, version: source.version + 1 }
        : { ...source, period: command.proposedPeriod, version: source.version + 1 };
    return {
      outcome: { accepted: true, revision: "next", updatedItems: [next] },
      next: current.map((entry) => (entry.id === source.id ? next : entry)),
    };
  };

  const commandFor = (): PlannerCommand => {
    const current = itemsRef.current;
    if (action === "resize") {
      return {
        type: "resize",
        itemId: "booking",
        proposedPeriod: {
          kind: "all-day",
          startDate: "2027-01-28",
          endDateExclusive: "2027-02-09",
        },
        expectedVersion: current.find((entry) => entry.id === "booking")?.version ?? 1,
      };
    }
    if (action === "paint") {
      return {
        type: "paint",
        layerId: "highlight",
        period: { kind: "all-day", startDate: "2027-06-12", endDateExclusive: "2027-06-16" },
        operation: "union",
        defaults: { kind: "highlight", title: "Highlight" },
        expectedVersions: {
          highlight: current.find((entry) => entry.id === "highlight")?.version ?? 1,
        },
      };
    }
    if (action === "create") {
      return {
        type: "create",
        item: {
          id: createId(),
          kind: "reservation",
          layerId: "dock",
          period: { kind: "all-day", startDate: "2027-01-14", endDateExclusive: "2027-01-16" },
          title: "Third dock booking",
          version: 1,
        },
      };
    }
    if (action === "delete") {
      return {
        type: "delete",
        itemId: "booking",
        expectedVersion: current.find((entry) => entry.id === "booking")?.version ?? 1,
      };
    }
    return {
      type: "move",
      itemId: "booking",
      proposedPeriod: { kind: "all-day", startDate: "2027-02-02", endDateExclusive: "2027-02-12" },
      expectedVersion: current.find((entry) => entry.id === "booking")?.version ?? 1,
    };
  };

  const capacityOutcome = (command: PlannerCommand): CommandOutcome | undefined => {
    if (command.type !== "create" || command.item.period.kind !== "all-day") return undefined;
    const period = command.item.period;
    const overlapping = itemsRef.current.filter(
      (entry) =>
        entry.layerId === "dock" &&
        entry.period.kind === "all-day" &&
        entry.period.startDate < period.endDateExclusive &&
        period.startDate < entry.period.endDateExclusive,
    );
    return overlapping.length >= 2
      ? {
          accepted: false,
          diagnostics: [
            {
              code: "CAPACITY_EXCEEDED",
              level: "error",
              message: "The dock allows two concurrent bookings",
            },
          ],
        }
      : undefined;
  };

  const onChangeRequest = async (command: PlannerCommand): Promise<CommandOutcome> => {
    if (mode === "pending" || mode === "timeout") return new Promise<CommandOutcome>(() => {});
    if (mode === "rejected") {
      return {
        accepted: false,
        diagnostics: [
          { code: "CAPACITY_EXCEEDED", level: "error", message: "Rejected by the host" },
        ],
      };
    }
    if (mode === "stale") {
      return {
        accepted: false,
        diagnostics: [{ code: "STALE_REVISION", level: "error", message: "Item is stale" }],
      };
    }
    if (mode === "retry") {
      retryCount.current += 1;
      if (retryCount.current === 1) {
        return {
          accepted: false,
          diagnostics: [{ code: "HOST_REJECTED", level: "error", message: "Transient failure" }],
        };
      }
    }
    if (mode === "capacity") {
      const rejected = capacityOutcome(command);
      if (rejected) return rejected;
    }
    const result = resultFor(command);
    if (mode !== "never-apply" && result.next) setItems(result.next);
    if (mode === "never-apply") return { accepted: true, revision: "next" };
    return result.outcome;
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: 12 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
        <button type="button" onClick={() => ref.current?.requestCommand(commandFor())}>
          {triggerLabel}
        </button>
        <span>{note}</span>
      </div>
      <YearPlanner
        ref={ref}
        year={2027}
        layers={layers}
        items={items}
        visibility={visibility}
        activeLayerId={action === "paint" ? "highlight" : "bookings"}
        baseRevision="story"
        interaction={{
          mode: action === "paint" ? "paint" : action === "create" ? "create" : "auto",
          ...(action === "create"
            ? { createDefaults: { kind: "activity" as const, layerId: "bookings" } }
            : {}),
          commandTimeoutMs: 1500,
          confirmChange: () => true,
          createId,
        }}
        {...(mode === "warning"
          ? {
              validateChange: () => ({
                permitted: true,
                diagnostics: [
                  {
                    code: "CAPACITY_EXCEEDED" as const,
                    level: "warning" as const,
                    message: "Check the range",
                  },
                ],
              }),
            }
          : {})}
        onChangeRequest={onChangeRequest}
        onDiagnostic={(entry) => setDiagnostics((previous) => [...previous, entry.code])}
        display={{ theme: "material-teal", showISOWeekNumbers: true }}
      />
      <p style={{ fontSize: 12, color: "#4a5a63" }}>
        Diagnostics: {diagnostics.length === 0 ? "none" : diagnostics.join(", ")}
      </p>
    </div>
  );
}

const meta = {
  title: "Year Planner/10 Command lifecycle",
  component: CommandStateStory,
  args: {
    mode: "accepted",
    action: "move",
    triggerLabel: "Move booking",
    note: "The controlled host applies the move.",
  },
} satisfies Meta<typeof CommandStateStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AcceptedMove: Story = {};

export const PendingMove: Story = {
  args: {
    mode: "pending",
    action: "move",
    triggerLabel: "Start pending move",
    note: "Drag the booking to keep a pending preview until the host answers.",
  },
};

export const PendingResize: Story = {
  args: {
    mode: "pending",
    action: "resize",
    triggerLabel: "Start pending resize",
    note: "Drag the booking's end handle to keep a pending preview.",
  },
};

export const PendingPaint: Story = {
  args: {
    mode: "pending",
    action: "paint",
    triggerLabel: "Start pending paint",
    note: "Drag a June range to keep the paint preview pending.",
  },
};

export const PendingCreate: Story = {
  args: {
    mode: "pending",
    action: "create",
    triggerLabel: "Start pending create",
    note: "Drag a March range to keep the create preview pending.",
  },
};

export const PendingDelete: Story = {
  args: {
    mode: "pending",
    action: "delete",
    triggerLabel: "Start pending delete",
    note: "The source item keeps its pending outline until the host answers.",
  },
};

export const RejectedValidation: Story = {
  args: {
    mode: "rejected",
    action: "move",
    triggerLabel: "Reject a move",
    note: "The host rejects with CAPACITY_EXCEEDED.",
  },
};

export const RejectedStale: Story = {
  args: {
    mode: "stale",
    action: "move",
    triggerLabel: "Send a stale move",
    note: "The host reports STALE_REVISION.",
  },
};

export const Timeout: Story = {
  args: {
    mode: "timeout",
    action: "move",
    triggerLabel: "Wait for the timeout",
    note: "The host never answers; the request times out after 1.5 seconds.",
  },
};

export const AcceptedNotApplied: Story = {
  args: {
    mode: "never-apply",
    action: "move",
    triggerLabel: "Accept without applying",
    note: "The host accepts but never updates props.",
  },
};

export const WarningsOnly: Story = {
  args: {
    mode: "warning",
    action: "move",
    triggerLabel: "Move with a warning",
    note: "The warning is displayed and the move still applies.",
  },
};

export const RetryAvailable: Story = {
  args: {
    mode: "retry",
    action: "move",
    triggerLabel: "Fail once, then retry",
    note: "The first request fails; use Retry in the inspector.",
  },
};

export const CapacityRejected: Story = {
  args: {
    mode: "capacity",
    action: "create",
    triggerLabel: "Add a third dock booking",
    note: "The capacity-2 mock rejects the third overlapping booking.",
  },
};

describeStories({
  AcceptedMove,
  PendingMove,
  PendingResize,
  PendingPaint,
  PendingCreate,
  PendingDelete,
  RejectedValidation,
  RejectedStale,
  Timeout,
  AcceptedNotApplied,
  WarningsOnly,
  RetryAvailable,
  CapacityRejected,
});
