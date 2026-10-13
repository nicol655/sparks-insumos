import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { UsersScreen } from "@/components/users/users-screen";
import { useSessionStore } from "@/lib/auth/session-store";
import type { Account } from "@/lib/users/contract";
import type { UsersClient } from "@/lib/users/client";
import {
  CREATED_TOAST,
  DELETE_UNAVAILABLE,
  EMPTY_CLIENTS,
  EMPTY_TEAM,
  FILTER_EMPTY,
  UPDATED_TOAST,
} from "@/lib/users/labels";

const replace = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
}));

const stamp = "2026-09-28T12:00:00Z";

function account(overrides: Partial<Account> = {}): Account {
  return {
    id: "22222222-2222-4222-8222-222222222222",
    first_name: "Ana",
    last_name: "Pérez",
    email: "ana@example.com",
    phone: "+5491168692694",
    active: true,
    must_change_password: false,
    is_super_admin: false,
    terms_accepted_at: stamp,
    created_at: stamp,
    updated_at: stamp,
    role_id: "11111111-1111-4111-8111-111111111111",
    role: "customer",
    ...overrides,
  };
}

function client(partial: Partial<UsersClient> = {}): UsersClient {
  return {
    listUsers: vi.fn().mockResolvedValue({ ok: true, users: [] }),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    ...partial,
  };
}

async function fillCreate(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Nombre"), "Luis");
  await user.type(screen.getByLabelText("Apellido"), "Gómez");
  await user.type(screen.getByLabelText("Email"), "luis@example.com");
  await user.type(screen.getByLabelText("Teléfono / WhatsApp"), "+5491111111111");
  await user.type(screen.getByLabelText("Nueva contraseña"), "Sparks1!");
}

describe("users screen", () => {
  beforeEach(() => {
    replace.mockReset();
    useSessionStore.setState({ accessToken: "tok", mustChangePassword: false, hydrated: true });
  });

  it("lists accounts through /api/users", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
    vi.stubGlobal("fetch", fetchImpl);
    try {
      render(<UsersScreen />);
      await waitFor(() => expect(fetchImpl).toHaveBeenCalled());
      expect(fetchImpl.mock.calls[0]?.[0]).toBe("/api/users");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("shows both tabs, an empty client list and an empty team", async () => {
    const user = userEvent.setup();
    render(<UsersScreen client={client()} />);

    expect(await screen.findByText(EMPTY_CLIENTS)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Usuarios" })).toBeInTheDocument();
    expect(screen.getByText("0 clientes · 0 socios del club")).toBeInTheDocument();
    expect(screen.queryByText("Martina Álvarez")).not.toBeInTheDocument();
    expect(screen.queryByText("Permisos por rol")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Clientes/ })).toHaveClass("cursor-pointer");
    expect(screen.getByRole("button", { name: /Roles/ })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Equipo/ }));
    expect(screen.getByText(EMPTY_TEAM)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Equipo/ })).toHaveTextContent("0");
    expect(screen.queryByRole("button", { name: "Nuevo cliente" })).not.toBeInTheDocument();
    expect(screen.queryByText("Permisos por rol")).not.toBeInTheDocument();
  });

  it("renders a client row and leaves club and guest filters empty", async () => {
    const user = userEvent.setup();
    render(
      <UsersScreen
        client={client({
          listUsers: vi.fn().mockResolvedValue({
            ok: true,
            users: [account(), account({ id: "33333333-3333-4333-8333-333333333333", active: false, first_name: "Luis", last_name: "Gómez", email: "luis@example.com" })],
          }),
        })}
      />,
    );

    const row = await screen.findByRole("button", { name: /Ana Pérez/ });
    expect(row).toHaveClass("cursor-pointer");
    expect(row).toHaveClass("hover:bg-[rgba(20,16,14,0.03)]");
    expect(within(row).getByText("AP")).toBeInTheDocument();
    expect(within(row).getByText("ana@example.com")).toBeInTheDocument();
    expect(within(row).getByText("+5491168692694")).toBeInTheDocument();
    expect(within(row).getByText("28/09/2026")).toBeInTheDocument();
    expect(within(row).getByText("Activa")).toBeInTheDocument();
    expect(within(row).getAllByText("—").length).toBeGreaterThanOrEqual(3);
    expect(screen.getByText("2 CLIENTES · — HISTÓRICO")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Todos" })).toHaveClass("cursor-pointer");
    expect(screen.getByPlaceholderText("Buscar por nombre, email o teléfono")).not.toHaveClass("cursor-pointer");

    await user.click(screen.getByRole("button", { name: "Sparks Club" }));
    expect(screen.getByText(FILTER_EMPTY)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Invitados" }));
    expect(screen.getByText(FILTER_EMPTY)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Bloqueados" }));
    expect(screen.getByRole("button", { name: /Luis Gómez/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Ana Pérez/ })).not.toBeInTheDocument();
    expect(within(screen.getByRole("button", { name: /Luis Gómez/ })).getByText("Bloqueada")).toBeInTheDocument();
  });

  it("drops the session when the list answers 401", async () => {
    render(
      <UsersScreen
        client={client({
          listUsers: vi.fn().mockResolvedValue({ ok: false, status: 401, detail: "Tenés que iniciar sesión." }),
        })}
      />,
    );

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/login");
    });
    expect(useSessionStore.getState().accessToken).toBeNull();
  });

  it("creates a client from the drawer and keeps a 409 open", async () => {
    const user = userEvent.setup();
    const createUser = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 409, detail: "Ese correo ya está registrado." })
      .mockResolvedValueOnce({
        ok: true,
        user: account({ first_name: "Luis", last_name: "Gómez", email: "luis@example.com" }),
      });
    render(<UsersScreen client={client({ createUser })} />);

    await user.click(await screen.findByRole("button", { name: "Nuevo cliente" }));
    const drawer = await screen.findByRole("dialog");
    expect(drawer).toHaveClass("animate-slide-in");
    expect(drawer).toHaveClass("motion-reduce:animate-none");
    expect(within(drawer).getByText("Nuevo cliente")).toBeInTheDocument();
    expect(within(drawer).getByText("Sin nombre")).toBeInTheDocument();
    expect(within(drawer).queryByText("Zona sensible")).not.toBeInTheDocument();
    expect(within(drawer).getByRole("button", { name: "Crear cliente" })).toHaveClass("hover:bg-accent-gold");
    expect(within(drawer).getByRole("button", { name: "Crear cliente" })).toHaveClass("cursor-pointer");
    expect(within(drawer).getByRole("button", { name: "Cerrar" })).toHaveClass("cursor-pointer");

    await user.click(within(drawer).getByRole("button", { name: "Crear cliente" }));
    expect(createUser).not.toHaveBeenCalled();
    expect(within(drawer).getByRole("alert")).toHaveTextContent("Completá el nombre.");

    await fillCreate(user);
    await user.click(within(drawer).getByRole("button", { name: "Crear cliente" }));
    await waitFor(() => {
      expect(within(drawer).getByRole("alert")).toHaveTextContent("Ese correo ya está registrado.");
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(within(drawer).getByRole("button", { name: "Crear cliente" }));
    expect(await screen.findByRole("status")).toHaveTextContent(CREATED_TOAST);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Luis Gómez/ })).toBeInTheDocument();
    const sent = createUser.mock.calls[0]?.[0];
    expect(sent).not.toHaveProperty("tier");
    expect(sent).not.toHaveProperty("notes");
    expect(createUser.mock.calls[0]?.[0]).toMatchObject({ email: "luis@example.com", password: "Sparks1!" });
  });

  it("patches a row without password, tier or notes", async () => {
    const user = userEvent.setup();
    const updateUser = vi.fn().mockResolvedValue({
      ok: true,
      user: account({ first_name: "Lucía" }),
    });
    render(<UsersScreen client={client({ listUsers: vi.fn().mockResolvedValue({ ok: true, users: [account()] }), updateUser })} />);

    await user.click(await screen.findByRole("button", { name: /Ana Pérez/ }));
    const drawer = await screen.findByRole("dialog");
    expect(within(drawer).getByText("Cliente · alta 28/09/2026")).toBeInTheDocument();
    expect(within(drawer).getByText("Ticket medio")).toBeInTheDocument();
    expect(within(drawer).getAllByText("—").length).toBeGreaterThanOrEqual(3);
    expect(within(drawer).getByLabelText("Email")).toHaveValue("ana@example.com");
    expect(within(drawer).getByText("Vacío para mantener la actual.")).toBeInTheDocument();

    await user.clear(within(drawer).getByLabelText("Nombre"));
    await user.type(within(drawer).getByLabelText("Nombre"), "Lucía");
    await user.click(within(drawer).getByRole("button", { name: "Guardar" }));

    await screen.findByRole("status");
    expect(screen.getByRole("status")).toHaveTextContent(UPDATED_TOAST);
    const body = updateUser.mock.calls[0]?.[1];
    expect(updateUser.mock.calls[0]?.[0]).toBe(account().id);
    expect(body).toMatchObject({ first_name: "Lucía", active: true });
    expect(body).not.toHaveProperty("password");
    expect(body).not.toHaveProperty("tier");
    expect(body).not.toHaveProperty("notes");
  });

  it("blocks only when the drawer is saved", async () => {
    const user = userEvent.setup();
    const updateUser = vi.fn().mockResolvedValue({ ok: true, user: account({ active: false }) });
    render(<UsersScreen client={client({ listUsers: vi.fn().mockResolvedValue({ ok: true, users: [account()] }), updateUser })} />);

    await user.click(await screen.findByRole("button", { name: /Ana Pérez/ }));
    const drawer = await screen.findByRole("dialog");
    await user.click(within(drawer).getByRole("button", { name: "Bloquear" }));
    expect(updateUser).not.toHaveBeenCalled();
    expect(within(drawer).getByLabelText("Estado")).toHaveValue("bloqueada");
    expect(within(drawer).getByRole("button", { name: "Guardar" })).toHaveClass("hover:bg-accent-gold");
    expect(within(drawer).queryByRole("button", { name: /^Bloquear$/ })).not.toBeInTheDocument();
    expect(within(drawer).getByRole("button", { name: /^Desbloquear$/ })).toHaveClass("cursor-pointer");

    await user.click(within(drawer).getByRole("button", { name: "Guardar" }));
    await screen.findByRole("status");
    expect(updateUser.mock.calls[0]?.[1]).toMatchObject({ active: false });
  });

  it("does not delete the row from the confirm dialog", async () => {
    const user = userEvent.setup();
    const updateUser = vi.fn();
    render(<UsersScreen client={client({ listUsers: vi.fn().mockResolvedValue({ ok: true, users: [account()] }), updateUser })} />);

    await user.click(await screen.findByRole("button", { name: /Ana Pérez/ }));
    const drawer = await screen.findByRole("dialog");
    const remove = within(drawer).getByRole("button", { name: "Eliminar cuenta" });
    expect(remove).toHaveClass("cursor-pointer");
    expect(remove).toHaveClass("hover:bg-[#B4443A]");
    await user.click(remove);

    const confirm = await screen.findByRole("alertdialog");
    expect(confirm).toHaveClass("animate-fade-up");
    expect(confirm).toHaveClass("motion-reduce:animate-none");
    expect(within(confirm).getByText("¿Eliminar a Ana Pérez?")).toBeInTheDocument();
    await user.click(within(confirm).getByRole("button", { name: "Sí, eliminar" }));

    expect(updateUser).not.toHaveBeenCalled();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(DELETE_UNAVAILABLE);
    expect(screen.queryByText("Cliente eliminado")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Ana Pérez/ })).toBeInTheDocument();
  });
});
