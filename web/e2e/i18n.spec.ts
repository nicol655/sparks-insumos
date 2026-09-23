import { expect, test } from "@playwright/test";

import { openStorefront, switchToEnglish } from "./helpers";

test("switching language translates the chrome without a full reload and keeps the cart (AC-6, AC-7)", async ({
  page,
}) => {
  let documentLoads = 0;
  page.on("load", () => {
    documentLoads += 1;
  });

  await openStorefront(page, "/es/catalogo/bharara-king");
  const loadsAfterOpen = documentLoads;

  await page.getByRole("main").getByRole("button", { name: "Agregar al carrito" }).click();
  await expect(page.getByRole("dialog", { name: "Carrito" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "1 producto en el carrito" })).toBeVisible();

  await switchToEnglish(page);

  await expect(page).toHaveURL(/\/en\/catalogue\/bharara-king/);
  await expect(page.getByRole("button", { name: "Search" })).toBeVisible();
  await expect(page.getByRole("button", { name: "1 item in the cart" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("King");
  expect(documentLoads).toBe(loadsAfterOpen);
});

test("hreflang pairs every Fase 1 locale with its twin", async ({ page }) => {
  await page.goto("/es/catalogo");
  await expect(page.locator("html")).toHaveAttribute("lang", "es-AR");

  const languages = await page.locator("link[rel='alternate'][hreflang]").evaluateAll((nodes) =>
    Object.fromEntries(
      nodes.map((node) => [node.getAttribute("hreflang") ?? "", node.getAttribute("href") ?? ""]),
    ),
  );

  expect(JSON.stringify(languages)).toMatch(/es-AR|es/);
  expect(Object.values(languages).some((href) => /\/es\/catalogo/.test(href))).toBe(true);
  expect(Object.values(languages).some((href) => /\/en\/catalogue/.test(href))).toBe(true);
});
