import { describe, expect, it } from "vitest";
import {
  checkTraceability,
  parseAcceptanceCriteria,
  parseMatrixRows,
  parseTitleIds,
} from "../../scripts/lib/traceability.mjs";

const matrixHeader = [
  "## Acceptance criteria",
  "",
  "| Test ID | RD | AC | Status | Proving test file | Proving title | Evidence / deviation |",
  "|---|---|---|---|---|---|---|",
];
const sample = "tests/quality/sample.spec.test.ts";
const testSource = 'it("RD-01-AC-01: sample", () => {});\n';

/** Wraps a matrix body in the canonical heading. */
function matrix(body: readonly string[]): string {
  return [...matrixHeader, ...body, ""].join("\n");
}

/** Builds a fixture repository with one RD and one test file. */
function fixture(m: string) {
  return {
    rds: { "RD-01-foundation.md": "## Acceptance Criteria\n\n1. [ ] first\n2. [ ] second\n" },
    matrix: m,
    tests: { [sample]: testSource },
  };
}

describe("parseAcceptanceCriteria", () => {
  it("rejects a missing acceptance section", () => {
    const parsed = parseAcceptanceCriteria("# RD\n\n## Other\n", "RD-01-foundation.md");
    expect(parsed.error).toContain("missing");
    expect(parsed.numbers).toEqual([]);
  });

  it("rejects a non-contiguous acceptance list", () => {
    const parsed = parseAcceptanceCriteria(
      "## Acceptance Criteria\n\n1. [ ] a\n3. [ ] c\n",
      "RD-01-foundation.md",
    );
    expect(parsed.error).toContain("contiguous");
  });

  it("accepts checked and unchecked criteria", () => {
    const parsed = parseAcceptanceCriteria(
      "## Acceptance Criteria\n\n1. [x] a\n2. [ ] b\n",
      "RD-01-foundation.md",
    );
    expect(parsed.numbers).toEqual([1, 2]);
  });
});

describe("parseTitleIds", () => {
  it("accepts template literals and only tests", () => {
    const ids = parseTitleIds(
      [
        "it(`RD-01-AC-01: template`, () => {});",
        'describe.only("RD-01-AC-02: only", () => {});',
      ].join("\n"),
    );
    expect([...ids].sort()).toEqual(["RD-01-AC-01", "RD-01-AC-02"]);
  });

  it("ignores skipped, todo and commented titles", () => {
    const ids = parseTitleIds(
      [
        'it.skip("RD-01-AC-01: skipped", () => {});',
        'test.todo("RD-01-AC-02: todo");',
        '// it("RD-01-AC-03: commented", () => {});',
        '/* describe("RD-01-AC-04: block", () => {}); */',
      ].join("\n"),
    );
    expect([...ids]).toEqual([]);
  });

  it("does not treat a URL in a title as a comment", () => {
    const ids = parseTitleIds('it("RD-01-AC-01: see https://example.test", () => {});');
    expect([...ids]).toEqual(["RD-01-AC-01"]);
  });
});

describe("parseMatrixRows", () => {
  it("reports a row with the wrong column count", () => {
    const parsed = parseMatrixRows(matrix(["| RD-01-AC-01 | RD-01 |"]));
    expect(parsed.errors.join(" ")).toContain("expected 7 columns");
  });

  it("ignores tables outside the canonical section", () => {
    const parsed = parseMatrixRows(
      ["## Handoff", "", "| id | rd |", "|---|---|", "| RD-09-AC-01 | RD-09 |", ""].join("\n"),
    );
    expect(parsed.errors.join(" ")).toContain("missing");
    expect(parsed.rows).toEqual([]);
  });
});

describe("checkTraceability edge cases", () => {
  it("rejects a malformed identifier", () => {
    const result = checkTraceability("/repo", {
      through: 1,
      fixture: fixture(
        matrix([`| RD-1-AC-1 | RD-01 | 1 | proven | \`${sample}\` | RD-01-AC-01 | e |`]),
      ),
    });
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toContain("malformed test ID");
  });

  it("requires evidence for a deviation row", () => {
    const result = checkTraceability("/repo", {
      through: 1,
      fixture: fixture(
        matrix([
          `| RD-01-AC-01 | RD-01 | 1 | deviation |  |  |  |`,
          `| RD-01-AC-02 | RD-01 | 2 | proven | \`${sample}\` | RD-01-AC-02 | e |`,
        ]),
      ),
    });
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toContain("has no evidence note");
  });

  it("accepts a partial row with evidence and no title", () => {
    const result = checkTraceability("/repo", {
      through: 1,
      fixture: {
        ...fixture(
          matrix([
            `| RD-01-AC-01 | RD-01 | 1 | partial |  |  | scheduled |`,
            `| RD-01-AC-02 | RD-01 | 2 | proven | \`${sample}\` | RD-01-AC-02 | e |`,
          ]),
        ),
        tests: {
          [sample]: 'it("RD-01-AC-01/02: sample", () => {});\n',
        },
      },
    });
    expect(result.ok).toBe(true);
  });

  it("reports a title that lives only in another file", () => {
    const result = checkTraceability("/repo", {
      through: 1,
      fixture: {
        rds: { "RD-01-foundation.md": "## Acceptance Criteria\n\n1. [ ] first\n2. [ ] second\n" },
        matrix: matrix([
          `| RD-01-AC-01 | RD-01 | 1 | proven | \`${sample}\` | RD-01-AC-01 | e |`,
          `| RD-01-AC-02 | RD-01 | 2 | proven | \`tests/quality/other.spec.test.ts\` | RD-01-AC-02 | e |`,
        ]),
        tests: {
          [sample]: testSource,
          "tests/quality/other.spec.test.ts": 'it("RD-01-AC-01: wrong file", () => {});\n',
        },
      },
    });
    expect(result.ok).toBe(false);
    expect(result.missingTitle).toEqual(["RD-01-AC-02"]);
  });
});

describe("parser and row-validation regressions", () => {
  it("ignores a fake test call inside a string literal", () => {
    const ids = parseTitleIds("const sample = 'it(\"RD-01-AC-01: fake\", () => {})';");
    expect([...ids]).toEqual([]);
  });

  it("reads it.each and test.each titles", () => {
    expect([...parseTitleIds('it.each([[1]])("RD-01-AC-01: each", () => {});')]).toEqual([
      "RD-01-AC-01",
    ]);
    expect([...parseTitleIds('test.each([1])("RD-01-AC-02: each", () => {});')]).toEqual([
      "RD-01-AC-02",
    ]);
  });

  it("ignores nested tests inside skipped suites", () => {
    expect([
      ...parseTitleIds('describe.skip("RD-01-AC-01", () => { it("RD-01-AC-02", () => {}); });'),
    ]).toEqual([]);
    expect([
      ...parseTitleIds(
        'test.describe.skip("RD-01-AC-03", () => { test("RD-01-AC-04", () => {}); });',
      ),
    ]).toEqual([]);
    expect([...parseTitleIds('test.fixme("RD-01-AC-05", () => {});')]).toEqual([]);
  });

  it("rejects a declared proving title that does not contain the row ID", () => {
    const result = checkTraceability("/repo", {
      through: 1,
      fixture: {
        rds: { "RD-01-foundation.md": "## Acceptance Criteria\n\n1. [ ] first\n2. [ ] second\n" },
        matrix: matrix([
          `| RD-01-AC-01 | RD-01 | 1 | proven | \`${sample}\` | RD-01-AC-02 | e |`,
          `| RD-01-AC-02 | RD-01 | 2 | proven | \`${sample}\` | RD-01-AC-02 | e |`,
        ]),
        tests: { [sample]: 'describe("RD-01-AC-01/02: group", () => {});' },
      },
    });
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toContain("declares a proving title without that ID");
  });

  it("rejects a proven row without evidence", () => {
    const result = checkTraceability("/repo", {
      through: 1,
      fixture: {
        ...fixture(
          matrix([
            `| RD-01-AC-01 | RD-01 | 1 | proven | \`${sample}\` | RD-01-AC-01 |  |`,
            `| RD-01-AC-02 | RD-01 | 2 | proven | \`${sample}\` | RD-01-AC-02 | e |`,
          ]),
        ),
        tests: { [sample]: 'describe("RD-01-AC-01/02: group", () => {});' },
      },
    });
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toContain("has no evidence note");
  });
});
