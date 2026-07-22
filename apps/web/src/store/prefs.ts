"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

// recently viewed products + recent searches
interface Prefs {
  recentlyViewed: { slug: string; name: string; image: string | null; price: number; unit: string }[];
  recentSearches: string[];
  viewProduct: (p: Prefs["recentlyViewed"][number]) => void;
  addSearch: (q: string) => void;
}

export const usePrefs = create<Prefs>()(
  persist(
    (set) => ({
      recentlyViewed: [],
      recentSearches: [],
      viewProduct: (p) =>
        set((s) => ({
          recentlyViewed: [p, ...s.recentlyViewed.filter((x) => x.slug !== p.slug)].slice(0, 8),
        })),
      addSearch: (q) =>
        set((s) => ({
          recentSearches: [q, ...s.recentSearches.filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 6),
        })),
    }),
    { name: "madhura-prefs" }
  )
);
