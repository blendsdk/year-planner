import { YearPlanner, type YearPlannerTheme } from "@blendsdk/react-year-planner";
import { useState } from "react";

export function App() {
  const [year, setYear] = useState(2016);
  const [theme, setTheme] = useState<YearPlannerTheme>("classic-blue");
  const [zoom, setZoom] = useState(1);

  return (
    <main style={{ padding: 24, fontFamily: "Arial, sans-serif" }}>
      <style>{`@media print { .demo-chrome { display: none !important; } body { margin: 0; } main { padding: 0 !important; } }`}</style>
      <div className="demo-chrome">
        <h1 style={{ marginTop: 0 }}>Year Planner for React</h1>
        <p style={{ maxWidth: 760 }}>
          Minimal M1 grid: 14-month classic view, 37 day slots, ISO weeks, mirrored labels and
          themes. Ribbons and interactions arrive in later slices.
        </p>
      </div>
      <div
        className="demo-chrome"
        style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}
      >
        <label>
          Year{" "}
          <select value={year} onChange={(event) => setYear(Number(event.target.value))}>
            <option value={2016}>2016</option>
            <option value={2017}>2017</option>
            <option value={2027}>2027</option>
          </select>
        </label>
        <label>
          Theme{" "}
          <select
            value={theme}
            onChange={(event) => setTheme(event.target.value as YearPlannerTheme)}
          >
            <option value="classic-blue">Classic blue</option>
            <option value="classic-yellow">Classic yellow</option>
            <option value="modern">Modern</option>
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
      <YearPlanner
        year={year}
        display={{ theme, zoom, showISOWeekNumbers: true }}
        print={{ mode: "paginate" }}
      />
    </main>
  );
}
