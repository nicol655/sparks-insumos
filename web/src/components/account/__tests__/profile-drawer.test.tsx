import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AccountView } from "@/components/account/account-view";
import type { SaveProfile } from "@/components/account/profile-drawer";
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

function view(save: SaveProfile = vi.fn()) {
  return renderWithIntl(<AccountView user={USER} logout={vi.fn()} save={save} />);
}

describe("ProfileDrawer", () => {
  beforeEach(() => {
    useUiStore.setState({ overlay: null, toasts: [] });
  });

  it("refuses a filled password without calling the action", async () => {
    const save = vi.fn<SaveProfile>();
    view(save);

    await userEvent.click(screen.getByRole("button", { name: "Editar perfil" }));
    await userEvent.type(screen.getByLabelText("Contraseña"), "Sparks1!");
    await userEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("La contraseña no se cambia desde acá.");
    expect(alert.nextElementSibling).toContainElement(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(save).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("saves the four fields, closes, and paints the returned shopper", async () => {
    const next = { ...USER, first_name: "Ana", email: "ana@example.com" };
    const save = vi.fn<SaveProfile>(async () => ({ ok: true, user: next }));
    view(save);

    await userEvent.click(screen.getByRole("button", { name: "Editar perfil" }));
    const first = screen.getByLabelText("Nombre");
    await userEvent.clear(first);
    await userEvent.type(first, "Ana");
    const email = screen.getByLabelText("Email");
    await userEvent.clear(email);
    await userEvent.type(email, "ana@example.com");
    await userEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(save).toHaveBeenCalledWith({
      firstName: "Ana",
      lastName: "Ferrari",
      email: "ana@example.com",
      phone: "+5491168692694",
      password: "",
      locale: "es",
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Hola, Ana" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Editar perfil" }));
    expect(screen.getByDisplayValue("ana@example.com")).toBeInTheDocument();
  });

  it("keeps the drawer open when the email is taken", async () => {
    const save = vi.fn<SaveProfile>(async () => ({ ok: false, code: "email_taken" }));
    view(save);

    await userEvent.click(screen.getByRole("button", { name: "Editar perfil" }));
    await userEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Ese correo ya está registrado.");
  });

  it("closes on Escape, returns focus, and drops any other overlay", async () => {
    useUiStore.setState({ overlay: "cart" });
    view();

    const edit = screen.getByRole("button", { name: "Editar perfil" });
    await userEvent.click(edit);

    expect(useUiStore.getState().overlay).toBeNull();
    expect(screen.getByRole("dialog", { name: "Tus datos" })).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(edit).toHaveFocus();
  });

  it("closes from the backdrop", async () => {
    const { container } = view();

    await userEvent.click(screen.getByRole("button", { name: "Editar perfil" }));
    const backdrop = container.querySelector("[aria-hidden='true']");
    expect(backdrop).not.toBeNull();
    await userEvent.click(backdrop!);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("has no accessibility violations when open", async () => {
    const { container } = view();

    await userEvent.click(screen.getByRole("button", { name: "Editar perfil" }));

    await expectNoA11yViolations(container);
  });
});
