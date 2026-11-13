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

const securityHiddenItem: PlannerItem = {
  id: "security-secret",
  kind: "activity",
  layerId: "bookings",
  period: { kind: "all-day", startDate: "2027-03-05", endDateExclusive: "2027-03-07" },
  title: "TOPSECRET-HIDDEN",
  version: 1,
};

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

/** Shared route navigation, rendered on every demo route. */
function DemoNav() {
  return (
    <nav
      aria-label="Demo routes"
      className="demo-chrome"
      style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 12 }}
    >
      <a href="?">Overview</a>
      <a href="?commands=1">Controlled commands</a>
      <a href="?interaction=1">Interaction</a>
      <a href="?ac3=1">Fluent and MUI buttons</a>
      <a href="?security=1">Hidden-data privacy</a>
      <a href="?print=prt01">PRT-01 print</a>
      <a href="?bench=1">Benchmark</a>
    </nav>
  );
}

export function App() {
  const search = typeof window === "undefined" ? "" : window.location.search;
  const prt01Mode = new URLSearchParams(search).get("print") === "prt01";
  const requestedYear = Number(
    new URLSearchParams(search).get("year") ?? (prt01Mode ? 2017 : 2016),
  );
  const [year, setYear] = useState(
    Number.isInteger(requestedYear) && requestedYear >= 2000 && requestedYear <= 2100
      ? requestedYear
      : prt01Mode
        ? 2017
        : 2016,
  );
  const securityMode = new URLSearchParams(search).get("security") === "1";
  const ac3Mode = new URLSearchParams(search).get("ac3") === "1";
  const interactionMode = new URLSearchParams(search).get("interaction") === "1";
  const commandsMode = new URLSearchParams(search).get("commands") === "1";
  const benchMode = new URLSearchParams(search).get("bench") === "1";
  const fitMode = new URLSearchParams(search).get("fit") === "1";
  const fitNone = new URLSearchParams(search).get("fit") === "none";
  const [theme, setTheme] = useState<YearPlannerThemeName>(
    prt01Mode ? "classic-yellow" : "classic-blue",
  );
  const initialMonths = Number(new URLSearchParams(search).get("months") ?? 14);
  const [months, setMonths] = useState(
    Number.isInteger(initialMonths) && initialMonths >= 12 && initialMonths <= 36
      ? initialMonths
      : 14,
  );
  const [density, setDensity] = useState<"compact" | "expanded">("compact");
  const [zoom, setZoom] = useState(1);
  const items = prt01Mode
    ? prt01Items
    : [...baseItems, ...overflowItems, ...(securityMode ? [securityItem, securityHiddenItem] : [])];
  const layoutProps =
    months === 14 ? { year } : { range: { start: { year, month: 0 }, monthCount: months } };

  if (benchMode)
    return (
      <>
        <DemoNav />
        <BenchDemo />
      </>
    );
  if (commandsMode)
    return (
      <>
        <DemoNav />
        <CommandsDemo />
      </>
    );
  if (interactionMode)
    return (
      <>
        <DemoNav />
        <InteractionDemo />
      </>
    );

  const plannerNode = (
    <YearPlanner
      {...layoutProps}
      groups={groups}
      layers={layers}
      resources={[
        { id: "alice", name: "Alice", type: "person" },
        { id: "bob", name: "Bob", type: "person" },
      ]}
      defaultItems={items}
      {...(securityMode
        ? {
            defaultVisibility: {
              hiddenGroupIds: [],
              hiddenLayerIds: [],
              hiddenItemIds: ["security-secret"],
            },
          }
        : {})}
      defaultSelection={{ dates: [], items: year === 2027 ? ["booking"] : [] }}
      {...(fitMode ? { showInspector: false } : {})}
      display={{
        ...(fitNone ? { fit: "none" as const } : {}),
        theme,
        zoom,
        density,
        showISOWeekNumbers: true,
      }}
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
  const themedPlanner = ac3Mode ? (
    <FluentProvider theme={webLightTheme}>
      <ThemeProvider theme={createTheme()}>{plannerNode}</ThemeProvider>
    </FluentProvider>
  ) : (
    plannerNode
  );
  if (fitMode) {
    return (
      <div data-testid="fit-host" style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
        {themedPlanner}
      </div>
    );
  }

  return (
    <main
      style={{
        height: "100dvh",
        display: "grid",
        gridTemplateRows: "auto auto minmax(0, 1fr) auto",
        overflow: "hidden",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <style>{`body { margin: 0; } @media print { .demo-chrome { display: none !important; } .demo-body { display: block !important; } main { height: auto !important; overflow: visible !important; } }`}</style>
      <DemoNav />
      <header
        className="demo-chrome"
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
          padding: "8px 16px",
          borderBottom: "1px solid #d9e2e8",
        }}
      >
        <strong>Year Planner for React</strong>
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
        <button type="button" onClick={() => window.print()}>
          Print A3
        </button>
      </header>
      <div
        className="demo-body"
        style={{ display: "grid", gridTemplateColumns: "220px minmax(0, 1fr)", minHeight: 0 }}
      >
        <aside
          className="demo-chrome"
          style={{ padding: 16, borderRight: "1px solid #d9e2e8", overflow: "auto" }}
        >
          <label style={{ display: "block", marginBottom: 12 }}>
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
          <p style={{ margin: 0, color: "#4a5a63", fontSize: 13 }}>
            The planner fills the region and fits columns horizontally. Scroll inside the grid when
            the 24 px floor is reached.
          </p>
        </aside>
        <section
          data-testid="planner-region"
          style={{ minWidth: 0, minHeight: 0, overflow: "auto", padding: 8 }}
        >
          {themedPlanner}
        </section>
      </div>
      <footer
        className="demo-chrome"
        style={{ padding: "6px 16px", borderTop: "1px solid #d9e2e8", fontSize: 12 }}
      >
        Demos: select a range, drag an item, paint a layer, or print the A3 matrix.
      </footer>
    </main>
  );
}
