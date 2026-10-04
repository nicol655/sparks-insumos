import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { DetailsAccordion } from "@/components/product/details-accordion";
import { catalogFor } from "@/fixtures/catalog";
import { expectNoA11yViolations } from "@/test/a11y";
import { renderWithIntl } from "@/test/i18n";

const product = catalogFor("es").find((item) => item.slug === "bharara-king")!;

const COPY = {
  es: {
    description: "Descripción",
    descriptionBody: "celofán",
    shipping: "Envíos y retiro",
    shippingBody: "Correo Argentino",
    returns: "Cambios y devoluciones",
    returnsBody: "10 días",
  },
  en: {
    description: "Description",
    descriptionBody: "cellophane-wrapped",
    shipping: "Shipping and pickup",
    shippingBody: "Correo Argentino",
    returns: "Exchanges and returns",
    returnsBody: "10 days",
  },
} as const;

describe("DetailsAccordion", () => {
  it("starts closed and opens the packaging copy, not the perfume description", async () => {
    renderWithIntl(<DetailsAccordion />);

    for (const name of ["Descripción", "Envíos y retiro", "Cambios y devoluciones"]) {
      expect(screen.getByRole("button", { name })).toHaveAttribute("aria-expanded", "false");
    }

    await userEvent.click(screen.getByRole("button", { name: "Descripción" }));

    const region = screen.getByRole("region", { name: "Descripción" });
    expect(region).toHaveTextContent(COPY.es.descriptionBody);
    expect(region).not.toHaveTextContent(product.description);
  });

  it.each(["es", "en"] as const)("uses the artifact copy in %s", async (locale) => {
    renderWithIntl(<DetailsAccordion />, { locale });
    const copy = COPY[locale];

    await userEvent.click(screen.getByRole("button", { name: copy.description }));
    await userEvent.click(screen.getByRole("button", { name: copy.shipping }));
    await userEvent.click(screen.getByRole("button", { name: copy.returns }));

    expect(screen.getByRole("region", { name: copy.description })).toHaveTextContent(
      copy.descriptionBody,
    );
    expect(screen.getByRole("region", { name: copy.shipping })).toHaveTextContent(copy.shippingBody);
    expect(screen.getByRole("region", { name: copy.returns })).toHaveTextContent(copy.returnsBody);
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<DetailsAccordion />);

    await expectNoA11yViolations(container);
  });
});
