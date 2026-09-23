import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DetailsAccordion } from "@/components/product/details-accordion";
import { catalogFor } from "@/fixtures/catalog";
import { expectNoA11yViolations } from "@/test/a11y";
import { renderWithIntl } from "@/test/i18n";

const product = catalogFor("es").find((item) => item.slug === "bharara-king")!;

describe("DetailsAccordion", () => {
  it("opens the description and keeps shipping and returns closed", () => {
    renderWithIntl(<DetailsAccordion product={product} />);

    expect(screen.getByRole("region", { name: "Descripción" })).toHaveTextContent(
      product.description,
    );
    expect(screen.getByRole("button", { name: "Envíos" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.getByRole("button", { name: "Devoluciones" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<DetailsAccordion product={product} />);

    await expectNoA11yViolations(container);
  });
});
