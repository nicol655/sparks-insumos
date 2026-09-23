import { expect, test, type Page } from "@playwright/test";

/**
 * Client islands (add, drawer, counter) only exist after hydration.
 * Playwright's `load` can win the race; `#header-cart[data-hydrated=true]`
 * is the signal CartHydration has finished.
 */
async function openStorefront(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator("#header-cart")).toBeVisible();
  await expect(page.locator("#header-cart")).toHaveAttribute("data-hydrated", "true");
}

test("adding a product opens the drawer, toasts and updates the header", async ({ page }) => {
  await openStorefront(page, "/es/catalogo/bharara-king");

  await page.getByRole("button", { name: "Agregar al carrito" }).click();

  await expect(page.getByRole("dialog", { name: "Carrito" })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "Agregado al carrito" })).toBeVisible();
  await expect(page.getByRole("button", { name: "1 producto en el carrito" })).toBeVisible();
  await expect(page.getByRole("dialog").getByRole("link", { name: "King" })).toBeVisible();
});

test("Escape closes the drawer and returns focus to the cart button", async ({ page }) => {
  await openStorefront(page, "/es");

  const cart = page.getByRole("button", { name: "Carrito vacío" });
  await cart.click();
  await expect(page.getByRole("dialog", { name: "Carrito" })).toBeVisible();

  await page.keyboard.press("Escape");

  await expect(page.getByRole("dialog", { name: "Carrito" })).toHaveCount(0);
  await expect(cart).toBeFocused();
});

test("quantity and remove update the drawer", async ({ page }) => {
  await openStorefront(page, "/es/catalogo/bharara-king");
  await page.getByRole("button", { name: "Agregar al carrito" }).click();

  const drawer = page.getByRole("dialog", { name: "Carrito" });
  await expect(drawer.getByRole("link", { name: "King" })).toBeVisible();

  await drawer.getByRole("button", { name: "Aumentar cantidad" }).click();
  await expect(drawer.getByRole("status", { name: "Cantidad" })).toHaveText("2");

  await drawer.getByRole("button", { name: "Quitar King" }).click();
  await expect(drawer.getByText("Tu carrito está vacío")).toBeVisible();
  await expect(page.getByRole("button", { name: "Carrito vacío" })).toBeVisible();
});

test("the cart survives a reload and lists the order on the cart page", async ({ page }) => {
  await openStorefront(page, "/es/catalogo/bharara-king");
  await page.getByRole("button", { name: "Agregar al carrito" }).click();
  await expect(page.getByRole("dialog", { name: "Carrito" })).toBeVisible();

  await page.getByRole("link", { name: "Ver carrito" }).click();
  await expect(page).toHaveURL(/\/es\/carrito/);
  await expect(page.getByRole("heading", { level: 1, name: "Tu carrito" })).toBeVisible();
  await expect(page.getByRole("link", { name: "King" })).toBeVisible();
  await expect(page.getByText("Resumen")).toBeVisible();
  await expect(page.getByText("$39.000 c/u")).toBeVisible();

  const checkout = page.getByRole("link", { name: "Finalizar compra" });
  await expect(checkout).toHaveAttribute("href", /wa\.me\/5491168692694/);
  await expect(checkout).toHaveAttribute("href", /Bharara/);

  await page.reload();
  await expect(page.locator("#header-cart")).toHaveAttribute("data-hydrated", "true");
  await expect(page.getByRole("link", { name: "King" })).toBeVisible();
  await expect(page.getByRole("button", { name: "1 producto en el carrito" })).toBeVisible();
});

test("the English cart route translates", async ({ page }) => {
  await openStorefront(page, "/en/catalogue/bharara-king");
  await page.getByRole("button", { name: "Add to cart" }).click();

  await expect(page.getByRole("dialog", { name: "Cart" })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "Added to cart" })).toBeVisible();

  await page.getByRole("link", { name: "View cart" }).click();
  await expect(page).toHaveURL(/\/en\/cart/);
  await expect(page.getByRole("heading", { level: 1, name: "Your cart" })).toBeVisible();
});

test("the empty cart page shows the prototype box (AC-2)", async ({ page }) => {
  await openStorefront(page, "/es/carrito");

  await expect(page.getByRole("heading", { level: 1, name: "Tu carrito" })).toBeVisible();
  await expect(page.getByText("Todavía no agregaste nada.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Ver catálogo" })).toHaveAttribute(
    "href",
    "/es/catalogo",
  );
});

test("Aplicar does not post or change the total (AC-5)", async ({ page }) => {
  const posts: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST") posts.push(request.url());
  });

  await openStorefront(page, "/es/catalogo/bharara-king");
  await page.getByRole("button", { name: "Agregar al carrito" }).click();
  await page.getByRole("link", { name: "Ver carrito" }).click();

  await page.getByLabel("Cupón").fill("VIP15");
  await page.getByRole("button", { name: "Aplicar" }).click();

  await expect(page).toHaveURL(/\/es\/carrito$/);
  expect(posts).toEqual([]);
  await expect(page.getByRole("link", { name: "Finalizar compra" })).toBeVisible();
});

test("a cart under $30.000 cannot close on WhatsApp (AC-7)", async ({ page }) => {
  await openStorefront(page, "/es/catalogo/lattafa-yara");
  await page.getByRole("button", { name: "Agregar al carrito" }).click();
  await page.getByRole("link", { name: "Ver carrito" }).click();

  await expect(page.getByRole("heading", { level: 1, name: "Tu carrito" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Finalizar compra" })).toBeDisabled();
  await expect(page.getByRole("main").locator('a[href*="wa.me"]')).toHaveCount(0);
});
