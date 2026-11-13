import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { useYearPlannerTheme, YearPlannerProvider } from "./provider";
import { createTheme, getPresetTheme, themeToCssVars, yearPlannerPresets } from "./theme";

function ThemeProbe(): ReactNode {
  const theme = useYearPlannerTheme();
  return <span data-testid="probe">{theme?.ribbon ?? "none"}</span>;
}

describe("theme implementation", () => {
  it("rejects non-positive and non-finite geometry values", () => {
    const theme = createTheme({
      rowHeight: 0,
      laneHeight: Number.NaN,
      monthBandWidth: -4,
      weekendWidth: "0px" as never,
    });
    expect(theme.rowHeight).toBe(90);
    expect(theme.laneHeight).toBe(24);
    expect(theme.monthBandWidth).toBe(70);
    expect(theme.weekendWidth).toBe(40);
  });

  it("provides a frozen preset and a copy through createTheme", () => {
    const preset = getPresetTheme("material-teal");
    expect(Object.isFrozen(preset)).toBe(true);
    const copy = createTheme({ ...preset, ribbon: "#000001" });
    expect(copy.ribbon).toBe("#000001");
    expect(yearPlannerPresets["material-teal"].ribbon).not.toBe("#000001");
    expect(getPresetTheme("constructor")).toBeUndefined();
    expect(getPresetTheme("__proto__")).toBeUndefined();
  });

  it("keeps color values and unitless numbers intact", () => {
    const vars = themeToCssVars(createTheme({ fontWeight: 700, printScale: 1 }));
    expect(vars["--yp-font-weight"]).toBe("700");
    expect(vars["--yp-print-scale"]).toBe("1");
    expect(vars["--yp-surface"]).toBe("#ffffff");
  });

  it("supplies provider defaults and returns undefined without one", () => {
    const { rerender } = render(
      <YearPlannerProvider theme={{ ribbon: "#111111" }}>
        <ThemeProbe />
      </YearPlannerProvider>,
    );
    expect(screen.getByTestId("probe")).toHaveTextContent("#111111");
    rerender(<ThemeProbe />);
    expect(screen.getByTestId("probe")).toHaveTextContent("none");
  });
});
