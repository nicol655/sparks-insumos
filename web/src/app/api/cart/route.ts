import { forwardCart } from "@/lib/cart/proxy";

export function POST(request: Request) {
  return forwardCart(request);
}

export function PUT(request: Request) {
  return forwardCart(request);
}

export function DELETE(request: Request) {
  return forwardCart(request);
}
