import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * Traceability checker for the requirements documents.
 *
 * Every acceptance criterion declared in an RD document must appear in the
 * canonical matrix, and the matrix must point at a specification test that
 * names the criterion in a real test title. The module is dependency-free so
 * it can run before the packages are built and can be exercised with in-memory
 * fixtures.
 */

/** A single parsed acceptance-criterion number from one RD document. */
export function parseAcceptanceCriteria(source, file) {
  const section = extractSection(source, /^## Acceptance Criteria\s*$/m);
  if (section === undefined) {
    return {
      rd: rdFromFile(file),
      numbers: [],
      error: `${file}: missing "## Acceptance Criteria"`,
    };
  }
  const numbers = [];
  for (const line of section.split("\n")) {
    const match = /^(\d+)\.\s+\[[ x]\]/.exec(line.trim());
    if (match) numbers.push(Number(match[1]));
  }
  const rd = rdFromFile(file);
  if (numbers.length === 0) {
    return { rd, numbers, error: `${file}: acceptance section contains no criteria` };
  }
  const expected = numbers.map((_, index) => index + 1);
  if (numbers.some((value, index) => value !== expected[index])) {
    return { rd, numbers, error: `${file}: acceptance criteria are not a contiguous 1..N list` };
  }
  return { rd, numbers };
}

/** Extracts the document section that starts at the given heading. */
function extractSection(source, heading) {
  const match = heading.exec(source);
  if (!match) return undefined;
  const rest = source.slice(match.index + match[0].length);
  const next = /^## /m.exec(rest);
  return next ? rest.slice(0, next.index) : rest;
}

/** Derives the RD identifier from an RD file name, for example `RD-04`. */
function rdFromFile(file) {
  const match = /RD-(\d{2})-/.exec(file);
  return match ? `RD-${match[1]}` : "RD-??";
}

/**
 * Parses the canonical acceptance-criteria table.
 *
 * Handoff tables elsewhere in the matrix are navigation only; parsing is
 * restricted to the `## Acceptance criteria` section so they cannot create
 * duplicate or unknown identifiers.
 */
export function parseMatrixRows(source) {
  const rows = [];
  const errors = [];
  const section = extractSection(source, /^## Acceptance criteria\s*$/m);
  if (section === undefined) {
    return { rows, errors: ['matrix: missing "## Acceptance criteria" section'] };
  }
  const lines = section
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|"));
  for (const line of lines) {
    const cells = line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());
    if (cells.length === 0) continue;
    if (/^-+:?$/.test(cells[0])) continue;
    if (cells[0] === "Test ID") continue;
    if (cells.length !== 7) {
      errors.push(`matrix: expected 7 columns, found ${cells.length}: ${line.slice(0, 80)}`);
      continue;
    }
    const [id, rd, ac, status, file, title, evidence] = cells.map((cell) =>
      cell.replace(/^`|`$/g, ""),
    );
    rows.push({ id, rd, ac, status, file, title, evidence, raw: line });
  }
  return { rows, errors };
}

/** Returns the set of acceptance-criterion IDs declared by the matrix. */
export function parseMatrixIds(source) {
  return new Set(
    parseMatrixRows(source)
      .rows.map((row) => row.id)
      .filter((id) => /^RD-\d{2}-AC-\d{2}$/.test(id)),
  );
}

/**
 * Returns every acceptance-criterion ID named in a real test title.
 *
 * Comments, ordinary strings and skipped or todo tests never count. A grouped
 * title such as `RD-03-AC-07/08/09` expands to all three identifiers.
 */
export function parseTitleIds(source) {
  const ids = new Set();
  const stripped = stripComments(source);
  const pattern =
    /\b(?:describe|it|test)(?:\.(?:only|concurrent))?\s*\(\s*(["'`])((?:\\.|(?!\1).)*)\1/g;
  for (const match of stripped.matchAll(pattern)) {
    collectIds(match[2], ids);
  }
  return ids;
}

/** Adds a title's IDs, expanding slash-separated acceptance numbers. */
function collectIds(title, target) {
  const pattern = /RD-(\d{2})-AC-(\d{2})((?:\/\d{2})*)/g;
  for (const match of title.matchAll(pattern)) {
    target.add(`RD-${match[1]}-AC-${match[2]}`);
    for (const extra of match[3].split("/").filter(Boolean)) {
      target.add(`RD-${match[1]}-AC-${extra}`);
    }
  }
}

/**
 * Removes line and block comments without touching string contents.
 *
 * A small scanner is used instead of a regular expression because a URL or a
 * title may legitimately contain `//`.
 */
function stripComments(source) {
  let output = "";
  let index = 0;
  let quote;
  while (index < source.length) {
    const char = source[index];
    const next = source[index + 1];
    if (quote) {
      output += char;
      if (char === "\\") {
        output += next ?? "";
        index += 2;
        continue;
      }
      if (char === quote) quote = undefined;
      index += 1;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      output += char;
      index += 1;
      continue;
    }
    if (char === "/" && next === "/") {
      while (index < source.length && source[index] !== "\n") index += 1;
      continue;
    }
    if (char === "/" && next === "*") {
      index += 2;
      while (index < source.length && !(source[index] === "*" && source[index + 1] === "/")) {
        if (source[index] === "\n") output += "\n";
        index += 1;
      }
      index += 2;
      continue;
    }
    output += char;
    index += 1;
  }
  return output;
}

/**
 * Runs the full traceability check.
 *
 * `options.through` limits the expected RD range, which lets the plan build the
 * matrix incrementally. `options.fixture` replaces disk reads for unit tests.
 */
export function checkTraceability(root, options = {}) {
  const through = options.through ?? 10;
  const fixture = options.fixture;
  const requirementsDir = join(root, "codeops/features/year-planner/requirements");
  const matrixPath = join(requirementsDir, "00-traceability.md");

  const rdSources = fixture
    ? fixture.rds
    : readRdSources(requirementsDir, through).reduce((accumulator, path) => {
        accumulator[relative(requirementsDir, path)] = readFileSync(path, "utf8");
        return accumulator;
      }, {});

  const expected = new Set();
  const errors = [];
  for (const [file, source] of Object.entries(rdSources)) {
    const parsed = parseAcceptanceCriteria(source, file);
    if (parsed.error) errors.push(parsed.error);
    const number = Number(parsed.rd.slice(3));
    if (!Number.isInteger(number) || number > through) continue;
    for (const ac of parsed.numbers) {
      expected.add(`${parsed.rd}-AC-${String(ac).padStart(2, "0")}`);
    }
  }

  const matrixSource = fixture ? fixture.matrix : readFileSync(matrixPath, "utf8");
  const parsedMatrix = parseMatrixRows(matrixSource);
  errors.push(...parsedMatrix.errors);

  const seen = new Set();
  const duplicates = new Set();
  const unknown = [];
  const missingMatrix = [];
  const missingTitle = [];
  const titleCache = new Map();

  for (const row of parsedMatrix.rows) {
    const number = Number(row.rd.slice(3));
    if (row.id && seen.has(row.id)) duplicates.add(row.id);
    seen.add(row.id);
    if (!/^RD-\d{2}-AC-\d{2}$/.test(row.id)) {
      errors.push(`matrix: malformed test ID "${row.id}"`);
    }
    if (Number.isInteger(number) && number <= through && !expected.has(row.id)) {
      unknown.push(row.id);
    }
    if (Number.isInteger(number) && number > through) continue;
    if (!row.status) errors.push(`matrix: ${row.id} has no status`);
    if (!row.id.startsWith("RD-")) continue;

    const partial = row.status === "partial" || row.status === "deviation";
    if (partial && !row.evidence) {
      errors.push(`matrix: ${row.id} is ${row.status} without an evidence note`);
    }
    if (!row.file) {
      if (!partial) errors.push(`matrix: ${row.id} has no proving test file`);
      continue;
    }
    const fileExists = fixture
      ? Object.hasOwn(fixture.tests, row.file)
      : existsSync(join(root, row.file));
    if (!fileExists) {
      errors.push(`matrix: ${row.id} points at missing file ${row.file}`);
      continue;
    }
    // A partial row records work that is not yet fully proven; a proven or CI
    // row must name the criterion in a real test title.
    if (partial) continue;
    let ids = titleCache.get(row.file);
    if (!ids) {
      const source = fixture ? fixture.tests[row.file] : readFileSync(join(root, row.file), "utf8");
      ids = parseTitleIds(source);
      titleCache.set(row.file, ids);
    }
    if (!ids.has(row.id)) {
      missingTitle.push(row.id);
      errors.push(
        `matrix: ${row.id} has no test title in ${row.file}${
          row.title ? ` (declared title "${row.title}")` : ""
        }`,
      );
    }
  }

  for (const id of expected) {
    if (!seen.has(id)) missingMatrix.push(id);
  }

  const ok =
    missingMatrix.length === 0 &&
    missingTitle.length === 0 &&
    duplicates.size === 0 &&
    unknown.length === 0 &&
    errors.length === 0;

  return {
    ok,
    expected: [...expected].sort(),
    missingMatrix: missingMatrix.sort(),
    missingTitle: missingTitle.sort(),
    duplicates: [...duplicates].sort(),
    unknown: unknown.sort(),
    errors,
  };
}

/** Lists RD document paths up to the requested RD number. */
function readRdSources(requirementsDir, through) {
  const files = readdirSync(requirementsDir).filter((name) => /^RD-\d{2}-.*\.md$/.test(name));
  return files
    .filter((name) => Number(name.slice(3, 5)) <= through)
    .sort()
    .map((name) => join(requirementsDir, name));
}
