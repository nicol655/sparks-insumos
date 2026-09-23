import { defineConfig, devices } from "@playwright/test";

/**
 * Viewports mirror the breakpoints in the design spec (§04): mobile, tablet,
 * laptop and desktop. AC-15 and AC-17 are only meaningful across all of them.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    // Inside the e2e container the storefront answers at http://web:3000.
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://web:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "mobile-360",
      use: { ...devices["Desktop Chrome"], viewport: { width: 360, height: 780 } },
    },
    {
      name: "tablet-900",
      use: { ...devices["Desktop Chrome"], viewport: { width: 900, height: 1000 } },
    },
    {
      name: "laptop-1140",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1140, height: 900 } },
    },
    {
      name: "desktop-1440",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
  ],
});
