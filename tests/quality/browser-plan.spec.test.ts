import { describe, expect, it } from "vitest";
import {
  buildUnits,
  packShards,
  parseResults,
  resolveGroupIds,
  selectBrowserGroups,
  shardArguments,
  toMatrix,
} from "../../scripts/lib/browser-plan.mjs";

/**
 * Browser planning contract.
 *
 * These checks describe the behaviour the sharded runner must guarantee:
 * selection follows the test map, every unit lands in exactly one shard, the
 * matrix carries valid Playwright arguments, and a unit is reusable only after
 * a genuine pass.
 */

const map = {
  groups: [
    {
      id: "e2e.grid",
      sources: ["packages/react/src/YearPlanner.tsx", "packages/react/src/locale.ts"],
      tests: ["tests/e2e/classic-year.spec.ts"],
    },
    {
      id: "e2e.visual",
      sources: ["packages/react/src/render/**", "packages/react/src/theme.ts"],
      tests: ["tests/e2e/quality-visual.spec.ts"],
    },
    {
      id: "e2e.print",
      sources: ["packages/core/src/ribbon/print.ts"],
      tests: ["tests/e2e/print-matrix.spec.ts"],
    },
    {
      id: "e2e.security",
      sources: ["packages/react/src/render/**", "packages/react/src/safeStyle.ts"],
      tests: ["tests/e2e/security.spec.ts"],
    },
    {
      id: "core.unit",
      sources: ["packages/core/src/**"],
      tests: ["packages/core/src/**/*.test.ts"],
    },
  ],
  policy: {
    fullOnPaths: ["package.json", "scripts/**"],
    ignorePaths: [{ glob: "docs/**" }],
    prSmoke: ["e2e.security"],
  },
};

const config = {
  defaultWorkers: 2,
  chromiumShards: 2,
  groups: {
    "e2e.grid": { projects: ["chromium", "firefox", "webkit"], durationSec: 90 },
    "e2e.visual": { projects: ["chromium", "firefox", "webkit"], durationSec: 150 },
    "e2e.print": { projects: ["chromium"], durationSec: 120, poppler: true },
    "e2e.security": { projects: ["chromium", "firefox", "webkit"], durationSec: 60 },
  },
  browserInstall: {
    chromium: ["chromium"],
    firefox: ["firefox"],
    webkit: ["webkit"],
    "touch-chromium": ["chromium"],
    "mobile-chromium": ["chromium"],
    "mobile-webkit": ["webkit"],
  },
};

describe("browser selection", () => {
  it("selects only groups whose sources match a changed path", () => {
    const result = selectBrowserGroups({
      map,
      config,
      changed: ["packages/react/src/render/ItemLayer.tsx"],
      gate: "pr",
    });
    expect(result.mode).toBe("groups");
    expect(result.groupIds).toEqual(["e2e.visual", "e2e.security"]);
  });

  it("does not select a group for an unrelated source change", () => {
    const result = selectBrowserGroups({
      map,
      config,
      changed: ["packages/react/src/locale.ts"],
      gate: "pr",
    });
    expect(result.groupIds).toEqual(["e2e.grid", "e2e.security"]);
  });

  it("selects every group for a full-on path", () => {
    const result = selectBrowserGroups({
      map,
      config,
      changed: ["package.json"],
      gate: "pr",
    });
    expect(result.mode).toBe("full");
    expect(result.reason).toBe("full-on-path");
    expect(result.groupIds).toEqual(["e2e.grid", "e2e.visual", "e2e.print", "e2e.security"]);
  });

  it("selects nothing when every changed path is ignored", () => {
    const result = selectBrowserGroups({
      map,
      config,
      changed: ["docs/localization.md"],
      gate: "pr",
    });
    expect(result.mode).toBe("none");
    expect(result.groupIds).toEqual([]);
  });

  it("fails closed for a path no group owns", () => {
    const result = selectBrowserGroups({
      map,
      config,
      changed: ["new-top-level-file.txt"],
      gate: "pr",
    });
    expect(result.mode).toBe("full");
    expect(result.reason).toBe("unknown-path");
  });

  it("always runs every group on a release gate", () => {
    const result = selectBrowserGroups({ map, config, changed: [], gate: "release" });
    expect(result.mode).toBe("full");
    expect(result.groupIds).toHaveLength(4);
  });

  it("resolves full, none and grouped selector results", () => {
    expect(resolveGroupIds(map, config, null)).toHaveLength(4);
    expect(resolveGroupIds(map, config, { mode: "none" })).toEqual([]);
    expect(resolveGroupIds(map, config, { mode: "full" })).toHaveLength(4);
    expect(
      resolveGroupIds(map, config, {
        mode: "groups",
        selected: [{ id: "e2e.print" }],
        deferred: [{ id: "e2e.visual" }, { id: "core.unit" }],
      }),
    ).toEqual(["e2e.visual", "e2e.print"]);
  });
});

describe("browser shard packing", () => {
  const units = buildUnits({
    map,
    config,
    groupIds: ["e2e.grid", "e2e.visual", "e2e.print", "e2e.security"],
  });

  it("creates balanced chromium shards and one shard per other browser", () => {
    const shards = packShards({ units, config, chromiumShards: 2, workers: 2 });
    expect(shards.map((shard) => shard.name)).toEqual([
      "chromium-1",
      "chromium-2",
      "firefox",
      "webkit",
    ]);
    const chromiumLoads = shards
      .filter((shard) => shard.name.startsWith("chromium"))
      .map((shard) => shard.seconds);
    expect(chromiumLoads).toHaveLength(2);
    expect(chromiumLoads.reduce((total, load) => total + load, 0)).toBeCloseTo(220, 5);
  });

  it("splits equal work evenly across chromium shards", () => {
    const even = [
      {
        group: "e2e.grid",
        spec: "tests/e2e/a.spec.ts",
        project: "chromium",
        seconds: 40,
        poppler: false,
      },
      {
        group: "e2e.grid",
        spec: "tests/e2e/b.spec.ts",
        project: "chromium",
        seconds: 40,
        poppler: false,
      },
      {
        group: "e2e.grid",
        spec: "tests/e2e/c.spec.ts",
        project: "chromium",
        seconds: 20,
        poppler: false,
      },
      {
        group: "e2e.grid",
        spec: "tests/e2e/d.spec.ts",
        project: "chromium",
        seconds: 20,
        poppler: false,
      },
    ];
    const shards = packShards({ units: even, config, chromiumShards: 2, workers: 2 });
    const loads = shards.map((shard) => shard.seconds);
    expect(loads).toEqual([60, 60]);
  });

  it("assigns every unit exactly once", () => {
    const shards = packShards({ units, config, chromiumShards: 2, workers: 2 });
    const assigned = shards.flatMap((shard) => shard.units);
    expect(assigned).toHaveLength(units.length);
    expect(new Set(assigned.map((unit) => `${unit.spec}:${unit.project}`)).size).toBe(units.length);
  });

  it("marks the print shard as needing poppler", () => {
    const shards = packShards({ units, config, chromiumShards: 2, workers: 2 });
    const chromium = shards.filter((shard) => shard.name.startsWith("chromium"));
    expect(chromium.some((shard) => shard.poppler)).toBe(true);
    expect(shards.filter((shard) => shard.name === "firefox")[0]?.poppler).toBe(false);
  });

  it("emits sorted specs followed by project flags", () => {
    const shards = packShards({ units, config, chromiumShards: 1, workers: 2 });
    const first = shards[0];
    if (!first) throw new Error("expected at least one shard");
    const args = shardArguments(first);
    expect(args.at(-1)).toBe("--project=chromium");
    const specs = args.filter((arg) => !arg.startsWith("--project="));
    expect(specs).toEqual([...specs].sort());
  });

  it("builds a matrix whose install field is a space-separated browser list", () => {
    const mobile = packShards({
      units: [
        {
          group: "e2e.mobile",
          spec: "tests/e2e/mobile.spec.ts",
          project: "mobile-chromium",
          seconds: 10,
          poppler: false,
        },
        {
          group: "e2e.mobile",
          spec: "tests/e2e/mobile.spec.ts",
          project: "mobile-webkit",
          seconds: 10,
          poppler: false,
        },
      ],
      config,
      chromiumShards: 2,
      workers: 2,
    });
    const matrix = toMatrix(mobile);
    expect(matrix.include).toHaveLength(1);
    expect(matrix.include[0]?.install.split(" ").sort()).toEqual(["chromium", "webkit"]);
    expect(matrix.include[0]?.args).toEqual([
      "tests/e2e/mobile.spec.ts",
      "--project=mobile-chromium",
      "--project=mobile-webkit",
    ]);
  });

  it("pins a shard to the strictest group worker limit", () => {
    const pinned = {
      ...config,
      groups: {
        ...config.groups,
        "e2e.print": { projects: ["chromium"], durationSec: 120, workers: 1 },
      },
    };
    const printUnits = buildUnits({ map, config: pinned, groupIds: ["e2e.print"] });
    const shards = packShards({ units: printUnits, config: pinned, chromiumShards: 2, workers: 4 });
    expect(shards[0]?.workers).toBe(1);
  });

  it("keeps the requested workers when no group pins a limit", () => {
    const visualUnits = buildUnits({ map, config, groupIds: ["e2e.visual"] });
    const shards = packShards({ units: visualUnits, config, chromiumShards: 1, workers: 4 });
    expect(shards[0]?.workers).toBe(4);
  });

  it("returns no shards when nothing is selected", () => {
    expect(packShards({ units: [], config, chromiumShards: 2, workers: 2 })).toEqual([]);
  });
});

describe("browser results", () => {
  const report = (status: string, results: string[]) => ({
    suites: [
      {
        specs: [
          {
            file: "example.spec.ts",
            tests: [
              {
                projectName: "chromium",
                status,
                results: results.map((entry) => ({ status: entry, duration: 100 })),
              },
            ],
          },
        ],
      },
    ],
  });

  it("marks a unit passed only when it executed without failure", () => {
    const passed = parseResults(report("expected", ["passed"]));
    expect(passed.get("tests/e2e/example.spec.ts\u0000chromium")).toEqual({
      passed: true,
      durationMs: 100,
    });

    const failed = parseResults(report("unexpected", ["failed"]));
    expect(failed.get("tests/e2e/example.spec.ts\u0000chromium")?.passed).toBe(false);

    const skipped = parseResults(report("skipped", ["skipped"]));
    expect(skipped.get("tests/e2e/example.spec.ts\u0000chromium")?.passed).toBe(false);

    const flaky = parseResults(report("flaky", ["passed", "passed"]));
    expect(flaky.get("tests/e2e/example.spec.ts\u0000chromium")?.passed).toBe(false);
  });

  it("does not count a unit with a passing and a failing test as passed", () => {
    const mixed = {
      suites: [
        {
          specs: [
            {
              file: "example.spec.ts",
              tests: [
                {
                  projectName: "chromium",
                  status: "expected",
                  results: [{ status: "passed", duration: 10 }],
                },
                {
                  projectName: "chromium",
                  status: "unexpected",
                  results: [{ status: "failed", duration: 20 }],
                },
              ],
            },
          ],
        },
      ],
    };
    const result = parseResults(mixed).get("tests/e2e/example.spec.ts\u0000chromium");
    expect(result?.passed).toBe(false);
    expect(result?.durationMs).toBe(30);
  });
});
