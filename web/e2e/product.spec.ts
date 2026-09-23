import { expect, test } from "@playwright/test";

test("the product page has a single h1 and descriptive images", async ({ page }) => {
  await page.goto("/es/catalogo/bharara-king");

  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("King");
  await expect(page.getByRole("heading", { name: "Pirámide olfativa" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Productos relacionados" })).toBeVisible();

  const images = page.getByRole("main").getByRole("img");
  const count = await images.count();
  expect(count).toBeGreaterThan(0);

  for (let index = 0; index < count; index += 1) {
    const name = await images.nth(index).getAttribute("aria-label");
    const alt = await images.nth(index).getAttribute("alt");
    const label = (name ?? alt ?? "").trim();
    expect(label.length).toBeGreaterThan(8);
    expect(label.toLowerCase()).not.toContain("imagen de producto");
    expect(label.toLowerCase()).not.toContain("product image");
  }
});

test("a sold-out bottle offers WhatsApp instead of add to cart", async ({ page }) => {
  await page.goto("/es/catalogo/paris-corner-emir-ironwood");

  await expect(page.getByText("Sin stock")).toBeVisible();
  await expect(page.getByRole("link", { name: "Consultar stock por WhatsApp" })).toHaveAttribute(
    "href",
    /wa\.me\/5491168692694/,
  );
  await expect(page.getByRole("button", { name: "Agregar al carrito" })).toHaveCount(0);
});

test("the English product route translates the chrome around the proper noun", async ({
  page,
}) => {
  await page.goto("/en/catalogue/bharara-king");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("King");
  await expect(page.getByRole("button", { name: "Add to cart" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Olfactive pyramid" })).toBeVisible();
});

test("the product page does not overflow horizontally", async ({ page }) => {
  await page.goto("/es/catalogo/bharara-king");

  const overflowed = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  expect(overflowed).toBe(false);
});
