import { screen } from "@testing-library/react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { ProductCrumb, ProductIntro } from "@/components/product/product-intro";
import { catalogFor } from "@/fixtures/catalog";
import { expectNoA11yViolations } from "@/test/a11y";
import { renderWithIntl } from "@/test/i18n";

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...rest
  }: {
    href: string | { pathname: string; params?: Record<string, string> };
    children: ReactNode;
  } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">) => {
    const resolved = typeof href === "string" ? href : href.pathname;
    return (
      <a href={resolved} {...rest}>
        {children}
      </a>
    );
  },
}));

const product = catalogFor("es").find((item) => item.slug === "bharara-king")!;

describe("ProductCrumb", () => {
  it("links home and catalogue and leaves the name as text", () => {
    renderWithIntl(<ProductCrumb name={product.name} />);

    expect(screen.getByRole("link", { name: "Inicio" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Catálogo" })).toHaveAttribute("href", "/catalogo");
    expect(screen.queryByRole("link", { name: product.name })).not.toBeInTheDocument();
    expect(screen.getByText(product.name)).toBeInTheDocument();
  });
});

describe("ProductIntro", () => {
  it("shows the name and the product description under one h1", () => {
    renderWithIntl(<ProductIntro product={product} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(product.name);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByText(product.description)).toBeInTheDocument();
  });

  it("joins brand and the translated family", () => {
    renderWithIntl(<ProductIntro product={product} />);

    const kicker = screen.getByText("Bharara · Ámbar & especias");
    expect(kicker.className).toContain("text-accent-gold");
    expect(kicker.className).toContain("text-[10px]");
  });

  it("drops an empty brand or an empty family", () => {
    const { rerender } = renderWithIntl(
      <ProductIntro product={{ ...product, brand: "", family: "ambar-especias" }} />,
    );

    expect(screen.getByText("Ámbar & especias")).toBeInTheDocument();
    expect(screen.queryByText(/·/)).not.toBeInTheDocument();

    rerender(<ProductIntro product={{ ...product, brand: "Bharara", family: "" }} />);

    expect(screen.getByText("Bharara")).toBeInTheDocument();
    expect(screen.queryByText(/·/)).not.toBeInTheDocument();
  });

  it("omits the kicker when brand and family are missing, and hides an unknown slug", () => {
    const { container, rerender } = renderWithIntl(
      <ProductIntro product={{ ...product, brand: "", family: "" }} />,
    );

    expect(container.querySelector(".text-accent-gold")).toBeNull();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(product.name);
    expect(screen.getByText(product.description)).toBeInTheDocument();

    rerender(<ProductIntro product={{ ...product, brand: "Bharara", family: "fresco" }} />);

    expect(screen.getByText("Bharara")).toBeInTheDocument();
    expect(screen.queryByText("fresco")).not.toBeInTheDocument();
    expect(screen.queryByText(/·/)).not.toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(
      <>
        <ProductCrumb name={product.name} />
        <ProductIntro product={product} />
      </>,
    );

    await expectNoA11yViolations(container);
  });
});
