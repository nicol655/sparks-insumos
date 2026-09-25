import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { RegisterForm, type RegisterAction } from "@/components/auth/register-form";
import { expectNoA11yViolations } from "@/test/a11y";
import { renderWithIntl } from "@/test/i18n";

const VALID = {
  firstName: "Camila",
  lastName: "Ferrari",
  email: "camila@mail.com",
  phone: "+5491168692694",
  password: "Sparks1!",
};

async function fill(values: Partial<typeof VALID> = VALID) {
  const fields: Array<[string, keyof typeof VALID]> = [
    ["Nombre", "firstName"],
    ["Apellido", "lastName"],
    ["Email", "email"],
    ["Teléfono / WhatsApp", "phone"],
    ["Contraseña", "password"],
  ];
  for (const [label, key] of fields) {
    const value = values[key];
    if (value) await userEvent.type(screen.getByLabelText(label), value);
  }
  await userEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));
}

function alertAboveButton() {
  const alert = screen.getByRole("alert");
  expect(alert.nextElementSibling).toContainElement(screen.getByRole("button", { name: "Crear cuenta" }));
  return alert;
}

describe("RegisterForm", () => {
  it("rejects an empty name, a short phone and a weak password without calling the action", async () => {
    const action = vi.fn<RegisterAction>();

    renderWithIntl(<RegisterForm action={action} />);
    await fill({ ...VALID, firstName: "" });
    expect(alertAboveButton()).toHaveTextContent(
      "El nombre es obligatorio y tiene hasta 80 caracteres.",
    );

    cleanup();
    renderWithIntl(<RegisterForm action={action} />);
    await fill({ ...VALID, phone: "11" });
    expect(alertAboveButton()).toHaveTextContent(
      "El teléfono tiene que empezar con + y tener entre 6 y 32 caracteres.",
    );

    cleanup();
    renderWithIntl(<RegisterForm action={action} />);
    await fill({ ...VALID, password: "admin123456" });
    expect(alertAboveButton()).toHaveTextContent("sin espacios");
    expect(action).not.toHaveBeenCalled();
  });

  it("shows the taken-email sentence and stays on the form", async () => {
    const action = vi.fn<RegisterAction>(async () => ({ ok: false, code: "email_taken" }));
    renderWithIntl(<RegisterForm action={action} />);

    await fill();

    expect(alertAboveButton()).toHaveTextContent("Ese correo ya está registrado.");
    expect(screen.getByRole("button", { name: "Crear cuenta" })).toBeInTheDocument();
  });

  it("calls the action with the five fields when they are valid", async () => {
    const action = vi.fn<RegisterAction>(async () => undefined);
    renderWithIntl(<RegisterForm action={action} />);

    await fill();

    expect(action).toHaveBeenCalledWith({ ...VALID, locale: "es" });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<RegisterForm action={async () => undefined} />);

    await expectNoA11yViolations(container);
  });
});
