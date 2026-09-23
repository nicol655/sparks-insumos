import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OlfactivePyramid } from "@/components/product/olfactive-pyramid";
import { catalogFor } from "@/fixtures/catalog";
import { expectNoA11yViolations } from "@/test/a11y";
import { renderWithIntl } from "@/test/i18n";

const product = catalogFor("es").find((item) => item.slug === "bharara-king")!;

describe("OlfactivePyramid", () => {
  it("lists top, heart and base notes", () => {
    renderWithIntl(<OlfactivePyramid product={product} />);

    expect(screen.getByRole("heading", { name: "Pirámide olfativa" })).toBeInTheDocument();
    expect(screen.getByText("Salida")).toBeInTheDocument();
    expect(screen.getByText("Bergamota · Manzana")).toBeInTheDocument();
    expect(screen.getByText("Canela · Jazmín")).toBeInTheDocument();
    expect(screen.getByText("Ámbar · Vainilla · Almizcle")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<OlfactivePyramid product={product} />);

    await expectNoA11yViolations(container);
  });
});
