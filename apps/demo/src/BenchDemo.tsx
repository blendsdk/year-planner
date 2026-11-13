import type { YearPlannerThemeName } from "@blendsdk/react-year-planner";
import { YearPlanner } from "@blendsdk/react-year-planner";
import { useEffect, useMemo } from "react";
import { benchLayers, buildBenchModel } from "./bench-data.js";

/** Milliseconds from module evaluation to the first painted benchmark frame. */
const startedAt = typeof performance === "undefined" ? 0 : performance.now();

/** Reads a positive integer URL parameter with a fallback. */
function positiveInteger(params: URLSearchParams, name: string, fallback: number): number {
  const value = Number(params.get(name) ?? fallback);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

/**
 * Deterministic benchmark route.
 *
 * The route is private to the demo. Item proxies ignore pointer events so a
 * drag always exercises the date-selection preview path; the render cost being
 * measured is the planner's, not the browser's hit-testing.
 */
export function BenchDemo() {
  const params = new URLSearchParams(window.location.search);
  const items = positiveInteger(params, "items", 500);
  const months = positiveInteger(params, "months", 14);
  const density = params.get("density") === "expanded" ? "expanded" : "compact";
  const theme = (params.get("theme") ?? "classic-blue") as YearPlannerThemeName;
  const model = useMemo(() => buildBenchModel({ items, months }), [items, months]);

  useEffect(() => {
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => {
        window.__YP_BENCH__ = {
          ready: true,
          readyMs: performance.now() - startedAt,
          itemCount: items,
          months,
          domNodes: document.querySelectorAll("*").length,
        };
      });
    });
    return () => {
      cancelAnimationFrame(first);
      if (second) cancelAnimationFrame(second);
    };
  }, [items, months]);

  return (
    <main style={{ padding: 0, margin: 0 }}>
      <style>{`[data-yp-part="item-proxy"] { pointer-events: none; }`}</style>
      <YearPlanner
        range={{ start: { year: 2027, month: 0 }, monthCount: months }}
        layers={benchLayers()}
        defaultItems={model.items}
        display={{ fit: "none", density, theme, showISOWeekNumbers: true }}
        interaction={{ mode: "select", marquee: "dates" }}
        print={{ mode: "paginate" }}
        activeLayerId="bookings"
      />
    </main>
  );
}
