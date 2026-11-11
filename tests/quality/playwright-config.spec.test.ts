import { describe, expect, it } from "vitest";
import config from "../../playwright.config.js";

/** Project names required by the browser and mobile quality matrix. */
const REQUIRED_PROJECTS = [
  "chromium",
  "firefox",
  "webkit",
  "touch-chromium",
  "mobile-chromium",
  "mobile-webkit",
];

describe("RD-10-AC-04: Playwright project contract", () => {
  it("runs zero retries and keeps failure traces in every project", () => {
    expect(config.retries).toBe(0);
    expect(config.use?.trace).toBe("retain-on-failure");
    for (const project of config.projects ?? []) {
      expect(project.retries ?? config.retries, project.name).toBe(0);
      expect(project.use?.trace ?? config.use?.trace, project.name).toBe("retain-on-failure");
    }
  });

  it("declares every desktop and mobile project", () => {
    const names = (config.projects ?? []).map((project) => project.name);
    expect(names).toEqual(expect.arrayContaining(REQUIRED_PROJECTS));
    expect(new Set(names).size).toBe(names.length);
  });

  it("keeps mobile specs out of the desktop projects", () => {
    for (const name of ["chromium", "firefox", "webkit"]) {
      const project = (config.projects ?? []).find((entry) => entry.name === name);
      expect(project?.testIgnore, name).toBeDefined();
      expect(String(project?.testIgnore), name).toContain("mobile");
    }
    for (const name of ["mobile-chromium", "mobile-webkit"]) {
      const project = (config.projects ?? []).find((entry) => entry.name === name);
      expect(String(project?.testMatch), name).toContain("mobile");
    }
  });
});
