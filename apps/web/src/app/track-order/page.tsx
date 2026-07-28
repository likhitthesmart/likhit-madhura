"use client";
import { useEffect, useState } from "react";
import { Check, Package, Search } from "lucide-react";
import { api } from "@/lib/api";
import { dateLong, cn } from "@/lib/format";

interface Tracked {
  orderNo: string;
  status: string;
  paymentStatus: string;
  timeline: { status: string; note?: string | null; at: string }[];
  trackingNo?: string | null;
  courier?: string | null;
  createdAt: string;
}

const flow = ["PENDING", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED"];

export default function TrackOrderPage() {
  const [orderNo, setOrderNo] = useState("");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState<Tracked | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Prefills the ?orderNo= the confirmation email links with. After mount, never in
  // the initial state — the server renders without a URL query, so branching on
  // `window` there makes the first client render disagree and breaks hydration.
  useEffect(() => {
    const fromEmail = new URLSearchParams(window.location.search).get("orderNo");
    if (fromEmail) setOrderNo(fromEmail.toUpperCase());
  }, []);

  const track = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ order: Tracked }>(`/orders/track?orderNo=${encodeURIComponent(orderNo.trim())}&email=${encodeURIComponent(email.trim())}`);
      setOrder(r.order);
    } catch (err) {
      setOrder(null);
      setError(err instanceof Error ? err.message : "Could not find that order");
    } finally {
      setBusy(false);
    }
  };

  const reached = order ? flow.indexOf(order.status) : -1;

  return (
    <div className="container-page max-w-3xl pb-24 pt-28">
      <div className="text-center">
        <Package className="mx-auto h-10 w-10 text-gold-dark" />
        <h1 className="mt-4 font-display text-4xl font-medium text-forest-900 sm:text-5xl">Track your order</h1>
        <p className="mt-3 text-sm text-bark/70">Enter your order number (starts with MN) and the email used at checkout.</p>
      </div>
      <form onSubmit={track} className="card-organic mt-10 flex flex-col gap-4 p-7 sm:flex-row">
        <input value={orderNo} onChange={(e) => setOrderNo(e.target.value.toUpperCase())} required placeholder="Order number e.g. MN2607224812" className="input-field flex-1" aria-label="Order number" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} required type="email" placeholder="Email" className="input-field flex-1" aria-label="Email" />
        <button className="btn-primary" disabled={busy}><Search className="h-4 w-4" /> {busy ? "Searching…" : "Track"}</button>
      </form>
      {error && <p className="mt-4 text-center text-sm text-copper">{error}</p>}
      {order && (
        <div className="card-organic mt-8 p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-display text-2xl text-forest-900">{order.orderNo}</p>
              <p className="text-xs text-bark/60">Placed {dateLong(order.createdAt)}</p>
            </div>
            <span className={cn("rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide", order.status === "CANCELLED" || order.status === "REFUNDED" ? "bg-copper/10 text-copper" : "bg-forest-50 text-forest-800")}>
              {order.status}
            </span>
          </div>
          {order.status !== "CANCELLED" && order.status !== "REFUNDED" && (
            <ol className="mt-8 flex items-center" aria-label="Delivery progress">
              {flow.map((s, i) => (
                <li key={s} className="flex flex-1 items-center last:flex-none">
                  <div className="flex flex-col items-center">
                    <span className={cn("flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold", i <= reached ? "bg-deep-700 text-ivory" : "border border-sand-dark text-bark/40")}>
                      {i <= reached ? <Check className="h-4 w-4" /> : i + 1}
                    </span>
                    <span className="mt-2 text-[0.6rem] font-semibold uppercase tracking-wide text-bark/60">{s.toLowerCase()}</span>
                  </div>
                  {i < flow.length - 1 && <span className={cn("mx-1 h-0.5 flex-1 -translate-y-2.5", i < reached ? "bg-deep-600" : "bg-sand-dark")} />}
                </li>
              ))}
            </ol>
          )}
          {order.trackingNo && (
            <p className="mt-6 rounded-xl bg-cream p-4 text-sm">
              Shipped via <b>{order.courier}</b> · AWB <b>{order.trackingNo}</b>
            </p>
          )}
          <h2 className="mt-8 font-display text-xl text-forest-900">Timeline</h2>
          <ul className="mt-4 space-y-4 border-l-2 border-sand pl-5">
            {[...order.timeline].reverse().map((t, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[1.65rem] top-1 h-3 w-3 rounded-full border-2 border-surface bg-deep-600" />
                <p className="text-sm font-semibold text-forest-900">{t.status}</p>
                {t.note && <p className="text-xs text-bark/70">{t.note}</p>}
                <p className="text-[0.7rem] text-bark/50">{new Date(t.at).toLocaleString("en-IN")}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
