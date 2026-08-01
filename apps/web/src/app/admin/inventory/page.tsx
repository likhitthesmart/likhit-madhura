"use client";
import { useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/store/auth";
import {
  EmptyState,
  Input,
  Note,
  PageLoader,
  Panel,
  StatusBadge,
  Table,
  Td,
  btnGhost,
  btnPrimary,
  rowCls,
  useAdminFetch,
  DateRange,
  rangeQuery,
} from "@/components/admin/ui";
import { InventoryLog } from "@/components/admin/inventory-log";

interface InvProduct {
  id: string;
  name: string;
  sku: string;
  unit: string;
  stock: number;
  lowStockAlert: number;
  active: boolean;
}

interface InvLog {
  id: string;
  delta: number;
  reason: string;
  at: string;
  product: { name: string; sku: string };
}

export default function InventoryPage() {
  const token = useAuth((s) => s.accessToken);
  const { data, error, loading, reload } = useAdminFetch<{ products: InvProduct[] }>("/admin/inventory");
  // the row button opens a dialog; the panel below stays an unfiltered overview
  const [logProduct, setLogProduct] = useState<InvProduct | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const logs = useAdminFetch<{ logs: InvLog[]; summary: { sold: number; received: number; movements: number } }>(
    `/admin/inventory/logs?page=1${rangeQuery(from, to)}`
  );

  const [adjustId, setAdjustId] = useState<string | null>(null);
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const openAdjust = (id: string) => {
    setAdjustId(id === adjustId ? null : id);
    setDelta("");
    setReason("");
    setMsg(null);
  };

  const applyAdjust = async (e: FormEvent, productId: string) => {
    e.preventDefault();
    const d = parseInt(delta);
    if (!d) {
      setMsg("Delta must be a non-zero number");
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      await api(`/admin/inventory/${productId}/adjust`, {
        method: "POST",
        token,
        body: JSON.stringify({ delta: d, reason: reason || "Manual adjustment" }),
      });
      setAdjustId(null);
      reload();
      logs.reload();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Adjustment failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && <Note>{error}</Note>}

      <Panel title="Stock levels">
        {loading ? (
          <PageLoader />
        ) : data?.products.length ? (
          <Table head={["Product", "SKU", "Unit", "Stock", "Alert at", "Status", ""]}>
            {data.products.map((p) => {
              const low = p.stock <= p.lowStockAlert;
              return [
                <tr key={p.id} className={`${rowCls} ${low ? "bg-rose-500/[0.06]" : ""}`}>
                  <Td className="font-medium text-ink">{p.name}</Td>
                  <Td className="text-bark">{p.sku}</Td>
                  <Td className="text-bark">{p.unit}</Td>
                  <Td className={low ? "font-semibold text-rose-700 dark:text-rose-300" : "nums"}>{p.stock}</Td>
                  <Td className="nums text-bark/80">{p.lowStockAlert}</Td>
                  <Td>
                    <StatusBadge status={p.active ? (low ? "LOW STOCK" : "ACTIVE") : "INACTIVE"} />
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-2">
                      <button className={btnGhost} onClick={() => setLogProduct(p)}>
                        Logs
                      </button>
                      <button className={btnGhost} onClick={() => openAdjust(p.id)}>
                        {adjustId === p.id ? "Close" : "± Adjust"}
                      </button>
                    </div>
                  </Td>
                </tr>,
                adjustId === p.id ? (
                  <tr key={`${p.id}-adjust`}>
                    <td colSpan={7} className="bg-black/20 px-3 py-3">
                      <form onSubmit={(e) => void applyAdjust(e, p.id)} className="flex flex-wrap items-end gap-3">
                        <label className="block">
                          <span className="mb-1 block text-xs text-bark">Delta (+ receive / − remove)</span>
                          <Input
                            type="number"
                            required
                            value={delta}
                            onChange={(e) => setDelta(e.target.value)}
                            className="w-36"
                            placeholder="e.g. 25 or -3"
                          />
                        </label>
                        <label className="block flex-1 min-w-[200px]">
                          <span className="mb-1 block text-xs text-bark">Reason</span>
                          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="New batch received / damage / audit…" />
                        </label>
                        <button className={btnPrimary} disabled={saving}>
                          {saving ? "Applying…" : "Apply"}
                        </button>
                        {msg && <span className="text-sm text-rose-700 dark:text-rose-300">{msg}</span>}
                      </form>
                    </td>
                  </tr>
                ) : null,
              ];
            })}
          </Table>
        ) : (
          <EmptyState label="No products" />
        )}
      </Panel>

      <Panel
        title={from || to ? "Inventory movements" : "Recent inventory movements"}
        actions={<DateRange from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t); }} />}
      >
        {logs.data && (
          <div className="mb-4 grid grid-cols-3 gap-3">
            {[
              { label: from || to ? "Bought in range" : "Bought (recent)", value: `${logs.data.summary.sold} units` },
              { label: "Received", value: `+${logs.data.summary.received}` },
              { label: "Movements", value: String(logs.data.summary.movements) },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-sand bg-black/20 px-4 py-3">
                <p className="text-[0.65rem] uppercase tracking-widest text-bark/70">{s.label}</p>
                <p className="mt-1 text-lg font-semibold text-ink">{s.value}</p>
              </div>
            ))}
          </div>
        )}
        {logs.error && <Note>{logs.error}</Note>}
        {logs.loading ? (
          <PageLoader />
        ) : logs.data?.logs.length ? (
          <Table head={["Product", "SKU", "Change", "Reason", "When"]}>
            {logs.data.logs.map((l) => (
              <tr key={l.id} className={rowCls}>
                <Td>{l.product.name}</Td>
                <Td className="text-bark">{l.product.sku}</Td>
                <Td className={l.delta >= 0 ? "font-medium text-emerald-700 dark:text-emerald-300" : "font-medium text-rose-700 dark:text-rose-300"}>
                  {l.delta >= 0 ? `+${l.delta}` : l.delta}
                </Td>
                <Td className="text-bark">{l.reason}</Td>
                <Td className="text-bark/80">{new Date(l.at).toLocaleString("en-IN")}</Td>
              </tr>
            ))}
          </Table>
        ) : (
          <EmptyState label="No inventory movements yet" />
        )}
      </Panel>

      {logProduct && (
        <InventoryLog
          productId={logProduct.id}
          productName={logProduct.name}
          sku={logProduct.sku}
          stock={logProduct.stock}
          onClose={() => setLogProduct(null)}
        />
      )}
    </div>
  );
}
