"use client";
import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { inr } from "@/lib/format";
import {
  Check,
  ConfirmButton,
  EmptyState,
  Field,
  Input,
  Modal,
  Note,
  PageLoader,
  Panel,
  Select,
  Spinner,
  StatusBadge,
  Table,
  Td,
  btnGhost,
  btnPrimary,
  fromDatetimeLocal,
  paiseToRupees,
  rowCls,
  rupeesToPaise,
  toDatetimeLocal,
  useAdminFetch,
} from "@/components/admin/ui";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  type: "PERCENT" | "FLAT";
  value: number;
  minCart: number | null;
  maxDiscount: number | null;
  categoryId: string | null;
  userId: string | null;
  startsAt: string | null;
  endsAt: string | null;
  usageLimit: number | null;
  usedCount: number;
  perUserLimit: number | null;
  autoApply: boolean;
  stackable: boolean;
  active: boolean;
  _count: { redemptions: number };
}

interface CouponAnalytics {
  redemptions: { id: string; amount: number; at: string; order: { orderNo: string; total: number } }[];
  totalDiscount: number;
  uses: number;
}

interface FormState {
  code: string;
  description: string;
  type: "PERCENT" | "FLAT";
  value: string;
  minCart: string;
  maxDiscount: string;
  categoryId: string;
  userId: string;
  startsAt: string;
  endsAt: string;
  usageLimit: string;
  perUserLimit: string;
  autoApply: boolean;
  stackable: boolean;
  active: boolean;
}

const emptyForm: FormState = {
  code: "", description: "", type: "PERCENT", value: "", minCart: "", maxDiscount: "",
  categoryId: "", userId: "", startsAt: "", endsAt: "", usageLimit: "", perUserLimit: "",
  autoApply: false, stackable: false, active: true,
};

function AnalyticsModal({ coupon, onClose }: { coupon: Coupon; onClose: () => void }) {
  const { data, error, loading } = useAdminFetch<CouponAnalytics>(`/admin/coupons/${coupon.id}/analytics`);
  return (
    <Modal wide title={`Analytics — ${coupon.code}`} onClose={onClose}>
      {error && <Note>{error}</Note>}
      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : data ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border border-sand bg-black/20 p-3">
              <p className="text-xs uppercase tracking-wider text-bark/70">Total uses</p>
              <p className="mt-1 font-display text-xl text-ink">{data.uses}</p>
            </div>
            <div className="rounded-lg border border-sand bg-black/20 p-3">
              <p className="text-xs uppercase tracking-wider text-bark/70">Total discount given</p>
              <p className="mt-1 font-display text-xl text-ink">{inr(data.totalDiscount)}</p>
            </div>
          </div>
          {data.redemptions.length ? (
            <Table head={["Order", "Order total", "Discount", "When"]}>
              {data.redemptions.map((r) => (
                <tr key={r.id} className={rowCls}>
                  <Td className="text-gold">{r.order.orderNo}</Td>
                  <Td className="nums">{inr(r.order.total)}</Td>
                  <Td className="nums text-emerald-700 dark:text-emerald-300">−{inr(r.amount)}</Td>
                  <Td className="text-bark/80">{new Date(r.at).toLocaleString("en-IN")}</Td>
                </tr>
              ))}
            </Table>
          ) : (
            <EmptyState label="No redemptions yet" />
          )}
        </div>
      ) : null}
    </Modal>
  );
}

export default function CouponsPage() {
  const token = useAuth((s) => s.accessToken);
  const { data, error, loading, reload } = useAdminFetch<{ coupons: Coupon[] }>("/admin/coupons");
  const [editing, setEditing] = useState<Coupon | "new" | null>(null);
  const [analytics, setAnalytics] = useState<Coupon | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const up = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  const openEditor = (c: Coupon | "new") => {
    setEditing(c);
    setMsg(null);
    setForm(
      c === "new"
        ? emptyForm
        : {
            code: c.code,
            description: c.description ?? "",
            type: c.type,
            value: c.type === "FLAT" ? paiseToRupees(c.value) : String(c.value),
            minCart: paiseToRupees(c.minCart),
            maxDiscount: paiseToRupees(c.maxDiscount),
            categoryId: c.categoryId ?? "",
            userId: c.userId ?? "",
            startsAt: toDatetimeLocal(c.startsAt),
            endsAt: toDatetimeLocal(c.endsAt),
            usageLimit: c.usageLimit != null ? String(c.usageLimit) : "",
            perUserLimit: c.perUserLimit != null ? String(c.perUserLimit) : "",
            autoApply: c.autoApply,
            stackable: c.stackable,
            active: c.active,
          }
    );
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const body = {
      code: form.code.toUpperCase(),
      description: form.description || null,
      type: form.type,
      value: form.type === "FLAT" ? rupeesToPaise(form.value) : parseFloat(form.value) || 0,
      minCart: form.minCart ? rupeesToPaise(form.minCart) : null,
      maxDiscount: form.maxDiscount ? rupeesToPaise(form.maxDiscount) : null,
      categoryId: form.categoryId || null,
      userId: form.userId || null,
      startsAt: fromDatetimeLocal(form.startsAt),
      endsAt: fromDatetimeLocal(form.endsAt),
      usageLimit: form.usageLimit ? parseInt(form.usageLimit) : null,
      perUserLimit: form.perUserLimit ? parseInt(form.perUserLimit) : null,
      autoApply: form.autoApply,
      stackable: form.stackable,
      active: form.active,
    };
    try {
      if (editing === "new") await api("/admin/coupons", { method: "POST", body: JSON.stringify(body), token });
      else if (editing) await api(`/admin/coupons/${editing.id}`, { method: "PATCH", body: JSON.stringify(body), token });
      setEditing(null);
      reload();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await api(`/admin/coupons/${id}`, { method: "DELETE", token });
      reload();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className={btnPrimary} onClick={() => openEditor("new")}>
          <Plus className="h-4 w-4" /> New coupon
        </button>
      </div>
      {error && <Note>{error}</Note>}
      {msg && !editing && <Note>{msg}</Note>}

      <Panel>
        {loading ? (
          <PageLoader />
        ) : data?.coupons.length ? (
          <Table head={["Code", "Discount", "Min cart", "Window", "Usage", "Flags", "Status", ""]}>
            {data.coupons.map((c) => (
              <tr key={c.id} className={rowCls}>
                <Td>
                  <button className="font-mono font-semibold tracking-wide text-gold hover:underline" onClick={() => openEditor(c)}>
                    {c.code}
                  </button>
                  {c.description && <p className="max-w-[200px] truncate text-xs text-bark/70">{c.description}</p>}
                </Td>
                <Td>
                  {c.type === "PERCENT" ? `${c.value}%` : inr(c.value)}
                  {c.maxDiscount != null && <span className="text-xs text-bark/70"> (max {inr(c.maxDiscount)})</span>}
                </Td>
                <Td className="text-bark">{c.minCart != null ? inr(c.minCart) : "—"}</Td>
                <Td className="text-xs text-bark/80">
                  {c.startsAt ? new Date(c.startsAt).toLocaleDateString("en-IN") : "…"} →{" "}
                  {c.endsAt ? new Date(c.endsAt).toLocaleDateString("en-IN") : "…"}
                </Td>
                <Td className="nums">
                  {c.usedCount}
                  {c.usageLimit != null && <span className="text-bark/70">/{c.usageLimit}</span>}
                </Td>
                <Td className="space-x-1 text-[10px] uppercase tracking-wider text-forest-600">
                  {c.autoApply && <span>auto</span>}
                  {c.stackable && <span>stack</span>}
                </Td>
                <Td>
                  <StatusBadge status={c.active ? "ACTIVE" : "INACTIVE"} />
                </Td>
                <Td>
                  <div className="flex justify-end gap-2">
                    <button className={btnGhost} onClick={() => setAnalytics(c)}>
                      Analytics
                    </button>
                    <button className={btnGhost} onClick={() => openEditor(c)}>
                      Edit
                    </button>
                    <ConfirmButton onConfirm={() => void remove(c.id)}>Delete</ConfirmButton>
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
        ) : (
          <EmptyState label="No coupons yet" />
        )}
      </Panel>

      {analytics && <AnalyticsModal coupon={analytics} onClose={() => setAnalytics(null)} />}

      {editing && (
        <Modal wide title={editing === "new" ? "New coupon" : `Edit — ${editing.code}`} onClose={() => setEditing(null)}>
          <form onSubmit={save} className="space-y-4">
            {msg && <Note>{msg}</Note>}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Code">
                <Input required value={form.code} onChange={(e) => up({ code: e.target.value.toUpperCase() })} />
              </Field>
              <Field label="Description">
                <Input value={form.description} onChange={(e) => up({ description: e.target.value })} />
              </Field>
              <Field label="Type">
                <Select value={form.type} onChange={(e) => up({ type: e.target.value as "PERCENT" | "FLAT" })}>
                  <option value="PERCENT">Percent off</option>
                  <option value="FLAT">Flat amount off</option>
                </Select>
              </Field>
              <Field label={form.type === "PERCENT" ? "Value (%)" : "Value (₹)"}>
                <Input required type="number" step="0.01" min="0" value={form.value} onChange={(e) => up({ value: e.target.value })} />
              </Field>
              <Field label="Min cart (₹, optional)">
                <Input type="number" step="0.01" min="0" value={form.minCart} onChange={(e) => up({ minCart: e.target.value })} />
              </Field>
              <Field label="Max discount (₹, optional)">
                <Input type="number" step="0.01" min="0" value={form.maxDiscount} onChange={(e) => up({ maxDiscount: e.target.value })} />
              </Field>
              <Field label="Starts at">
                <Input type="datetime-local" value={form.startsAt} onChange={(e) => up({ startsAt: e.target.value })} />
              </Field>
              <Field label="Ends at">
                <Input type="datetime-local" value={form.endsAt} onChange={(e) => up({ endsAt: e.target.value })} />
              </Field>
              <Field label="Usage limit (blank = unlimited)">
                <Input type="number" min="0" value={form.usageLimit} onChange={(e) => up({ usageLimit: e.target.value })} />
              </Field>
              <Field label="Per-user limit (blank = unlimited)">
                <Input type="number" min="0" value={form.perUserLimit} onChange={(e) => up({ perUserLimit: e.target.value })} />
              </Field>
              <Field label="Restrict to category ID (optional)">
                <Input value={form.categoryId} onChange={(e) => up({ categoryId: e.target.value })} />
              </Field>
              <Field label="Restrict to user ID (optional)">
                <Input value={form.userId} onChange={(e) => up({ userId: e.target.value })} />
              </Field>
            </div>
            <div className="flex flex-wrap gap-5 pt-1">
              <Check label="Active" checked={form.active} onChange={(v) => up({ active: v })} />
              <Check label="Auto apply" checked={form.autoApply} onChange={(v) => up({ autoApply: v })} />
              <Check label="Stackable" checked={form.stackable} onChange={(v) => up({ stackable: v })} />
            </div>
            <div className="flex justify-end gap-2 border-t border-sand pt-4">
              <button type="button" className={btnGhost} onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button className={btnPrimary} disabled={saving}>
                {saving ? "Saving…" : "Save coupon"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
