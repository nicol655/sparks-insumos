import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProductForm } from "@/components/catalog/product-form";
import type { CatalogClient } from "@/lib/catalog/client";
import type { Category, Product, Tag } from "@/lib/catalog/contract";
import { IMAGE_SLOTS, INVALID_DETAIL, PHOTO_MESSAGE } from "@/lib/catalog/labels";
import { useSessionStore } from "@/lib/auth/session-store";

const push = vi.hoisted(() => vi.fn());
const replace = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
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

const created: Product = {
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
};

function catalog(partial: Partial<CatalogClient> = {}): CatalogClient {
  return {
    listProducts: vi.fn(),
    listCategories: vi.fn().mockResolvedValue({ ok: true, categories: [category] }),
    listTags: vi.fn().mockResolvedValue({ ok: true, tags: [] }),
    createProduct: vi.fn().mockResolvedValue({ ok: true, product: created }),
    updateProduct: vi.fn().mockResolvedValue({ ok: true, product: created }),
    createCategory: vi.fn(),
    createTag: vi.fn(),
    ...partial,
  };
}

async function fillRequired(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Nombre"), "Rosa");
  await user.type(screen.getByLabelText("Descripción"), "Una rosa");
  await user.type(screen.getByLabelText("Costo"), "10.50");
  await user.type(screen.getByLabelText("Precio"), "20");
  await user.selectOptions(screen.getByLabelText("Tipo"), "physical");
  await user.selectOptions(screen.getByLabelText("Visibilidad"), "visible");
  await user.selectOptions(screen.getByLabelText("Categoría"), categoryId);
  await user.upload(
    screen.getByLabelText("Packshot frontal"),
    new File([new Uint8Array([1])], "rosa.png", { type: "image/png" }),
  );
}

describe("product form", () => {
  beforeEach(() => {
    push.mockReset();
    replace.mockReset();
    if (typeof URL.createObjectURL !== "function") {
      Object.defineProperty(URL, "createObjectURL", { configurable: true, writable: true, value: () => "blob:preview" });
    }
    if (typeof URL.revokeObjectURL !== "function") {
      Object.defineProperty(URL, "revokeObjectURL", { configurable: true, writable: true, value: () => undefined });
    }
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:preview");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    useSessionStore.setState({ accessToken: "tok", mustChangePassword: false, hydrated: true });
  });

  it("does not call the client when a required field is empty", async () => {
    const user = userEvent.setup();
    const client = catalog();
    render(<ProductForm client={client} />);

    await user.click(await screen.findByRole("button", { name: "Crear producto" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Nombre");
    expect(screen.getByRole("alert")).toHaveTextContent("Descripción");
    expect(screen.getByRole("alert")).toHaveTextContent("Costo");
    expect(screen.getByRole("alert")).toHaveTextContent("Precio");
    expect(screen.getByRole("alert")).toHaveTextContent("Tipo");
    expect(screen.getByRole("alert")).toHaveTextContent("Visibilidad");
    expect(screen.getByRole("alert")).toHaveTextContent("Categoría");
    expect(screen.getByRole("alert")).toHaveTextContent("Fotos");
    expect(client.createProduct).not.toHaveBeenCalled();
    expect(screen.getByText("Se guarda y no modifica el precio.")).toBeInTheDocument();
  });

  it("shows a 422 detail and does not leave the form", async () => {
    const user = userEvent.setup();
    const client = catalog({
      createProduct: vi.fn().mockResolvedValue({ ok: false, status: 422, detail: PHOTO_MESSAGE }),
    });
    render(<ProductForm client={client} />);
    await screen.findByRole("button", { name: "Crear producto" });
    await fillRequired(user);
    await user.click(screen.getByRole("button", { name: "Crear producto" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(PHOTO_MESSAGE);
    expect(push).not.toHaveBeenCalled();
  });

  it("shows the flattened validation detail", async () => {
    const user = userEvent.setup();
    const client = catalog({
      createProduct: vi.fn().mockResolvedValue({ ok: false, status: 422, detail: INVALID_DETAIL }),
    });
    render(<ProductForm client={client} />);
    await screen.findByRole("button", { name: "Crear producto" });
    await fillRequired(user);
    await user.click(screen.getByRole("button", { name: "Crear producto" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(INVALID_DETAIL);
    expect(push).not.toHaveBeenCalled();
  });

  it("returns to the catalog after a successful create", async () => {
    const user = userEvent.setup();
    const client = catalog();
    render(<ProductForm client={client} />);
    await screen.findByRole("button", { name: "Crear producto" });
    await fillRequired(user);
    await user.click(screen.getByRole("button", { name: "Crear producto" }));

    expect(push).toHaveBeenCalledWith("/catalogo");
    expect(client.createProduct).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Rosa",
        cost: "10.50",
        categoryId,
        type: "physical",
        family: "florales",
        sizeMl: "100",
      }),
      "tok",
    );
  });

  it("keeps the product name when the category create fails", async () => {
    const user = userEvent.setup();
    const client = catalog({
      createCategory: vi.fn().mockResolvedValue({ ok: false, status: 409, detail: "Ya existe." }),
    });
    render(<ProductForm client={client} />);
    await user.type(await screen.findByLabelText("Nombre"), "Rosa");
    await user.type(screen.getByLabelText("Nombre de la categoría"), "Floral");
    await user.selectOptions(screen.getByLabelText("Padre"), categoryId);
    await user.click(screen.getByRole("button", { name: "Crear categoría" }));

    expect(await screen.findByText("Ya existe.")).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre")).toHaveValue("Rosa");
    expect(client.createCategory).toHaveBeenCalledWith({ name: "Floral", parentId: categoryId }, "tok");
    expect(client.createProduct).not.toHaveBeenCalled();
  });

  it("selects a tag that was just created", async () => {
    const user = userEvent.setup();
    const tag: Tag = {
      id: "33333333-3333-4333-8333-333333333333",
      name: "ámbar",
      created_at: stamp,
      updated_at: stamp,
    };
    const client = catalog({
      createTag: vi.fn().mockResolvedValue({ ok: true, tag }),
    });
    render(<ProductForm client={client} />);
    await user.type(await screen.findByLabelText("Nombre del tag"), "ámbar");
    await user.click(screen.getByRole("button", { name: "Crear tag" }));

    expect(await screen.findByRole("checkbox", { name: "ámbar" })).toBeChecked();
  });

  it("drops the session when loading the form answers 401", async () => {
    render(
      <ProductForm
        client={catalog({
          listCategories: vi.fn().mockResolvedValue({
            ok: false,
            status: 401,
            detail: "No autenticado",
          }),
        })}
      />,
    );

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/login");
    });
    expect(useSessionStore.getState().accessToken).toBeNull();
    expect(push).not.toHaveBeenCalled();
  });

  it("drops the olfactory pyramid and lets each slot pick its own photo", async () => {
    const user = userEvent.setup();
    const client = catalog();
    render(<ProductForm client={client} />);
    await screen.findByRole("button", { name: "Crear producto" });

    expect(screen.queryByText("Pirámide olfativa")).not.toBeInTheDocument();
    expect(screen.queryByText("Salida")).not.toBeInTheDocument();
    expect(screen.queryByText("Corazón")).not.toBeInTheDocument();
    expect(screen.queryByText("Fondo")).not.toBeInTheDocument();
    expect(document.querySelector("input[multiple]")).toBeNull();

    for (const slot of IMAGE_SLOTS) {
      const input = screen.getByLabelText(slot);
      expect(input.closest("label")).toHaveClass("cursor-pointer");
      expect(input).not.toHaveAttribute("multiple");
    }

    await user.upload(
      screen.getByLabelText("Packshot frontal"),
      new File([new Uint8Array([1])], "perfume 1.webp", { type: "image/webp" }),
    );

    expect(document.querySelector("img")).toHaveAttribute("src", "blob:preview");
    expect(screen.getByText("perfume 1.webp")).toHaveAttribute("title", "perfume 1.webp");
    expect(screen.queryByText("Atomizador", { selector: "p" })).not.toBeInTheDocument();
  });

  it("shortens a long file name and keeps the extension", async () => {
    const user = userEvent.setup();
    render(<ProductForm client={catalog()} />);
    await screen.findByRole("button", { name: "Crear producto" });

    await user.upload(
      screen.getByLabelText("Notas"),
      new File([new Uint8Array([1])], "nombre_muy_largo_para_el_cuadro.png", { type: "image/png" }),
    );

    expect(screen.getByText("nombre_mu... .png")).toHaveAttribute(
      "title",
      "nombre_muy_largo_para_el_cuadro.png",
    );
  });

  it("sends filled slots in slot order and skips the empty ones", async () => {
    const user = userEvent.setup();
    const client = catalog();
    render(<ProductForm client={client} />);
    await screen.findByRole("button", { name: "Crear producto" });
    expect(screen.queryByRole("button", { name: "Quitar foto" })).not.toBeInTheDocument();
    await user.type(screen.getByLabelText("Nombre"), "Rosa");
    await user.type(screen.getByLabelText("Descripción"), "Una rosa");
    await user.type(screen.getByLabelText("Costo"), "10.50");
    await user.type(screen.getByLabelText("Precio"), "20");
    await user.selectOptions(screen.getByLabelText("Tipo"), "physical");
    await user.selectOptions(screen.getByLabelText("Visibilidad"), "visible");
    await user.selectOptions(screen.getByLabelText("Categoría"), categoryId);
    await user.upload(
      screen.getByLabelText("Lifestyle"),
      new File([new Uint8Array([1])], "vida.png", { type: "image/png" }),
    );
    await user.upload(
      screen.getByLabelText("Packshot frontal"),
      new File([new Uint8Array([1])], "frente.png", { type: "image/png" }),
    );
    await user.click(screen.getByRole("button", { name: "Crear producto" }));

    expect(client.createProduct).toHaveBeenCalledWith(
      expect.objectContaining({
        photos: [expect.objectContaining({ name: "frente.png" }), expect.objectContaining({ name: "vida.png" })],
      }),
      "tok",
    );
  });

  it("does not send a file that is not a photo", async () => {
    const user = userEvent.setup();
    const client = catalog();
    render(<ProductForm client={client} />);
    await screen.findByRole("button", { name: "Crear producto" });
    await user.type(screen.getByLabelText("Nombre"), "Rosa");
    await user.type(screen.getByLabelText("Descripción"), "Una rosa");
    await user.type(screen.getByLabelText("Costo"), "10.50");
    await user.type(screen.getByLabelText("Precio"), "20");
    await user.selectOptions(screen.getByLabelText("Tipo"), "physical");
    await user.selectOptions(screen.getByLabelText("Visibilidad"), "visible");
    await user.selectOptions(screen.getByLabelText("Categoría"), categoryId);
    fireEvent.change(screen.getByLabelText("Packshot frontal"), {
      target: { files: [new File([new Uint8Array([1])], "notas.gif", { type: "image/gif" })] },
    });
    await user.click(screen.getByRole("button", { name: "Crear producto" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(PHOTO_MESSAGE);
    expect(client.createProduct).not.toHaveBeenCalled();
  });

  it("replaces a stored photo and keeps the tail key", async () => {
    const user = userEvent.setup();
    const updateProduct = vi.fn().mockResolvedValue({ ok: true, product: created });
    const client = catalog({ updateProduct });
    const existing: Product = {
      ...created,
      photos: [
        "products/old.webp",
        "products/two.webp",
        "products/three.webp",
        "products/four.webp",
        "products/tail.webp",
      ],
      photo_urls: [
        "https://signed.example/old.webp",
        "https://signed.example/two.webp",
        "https://signed.example/three.webp",
        "https://signed.example/four.webp",
        "https://signed.example/tail.webp",
      ],
    };
    render(<ProductForm client={client} product={existing} />);

    expect(await screen.findByText("Editar producto")).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre")).toHaveValue("Rosa");
    expect(screen.getByLabelText("Precio")).toHaveValue("20");
    await user.upload(
      screen.getByLabelText("Packshot frontal"),
      new File([new Uint8Array([1])], "nueva.png", { type: "image/png" }),
    );
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(client.createProduct).not.toHaveBeenCalled();
    expect(updateProduct).toHaveBeenCalledWith(existing.id, expect.any(FormData), "tok");
    const body = updateProduct.mock.calls[0]?.[1] as FormData;
    expect(body.get("photo_slots")).toBe("1");
    expect(body.get("slot_key_0")).toBeNull();
    expect((body.get("slot_file_0") as File).name).toBe("nueva.png");
    expect(body.get("slot_key_1")).toBe("products/two.webp");
    expect(body.get("slot_key_4")).toBe("products/tail.webp");
  });

  it("drops a stored photo without saving an empty product or calling the patch on cancel", async () => {
    const user = userEvent.setup();
    const updateProduct = vi.fn();
    const onClose = vi.fn();
    const client = catalog({ updateProduct });
    render(
      <ProductForm
        client={client}
        onClose={onClose}
        product={{
          ...created,
          photos: ["products/old.webp"],
          photo_urls: ["https://signed.example/old.webp"],
        }}
      />,
    );

    const trash = await screen.findByRole("button", { name: "Quitar foto" });
    expect(trash).toHaveClass("cursor-pointer");
    await user.click(trash);
    expect(screen.queryByRole("button", { name: "Quitar foto" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Fotos");
    expect(updateProduct).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onClose).toHaveBeenCalled();
    expect(updateProduct).not.toHaveBeenCalled();
  });
});
