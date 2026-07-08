const { test, expect } = require("@playwright/test");

// Visiting an id that doesn't exist should render Next.js's 404 page.
// The detail page calls notFound() when getTicket() returns nothing.
test.describe("Not found", () => {
  test("shows 404 for a missing ticket", async ({ page }) => {
    const response = await page.goto("/tickets/999999");

    // The document responds with an HTTP 404 status…
    expect(response?.status()).toBe(404);

    // …and Next's default not-found copy is shown to the user.
    await expect(
      page.getByText(/This page could not be found/i)
    ).toBeVisible();
  });
});
