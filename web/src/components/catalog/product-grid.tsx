import { ProductCard } from "@/components/catalog/product-card";
import { SkeletonImage, SkeletonLine } from "@/components/primitives/skeleton";
import type { Product } from "@/lib/api/contract";

type Props = {
  products: Product[];
  /** Already translated, e.g. "Resultados". */
  label: string;
};

const GRID =
  "grid [grid-template-columns:repeat(auto-fill,minmax(250px,1fr))] gap-x-grid-x gap-y-grid-y";

/**
 * T061 · catalogue list. `ul`/`li` (RNF-2), auto-fill from 250px, 26/30px gap
 * via the §04 grid tokens.
 */
export function ProductGrid({ products, label }: Props) {
  return (
    <ul aria-label={label} className={GRID}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </ul>
  );
}

export function ProductGridSkeleton({
  label,
  count = 8,
}: {
  label: string;
  count?: number;
}) {
  return (
    <ul role="status" aria-label={label} aria-busy="true" className={GRID}>
      {Array.from({ length: count }, (_, index) => (
        <li key={index} aria-hidden="true">
          <div className="flex flex-col gap-[13px]">
            <SkeletonImage />
            <SkeletonLine width="80%" />
            <SkeletonLine width="80%" />
            <SkeletonLine width="45%" />
          </div>
        </li>
      ))}
    </ul>
  );
}
