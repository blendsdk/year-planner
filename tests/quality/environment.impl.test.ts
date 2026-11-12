import { describe, expect, it } from "vitest";
import { collectEnvironment, renderEnvironment } from "../../scripts/ci-environment.mjs";

describe("environment capture", () => {
  it("records a launched version and not-installed for a missing browser", async () => {
    const environment = await collectEnvironment({
      chromium: async () => ({ version: () => "123.4.5", close: async () => {} }),
      firefox: async () => {
        throw new Error("Executable doesn't exist at /ms-playwright/firefox");
      },
      webkit: async () => ({ version: () => "600.1", close: async () => {} }),
    });
    expect(environment.chromium).toBe("123.4.5");
    expect(environment.firefox).toBe("not-installed");
    expect(environment.webkit).toBe("600.1");
    expect(environment.node).toBe(process.version);
    const text = renderEnvironment(environment);
    expect(text).toMatch(/^chromium: 123\.4\.5$/m);
    expect(text).toMatch(/^firefox: not-installed$/m);
    expect(text).toMatch(/^node: /m);
  });

  it("distinguishes a missing browser from a launch failure", async () => {
    const environment = await collectEnvironment({
      chromium: async () => {
        throw new Error("Executable doesn't exist at /ms-playwright/chromium");
      },
      firefox: async () => {
        throw new Error("sandbox permission denied");
      },
    });
    expect(environment.chromium).toBe("not-installed");
    expect(environment.firefox).toBe("launch-failed");
  });

  it("renders one parseable key per line", () => {
    const text = renderEnvironment({ a: "1", b: "two words" });
    expect(text).toBe("a: 1\nb: two words\n");
    for (const line of text.trim().split("\n")) expect(line).toMatch(/^[a-zA-Z]+: /);
  });
});
