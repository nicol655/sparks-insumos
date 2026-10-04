import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { DetailsAccordion } from "@/components/product/details-accordion";
import { Gallery } from "@/components/product/gallery";
import { OlfactivePyramid } from "@/components/product/olfactive-pyramid";
import { ProductCrumb, ProductIntro } from "@/components/product/product-intro";
import { PurchaseBlock } from "@/components/product/purchase-block";
import { Related } from "@/components/product/related";
import { SpecTable } from "@/components/product/spec-table";
import { catalogQuerySchema, catalogRepository } from "@/lib/api";
import { routing } from "@/i18n/routing";
import { env } from "@/lib/env";
import { seoMetadata } from "@/lib/seo";

export async function generateStaticParams() {
  // The live catalogue changes in the backoffice. Prebuilding every id
  // would freeze the set at `next build` and require the API to be up.
  if (env.API_MODE === "http") return [];

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
      <ProductCrumb name={product.name} />
      <section className="border-border-hairline grid items-start border-b lg:grid-cols-2">
        <div className="border-border-hairline min-w-0 p-7 lg:border-r xl:sticky xl:top-[74px] xl:self-start">
          <Gallery product={product} />
        </div>

        <div className="flex min-w-0 flex-col gap-6 px-[clamp(20px,3.8vw,52px)] pt-[clamp(30px,4vw,48px)] pb-[clamp(44px,5vw,66px)]">
          <ProductIntro product={product} />
          <PurchaseBlock product={product} />
          <OlfactivePyramid product={product} />
          <SpecTable product={product} />
          <DetailsAccordion />
        </div>
      </section>

      <Related products={related} />
    </main>
  );
}
