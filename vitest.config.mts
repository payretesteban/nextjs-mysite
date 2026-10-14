import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    // Each test file still gets its own fresh module context, but the jsdom setup is reused instead of rebuilt
    // per file: about 2.5x faster (the default pool spent half its time creating jsdom environments)
    pool: "vmThreads",
    // `npm run test:coverage` → summary in the terminal, full report in coverage/index.html
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}", "scripts/**/*.mjs"],
      exclude: ["**/__tests__/**", "**/*.d.ts"],
      reporter: ["text-summary", "text", "html"],
      reportsDirectory: "coverage",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
