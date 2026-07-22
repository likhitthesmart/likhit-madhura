"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { api, type Product } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { useCart } from "@/store/cart";
import { inr } from "@/lib/format";

interface WishItem { id: string; product: Product }

export default function WishlistPage() {
  const { accessToken } = useAuth();
  const add = useCart((s) => s.add);
  const [items, setItems] = useState<WishItem[] | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    api<{ items: WishItem[] }>("/wishlist", { token: accessToken }).then((r) => setItems(r.items)).catch(() => setItems([]));
  }, [accessToken]);

  const remove = async (productId: string) => {
    setItems((prev) => prev?.filter((i) => i.product.id !== productId) ?? null);
    await api(`/wishlist/${productId}`, { method: "DELETE", token: accessToken }).catch(() => undefined);
  };

  if (!items) return <div className="card-organic p-10 text-center text-sm text-bark/60">Loading wishlist…</div>;
  if (!items.length)
    return (
      <div className="card-organic p-10 text-center">
        <p className="font-display text-2xl text-forest-900">Your wishlist is empty</p>
        <p className="mt-2 text-sm text-bark/60">Tap the ♥ on any product to save it here.</p>
        <Link href="/shop" className="btn-primary mt-5">Explore products</Link>
      </div>
    );

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map(({ product: p }) => (
        <div key={p.id} className="card-organic flex gap-4 p-4">
          {p.images[0] && (
            <Link href={`/product/${p.slug}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl">
              <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" />
            </Link>
          )}
          <div className="flex flex-1 flex-col">
            <Link href={`/product/${p.slug}`} className="font-display text-lg leading-snug text-forest-900 hover:text-forest-700">{p.name}</Link>
            <p className="text-xs text-bark/60">{p.unit}</p>
            <div className="mt-auto flex items-center justify-between pt-2">
              <p className="text-sm font-semibold text-forest-900">{inr(p.price)}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => add({ productId: p.id, slug: p.slug, name: p.name, unit: p.unit, image: p.images[0] ?? null, price: p.price, mrp: p.mrp })}
                  className="btn-secondary px-4 py-1.5 text-xs"
                  disabled={p.stock === 0}
                >
                  {p.stock === 0 ? "Out of stock" : "Add to cart"}
                </button>
                <button onClick={() => remove(p.id)} aria-label="Remove from wishlist" className="rounded-full p-2 text-bark/40 hover:text-copper"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
