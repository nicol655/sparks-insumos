import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { BrandMarquee } from "@/components/home/brand-marquee";
import { Club } from "@/components/home/club";
import { CommerceStrip } from "@/components/home/commerce-strip";
import { Featured } from "@/components/home/featured";
import { Hero } from "@/components/home/hero";
import { OlfactiveFamilies } from "@/components/home/olfactive-families";
import { catalogQuerySchema, catalogRepository } from "@/lib/api";
import { routing } from "@/i18n/routing";

const FEATURED_LIMIT = 4;

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);

  const repository = catalogRepository();
  const query = catalogQuerySchema.parse({});
  const [list, facets] = await Promise.all([
    repository.listProducts(query, locale),
    repository.getFacets(locale),
  ]);

  const featured = list.items.filter((product) => product.stock > 0).slice(0, FEATURED_LIMIT);

  return (
    <main>
      <Hero catalogSize={list.total} />
      <BrandMarquee brands={facets.brands.map((brand) => brand.value)} />
      <OlfactiveFamilies families={facets.families} />
      <Featured products={featured} />
      <Club />
      <CommerceStrip />
    </main>
  );
}
