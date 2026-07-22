"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

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
    { name: "madhura-cart" }
  )
);

export const cartCount = (items: CartItem[]) => items.reduce((n, i) => n + i.qty, 0);
