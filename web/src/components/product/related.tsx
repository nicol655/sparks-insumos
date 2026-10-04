import { useLocale, useTranslations } from "next-intl";

import { Packshot } from "@/components/catalog/packshot";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/locales";
import type { Product } from "@/lib/api/contract";
import { formatPrice } from "@/lib/format/price";

type Props = {
  products: Product[];
};

/**
 * T365 · the related block stays on the page. An empty list is a line of
 * copy, not a hidden section and not a second request.
 */
export function Related({ products }: Props) {
  const t = useTranslations();
  const locale = useLocale() as Locale;

  return (
    <section className="px-[clamp(20px,4.4vw,64px)] pt-[clamp(46px,5vw,70px)] pb-[clamp(56px,6vw,90px)]">
      <h2 className="font-display mb-8 text-[clamp(26px,3vw,38px)] font-normal">
        {t("product.related")}
      </h2>
      {products.length === 0 ? (
        <p className="text-text-muted py-[18px] text-left text-[13.5px] not-italic">
          {t("product.relatedEmpty")}
        </p>
      ) : (
        <ul
          aria-label={t("product.relatedList")}
          className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,230px),1fr))] gap-[26px]"
        >
          {products.map((product) => (
            <li key={product.id} className="flex flex-col gap-3">
              <Link
                href={{ pathname: "/catalogo/[slug]", params: { slug: product.slug } }}
                aria-label={t("catalog.viewProduct", { name: product.name })}
                className="group flex flex-col gap-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                <div className="border-border-hairline overflow-hidden border group-hover:border-ink">
                  <Packshot alt={product.images.alt} src={product.images.packshot} ratio="3 / 3.5" />
                </div>
                <span className="font-display text-[19px] leading-[1.15]">{product.name}</span>
              </Link>
              <p className="text-text-muted text-[14px]">{formatPrice(product.price.amount, locale)}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
