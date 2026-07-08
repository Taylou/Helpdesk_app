const { test, expect } = require("@playwright/test");

// Smoke test: the sidebar links take you to each main page.
// For each link we click it, check the URL changed, and check the right
// heading rendered. We select links/headings by their ROLE and visible NAME —
// the way a user (or screen reader) finds them — not by CSS classes.
test.describe("Sidebar navigation", () => {
  test("moves between the main pages", async ({ page }) => {
    // Start on the dashboard. `/` is resolved against baseURL from the config.
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

    // Tickets. `exact: true` so we match "Tickets" and not "+ New ticket".
    await page.getByRole("link", { name: "Tickets", exact: true }).click();
    await expect(page).toHaveURL("/tickets");
    await expect(page.getByRole("heading", { name: "Tickets" })).toBeVisible();

    // AI Assistant.
    await page.getByRole("link", { name: "AI Assistant" }).click();
    await expect(page).toHaveURL("/assistant");
    await expect(page.getByRole("heading", { name: "AI Assistant" })).toBeVisible();

    // New ticket. `exact` again avoids the "+ New ticket" call-to-action link.
    await page.getByRole("link", { name: "New ticket", exact: true }).click();
    await expect(page).toHaveURL("/new");
    await expect(page.getByRole("heading", { name: "New ticket" })).toBeVisible();

    // Settings.
    await page.getByRole("link", { name: "Settings" }).click();
    await expect(page).toHaveURL("/settings");
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

    // Back to the dashboard.
    await page.getByRole("link", { name: "Dashboard" }).click();
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });
});
