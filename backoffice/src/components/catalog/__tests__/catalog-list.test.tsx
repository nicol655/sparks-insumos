import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CatalogList } from "@/components/catalog/catalog-list";
import type { CatalogClient } from "@/lib/catalog/client";
import type { Category, Product } from "@/lib/catalog/contract";
import { EMPTY_CATALOG, FIFTY_NOTE, FILTER_EMPTY, SESSION_DETAIL } from "@/lib/catalog/labels";
import { useSessionStore } from "@/lib/auth/session-store";

const replace = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
}));

const categoryId = "11111111-1111-4111-8111-111111111111";
const stamp = "2026-09-28T12:00:00Z";

const category: Category = {
  id: categoryId,
  name: "Floral",
  product_category_id: null,
  created_at: stamp,
  updated_at: stamp,
};

function product(overrides: Partial<Product> = {}): Product {
  return {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Rosa",
    description: "Una rosa",
    cost: 10.5,
    price: 20,
    type: "physical",
    weight: null,
    length: null,
    width: null,
    height: null,
    sku: null,
    bar_code: null,
    brand: null,
    visibility: "visible",
    discount: null,
    family: null,
    size_ml: null,
    photos: ["products/rosa.png"],
    photo_urls: ["https://signed.example/rosa.png"],
    category_id: categoryId,
    tag_ids: [],
    created_at: stamp,
    updated_at: stamp,
    ...overrides,
  };
}

function client(partial: Partial<CatalogClient>): CatalogClient {
  return {
    listProducts: vi.fn().mockResolvedValue({ ok: true, products: [] }),
    listCategories: vi.fn().mockResolvedValue({ ok: true, categories: [] }),
    listTags: vi.fn().mockResolvedValue({ ok: true, tags: [] }),
    createProduct: vi.fn(),
    updateProduct: vi.fn(),
    createCategory: vi.fn(),
    createTag: vi.fn(),
    ...partial,
  };
}

describe("catalog list", () => {
  beforeEach(() => {
    replace.mockReset();
    useSessionStore.setState({ accessToken: "tok", mustChangePassword: false, hydrated: true });
  });

  it("shows an empty catalog and none of the prototype rows", async () => {
    render(<CatalogList client={client({})} />);

    expect(await screen.findByText(EMPTY_CATALOG)).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByText("Martina Álvarez")).not.toBeInTheDocument();
    expect(screen.queryByText("SP-10482")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nuevo producto" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens the new product drawer over the catalog", async () => {
    const user = userEvent.setup();
    render(<CatalogList client={client({})} />);

    expect(await screen.findByRole("heading", { name: "Catálogo" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Nuevo producto" }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Catálogo" })).toBeInTheDocument();
    expect(screen.getByText("Sin nombre")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText(EMPTY_CATALOG)).toBeInTheDocument();
  });

  it("shows the saved family and size", async () => {
    render(
      <CatalogList
        client={client({
          listProducts: vi.fn().mockResolvedValue({
            ok: true,
            products: [product({ family: "gourmand", size_ml: 100 })],
          }),
        })}
      />,
    );

    expect(await screen.findByText("Gourmand")).toBeInTheDocument();
    expect(screen.getByText("100 ml")).toBeInTheDocument();
  });

  it("renders a loaded product with its category, price, visibility and photo count", async () => {
    const unknown = "44444444-4444-4444-8444-444444444444";
    render(
      <CatalogList
        client={client({
          listProducts: vi.fn().mockResolvedValue({
            ok: true,
            products: [
              product(),
              product({
                id: "55555555-5555-4555-8555-555555555555",
                name: "Cedro",
                brand: "Sparks",
                visibility: "not_listed",
                photos: ["a", "b", "c"],
                category_id: unknown,
                price: 1200.1,
              }),
            ],
          }),
          listCategories: vi.fn().mockResolvedValue({ ok: true, categories: [category] }),
        })}
      />,
    );

    expect(await screen.findByText("Rosa")).toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
    expect(screen.getByText("Floral")).toBeInTheDocument();
    expect(screen.getByText("2 referencias · 0 con stock bajo")).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: /20,00/ })).toBeInTheDocument();
    expect(screen.getAllByText("Publicado").length).toBeGreaterThan(1);
    expect(screen.getByText("1 foto")).toBeInTheDocument();
    expect(screen.getByText("Cedro")).toBeInTheDocument();
    expect(screen.getByText("Sparks")).toBeInTheDocument();
    expect(screen.getByText("No listado")).toBeInTheDocument();
    expect(screen.getByText("3 fotos")).toBeInTheDocument();
    expect(screen.getByText(unknown)).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: /1\.200,10/ })).toBeInTheDocument();
    expect(screen.queryByText("Khamrah Waha")).not.toBeInTheDocument();
  });

  it("filters by the design category chips", async () => {
    const user = userEvent.setup();
    render(
      <CatalogList
        client={client({
          listProducts: vi.fn().mockResolvedValue({ ok: true, products: [product()] }),
          listCategories: vi.fn().mockResolvedValue({ ok: true, categories: [category] }),
        })}
      />,
    );

    expect(await screen.findByText("Rosa")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Perfumes" }));

    expect(screen.getByText(FILTER_EMPTY)).toBeInTheDocument();
    expect(screen.queryByText("Rosa")).not.toBeInTheDocument();
  });

  it("says when the list is the latest fifty", async () => {
    const products = Array.from({ length: 50 }, (_, index) =>
      product({
        id: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
        name: `Producto ${index}`,
      }),
    );
    render(
      <CatalogList
        client={client({
          listProducts: vi.fn().mockResolvedValue({ ok: true, products }),
        })}
      />,
    );

    expect(await screen.findByText(FIFTY_NOTE)).toBeInTheDocument();
  });

  it("shows the API detail instead of the empty copy", async () => {
    render(
      <CatalogList
        client={client({
          listProducts: vi.fn().mockResolvedValue({
            ok: false,
            status: 403,
            detail: "Tenés que cambiar la clave.",
          }),
        })}
      />,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent("Tenés que cambiar la clave.");
    expect(screen.queryByText(EMPTY_CATALOG)).not.toBeInTheDocument();
    expect(useSessionStore.getState().accessToken).toBe("tok");
    expect(replace).not.toHaveBeenCalled();
  });

  it("drops the session and opens login when the catalog answers 401", async () => {
    render(
      <CatalogList
        client={client({
          listProducts: vi.fn().mockResolvedValue({
            ok: false,
            status: 401,
            detail: SESSION_DETAIL,
          }),
        })}
      />,
    );

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/login");
    });
    expect(useSessionStore.getState().accessToken).toBeNull();
    expect(screen.queryByText(EMPTY_CATALOG)).not.toBeInTheDocument();
  });

  it("shows the signed photo and keeps the stripe when the url is empty", async () => {
    render(
      <CatalogList
        client={client({
          listProducts: vi.fn().mockResolvedValue({
            ok: true,
            products: [
              product({ photo_urls: ["https://signed.example/rosa.png"] }),
              product({
                id: "55555555-5555-4555-8555-555555555555",
                name: "Cedro",
                photo_urls: [""],
              }),
            ],
          }),
        })}
      />,
    );

    expect(await screen.findByText("Rosa")).toBeInTheDocument();
    expect(document.querySelector("img")).toHaveAttribute("src", "https://signed.example/rosa.png");
    expect(document.querySelectorAll("img")).toHaveLength(1);
    expect(screen.getByText("Cedro")).toBeInTheDocument();
  });

  it("opens the edit drawer and patches only visibility", async () => {
    const user = userEvent.setup();
    const rows = [
      product(),
      product({
        id: "55555555-5555-4555-8555-555555555555",
        name: "Cedro",
        visibility: "not_listed" as const,
      }),
    ];
    const updateProduct = vi.fn().mockImplementation(async (id: string, body: FormData) => ({
      ok: true,
      product: {
        ...(rows.find((row) => row.id === id) ?? rows[0]),
        visibility: String(body.get("visibility")) as Product["visibility"],
      },
    }));
    render(
      <CatalogList
        client={client({
          listProducts: vi.fn().mockResolvedValue({ ok: true, products: rows }),
          updateProduct,
        })}
      />,
    );

    const edit = await screen.findAllByRole("button", { name: "Editar" });
    expect(edit[0]).toHaveClass("cursor-pointer");
    expect(edit[0]?.className).toContain("hover:underline");

    const rosa = () => screen.getByRole("row", { name: /Rosa/ });
    const cedro = () => screen.getByRole("row", { name: /Cedro/ });
    expect(within(rosa()).getByRole("button", { name: "Publicado" })).toHaveClass("cursor-pointer");
    await user.click(within(rosa()).getByRole("button", { name: "Publicado" }));
    const hiddenBody = updateProduct.mock.calls[0]?.[1] as FormData;
    expect([...hiddenBody.keys()]).toEqual(["visibility"]);
    expect(hiddenBody.get("visibility")).toBe("hidden");

    await user.click(within(cedro()).getByRole("button", { name: "Publicado" }));
    const visibleBody = updateProduct.mock.calls[1]?.[1] as FormData;
    expect([...visibleBody.keys()]).toEqual(["visibility"]);
    expect(visibleBody.get("visibility")).toBe("visible");

    await user.click(within(rosa()).getByRole("button", { name: "Editar" }));
    expect(await screen.findByText("Editar producto")).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre")).toHaveValue("Rosa");
    expect(screen.getByLabelText("Precio")).toHaveValue("20");
    expect(screen.getByLabelText("Visibilidad")).toHaveValue("hidden");
  });
});
