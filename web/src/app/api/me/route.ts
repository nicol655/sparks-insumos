import { forwardMe } from "@/lib/cart/proxy";

export function GET(request: Request) {
  return forwardMe(request);
}
