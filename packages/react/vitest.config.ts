import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@blendsdk/year-planner-core": fileURLToPath(
        new URL("../core/src/index.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.spec.test.tsx", "src/**/*.impl.test.tsx"],
    testTimeout: 15000,
    // Two workers keep the timer-sensitive command tests deterministic on the
    // reference 4-core host; the full suite otherwise starves short deadlines.
    maxWorkers: 2,
    setupFiles: ["src/test-setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json"],
      thresholds: {
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80,
      },
    },
  },
});
