import { getTranslations } from "next-intl/server";

import { SkeletonImage, SkeletonLine } from "@/components/primitives/skeleton";

export default async function ProductLoading() {
  const t = await getTranslations();

  return (
    <main className="px-gutter pt-section" aria-busy="true">
      <div
        role="status"
        aria-label={t("common.loading")}
        className="flex flex-col gap-[30px] lg:grid lg:grid-cols-2 lg:gap-[30px]"
      >
        <SkeletonImage ratio="4 / 5" />
        <div className="flex flex-col gap-4 p-[clamp(30px,4vw,48px)] lg:px-0">
          <SkeletonLine width="30%" />
          <SkeletonLine width="55%" />
          <SkeletonLine width="40%" />
          <SkeletonLine width="25%" />
        </div>
      </div>
    </main>
  );
}
