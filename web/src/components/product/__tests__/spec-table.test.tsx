import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SpecTable } from "@/components/product/spec-table";
import { catalogFor } from "@/fixtures/catalog";
import { expectNoA11yViolations } from "@/test/a11y";
import { renderWithIntl } from "@/test/i18n";

const product = catalogFor("es").find((item) => item.slug === "bharara-king")!;

describe("SpecTable", () => {
  it("shows family, concentration and size", () => {
    renderWithIntl(<SpecTable product={product} />);

    expect(screen.getByRole("heading", { name: "Ficha técnica" })).toBeInTheDocument();
    expect(screen.getByText("Ámbar & especias")).toBeInTheDocument();
    expect(screen.getByText("Extrait de Parfum")).toBeInTheDocument();
    expect(screen.getByText("100 ml")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<SpecTable product={product} />);

    await expectNoA11yViolations(container);
  });
});
