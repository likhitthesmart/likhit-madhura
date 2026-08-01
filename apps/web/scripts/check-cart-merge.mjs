/* Guest basket merging into the account basket at sign-in. The qty cap is the part
   worth pinning: the checkout API rejects qty > 20, so a merge that simply adds would
   build a cart that 400s at the very end. Run: npm run check:cart */
import assert from "node:assert/strict";
import { mergeItems } from "../src/lib/cart-merge.ts";

const i = (productId, qty) => ({ productId, qty });

// disjoint baskets: everything survives, saved items first
assert.deepEqual(mergeItems([i("a", 1)], [i("b", 2)]), [i("a", 1), i("b", 2)]);

// same product in both: quantities add
assert.deepEqual(mergeItems([i("a", 2)], [i("a", 3)]), [i("a", 5)]);

// the cap holds — 15 + 12 must not become 27 and 400 at checkout
assert.deepEqual(mergeItems([i("a", 15)], [i("a", 12)]), [i("a", 20)]);

// either side empty is a no-op
assert.deepEqual(mergeItems([], [i("a", 1)]), [i("a", 1)]);
assert.deepEqual(mergeItems([i("a", 1)], []), [i("a", 1)]);

// neither input is mutated — the stores hold references to these objects
const saved = [i("a", 1)];
const guest = [i("a", 4)];
mergeItems(saved, guest);
assert.equal(saved[0].qty, 1, "base must not be mutated");
assert.equal(guest[0].qty, 4, "extra must not be mutated");

// extra fields ride along (name, price, image) rather than being dropped
assert.deepEqual(mergeItems([], [{ productId: "a", qty: 1, name: "Ghee", price: 599 }]), [
  { productId: "a", qty: 1, name: "Ghee", price: 599 },
]);

console.log("cart merge checks passed");
