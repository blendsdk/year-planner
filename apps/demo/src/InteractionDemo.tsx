import type { YearPlannerHandle } from "@blendsdk/react-year-planner";
import { YearPlanner } from "@blendsdk/react-year-planner";
import type {
  InteractionMode,
  PlannerItem,
  PlannerLayer,
  PlannerSelection,
} from "@blendsdk/year-planner-core";
import { useRef, useState } from "react";

const layers: PlannerLayer[] = [
  { id: "bookings", name: "Bookings", channel: "ribbon", color: "#1d4e89", label: "B" },
  {
    id: "maintenance",
    name: "Maintenance",
    channel: "ribbon",
    color: "#8358c6",
    label: "M",
    pattern: "hatch",
  },
  { id: "training", name: "Training", channel: "ribbon", color: "#2a9d8f", label: "T" },
  { id: "highlight", name: "Highlight", channel: "highlight", color: "#ffd166", label: "H" },
  { id: "notes", name: "Notes", channel: "annotation", color: "#f6bd60" },
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
    id: "training",
    kind: "activity",
    layerId: "training",
    period: { kind: "all-day", startDate: "2027-02-08", endDateExclusive: "2027-02-11" },
    title: "Training",
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
    id: "holiday",
    kind: "annotation",
    layerId: "notes",
    period: { kind: "all-day", startDate: "2027-03-09", endDateExclusive: "2027-03-10" },
    title: "Holiday",
    version: 1,
    annotation: { label: "OH" },
  },
];

const modes: InteractionMode[] = [
  "auto",
  "inspect",
  "select",
  "paint",
  "erase",
  "create",
  "move",
  "resize",
];

/** Uncontrolled-items interaction fixture used by browser tests. */
export function InteractionDemo() {
  const ref = useRef<YearPlannerHandle>(null);
  const createdCounter = useRef(0);
  const [mode, setMode] = useState<InteractionMode>("auto");
  const [touchEditing, setTouchEditing] = useState<"auto" | "on" | "off">("off");
  const [readOnly, setReadOnly] = useState(false);
  const [selection, setSelection] = useState<PlannerSelection>({ dates: [], items: [] });
  const [itemsJson, setItemsJson] = useState<string>(() =>
    JSON.stringify(initialItems.map((entry) => ({ id: entry.id, period: entry.period }))),
  );
  const [diagnostics, setDiagnostics] = useState<string[]>([]);

  return (
    <main style={{ padding: 16, fontFamily: "Arial, sans-serif" }}>
      <h1>Interaction fixture</h1>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        <label>
          Mode{" "}
          <select
            data-testid="interaction-mode"
            value={mode}
            onChange={(event) => setMode(event.target.value as InteractionMode)}
          >
            {modes.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
        </label>
        <label>
          Touch{" "}
          <select
            data-testid="touch-mode"
            value={touchEditing}
            onChange={(event) => setTouchEditing(event.target.value as "auto" | "on" | "off")}
          >
            <option value="off">off</option>
            <option value="auto">auto</option>
            <option value="on">on</option>
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={readOnly}
            onChange={(event) => setReadOnly(event.target.checked)}
          />{" "}
          read-only
        </label>
        <button type="button" onClick={() => ref.current?.requestUndo()}>
          Undo
        </button>
        <button type="button" onClick={() => ref.current?.requestRedo()}>
          Redo
        </button>
        <button
          type="button"
          data-testid="hide-focused-item"
          onClick={() => {
            const itemId = selection.focusItemId ?? selection.items[0];
            if (itemId) ref.current?.hideItem(itemId);
          }}
        >
          Hide focused item
        </button>
        <button type="button" data-testid="show-all-items" onClick={() => ref.current?.showAll()}>
          Show all
        </button>
      </div>
      <YearPlanner
        ref={ref}
        year={2027}
        layers={layers}
        defaultItems={initialItems}
        activeLayerId="highlight"
        readOnly={readOnly}
        interaction={{
          mode,
          touchEditing,
          createDefaults: { kind: "activity", layerId: "bookings" },
          confirmChange: () => true,
          createId: () => {
            createdCounter.current += 1;
            return `created-${createdCounter.current}`;
          },
        }}
        selection={selection}
        onSelectionChange={setSelection}
        onItemsChange={(next) =>
          setItemsJson(
            JSON.stringify(next.map((entry) => ({ id: entry.id, period: entry.period }))),
          )
        }
        onDiagnostic={(entry) => setDiagnostics((previous) => [...previous, entry.code])}
        getDateMeta={(date) =>
          date === "2027-03-10" ? { disabled: true, label: "Off" } : undefined
        }
      />
      <pre data-testid="selection-json">{JSON.stringify(selection)}</pre>
      <pre data-testid="items-json">{itemsJson}</pre>
      <pre data-testid="diagnostics-json">{JSON.stringify(diagnostics)}</pre>
    </main>
  );
}
