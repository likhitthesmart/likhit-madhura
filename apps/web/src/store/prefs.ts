"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "@/lib/api";
import { useAuth } from "./auth";

// recently viewed products (device-local) + recent searches (per account, server-side)
interface Prefs {
  recentlyViewed: { slug: string; name: string; image: string | null; price: number; unit: string }[];
  recentSearches: string[];
  viewProduct: (p: Prefs["recentlyViewed"][number]) => void;
  addSearch: (q: string) => void;
  loadSearches: () => Promise<void>;
}

export const usePrefs = create<Prefs>()(
  persist(
    (set, get) => ({
      recentlyViewed: [],
      recentSearches: [],
      viewProduct: (p) =>
        set((s) => ({
          recentlyViewed: [p, ...s.recentlyViewed.filter((x) => x.slug !== p.slug)].slice(0, 8),
        })),
      addSearch: (q) => {
        const recentSearches = [q, ...get().recentSearches.filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 6);
        set({ recentSearches });
        const token = useAuth.getState().accessToken;
        if (token)
          void api("/account/searches", { method: "PUT", token, body: JSON.stringify({ recentSearches }) }).catch(() => undefined);
      },
      // signed out (or the fetch fails) → empty, so the next account starts clean
      loadSearches: async () => {
        const token = useAuth.getState().accessToken;
        if (!token) {
          set({ recentSearches: [] });
          return;
        }
        try {
          const d = await api<{ recentSearches: string[] }>("/account/searches", { token });
          set({ recentSearches: d.recentSearches });
        } catch {
          set({ recentSearches: [] });
        }
      },
    }),
    /* recentSearches is deliberately left out of the persisted slice — in localStorage
       it showed one user's history to the next person signing in on the same browser. */
    { name: "madhura-prefs", partialize: (s) => ({ recentlyViewed: s.recentlyViewed }) }
  )
);
