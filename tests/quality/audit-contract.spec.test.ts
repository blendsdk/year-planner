import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/** Reads a repository file relative to the quality test working directory. */
function read(path: string): string {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
}

const manifest = JSON.parse(read("package.json")) as { scripts?: Record<string, string> };
const workflow = read(".github/workflows/ci.yml");
const notices = read("THIRD_PARTY_NOTICES.md");

describe("RD-10-AC-16: dependency and license gates", () => {
  it("exposes the audit and license commands", () => {
    expect(manifest.scripts?.["test:audit"]).toContain("pnpm audit --audit-level high");
    expect(manifest.scripts?.["test:licenses"]).toContain("scripts/write-licenses.mjs");
    expect(manifest.scripts?.verify).toContain("test:licenses");
    expect(manifest.scripts?.["verify:full"]).toContain("test:audit");
  });

  it("keeps the checked-in notices current and complete", () => {
    expect(notices).toContain("# Third-Party Notices");
    expect(notices).toContain("## Runtime dependencies");
    expect(notices).toContain("## Development tooling (not distributed)");
    expect(notices).toContain("no third-party runtime code");
    expect(notices).toMatch(/\| react \| 19\./);
    expect(notices.split("\n").length).toBeGreaterThan(50);
  });

  it("supports deterministic write and check modes", () => {
    const generator = read("scripts/write-licenses.mjs");
    expect(generator).toContain("--write");
    expect(generator).toContain("is stale");
    expect(generator).toContain("pnpm");
    expect(generator).not.toContain("new Date()");
  });
});

describe("RD-10-AC-16: least-privilege CI", () => {
  it("reads repository contents and never uses secrets or privileged events", () => {
    expect(workflow).toMatch(/^permissions:\s*\n\s+contents: read$/m);
    expect(workflow).not.toContain("pull_request_target");
    expect(workflow).not.toContain("write-all");
    expect(workflow).not.toContain("secrets.");
    expect(workflow).not.toMatch(/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/);
    expect(workflow).not.toMatch(/\bghp_[A-Za-z0-9]{20,}/);
    expect(workflow).not.toMatch(/\bnpm_[A-Za-z0-9]{30,}/);
  });
});
