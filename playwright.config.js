// Playwright configuration.
// Docs: https://playwright.dev/docs/test-configuration
const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  // Where the test files live.
  testDir: "./e2e",

  // Run tests in files in parallel.
  fullyParallel: true,

  // On CI, fail the build if you accidentally left a `test.only` in the source.
  forbidOnly: !!process.env.CI,

  // Retry a flaky test a couple of times on CI only.
  retries: process.env.CI ? 2 : 0,

  // Generate an HTML report you can open with `npm run test:e2e:report`.
  reporter: "html",

  // Runs ONCE before the whole suite — we use it to reseed the database.
  globalSetup: "./e2e/global-setup.js",

  use: {
    // Every `page.goto("/...")` is resolved against this.
    baseURL: "http://localhost:3000",

    // Capture a trace (a step-by-step recording) the first time a test retries,
    // so you can debug failures in the trace viewer.
    trace: "on-first-retry",
  },

  // Which browsers to run against. We keep it to Chromium for the lab; add
  // Firefox / WebKit projects here later if you want cross-browser coverage.
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],

  // Playwright starts the app for you before the tests, and shuts it down after.
  // If a dev server is already running on :3000 it reuses it (locally).
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
