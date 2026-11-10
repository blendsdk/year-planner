import { describe, expect, it } from "vitest";
import { fluentThemeToCssVars } from "./adapters/fluent";
import { muiThemeToCssVars } from "./adapters/mui";

describe("adapter implementation", () => {
  it("returns an empty map for an empty theme", () => {
    expect(fluentThemeToCssVars({})).toEqual({});
    expect(muiThemeToCssVars({})).toEqual({});
  });

  it("ignores empty strings and keeps partial mappings", () => {
    const fluent = fluentThemeToCssVars({
      colorNeutralBackground1: "",
      colorNeutralForeground1: "#111111",
    });
    expect(fluent["--yp-surface"]).toBeUndefined();
    expect(fluent["--yp-text-primary"]).toBe("#111111");
    const mui = muiThemeToCssVars({
      palette: { primary: { main: "" }, divider: "#222222" },
    });
    expect(mui["--yp-ribbon"]).toBeUndefined();
    expect(mui["--yp-border"]).toBe("#222222");
  });

  it("maps numeric MUI font sizes to px", () => {
    expect(muiThemeToCssVars({ typography: { fontSize: 16 } })["--yp-font-size"]).toBe("16px");
  });
});
