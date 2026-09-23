import { expect, test, type Page } from "@playwright/test";

/**
 * Client islands only exist after hydration. `#header-cart[data-hydrated=true]`
 * is the same signal the cart suite uses (ADR-0008).
 */
async function openStorefront(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator("#header-cart")).toBeVisible();
  await expect(page.locator("#header-cart")).toHaveAttribute("data-hydrated", "true");
}

test("the search overlay focuses the input and restores the trigger (AC-12)", async ({ page }) => {
  await openStorefront(page, "/es");

  const trigger = page.locator("#header-search");
  await trigger.click();

  await expect(page.getByRole("dialog", { name: "Buscar" })).toBeVisible();
  await expect(page.getByRole("searchbox")).toBeFocused();

  await page.keyboard.press("Escape");

  await expect(page.getByRole("dialog", { name: "Buscar" })).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("live results appear from two characters and Enter filters the catalogue", async ({
  page,
}) => {
  await openStorefront(page, "/es");

  await page.locator("#header-search").click();
  await expect(page.getByRole("group", { name: "Sugerencias" })).toBeVisible();

  await page.getByRole("searchbox").fill("va");

  const results = page.getByRole("list", { name: "Resultados de búsqueda" });
  await expect(results).toBeVisible();
  expect(await results.getByRole("listitem").count()).toBeLessThanOrEqual(4);
  await expect(results.getByRole("listitem").first()).toContainText("$");

  await page.getByRole("searchbox").press("Enter");

  await expect(page).toHaveURL(/\/es\/catalogo\?q=va/);
  await expect(page.getByRole("link", { name: "Quitar filtro: va" })).toBeVisible();
});

test("the English overlay lands on the translated catalogue path", async ({ page }) => {
  await openStorefront(page, "/en");

  await page.getByRole("button", { name: "Search" }).click();
  await expect(page.getByRole("dialog", { name: "Search" })).toBeVisible();

  await page.getByRole("searchbox").fill("vanilla");
  await page.getByRole("searchbox").press("Enter");

  await expect(page).toHaveURL(/\/en\/catalogue\?q=vanilla/);
});
