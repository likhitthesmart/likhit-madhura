import type { Metadata } from "next";
import { api, type Category, type Product } from "@/lib/api";
import { ProductCard } from "@/components/commerce/product-card";
import { Filters } from "./filters";
import { Reveal } from "@/components/ui/motion";
import Link from "next/link";

export const revalidate = 120;

export const metadata: Metadata = {
  title: "Shop Cold Pressed Oils, A2 Ghee & Organic Millets Online",
  description:
    "Buy certified-organic cold pressed oils, bilona A2 desi cow ghee, millets, stone-ground flours, turmeric and healthy biscuits online. Chemical-free, lab tested, made in small batches on South Indian farms. Free shipping above ₹999.",
  alternates: { canonical: "/shop" },
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

      {!q && !activeCategory && (
        <section className="mt-20 border-t border-sand pt-12">
          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
            <div className="max-w-2xl">
              <h2 className="font-display text-3xl text-forest-900">Organic staples, the way they were meant to be</h2>
              <div className="mt-4 space-y-4 text-sm leading-relaxed text-bark/75">
                <p>
                  Every product in the Madhura Naturals pantry is grown without chemicals on rain-fed South Indian farms
                  and made in small batches. Our <strong>cold pressed oils</strong> are wood-pressed on traditional
                  ghanis below 40°C, so groundnut, sesame and coconut oil keep their aroma and vitamin E. Our{" "}
                  <strong>A2 desi cow ghee</strong> is bilona-churned from curd for that unmistakable grainy, golden
                  finish.
                </p>
                <p>
                  Bringing millets back to the table? Start with <strong>ragi</strong> for calcium, <strong>jowar</strong>{" "}
                  for everyday rotte, or our rare <strong>brown top millet</strong>. Round out the kitchen with{" "}
                  <strong>Kapli atta</strong>, stone-ground flours, high-curcumin <strong>Salem turmeric</strong>, and
                  maida-free <strong>healthy biscuits</strong> the whole family can snack on.
                </p>
                <p>
                  Not sure where to begin? Read <Link href="/our-heritage" className="font-semibold text-forest-800 underline">how everything is made</Link>,
                  see <Link href="/reviews" className="font-semibold text-forest-800 underline">what other kitchens say</Link>,
                  or explore <Link href="/blog" className="font-semibold text-forest-800 underline">recipes on our journal</Link>.
                </p>
              </div>
            </div>
            <div className="rounded-organic border border-sand bg-cream-warm p-7">
              <h3 className="font-display text-xl text-forest-900">Why shop with us</h3>
              <ul className="mt-4 space-y-3 text-sm text-bark/75">
                <li>✓ Certified organic (India Organic / NPOP) & FSSAI licensed</li>
                <li>✓ Lab tested for adulterants and heavy metals</li>
                <li>✓ Pressed, churned and milled in small weekly batches</li>
                <li>✓ Traceable to the farm — pressing date on every pack</li>
                <li>✓ Free shipping above ₹999 in most zones</li>
              </ul>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
