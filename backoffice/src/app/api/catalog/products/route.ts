import { createCatalogHandlers } from "@/lib/catalog/proxy";

const handlers = createCatalogHandlers("/products");

export function GET(request: Request) {
  return handlers.GET(request);
}

export function POST(request: Request) {
  return handlers.POST(request);
}
