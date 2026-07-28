"use client";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Check, Heart, Leaf, Minus, Plus, Share2, ShieldCheck, ShoppingBag, Star, Truck } from "lucide-react";
import type { Product, Review } from "@/lib/api";
import { api } from "@/lib/api";
import { inr, discountPct, dateLong, cn } from "@/lib/format";
import { useCart } from "@/store/cart";
import { useAuth } from "@/store/auth";
import { usePrefs } from "@/store/prefs";
import { trackEvent } from "@/components/layout/providers";
import Link from "next/link";

function Gallery({ product }: { product: Product }) {
  const media = useMemo(
    () => [...product.images.map((src) => ({ type: "image" as const, src })), ...(product.video ? [{ type: "video" as const, src: product.video }] : [])],
    [product]
  );
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const current = media[active];

  return (
    <div>
      <div
        className="relative aspect-square cursor-zoom-in overflow-hidden rounded-organic border border-sand bg-cream-warm shadow-card"
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
        }}
        onMouseLeave={() => setZoom(null)}
      >
        {current?.type === "video" ? (
          <video src={current.src} controls className="h-full w-full object-cover" />
        ) : current ? (
          <Image
            src={current.src}
            alt={product.name}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover transition-transform duration-200"
            style={zoom ? { transform: "scale(1.9)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
          />
        ) : null}
      </div>
      {media.length > 1 && (
        <div className="mt-4 flex gap-3">
          {media.map((m, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`View ${m.type} ${i + 1}`}
              className={cn("relative h-20 w-20 overflow-hidden rounded-xl border-2 transition", i === active ? "border-forest-600" : "border-transparent opacity-70")}
            >
              {m.type === "video" ? (
                <span className="flex h-full w-full items-center justify-center bg-deep-900 text-xs text-ivory">▶</span>
              ) : (
                <Image src={m.src} alt="" fill sizes="80px" className="object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewForm({ product, onDone }: { product: Product; onDone: () => void }) {
  const { user, accessToken } = useAuth();
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [title, setTitle] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  if (!user)
    return (
      <p className="text-sm text-bark/70">
        <Link href="/login" className="font-semibold text-forest-800 underline">Sign in</Link> to write a review.
      </p>
    );
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          const r = await api<{ message: string }>(`/products/${product.slug}/reviews`, {
            method: "POST",
            token: accessToken,
            body: JSON.stringify({ rating, title: title || undefined, body }),
          });
          setMsg(r.message);
          onDone();
        } catch (err) {
          setMsg(err instanceof Error ? err.message : "Could not submit review");
        }
      }}
      className="space-y-4"
    >
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((r) => (
          <button key={r} type="button" onClick={() => setRating(r)} aria-label={`${r} stars`}>
            <Star className={cn("h-6 w-6", r <= rating ? "fill-gold text-gold" : "text-sand-dark")} />
          </button>
        ))}
      </div>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (optional)" className="input-field" />
      <textarea value={body} onChange={(e) => setBody(e.target.value)} required minLength={5} rows={3} placeholder="What did you cook with it? How was it?" className="input-field" />
      <button className="btn-primary">Submit review</button>
      {msg && <p className="text-sm text-forest-700">{msg}</p>}
    </form>
  );
}

const tabs = ["Description", "Nutrition", "Benefits & Uses", "Storage", "FAQs"] as const;

export function ProductDetail({ product }: { product: Product }) {
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<(typeof tabs)[number]>("Description");
  const [added, setAdded] = useState(false);
  const [wished, setWished] = useState(false);
  const [shared, setShared] = useState(false);
  const add = useCart((s) => s.add);
  const { user, accessToken } = useAuth();
  const viewProduct = usePrefs((s) => s.viewProduct);
  const recentlyViewed = usePrefs((s) => s.recentlyViewed);
  const off = discountPct(product.price, product.mrp);
  const reviews: Review[] = product.reviews ?? [];

  useEffect(() => {
    viewProduct({ slug: product.slug, name: product.name, image: product.images[0] ?? null, price: product.price, unit: product.unit });
  }, [product, viewProduct]);

  const addToCart = () => {
    add(
      { productId: product.id, slug: product.slug, name: product.name, unit: product.unit, image: product.images[0] ?? null, price: product.price, mrp: product.mrp },
      qty
    );
    trackEvent("add_to_cart", { product: product.slug, qty });
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) await navigator.share({ title: product.name, url }).catch(() => undefined);
    else {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 1500);
    }
  };

  const others = recentlyViewed.filter((r) => r.slug !== product.slug);

  return (
    <>
      <div className="grid gap-12 lg:grid-cols-2">
        <Gallery product={product} />
        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-copper">{product.category?.name}</p>
              <h1 className="mt-2 font-display text-4xl font-medium leading-tight text-forest-900 sm:text-5xl">{product.name}</h1>
              {product.tagline && <p className="mt-2 font-display text-lg italic text-bark/70">{product.tagline}</p>}
            </div>
            <div className="flex gap-2">
              <button onClick={share} aria-label="Share" className="rounded-full border border-sand-dark p-2.5 text-bark transition hover:border-forest-400 hover:text-forest-800">
                {shared ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
              </button>
              <button
                onClick={async () => {
                  if (!user) return (window.location.href = "/login");
                  setWished(!wished);
                  await api(`/wishlist/${product.id}`, { method: wished ? "DELETE" : "POST", token: accessToken }).catch(() => setWished(wished));
                }}
                aria-label="Add to wishlist"
                className="rounded-full border border-sand-dark p-2.5 transition hover:border-copper"
              >
                <Heart className={cn("h-4 w-4", wished ? "fill-copper text-copper" : "text-bark")} />
              </button>
            </div>
          </div>

          {product.ratingCount > 0 && (
            <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-bark/70">
              <Star className="h-4 w-4 fill-gold text-gold" />
              <b className="text-forest-900">{product.ratingAvg.toFixed(1)}</b> · {product.ratingCount} reviews
            </p>
          )}

          <div className="mt-6 flex items-end gap-3">
            <p className="text-3xl font-bold text-forest-900">{inr(product.price)}</p>
            {off > 0 && (
              <>
                <p className="pb-1 text-base text-bark/40 line-through">{inr(product.mrp)}</p>
                <span className="mb-1 rounded-full bg-copper/10 px-2.5 py-0.5 text-xs font-bold text-copper">Save {off}%</span>
              </>
            )}
            <span className="pb-1 text-sm text-bark/60">/ {product.unit}</span>
          </div>
          <p className="mt-1 text-xs text-bark/50">Inclusive of all taxes</p>

          <p className={cn("mt-4 text-sm font-medium", product.stock > 0 ? "text-forest-700" : "text-copper")}>
            {product.stock === 0 ? "Out of stock" : product.stock <= 10 ? `Only ${product.stock} left in this batch` : "In stock — fresh batch"}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-4">
            <div className="flex items-center rounded-full border border-sand-dark">
              <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease quantity" className="p-3 text-bark hover:text-forest-800"><Minus className="h-4 w-4" /></button>
              <span className="w-10 text-center text-sm font-semibold">{qty}</span>
              <button onClick={() => setQty(Math.min(20, qty + 1))} aria-label="Increase quantity" className="p-3 text-bark hover:text-forest-800"><Plus className="h-4 w-4" /></button>
            </div>
            <button onClick={addToCart} disabled={product.stock === 0} className={cn("btn-primary flex-1 sm:flex-none sm:px-12", added && "bg-deep-600")}>
              {added ? (<><Check className="h-4 w-4" /> Added</>) : (<><ShoppingBag className="h-4 w-4" /> Add to cart</>)}
            </button>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-3 border-t border-sand pt-6 text-center">
            {[
              { icon: Truck, l: "Ships in 24–48h" },
              { icon: ShieldCheck, l: "Lab tested batch" },
              { icon: Leaf, l: "Certified organic" },
            ].map((b) => (
              <div key={b.l} className="flex flex-col items-center gap-1.5 text-xs text-bark/70">
                <b.icon className="h-5 w-5 text-gold-dark" /> {b.l}
              </div>
            ))}
          </div>

          <div className="mt-8">
            <div className="flex flex-wrap gap-1 border-b border-sand" role="tablist">
              {tabs.map((t) => (
                <button
                  key={t}
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                  className={cn("rounded-t-xl px-4 py-2.5 text-sm font-medium transition", tab === t ? "border-b-2 border-forest-700 text-forest-900" : "text-bark/60 hover:text-bark")}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="pt-5 text-sm leading-relaxed text-bark/80">
              {tab === "Description" && (
                <div>
                  <p>{product.description}</p>
                  {product.ingredients.length > 0 && (
                    <p className="mt-3"><b className="text-forest-900">Ingredients:</b> {product.ingredients.join(", ")}</p>
                  )}
                </div>
              )}
              {tab === "Nutrition" &&
                (product.nutrition && Object.keys(product.nutrition).length ? (
                  <table className="w-full max-w-sm text-left">
                    <caption className="mb-2 text-left text-xs text-bark/50">Approximate values per 100 g</caption>
                    <tbody>
                      {Object.entries(product.nutrition).map(([k, v]) => (
                        <tr key={k} className="border-b border-sand/60">
                          <th scope="row" className="py-2 font-medium text-forest-900">{k}</th>
                          <td className="py-2">{v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>Nutrition details for this product are printed on the pack.</p>
                ))}
              {tab === "Benefits & Uses" && (
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <p className="font-semibold text-forest-900">Why you'll love it</p>
                    <ul className="mt-2 space-y-1.5">
                      {product.benefits.map((b) => (
                        <li key={b} className="flex gap-2"><Leaf className="mt-0.5 h-3.5 w-3.5 shrink-0 text-forest-600" /> {b}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-forest-900">In the kitchen</p>
                    <ul className="mt-2 space-y-1.5">
                      {product.uses.map((u) => (
                        <li key={u} className="flex gap-2"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-dark" /> {u}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              {tab === "Storage" && <p>{product.storage ?? "Store in a cool, dry place away from direct sunlight."}</p>}
              {tab === "FAQs" &&
                (product.faqs?.length ? (
                  <div className="space-y-4">
                    {product.faqs.map((f) => (
                      <div key={f.q}>
                        <p className="font-semibold text-forest-900">{f.q}</p>
                        <p className="mt-1">{f.a}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>Have a question? Ask Madhu (bottom right) or write to care@madhuranaturals.in.</p>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-20 grid gap-10 lg:grid-cols-[1fr_380px]" aria-label="Customer reviews">
        <div>
          <h2 className="font-display text-3xl text-forest-900">Customer reviews</h2>
          {reviews.length === 0 ? (
            <p className="mt-4 text-sm text-bark/60">No reviews yet — be the first to share your kitchen story.</p>
          ) : (
            <ul className="mt-6 space-y-6">
              {reviews.map((r) => (
                <li key={r.id} className="card-organic p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={cn("h-4 w-4", i < r.rating ? "fill-gold text-gold" : "text-sand-dark")} />
                      ))}
                    </div>
                    {r.verified && <span className="rounded-full bg-forest-50 px-2.5 py-1 text-[0.65rem] font-bold uppercase text-forest-700">Verified purchase</span>}
                  </div>
                  {r.title && <p className="mt-3 font-semibold text-forest-900">{r.title}</p>}
                  <p className="mt-1.5 text-sm leading-relaxed text-bark/80">{r.body}</p>
                  {r.photos.length > 0 && (
                    <div className="mt-3 flex gap-2">
                      {r.photos.map((p) => (
                        <img key={p} src={p} alt="Customer photo" className="h-16 w-16 rounded-lg object-cover" />
                      ))}
                    </div>
                  )}
                  <p className="mt-3 text-xs text-bark/50">{r.user?.name} · {dateLong(r.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card-organic h-fit p-7">
          <h3 className="font-display text-2xl text-forest-900">Share your experience</h3>
          <div className="mt-4">
            <ReviewForm product={product} onDone={() => undefined} />
          </div>
        </div>
      </section>

      {others.length > 0 && (
        <section className="mt-20">
          <h2 className="font-display text-3xl text-forest-900">Recently viewed</h2>
          <div className="mt-6 flex gap-4 overflow-x-auto pb-2">
            {others.map((r) => (
              <Link key={r.slug} href={`/product/${r.slug}`} className="w-40 shrink-0 rounded-2xl border border-sand bg-surface p-3 transition hover:shadow-card">
                {r.image && <img src={r.image} alt="" className="aspect-square w-full rounded-xl object-cover" />}
                <p className="mt-2 line-clamp-2 text-xs font-medium text-ink">{r.name}</p>
                <p className="mt-1 text-xs font-semibold text-forest-800">{inr(r.price)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
