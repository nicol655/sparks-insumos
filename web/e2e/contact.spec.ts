import { expect, test } from "@playwright/test";

import { isNarrow, openStorefront } from "./helpers";

test("the contact page has a single h1 and a live WhatsApp panel", async ({ page }) => {
  await page.goto("/es/contacto");

  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Escribinos.");
  await expect(page.getByText("hola@sparksparfums.com")).toBeVisible();

  const panel = page.getByRole("main").getByRole("link", { name: /Consultas en el día/ });
  await expect(panel).toHaveAttribute("href", /wa\.me\/5491168692694/);
});

test("the English contact route translates", async ({ page }) => {
  await page.goto("/en/contact");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Write to us.");
  await expect(page.getByRole("button", { name: "Send message" })).toBeVisible();
});

test("submitting the form does not navigate or post (AC-2)", async ({ page }) => {
  const posts: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST") posts.push(request.url());
  });

  await openStorefront(page, "/es/contacto");
  await page.getByLabel("Nombre").fill("Camila");
  await page.getByRole("button", { name: "Enviar mensaje" }).click();

  await expect(page).toHaveURL(/\/es\/contacto$/);
  expect(posts).toEqual([]);
});

test("the header Contacto link opens the page (AC-5)", async ({ page }) => {
  await page.goto("/es");

  if (isNarrow(page)) {
    await page.getByRole("button", { name: "Abrir menú" }).click();
  }

  await page
    .getByRole("navigation", { name: "Navegación principal" })
    .getByRole("link", { name: "Contacto" })
    .click();

  await expect(page).toHaveURL(/\/es\/contacto$/);
  await expect(page.getByRole("heading", { level: 1, name: "Escribinos." })).toBeVisible();
});
