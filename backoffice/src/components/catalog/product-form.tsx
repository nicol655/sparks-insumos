"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

import { endSession } from "@/lib/auth/end-session";
import { useSessionStore } from "@/lib/auth/session-store";
import { createCatalogClient, isUnauthenticated, productFormData, type CatalogClient } from "@/lib/catalog/client";
import { STORE_FAMILIES } from "@/lib/catalog/families";
import type { Category, Product, Tag } from "@/lib/catalog/contract";
import { validateDraft, type Draft, type ProductWrite } from "@/lib/catalog/form";
import { EN_MISSING, IMAGE_SLOTS, SESSION_DETAIL, shortenFileName, typeLabel, visibilityLabel } from "@/lib/catalog/labels";

type SlotName = (typeof IMAGE_SLOTS)[number];
type SlotPhoto = { kind: "file"; file: File; url: string } | { kind: "remote"; key: string; url: string };

function remoteSlots(product?: Product): Partial<Record<SlotName, SlotPhoto>> {
  if (!product) return {};
  const next: Partial<Record<SlotName, SlotPhoto>> = {};
  IMAGE_SLOTS.forEach((slot, index) => {
    const key = product.photos[index];
    if (!key) return;
    next[slot] = { kind: "remote", key, url: product.photo_urls[index] ?? "" };
  });
  return next;
}

function slotCaption(photo: SlotPhoto): string {
  if (photo.kind === "file") return photo.file.name;
  return photo.key.split("/").pop() ?? photo.key;
}

const labelClass = "text-text-meta font-mono text-[9.5px] tracking-[0.14em] uppercase";
const fieldClass =
  "border-ink/28 text-ink w-full min-w-0 border-0 border-b bg-transparent px-0.5 py-2.5 text-[14.5px] normal-case tracking-normal outline-none";
const areaClass =
  "border-ink/24 text-ink w-full border bg-transparent p-3 text-sm leading-relaxed normal-case tracking-normal outline-none";

const AUDIENCE = [
  ["mujer", "Mujer"],
  ["hombre", "Hombre"],
  ["unisex", "Unisex"],
] as const;

function useClient(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="border-ink/14 border-b pb-2.5 text-[10.5px] font-medium tracking-[0.16em] uppercase">{title}</h2>
      <div className="grid grid-cols-1 gap-x-4 gap-y-[18px] sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({
  label,
  children,
  full = false,
  hint,
}: {
  label: ReactNode;
  children: ReactNode;
  full?: boolean;
  hint?: string;
}) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label className="flex flex-col gap-[7px]">
        <span className={labelClass}>{label}</span>
        {children}
      </label>
      {hint ? <span className="text-text-meta text-[11.5px] font-light">{hint}</span> : null}
    </div>
  );
}

export function ProductForm({
  client,
  product,
  onClose,
  onCreated,
}: {
  client?: CatalogClient;
  product?: Product;
  onClose?: () => void;
  onCreated?: () => void;
}) {
  const catalog = useMemo(() => client ?? createCatalogClient("/api/catalog"), [client]);
  const token = useSessionStore((state) => state.accessToken);
  const hydrated = useSessionStore((state) => state.hydrated);
  const router = useRouter();
  const replaceRef = useRef(router.replace);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [categoryId, setCategoryId] = useState(product?.category_id ?? "");
  const [tagIds, setTagIds] = useState<string[]>(product?.tag_ids ?? []);
  const [slots, setSlots] = useState<Partial<Record<SlotName, SlotPhoto>>>(() => remoteSlots(product));
  const slotUrls = useRef<string[]>([]);
  const [name, setName] = useState(product?.name ?? "");
  const [lang, setLang] = useState<"es" | "en">("es");
  const [descEn, setDescEn] = useState("");
  const [stock, setStock] = useState("0");
  const [loaded, setLoaded] = useState(false);
  const mounted = useClient();
  const [loadError, setLoadError] = useState<string | null>(null);
  const sessionError = hydrated && !token ? SESSION_DETAIL : null;
  const showLoading = !hydrated || (token !== null && !loaded);
  const [productError, setProductError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [tagError, setTagError] = useState<string | null>(null);
  const stockCount = Number(stock);
  const stockHint = stock !== "" && Number.isFinite(stockCount) && stockCount <= 3 ? "Se mostrará la alerta de stock bajo." : "";

  useEffect(() => {
    replaceRef.current = router.replace;
  }, [router]);

  useEffect(() => {
    slotUrls.current = IMAGE_SLOTS.flatMap((slot) => {
      const photo = slots[slot];
      return photo?.kind === "file" ? [photo.url] : [];
    });
  }, [slots]);

  useEffect(() => {
    return () => {
      for (const url of slotUrls.current) URL.revokeObjectURL(url);
    };
  }, []);

  function chooseSlot(slot: SlotName, file: File) {
    const url = URL.createObjectURL(file);
    setSlots((current) => {
      const previous = current[slot];
      if (previous?.kind === "file") URL.revokeObjectURL(previous.url);
      return { ...current, [slot]: { kind: "file", file, url } };
    });
  }

  function clearSlot(slot: SlotName) {
    setSlots((current) => {
      const previous = current[slot];
      if (previous?.kind === "file") URL.revokeObjectURL(previous.url);
      const next = { ...current };
      delete next[slot];
      return next;
    });
  }

  useEffect(() => {
    if (!onClose) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  useEffect(() => {
    if (!hydrated || !token) return;

    let cancelled = false;
    void (async () => {
      const [categoriesResult, tagsResult] = await Promise.all([
        catalog.listCategories(token),
        catalog.listTags(token),
      ]);
      if (cancelled) return;
      if (isUnauthenticated(categoriesResult) || isUnauthenticated(tagsResult)) {
        endSession((path) => replaceRef.current(path));
        return;
      }
      if (categoriesResult.ok) setCategories(categoriesResult.categories);
      else setLoadError(categoriesResult.detail);
      if (tagsResult.ok) setTags(tagsResult.tags);
      else setLoadError((current) => current ?? tagsResult.detail);
      setLoaded(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [catalog, hydrated, token]);

  function editBody(value: ProductWrite, data: FormData): FormData {
    const body = productFormData({ ...value, photos: [] });
    body.set("brand", String(data.get("brand") ?? ""));
    body.set("sku", String(data.get("sku") ?? ""));
    body.set("bar_code", String(data.get("bar_code") ?? ""));
    body.set("photo_slots", "1");
    body.set("tags_present", "1");
    IMAGE_SLOTS.forEach((slot, index) => {
      const photo = slots[slot];
      if (!photo) return;
      if (photo.kind === "remote") body.set(`slot_key_${index}`, photo.key);
      else body.set(`slot_file_${index}`, photo.file);
    });
    for (const [offset, key] of (product?.photos.slice(IMAGE_SLOTS.length) ?? []).entries()) {
      body.set(`slot_key_${IMAGE_SLOTS.length + offset}`, key);
    }
    return body;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    const data = new FormData(event.currentTarget);
    const draft: Draft = {
      name: String(data.get("name") ?? ""),
      description: String(data.get("description") ?? ""),
      cost: String(data.get("cost") ?? ""),
      price: String(data.get("price") ?? ""),
      type: String(data.get("type") ?? ""),
      visibility: String(data.get("visibility") ?? ""),
      categoryId,
      weight: String(data.get("weight") ?? ""),
      length: String(data.get("length") ?? ""),
      width: String(data.get("width") ?? ""),
      height: String(data.get("height") ?? ""),
      sku: String(data.get("sku") ?? ""),
      barCode: String(data.get("bar_code") ?? ""),
      brand: String(data.get("brand") ?? ""),
      discount: String(data.get("discount") ?? ""),
      family: String(data.get("family") ?? ""),
      sizeMl: String(data.get("size_ml") ?? ""),
      tagIds,
      photos: IMAGE_SLOTS.flatMap((slot) => {
        const photo = slots[slot];
        return photo?.kind === "file" ? [photo.file] : [];
      }),
      keptPhotoCount: product
        ? IMAGE_SLOTS.filter((slot) => slots[slot]?.kind === "remote").length +
          product.photos.slice(IMAGE_SLOTS.length).length
        : 0,
    };
    const validated = validateDraft(draft);
    if (!validated.ok) {
      setProductError(validated.message);
      return;
    }
    setProductError(null);
    const result = product
      ? await catalog.updateProduct(product.id, editBody(validated.value, data), token)
      : await catalog.createProduct(validated.value, token);
    if (isUnauthenticated(result)) {
      endSession((path) => replaceRef.current(path));
      return;
    }
    if (!result.ok) {
      setProductError(result.detail);
      return;
    }
    if (onCreated) onCreated();
    else router.push("/catalogo");
  }

  async function onCreateCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const categoryName = String(data.get("categoryName") ?? "").trim();
    if (!categoryName) {
      setCategoryError("Completá el nombre de la categoría.");
      return;
    }
    const parent = String(data.get("parentId") ?? "");
    const result = await catalog.createCategory({ name: categoryName, parentId: parent || null }, token);
    if (isUnauthenticated(result)) {
      endSession((path) => replaceRef.current(path));
      return;
    }
    if (!result.ok) {
      setCategoryError(result.detail);
      return;
    }
    setCategoryError(null);
    setCategories((current) => [...current, result.category]);
    setCategoryId(result.category.id);
    form.reset();
  }

  async function onCreateTag(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const tagName = String(data.get("tagName") ?? "").trim();
    if (!tagName) {
      setTagError("Completá el nombre del tag.");
      return;
    }
    const result = await catalog.createTag({ name: tagName }, token);
    if (isUnauthenticated(result)) {
      endSession((path) => replaceRef.current(path));
      return;
    }
    if (!result.ok) {
      setTagError(result.detail);
      return;
    }
    setTagError(null);
    setTags((current) => [...current, result.tag]);
    setTagIds((current) => [...current, result.tag.id]);
    form.reset();
  }

  function toggleTag(id: string) {
    setTagIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  const panel = (
    <div className={onClose ? "flex flex-col gap-[26px] px-[26px] py-6" : "flex max-w-[560px] flex-col gap-[26px]"}>
      <div className="border-ink/14 flex items-start justify-between gap-4 border-b pb-[22px]">
        <div className="flex min-w-0 flex-col gap-1.5">
          <p className="text-accent-gold font-mono text-[9.5px] tracking-[0.2em] uppercase">
            {product ? "Editar producto" : "Nuevo producto"}
          </p>
          <p id="product-drawer-title" className="font-display text-[30px] leading-none">
            {name.trim() || "Sin nombre"}
          </p>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-ink -mt-2 -mr-3 flex size-11 items-center justify-center text-[20px]"
          >
            ×
          </button>
        ) : (
          <Link
            href="/catalogo"
            aria-label="Cerrar"
            className="text-ink -mt-2 -mr-3 flex size-11 items-center justify-center text-[20px]"
          >
            ×
          </Link>
        )}
      </div>
      {sessionError ? (
        <p role="alert" className="text-danger text-sm">
          {sessionError}
        </p>
      ) : null}
      {loadError ? (
        <p role="alert" className="text-danger text-sm">
          {loadError}
        </p>
      ) : null}
      {showLoading ? <p className="text-text-meta text-sm">Cargando el catálogo…</p> : null}
      {!showLoading && !sessionError ? (
        <>
          <form onSubmit={onSubmit} className="flex flex-col gap-[26px]" noValidate>
            <div className="border-ink/14 flex gap-[22px] border-b">
              {(["es", "en"] as const).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLang(code)}
                  className={`-mb-px border-b px-0 pt-0 pb-2.5 text-[11px] tracking-[0.14em] uppercase ${
                    lang === code ? "border-ink text-ink" : "text-text-meta border-transparent"
                  }`}
                >
                  {code === "es" ? "Español" : "English"}
                </button>
              ))}
            </div>
            <Group title="Identidad">
              <Field label="Nombre" full>
                <input
                  name="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Khamrah Waha"
                  className={fieldClass}
                />
              </Field>
              <Field label="Marca">
                <input name="brand" placeholder="Lattafa" defaultValue={product?.brand ?? ""} className={fieldClass} />
              </Field>
              <label className="flex flex-col gap-[7px]">
                <span className={labelClass}>Etiqueta</span>
                <input placeholder="Best seller" className={fieldClass} />
              </label>
              <div className={`flex flex-col gap-[7px] sm:col-span-2 ${lang === "es" ? "" : "hidden"}`}>
                <span className={labelClass} aria-hidden="true">
                  Descripción · español
                </span>
                <textarea
                  aria-label="Descripción"
                  name="description"
                  defaultValue={product?.description ?? ""}
                  className={`${areaClass} min-h-28`}
                />
              </div>
              <label className={`flex flex-col gap-[7px] sm:col-span-2 ${lang === "en" ? "" : "hidden"}`}>
                <span className={labelClass}>Descripción · inglés</span>
                <textarea
                  value={descEn}
                  onChange={(event) => setDescEn(event.target.value)}
                  className={`${areaClass} min-h-28`}
                />
                {descEn.trim() ? null : <span className="text-text-meta text-[11.5px] font-light">{EN_MISSING}</span>}
              </label>
            </Group>
            <Group title="Clasificación">
              <Field label="Categoría">
                <select
                  name="category_id"
                  className={fieldClass}
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                >
                  <option value="">Elegí</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </Field>
              <label className="flex flex-col gap-[7px]">
                <span className={labelClass}>Familia olfativa</span>
                <select name="family" defaultValue={product?.family ?? "florales"} className={fieldClass}>
                  {STORE_FAMILIES.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-[7px]">
                <span className={labelClass}>Para</span>
                <select defaultValue="unisex" className={fieldClass}>
                  {AUDIENCE.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-[7px]">
                <span className={labelClass}>Tamaño</span>
                <input
                  name="size_ml"
                  inputMode="numeric"
                  defaultValue={product?.size_ml ?? 100}
                  className={fieldClass}
                />
              </label>
              <Field label="Tipo">
                <select name="type" className={fieldClass} defaultValue={product?.type ?? ""}>
                  <option value="">Elegí</option>
                  <option value="digital">{typeLabel.digital}</option>
                  <option value="physical">{typeLabel.physical}</option>
                </select>
              </Field>
            </Group>
            <Group title="Precio y stock">
              <div className="flex flex-col gap-[7px]">
                <span className={labelClass} aria-hidden="true">
                  Precio (ARS)
                </span>
                <input
                  aria-label="Precio"
                  name="price"
                  inputMode="decimal"
                  defaultValue={product ? String(product.price) : ""}
                  className={fieldClass}
                />
              </div>
              <Field label="Costo">
                <input
                  name="cost"
                  inputMode="decimal"
                  defaultValue={product ? String(product.cost) : ""}
                  className={fieldClass}
                />
              </Field>
              <label className="flex flex-col gap-[7px]">
                <span className={labelClass}>Unidades en stock</span>
                <input
                  inputMode="numeric"
                  value={stock}
                  onChange={(event) => setStock(event.target.value)}
                  className={fieldClass}
                />
                {stockHint ? <span className="text-text-meta text-[11.5px] font-light">{stockHint}</span> : null}
              </label>
              <div className="flex flex-col gap-[7px] sm:col-span-2">
                <span className={labelClass} aria-hidden="true">
                  Visibilidad en la tienda
                </span>
                <select aria-label="Visibilidad" name="visibility" className={fieldClass} defaultValue={product?.visibility ?? ""}>
                  <option value="">Elegí</option>
                  <option value="visible">{visibilityLabel.visible}</option>
                  <option value="hidden">{visibilityLabel.hidden}</option>
                  <option value="not_listed">{visibilityLabel.not_listed}</option>
                </select>
              </div>
              <Field label="Descuento" hint="Se guarda y no modifica el precio.">
                <input
                  name="discount"
                  inputMode="numeric"
                  defaultValue={product?.discount ?? ""}
                  className={fieldClass}
                />
              </Field>
            </Group>
            <section className="flex flex-col gap-3.5">
              <h2 className="border-ink/14 border-b pb-2.5 text-[10.5px] font-medium tracking-[0.16em] uppercase">
                Imágenes
              </h2>
              <div className="grid grid-cols-4 gap-2.5">
                {IMAGE_SLOTS.map((slot) => {
                  const photo = slots[slot];
                  const caption = photo ? slotCaption(photo) : "";
                  return (
                    <div key={slot} className="group relative flex min-w-0 flex-col gap-1.5">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          aria-label={slot}
                          className="sr-only"
                          onChange={(event: ChangeEvent<HTMLInputElement>) => {
                            const file = event.target.files?.[0];
                            if (file) chooseSlot(slot, file);
                          }}
                        />
                        <span className="border-ink/30 text-text-meta relative flex aspect-[4/5] items-end border border-dashed bg-[repeating-linear-gradient(135deg,#EDE7DC_0_7px,#F2EDE4_7px_14px)] p-2 font-mono text-[8.5px] tracking-[0.08em] uppercase">
                          {photo?.url ? (
                            // blob: preview, or a short-lived S3 signature. next/image will not optimize either.
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={photo.url} alt="" className="absolute inset-0 size-full object-cover" />
                          ) : (
                            slot
                          )}
                        </span>
                      </label>
                      {product && photo ? (
                        <button
                          type="button"
                          aria-label="Quitar foto"
                          className="bg-canvas/90 text-ink absolute top-1 right-1 z-10 flex size-6 cursor-pointer items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                          onClick={() => clearSlot(slot)}
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M4 7h16M9 7V5h6v2M7 7l1 12h8l1-12" />
                          </svg>
                        </button>
                      ) : null}
                      {photo ? (
                        <p className="text-text-meta font-mono text-[8.5px] normal-case" title={photo.kind === "file" ? photo.file.name : photo.key}>
                          {shortenFileName(caption)}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>
            <Group title="Medidas y códigos">
              <Field label="Peso">
                <input name="weight" inputMode="decimal" defaultValue={product?.weight ?? ""} className={fieldClass} />
              </Field>
              <Field label="Largo">
                <input name="length" inputMode="decimal" defaultValue={product?.length ?? ""} className={fieldClass} />
              </Field>
              <Field label="Ancho">
                <input name="width" inputMode="decimal" defaultValue={product?.width ?? ""} className={fieldClass} />
              </Field>
              <Field label="Alto">
                <input name="height" inputMode="decimal" defaultValue={product?.height ?? ""} className={fieldClass} />
              </Field>
              <Field label="SKU">
                <input name="sku" defaultValue={product?.sku ?? ""} className={fieldClass} />
              </Field>
              <Field label="Código de barras">
                <input name="bar_code" defaultValue={product?.bar_code ?? ""} className={fieldClass} />
              </Field>
            </Group>
            <fieldset className="flex flex-col gap-2">
              <legend className={labelClass}>Tags</legend>
              {tags.map((tag) => (
                <label key={tag.id} className="flex min-h-11 items-center gap-2 text-sm normal-case">
                  <input type="checkbox" checked={tagIds.includes(tag.id)} onChange={() => toggleTag(tag.id)} />
                  {tag.name}
                </label>
              ))}
            </fieldset>
            {productError ? (
              <p role="alert" className="text-danger text-sm">
                {productError}
              </p>
            ) : null}
            <div className="border-ink flex items-center gap-2.5 border-t py-[18px]">
              {onClose ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="border-border-strong ml-auto border px-[22px] py-3.5 text-[11px] tracking-[0.16em] uppercase"
                >
                  Cancelar
                </button>
              ) : (
                <Link
                  href="/catalogo"
                  className="border-border-strong ml-auto border px-[22px] py-3.5 text-[11px] tracking-[0.16em] uppercase"
                >
                  Cancelar
                </Link>
              )}
              <button
                type="submit"
                className="bg-ink text-canvas hover:bg-accent-gold px-6 py-3.5 text-[11px] tracking-[0.16em] uppercase"
              >
                {product ? "Guardar cambios" : "Crear producto"}
              </button>
            </div>
          </form>
          <form onSubmit={onCreateCategory} className="flex flex-col gap-5" noValidate>
            <Group title="Nueva categoría">
              <Field label="Nombre de la categoría" full>
                <input name="categoryName" className={fieldClass} />
              </Field>
              <Field label="Padre" full>
                <select name="parentId" className={fieldClass} defaultValue="">
                  <option value="">Sin padre</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </Field>
            </Group>
            {categoryError ? (
              <p role="alert" className="text-danger text-sm">
                {categoryError}
              </p>
            ) : null}
            <button
              type="submit"
              className="border-border-strong min-h-11 border px-5 text-[11px] tracking-[0.16em] uppercase"
            >
              Crear categoría
            </button>
          </form>
          <form onSubmit={onCreateTag} className="flex flex-col gap-5" noValidate>
            <Group title="Nuevo tag">
              <Field label="Nombre del tag" full>
                <input name="tagName" className={fieldClass} />
              </Field>
            </Group>
            {tagError ? (
              <p role="alert" className="text-danger text-sm">
                {tagError}
              </p>
            ) : null}
            <button
              type="submit"
              className="border-border-strong min-h-11 border px-5 text-[11px] tracking-[0.16em] uppercase"
            >
              Crear tag
            </button>
          </form>
        </>
      ) : null}
    </div>
  );

  if (!onClose) return panel;
  if (!mounted) return null;

  return createPortal(
    <>
      <div className="bg-ink/50 fixed inset-0 z-50" onClick={onClose} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-drawer-title"
        className="bg-canvas border-ink/14 fixed inset-y-0 right-0 z-[60] w-[560px] max-w-full overflow-y-auto border-l"
      >
        {panel}
      </aside>
    </>,
    document.body,
  );
}
