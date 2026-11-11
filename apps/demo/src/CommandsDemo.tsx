import type { YearPlannerHandle } from "@blendsdk/react-year-planner";
import { YearPlanner } from "@blendsdk/react-year-planner";
import type {
  CommandOutcome,
  PlannerCommand,
  PlannerItem,
  PlannerLayer,
  PlannerModel,
  VisibilityState,
} from "@blendsdk/year-planner-core";
import { eraseItems, paintItems } from "@blendsdk/year-planner-core";
import { useRef, useState } from "react";

type HostMode =
  | "accept"
  | "delay"
  | "reject"
  | "stale"
  | "timeout"
  | "never-apply"
  | "warning"
  | "capacity";

const layers: PlannerLayer[] = [
  { id: "bookings", name: "Bookings", channel: "ribbon", color: "#1d4e89", label: "B" },
  { id: "maintenance", name: "Maintenance", channel: "ribbon", color: "#8358c6", label: "M" },
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
    id: "maintenance",
    kind: "activity",
    layerId: "maintenance",
    period: { kind: "all-day", startDate: "2027-02-03", endDateExclusive: "2027-02-12" },
    title: "Maintenance",
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

const modes: HostMode[] = [
  "accept",
  "delay",
  "reject",
  "stale",
  "timeout",
  "never-apply",
  "warning",
  "capacity",
];

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

interface HostResult {
  outcome: CommandOutcome;
  nextItems?: PlannerItem[];
}

/**
 * Controlled host fixture for RD-08 browser tests and manual exploration.
 *
 * The host owns items. Each mode returns an outcome without bypassing the
 * planner's validation, pending state or rollback.
 */
export function CommandsDemo() {
  const ref = useRef<YearPlannerHandle>(null);
  const idCounter = useRef(10);
  const [items, setItems] = useState<PlannerItem[]>(initialItems);
  const [mode, setMode] = useState<HostMode>("accept");
  const [revision, setRevision] = useState(1);
  const [diagnostics, setDiagnostics] = useState<string[]>([]);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const createId = (): string => {
    idCounter.current += 1;
    return `demo-${idCounter.current}`;
  };

  const buildResult = (command: PlannerCommand): HostResult => {
    const current = itemsRef.current;
    if (command.type === "create") {
      const item = { ...command.item, version: 1 };
      return {
        outcome: {
          accepted: true,
          revision: String(revision + 1),
          updatedItems: [item],
        },
        nextItems: [...current, item],
      };
    }
    if (command.type === "delete") {
      return {
        outcome: {
          accepted: true,
          revision: String(revision + 1),
          removedItemIds: [command.itemId],
        },
        nextItems: current.filter((entry) => entry.id !== command.itemId),
      };
    }
    if (command.type === "paint") {
      const model: PlannerModel = { groups: [], layers, items: current, resources: [] };
      if (command.period.kind !== "all-day") {
        return {
          outcome: {
            accepted: false,
            diagnostics: [
              { code: "INVALID_COMMAND", level: "error", message: "Paint needs an all-day range" },
            ],
          },
        };
      }
      const context = {
        model,
        visibility,
        filter: {},
        activeLayerId: command.layerId,
        createId,
        expectedVersions: command.expectedVersions,
      };
      const result =
        command.operation === "union"
          ? paintItems(context, command.layerId, command.period, command.defaults)
          : eraseItems(context, command.layerId, command.period);
      if (!result.ok) {
        return {
          outcome: {
            accepted: false,
            diagnostics:
              result.diagnostics.length > 0
                ? result.diagnostics
                : [
                    {
                      code: "INVALID_COMMAND",
                      level: "error",
                      message: "Paint failed",
                    },
                  ],
          },
        };
      }
      const outcome: CommandOutcome = {
        accepted: true,
        revision: String(revision + 1),
        updatedItems: result.updatedItems,
        removedItemIds: result.removedItemIds,
      };
      return { outcome, nextItems: applyPayload(current, outcome) };
    }
    const source = current.find((entry) => entry.id === command.itemId);
    if (!source) {
      return {
        outcome: {
          accepted: false,
          diagnostics: [{ code: "INVALID_COMMAND", level: "error", message: "Unknown item" }],
        },
      };
    }
    const next: PlannerItem =
      command.type === "update"
        ? { ...source, ...command.patch, id: source.id, version: source.version + 1 }
        : { ...source, period: command.proposedPeriod, version: source.version + 1 };
    const outcome: CommandOutcome = {
      accepted: true,
      revision: String(revision + 1),
      updatedItems: [next],
    };
    return {
      outcome,
      nextItems: current.map((entry) => (entry.id === source.id ? next : entry)),
    };
  };

  const capacityRejected = (command: PlannerCommand): CommandOutcome | undefined => {
    if (command.type !== "create" || command.item.period.kind !== "all-day") return undefined;
    const period = command.item.period;
    const overlapping = itemsRef.current.filter(
      (entry) =>
        entry.layerId === "dock" &&
        entry.kind === "reservation" &&
        entry.period.kind === "all-day" &&
        entry.period.startDate < period.endDateExclusive &&
        period.startDate < entry.period.endDateExclusive,
    );
    if (overlapping.length < 2) return undefined;
    return {
      accepted: false,
      diagnostics: [
        {
          code: "CAPACITY_EXCEEDED",
          level: "error",
          message: "The dock allows two concurrent bookings",
          itemIds: overlapping.map((entry) => entry.id),
        },
      ],
    };
  };

  const validateChange = (command: PlannerCommand) => {
    void command;
    if (mode !== "warning") return { permitted: true, diagnostics: [] };
    return {
      permitted: true,
      diagnostics: [
        {
          code: "CAPACITY_EXCEEDED" as const,
          level: "warning" as const,
          message: "Check the range",
        },
      ],
    };
  };

  const onChangeRequest = async (command: PlannerCommand): Promise<CommandOutcome> => {
    if (mode === "timeout") return new Promise<CommandOutcome>(() => {});
    if (mode === "reject") {
      return {
        accepted: false,
        diagnostics: [
          { code: "CAPACITY_EXCEEDED", level: "error", message: "Mock host rejected the change" },
        ],
      };
    }
    if (mode === "stale") {
      return {
        accepted: false,
        diagnostics: [{ code: "STALE_REVISION", level: "error", message: "Item is stale" }],
      };
    }
    const capacity = mode === "capacity" ? capacityRejected(command) : undefined;
    if (capacity) return capacity;
    if (mode === "delay") {
      // Long enough for the pending preview to be observable in a slow browser.
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
    const result = buildResult(command);
    if (mode === "never-apply") {
      return { accepted: true, revision: String(revision + 1) };
    }
    if (result.nextItems && result.outcome.accepted) {
      setItems(result.nextItems);
      setRevision((value) => value + 1);
    }
    return result.outcome;
  };

  const addDockBooking = (): void => {
    ref.current?.requestCommand({
      type: "create",
      item: {
        id: createId(),
        kind: "reservation",
        layerId: "dock",
        period: { kind: "all-day", startDate: "2027-01-14", endDateExclusive: "2027-01-16" },
        title: "Third dock booking",
        version: 1,
      },
    });
  };

  return (
    <main style={{ padding: 16, fontFamily: "Arial, sans-serif" }}>
      <h1>Controlled command fixture</h1>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        <label>
          Host mode{" "}
          <select
            data-testid="commands-mode"
            value={mode}
            onChange={(event) => setMode(event.target.value as HostMode)}
          >
            {modes.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
        </label>
        <button type="button" data-testid="commands-add-dock" onClick={addDockBooking}>
          Add dock booking
        </button>
        <span>Base revision: {revision}</span>
        <span data-testid="commands-host-calls">diagnostics: {diagnostics.length}</span>
      </div>
      <YearPlanner
        ref={ref}
        year={2027}
        groups={[]}
        layers={layers}
        resources={[]}
        items={items}
        visibility={visibility}
        baseRevision={String(revision)}
        activeLayerId="bookings"
        interaction={{
          commandTimeoutMs: 800,
          confirmChange: () => true,
          createId,
        }}
        onChangeRequest={onChangeRequest}
        validateChange={validateChange}
        onDiagnostic={(entry) => setDiagnostics((previous) => [...previous, entry.code])}
        display={{ theme: "classic-blue", showISOWeekNumbers: true }}
      />
      <pre data-testid="commands-items">
        {JSON.stringify(
          items.map((entry) => ({ id: entry.id, period: entry.period, version: entry.version })),
        )}
      </pre>
      <pre data-testid="commands-diagnostics">{JSON.stringify(diagnostics)}</pre>
    </main>
  );
}
