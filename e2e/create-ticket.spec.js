const { test, expect } = require("@playwright/test");

// End-to-end write flow: fill the new-ticket form, submit it, and confirm we
// land on the new ticket's own page with the subject we typed. This exercises
// the real server action + database insert.
test.describe("Create a ticket", () => {
  test("creates a ticket and redirects to it", async ({ page }) => {
    // A unique subject + email so this test never collides with seed data or
    // with a previous run.
    const stamp = Date.now();
    const subject = `Playwright test ticket ${stamp}`;

    await page.goto("/new");

    // Each field is found by its <label> text (getByLabel).
    await page.getByLabel("Customer name").fill("Test User");
    await page.getByLabel("Email").fill(`test-${stamp}@example.com`);
    await page.getByLabel("Subject").fill(subject);
    await page.getByLabel("Description").fill("Created by an automated Playwright test.");

    // Submit. The server action inserts the rows and redirects.
    await page.getByRole("button", { name: "Create ticket" }).click();

    // We should now be on /tickets/<newId> (a numeric id), showing our subject.
    await expect(page).toHaveURL(/\/tickets\/\d+$/);
    await expect(page.getByRole("heading", { name: subject })).toBeVisible();
  });
});
