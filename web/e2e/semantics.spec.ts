import { expect, test } from "@playwright/test";

import { PHASE1_ROUTES } from "./helpers";

test("every Fase 1 route exposes exactly one h1 (AC-14)", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-360", "heading count is not viewport-specific");

  for (const path of PHASE1_ROUTES.flatMap((route) => [route.es, route.en])) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 }), path).toHaveCount(1);
  }
});
