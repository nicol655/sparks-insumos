import { expect, type Page } from "@playwright/test";

/** Fase 1 routes, both locales. Used by a11y / semantics / copy / touch. */
export const PHASE1_ROUTES = [
  { es: "/es", en: "/en" },
  { es: "/es/catalogo", en: "/en/catalogue" },
  { es: "/es/catalogo/bharara-king", en: "/en/catalogue/bharara-king" },
  { es: "/es/carrito", en: "/en/cart" },
  { es: "/es/contacto", en: "/en/contact" },
] as const;

export async function openStorefront(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator("#header-cart")).toBeVisible();
  await expect(page.locator("#header-cart")).toHaveAttribute("data-hydrated", "true");
}

export function isNarrow(page: Page): boolean {
  return (page.viewportSize()?.width ?? 1440) < 900;
}

export async function switchToEnglish(page: Page) {
  if (isNarrow(page)) {
    await page.getByRole("button", { name: "Abrir menú" }).click();
  }

  await page.getByRole("button", { name: "Ver el sitio en Inglés" }).click();
}
