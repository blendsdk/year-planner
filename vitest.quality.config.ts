import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Node-only project for cross-cutting repository contracts: traceability,
 * public exports, coverage floors and CI evidence. It runs before the build
 * step, so every check must read source or configuration rather than `dist`.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@blendsdk/year-planner-core": fileURLToPath(
        new URL("./packages/core/src/index.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "node",
    include: ["tests/quality/**/*.spec.test.ts", "tests/quality/**/*.impl.test.ts"],
    testTimeout: 30_000,
  },
});
