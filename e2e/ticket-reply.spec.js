const { test, expect } = require("@playwright/test");

// Open a known seeded ticket (#1042), check the reserved AI panel is disabled,
// then post a reply and confirm it appears in the conversation.
test.describe("Ticket detail + reply", () => {
  test("posts a reply to ticket #1042", async ({ page }) => {
    await page.goto("/tickets/1042");

    // The back link is present on the detail page.
    await expect(
      page.getByRole("link", { name: /Back to tickets/ })
    ).toBeVisible();

    // The "AI suggested reply" panel exists, but its button is intentionally
    // disabled (reserved for a later lab). A negative assertion is still a test.
    await expect(
      page.getByRole("button", { name: /Generate suggestion/ })
    ).toBeDisabled();

    // Type a reply (unique text so we can assert it later) and send it.
    const reply = `Automated reply ${Date.now()}`;
    await page.getByPlaceholder("Write a reply…").fill(reply);
    await page.getByRole("button", { name: "Send reply" }).click();

    // After the server action saves it and the page revalidates, the new
    // message shows up in the thread.
    await expect(page.getByText(reply)).toBeVisible();
  });
});
