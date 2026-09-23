import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ContactForm } from "@/components/contact/contact-form";
import { expectNoA11yViolations } from "@/test/a11y";
import { renderWithIntl } from "@/test/i18n";

describe("ContactForm", () => {
  it("exposes the four fields, the message box and the send button", () => {
    renderWithIntl(<ContactForm />);

    expect(screen.getByLabelText("Nombre")).toBeInstanceOf(HTMLInputElement);
    expect(screen.getByLabelText("Teléfono / WhatsApp")).toHaveAttribute("type", "tel");
    expect(screen.getByLabelText("Email")).toHaveAttribute("type", "email");
    expect(screen.getByLabelText("Asunto")).toBeInTheDocument();
    expect(screen.getByLabelText("Mensaje")).toBeInstanceOf(HTMLTextAreaElement);
    expect(screen.getByRole("button", { name: "Enviar mensaje" })).toHaveAttribute("type", "submit");
  });

  it("does not send or toast when the form is submitted", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    renderWithIntl(<ContactForm />);

    await userEvent.type(screen.getByLabelText("Nombre"), "Camila");
    await userEvent.click(screen.getByRole("button", { name: "Enviar mensaje" }));

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    fetchSpy.mockRestore();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<ContactForm />);

    await expectNoA11yViolations(container);
  });
});
