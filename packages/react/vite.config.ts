import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: {
        index: "src/index.ts",
        "adapters/fluent": "src/adapters/fluent.ts",
        "adapters/mui": "src/adapters/mui.ts",
      },
      formats: ["es"],
      fileName: (_format, entryName) => `${entryName}.js`,
      cssFileName: "styles",
    },
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime", "@blendsdk/year-planner-core"],
    },
    emptyOutDir: true,
  },
});
