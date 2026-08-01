"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import type { Category } from "@/lib/api";
import { cn } from "@/lib/format";
import { scrollToTop, useBodyScrollLock } from "@/components/layout/providers";

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

/* The filter rail is only 260px wide, so these two share it with a separator and a
   button. min-w-0 lets them shrink (input-field is w-full), tighter padding buys back
   room, and the number spinners are dropped — they steal ~20px each and nobody steps
   a price in ones. */
const priceInput =
  "input-field min-w-0 flex-1 px-2.5 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

export function Filters({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [open, setOpen] = useState(false);

  // the page behind must not keep scrolling while the drawer is open
  useBodyScrollLock(open);

  /* Every filter change lands the customer at the top of the new results.
     `scroll: false` alone left them wherever they were, and since a filter usually
     makes the grid SHORTER, the browser clamped that position to the new document
     height — picking a category with few products dumped you at the footer. Whether
     it happened at all depended on the category's product count, which is why it
     looked random. Also closes the drawer so the results are actually visible. */
  const commit = useCallback(
    (next: URLSearchParams) => {
      next.delete("page");
      setOpen(false);
      router.push(`/shop?${next.toString()}`, { scroll: false });
      scrollToTop();
    },
    [router]
  );

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(sp.toString());
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
      commit(next);
    },
    [commit, sp]
  );

  /* Price is committed explicitly rather than on every keystroke, so the boxes need
     their own state — but it must follow the URL, or "Clear all filters" leaves the
     old numbers sitting in the inputs while the results reset. */
  const urlMin = sp.get("minPrice") ?? "";
  const urlMax = sp.get("maxPrice") ?? "";
  const [minPrice, setMinPrice] = useState(urlMin);
  const [maxPrice, setMaxPrice] = useState(urlMax);
  useEffect(() => {
    setMinPrice(urlMin);
    setMaxPrice(urlMax);
  }, [urlMin, urlMax]);

  // both bounds in one navigation — setting them separately fired two round trips
  const applyPrice = useCallback(() => {
    if (minPrice === urlMin && maxPrice === urlMax) return;
    const next = new URLSearchParams(sp.toString());
    for (const [key, value] of [["minPrice", minPrice], ["maxPrice", maxPrice]] as const) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    commit(next);
  }, [minPrice, maxPrice, urlMin, urlMax, commit, sp]);

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
        {/* a real form so Enter applies the range — blur alone missed the most
            common interaction, typing a number and hitting return */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            applyPrice();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="number"
            min={0}
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            onBlur={applyPrice}
            className={priceInput}
            aria-label="Minimum price"
          />
          <span className="text-bark/40">–</span>
          <input
            type="number"
            min={0}
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            onBlur={applyPrice}
            className={priceInput}
            aria-label="Maximum price"
          />
          <button type="submit" className="shrink-0 rounded-lg border border-sand-dark px-2.5 py-2 text-xs text-bark transition hover:border-forest-400 hover:text-forest-800">
            Go
          </button>
        </form>
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
      {/* setOpen(false) also closes the mobile drawer; a no-op for the desktop rail */}
      {hasFilters && (
        <button onClick={() => commit(new URLSearchParams())} className="btn-secondary w-full py-2 text-xs">
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
        {/* Its own scroll container (plus overscroll-contain) so the wheel over the
            filters moves the filters, not the product grid behind them. */}
        <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto overscroll-contain card-organic p-6">
          {body}
        </div>
      </aside>
      {/* Always mounted so the drawer can transition both ways — unmounting on close
          would snap it out of existence with no exit animation. `inert` keeps the
          hidden copy out of tab order and the a11y tree. */}
      <div
        className={cn(
          "fixed inset-0 z-[60] bg-deep-950/40 transition-opacity duration-300 lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setOpen(false)}
        inert={!open}
      >
        <div
          className={cn(
            "absolute inset-y-0 left-0 w-[min(320px,85vw)] overflow-y-auto overscroll-contain bg-surface p-6 shadow-lift transition-transform duration-300 ease-out",
            open ? "translate-x-0" : "-translate-x-full"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-6 flex items-center justify-between">
            <p className="font-display text-xl text-forest-900">Filters</p>
            <button onClick={() => setOpen(false)} aria-label="Close filters"><X className="h-5 w-5" /></button>
          </div>
          {body}
        </div>
      </div>
    </>
  );
}
