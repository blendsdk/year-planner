import { describe, expect, it } from "vitest";
import { addDays, buildBenchModel } from "../../scripts/bench-data.mjs";

describe("benchmark data edge cases", () => {
  it("rejects non-positive counts", () => {
    expect(() => buildBenchModel({ items: 0, months: 14 })).toThrow(RangeError);
    expect(() => buildBenchModel({ items: 10, months: 0 })).toThrow(RangeError);
    expect(() => buildBenchModel({ items: -1, months: 14 })).toThrow(RangeError);
    expect(() => buildBenchModel({ items: 1.5, months: 14 })).toThrow(RangeError);
  });

  it("changes output when the seed changes", () => {
    const first = buildBenchModel({ items: 20, months: 12, seed: 1 });
    const second = buildBenchModel({ items: 20, months: 12, seed: 2 });
    expect(first.items[0]?.period).not.toEqual(second.items[0]?.period);
  });

  it("emits ids that are unique and padded", () => {
    const { items } = buildBenchModel({ items: 12, months: 12 });
    expect(new Set(items.map((item) => item.id)).size).toBe(items.length);
    expect(items[0]?.id).toBe("bench-00000");
    expect(items[11]?.id).toBe("bench-00011");
  });

  it("keeps every period between one and ten days and inside the extended window", () => {
    const { items } = buildBenchModel({ items: 200, months: 12 });
    for (const item of items) {
      if (item.period.kind !== "all-day") throw new Error("expected an all-day period");
      const { startDate, endDateExclusive } = item.period;
      const days =
        (Date.parse(`${endDateExclusive}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) /
        86_400_000;
      expect(days).toBeGreaterThanOrEqual(1);
      expect(days).toBeLessThanOrEqual(10);
      expect(startDate >= "2027-01-01").toBe(true);
      expect(endDateExclusive <= "2028-03-01").toBe(true);
    }
  });

  it("adds days across month and year boundaries with UTC arithmetic", () => {
    expect(addDays("2027-01-31", 1)).toBe("2027-02-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2027-03-01", -1)).toBe("2027-02-28");
  });
});
