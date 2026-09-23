import { env } from "@/lib/env";
import { createHttpCatalogRepository } from "@/lib/api/http-repository";
import { createMockCatalogRepository } from "@/lib/api/mock-repository";
import type { CatalogRepository } from "@/lib/api/repository";

/**
 * The single place that decides where catalogue data comes from. Switching to
 * the real backend is API_MODE=http plus API_BASE_URL — no component changes.
 */
let repository: CatalogRepository | null = null;

export function catalogRepository(): CatalogRepository {
  if (!repository) {
    repository =
      env.API_MODE === "http"
        ? // Guaranteed by the env schema: API_BASE_URL is required in http mode.
          createHttpCatalogRepository(env.API_BASE_URL as string)
        : createMockCatalogRepository();
  }

  return repository;
}

export { catalogQuerySchema } from "@/lib/api/contract";
export type {
  CatalogQuery,
  CatalogQueryInput,
  Facets,
  Product,
  ProductList,
  ProductSort,
} from "@/lib/api/contract";
export type { CatalogRepository } from "@/lib/api/repository";
