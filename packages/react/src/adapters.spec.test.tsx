import { readFileSync } from "node:fs";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import packageJson from "../package.json";
import { fluentThemeToCssVars } from "./adapters/fluent";
import { muiThemeToCssVars } from "./adapters/mui";
import { YearPlanner } from "./YearPlanner";

describe("RD-06 framework adapters", () => {
  it("maps Fluent UI v9 tokens and omits missing values", () => {
    const vars = fluentThemeToCssVars({
      colorNeutralBackground1: "#ffffff",
      colorNeutralForeground1: "#111111",
      colorBrandBackground: "#0f6cbd",
      colorPaletteYellowBackground2: "#fff4ce",
      fontFamilyBase: "Segoe UI",
      fontSizeBase300: "14px",
      fontWeightRegular: 400,
    });
    expect(vars["--yp-surface"]).toBe("#ffffff");
    expect(vars["--yp-text-primary"]).toBe("#111111");
    expect(vars["--yp-ribbon"]).toBe("#0f6cbd");
    expect(vars["--yp-highlight"]).toBe("#fff4ce");
    expect(vars["--yp-font-family"]).toBe("Segoe UI");
    expect(vars["--yp-font-size"]).toBe("14px");
    expect(vars["--yp-font-weight"]).toBe("400");
    expect(vars["--yp-border"]).toBeUndefined();
  });

  it("maps MUI palette and typography values", () => {
    const vars = muiThemeToCssVars({
      palette: {
        primary: { main: "#1976d2" },
        background: { default: "#fafafa", paper: "#ffffff" },
        text: { primary: "#212121", secondary: "#757575" },
        divider: "#bdbdbd",
      },
      typography: { fontFamily: "Roboto", fontSize: 14 },
    });
    expect(vars["--yp-ribbon"]).toBe("#1976d2");
    expect(vars["--yp-surface"]).toBe("#fafafa");
    expect(vars["--yp-surface-muted"]).toBe("#ffffff");
    expect(vars["--yp-text-muted"]).toBe("#757575");
    expect(vars["--yp-border"]).toBe("#bdbdbd");
    expect(vars["--yp-font-size"]).toBe("14px");
    expect(vars["--yp-highlight"]).toBeUndefined();
  });

  it("renders host buttons in cells and the inspector without nesting in a proxy", () => {
    const { container } = render(
      <YearPlanner
        year={2016}
        layers={[{ id: "ribbon", name: "Ribbon", channel: "ribbon", color: "#1d4e89" }]}
        items={[
          {
            id: "button-item",
            kind: "activity",
            layerId: "ribbon",
            period: { kind: "all-day", startDate: "2016-02-01", endDateExclusive: "2016-02-03" },
            version: 1,
            title: "Button item",
          },
        ]}
        defaultSelection={{ dates: [], items: ["button-item"] }}
        renderCell={() => <button type="button">Fluent-like cell button</button>}
        renderInspector={() => <button type="button">MUI-like inspector button</button>}
      />,
    );
    expect(
      screen.getAllByRole("button", { name: "Fluent-like cell button" }).length,
    ).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "MUI-like inspector button" })).toBeInTheDocument();
    expect(container.querySelector('[data-yp-part="item-proxy"] button')).toBeNull();
  });
});

describe("RD-06 ESM-only package", () => {
  it("declares ESM-only exports and an ES build", () => {
    expect(packageJson.type).toBe("module");
    for (const entry of Object.values(packageJson.exports)) {
      if (typeof entry === "string") continue;
      expect(entry).not.toHaveProperty("require");
      expect(entry).toHaveProperty("import");
    }
    const viteConfig = readFileSync("vite.config.ts", "utf8");
    expect(viteConfig).toContain('formats: ["es"]');
    expect(viteConfig).not.toContain('"cjs"');
    expect(viteConfig).not.toContain('"umd"');
  });
});
