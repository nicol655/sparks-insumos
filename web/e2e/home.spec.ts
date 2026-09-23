import { expect, test } from "@playwright/test";

test("the home has a single h1 and a path into the catalogue", async ({ page }) => {
  await page.goto("/es");

  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Se recuerda");

  await page.getByRole("link", { name: "Ver catálogo" }).click();
  await expect(page).toHaveURL(/\/es\/catalogo/);
});

test("the English home translates the hero", async ({ page }) => {
  await page.goto("/en");

  await expect(page.getByRole("heading", { level: 1 })).toContainText("It is remembered");
  await expect(page.getByRole("link", { name: "View catalogue" })).toBeVisible();
});

test("the hero image meets the marquee and the stats sit under the CTAs (003)", async ({
  page,
}) => {
  await page.goto("/es");

  const hero = page.locator("[data-home-hero]");
  const figure = hero.locator("figure");
  const marquee = page.locator("[data-home-marquee]");
  const stats = hero.locator("dl");

  await expect(hero.getByRole("heading", { level: 1 })).toContainText("Se recuerda");
  await expect(hero.getByRole("link", { name: "Consultar por WhatsApp" })).toBeVisible();
  await expect(stats.getByText("Referencias en stock")).toBeVisible();

  const figureBox = await figure.boundingBox();
  const marqueeBox = await marquee.boundingBox();
  const statsBox = await stats.boundingBox();
  const ctaBox = await hero.getByRole("link", { name: "Ver catálogo" }).boundingBox();

  expect(figureBox).toBeTruthy();
  expect(marqueeBox).toBeTruthy();
  expect(statsBox).toBeTruthy();
  expect(ctaBox).toBeTruthy();
  expect(Math.abs((figureBox?.y ?? 0) + (figureBox?.height ?? 0) - (marqueeBox?.y ?? 0))).toBeLessThan(
    3,
  );
  expect((statsBox?.y ?? 0)).toBeGreaterThan((ctaBox?.y ?? 0));
});

test("the clubhouse, commerce strip and footer close the home (002)", async ({ page }) => {
  await page.goto("/es");

  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Registrate y comprá distinto." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Crear cuenta" }).first()).toHaveAttribute(
    "href",
    "/es/registro",
  );
  await expect(page.getByRole("link", { name: "Ya tengo cuenta" })).toHaveAttribute(
    "href",
    "/es/ingresar",
  );
  await expect(page.getByRole("heading", { name: "Todo el país", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Precio por cantidad" })).toBeVisible();

  const footer = page.getByRole("contentinfo");
  await expect(footer.getByRole("navigation", { name: "Tienda" })).toBeVisible();
  await expect(footer.getByRole("link", { name: "Instagram" })).toBeVisible();
  await expect(footer.getByText(/Defensa de consumidores/)).toBeVisible();
  await expect(footer.getByRole("link", { name: "WhatsApp" })).toHaveCount(0);
});
