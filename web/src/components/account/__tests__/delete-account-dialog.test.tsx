import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AccountView } from "@/components/account/account-view";
import type { DeleteAccount } from "@/components/account/delete-account-dialog";
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

function view(action: DeleteAccount = vi.fn()) {
  return renderWithIntl(<AccountView user={USER} logout={vi.fn()} save={vi.fn()} remove={action} />);
}

describe("DeleteAccountDialog", () => {
  beforeEach(() => {
    useUiStore.setState({ overlay: null, toasts: [] });
  });

  it("asks for confirmation and calls the action", async () => {
    const remove = vi.fn<DeleteAccount>(async () => undefined);
    view(remove);

    await userEvent.click(screen.getByRole("button", { name: "Eliminar cuenta" }));
    expect(screen.getByRole("alertdialog", { name: "¿Eliminar tu cuenta?" })).toBeInTheDocument();
    expect(screen.getByText("Acción irreversible")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Sí, eliminar" }));

    expect(remove).toHaveBeenCalledWith("es");
  });

  it("keeps the dialog open and shows the failure above the confirm button", async () => {
    const remove = vi.fn<DeleteAccount>(async () => ({ ok: false, code: "delete_failed" }));
    view(remove);

    await userEvent.click(screen.getByRole("button", { name: "Eliminar cuenta" }));
    await userEvent.click(screen.getByRole("button", { name: "Sí, eliminar" }));

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("No pudimos eliminar la cuenta.");
    expect(alert.nextElementSibling).toContainElement(screen.getByRole("button", { name: "Sí, eliminar" }));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("cancels on Escape and returns focus to the trigger", async () => {
    useUiStore.setState({ overlay: "cart" });
    view();

    const trigger = screen.getByRole("button", { name: "Eliminar cuenta" });
    await userEvent.click(trigger);
    expect(useUiStore.getState().overlay).toBeNull();

    await userEvent.keyboard("{Escape}");

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("has no accessibility violations when open", async () => {
    const { container } = view();

    await userEvent.click(screen.getByRole("button", { name: "Eliminar cuenta" }));

    await expectNoA11yViolations(container);
  });
});
