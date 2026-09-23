import { expect, test } from "@playwright/test";

import { PHASE1_ROUTES } from "./helpers";

test("every visible control is at least 44×44px at 360px (AC-15)", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-360", "AC-15 is the 360px viewport");

  for (const path of PHASE1_ROUTES.flatMap((route) => [route.es, route.en])) {
    await page.goto(path);

    const small = await page.evaluate(() => {
      const bad: Array<{ name: string; w: number; h: number }> = [];

      for (const el of document.querySelectorAll("a, button, input, select, [role='button']")) {
        if (!(el instanceof HTMLElement)) continue;
        if (el.closest("[aria-hidden='true']")) continue;
        if (el.classList.contains("sr-only")) continue;
        if (!el.checkVisibility()) continue;

        const box = el.getBoundingClientRect();
        if (box.width === 0 || box.height === 0) continue;
        if (box.width < 43.5 || box.height < 43.5) {
          bad.push({
            name: (el.getAttribute("aria-label") ?? el.textContent ?? "").trim().slice(0, 60),
            w: Math.round(box.width),
            h: Math.round(box.height),
          });
        }
      }

      return bad;
    });

    expect(small, path).toEqual([]);
  }
});
