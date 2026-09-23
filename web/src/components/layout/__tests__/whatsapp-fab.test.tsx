import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { WhatsappFab } from "@/components/layout/whatsapp-fab";
import { useUiStore } from "@/lib/ui/store";
import { expectNoA11yViolations } from "@/test/a11y";
import { renderWithIntl } from "@/test/i18n";

beforeEach(() => {
  useUiStore.setState({ overlay: null });
});

describe("WhatsappFab", () => {
  it("points at the business number with the general enquiry preloaded", () => {
    renderWithIntl(<WhatsappFab />);

    const fab = screen.getByRole("link", { name: "Consultar por WhatsApp" });

    expect(fab).toHaveAttribute(
      "href",
      "https://wa.me/5491168692694?text=Hola%20Sparks%2C%20quer%C3%ADa%20hacer%20una%20consulta.",
    );
    expect(fab.className).toContain("border-canvas/20");
  });

  it("hides while an overlay is open", () => {
    useUiStore.setState({ overlay: "menu" });
    renderWithIntl(<WhatsappFab />);

    expect(screen.queryByRole("link", { name: "Consultar por WhatsApp" })).not.toBeInTheDocument();
  });

  it("translates the accessible name", () => {
    renderWithIntl(<WhatsappFab />, { locale: "en" });

    expect(screen.getByRole("link", { name: "Ask on WhatsApp" })).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<WhatsappFab />);

    await expectNoA11yViolations(container);
  });
});
