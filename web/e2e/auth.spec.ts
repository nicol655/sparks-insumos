import { expect, test } from "@playwright/test";

test("sign-in has one heading, no error, and a tab that changes route", async ({ page }) => {
  await page.goto("/es/ingresar");

  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Bienvenida de vuelta.");
  await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);

  await page.getByRole("main").getByRole("link", { name: "Crear cuenta" }).click();
  await expect(page).toHaveURL(/\/es\/registro$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Creá tu cuenta.");
});

test("the English sign-in route translates and opens register", async ({ page }) => {
  await page.goto("/en/sign-in");

  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Welcome back.");
  await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);

  await page.getByRole("main").getByRole("link", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/en\/register$/);
});

test("register keeps a single heading and an inactive sign-in tab", async ({ page }) => {
  await page.goto("/es/registro");

  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("main").getByRole("link", { name: "Ingresar" })).toBeVisible();
  await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);
});

test("the account route without a session opens sign-in", async ({ page }) => {
  await page.goto("/es/cuenta");

  await expect(page).toHaveURL(/\/es\/ingresar\?next=%2Fes%2Fcuenta/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Bienvenida de vuelta.");
});
