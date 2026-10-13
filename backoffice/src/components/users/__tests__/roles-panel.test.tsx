import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RolesPanel } from "@/components/users/roles-panel";
import { useSessionStore } from "@/lib/auth/session-store";
import type { PermissionRow, RoleStatistics } from "@/lib/roles/contract";
import type { RolesClient } from "@/lib/roles/client";

const replace = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
}));

const stamp = "2026-10-06T12:00:00Z";

function role(overrides: Partial<RoleStatistics> = {}): RoleStatistics {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    slug: "ops",
    name: "Operaciones",
    created_at: stamp,
    updated_at: stamp,
    permission_ids: ["22222222-2222-4222-8222-222222222222"],
    permissions_count: 1,
    users_count: 2,
    locked: false,
    has_backoffice_access: false,
    ...overrides,
  };
}

function permission(overrides: Partial<PermissionRow> = {}): PermissionRow {
  return {
    id: "22222222-2222-4222-8222-222222222222",
    controller: "products",
    method: "list",
    created_at: stamp,
    updated_at: stamp,
    ...overrides,
  };
}

function client(partial: Partial<RolesClient> = {}): RolesClient {
  return {
    listStatistics: vi.fn(async () => ({ ok: true as const, roles: [role(), role({
      id: "33333333-3333-4333-8333-333333333333",
      slug: "admin",
      name: "Administrador",
      locked: true,
      has_backoffice_access: true,
      permission_ids: [],
      permissions_count: 0,
      users_count: 1,
    })] })),
    listPermissions: vi.fn(async () => ({ ok: true as const, permissions: [permission()] })),
    createRole: vi.fn(async () => ({ ok: true as const, role: {
      id: "44444444-4444-4444-8444-444444444444",
      slug: "nuevo",
      name: "Nuevo",
      created_at: stamp,
      updated_at: stamp,
      permission_ids: [],
    } })),
    updateRole: vi.fn(async () => ({ ok: true as const, role: {
      id: "11111111-1111-4111-8111-111111111111",
      slug: "ops",
      name: "Ops 2",
      created_at: stamp,
      updated_at: stamp,
      permission_ids: [],
    } })),
    replacePermissions: vi.fn(async () => ({ ok: true as const, role: {
      id: "11111111-1111-4111-8111-111111111111",
      slug: "ops",
      name: "Ops 2",
      created_at: stamp,
      updated_at: stamp,
      permission_ids: [],
    } })),
    deleteRole: vi.fn(async () => ({ ok: true as const })),
    ...partial,
  };
}

describe("RolesPanel", () => {
  beforeEach(() => {
    useSessionStore.setState({ accessToken: "tok", hydrated: true });
    replace.mockReset();
  });

  it("renders the table and hides edit on locked admin", async () => {
    const onCount = vi.fn();
    render(
      <RolesPanel client={client()} creating={false} onCreatingChange={vi.fn()} onCount={onCount} />,
    );

    await waitFor(() => expect(screen.getByText("Operaciones")).toBeInTheDocument());
    expect(screen.getByText("Administrador")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Editar" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Duplicar" })).toHaveLength(2);
    expect(onCount).toHaveBeenCalledWith(2);
  });

  it("opens create drawer from the creating flag and keeps it open on failure", async () => {
    const user = userEvent.setup();
    const roles = client({
      createRole: vi.fn(async () => ({ ok: false as const, status: 409, detail: "Ese slug de rol ya existe." })),
    });
    const onCreatingChange = vi.fn();
    render(
      <RolesPanel
        client={roles}
        creating
        onCreatingChange={onCreatingChange}
      />,
    );

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    await user.type(screen.getByLabelText(/Nombre/i), "Nuevo");
    await user.type(screen.getByLabelText(/Slug/i), "nuevo");
    await user.click(screen.getByRole("button", { name: /Crear rol/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Ese slug de rol ya existe.");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(onCreatingChange).not.toHaveBeenCalled();
  });
});
