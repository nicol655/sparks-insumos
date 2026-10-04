import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CatalogoPage from "@/app/(panel)/catalogo/page";
import NuevoProductoPage from "@/app/(panel)/catalogo/nuevo/page";
import { EMPTY_CATALOG } from "@/lib/catalog/labels";
import { useSessionStore } from "@/lib/auth/session-store";

const fake = vi.hoisted(() => ({
  listProducts: vi.fn(),
  listCategories: vi.fn(),
  listTags: vi.fn(),
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  createCategory: vi.fn(),
  createTag: vi.fn(),
}));

vi.mock("@/lib/catalog/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/catalog/client")>();
  return { ...actual, createCatalogClient: () => fake };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

describe("catalog pages", () => {
  beforeEach(() => {
    fake.listProducts.mockResolvedValue({ ok: true, products: [] });
    fake.listCategories.mockResolvedValue({ ok: true, categories: [] });
    fake.listTags.mockResolvedValue({ ok: true, tags: [] });
    useSessionStore.setState({ accessToken: "tok", mustChangePassword: false, hydrated: true });
  });

  it("lists from the page", async () => {
    render(<CatalogoPage />);
    expect(await screen.findByText(EMPTY_CATALOG)).toBeInTheDocument();
    expect(fake.listProducts).toHaveBeenCalledWith("tok");
  });

  it("opens the create form from its route", async () => {
    render(<NuevoProductoPage />);
    expect(await screen.findByRole("button", { name: "Crear producto" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Crear categoría" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Crear tag" })).toBeInTheDocument();
  });
});
