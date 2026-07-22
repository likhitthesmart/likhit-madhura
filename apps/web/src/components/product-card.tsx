"use client";
import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingBag, Star } from "lucide-react";
import type { Product } from "@/lib/api";
import { inr, discountPct, cn } from "@/lib/format";
import { useCart } from "@/store/cart";
import { useAuth } from "@/store/auth";
import { api } from "@/lib/api";
import { trackEvent } from "./providers";
import { useState } from "react";

export function ProductCard({ product }: { product: Product }) {
  const add = useCart((s) => s.add);
  const { user, accessToken } = useAuth();
  const [wished, setWished] = useState(false);
  const [added, setAdded] = useState(false);
  const off = discountPct(product.price, product.mrp);

  const addToCart = () => {
    add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      unit: product.unit,
      image: product.images[0] ?? null,
      price: product.price,
      mrp: product.mrp,
    });
    trackEvent("add_to_cart", { product: product.slug });
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  const toggleWish = async () => {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    setWished(!wished);
    try {
      await api(`/wishlist/${product.id}`, { method: wished ? "DELETE" : "POST", token: accessToken });
    } catch {
      setWished(wished);
    }
  };

  return (
    <article className="group card-organic relative overflow-hidden transition-all duration-500 hover:-translate-y-1.5 hover:shadow-lift">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-cream-warm">
          {product.images[0] && (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          )}
          {off > 0 && (
            <span className="absolute left-3 top-3 rounded-full bg-copper px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-ivory">
              {off}% off
            </span>
          )}
          {product.bestSeller && (
            <span className="absolute right-3 top-3 rounded-full bg-gold px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-ivory">
              Bestseller
            </span>
          )}
          {product.stock === 0 && (
            <span className="absolute inset-0 flex items-center justify-center bg-ivory/70 font-display text-lg text-bark">
              Out of stock
            </span>
          )}
        </div>
      </Link>
      <button
        onClick={toggleWish}
        aria-label="Add to wishlist"
        className={cn(
          "absolute right-3 top-12 z-10 rounded-full bg-ivory/90 p-2 opacity-0 shadow-card backdrop-blur transition-all duration-300 group-hover:opacity-100",
          wished && "opacity-100"
        )}
      >
        <Heart className={cn("h-4 w-4", wished ? "fill-copper text-copper" : "text-bark")} />
      </button>
      <div className="p-4">
        <p className="text-[0.7rem] uppercase tracking-widest text-bark/50">{product.category?.name}</p>
        <Link href={`/product/${product.slug}`}>
          <h3 className="mt-1 font-display text-lg leading-snug text-forest-900 transition group-hover:text-forest-700">
            {product.name}
          </h3>
        </Link>
        <div className="mt-1 flex items-center gap-2 text-xs text-bark/60">
          <span>{product.unit}</span>
          {product.ratingCount > 0 && (
            <span className="inline-flex items-center gap-1">
              <Star className="h-3 w-3 fill-gold text-gold" /> {product.ratingAvg.toFixed(1)}
            </span>
          )}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-base font-semibold text-forest-900">
            {inr(product.price)}
            {off > 0 && <span className="ml-2 text-xs font-normal text-bark/40 line-through">{inr(product.mrp)}</span>}
          </p>
          <button
            onClick={addToCart}
            disabled={product.stock === 0}
            aria-label={`Add ${product.name} to cart`}
            className={cn(
              "rounded-full p-2.5 transition-all duration-300",
              added ? "bg-forest-700 text-ivory" : "bg-forest-50 text-forest-800 hover:bg-forest-800 hover:text-ivory",
              product.stock === 0 && "opacity-40"
            )}
          >
            <ShoppingBag className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
