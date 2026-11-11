import { YearPlanner, type YearPlannerThemeName } from "@blendsdk/react-year-planner";
import type { PlannerItem, PlannerLayer } from "@blendsdk/year-planner-core";
import { Button as FluentButton, FluentProvider, webLightTheme } from "@fluentui/react-components";
import { createTheme, Button as MuiButton, ThemeProvider } from "@mui/material";
import { useState } from "react";
import { BenchDemo } from "./BenchDemo.js";
import { CommandsDemo } from "./CommandsDemo.js";
import { InteractionDemo } from "./InteractionDemo.js";

const groups = [
  { id: "ops", name: "Operations" },
  { id: "logistics", name: "Logistics", parentGroupId: "ops" },
];

const layers: PlannerLayer[] = [
  {
    id: "bookings",
    name: "Bookings",
    groupId: "logistics",
    channel: "ribbon",
    color: "#1d4e89",
    label: "B",
    sortOrder: 0,
  },
  {
    id: "maintenance",
    name: "Maintenance",
    groupId: "logistics",
    channel: "ribbon",
    color: "#8358c6",
    label: "M",
    pattern: "hatch",
    sortOrder: 1,
  },
  {
    id: "holidays",
    name: "Holidays",
    channel: "background",
    color: "#ffd166",
    label: "H",
    opacity: 0.6,
  },
  {
    id: "notes",
    name: "Notes",
    channel: "annotation",
    color: "#f6bd60",
  },
];

const baseItems: PlannerItem[] = [
  {
    id: "booking",
    kind: "activity",
    layerId: "bookings",
    period: { kind: "all-day", startDate: "2027-01-28", endDateExclusive: "2027-02-07" },
    title: "Winter booking",
    version: 1,
    status: "confirmed",
    assignments: [{ resourceId: "alice" }],
  },
  {
    id: "maintenance",
    kind: "activity",
    layerId: "maintenance",
    period: { kind: "all-day", startDate: "2027-02-03", endDateExclusive: "2027-02-12" },
    title: "Maintenance window",
    version: 1,
    status: "tentative",
    assignments: [{ resourceId: "bob" }],
  },
  {
    id: "holiday",
    kind: "annotation",
    layerId: "notes",
    period: { kind: "all-day", startDate: "2027-02-01", endDateExclusive: "2027-02-02" },
    title: "Company holiday",
    version: 1,
    annotation: { label: "OH", background: "#ffd166", priority: 2 },
  },
];

const overflowItems: PlannerItem[] = Array.from({ length: 20 }, (_, index) => ({
  id: `overflow-${String(index).padStart(2, "0")}`,
  kind: "activity",
  layerId: "bookings",
  period: { kind: "all-day", startDate: "2027-04-01", endDateExclusive: "2027-04-04" },
  title: `Overflow ${index + 1}`,
  version: 1,
}));

const prt01Items: PlannerItem[] = [
  {
    id: "prt01-booking",
    kind: "activity",
    layerId: "bookings",
    period: { kind: "all-day", startDate: "2017-02-06", endDateExclusive: "2017-02-10" },
    title: "PRT-01 booking",
    version: 1,
  },
  {
    id: "prt01-annotation",
    kind: "annotation",
    layerId: "notes",
    period: { kind: "all-day", startDate: "2017-02-01", endDateExclusive: "2017-02-02" },
    title: "PRT-01 holiday",
    version: 1,
    annotation: { label: "OH", background: "#ffd166", priority: 2 },
  },
];

const securityItem: PlannerItem = {
  id: "security-probe",
  kind: "activity",
  layerId: "bookings",
  period: { kind: "all-day", startDate: "2027-03-01", endDateExclusive: "2027-03-03" },
  title: "Security probe",
  version: 1,
  style: { background: 'image-set("https://attacker.example/pixel" 1x)' },
  metadata: { html: '<img src="https://attacker.example/pixel">' },
};

export function App() {
  const search = typeof window === "undefined" ? "" : window.location.search;
  const prt01Mode = new URLSearchParams(search).get("print") === "prt01";
  const [year, setYear] = useState(prt01Mode ? 2017 : 2016);
  const securityMode = new URLSearchParams(search).get("security") === "1";
  const ac3Mode = new URLSearchParams(search).get("ac3") === "1";
  const interactionMode = new URLSearchParams(search).get("interaction") === "1";
  const commandsMode = new URLSearchParams(search).get("commands") === "1";
  const benchMode = new URLSearchParams(search).get("bench") === "1";
  const [theme, setTheme] = useState<YearPlannerThemeName>(
    prt01Mode ? "classic-yellow" : "classic-blue",
  );
  const [months, setMonths] = useState(14);
  const [density, setDensity] = useState<"compact" | "expanded">("compact");
  const [zoom, setZoom] = useState(1);
  const items = prt01Mode
    ? prt01Items
    : [...baseItems, ...overflowItems, ...(securityMode ? [securityItem] : [])];
  const layoutProps =
    months === 14 ? { year } : { range: { start: { year, month: 0 }, monthCount: months } };

  if (benchMode) return <BenchDemo />;
  if (commandsMode) return <CommandsDemo />;
  if (interactionMode) return <InteractionDemo />;

  return (
    <main style={{ padding: 24, fontFamily: "Arial, sans-serif" }}>
      <style>{`@media print { .demo-chrome { display: none !important; } body { margin: 0; } main { padding: 0 !important; } }`}</style>
      <div className="demo-chrome">
        <h1 style={{ marginTop: 0 }}>Year Planner for React</h1>
        <p style={{ maxWidth: 760 }}>
          RD-07 view: ribbons, annotations, overflow, drag selection, move/resize, paint/erase,
          inspector, themes, slots and A3 print pages.
        </p>
      </div>
      <div
        className="demo-chrome"
        style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}
      >
        <label>
          Year{" "}
          <select
            data-testid="year"
            value={year}
            onChange={(event) => setYear(Number(event.target.value))}
          >
            <option value={2016}>2016</option>
            <option value={2017}>2017</option>
            <option value={2027}>2027</option>
          </select>
        </label>
        <label>
          Theme{" "}
          <select
            data-testid="theme"
            value={theme}
            onChange={(event) => setTheme(event.target.value as YearPlannerThemeName)}
          >
            <option value="classic-blue">Classic blue</option>
            <option value="classic-yellow">Classic yellow</option>
            <option value="modern">Modern</option>
            <option value="high-contrast">High contrast</option>
            <option value="print">Print</option>
          </select>
        </label>
        <label>
          Window{" "}
          <select
            data-testid="months"
            value={months}
            onChange={(event) => setMonths(Number(event.target.value))}
          >
            <option value={12}>12 months</option>
            <option value={14}>14 months</option>
            <option value={18}>18 months</option>
            <option value={24}>24 months</option>
            <option value={36}>36 months</option>
          </select>
        </label>
        <label>
          Density{" "}
          <select
            data-testid="density"
            value={density}
            onChange={(event) => setDensity(event.target.value as "compact" | "expanded")}
          >
            <option value="compact">Compact</option>
            <option value="expanded">Expanded</option>
          </select>
        </label>
        <label>
          Zoom{" "}
          <input
            type="range"
            min={0.75}
            max={1.5}
            step={0.05}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
          />
        </label>
        <button type="button" onClick={() => window.print()}>
          Print A3
        </button>
      </div>
      {(() => {
        const planner = (
          <YearPlanner
            {...layoutProps}
            groups={groups}
            layers={layers}
            resources={[
              { id: "alice", name: "Alice", type: "person" },
              { id: "bob", name: "Bob", type: "person" },
            ]}
            defaultItems={items}
            defaultSelection={{ dates: [], items: year === 2027 ? ["booking"] : [] }}
            display={{ theme, zoom, density, showISOWeekNumbers: true }}
            print={{ mode: "paginate" }}
            activeLayerId="bookings"
            renderCell={
              ac3Mode
                ? (context) => {
                    if (context.date === "2027-02-01") {
                      return <FluentButton size="small">Fluent cell button</FluentButton>;
                    }
                    if (context.date === "2027-02-02") {
                      return (
                        <MuiButton size="small" variant="contained">
                          MUI cell button
                        </MuiButton>
                      );
                    }
                    return null;
                  }
                : undefined
            }
            renderInspector={
              ac3Mode
                ? () => (
                    <div>
                      <FluentButton>Fluent inspector button</FluentButton>
                      <MuiButton variant="contained">MUI inspector button</MuiButton>
                    </div>
                  )
                : undefined
            }
          />
        );
        if (!ac3Mode) return planner;
        return (
          <FluentProvider theme={webLightTheme}>
            <ThemeProvider theme={createTheme()}>{planner}</ThemeProvider>
          </FluentProvider>
        );
      })()}
    </main>
  );
}
