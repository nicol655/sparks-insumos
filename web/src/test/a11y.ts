import axe, { type ElementContext, type Result, type RunOptions } from "axe-core";
import { expect } from "vitest";

/**
 * Component-level accessibility assertion (AC-13).
 *
 * axe-core is driven directly rather than through a matcher library: the
 * available Vitest wrappers still augment the legacy `Vi` global namespace,
 * which Vitest 5 no longer reads. See ADR-0005.
 */
export async function expectNoA11yViolations(
  context: ElementContext,
  options: RunOptions = {},
): Promise<void> {
  const { violations } = await axe.run(context, {
    // Colour contrast needs real layout, which jsdom does not provide.
    // It is covered end-to-end by @axe-core/playwright instead.
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
      return `[${violation.impact ?? "unknown"}] ${violation.id}: ${violation.help}\n  at ${targets}\n  ${violation.helpUrl}`;
    })
    .join("\n\n");
}
