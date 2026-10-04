import { createCatalogHandlers } from "@/lib/catalog/proxy";

const handlers = createCatalogHandlers("/product-categories");

export function GET(request: Request) {
  return handlers.GET(request);
}

export function POST(request: Request) {
  return handlers.POST(request);
}
