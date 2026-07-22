import type { Metadata } from "next";
import { api, type Category, type Product } from "@/lib/api";
import { ProductCard } from "@/components/product-card";
import { Filters } from "./filters";
import { Reveal } from "@/components/motion";
import Link from "next/link";

export const revalidate = 120;

export const metadata: Metadata = {
  title: "Shop Organic Staples",
  description: "Cold pressed oils, A2 ghee, millets, flours and traditional staples — certified organic, made in small batches.",
};

type Search = Record<string, string | string[] | undefined>;

const s = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function ShopPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const params = new URLSearchParams();
  for (const key of ["category", "q", "minPrice", "maxPrice", "inStock", "minRating", "organic", "bestSeller", "discounted", "sort", "page"]) {
    const v = s(sp[key]);
    if (v) params.set(key, v);
  }
  let items: Product[] = [];
  let total = 0;
  let pages = 1;
  let categories: Category[] = [];
  try {
    const [list, cats] = await Promise.all([
      api<{ items: Product[]; total: number; pages: number }>(`/products?${params.toString()}`),
      api<{ categories: Category[] }>("/categories"),
    ]);
    items = list.items;
    total = list.total;
    pages = list.pages;
    categories = cats.categories;
  } catch {
    /* renders empty state */
  }

  const activeCategory = categories.find((c) => c.slug === s(sp.category));
  const page = Number(s(sp.page) ?? 1);
  const q = s(sp.q);

  const pageLink = (p: number) => {
    const next = new URLSearchParams(params);
    next.set("page", String(p));
    return `/shop?${next.toString()}`;
  };

  return (
    <div className="container-page pb-24 pt-28">
      <Reveal>
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-copper">The pantry</p>
        <h1 className="mt-2 font-display text-4xl font-medium text-forest-900 sm:text-5xl">
          {q ? `Results for “${q}”` : activeCategory?.name ?? "All Products"}
        </h1>
        <p className="mt-3 max-w-xl text-sm text-bark/70">
          {activeCategory?.description ?? `${total} products, every one traceable to its farm.`}
        </p>
      </Reveal>
      <div className="mt-10 grid gap-10 lg:grid-cols-[260px_1fr]">
        <Filters categories={categories} />
        <div>
          {items.length === 0 ? (
            <div className="card-organic p-14 text-center">
              <p className="font-display text-2xl text-forest-900">Nothing matched</p>
              <p className="mt-2 text-sm text-bark/60">Try clearing a filter or two — the pantry is fuller than it looks.</p>
              <Link href="/shop" className="btn-secondary mt-6">Clear all filters</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 xl:grid-cols-3">
              {items.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
          {pages > 1 && (
            <nav className="mt-12 flex justify-center gap-2" aria-label="Pagination">
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={pageLink(p)}
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition ${
                    p === page ? "bg-forest-800 text-ivory" : "border border-sand-dark text-bark hover:border-forest-400"
                  }`}
                >
                  {p}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
