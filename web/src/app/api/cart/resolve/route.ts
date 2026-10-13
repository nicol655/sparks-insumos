import { resolveCartRequest } from "@/lib/cart/proxy";

export function POST(request: Request) {
  return resolveCartRequest(request);
}
