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
 * The scanner walks the source instead of matching raw text, so a test call
 * that only appears inside a string literal or a comment never counts.
 * `describe.skip`, `it.skip`, `test.todo` and every test nested inside a
 * skipped suite are ignored. `it.each([...])("title", ...)` is supported.
 */
export function parseTitleIds(source) {
  const ids = new Set();
  let index = 0;
  while (index < source.length) {
    const char = source[index];
    const next = source[index + 1];
    if (char === "/" && next === "/") {
      while (index < source.length && source[index] !== "\n") index += 1;
      continue;
    }
    if (char === "/" && next === "*") {
      index += 2;
      while (index < source.length && !(source[index] === "*" && source[index + 1] === "/")) {
        index += 1;
      }
      index += 2;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      index = readString(source, index).end;
      continue;
    }
    if (isIdentifierStart(char)) {
      const start = index;
      const word = readIdentifier(source, start);
      index = start + word.length;
      const previous = source[start - 1];
      if (
        (word === "describe" || word === "it" || word === "test") &&
        !(previous && /[A-Za-z0-9_$.]/.test(previous))
      ) {
        const call = readTestCall(source, index);
        if (call) {
          const isSuite = word === "describe" || call.suite;
          if (!call.skipped) collectIds(call.title, ids);
          index = call.skipped && isSuite ? call.bodyEnd : call.end;
          continue;
        }
      }
      continue;
    }
    index += 1;
  }
  return ids;
}

/** Returns true for a JavaScript identifier start character. */
function isIdentifierStart(char) {
  return /[A-Za-z_$]/.test(char ?? "");
}

/** Reads one identifier starting at `start`. */
function readIdentifier(source, start) {
  let index = start;
  while (index < source.length && /[A-Za-z0-9_$]/.test(source[index])) index += 1;
  return source.slice(start, index);
}

/** Reads a quoted string and returns its raw value and end offset. */
function readString(source, start) {
  const quote = source[start];
  let index = start + 1;
  let value = "";
  while (index < source.length) {
    const char = source[index];
    if (char === "\\") {
      value += source[index + 1] ?? "";
      index += 2;
      continue;
    }
    if (char === quote) return { value, end: index + 1 };
    value += char;
    index += 1;
  }
  return { value, end: index };
}

/** Skips whitespace and returns the next offset. */
function skipWhitespace(source, start) {
  let index = start;
  while (index < source.length && /\s/.test(source[index])) index += 1;
  return index;
}

/**
 * Returns the offset after the balanced parentheses that start at `start`.
 * Strings and comments inside the call are skipped so a `)` in a title does
 * not end the call early.
 */
function skipBalanced(source, start) {
  let index = start;
  let depth = 0;
  while (index < source.length) {
    const char = source[index];
    const next = source[index + 1];
    if (char === "/" && next === "/") {
      while (index < source.length && source[index] !== "\n") index += 1;
      continue;
    }
    if (char === "/" && next === "*") {
      index += 2;
      while (index < source.length && !(source[index] === "*" && source[index + 1] === "/")) {
        index += 1;
      }
      index += 2;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      index = readString(source, index).end;
      continue;
    }
    if (char === "(") depth += 1;
    if (char === ")") {
      depth -= 1;
      if (depth === 0) return index + 1;
    }
    index += 1;
  }
  return index;
}

/**
 * Reads a test or suite call starting after its name.
 *
 * Returns the literal title, whether the call is skipped, the offset after the
 * call head, and the offset after the whole call body (used to ignore the
 * contents of a skipped suite).
 */
function readTestCall(source, start) {
  let index = start;
  let skipped = false;
  let suite = false;
  while (true) {
    index = skipWhitespace(source, index);
    if (source[index] !== ".") break;
    index += 1;
    const modifier = readIdentifier(source, index);
    index += modifier.length;
    if (modifier === "describe") suite = true;
    if (modifier === "skip" || modifier === "todo" || modifier === "fixme") skipped = true;
    if (modifier === "each") {
      index = skipWhitespace(source, index);
      if (source[index] === "(") index = skipBalanced(source, index);
    }
  }
  index = skipWhitespace(source, index);
  if (source[index] !== "(") return undefined;
  const bodyEnd = skipBalanced(source, index);
  index = skipWhitespace(source, index + 1);
  const quote = source[index];
  if (quote !== '"' && quote !== "'" && quote !== "`") {
    return skipped ? { skipped, suite, title: "", end: bodyEnd, bodyEnd } : undefined;
  }
  const title = readString(source, index);
  return { skipped, suite, title: title.value, end: title.end, bodyEnd };
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
 * Runs the full traceability check.
 *
 * `options.through` limits the expected RD range, which lets the plan build the
 * matrix incrementally. `options.fixture` replaces disk reads for unit tests.
 */
export function checkTraceability(root, options = {}) {
  const through = options.through ?? 13;
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
    if (!row.evidence) {
      errors.push(`matrix: ${row.id} has no evidence note`);
    }
    if (!row.title) {
      if (!partial) errors.push(`matrix: ${row.id} has no proving title`);
    } else {
      const declared = new Set();
      collectIds(row.title, declared);
      if (!declared.has(row.id)) {
        errors.push(`matrix: ${row.id} declares a proving title without that ID`);
      }
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
