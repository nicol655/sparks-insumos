import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EmptyState } from "@/components/catalog/empty-state";
import { expectNoA11yViolations } from "@/test/a11y";
import { renderWithIntl } from "@/test/i18n";

describe("EmptyState", () => {
  it("offers a WhatsApp way out of an empty combination", () => {
    renderWithIntl(<EmptyState />);

    expect(screen.getByRole("heading", { name: "Nada con esa combinación" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Consultar por WhatsApp" })).toHaveAttribute(
      "href",
      expect.stringMatching(/^https:\/\/wa\.me\/5491168692694\?text=/),
    );
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<EmptyState />);

    await expectNoA11yViolations(container);
  });
});
