import { notFound } from "next/navigation";

/**
 * Anything under a locale that no route claims. Without it Next would look for
 * a global not-found page, which cannot render: the root layout lives inside
 * the [locale] segment.
 */
export default function CatchAllPage() {
  notFound();
}
