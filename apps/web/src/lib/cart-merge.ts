/* Kept out of store/cart.ts so it stays importable by a plain node script — that
   module is "use client", pulls in zustand and resolves @/ aliases. Generic over the
   two fields it touches for the same reason: no dependency on CartItem. */

/** Union of two baskets. The same product in both has its quantities added, capped at
 *  the 20 the checkout API accepts (cartBody, api/src/routes/orders.ts). Neither input
 *  is mutated; `base` order wins, `extra`-only items append. */
export function mergeItems<T extends { productId: string; qty: number }>(base: T[], extra: T[]): T[] {
  const by = new Map(base.map((i) => [i.productId, { ...i }]));
  for (const i of extra) {
    const hit = by.get(i.productId);
    if (hit) hit.qty = Math.min(20, hit.qty + i.qty);
    else by.set(i.productId, { ...i });
  }
  return [...by.values()];
}
