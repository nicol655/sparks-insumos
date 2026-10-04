import axe, { type ElementContext, type Result, type RunOptions } from "axe-core";
import { expect } from "vitest";

export async function expectNoA11yViolations(
  context: ElementContext,
  options: RunOptions = {},
): Promise<void> {
  const { violations } = await axe.run(context, {
    rules: { "color-contrast": { enabled: false } },
    ...options,
  });

  expect(violations, describeViolations(violations)).toEqual([]);
}

function describeViolations(violations: Result[]): string {
  if (violations.length === 0) return "No accessibility violations";

  return violations
    .map((violation) => {
      const targets = violation.nodes.map((node) => node.target.join(" ")).join(", ");
      return `[${violation.impact ?? "unknown"}] ${violation.id}: ${violation.help}\n  at ${targets}`;
    })
    .join("\n\n");
}
