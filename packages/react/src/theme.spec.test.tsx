import { describe, expect, it } from "vitest";
import {
  createTheme,
  getPresetTheme,
  resolveTheme,
  themeToCssVars,
  type YearPlannerTheme,
  type YearPlannerThemeName,
  yearPlannerPresets,
} from "./theme";

const MATERIAL = [
  "red",
  "pink",
  "purple",
  "deep-purple",
  "indigo",
  "blue",
  "light-blue",
  "cyan",
  "teal",
  "green",
  "light-green",
  "lime",
  "yellow",
  "amber",
  "orange",
  "deep-orange",
  "brown",
  "grey",
  "blue-grey",
] as const;

const FLUENT = [
  "red",
  "green",
  "dark-orange",
  "yellow",
  "berry",
  "light-green",
  "marigold",
  "dark-red",
  "cranberry",
  "pumpkin",
  "peach",
  "gold",
  "brass",
  "brown",
  "forest",
  "seafoam",
  "dark-green",
  "light-teal",
  "teal",
  "steel",
  "blue",
  "royal-blue",
  "cornflower",
  "navy",
  "lavender",
  "purple",
  "grape",
  "lilac",
  "pink",
  "magenta",
  "plum",
  "beige",
  "mink",
  "platinum",
  "anchor",
] as const;

const PALETTE_NAMES = [
  ...MATERIAL.map((family) => `material-${family}` as const),
  ...FLUENT.map((family) => `fluent-${family}` as const),
] as const;

const PRESETS: YearPlannerThemeName[] = [...PALETTE_NAMES, "high-contrast", "print"];

const GEOMETRY = {
  rowHeight: 90,
  laneHeight: 24,
  monthBandWidth: 70,
  weekendWidth: 40,
  weekdayWidth: 55,
} as const;

describe("RD-06-AC-19: preset catalogue", () => {
  it("contains exactly the 54 palette families and two utility presets", () => {
    expect(PRESETS).toHaveLength(56);
    expect(new Set(PRESETS).size).toBe(56);
    expect(Object.keys(yearPlannerPresets).sort()).toEqual([...PRESETS].sort());
  });

  it("defaults createTheme and resolveTheme to material-teal", () => {
    expect(createTheme().ribbon).toBe("#009688");
    expect(createTheme().surfaceMuted).toBe("#e0f2f1");
    const resolved = resolveTheme(undefined, undefined);
    expect(resolved.themeName).toBe("material-teal");
    expect(resolved.theme).toEqual(yearPlannerPresets["material-teal"]);
  });

  it("maps the Material 2014 roles to the approved tokens", () => {
    const teal = yearPlannerPresets["material-teal"];
    expect(teal).toMatchObject({
      surface: "#ffffff",
      surfaceMuted: "#e0f2f1",
      weekend: "#b2dfdb",
      context: "#f5f5f5",
      border: "#424242",
      textPrimary: "#000000",
      textMuted: "#333333",
      textInverse: "#ffffff",
      focusRing: "#004d40",
      selectionFill: "rgba(0, 150, 136, 0.18)",
      selectionOutline: "#004d40",
      highlight: "#b2dfdb",
      ribbon: "#009688",
      annotation: "#b2dfdb",
      foreground: "#004d40",
      printScale: 0.72,
    });
  });

  it("maps the Fluent UI v9 roles to the approved tokens", () => {
    const marigold = yearPlannerPresets["fluent-marigold"];
    expect(marigold).toMatchObject({
      surface: "#ffffff",
      surfaceMuted: "#fafafa",
      weekend: "#f9e2ae",
      context: "#f5f5f5",
      border: "#424242",
      textPrimary: "#000000",
      textMuted: "#333333",
      textInverse: "#ffffff",
      focusRing: "#835b00",
      selectionFill: "rgba(234, 163, 0, 0.18)",
      selectionOutline: "#835b00",
      highlight: "#f9e2ae",
      ribbon: "#eaa300",
      annotation: "#f9e2ae",
      foreground: "#835b00",
      printScale: 0.72,
    });
  });

  it("uses a black outline when the strong shade is not 3:1 on every surface", () => {
    expect(yearPlannerPresets["material-yellow"].focusRing).toBe("#000000");
    expect(yearPlannerPresets["material-yellow"].foreground).toBe("#000000");
  });

  it("keeps the utility themes monochrome and print at scale 1", () => {
    for (const name of ["high-contrast", "print"] as const) {
      const theme = yearPlannerPresets[name];
      expect(theme.printScale).toBe(name === "print" ? 1 : 0.72);
      for (const token of [
        "surface",
        "surfaceMuted",
        "weekend",
        "context",
        "border",
        "textPrimary",
        "textMuted",
        "textInverse",
        "focusRing",
        "selectionOutline",
        "highlight",
        "ribbon",
        "annotation",
        "foreground",
      ] as const) {
        const value = String(theme[token]);
        const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(value);
        if (match) {
          expect(match[1], `${name} ${token}`).toBe(match[2]);
          expect(match[2], `${name} ${token}`).toBe(match[3]);
        } else {
          expect(value, `${name} ${token}`).toMatch(/^rgba\(0, 0, 0, 0\.\d+\)$/);
        }
      }
    }
  });

  it("removes the old preset names without aliases", () => {
    for (const removed of ["classic-blue", "classic-yellow", "modern"]) {
      expect(getPresetTheme(removed)).toBeUndefined();
    }
    const provider = createTheme({ ribbon: "#111111" });
    const resolved = resolveTheme("classic-blue", provider);
    expect(resolved.theme).toBe(provider);
    expect(resolved.themeName).toBe("classic-blue");
  });
});

describe("RD-06 theme tokens", () => {
  it("merges a partial theme over material-teal without mutating the input", () => {
    const partial: Partial<YearPlannerTheme> = { ribbon: "#8358c6" };
    const theme = createTheme(partial);
    expect(theme.ribbon).toBe("#8358c6");
    expect(theme.surface).toBe(yearPlannerPresets["material-teal"].surface);
    expect(partial).toEqual({ ribbon: "#8358c6" });
  });

  it("exposes every preset with the same 24 tokens and identical geometry", () => {
    for (const name of PRESETS) {
      const preset = yearPlannerPresets[name];
      expect(Object.keys(preset), name).toHaveLength(24);
      expect(preset, name).toMatchObject(GEOMETRY);
      expect(getPresetTheme(name), name).toEqual(preset);
      expect(getPresetTheme("host-theme")).toBeUndefined();
    }
  });

  it("maps tokens to CSS variables with the documented units", () => {
    const vars = themeToCssVars(createTheme());
    expect(Object.keys(vars)).toHaveLength(24);
    expect(vars["--yp-text-primary"]).toBe("#000000");
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
    expect(theme.weekdayWidth).toBe(yearPlannerPresets["material-teal"].weekdayWidth);
  });
});
