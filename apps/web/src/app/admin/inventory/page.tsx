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
} from "@/components/admin/ui";

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
  const [logProductId, setLogProductId] = useState("");
  const logs = useAdminFetch<{ logs: InvLog[] }>(`/admin/inventory/logs?productId=${logProductId}`);

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
                  <Td className="font-medium text-ivory">{p.name}</Td>
                  <Td className="text-ivory/60">{p.sku}</Td>
                  <Td className="text-ivory/60">{p.unit}</Td>
                  <Td className={low ? "font-semibold text-rose-300" : "tabular-nums"}>{p.stock}</Td>
                  <Td className="tabular-nums text-ivory/50">{p.lowStockAlert}</Td>
                  <Td>
                    <StatusBadge status={p.active ? (low ? "LOW STOCK" : "ACTIVE") : "INACTIVE"} />
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-2">
                      <button className={btnGhost} onClick={() => setLogProductId(logProductId === p.id ? "" : p.id)}>
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
                          <span className="mb-1 block text-xs text-ivory/60">Delta (+ receive / − remove)</span>
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
                          <span className="mb-1 block text-xs text-ivory/60">Reason</span>
                          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="New batch received / damage / audit…" />
                        </label>
                        <button className={btnPrimary} disabled={saving}>
                          {saving ? "Applying…" : "Apply"}
                        </button>
                        {msg && <span className="text-sm text-rose-300">{msg}</span>}
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
        title={logProductId ? "Inventory logs (filtered)" : "Recent inventory logs"}
        actions={
          logProductId ? (
            <button className={btnGhost} onClick={() => setLogProductId("")}>
              Show all
            </button>
          ) : undefined
        }
      >
        {logs.error && <Note>{logs.error}</Note>}
        {logs.loading ? (
          <PageLoader />
        ) : logs.data?.logs.length ? (
          <Table head={["Product", "SKU", "Change", "Reason", "When"]}>
            {logs.data.logs.map((l) => (
              <tr key={l.id} className={rowCls}>
                <Td>{l.product.name}</Td>
                <Td className="text-ivory/60">{l.product.sku}</Td>
                <Td className={l.delta >= 0 ? "font-medium text-emerald-300" : "font-medium text-rose-300"}>
                  {l.delta >= 0 ? `+${l.delta}` : l.delta}
                </Td>
                <Td className="text-ivory/60">{l.reason}</Td>
                <Td className="text-ivory/50">{new Date(l.at).toLocaleString("en-IN")}</Td>
              </tr>
            ))}
          </Table>
        ) : (
          <EmptyState label="No inventory movements yet" />
        )}
      </Panel>
    </div>
  );
}
