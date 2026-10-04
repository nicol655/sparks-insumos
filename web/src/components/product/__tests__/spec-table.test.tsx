import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SpecTable } from "@/components/product/spec-table";
import { catalogFor } from "@/fixtures/catalog";
import { expectNoA11yViolations } from "@/test/a11y";
import { renderWithIntl } from "@/test/i18n";

const product = catalogFor("es").find((item) => item.slug === "bharara-king")!;

describe("SpecTable", () => {
  it("shows concentration and size, and nothing the API does not store", () => {
    renderWithIntl(<SpecTable product={product} />);

    expect(screen.getByText("Concentración")).toBeInTheDocument();
    expect(screen.getByText("Extrait de Parfum")).toBeInTheDocument();
    expect(screen.getByText("100 ml")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Ficha técnica" })).not.toBeInTheDocument();
    expect(screen.queryByText("Duración")).not.toBeInTheDocument();
    expect(screen.queryByText("Estela")).not.toBeInTheDocument();
    expect(screen.queryByText("Ocasión")).not.toBeInTheDocument();
    expect(screen.queryByText("SKU")).not.toBeInTheDocument();
    expect(screen.queryByText("Eau de parfum")).not.toBeInTheDocument();
  });

  it("renders nothing when concentration and size are empty", () => {
    const { container } = renderWithIntl(
      <SpecTable product={{ ...product, concentration: "", size: null }} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<SpecTable product={product} />);

    await expectNoA11yViolations(container);
  });
});
