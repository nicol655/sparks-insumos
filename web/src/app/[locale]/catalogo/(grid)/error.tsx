"use client";

import { ErrorState } from "@/components/catalog/error-state";

export default function CatalogError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="px-gutter py-section">
      <ErrorState onRetry={reset} />
    </main>
  );
}
