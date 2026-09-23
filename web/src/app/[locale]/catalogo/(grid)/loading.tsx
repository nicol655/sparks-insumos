import { getTranslations } from "next-intl/server";

import { ProductGridSkeleton } from "@/components/catalog/product-grid";

export default async function CatalogLoading() {
  const t = await getTranslations();

  return (
    <main className="px-gutter py-section">
      <h1 className="text-h1-page font-display mb-10">{t("catalog.title")}</h1>
      <ProductGridSkeleton label={t("common.loading")} />
    </main>
  );
}
