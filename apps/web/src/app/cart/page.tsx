"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowRight, BookmarkPlus, Minus, Plus, ShoppingBag, Tag, Trash2, Truck, Undo2 } from "lucide-react";
import { useCart } from "@/store/cart";
import { api, type CartQuote } from "@/lib/api";
import { inr, cn } from "@/lib/format";
import { usePrefs } from "@/store/prefs";

export default function CartPage() {
  const { items, savedForLater, couponCode, pincode, setQty, remove, saveForLater, moveToCart, removeSaved, setCoupon, setPincode } = useCart();
  const [quote, setQuote] = useState<CartQuote | null>(null);
  const [couponInput, setCouponInput] = useState(couponCode ?? "");
  const [pinInput, setPinInput] = useState(pincode ?? "");
  const [error, setError] = useState<string | null>(null);
  const recentlyViewed = usePrefs((s) => s.recentlyViewed);

  useEffect(() => {
    if (!items.length) {
      setQuote(null);
      return;
    }
    const t = setTimeout(() => {
      api<CartQuote>("/cart/quote", {
        method: "POST",
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, qty: i.qty })),
          couponCode: couponCode || undefined,
          pincode: pincode || undefined,
        }),
      })
        .then((q) => {
          setQuote(q);
          setError(q.couponError);
        })
        .catch((e) => setError(e instanceof Error ? e.message : "Could not price your cart"));
    }, 250);
    return () => clearTimeout(t);
  }, [items, couponCode, pincode]);

  if (!items.length && !savedForLater.length)
    return (
      <div className="container-page flex min-h-[70vh] flex-col items-center justify-center pt-24 text-center">
        <ShoppingBag className="h-14 w-14 text-sand-dark" />
        <h1 className="mt-6 font-display text-4xl text-forest-900">Your basket is empty</h1>
        <p className="mt-3 max-w-sm text-sm text-bark/60">The pantry is full though — cold pressed oils, fresh-milled flours and this week's ghee batch await.</p>
        <Link href="/shop" className="btn-primary mt-8">Browse the pantry <ArrowRight className="h-4 w-4" /></Link>
      </div>
    );

  return (
    <div className="container-page pb-24 pt-28">
      <h1 className="font-display text-4xl font-medium text-forest-900 sm:text-5xl">Your basket</h1>
      {/* min-w-0 / minmax(0,1fr): a grid track defaults to a min-content floor, and
          overflow-x-auto does NOT zero out a min-content contribution. Without these the
          "You were looking at" strip (7 x w-36 = 1080px) sizes the whole column, and the
          page lays out 1096px wide inside a 338px phone. */}
      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="min-w-0 space-y-4">
          {items.map((i) => (
            <div key={i.productId} className="card-organic flex gap-3 p-3 sm:gap-6 sm:p-5">
              {i.image && (
                <Link href={`/product/${i.slug}`} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl sm:h-28 sm:w-28">
                  <Image src={i.image} alt={i.name} fill sizes="(max-width: 640px) 80px, 112px" className="object-cover" />
                </Link>
              )}
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                {/* price sits under the name on phones and beside it from sm up — side by side
                    it leaves the name barely 100px once the thumbnail and padding are taken */}
                <div className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                  <div className="min-w-0">
                    <Link href={`/product/${i.slug}`} className="font-display text-base leading-snug text-forest-900 hover:text-forest-700 sm:text-lg">{i.name}</Link>
                    <p className="text-xs text-bark/60">{i.unit}</p>
                  </div>
                  <p className="shrink-0 font-semibold text-forest-900">{inr(i.price * i.qty)}</p>
                </div>
                <div className="mt-auto flex items-center justify-between gap-2">
                  <div className="flex items-center rounded-full border border-sand-dark">
                    <button onClick={() => setQty(i.productId, i.qty - 1)} aria-label="Decrease" className="p-1.5 text-bark hover:text-forest-800 sm:p-2"><Minus className="h-3.5 w-3.5" /></button>
                    <span className="w-7 text-center text-sm font-semibold sm:w-8">{i.qty}</span>
                    <button onClick={() => setQty(i.productId, i.qty + 1)} aria-label="Increase" className="p-1.5 text-bark hover:text-forest-800 sm:p-2"><Plus className="h-3.5 w-3.5" /></button>
                  </div>
                  <div className="flex gap-0.5 sm:gap-1">
                    <button onClick={() => saveForLater(i.productId)} className="rounded-full p-1.5 text-bark/50 transition hover:bg-cream hover:text-forest-800 sm:p-2" aria-label="Save for later" title="Save for later">
                      <BookmarkPlus className="h-4 w-4" />
                    </button>
                    <button onClick={() => remove(i.productId)} className="rounded-full p-1.5 text-bark/50 transition hover:bg-cream hover:text-copper sm:p-2" aria-label="Remove" title="Remove">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {savedForLater.length > 0 && (
            <div className="pt-6">
              <h2 className="font-display text-2xl text-forest-900">Saved for later</h2>
              <div className="mt-4 space-y-3">
                {savedForLater.map((i) => (
                  <div key={i.productId} className="flex items-center gap-3 rounded-2xl border border-sand bg-cream-warm p-3 sm:gap-4">
                    {i.image && <img src={i.image} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover sm:h-14 sm:w-14" />}
                    <div className="min-w-0 flex-1">
                      {/* line-clamp-1, not truncate: truncate implies white-space:nowrap, which
                          makes the entire name this flex item's min-content contribution (207px
                          here) and pushes the whole grid column past the viewport. min-w-0 cannot
                          undo that. This clips to one line the same way but keeps wrapping legal. */}
                      <p className="line-clamp-1 text-sm font-medium text-ink">{i.name}</p>
                      <p className="text-xs text-bark/60">{inr(i.price)} · {i.unit}</p>
                    </div>
                    {/* label drops below sm — spelled out it is ~190px, more than a phone
                        has left after the thumbnail, name and delete button */}
                    <button onClick={() => moveToCart(i.productId)} aria-label="Move to basket" title="Move to basket" className="btn-secondary shrink-0 px-3 py-1.5 text-xs sm:px-4">
                      <Undo2 className="h-3 w-3" /> <span className="hidden sm:inline">Move to basket</span>
                    </button>
                    <button onClick={() => removeSaved(i.productId)} aria-label="Remove saved item" className="shrink-0 p-2 text-bark/40 hover:text-copper"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {recentlyViewed.length > 0 && (
            <div className="pt-6">
              <h2 className="font-display text-2xl text-forest-900">You were looking at</h2>
              <div className="mt-4 flex gap-3 overflow-x-auto overscroll-x-contain pb-2">
                {recentlyViewed.map((r) => (
                  <Link key={r.slug} href={`/product/${r.slug}`} className="w-36 shrink-0 rounded-2xl border border-sand bg-surface p-3 transition hover:shadow-card">
                    {r.image && <img src={r.image} alt="" className="aspect-square w-full rounded-xl object-cover" />}
                    <p className="mt-2 line-clamp-2 text-xs font-medium">{r.name}</p>
                    <p className="mt-0.5 text-xs font-semibold text-forest-800">{inr(r.price)}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="h-fit min-w-0 space-y-5 lg:sticky lg:top-24">
          <div className="card-organic p-4 sm:p-6">
            <h2 className="font-display text-2xl text-forest-900">Order summary</h2>
            {/* min-w-0: a flex item defaults to min-width:auto, which for a wrapper
                around an <input> is the input's intrinsic ~210px — wider than a 320px
                phone leaves here, so the button gets shoved past the screen edge. */}
            <div className="mt-4 flex gap-2">
              <div className="relative min-w-0 flex-1">
                <Tag className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-bark/40" />
                <input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="Coupon code"
                  className="input-field pl-10 uppercase"
                  aria-label="Coupon code"
                />
              </div>
              {couponCode ? (
                <button onClick={() => { setCoupon(null); setCouponInput(""); }} className="btn-secondary px-4 text-xs">Remove</button>
              ) : (
                <button onClick={() => setCoupon(couponInput || null)} className="btn-secondary px-4 text-xs">Apply</button>
              )}
            </div>
            {error && <p className="mt-2 text-xs text-copper">{error}</p>}
            {quote?.coupon && !error && (
              <p className="mt-2 text-xs font-medium text-forest-700">✓ {quote.coupon.code} applied{quote.coupon.description ? ` — ${quote.coupon.description}` : ""}</p>
            )}
            <div className="mt-4 flex gap-2">
              <div className="relative min-w-0 flex-1">
                <Truck className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-bark/40" />
                <input
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Delivery pincode"
                  className="input-field pl-10"
                  aria-label="Delivery pincode"
                  inputMode="numeric"
                />
              </div>
              <button onClick={() => setPincode(pinInput.length === 6 ? pinInput : null)} className="btn-secondary px-4 text-xs">Check</button>
            </div>
            {quote && pincode && (
              <p className="mt-2 text-xs text-bark/70">
                {quote.zone}: delivery in {quote.etaDays.min}–{quote.etaDays.max} days
              </p>
            )}
            <dl className="mt-5 space-y-2.5 border-t border-sand pt-5 text-sm">
              <div className="flex justify-between"><dt className="text-bark/70">Subtotal</dt><dd className="font-medium">{quote ? inr(quote.subtotal) : "—"}</dd></div>
              {quote && quote.discount > 0 && (
                <div className="flex justify-between text-forest-700"><dt>Coupon savings</dt><dd className="font-medium">−{inr(quote.discount)}</dd></div>
              )}
              <div className="flex justify-between"><dt className="text-bark/70">Shipping</dt><dd className="font-medium">{quote ? (quote.shippingFee === 0 ? (pincode ? "Free" : "At checkout") : inr(quote.shippingFee)) : "—"}</dd></div>
              <div className="flex justify-between text-xs text-bark/50"><dt>Includes GST</dt><dd>{quote ? inr(quote.tax) : "—"}</dd></div>
              <div className="flex justify-between border-t border-sand pt-3 text-base font-bold text-forest-900"><dt>Total</dt><dd>{quote ? inr(quote.total) : "—"}</dd></div>
            </dl>
            <Link href="/checkout" className={cn("btn-primary mt-6 w-full", !items.length && "pointer-events-none opacity-50")}>
              Proceed to checkout <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="mt-3 text-center text-[0.7rem] text-bark/50">🔒 Secure checkout · Free shipping above ₹999 in most zones</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
