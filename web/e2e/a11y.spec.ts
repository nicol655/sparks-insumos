import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { PHASE1_ROUTES } from "./helpers";

test("Fase 1 routes have no critical or serious axe violations in either language (AC-13)", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-360", "axe is viewport-independent; run once");

  for (const path of PHASE1_ROUTES.flatMap((route) => [route.es, route.en])) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    const blocking = results.violations.filter(
      (violation) => violation.impact === "critical" || violation.impact === "serious",
    );

    expect(
      blocking,
      `${path}\n${blocking.map((violation) => `[${violation.impact}] ${violation.id}: ${violation.help}`).join("\n")}`,
    ).toEqual([]);
  }
});
