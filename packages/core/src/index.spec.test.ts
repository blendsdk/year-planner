import { describe, expect, it } from "vitest";
import * as core from "./index";

describe("public core entry", () => {
  it("exports the date, interval, period and layout APIs", () => {
    expect(typeof core.parseDateKey).toBe("function");
    expect(typeof core.isoWeekOf).toBe("function");
    expect(typeof core.subtract).toBe("function");
    expect(typeof core.validatePeriod).toBe("function");
    expect(typeof core.buildClassicYearLayout).toBe("function");
    expect(core.buildClassicYearLayout({ year: 2016 }).ok).toBe(true);
  });
});
