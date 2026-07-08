// Playwright "global setup": a function that runs ONCE before the whole test run.
// Docs: https://playwright.dev/docs/test-global-setup-teardown
//
// The app reads live from Postgres, so tests need predictable data. We reseed
// the database here so every run starts from the same known 8 tickets
// (ids 1035–1042). Deterministic data = tests that don't flake.
//
// This reuses the project's own seed script (prisma/seed.mjs, wired as
// `npm run db:seed`) rather than duplicating any logic.
//
// Requires Postgres to be running first:  docker compose up -d
const { execSync } = require("node:child_process");

module.exports = async () => {
  console.log("\n[global-setup] Reseeding the database (npm run db:seed)…");
  try {
    // stdio: "inherit" streams the seed script's output to your terminal.
    execSync("npm run db:seed", { stdio: "inherit" });
    console.log("[global-setup] Seed complete.\n");
  } catch (err) {
    console.error(
      "\n[global-setup] Seed failed. Is Postgres running?\n" +
        "  Start it with:  docker compose up -d\n"
    );
    throw err;
  }
};
