"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { inr, dateLong, cn } from "@/lib/format";

interface OrderRow { id: string; orderNo: string; status: string; paymentStatus: string; total: number; createdAt: string; items: { name: string; qty: number; image?: string | null }[] }

export default function OrdersPage() {
  const { accessToken } = useAuth();
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  useEffect(() => {
    if (!accessToken) return;
    api<{ orders: OrderRow[] }>("/orders/mine", { token: accessToken }).then((r) => setOrders(r.orders)).catch(() => setOrders([]));
  }, [accessToken]);

  if (!orders) return <div className="card-organic p-10 text-center text-sm text-bark/60">Loading orders…</div>;
  if (!orders.length)
    return (
      <div className="card-organic p-10 text-center">
        <p className="font-display text-2xl text-forest-900">No orders yet</p>
        <Link href="/shop" className="btn-primary mt-5">Start shopping</Link>
      </div>
    );

  return (
    <div className="space-y-4">
      {orders.map((o) => (
        <Link key={o.id} href={`/account/orders/${o.id}`} className="card-organic block p-6 transition hover:shadow-lift">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-display text-xl text-forest-900">{o.orderNo}</p>
              <p className="text-xs text-bark/60">{dateLong(o.createdAt)}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className={cn("rounded-full px-3 py-1 text-xs font-bold uppercase", o.status === "DELIVERED" ? "bg-forest-50 text-forest-700" : o.status === "CANCELLED" ? "bg-copper/10 text-copper" : "bg-gold/10 text-gold-dark")}>
                {o.status}
              </span>
              <p className="font-semibold text-forest-900">{inr(o.total)}</p>
            </div>
          </div>
          <p className="mt-3 line-clamp-1 text-sm text-bark/70">{o.items.map((i) => `${i.name} ×${i.qty}`).join(" · ")}</p>
        </Link>
      ))}
    </div>
  );
}
