import { expect, test } from "@playwright/test";

test("the storefront responds and renders a document", async ({ page }) => {
  const response = await page.goto("/");

  expect(response?.ok()).toBe(true);
  await expect(page.locator("body")).toBeVisible();
});
