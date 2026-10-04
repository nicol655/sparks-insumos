"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Packshot } from "@/components/catalog/packshot";
import type { Product } from "@/lib/api/contract";

export const THUMB_COUNT = 3;

/** Three slots. A missing photo stays empty instead of repeating the packshot. */
export function gallerySources(product: Product): Array<string | null> {
  const thumbs: Array<string | null> = [...product.images.thumbnails];
  while (thumbs.length < THUMB_COUNT) thumbs.push(null);

  return thumbs.slice(0, THUMB_COUNT);
}

type Props = {
  product: Product;
};

/**
 * T361 · hero starts on the first photo. A thumbnail with a URL replaces it;
 * clicking that thumbnail again restores the packshot. An empty slot is not a button.
 */
export function Gallery({ product }: Props) {
  const t = useTranslations();
  const thumbs = gallerySources(product);
  const [selected, setSelected] = useState<number | null>(null);
  const current = selected === null ? product.images.packshot : (thumbs[selected] ?? product.images.packshot);

  return (
    <figure aria-label={t("product.gallery", { name: product.name })}>
      <div className="border-border-hairline overflow-hidden border">
        <Packshot
          alt={product.images.alt}
          src={current}
          ratio="4 / 5"
          priority
          sizes="(min-width: 1140px) 50vw, 100vw"
          className="max-h-[62vh]"
        />
      </div>
      <ul className="mt-3 grid grid-cols-3 gap-3">
        {thumbs.map((src, index) => {
          const pressed = selected === index;

          return (
            <li key={index}>
              {src ? (
                <button
                  type="button"
                  aria-pressed={pressed}
                  aria-label={t("product.thumbnail", { n: index + 1, name: product.name })}
                  onClick={() => setSelected(pressed ? null : index)}
                  className={[
                    "block w-full overflow-hidden border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
                    pressed ? "border-ink" : "border-border-hairline hover:border-ink/40",
                  ].join(" ")}
                >
                  <Packshot
                    alt={product.images.alt}
                    src={src}
                    ratio="1 / 1"
                    intrinsicWidth={400}
                    sizes="120px"
                  />
                </button>
              ) : (
                <div className="border-border-hairline block w-full overflow-hidden border">
                  <Packshot alt={product.images.alt} src={null} ratio="1 / 1" intrinsicWidth={400} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </figure>
  );
}
