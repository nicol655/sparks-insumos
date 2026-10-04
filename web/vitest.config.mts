import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Resolves the "@/*" alias straight from tsconfig.json.
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    // docker/docker-compose.yml sets API_MODE=http for the running store.
    // Unit tests stay on fixtures; they must not call the live API.
    env: {
      API_MODE: "mock",
    },
    // Playwright owns e2e/; Vitest must not try to run those specs.
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.{test,spec}.{ts,tsx}", "src/fixtures/**", "src/test/**"],
    },
  },
});
