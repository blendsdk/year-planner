import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@blendsdk/year-planner-core": fileURLToPath(
        new URL("../../packages/core/src/index.ts", import.meta.url),
      ),
      "@blendsdk/react-year-planner/styles.css": fileURLToPath(
        new URL("../../packages/react/src/styles.css", import.meta.url),
      ),
      "@blendsdk/react-year-planner": fileURLToPath(
        new URL("../../packages/react/src/index.ts", import.meta.url),
      ),
    },
  },
});
