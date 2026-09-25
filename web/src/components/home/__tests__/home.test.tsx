import { screen } from "@testing-library/react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { BrandMarquee } from "@/components/home/brand-marquee";
import { Club } from "@/components/home/club";
import { CommerceStrip } from "@/components/home/commerce-strip";
import { Featured } from "@/components/home/featured";
import { Hero } from "@/components/home/hero";
import { OlfactiveFamilies } from "@/components/home/olfactive-families";
import { catalogFor } from "@/fixtures/catalog";
import { expectNoA11yViolations } from "@/test/a11y";
import { renderWithIntl } from "@/test/i18n";

vi.mock("next/navigation", () => ({
  useParams: () => ({}),
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...rest
  }: {
    href: string | { pathname: string; query?: Record<string, string>; params?: Record<string, string> };
    children: ReactNode;
  } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">) => {
    const resolved =
      typeof href === "string"
        ? href
        : href.query
          ? `${href.pathname}?${new URLSearchParams(href.query).toString()}`
          : href.params
            ? href.pathname.replace("[slug]", href.params.slug ?? "")
            : href.pathname;
    return (
      <a href={resolved} {...rest}>
        {children}
      </a>
    );
  },
  usePathname: () => "/",
  useRouter: () => ({ replace: vi.fn() }),
}));

describe("Hero", () => {
  it("exposes a single h1, the catalogue CTA and the three stats", () => {
    const { container } = renderWithIntl(<Hero catalogSize={12} />);

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByText("Se recuerda.")).toHaveClass("text-accent-gold");
    expect(screen.getByRole("link", { name: "Ver catálogo" })).toHaveAttribute("href", "/catalogo");
    const whatsapp = screen.getByRole("link", { name: "Consultar por WhatsApp" });
    expect(whatsapp).toHaveAttribute("href", expect.stringMatching(/^https:\/\/wa\.me\/5491168692694/));
    expect(whatsapp.querySelector(".bg-success")).toBeTruthy();
    expect(screen.getByText("12+")).toBeInTheDocument();
    expect(screen.getByText("24 h")).toBeInTheDocument();

    const copy = container.querySelector("[data-home-hero] > div");
    const ctas = screen.getByRole("link", { name: "Ver catálogo" }).parentElement;
    const stats = screen.getByText("12+").closest("dl");
    expect(copy?.contains(ctas)).toBe(true);
    expect(copy?.contains(stats)).toBe(true);
    expect(copy?.contains(screen.getByRole("img", { name: "Eau de parfum · 100 ml" }))).toBe(
      false,
    );
    const rule = container.querySelector("[data-home-hero] [data-gold-rule]");
    expect(rule).toHaveClass("w-[34px]", "bg-accent-gold", "h-px");
    expect(container.querySelector("[data-home-hero] [role='img']")).toHaveClass("absolute");
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<Hero catalogSize={12} />);

    await expectNoA11yViolations(container);
  });
});

describe("BrandMarquee", () => {
  it("repeats the brand list so the CSS loop has no gap", () => {
    const { container } = renderWithIntl(<BrandMarquee brands={["Lattafa", "Rasasi"]} />);
    const items = container.querySelectorAll("[data-marquee] li");

    expect(items).toHaveLength(4);
    expect(container.querySelector("[data-home-marquee]")).toHaveClass("bg-surface-raised");
    expect(container.querySelector("[data-marquee]")).toBeInTheDocument();
    expect(items[0]).toHaveClass("font-display", "text-[22px]", "text-text-muted");
    expect(screen.getByText("Lattafa, Rasasi")).toHaveClass("sr-only");
  });
});

describe("OlfactiveFamilies", () => {
  it("renders known families as numbered links into the catalogue", () => {
    const { container } = renderWithIntl(
      <OlfactiveFamilies
        families={[
          { value: "gourmand", count: 3 },
          { value: "florales", count: 2 },
        ]}
      />,
    );

    expect(screen.getByRole("heading", { name: "Por familia olfativa" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Gourmand/ })).toHaveAttribute(
      "href",
      "/catalogo?family=gourmand",
    );
    expect(screen.getByText("01")).toHaveClass("text-accent-gold", "text-[10px]");
    expect(screen.getByText("Vainilla, café, pistacho, praliné.")).toBeInTheDocument();
    expect(screen.getByText("3 perfumes")).toBeInTheDocument();
    expect(container.querySelector("a")).toHaveClass("min-h-[250px]", "hover:bg-ink");
  });
});

describe("Featured", () => {
  it("uses the proto title and a view-all link into the catalogue", () => {
    const product = catalogFor("es").find((item) => item.stock > 0)!;
    renderWithIntl(<Featured products={[product]} />);

    expect(screen.getByRole("heading", { name: "Los más pedidos" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver todo" })).toHaveAttribute("href", "/catalogo");
    expect(screen.queryByText("Lo que más se está llevando")).not.toBeInTheDocument();
  });
});

describe("Club and commerce strip", () => {
  it("renders the clubhouse with a gold rule and the proto commerce cells", () => {
    const { container } = renderWithIntl(
      <>
        <Club />
        <CommerceStrip />
      </>,
    );

    expect(screen.queryByRole("heading", { name: "Asesoramiento real" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Envíos a todo el país" })).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Registrate y comprá distinto." }),
    ).toBeInTheDocument();
    expect(screen.getByText("Sparks Club")).toHaveClass("text-accent-gold", "text-[10px]");
    expect(screen.getByRole("link", { name: "Crear cuenta" })).toHaveAttribute("href", "/registro");
    expect(screen.getByRole("link", { name: "Ya tengo cuenta" })).toHaveAttribute(
      "href",
      "/ingresar",
    );
    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("Precio de socio")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Consultar por WhatsApp" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Todo el país" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Tarjeta, transferencia o efectivo" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Precio por cantidad" })).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(
      <>
        <Club />
        <CommerceStrip />
      </>,
    );

    await expectNoA11yViolations(container);
  });
});
