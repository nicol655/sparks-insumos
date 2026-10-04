import { useTranslations } from "next-intl";

import { GOLD_KICKER } from "@/components/primitives/gold-kicker";
import { Link } from "@/i18n/navigation";
import type { Product } from "@/lib/api/contract";
import { FAMILY_MESSAGE, isFamilySlug } from "@/lib/catalog/families";

const CRUMB_LINK =
  "inline-flex min-h-11 items-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

type CrumbProps = {
  name: string;
};

/**
 * T360 · breadcrumb from the artifact. Home and catalogue are links;
 * the current name is not.
 */
export function ProductCrumb({ name }: CrumbProps) {
  const t = useTranslations();

  return (
    <div className="border-border-hairline text-text-meta flex gap-[10px] border-b px-[clamp(20px,4.4vw,64px)] py-4 font-mono text-[10px] tracking-[0.14em] uppercase">
      <Link href="/" className={CRUMB_LINK}>
        {t("nav.home")}
      </Link>
      <span aria-hidden="true" className="inline-flex min-h-11 items-center">
        {t("product.crumbSep")}
      </span>
      <Link href="/catalogo" className={CRUMB_LINK}>
        {t("nav.catalog")}
      </Link>
      <span aria-hidden="true" className="inline-flex min-h-11 items-center">
        {t("product.crumbSep")}
      </span>
      <span className="text-ink inline-flex min-h-11 items-center">{name}</span>
    </div>
  );
}

type IntroProps = {
  product: Product;
};

/** T360 · brand · family, the name, and the description the API already returns. */
export function ProductIntro({ product }: IntroProps) {
  const t = useTranslations();
  const parts = [
    product.brand.trim(),
    isFamilySlug(product.family) ? t(FAMILY_MESSAGE[product.family]) : "",
  ].filter((part) => part.length > 0);

  return (
    <div className="flex flex-col gap-3">
      {parts.length > 0 ? <p className={GOLD_KICKER}>{parts.join(" · ")}</p> : null}
      <h1 className="font-display text-[clamp(34px,4.4vw,56px)] leading-[1.02] font-normal">
        {product.name}
      </h1>
      <p className="text-text-muted max-w-[48ch] text-[14px] leading-[1.7] font-light">
        {product.description}
      </p>
    </div>
  );
}
