import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { expectNoA11yViolations } from "@/test/a11y";

/**
 * Smoke test for the test harness itself: React rendering, jest-dom matchers
 * and the axe helper must all be wired before any feature test is written.
 */
describe("test harness", () => {
  it("renders a component and applies jest-dom matchers", () => {
    render(<button type="button">Ver catálogo</button>);

    expect(screen.getByRole("button", { name: "Ver catálogo" })).toBeInTheDocument();
  });

  it("runs the accessibility helper against rendered markup", async () => {
    const { container } = render(
      <main>
        <h1>Sparks Parfums</h1>
      </main>,
    );

    await expectNoA11yViolations(container);
  });
});
