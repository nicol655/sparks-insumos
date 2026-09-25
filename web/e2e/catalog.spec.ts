import { expect, test, type Page } from "@playwright/test";

function chip(page: Page, name: string) {
  return page.getByRole("complementary").getByRole("button", { name, exact: true });
}

test("the catalogue has a single h1 and lists products", async ({ page }) => {
  await page.goto("/es/catalogo");

  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Catálogo");
  await expect(page.getByText(/Catálogo · \d+ perfumes/)).toBeVisible();
  await expect(page.getByRole("list", { name: "Resultados del catálogo" })).toBeVisible();
  await expect(page.getByRole("complementary")).toBeVisible();
});

test("applying filters updates the URL and survives a reload", async ({ page }) => {
  await page.goto("/es/catalogo");

  await chip(page, "Gourmand").click();
  await expect(page).toHaveURL(/family=gourmand/);

  await page.reload();
  await expect(page).toHaveURL(/family=gourmand/);
  await expect(page.getByRole("link", { name: "Quitar filtro: Gourmand" })).toBeVisible();
});

test("combining two filters and removing one updates the grid", async ({ page }) => {
  await page.goto("/es/catalogo");

  await chip(page, "Gourmand").click();
  await expect(page).toHaveURL(/family=gourmand/);

  await chip(page, "Lattafa").click();
  await expect(page).toHaveURL(/family=gourmand/);
  await expect(page).toHaveURL(/brand=Lattafa/);

  await page.getByRole("link", { name: "Quitar filtro: Gourmand" }).click();
  await expect(page).toHaveURL(/brand=Lattafa/);
  await expect(page).not.toHaveURL(/family=gourmand/);
  await expect(page.getByRole("list", { name: "Resultados del catálogo" })).toBeVisible();
});

test("an empty combination shows WhatsApp as a way out", async ({ page }) => {
  // RF-2 dims chips that would empty the grid, so this combo is reached by URL.
  await page.goto("/es/catalogo?family=gourmand&brand=V.V+Love");

  await expect(page.getByRole("heading", { name: "Nada con esa combinación" })).toBeVisible();
  await expect(
    page.getByRole("main").getByRole("link", { name: "Consultar por WhatsApp" }),
  ).toHaveAttribute("href", /wa\.me\/5491168692694.*combinaci/);

  await page.getByRole("link", { name: "Quitar filtro: Gourmand" }).click();
  await expect(page.getByRole("list", { name: "Resultados del catálogo" })).toBeVisible();
});

test("a shared filtered URL reproduces the empty state", async ({ page }) => {
  await page.goto("/es/catalogo?family=gourmand&brand=V.V+Love");

  await expect(page.getByRole("heading", { name: "Nada con esa combinación" })).toBeVisible();
});

test("the catalogue does not overflow horizontally", async ({ page }) => {
  await page.goto("/es/catalogo");

  const overflowed = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  expect(overflowed).toBe(false);
});
