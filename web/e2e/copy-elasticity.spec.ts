import { expect, test } from "@playwright/test";

import { PHASE1_ROUTES } from "./helpers";

test("360px does not scroll sideways or clip chrome copy in either language (AC-17)", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-360", "AC-17 is the 360px viewport");

  for (const path of PHASE1_ROUTES.flatMap((route) => [route.es, route.en])) {
    await page.goto(path);

    const overflowed = await page.evaluate(() => {
      const clipped: string[] = [];

      if (document.documentElement.scrollWidth > document.documentElement.clientWidth + 1) {
        clipped.push("document");
      }

      for (const el of document.querySelectorAll("h1, h2, nav, a, button")) {
        if (!(el instanceof HTMLElement) || !el.checkVisibility()) continue;
        if (el.classList.contains("sr-only")) continue;
        if (el.scrollWidth > el.clientWidth + 1) {
          clipped.push(`${el.tagName} ${(el.textContent ?? "").trim().slice(0, 48)}`);
        }
      }

      return clipped;
    });

    expect(overflowed, path).toEqual([]);
  }
});
