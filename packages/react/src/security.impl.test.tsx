import { validatePlannerData } from "@blendsdk/year-planner-core";
import { describe, expect, it } from "vitest";
import { safeCssColor, safeItemStyle, safeMetaStyle } from "./safeStyle.js";

describe("style allowlist implementation", () => {
  it("accepts documented colour forms and rejects CSS structure", () => {
    expect(safeCssColor("#fff")).toBe("#fff");
    expect(safeCssColor("rgb(1, 2, 3)")).toBe("rgb(1, 2, 3)");
    expect(safeCssColor("hsl(10 20% 30% / 0.5)")).toBe("hsl(10 20% 30% / 0.5)");
    expect(safeCssColor("rebeccapurple")).toBe("rebeccapurple");
    expect(safeCssColor("var(--yp-ribbon)")).toBe("var(--yp-ribbon)");
    expect(safeCssColor("var(--yp-ribbon, #fff)")).toBe("var(--yp-ribbon, #fff)");
    for (const value of [
      "url(https://attacker.example/pixel)",
      "expression(alert(1))",
      "@import url(x)",
      "javascript:alert(1)",
      "red; background: url(x)",
      "var(--not-yp-token)",
      "",
    ]) {
      expect(safeCssColor(value), value).toBeUndefined();
    }
  });

  it("keeps only allowlisted properties and drops unsafe values", () => {
    expect(
      safeItemStyle({
        background: "#123456",
        color: "javascript:alert(1)",
        fontWeight: 600,
        opacity: 0.5,
        position: "fixed",
        transform: "translate(10px)",
      }),
    ).toEqual({ background: "#123456", fontWeight: 600, opacity: 0.5 });
  });

  it("applies the same filter to getDateMeta styles", () => {
    expect(
      safeMetaStyle({
        background: "url(https://attacker.example/pixel)",
        color: "var(--yp-ribbon)",
        textDecoration: "underline",
        boxShadow: "0 0 1px red",
      }),
    ).toEqual({ color: "var(--yp-ribbon)", textDecoration: "underline" });
  });
});

describe("diagnostic redaction implementation", () => {
  it("omits an invalid item's title, dates and resource names", () => {
    const validation = validatePlannerData({
      layers: [
        { id: "bookings", name: "Bookings", channel: "ribbon", color: "#123456", label: "B" },
      ],
      resources: [{ id: "alice", name: "Alice", type: "person" }],
      items: [
        {
          id: "secret",
          kind: "activity",
          layerId: "unknown-layer",
          period: { kind: "all-day", startDate: "2027-02-01", endDateExclusive: "2027-02-04" },
          title: "TOPSECRET-TITLE",
          version: 1,
          assignments: [{ resourceId: "unknown-resource" }],
        },
      ],
    });
    const messages = validation.diagnostics.map((entry) => entry.message).join(" ");
    expect(messages).not.toContain("TOPSECRET-TITLE");
    expect(messages).not.toContain("2027-02-01");
    expect(messages).not.toContain("Alice");
    expect(validation.diagnostics.some((entry) => entry.code === "UNKNOWN_REFERENCE")).toBe(true);
  });

  it("keeps the item id available without exposing the title", () => {
    const validation = validatePlannerData({
      layers: [
        { id: "bookings", name: "Bookings", channel: "ribbon", color: "#123456", label: "B" },
      ],
      items: [
        {
          id: "item-a",
          kind: "activity",
          layerId: "bookings",
          period: { kind: "all-day", startDate: "2027-02-04", endDateExclusive: "2027-02-01" },
          title: "TOPSECRET-TITLE",
          version: 1,
        },
        {
          id: "item-a",
          kind: "activity",
          layerId: "bookings",
          period: { kind: "all-day", startDate: "2027-02-01", endDateExclusive: "2027-02-04" },
          title: "TOPSECRET-TITLE",
          version: 1,
        },
      ],
    });
    expect(validation.diagnostics.some((entry) => entry.code === "INVALID_RANGE")).toBe(true);
    expect(validation.diagnostics.some((entry) => entry.itemIds?.includes("item-a"))).toBe(true);
    expect(validation.diagnostics.map((entry) => entry.message).join(" ")).not.toContain(
      "TOPSECRET-TITLE",
    );
  });
});
