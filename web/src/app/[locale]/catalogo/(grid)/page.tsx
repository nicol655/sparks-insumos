import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { ActiveFilters } from "@/components/catalog/active-filters";
import { EmptyState } from "@/components/catalog/empty-state";
import { FilterSidebar } from "@/components/catalog/filter-sidebar";
import { ProductGrid } from "@/components/catalog/product-grid";
import { SortSelect } from "@/components/catalog/sort-select";
import { catalogQuerySchema, catalogRepository } from "@/lib/api";
import { unavailableFacets } from "@/lib/catalog/query";
import { fromSearchValues } from "@/lib/catalog/search-params";
import { routing } from "@/i18n/routing";
import { seoMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/catalogo">): Promise<Metadata> {
  const { locale } = await params;
  const resolved = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
  const t = await getTranslations({ locale: resolved, namespace: "catalog" });
  const meta = await getTranslations({ locale: resolved, namespace: "metadata" });

  return seoMetadata({
    locale: resolved,
    pathname: "/catalogo",
    title: t("title"),
    description: meta("description"),
  });
}

export default async function CatalogPage({
  params,
  searchParams,
}: PageProps<"/[locale]/catalogo">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);

  const query = fromSearchValues(await searchParams);
  const repository = catalogRepository();
  const [list, facets, all] = await Promise.all([
    repository.listProducts(query, locale),
    repository.getFacets(locale),
    repository.listProducts(catalogQuerySchema.parse({}), locale),
  ]);
  const unavailable = unavailableFacets(all.items, query, facets);
  const t = await getTranslations();

  return (
    <main className="px-gutter py-section">
      <div className="mb-10">
        <p className="font-mono text-text-meta text-[10px] tracking-[0.16em] uppercase">
          {t("catalog.crumb", { count: list.total })}
        </p>
        <h1 className="text-h1-page font-display mt-3">{t("catalog.title")}</h1>
      </div>

      <div className="flex flex-col gap-[26px] xl:grid xl:grid-cols-[268px_minmax(0,1fr)] xl:items-start xl:gap-[30px]">
        <aside className="xl:sticky xl:top-[90px] xl:self-start">
          <FilterSidebar query={query} facets={facets} unavailable={unavailable} />
        </aside>

        <div className="min-w-0">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <ActiveFilters query={query} />
            <div className="md:ml-auto">
              <SortSelect query={query} />
            </div>
          </div>
          {list.total === 0 ? (
            <EmptyState />
          ) : (
            <ProductGrid products={list.items} label={t("catalog.results")} />
          )}
        </div>
      </div>
    </main>
  );
}
