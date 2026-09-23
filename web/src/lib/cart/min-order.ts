/**
 * 005 / constitution §8 · the cart does not build an order WhatsApp link
 * below this merchandise subtotal (shipping is quoted separately).
 */
export const CART_MIN_SUBTOTAL = 30_000;

export function meetsCartMinimum(subtotal: number): boolean {
  return subtotal >= CART_MIN_SUBTOTAL;
}
