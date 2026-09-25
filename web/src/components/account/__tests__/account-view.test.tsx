import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AccountView } from "@/components/account/account-view";
import type { UserPublic } from "@/lib/auth/contract";
import { expectNoA11yViolations } from "@/test/a11y";
import { renderWithIntl } from "@/test/i18n";
import { useUiStore } from "@/lib/ui/store";

const USER: UserPublic = {
  id: "6b1e2c3d-4a5f-4b6c-8d7e-9f0a1b2c3d4e",
  first_name: "Camila",
  last_name: "Ferrari",
  email: "camila@mail.com",
  phone: "+5491168692694",
  active: true,
  must_change_password: false,
  terms_accepted_at: "2026-09-25T12:00:00Z",
  created_at: "2026-09-25T12:00:00Z",
  updated_at: "2026-09-25T12:00:00Z",
};

function renderAccount() {
  return renderWithIntl(
    <AccountView user={USER} logout={vi.fn()} save={vi.fn()} remove={vi.fn()} />,
  );
}

describe("AccountView", () => {
  beforeEach(() => {
    useUiStore.setState({ overlay: null, toasts: [] });
  });

  it("shows the prototype cards as a hyphen and an empty order list", () => {
    renderAccount();

    expect(screen.getByRole("main").className).toContain(
      "w-[min(100%,max(1180px,calc(62vw+128px)))]",
    );
    expect(screen.getByText("Socia desde 2026")).toBeInTheDocument();
    expect(screen.getByText("Nivel")).toBeInTheDocument();
    expect(screen.getByText("Cupón activo")).toBeInTheDocument();
    expect(screen.getByText("Pedidos")).toBeInTheDocument();
    expect(screen.getAllByText("-")).toHaveLength(3);
    expect(screen.getByText("Descuento aplicado automáticamente.")).toBeInTheDocument();
    expect(screen.getByText("Acumulable con promos vigentes.")).toBeInTheDocument();
    expect(screen.getByText("Desde marzo de 2024.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Tus pedidos" })).toBeInTheDocument();
    const empty = screen.getByText("Todavía no tenés pedidos.");
    expect(empty.className).toContain("text-[13.5px]");
    expect(empty.className).toContain("text-left");
    expect(empty.className).toContain("py-[18px]");
    expect(empty.className).toContain("not-italic");
    expect(empty.className.split(/\s+/)).not.toContain("italic");
    expect(empty.className).not.toContain("text-center");
    expect(screen.queryByText("camila@mail.com")).not.toBeInTheDocument();
    expect(screen.queryByText("+5491168692694")).not.toBeInTheDocument();
    expect(screen.queryByText("Club 5%")).not.toBeInTheDocument();
    expect(screen.queryByText("VIP15")).not.toBeInTheDocument();
    expect(screen.queryByText("07")).not.toBeInTheDocument();
    expect(screen.queryByText(/SP-/)).not.toBeInTheDocument();
  });

  it("translates the cards and the empty order list", () => {
    renderWithIntl(<AccountView user={USER} logout={vi.fn()} save={vi.fn()} remove={vi.fn()} />, {
      locale: "en",
    });

    expect(screen.getByRole("heading", { level: 1, name: "Hello, Camila" })).toBeInTheDocument();
    expect(screen.getByText("Member since 2026")).toBeInTheDocument();
    expect(screen.getByText("Tier")).toBeInTheDocument();
    expect(screen.getByText("Active coupon")).toBeInTheDocument();
    expect(screen.getByText("Orders")).toBeInTheDocument();
    expect(screen.getAllByText("-")).toHaveLength(3);
    expect(screen.getByRole("heading", { level: 2, name: "Your orders" })).toBeInTheDocument();
    expect(screen.getByText("You do not have any orders yet.")).toBeInTheDocument();
  });

  it("keeps edit, sign-out and delete at the prototype size", async () => {
    const logout = vi.fn(async () => undefined);
    renderWithIntl(<AccountView user={USER} logout={logout} save={vi.fn()} remove={vi.fn()} />);

    for (const name of ["Editar perfil", "Salir", "Eliminar cuenta"]) {
      const className = screen.getByRole("button", { name }).className;
      expect(className).toContain("py-[13px]");
      expect(className).toContain("px-[22px]");
      expect(className).toContain("text-[11px]");
      expect(className).not.toContain("min-h-");
    }

    await userEvent.click(screen.getByRole("button", { name: "Editar perfil" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByDisplayValue("camila@mail.com")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Salir" }));
    expect(logout).toHaveBeenCalledWith("es");

    await userEvent.click(screen.getByRole("button", { name: "Eliminar cuenta" }));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("locks the account when a password change is required", () => {
    renderWithIntl(<AccountView user={null} notice="locked" logout={vi.fn()} />);

    expect(screen.getByRole("heading", { level: 1, name: "Hola." })).toBeInTheDocument();
    expect(
      screen.getByText(
        "El usuario es correcto, pero no podés usar la cuenta hasta cambiar la contraseña.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salir" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Editar perfil" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Eliminar cuenta" })).not.toBeInTheDocument();
    expect(screen.queryByText("Nivel")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Tus pedidos" })).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("hides cards and orders when the account cannot be loaded", () => {
    renderWithIntl(<AccountView user={null} notice="unavailable" logout={vi.fn()} />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "No pudimos cargar tu cuenta. Intentá de nuevo.",
    );
    expect(screen.queryByText("Nivel")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Tus pedidos" })).not.toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderAccount();

    await expectNoA11yViolations(container);
  });
});
