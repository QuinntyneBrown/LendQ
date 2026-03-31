import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/iteration",
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.BASE_URL || "https://lemon-wave-0a1790b0f.6.azurestaticapps.net",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chaos",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
