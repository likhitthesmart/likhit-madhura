"use client";
import { Modal, PageLoader, Note, EmptyState, StatusBadge, useAdminFetch } from "@/components/admin/ui";
import { inr, dateLong } from "@/lib/format";

interface CustomerOrder {
  id: string;
  orderNo: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  discount: number;
  couponCode: string | null;
  shippingFee: number;
  tax: number;
  total: number;
  trackingNo: string | null;
  courier: string | null;
  createdAt: string;
  shippingAddress: { name: string; phone: string; line1: string; line2?: string; city: string; state: string; pincode: string } | null;
  items: { id: string; name: string; unit: string; price: number; qty: number }[];
}

interface CustomerDetail {
  user: {
    id: string; name: string; email: string; phone: string | null; role: string;
    blocked: boolean; provider: string | null; emailVerifiedAt: string | null;
    lastLoginAt: string | null; createdAt: string;
  };
  orders: CustomerOrder[];
  stats: { orders: number; paidOrders: number; lifetimeValue: number; lastOrderAt: string | null };
}

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl border border-sand bg-black/20 px-4 py-3">
    <p className="text-[0.65rem] uppercase tracking-widest text-bark/70">{label}</p>
    <p className="mt-1 text-lg font-semibold text-ink">{value}</p>
  </div>
);

export function CustomerDetail({ userId, onClose }: { userId: string; onClose: () => void }) {
  const { data, error, loading } = useAdminFetch<CustomerDetail>(`/admin/users/${userId}`);

  return (
    <Modal title={data ? data.user.name : "Customer"} onClose={onClose} wide>
      {loading && <PageLoader />}
      {error && <Note>{error}</Note>}
      {data && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink/75">
            <span>{data.user.email}</span>
            {data.user.phone && <span>{data.user.phone}</span>}
            <StatusBadge status={data.user.role} />
            <StatusBadge status={data.user.blocked ? "BLOCKED" : "ACTIVE"} />
            {data.user.provider === "google" && <span className="text-xs text-bark/70">signs in with Google</span>}
          </div>
          <p className="text-xs text-bark/70">
            Joined {dateLong(data.user.createdAt)}
            {data.user.lastLoginAt && ` · last seen ${new Date(data.user.lastLoginAt).toLocaleString("en-IN")}`}
            {data.user.emailVerifiedAt ? " · email verified" : " · email unverified"}
          </p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Orders" value={String(data.stats.orders)} />
            <Stat label="Paid" value={String(data.stats.paidOrders)} />
            <Stat label="Lifetime value" value={inr(data.stats.lifetimeValue)} />
            <Stat label="Last order" value={data.stats.lastOrderAt ? dateLong(data.stats.lastOrderAt) : "—"} />
          </div>

          {data.orders.length ? (
            <div className="space-y-3">
              {data.orders.map((o) => (
                <div key={o.id} className="rounded-xl border border-sand bg-black/20 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-ink">{o.orderNo}</p>
                      <p className="text-xs text-bark/70">{dateLong(o.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={o.status} />
                      <StatusBadge status={o.paymentStatus} />
                    </div>
                  </div>

                  <ul className="mt-3 divide-y divide-sand border-t border-sand">
                    {o.items.map((i) => (
                      <li key={i.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                        <span className="text-ink/80">
                          {i.name}
                          <span className="ml-2 text-xs text-bark/70">{i.unit} × {i.qty}</span>
                        </span>
                        <span className="nums text-ink/75">{inr(i.price * i.qty)}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-3 flex flex-wrap justify-between gap-4 border-t border-sand pt-3 text-xs text-bark/80">
                    <span>
                      Subtotal {inr(o.subtotal)}
                      {o.discount > 0 && ` · discount −${inr(o.discount)}${o.couponCode ? ` (${o.couponCode})` : ""}`}
                      {` · shipping ${o.shippingFee ? inr(o.shippingFee) : "free"}`}
                      {` · GST ${inr(o.tax)}`}
                    </span>
                    <span className="text-sm font-semibold text-ink">Total {inr(o.total)}</span>
                  </div>

                  {o.trackingNo && (
                    <p className="mt-2 text-xs text-bark/80">Shipped via {o.courier} · AWB {o.trackingNo}</p>
                  )}
                  {o.shippingAddress && (
                    <p className="mt-2 text-xs text-bark/80">
                      {o.shippingAddress.name} · {o.shippingAddress.phone} — {o.shippingAddress.line1}
                      {o.shippingAddress.line2 ? `, ${o.shippingAddress.line2}` : ""}, {o.shippingAddress.city},{" "}
                      {o.shippingAddress.state} {o.shippingAddress.pincode}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState label="This customer has not ordered yet" />
          )}
        </div>
      )}
    </Modal>
  );
}
