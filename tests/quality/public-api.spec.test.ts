import { describe, expect, it } from "vitest";
import * as core from "../../packages/core/src/index.js";
import * as react from "../../packages/react/src/index.js";
import golden from "./public-api.golden.json" with { type: "json" };

/**
 * The public runtime surface is checked against a reviewed golden list.
 *
 * Type-only exports cannot be imported at runtime; their surface is guarded by
 * the checked-in API Extractor reports. This test guards every value a
 * consumer can actually call, so an accidental removal or an unreviewed
 * addition fails here instead of shipping.
 */
describe("RD-10-AC-03: public runtime exports", () => {
  it("exports every reviewed core entry", () => {
    const actual = Object.keys(core).sort();
    expect(actual).toEqual([...golden.core].sort());
  });

  it("exports every reviewed React entry", () => {
    const actual = Object.keys(react).sort();
    expect(actual).toEqual([...golden.react].sort());
  });

  it("defines every reviewed export", () => {
    const coreExports: Record<string, unknown> = { ...core };
    const reactExports: Record<string, unknown> = { ...react };
    for (const name of golden.core) {
      expect(coreExports[name], name).toBeDefined();
    }
    for (const name of golden.react) {
      expect(reactExports[name], name).toBeDefined();
    }
  });
});
