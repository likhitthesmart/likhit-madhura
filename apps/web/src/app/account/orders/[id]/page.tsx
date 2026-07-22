"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, Printer } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { inr, dateLong, cn } from "@/lib/format";

interface FullOrder {
  id: string; orderNo: string; status: string; paymentStatus: string;
  subtotal: number; discount: number; couponCode?: string | null; shippingFee: number; tax: number; total: number;
  shippingAddress: { name: string; phone: string; line1: string; line2?: string; city: string; state: string; pincode: string };
  giftNote?: string | null; trackingNo?: string | null; courier?: string | null;
  timeline: { status: string; note?: string | null; at: string }[];
  createdAt: string;
  items: { id: string; name: string; image?: string | null; unit: string; price: number; qty: number; productId: string }[];
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { accessToken } = useAuth();
  const [order, setOrder] = useState<FullOrder | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    api<{ order: FullOrder }>(`/orders/mine/${id}`, { token: accessToken })
      .then((r) => setOrder(r.order))
      .catch((e) => setError(e instanceof Error ? e.message : "Not found"));
  }, [accessToken, id]);

  if (error) return <div className="card-organic p-10 text-center text-sm text-copper">{error}</div>;
  if (!order) return <div className="card-organic p-10 text-center text-sm text-bark/60">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/account/orders" className="inline-flex items-center gap-1 text-sm font-medium text-forest-800 hover:underline"><ChevronLeft className="h-4 w-4" /> All orders</Link>
        <button onClick={() => window.print()} className="btn-secondary px-4 py-2 text-xs"><Printer className="h-3.5 w-3.5" /> Invoice</button>
      </div>
      <div className="card-organic p-7 print:shadow-none">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-display text-3xl text-forest-900">{order.orderNo}</p>
            <p className="text-xs text-bark/60">Placed {dateLong(order.createdAt)}</p>
          </div>
          <span className={cn("rounded-full px-4 py-1.5 text-xs font-bold uppercase", order.status === "DELIVERED" ? "bg-forest-50 text-forest-700" : order.status === "CANCELLED" ? "bg-copper/10 text-copper" : "bg-gold/10 text-gold-dark")}>
            {order.status}
          </span>
        </div>
        {order.trackingNo && (
          <p className="mt-4 rounded-xl bg-cream p-3 text-sm">Shipped via <b>{order.courier}</b> · AWB <b>{order.trackingNo}</b></p>
        )}
        <ul className="mt-6 divide-y divide-sand">
          {order.items.map((i) => (
            <li key={i.id} className="flex items-center gap-4 py-3">
              {i.image && <img src={i.image} alt="" className="h-14 w-14 rounded-xl object-cover" />}
              <div className="flex-1">
                <p className="text-sm font-medium">{i.name}</p>
                <p className="text-xs text-bark/60">{i.unit} × {i.qty}</p>
              </div>
              <p className="text-sm font-semibold">{inr(i.price * i.qty)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-5 ml-auto max-w-xs space-y-1.5 text-sm">
          <div className="flex justify-between"><dt className="text-bark/70">Subtotal</dt><dd>{inr(order.subtotal)}</dd></div>
          {order.discount > 0 && <div className="flex justify-between text-forest-700"><dt>Discount {order.couponCode && `(${order.couponCode})`}</dt><dd>−{inr(order.discount)}</dd></div>}
          <div className="flex justify-between"><dt className="text-bark/70">Shipping</dt><dd>{order.shippingFee ? inr(order.shippingFee) : "Free"}</dd></div>
          <div className="flex justify-between text-xs text-bark/50"><dt>GST included</dt><dd>{inr(order.tax)}</dd></div>
          <div className="flex justify-between border-t border-sand pt-2 text-base font-bold text-forest-900"><dt>Total</dt><dd>{inr(order.total)}</dd></div>
        </dl>
        <div className="mt-6 grid gap-4 border-t border-sand pt-5 text-sm sm:grid-cols-2">
          <div>
            <p className="label-field">Delivery address</p>
            <p className="font-medium">{order.shippingAddress.name} · {order.shippingAddress.phone}</p>
            <p className="text-bark/70">{order.shippingAddress.line1}{order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}, {order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}</p>
          </div>
          {order.giftNote && (
            <div>
              <p className="label-field">Gift note</p>
              <p className="italic text-bark/70">“{order.giftNote}”</p>
            </div>
          )}
        </div>
      </div>
      <div className="card-organic p-7">
        <h2 className="font-display text-xl text-forest-900">Timeline</h2>
        <ul className="mt-4 space-y-4 border-l-2 border-sand pl-5">
          {[...order.timeline].reverse().map((t, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[1.65rem] top-1 h-3 w-3 rounded-full border-2 border-ivory bg-forest-600" />
              <p className="text-sm font-semibold text-forest-900">{t.status}</p>
              {t.note && <p className="text-xs text-bark/70">{t.note}</p>}
              <p className="text-[0.7rem] text-bark/50">{new Date(t.at).toLocaleString("en-IN")}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
