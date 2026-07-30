"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download } from "lucide-react";
import { inr } from "@/lib/format";
import { api } from "@/lib/api";
import { useAuth } from "@/store/auth";
import {
  EmptyState,
  SearchInput,
  Note,
  PageLoader,
  Pagination,
  Panel,
  StatusBadge,
  Table,
  Tabs,
  Td,
  btnGhost,
  downloadCsv,
  rowCls,
  useAdminFetch,
  DateRange,
  rangeQuery,
} from "@/components/admin/ui";

const STATUSES = ["ALL", "PENDING", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];

interface AdminOrder {
  id: string;
  orderNo: string;
  email: string;
  phone: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  items: { name: string; qty: number; price: number }[];
}

export default function OrdersPage() {
  const router = useRouter();
  const token = useAuth((s) => s.accessToken);
  const [status, setStatus] = useState("ALL");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [msg, setMsg] = useState<string | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const filters = `status=${status === "ALL" ? "" : status}&q=${encodeURIComponent(search)}${rangeQuery(from, to)}`;
  const { data, error, loading } = useAdminFetch<{
    orders: AdminOrder[];
    total: number;
    pages: number;
    summary: { orders: number; paidOrders: number; revenue: number };
  }>(`/admin/orders?${filters}&page=${page}`);

  const exportCsv = async () => {
    setMsg(null);
    try {
      // same filters as the table above, so the file matches what is on screen
      await downloadCsv(`/admin/orders/export?${filters}`, "orders.csv", token);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Export failed");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          tabs={STATUSES.map((s) => ({ key: s, label: s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase() }))}
          active={status}
          onChange={(s) => {
            setStatus(s);
            setPage(1);
          }}
        />
        <button className={btnGhost} onClick={() => void exportCsv()}>
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      <DateRange
        from={from}
        to={to}
        onChange={(f, t) => {
          setFrom(f);
          setTo(t);
          setPage(1);
        }}
      />

      {data && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Orders", value: String(data.summary.orders) },
            { label: "Paid", value: String(data.summary.paidOrders) },
            { label: "Revenue", value: inr(data.summary.revenue) },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
              <p className="text-[0.65rem] uppercase tracking-widest text-ivory/40">{s.label}</p>
              <p className="mt-1 text-lg font-semibold text-ivory">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setSearch(q);
        }}
        className="flex gap-2"
      >
        <SearchInput
          placeholder="Search by order no, email, phone…"
          value={q}
          onChange={setQ}
          onPick={(v) => {
            setPage(1);
            setSearch(v);
          }}
          suggest={async (term) => {
            const r = await api<{ orders: AdminOrder[] }>(`/admin/orders?q=${encodeURIComponent(term)}&page=1`, { token });
            // the order number is unique, so picking one narrows to that single order
            return r.orders.map((o) => ({ label: `${o.orderNo} · ${o.email}`, value: o.orderNo }));
          }}
          className="max-w-sm"
        />
        <button className={btnGhost}>Search</button>
      </form>

      {msg && <Note>{msg}</Note>}
      {error && <Note>{error}</Note>}

      <Panel>
        {loading ? (
          <PageLoader />
        ) : data?.orders.length ? (
          <>
            <Table head={["Order", "Customer", "Items", "Total", "Status", "Payment", "Placed"]}>
              {data.orders.map((o) => (
                <tr
                  key={o.id}
                  className={`${rowCls} cursor-pointer`}
                  onClick={() => router.push(`/admin/orders/${o.id}`)}
                >
                  <Td className="font-medium text-gold">{o.orderNo}</Td>
                  <Td>
                    <p>{o.email}</p>
                    <p className="text-xs text-ivory/40">{o.phone}</p>
                  </Td>
                  <Td className="max-w-[220px]">
                    <p className="truncate text-ivory/60">
                      {o.items.map((i) => `${i.name} ×${i.qty}`).join(", ")}
                    </p>
                  </Td>
                  <Td className="tabular-nums">{inr(o.total)}</Td>
                  <Td>
                    <StatusBadge status={o.status} />
                  </Td>
                  <Td>
                    <StatusBadge status={o.paymentStatus} />
                  </Td>
                  <Td className="text-ivory/50">{new Date(o.createdAt).toLocaleString("en-IN")}</Td>
                </tr>
              ))}
            </Table>
            <Pagination page={page} pages={data.pages} onPage={setPage} />
          </>
        ) : (
          <EmptyState label="No orders found" />
        )}
      </Panel>
    </div>
  );
}
