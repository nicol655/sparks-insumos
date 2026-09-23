import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Badge } from "@/components/primitives/badge";
import { DetailsAccordion } from "@/components/product/details-accordion";
import { Gallery } from "@/components/product/gallery";
import { OlfactivePyramid } from "@/components/product/olfactive-pyramid";
import { PurchaseBlock } from "@/components/product/purchase-block";
import { Related } from "@/components/product/related";
import { SpecTable } from "@/components/product/spec-table";
import { catalogQuerySchema, catalogRepository } from "@/lib/api";
import { routing } from "@/i18n/routing";
import { seoMetadata } from "@/lib/seo";

export async function generateStaticParams() {
  const { items } = await catalogRepository().listProducts(
    catalogQuerySchema.parse({}),
    routing.defaultLocale,
  );

  return items.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/catalogo/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const resolved = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
  const t = await getTranslations({ locale: resolved, namespace: "product" });
  const product = await catalogRepository().getProduct(slug, resolved);

  if (!product) {
    const missing = await getTranslations({ locale: resolved, namespace: "notFound" });
    return { title: missing("title") };
  }

  return seoMetadata({
    locale: resolved,
    pathname: "/catalogo/[slug]",
    params: { slug },
    title: t("metaTitle", { brand: product.brand, name: product.name }),
    description: product.description,
  });
}

export default async function ProductPage({
  params,
}: PageProps<"/[locale]/catalogo/[slug]">) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);

  const repository = catalogRepository();
  const [product, related] = await Promise.all([
    repository.getProduct(slug, locale),
    repository.getRelated(slug, locale),
  ]);

  if (!product) notFound();

  return (
    <main>
      <div className="px-gutter flex flex-col gap-[30px] pt-section lg:grid lg:grid-cols-2 lg:items-start lg:gap-[30px]">
        <div className="lg:sticky lg:top-[74px] lg:self-start">
          <Gallery product={product} />
        </div>

        <div className="min-w-0 p-[clamp(30px,4vw,48px)] lg:px-0 lg:pt-[clamp(30px,4vw,48px)]">
          <p className="font-mono text-mono-meta text-text-meta mb-3 tracking-[0.12em] uppercase">
            {product.brand}
            {product.badge ? (
              <span className="ml-3 align-middle">
                <Badge>{product.badge}</Badge>
              </span>
            ) : null}
          </p>
          <h1 className="text-h1-page font-display">{product.name}</h1>
          <p className="text-body-m text-text-muted mt-3 mb-8">
            {product.concentration} · {product.size.label}
          </p>
          <PurchaseBlock product={product} />
          <div className="mt-12 flex flex-col gap-12">
            <OlfactivePyramid product={product} />
            <SpecTable product={product} />
            <DetailsAccordion product={product} />
          </div>
        </div>
      </div>

      <Related products={related} />
    </main>
  );
}
