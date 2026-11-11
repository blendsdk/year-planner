import { describe, expect, it } from "vitest";
import {
  createTheme,
  getPresetTheme,
  themeToCssVars,
  type YearPlannerTheme,
  type YearPlannerThemeName,
  yearPlannerPresets,
} from "./theme";

const PRESETS: YearPlannerThemeName[] = [
  "classic-blue",
  "classic-yellow",
  "modern",
  "high-contrast",
  "print",
];

const GEOMETRY = {
  rowHeight: 90,
  laneHeight: 24,
  monthBandWidth: 70,
  weekendWidth: 40,
  weekdayWidth: 55,
} as const;

describe("RD-06 theme tokens", () => {
  it("merges a partial theme over classic-blue without mutating the input", () => {
    const partial: Partial<YearPlannerTheme> = { ribbon: "#8358c6" };
    const theme = createTheme(partial);
    expect(theme.ribbon).toBe("#8358c6");
    expect(theme.surface).toBe(yearPlannerPresets["classic-blue"].surface);
    expect(partial).toEqual({ ribbon: "#8358c6" });
  });

  it("exposes every preset with the same 24 tokens and identical geometry", () => {
    for (const name of PRESETS) {
      const preset = yearPlannerPresets[name];
      expect(Object.keys(preset)).toHaveLength(24);
      expect(preset).toMatchObject(GEOMETRY);
      expect(getPresetTheme(name)).toEqual(preset);
      expect(getPresetTheme("host-theme")).toBeUndefined();
    }
  });

  it("maps tokens to CSS variables with the documented units", () => {
    const vars = themeToCssVars(createTheme());
    expect(Object.keys(vars)).toHaveLength(24);
    expect(vars["--yp-text-primary"]).toBe("#1b2329");
    expect(vars["--yp-row-height"]).toBe("90px");
    expect(vars["--yp-weekend-width"]).toBe("40px");
    expect(vars["--yp-font-size"]).toBe("14px");
    expect(vars["--yp-print-scale"]).toBe("0.72");
    expect(vars["--yp-font-weight"]).toBe("400");
  });

  it("normalises numeric geometry strings and falls back on invalid values", () => {
    const theme = createTheme({
      rowHeight: "100px" as never,
      weekdayWidth: "wide" as never,
    });
    expect(theme.rowHeight).toBe(100);
    expect(theme.weekdayWidth).toBe(yearPlannerPresets["classic-blue"].weekdayWidth);
  });
});
