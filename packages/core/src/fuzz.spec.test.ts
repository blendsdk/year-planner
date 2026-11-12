import { describe, expect, it } from "vitest";
import { formatDateKey, parseDateKey } from "./date.js";
import { validatePlannerData } from "./model/validation.js";
import { validateAllDayPeriod, validatePeriod } from "./period.js";

/**
 * Deterministic parser fuzzing.
 *
 * A seeded generator produces malformed dates and periods so every run is
 * reproducible. Every case must return a diagnostic or a normalized value; no
 * input may throw an uncaught exception.
 */
function random(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

const CHARACTERS = "0123456789-+T:.Z /abcdefghijklmnopqrstuvwxyz";

/** Builds a random short string from a seeded generator. */
function randomString(next: () => number, length: number): string {
  let value = "";
  for (let index = 0; index < length; index += 1) {
    value += CHARACTERS[Math.floor(next() * CHARACTERS.length)] ?? "0";
  }
  return value;
}

describe("RD-10-AC-09: parser fuzz", () => {
  it("returns a diagnostic for 1,000 malformed date strings without throwing", () => {
    const next = random(7);
    for (let index = 0; index < 1000; index += 1) {
      const value = randomString(next, 1 + Math.floor(next() * 12));
      let result: ReturnType<typeof parseDateKey> | undefined;
      expect(() => {
        result = parseDateKey(value);
      }, value).not.toThrow();
      if (result?.ok) {
        expect(value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(formatDateKey(result.date)).toBe(value);
      } else if (result) {
        expect(["INVALID_DATE", "UNSUPPORTED_YEAR"]).toContain(result.diagnostic.code);
      }
    }
  });

  it("returns INVALID codes for 1,000 generated all-day periods without throwing", () => {
    const next = random(11);
    const codes = new Set(["INVALID_DATE", "UNSUPPORTED_YEAR", "INVALID_RANGE"]);
    for (let index = 0; index < 1000; index += 1) {
      const start = randomString(next, 10);
      const end = randomString(next, 10);
      let diagnostics: ReturnType<typeof validateAllDayPeriod> | undefined;
      expect(() => {
        diagnostics = validateAllDayPeriod({
          kind: "all-day",
          startDate: start,
          endDateExclusive: end,
        });
      }, `${start}..${end}`).not.toThrow();
      if ((diagnostics ?? []).length === 0) {
        expect(start < end).toBe(true);
        expect(parseDateKey(start).ok).toBe(true);
        expect(parseDateKey(end).ok).toBe(true);
      } else {
        for (const entry of diagnostics ?? []) expect(codes).toContain(entry.code);
      }
    }
  });

  it("returns diagnostics for 1,000 generated planner models without throwing", () => {
    const next = random(13);
    const layers = [
      { id: "bookings", name: "Bookings", channel: "ribbon" as const, color: "#123456" },
      { id: "notes", name: "Notes", channel: "annotation" as const, color: "#f6bd60" },
    ];
    for (let index = 0; index < 1000; index += 1) {
      const items = Array.from({ length: 5 }, (_, position) => ({
        id: `item-${Math.floor(next() * 3)}`,
        kind: "activity" as const,
        layerId: next() > 0.2 ? "bookings" : "missing-layer",
        period: {
          kind: "all-day" as const,
          startDate: `2027-${String(1 + Math.floor(next() * 12)).padStart(2, "0")}-01`,
          endDateExclusive: `2027-${String(1 + Math.floor(next() * 12)).padStart(2, "0")}-${next() > 0.5 ? "02" : "29"}`,
        },
        title: `Fuzz ${position}`,
        version: 1,
      }));
      expect(() => validatePlannerData({ items, layers })).not.toThrow();
      const validation = validatePlannerData({ items, layers });
      expect(Array.isArray(validation.diagnostics)).toBe(true);
      const layerIds = new Set(layers.map((layer) => layer.id));
      const acceptedIds = new Set<string>();
      for (const item of validation.model.items) {
        expect(layerIds.has(item.layerId)).toBe(true);
        expect(acceptedIds.has(item.id)).toBe(false);
        acceptedIds.add(item.id);
      }
    }
  });

  it("never accepts a zero-length or reverse timed period", () => {
    expect(
      validatePeriod({
        kind: "timed",
        start: "2027-02-01T10:00:00Z",
        endExclusive: "2027-02-01T10:00:00Z",
        timeZone: "UTC",
      }).some((entry) => entry.code === "INVALID_RANGE"),
    ).toBe(true);
    expect(
      validatePeriod({
        kind: "timed",
        start: "2027-02-02T10:00:00Z",
        endExclusive: "2027-02-01T10:00:00Z",
        timeZone: "UTC",
      }).some((entry) => entry.code === "INVALID_RANGE"),
    ).toBe(true);
  });
});
