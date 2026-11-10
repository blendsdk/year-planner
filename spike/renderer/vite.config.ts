import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  resolve: {
    alias: {
      "@blendsdk/year-planner-core": fileURLToPath(
        new URL("../../packages/core/src/index.ts", import.meta.url),
      ),
    },
  },
  build: {
    manifest: true,
    outDir: "dist",
    emptyOutDir: true,
    target: "es2022",
  },
});
