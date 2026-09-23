import { expect, test } from "@playwright/test";

test("the brand marquee stops when reduced motion is requested (AC-16)", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-360", "motion preference is not viewport-specific");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/es");

  const marquee = page.locator("[data-marquee]");
  await expect(marquee).toBeVisible();

  const motion = await marquee.evaluate((node) => {
    const style = getComputedStyle(node);
    return { name: style.animationName, transform: style.transform };
  });
  expect(["none", ""].includes(motion.name)).toBe(true);
  expect(motion.transform).toBe("none");
});
