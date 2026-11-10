import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["src/**/*.spec.test.tsx", "src/**/*.impl.test.tsx"],
    setupFiles: ["src/test-setup.ts"],
  },
});
