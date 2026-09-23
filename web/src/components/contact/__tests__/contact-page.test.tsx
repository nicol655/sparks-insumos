import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ContactPage } from "@/components/contact/contact-page";
import { expectNoA11yViolations } from "@/test/a11y";
import { renderWithIntl } from "@/test/i18n";

describe("ContactPage", () => {
  it("exposes a single h1 and the prototype aside (AC-1, AC-3)", () => {
    const { container } = renderWithIntl(<ContactPage />);

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Escribinos.");
    expect(screen.getByText("Contacto")).toHaveClass("text-accent-gold", "text-[24px]");
    expect(screen.getByText("hola@sparksparfums.com")).toBeInTheDocument();
    expect(screen.getByText("+54 9 11 6869 2694")).toBeInTheDocument();
    expect(screen.getByText("Franklin, CABA")).toBeInTheDocument();
    expect(container.querySelector("main")).toHaveClass("lg:grid-cols-2");
  });

  it("points the ink panel at the business WhatsApp (AC-4)", () => {
    renderWithIntl(<ContactPage />);

    const panel = screen.getByRole("link", { name: /Consultas en el día/ });
    expect(panel).toHaveAttribute("href", expect.stringMatching(/^https:\/\/wa\.me\/5491168692694/));
    expect(panel.querySelector(".bg-success")).toBeTruthy();
  });

  it("translates the page in English", () => {
    renderWithIntl(<ContactPage />, { locale: "en" });

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Write to us.");
    expect(screen.getByRole("button", { name: "Send message" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Same-day answers/ })).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<ContactPage />);

    await expectNoA11yViolations(container);
  });
});
