"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Heart, Package, Ticket } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { inr, dateLong, cn } from "@/lib/format";

interface OrderSummary { id: string; orderNo: string; status: string; paymentStatus: string; total: number; createdAt: string; items: { name: string; qty: number }[] }

export default function AccountOverview() {
  const { user, accessToken } = useAuth();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [wishCount, setWishCount] = useState(0);
  const [couponCount, setCouponCount] = useState(0);

  useEffect(() => {
    if (!accessToken) return;
    api<{ orders: OrderSummary[] }>("/orders/mine", { token: accessToken }).then((r) => setOrders(r.orders)).catch(() => undefined);
    api<{ items: unknown[] }>("/wishlist", { token: accessToken }).then((r) => setWishCount(r.items.length)).catch(() => undefined);
    api<{ coupons: unknown[] }>("/account/coupons", { token: accessToken }).then((r) => setCouponCount(r.coupons.length)).catch(() => undefined);
  }, [accessToken]);

  const cards = [
    { icon: Package, label: "Orders placed", value: orders.length, href: "/account/orders" },
    { icon: Heart, label: "Wishlist items", value: wishCount, href: "/account/wishlist" },
    { icon: Ticket, label: "Available coupons", value: couponCount, href: "/account/coupons" },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="card-organic group p-6 transition hover:shadow-lift">
            <c.icon className="h-6 w-6 text-gold-dark" />
            <p className="mt-3 font-display text-3xl font-semibold text-forest-900">{c.value}</p>
            <p className="mt-1 flex items-center gap-1 text-xs uppercase tracking-wider text-bark/60">
              {c.label} <ArrowRight className="h-3 w-3 opacity-0 transition group-hover:opacity-100" />
            </p>
          </Link>
        ))}
      </div>
      <div className="card-organic p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl text-forest-900">Recent orders</h2>
          <Link href="/account/orders" className="text-sm font-medium text-forest-800 hover:underline">View all</Link>
        </div>
        {orders.length === 0 ? (
          <p className="mt-4 text-sm text-bark/60">No orders yet — your first batch of organic goodness awaits. <Link className="font-semibold text-forest-800 underline" href="/shop">Browse the pantry</Link>.</p>
        ) : (
          <ul className="mt-4 divide-y divide-sand">
            {orders.slice(0, 4).map((o) => (
              <li key={o.id}>
                <Link href={`/account/orders/${o.id}`} className="flex items-center justify-between gap-4 py-4 transition hover:bg-cream/60">
                  <div>
                    <p className="text-sm font-semibold text-forest-900">{o.orderNo}</p>
                    <p className="text-xs text-bark/60">{dateLong(o.createdAt)} · {o.items.reduce((n, i) => n + i.qty, 0)} items</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{inr(o.total)}</p>
                    <span className={cn("text-xs font-bold uppercase", o.status === "DELIVERED" ? "text-forest-700" : o.status === "CANCELLED" ? "text-copper" : "text-gold-dark")}>{o.status}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="card-organic p-6">
        <h2 className="font-display text-2xl text-forest-900">Profile</h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div><dt className="label-field">Name</dt><dd>{user?.name}</dd></div>
          <div><dt className="label-field">Email</dt><dd>{user?.email} {user?.emailVerified ? <span className="text-forest-700">✓ verified</span> : <span className="text-copper">(unverified)</span>}</dd></div>
          <div><dt className="label-field">Phone</dt><dd>{user?.phone ?? "—"}</dd></div>
        </dl>
        <Link href="/account/settings" className="btn-secondary mt-5 px-5 py-2 text-xs">Edit profile</Link>
      </div>
    </div>
  );
}
