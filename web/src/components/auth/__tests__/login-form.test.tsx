import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { LoginForm, type LoginAction } from "@/components/auth/login-form";
import { renderWithIntl } from "@/test/i18n";

const NEXT = "/es/catalogo?q=oud";

async function submit(email = "camila@mail.com", password = "Sparks1!") {
  await userEvent.type(screen.getByLabelText("Email"), email);
  await userEvent.type(screen.getByLabelText("Contraseña"), password);
  await userEvent.click(screen.getByRole("button", { name: "Ingresar" }));
}

describe("LoginForm", () => {
  it("shows the credentials sentence above the button and does not navigate", async () => {
    const action = vi.fn<LoginAction>(async () => ({ ok: false, code: "invalid_credentials" }));
    renderWithIntl(<LoginForm next={NEXT} action={action} />);

    await submit();

    const alert = screen.getByRole("alert");
    const button = screen.getByRole("button", { name: "Ingresar" });
    expect(alert).toHaveTextContent("Los datos introducidos son incorrectos");
    expect(alert.nextElementSibling).toContainElement(button);
    expect(action).toHaveBeenCalledWith({
      email: "camila@mail.com",
      password: "Sparks1!",
      next: NEXT,
      locale: "es",
    });
    expect(screen.getByRole("button", { name: "Ingresar" })).toBeInTheDocument();
  });

  it("uses the generic failure copy for any other code", async () => {
    const action = vi.fn<LoginAction>(async () => ({ ok: false, code: "unavailable" }));
    renderWithIntl(<LoginForm next={null} action={action} />);

    await submit();

    expect(screen.getByRole("alert")).toHaveTextContent("No pudimos iniciar sesión. Intentá de nuevo.");
    expect(screen.queryByText("Los datos introducidos son incorrectos")).not.toBeInTheDocument();
  });

  it("calls the action with email, password and next when sign-in succeeds", async () => {
    const action = vi.fn<LoginAction>(async () => undefined);
    renderWithIntl(<LoginForm next={NEXT} action={action} />);

    await submit("Camila@Mail.com", "Sparks1!");

    expect(action).toHaveBeenCalledWith({
      email: "Camila@Mail.com",
      password: "Sparks1!",
      next: NEXT,
      locale: "es",
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
