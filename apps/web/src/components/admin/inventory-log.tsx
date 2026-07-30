"use client";
import { EmptyState, Modal, Note, PageLoader, Table, Td, rowCls, useAdminFetch } from "@/components/admin/ui";

interface InvLog {
  id: string;
  delta: number;
  reason: string;
  at: string;
  product: { name: string; sku: string };
}

/** Stock movement history for one product, in a dialog — the same shape as
 *  CustomerDetail, so the two admin drill-downs behave identically. */
export function InventoryLog({
  productId,
  productName,
  sku,
  stock,
  onClose,
}: {
  productId: string;
  productName: string;
  sku: string;
  stock: number;
  onClose: () => void;
}) {
  const { data, error, loading } = useAdminFetch<{ logs: InvLog[] }>(`/admin/inventory/logs?productId=${productId}`);
  const logs = data?.logs ?? [];
  const received = logs.filter((l) => l.delta > 0).reduce((n, l) => n + l.delta, 0);
  const removed = logs.filter((l) => l.delta < 0).reduce((n, l) => n + l.delta, 0);

  return (
    <Modal title={productName} onClose={onClose} wide>
      {loading && <PageLoader />}
      {error && <Note>{error}</Note>}
      {data && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ivory/70">
            <span>{sku}</span>
            <span>
              In stock: <b className="text-ivory">{stock}</b>
            </span>
          </div>

          {logs.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Movements", value: String(logs.length) },
                { label: "Received", value: `+${received}` },
                { label: "Removed", value: String(removed) },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                  <p className="text-[0.65rem] uppercase tracking-widest text-ivory/40">{s.label}</p>
                  <p className="mt-1 text-lg font-semibold text-ivory">{s.value}</p>
                </div>
              ))}
            </div>
          )}

          {logs.length ? (
            <Table head={["Change", "Reason", "When"]}>
              {logs.map((l) => (
                <tr key={l.id} className={rowCls}>
                  <Td className={l.delta >= 0 ? "font-medium text-emerald-300" : "font-medium text-rose-300"}>
                    {l.delta >= 0 ? `+${l.delta}` : l.delta}
                  </Td>
                  <Td className="text-ivory/60">{l.reason}</Td>
                  <Td className="whitespace-nowrap text-ivory/50">{new Date(l.at).toLocaleString("en-IN")}</Td>
                </tr>
              ))}
            </Table>
          ) : (
            <EmptyState label="No stock movements recorded for this product yet" />
          )}

          {/* the endpoint pages at 30; say so rather than silently truncating */}
          {logs.length === 30 && <p className="text-xs text-ivory/40">Showing the 30 most recent movements.</p>}
        </div>
      )}
    </Modal>
  );
}
