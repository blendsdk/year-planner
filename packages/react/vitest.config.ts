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
    setupFiles: ["src/test-setup.ts"],
  },
});
