"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import type { Category } from "@/lib/api";
import { cn } from "@/lib/format";

const sorts = [
  { v: "popular", l: "Most popular" },
  { v: "newest", l: "Newest" },
  { v: "price_asc", l: "Price: low to high" },
  { v: "price_desc", l: "Price: high to low" },
  { v: "rating", l: "Top rated" },
];

const toggles = [
  { key: "inStock", label: "In stock" },
  { key: "organic", label: "Certified organic" },
  { key: "bestSeller", label: "Bestsellers" },
  { key: "discounted", label: "On offer" },
];

export function Filters({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [open, setOpen] = useState(false);

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(sp.toString());
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
      next.delete("page");
      router.push(`/shop?${next.toString()}`, { scroll: false });
    },
    [router, sp]
  );

  const category = sp.get("category");
  const sort = sp.get("sort") ?? "popular";
  const hasFilters = ["category", "minPrice", "maxPrice", "inStock", "organic", "bestSeller", "discounted", "minRating", "q"].some((k) => sp.get(k));

  const body = (
    <div className="space-y-8">
      <div>
        <p className="label-field">Sort by</p>
        <select value={sort} onChange={(e) => setParam("sort", e.target.value)} className="input-field" aria-label="Sort products">
          {sorts.map((o) => (
            <option key={o.v} value={o.v}>{o.l}</option>
          ))}
        </select>
      </div>
      <div>
        <p className="label-field">Category</p>
        <ul className="space-y-1">
          <li>
            <button onClick={() => setParam("category", null)} className={cn("w-full rounded-lg px-3 py-2 text-left text-sm transition", !category ? "bg-forest-50 font-semibold text-forest-800" : "text-bark hover:bg-cream")}>
              All products
            </button>
          </li>
          {categories.map((c) => (
            <li key={c.slug}>
              <button
                onClick={() => setParam("category", c.slug)}
                className={cn("flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition", category === c.slug ? "bg-forest-50 font-semibold text-forest-800" : "text-bark hover:bg-cream")}
              >
                {c.name}
                <span className="text-xs text-bark/40">{c._count?.products}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="label-field">Price (₹)</p>
        <div className="flex items-center gap-2">
          <input type="number" min={0} placeholder="Min" defaultValue={sp.get("minPrice") ?? ""} onBlur={(e) => setParam("minPrice", e.target.value || null)} className="input-field" aria-label="Minimum price" />
          <span className="text-bark/40">–</span>
          <input type="number" min={0} placeholder="Max" defaultValue={sp.get("maxPrice") ?? ""} onBlur={(e) => setParam("maxPrice", e.target.value || null)} className="input-field" aria-label="Maximum price" />
        </div>
      </div>
      <div>
        <p className="label-field">Rating</p>
        <div className="flex gap-2">
          {[4, 3].map((r) => (
            <button
              key={r}
              onClick={() => setParam("minRating", sp.get("minRating") === String(r) ? null : String(r))}
              className={cn("rounded-full border px-4 py-1.5 text-sm transition", sp.get("minRating") === String(r) ? "border-forest-600 bg-forest-50 text-forest-800" : "border-sand-dark text-bark")}
            >
              {r}★ & up
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2.5">
        {toggles.map((t) => (
          <label key={t.key} className="flex cursor-pointer items-center gap-3 text-sm text-bark">
            <input
              type="checkbox"
              checked={sp.get(t.key) === "true"}
              onChange={(e) => setParam(t.key, e.target.checked ? "true" : null)}
              className="h-4 w-4 rounded border-sand-dark accent-forest-700"
            />
            {t.label}
          </label>
        ))}
      </div>
      {hasFilters && (
        <button onClick={() => router.push("/shop")} className="btn-secondary w-full py-2 text-xs">
          <X className="h-3.5 w-3.5" /> Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-secondary lg:hidden">
        <SlidersHorizontal className="h-4 w-4" /> Filters & sort
      </button>
      <aside className="hidden lg:block" aria-label="Product filters">
        <div className="sticky top-24 card-organic p-6">{body}</div>
      </aside>
      {open && (
        <div className="fixed inset-0 z-[60] bg-deep-950/40 lg:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-y-0 left-0 w-[min(320px,85vw)] overflow-y-auto bg-surface p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between">
              <p className="font-display text-xl text-forest-900">Filters</p>
              <button onClick={() => setOpen(false)} aria-label="Close filters"><X className="h-5 w-5" /></button>
            </div>
            {body}
          </div>
        </div>
      )}
    </>
  );
}
