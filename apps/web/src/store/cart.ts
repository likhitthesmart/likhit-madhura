"use client";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useAuth } from "@/store/auth";
import { mergeItems } from "@/lib/cart-merge";

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  unit: string;
  image: string | null;
  price: number;
  mrp: number;
  qty: number;
}

interface CartState {
  items: CartItem[];
  savedForLater: CartItem[];
  couponCode: string | null;
  pincode: string | null;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  remove: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  saveForLater: (productId: string) => void;
  moveToCart: (productId: string) => void;
  removeSaved: (productId: string) => void;
  setCoupon: (code: string | null) => void;
  setPincode: (pin: string | null) => void;
  clear: () => void;
}

const userStorage = createJSONStorage<CartState>(() => localStorage);

// One storage key per signed-in user, so a cart never leaks between accounts on a shared device.
function cartKey(userId: string | null) {
  return userId ? `madhura-cart-${userId}` : "madhura-cart-guest";
}


export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      savedForLater: [],
      couponCode: null,
      pincode: null,
      add: (item, qty = 1) =>
        set((s) => {
          const existing = s.items.find((i) => i.productId === item.productId);
          return existing
            ? { items: s.items.map((i) => (i.productId === item.productId ? { ...i, qty: Math.min(20, i.qty + qty) } : i)) }
            : { items: [...s.items, { ...item, qty }] };
        }),
      remove: (productId) => set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),
      setQty: (productId, qty) =>
        set((s) => ({
          items:
            qty <= 0
              ? s.items.filter((i) => i.productId !== productId)
              : s.items.map((i) => (i.productId === productId ? { ...i, qty: Math.min(20, qty) } : i)),
        })),
      saveForLater: (productId) =>
        set((s) => {
          const item = s.items.find((i) => i.productId === productId);
          if (!item) return s;
          return {
            items: s.items.filter((i) => i.productId !== productId),
            savedForLater: [...s.savedForLater.filter((i) => i.productId !== productId), item],
          };
        }),
      moveToCart: (productId) =>
        set((s) => {
          const item = s.savedForLater.find((i) => i.productId === productId);
          if (!item) return s;
          return {
            savedForLater: s.savedForLater.filter((i) => i.productId !== productId),
            items: [...s.items.filter((i) => i.productId !== productId), item],
          };
        }),
      removeSaved: (productId) => set((s) => ({ savedForLater: s.savedForLater.filter((i) => i.productId !== productId) })),
      setCoupon: (couponCode) => set({ couponCode }),
      setPincode: (pincode) => set({ pincode }),
      clear: () => set({ items: [], couponCode: null }),
    }),
    /* Guests persist too — the shop takes guest orders, so losing the basket on a
       refresh cost real checkouts. skipHydration because reading localStorage during
       the hydrating render would make the header's cart count disagree with the
       server HTML; Providers calls rehydrate() once mounted instead. */
    { name: cartKey(null), storage: userStorage, skipHydration: true }
  )
);

export const cartCount = (items: CartItem[]) => items.reduce((n, i) => n + i.qty, 0);

const empty = { items: [], savedForLater: [], couponCode: null, pincode: null };

useAuth.subscribe((s, prev) => {
  const id = s.user?.id ?? null;
  if (id === (prev.user?.id ?? null)) return;
  /* Anything in the basket at the moment of sign-in was put there as a guest, so it
     merges into the account's saved cart rather than being overwritten by it —
     otherwise the shopper loses their basket at the exact moment they log in to pay.
     Signing OUT still drops to empty: the next person on this device must not inherit
     the previous account's items. */
  const guestItems = prev.user ? [] : useCart.getState().items;
  const stored = id ? userStorage?.getItem(cartKey(id)) : null;
  useCart.persist.setOptions({ name: cartKey(id), storage: userStorage });
  void Promise.resolve(stored).then((v) => {
    if (!id) return useCart.setState(empty);
    const saved = { ...empty, ...v?.state };
    useCart.setState({ ...saved, items: mergeItems(saved.items, guestItems) });
  });
});
