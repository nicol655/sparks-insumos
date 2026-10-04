"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { ProductForm } from "@/components/catalog/product-form";
import { PageHeading } from "@/components/shell/page-heading";
import { endSession } from "@/lib/auth/end-session";
import { useSessionStore } from "@/lib/auth/session-store";
import { createCatalogClient, isUnauthenticated, type CatalogClient } from "@/lib/catalog/client";
import type { Category, Product } from "@/lib/catalog/contract";
import { familyLabel } from "@/lib/catalog/families";
import {
  EMPTY_CATALOG,
  FIFTY_NOTE,
  FILTER_EMPTY,
  SESSION_DETAIL,
  formatPrice,
  photoCount,
  visibilityLabel,
} from "@/lib/catalog/labels";

const CHIPS = [
  { id: "all", label: "Todo" },
  { id: "perfume", label: "Perfumes" },
  { id: "set", label: "Sets" },
  { id: "body", label: "Body splash" },
] as const;

type ChipId = (typeof CHIPS)[number]["id"];

const controlClass =
  "border-ink/22 text-ink bg-transparent px-3.5 py-[11px] text-[13.5px] outline-none";

function categoryMatches(name: string, chip: ChipId): boolean {
  if (chip === "all") return true;
  const normalized = name.toLocaleLowerCase("es");
  if (chip === "perfume") return normalized.includes("perfume");
  if (chip === "set") return normalized.includes("set");
  return normalized.includes("body");
}

function stockMatches(product: Product, stock: string): boolean {
  if (stock === "draft") return product.visibility !== "visible";
  if (stock === "low" || stock === "out") return false;
  return true;
}

function sortProducts(list: Product[], sort: string): Product[] {
  const copy = [...list];
  if (sort === "priceDesc") copy.sort((a, b) => b.price - a.price);
  else if (sort === "priceAsc") copy.sort((a, b) => a.price - b.price);
  else if (sort === "name") copy.sort((a, b) => a.name.localeCompare(b.name, "es"));
  return copy;
}

function VisibilityMark({ value }: { value: Product["visibility"] }) {
  const on = value === "visible";
  return (
    <span className="inline-flex items-center gap-[9px]">
      <span
        className={`flex h-[18px] w-[34px] items-center rounded-full border p-0.5 ${
          on ? "border-ink bg-ink justify-end" : "border-ink/30 justify-start bg-transparent"
        }`}
      >
        <span className={`block size-3 rounded-full ${on ? "bg-canvas" : "bg-ink/45"}`} />
      </span>
      <span className="text-text-meta font-mono text-[9.5px] tracking-[0.1em] uppercase">
        {visibilityLabel[value]}
      </span>
    </span>
  );
}

export function CatalogList({ client, initialDrawer = false }: { client?: CatalogClient; initialDrawer?: boolean }) {
  const catalog = useMemo(() => client ?? createCatalogClient("/api/catalog"), [client]);
  const router = useRouter();
  const replaceRef = useRef(router.replace);
  const token = useSessionStore((state) => state.accessToken);
  const hydrated = useSessionStore((state) => state.hydrated);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [chip, setChip] = useState<ChipId>("all");
  const [stock, setStock] = useState("all");
  const [sort, setSort] = useState("name");
  const [drawer, setDrawer] = useState(initialDrawer);
  const [editing, setEditing] = useState<Product | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [generation, setGeneration] = useState(0);
  const sessionError = hydrated && !token ? SESSION_DETAIL : null;
  const showLoading = !hydrated || (token !== null && !loaded);
  const ready = loaded && !sessionError && !error;

  useEffect(() => {
    replaceRef.current = router.replace;
  }, [router]);

  useEffect(() => {
    if (!hydrated || !token) return;

    let cancelled = false;
    void (async () => {
      const [productsResult, categoriesResult] = await Promise.all([
        catalog.listProducts(token),
        catalog.listCategories(token),
      ]);
      if (cancelled) return;
      if (isUnauthenticated(productsResult) || isUnauthenticated(categoriesResult)) {
        endSession((path) => replaceRef.current(path));
        return;
      }
      if (productsResult.ok) {
        setProducts(productsResult.products);
        setError(null);
      } else {
        setProducts([]);
        setError(productsResult.detail);
      }
      if (categoriesResult.ok) setCategories(categoriesResult.categories);
      setLoaded(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [catalog, generation, hydrated, token]);

  async function changeVisibility(product: Product) {
    if (!token || pendingId) return;
    const body = new FormData();
    body.set("visibility", product.visibility === "visible" ? "hidden" : "visible");
    setPendingId(product.id);
    const result = await catalog.updateProduct(product.id, body, token);
    setPendingId(null);
    if (isUnauthenticated(result)) {
      endSession((path) => replaceRef.current(path));
      return;
    }
    if (!result.ok) {
      setError(result.detail);
      return;
    }
    setProducts((current) => current.map((row) => (row.id === result.product.id ? result.product : row)));
  }

  const names = new Map(categories.map((category) => [category.id, category.name]));
  const needle = query.trim().toLocaleLowerCase("es");
  const visible = sortProducts(
    products.filter((product) => {
      const categoryName = names.get(product.category_id) ?? product.category_id;
      if (!categoryMatches(categoryName, chip)) return false;
      if (!stockMatches(product, stock)) return false;
      if (!needle) return true;
      return `${product.name} ${product.brand ?? ""}`.toLocaleLowerCase("es").includes(needle);
    }),
    sort,
  );
  const kicker = ready ? `${products.length} referencias · 0 con stock bajo` : "Catálogo";

  return (
    <div className="flex flex-col gap-7">
      <PageHeading
        kicker={kicker}
        title="Catálogo"
        action={
          <button
            type="button"
            onClick={() => setDrawer(true)}
            className="bg-ink text-canvas border-ink hover:bg-accent-gold border px-5 py-3 text-[11px] tracking-[0.16em] uppercase"
          >
            Nuevo producto
          </button>
        }
      />
      {showLoading ? <p className="text-text-meta text-sm">Cargando el catálogo…</p> : null}
      {sessionError ? (
        <p role="alert" className="text-danger text-sm">
          {sessionError}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      ) : null}
      {ready ? (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-3">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nombre o marca"
              className={`${controlClass} max-w-[340px] min-w-[220px] flex-1 border`}
            />
            <div className="flex flex-wrap gap-[7px]">
              {CHIPS.map((item) => {
                const on = chip === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setChip(item.id)}
                    className={`rounded-full border px-[13px] py-2 text-[11.5px] tracking-[0.06em] whitespace-nowrap ${
                      on ? "border-ink bg-ink text-canvas" : "border-ink/20 text-ink bg-transparent"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
            <select
              aria-label="Stock"
              value={stock}
              onChange={(event) => setStock(event.target.value)}
              className={`${controlClass} border py-2.5 text-[13px]`}
            >
              <option value="all">Todo el stock</option>
              <option value="low">Stock bajo (≤ 3)</option>
              <option value="out">Agotados</option>
              <option value="draft">Sin publicar</option>
              <option value="noen">Sin traducción EN</option>
            </select>
            <select
              aria-label="Orden"
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className={`${controlClass} border py-2.5 text-[13px]`}
            >
              <option value="name">Nombre A–Z</option>
              <option value="stockAsc">Stock: menor primero</option>
              <option value="priceDesc">Precio: mayor primero</option>
              <option value="priceAsc">Precio: menor primero</option>
            </select>
            <span className="text-text-meta ml-auto font-mono text-[10.5px] tracking-[0.08em]">
              {visible.length} DE {products.length}
            </span>
          </div>
          {products.length === 0 ? (
            <p className="text-text-meta font-display px-4 py-[50px] text-center text-[22px] italic">
              {EMPTY_CATALOG}
            </p>
          ) : null}
          {products.length > 0 && visible.length === 0 ? (
            <p className="text-text-meta font-display px-4 py-[50px] text-center text-[22px] italic">
              {FILTER_EMPTY}
            </p>
          ) : null}
          {visible.length > 0 ? (
            <div className="border-ink overflow-x-auto border-t">
              <table className="w-full min-w-[960px] border-collapse text-left text-[13.5px]">
                <thead>
                  <tr className="text-text-meta border-ink/20 border-b font-mono text-[9.5px] tracking-[0.14em] uppercase">
                    <th className="w-12 px-4 py-3 font-normal" scope="col">
                      <span className="sr-only">Foto</span>
                    </th>
                    <th className="px-3.5 py-3 font-normal" scope="col">
                      Producto
                    </th>
                    <th className="px-3.5 py-3 font-normal" scope="col">
                      Familia
                    </th>
                    <th className="px-3.5 py-3 font-normal" scope="col">
                      Tamaño
                    </th>
                    <th className="px-3.5 py-3 font-normal" scope="col">
                      Precio
                    </th>
                    <th className="px-3.5 py-3 font-normal" scope="col">
                      Stock
                    </th>
                    <th className="px-3.5 py-3 font-normal" scope="col">
                      Publicado
                    </th>
                    <th className="w-[70px] px-4 py-3 font-normal" scope="col">
                      <span className="sr-only">Editar</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((product) => {
                    const categoryName = names.get(product.category_id) ?? product.category_id;
                    return (
                      <tr
                        key={product.id}
                        className={`border-ink/10 hover:bg-ink/3 border-b ${product.visibility === "visible" ? "" : "opacity-55"}`}
                      >
                        <td className="px-4 py-[15px]">
                          {product.photo_urls[0] ? (
                            // The URL is a short-lived S3 signature. next/image will not optimize it.
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={product.photo_urls[0]}
                              alt=""
                              className="border-ink/12 block h-12 w-10 border object-cover"
                            />
                          ) : (
                            <span className="border-ink/12 bg-placeholder-a block h-12 w-10 border bg-[repeating-linear-gradient(135deg,#EDE7DC_0_6px,#F2EDE4_6px_12px)]" />
                          )}
                        </td>
                        <td className="px-3.5 py-[15px]">
                          <span className="flex min-w-0 flex-col gap-[3px]">
                            <span className="flex items-center gap-2">
                              <span className="truncate">{product.name}</span>
                              <span
                                title="Falta la descripción en inglés"
                                className="text-accent-gold border-accent-gold/50 shrink-0 border px-[5px] py-px font-mono text-[8.5px] tracking-[0.1em]"
                              >
                                EN
                              </span>
                            </span>
                            <span className="text-text-meta font-mono text-[9.5px] tracking-[0.12em] uppercase">
                              <span>{product.brand ?? "—"}</span>
                              <span> · </span>
                              <span>{categoryName}</span>
                            </span>
                            <span className="text-text-meta font-mono text-[9.5px] tracking-[0.12em] uppercase">
                              {photoCount(product.photos.length)}
                            </span>
                          </span>
                        </td>
                        <td className="text-text-muted px-3.5 py-[15px] font-light">{familyLabel(product.family)}</td>
                        <td className="text-text-muted px-3.5 py-[15px] font-mono text-[11px]">
                          {product.size_ml === null ? "—" : `${product.size_ml} ml`}
                        </td>
                        <td className="px-3.5 py-[15px]">{formatPrice(product.price)}</td>
                        <td className="px-3.5 py-[15px]">
                          <span className="border-ink/20 inline-flex items-center border">
                            <button
                              type="button"
                              disabled
                              aria-label="Restar stock"
                              className="h-[26px] w-[26px]"
                            >
                              −
                            </button>
                            <span className="min-w-6 text-center font-mono text-[11.5px]">—</span>
                            <button
                              type="button"
                              disabled
                              aria-label="Sumar stock"
                              className="h-[26px] w-[26px]"
                            >
                              +
                            </button>
                          </span>
                        </td>
                        <td className="px-3.5 py-[15px]">
                          <button
                            type="button"
                            className="cursor-pointer"
                            aria-pressed={product.visibility === "visible"}
                            aria-label="Publicado"
                            disabled={pendingId === product.id}
                            onClick={() => {
                              void changeVisibility(product);
                            }}
                          >
                            <VisibilityMark value={product.visibility} />
                          </button>
                        </td>
                        <td className="px-4 py-[15px] text-right">
                          <button
                            type="button"
                            className="text-accent-gold cursor-pointer text-[10.5px] tracking-[0.14em] uppercase hover:underline"
                            onClick={() => {
                              setDrawer(false);
                              setEditing(product);
                            }}
                          >
                            Editar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      ) : null}
      {products.length === 50 ? <p className="text-text-meta text-sm">{FIFTY_NOTE}</p> : null}
      {drawer || editing ? (
        <ProductForm
          key={editing?.id ?? "new"}
          client={catalog}
          product={editing ?? undefined}
          onClose={() => {
            setEditing(null);
            if (initialDrawer) router.push("/catalogo");
            else setDrawer(false);
          }}
          onCreated={() => {
            setEditing(null);
            setDrawer(false);
            setGeneration((current) => current + 1);
            if (initialDrawer) router.push("/catalogo");
          }}
        />
      ) : null}
    </div>
  );
}
