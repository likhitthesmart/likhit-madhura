"use client";
import Link from "next/link";
import { inr } from "@/lib/format";
import {
  BarChart,
  Bars,
  EmptyState,
  Note,
  PageLoader,
  Panel,
  StatCard,
  StatusBadge,
  Table,
  Td,
  rowCls,
  useAdminFetch,
} from "@/components/admin/ui";

interface Dashboard {
  todayRevenue: number;
  monthRevenue: number;
  monthOrders: number;
  todayOrders: number;
  pendingOrders: number;
  totalCustomers: number;
  visitorsToday: number;
  visitorsWeek: number;
  conversionRate: number;
  abandonedCarts: number;
  lowStock: { id: string; name: string; stock: number; lowStockAlert: number }[];
  recentOrders: {
    id: string;
    orderNo: string;
    email: string;
    total: number;
    status: string;
    paymentStatus: string;
    createdAt: string;
  }[];
  topProducts: { productId: string; name: string; qty: number }[];
  salesByDay: { day: string; revenue: number; orders: number }[];
  trafficSources: { source: string; count: number }[];
  statusCounts: Record<string, number>;
}

export default function DashboardPage() {
  const { data, error, loading } = useAdminFetch<Dashboard>("/admin/dashboard");

  if (loading) return <PageLoader />;
  if (error) return <Note>{error}</Note>;
  if (!data) return null;

  const stats: { label: string; value: string; hint?: string }[] = [
    { label: "Today's sales", value: inr(data.todayRevenue), hint: `${data.todayOrders} orders today` },
    { label: "Month revenue", value: inr(data.monthRevenue), hint: `${data.monthOrders} orders this month` },
    { label: "Pending orders", value: String(data.pendingOrders) },
    { label: "Customers", value: data.totalCustomers.toLocaleString("en-IN") },
    { label: "Visitors today", value: data.visitorsToday.toLocaleString("en-IN"), hint: `${data.visitorsWeek.toLocaleString("en-IN")} this week` },
    { label: "Conversion rate", value: `${data.conversionRate}%` },
    { label: "Abandoned carts", value: String(data.abandonedCarts) },
    { label: "Orders today", value: String(data.todayOrders) },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} hint={s.hint} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Revenue by day" className="lg:col-span-2">
          <BarChart
            data={data.salesByDay.map((d) => ({ label: `${d.day} (${d.orders} orders)`, value: d.revenue }))}
            format={inr}
          />
        </Panel>
        <Panel title="Order status">
          <Bars
            items={Object.entries(data.statusCounts).map(([status, count]) => ({ label: status, value: count }))}
            color="bg-gold/70"
          />
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Traffic sources">
          <Bars items={data.trafficSources.map((t) => ({ label: t.source, value: t.count }))} />
        </Panel>
        <Panel title="Top products">
          <Bars items={data.topProducts.map((p) => ({ label: p.name, value: p.qty, hint: `${p.qty} sold` }))} color="bg-copper/70" />
        </Panel>
        <Panel title="Low stock alerts">
          {data.lowStock.length ? (
            <ul className="space-y-2.5 text-sm">
              {data.lowStock.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3">
                  <span className="truncate text-ivory/70">{p.name}</span>
                  <span className="shrink-0 rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-xs text-rose-300">
                    {p.stock} left (alert ≤ {p.lowStockAlert})
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState label="All products sufficiently stocked" />
          )}
        </Panel>
      </div>

      <Panel
        title="Recent orders"
        actions={
          <Link href="/admin/orders" className="text-sm text-forest-300 transition-colors hover:text-gold">
            View all →
          </Link>
        }
      >
        {data.recentOrders.length ? (
          <Table head={["Order", "Customer", "Total", "Status", "Payment", "Placed"]}>
            {data.recentOrders.map((o) => (
              <tr key={o.id} className={rowCls}>
                <Td>
                  <Link href={`/admin/orders/${o.id}`} className="font-medium text-gold hover:underline">
                    {o.orderNo}
                  </Link>
                </Td>
                <Td>{o.email}</Td>
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
        ) : (
          <EmptyState label="No orders yet" />
        )}
      </Panel>
    </div>
  );
}
