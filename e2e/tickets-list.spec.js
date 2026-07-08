const { test, expect } = require("@playwright/test");

// The tickets list reads from the seeded database. These checks rely on the
// global-setup seed having loaded the sample tickets (ids 1035–1042).
test.describe("Tickets list", () => {
  test("shows seeded tickets and filters by search", async ({ page }) => {
    await page.goto("/tickets");

    // A known seeded ticket is visible on the list.
    await expect(
      page.getByText("Login page returns a 500 error")
    ).toBeVisible();

    // The search box is found by its accessible label (aria-label="Filter tickets").
    const search = page.getByLabel("Filter tickets");

    // Typing a matching query keeps the ticket visible…
    await search.fill("login");
    await expect(page.getByText("Login page returns a 500 error")).toBeVisible();

    // …and a query that matches nothing shows the empty state.
    await search.fill("zzzzz-no-match");
    await expect(page.getByText("No matching tickets")).toBeVisible();

    // The "Clear" button (only shown while the box has text) resets the list.
    await page.getByRole("button", { name: "Clear" }).click();
    await expect(page.getByText("Login page returns a 500 error")).toBeVisible();
  });

  test("filters by status chip and shows the count footer", async ({ page }) => {
    await page.goto("/tickets");

    // Clicking a status chip re-filters the list. The footer always reports
    // how many of the total are currently shown, e.g. "Showing 5 of 8 tickets".
    await page.getByRole("button", { name: "Closed", exact: true }).click();
    await expect(page.getByText(/Showing \d+ of \d+ tickets/)).toBeVisible();

    await page.getByRole("button", { name: "All", exact: true }).click();
    await expect(page.getByText(/Showing \d+ of \d+ tickets/)).toBeVisible();
  });
});
