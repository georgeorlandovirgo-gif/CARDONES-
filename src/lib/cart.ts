export type CartLine = { productId: string; variantId: string; quantity: number };
export const CART_KEY = "cardones-shopping-bag-v1";
export function cleanCart(input: unknown): CartLine[] {
  if (!Array.isArray(input)) return [];
  return input.slice(0, 40).flatMap((line: unknown) => {
    if (!line || typeof line !== "object") return [];
    const v = line as Record<string, unknown>;
    if (typeof v.productId !== "string" || typeof v.variantId !== "string" || !Number.isInteger(v.quantity)) return [];
    if ((v.quantity as number) < 1 || (v.quantity as number) > 20) return [];
    return [{ productId: v.productId, variantId: v.variantId, quantity: v.quantity as number }];
  });
}