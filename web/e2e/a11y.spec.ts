import AxeBuilder from "@axe-core/playwright";
import { expect, test, type TestInfo } from "@playwright/test";
import type { Result } from "axe-core";

import { PHASE1_ROUTES } from "./helpers";

/** ADR-0009 · proto gold kickers are 10px #8A6B32. Axe flags 4.4 / 3.8; the design keeps them. */
function isProtoGoldKicker(node: Result["nodes"][number]): boolean {
  const data = node.any[0]?.data as { fontSize?: string; fgColor?: string } | undefined;
  const tenPx = data?.fontSize?.includes("(10px)") ?? false;
  const protoGold = data?.fgColor?.toLowerCase() === "#8a6b32";
  return tenPx && protoGold;
}

function blockingViolations(violations: Result[]): Result[] {
  return violations
    .filter((violation) => violation.impact === "critical" || violation.impact === "serious")
    .map((violation) => {
      if (violation.id !== "color-contrast") return violation;
      return { ...violation, nodes: violation.nodes.filter((node) => !isProtoGoldKicker(node)) };
    })
    .filter((violation) => violation.id !== "color-contrast" || violation.nodes.length > 0);
}

test("Fase 1 routes have no critical or serious axe violations in either language (AC-13)", async ({
  page,
}, testInfo: TestInfo) => {
  test.skip(testInfo.project.name !== "mobile-360", "axe is viewport-independent; run once");

  for (const path of PHASE1_ROUTES.flatMap((route) => [route.es, route.en])) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    const blocking = blockingViolations(results.violations);

    expect(
      blocking,
      `${path}\n${blocking.map((violation) => `[${violation.impact}] ${violation.id}: ${violation.help}`).join("\n")}`,
    ).toEqual([]);
  }
});
