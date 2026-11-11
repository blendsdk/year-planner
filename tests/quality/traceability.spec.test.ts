import { describe, expect, it } from "vitest";
import { checkTraceability } from "../../scripts/lib/traceability.mjs";

/**
 * Fixture builder for the traceability checker.
 *
 * Each fixture is an in-memory repository: one or more RD documents, the
 * traceability matrix, and the spec files the matrix points at. This keeps the
 * checker tests deterministic and independent of the real repository.
 */
function fixture(input: {
  rds?: Record<string, string>;
  matrix?: string;
  tests?: Record<string, string>;
}) {
  return {
    rds: input.rds ?? {
      "RD-01-foundation.md": acceptanceSection(["first criterion", "second criterion"]),
    },
    matrix:
      input.matrix ??
      matrixWith([
        ["RD-01-AC-01", "tests/quality/sample.spec.test.ts"],
        ["RD-01-AC-02", "tests/quality/sample.spec.test.ts"],
      ]),
    tests: input.tests ?? {
      "tests/quality/sample.spec.test.ts":
        'describe("RD-01-AC-01/02: sample", () => { it("covers both", () => {}); });\n',
    },
  };
}

/** Builds an RD document whose acceptance section contains the given criteria. */
function acceptanceSection(criteria: readonly string[]): string {
  const lines = criteria.map((criterion, index) => `${index + 1}. [ ] ${criterion}`);
  return `# Sample RD\n\n## Acceptance Criteria\n\n${lines.join("\n")}\n`;
}

/** Builds the canonical matrix table from ID / proving-file pairs. */
function matrixWith(rows: readonly (readonly [string, string])[]): string {
  const body = rows
    .map(
      ([id, file]) =>
        `| ${id} | ${id.slice(0, 5)} | ${Number(id.slice(-2))} | proven | \`${file}\` | \`${id}\` | evidence |`,
    )
    .join("\n");
  return [
    "# Traceability",
    "",
    "## Acceptance criteria",
    "",
    "| Test ID | RD | AC | Status | Proving test file | Proving title | Evidence / deviation |",
    "|---|---|---|---|---|---|---|",
    body,
    "",
  ].join("\n");
}

describe("RD-10-AC-02: traceability checker", () => {
  it("accepts a complete fixture", () => {
    const result = checkTraceability("/repo", { through: 1, fixture: fixture({}) });
    expect(result.ok).toBe(true);
    expect(result.missingMatrix).toEqual([]);
    expect(result.missingTitle).toEqual([]);
  });

  it("reports a missing matrix row", () => {
    const result = checkTraceability("/repo", {
      through: 1,
      fixture: fixture({
        matrix: matrixWith([["RD-01-AC-01", "tests/quality/sample.spec.test.ts"]]),
      }),
    });
    expect(result.ok).toBe(false);
    expect(result.missingMatrix).toEqual(["RD-01-AC-02"]);
  });

  it("reports a missing spec-test title", () => {
    const result = checkTraceability("/repo", {
      through: 1,
      fixture: fixture({
        tests: {
          "tests/quality/sample.spec.test.ts": 'it("RD-01-AC-01: only the first", () => {});\n',
        },
      }),
    });
    expect(result.ok).toBe(false);
    expect(result.missingTitle).toEqual(["RD-01-AC-02"]);
  });

  it("expands a slash-separated suite title", () => {
    const result = checkTraceability("/repo", {
      through: 1,
      fixture: fixture({
        rds: { "RD-01-foundation.md": acceptanceSection(["a", "b", "c"]) },
        matrix: matrixWith([
          ["RD-01-AC-01", "tests/quality/sample.spec.test.ts"],
          ["RD-01-AC-02", "tests/quality/sample.spec.test.ts"],
          ["RD-01-AC-03", "tests/quality/sample.spec.test.ts"],
        ]),
        tests: {
          "tests/quality/sample.spec.test.ts":
            'describe("RD-01-AC-01/02/03: group", () => { it("covers all", () => {}); });\n',
        },
      }),
    });
    expect(result.ok).toBe(true);
  });

  it("rejects a duplicate matrix row", () => {
    const result = checkTraceability("/repo", {
      through: 1,
      fixture: fixture({
        matrix: matrixWith([
          ["RD-01-AC-01", "tests/quality/sample.spec.test.ts"],
          ["RD-01-AC-01", "tests/quality/sample.spec.test.ts"],
          ["RD-01-AC-02", "tests/quality/sample.spec.test.ts"],
        ]),
      }),
    });
    expect(result.ok).toBe(false);
    expect(result.duplicates).toEqual(["RD-01-AC-01"]);
  });
});

describe("RD-10-AC-02: traceability title rules", () => {
  it("ignores an ID that appears only in a comment or string fixture", () => {
    const result = checkTraceability("/repo", {
      through: 1,
      fixture: fixture({
        tests: {
          "tests/quality/sample.spec.test.ts": [
            "// RD-01-AC-01 and RD-01-AC-02 are mentioned here",
            'const sample = "RD-01-AC-01";',
            'it("covers the fixture", () => { expect(sample).toBe("RD-01-AC-01"); });',
            "",
          ].join("\n"),
        },
      }),
    });
    expect(result.ok).toBe(false);
    expect(result.missingTitle).toEqual(["RD-01-AC-01", "RD-01-AC-02"]);
  });

  it("ignores skipped and todo titles", () => {
    const result = checkTraceability("/repo", {
      through: 1,
      fixture: fixture({
        rds: { "RD-01-foundation.md": acceptanceSection(["a"]) },
        matrix: matrixWith([["RD-01-AC-01", "tests/quality/sample.spec.test.ts"]]),
        tests: {
          "tests/quality/sample.spec.test.ts":
            'it.skip("RD-01-AC-01: skipped", () => {});\ntest.todo("RD-01-AC-01: todo");\n',
        },
      }),
    });
    expect(result.ok).toBe(false);
    expect(result.missingTitle).toEqual(["RD-01-AC-01"]);
  });

  it("fails when the proving file does not exist", () => {
    const result = checkTraceability("/repo", {
      through: 1,
      fixture: fixture({
        matrix: matrixWith([
          ["RD-01-AC-01", "tests/quality/missing.spec.test.ts"],
          ["RD-01-AC-02", "tests/quality/sample.spec.test.ts"],
        ]),
      }),
    });
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toContain("missing.spec.test.ts");
  });

  it("fails when a row has no status or no evidence", () => {
    const matrix = [
      "# Traceability",
      "",
      "## Acceptance criteria",
      "",
      "| Test ID | RD | AC | Status | Proving test file | Proving title | Evidence / deviation |",
      "|---|---|---|---|---|---|---|",
      "| RD-01-AC-01 | RD-01 | 1 |  | `tests/quality/sample.spec.test.ts` | `RD-01-AC-01` | evidence |",
      "| RD-01-AC-02 | RD-01 | 2 | partial | `tests/quality/sample.spec.test.ts` | `RD-01-AC-02` |  |",
      "",
    ].join("\n");
    const result = checkTraceability("/repo", {
      through: 1,
      fixture: fixture({ matrix }),
    });
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toContain("RD-01-AC-01");
    expect(result.errors.join(" ")).toContain("RD-01-AC-02");
  });

  it("fails an RD with an empty acceptance section", () => {
    const result = checkTraceability("/repo", {
      through: 1,
      fixture: fixture({
        rds: { "RD-01-foundation.md": "# Sample\n\n## Acceptance Criteria\n\nNothing here.\n" },
      }),
    });
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toContain("RD-01");
  });

  it("reports a matrix ID that does not exist in any RD", () => {
    const result = checkTraceability("/repo", {
      through: 1,
      fixture: fixture({
        matrix: matrixWith([
          ["RD-01-AC-01", "tests/quality/sample.spec.test.ts"],
          ["RD-01-AC-02", "tests/quality/sample.spec.test.ts"],
          ["RD-01-AC-09", "tests/quality/sample.spec.test.ts"],
        ]),
        tests: {
          "tests/quality/sample.spec.test.ts":
            'describe("RD-01-AC-01/02/09: sample", () => { it("covers all", () => {}); });\n',
        },
      }),
    });
    expect(result.ok).toBe(false);
    expect(result.unknown).toEqual(["RD-01-AC-09"]);
  });
});

describe("RD-10-AC-02: repository traceability", () => {
  it("covers RD-01 through RD-09", () => {
    const result = checkTraceability(process.cwd(), { through: 9 });
    expect(result.ok).toBe(true);
    expect(result.missingMatrix).toEqual([]);
    expect(result.missingTitle).toEqual([]);
    expect(result.duplicates).toEqual([]);
    expect(result.unknown).toEqual([]);
    expect(result.errors).toEqual([]);
  });
});
