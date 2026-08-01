"use client";
import { useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { inr } from "@/lib/format";
import { Invoice } from "@/components/commerce/invoice";
import {
  Field,
  Input,
  Note,
  PageLoader,
  Panel,
  Select,
  StatusBadge,
  Table,
  Td,
  Textarea,
  btnGhost,
  btnPrimary,
  rowCls,
  useAdminFetch,
} from "@/components/admin/ui";

const STATUSES = ["PENDING", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];

interface OrderDetail {
  id: string;
  orderNo: string;
  email: string;
  phone: string;
  status: string;
  paymentStatus: string;
  subtotal?: number;
  discount?: number;
  couponCode?: string | null;
  shippingFee?: number;
  tax?: number;
  total: number;
  createdAt: string;
  giftNote: string | null;
  trackingNo: string | null;
  courier: string | null;
  shippingAddress: Record<string, string> | null;
  timeline: { status?: string; note?: string; at?: string }[] | null;
  items: { id?: string; name: string; qty: number; price: number; unit?: string }[];
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const token = useAuth((s) => s.accessToken);
  const { data, error, loading, reload } = useAdminFetch<{ order: OrderDetail }>(`/admin/orders/${id}`);

  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");
  const [trackingNo, setTrackingNo] = useState("");
  const [courier, setCourier] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  if (loading) return <PageLoader />;
  if (error) return <Note>{error}</Note>;
  const order = data?.order;
  if (!order) return null;

  const updateStatus = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      await api(`/admin/orders/${order.id}/status`, {
        method: "PATCH",
        token,
        body: JSON.stringify({
          status: status || order.status,
          note: note || undefined,
          trackingNo: trackingNo || undefined,
          courier: courier || undefined,
        }),
      });
      setMsg({ kind: "ok", text: "Order updated" });
      setNote("");
      reload();
    } catch (err) {
      setMsg({ kind: "error", text: err instanceof Error ? err.message : "Update failed" });
    } finally {
      setSaving(false);
    }
  };

  const addr = order.shippingAddress;
  const timeline = Array.isArray(order.timeline) ? order.timeline : [];

  /* The admin API types the money columns and item ids as optional, but the schema
     has them non-null (Order.subtotal/tax/… are Int, shippingAddress is Json), so the
     fallbacks below are belt-and-braces rather than a real case. */
  const invoiceOrder = addr && {
    orderNo: order.orderNo,
    createdAt: order.createdAt,
    paymentStatus: order.paymentStatus,
    subtotal: order.subtotal ?? 0,
    discount: order.discount ?? 0,
    couponCode: order.couponCode,
    shippingFee: order.shippingFee ?? 0,
    tax: order.tax ?? 0,
    total: order.total,
    shippingAddress: {
      name: addr.name ?? "",
      phone: addr.phone ?? order.phone,
      line1: addr.line1 ?? "",
      line2: addr.line2,
      city: addr.city ?? "",
      state: addr.state ?? "",
      pincode: addr.pincode ?? "",
    },
    items: order.items.map((it, i) => ({
      id: it.id ?? String(i),
      name: it.name,
      unit: it.unit ?? "",
      price: it.price,
      qty: it.qty,
    })),
  };

  return (
    <div className="space-y-6">

      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin/orders" className={btnGhost}>
          <ArrowLeft className="h-4 w-4" /> Orders
        </Link>
        <h2 className="font-display text-2xl font-semibold text-ivory">{order.orderNo}</h2>
        <StatusBadge status={order.status} />
        <StatusBadge status={order.paymentStatus} />
        <button className={`${btnGhost} ml-auto`} onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> Print invoice
        </button>
      </div>

      {msg && <Note kind={msg.kind}>{msg.text}</Note>}

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Items" className="lg:col-span-2">
          <Table head={["Item", "Qty", "Price", "Line total"]}>
            {order.items.map((it, i) => (
              <tr key={it.id ?? i} className={rowCls}>
                <Td>
                  {it.name}
                  {it.unit && <span className="ml-1 text-xs text-ivory/40">({it.unit})</span>}
                </Td>
                <Td className="tabular-nums">{it.qty}</Td>
                <Td className="tabular-nums">{inr(it.price)}</Td>
                <Td className="tabular-nums">{inr(it.price * it.qty)}</Td>
              </tr>
            ))}
          </Table>
          <div className="mt-4 ml-auto max-w-xs space-y-1.5 text-sm">
            {order.subtotal != null && (
              <p className="flex justify-between text-ivory/60">
                <span>Subtotal</span>
                <span className="tabular-nums">{inr(order.subtotal)}</span>
              </p>
            )}
            {order.discount != null && order.discount > 0 && (
              <p className="flex justify-between text-emerald-300">
                <span>Discount</span>
                <span className="tabular-nums">−{inr(order.discount)}</span>
              </p>
            )}
            {order.shippingFee != null && (
              <p className="flex justify-between text-ivory/60">
                <span>Shipping</span>
                <span className="tabular-nums">{inr(order.shippingFee)}</span>
              </p>
            )}
            {order.tax != null && order.tax > 0 && (
              <p className="flex justify-between text-ivory/60">
                <span>Tax</span>
                <span className="tabular-nums">{inr(order.tax)}</span>
              </p>
            )}
            <p className="flex justify-between border-t border-white/10 pt-1.5 font-semibold text-ivory">
              <span>Total</span>
              <span className="tabular-nums">{inr(order.total)}</span>
            </p>
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel title="Customer">
            <div className="space-y-1 text-sm text-ivory/70">
              <p>{order.email}</p>
              <p>{order.phone}</p>
              {addr && (
                <address className="mt-3 border-t border-white/5 pt-3 not-italic leading-relaxed text-ivory/60">
                  {[addr.name, addr.line1, addr.line2, addr.landmark, [addr.city, addr.state].filter(Boolean).join(", "), addr.pincode]
                    .filter(Boolean)
                    .map((line, i) => (
                      <span key={i} className="block">
                        {line}
                      </span>
                    ))}
                </address>
              )}
              {order.giftNote && (
                <p className="mt-3 rounded-lg border border-gold/20 bg-gold/5 p-2.5 text-xs text-gold/90">
                  Gift note: {order.giftNote}
                </p>
              )}
            </div>
          </Panel>

          <Panel title="Update status">
            <form onSubmit={updateStatus} className="space-y-3">
              <Field label="Status">
                <Select value={status || order.status} onChange={(e) => setStatus(e.target.value)}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Note (optional)">
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} className="min-h-[56px]" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Tracking no.">
                  <Input value={trackingNo} onChange={(e) => setTrackingNo(e.target.value)} placeholder={order.trackingNo ?? ""} />
                </Field>
                <Field label="Courier">
                  <Input value={courier} onChange={(e) => setCourier(e.target.value)} placeholder={order.courier ?? ""} />
                </Field>
              </div>
              <button className={`${btnPrimary} w-full justify-center`} disabled={saving}>
                {saving ? "Updating…" : "Update order"}
              </button>
            </form>
          </Panel>
        </div>
      </div>

      <Panel title="Timeline">
        {timeline.length ? (
          <ol className="space-y-3">
            {timeline.map((t, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold/70" />
                <div>
                  <p className="text-ivory/80">
                    {t.status && <StatusBadge status={t.status} />} {t.note && <span className="ml-1">{t.note}</span>}
                  </p>
                  {t.at && <p className="text-xs text-ivory/40">{new Date(t.at).toLocaleString("en-IN")}</p>}
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-ivory/40">No timeline entries.</p>
        )}
      </Panel>

      {/* Portalled to <body> with .print-sheet, which is the one shape the global
          print rules in globals.css actually honour. Shares the customer-facing
          invoice, so both copies of a given order are identical documents. */}
      {invoiceOrder && <Invoice order={invoiceOrder} />}
    </div>
  );
}
