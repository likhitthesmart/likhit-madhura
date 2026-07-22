"use client";
import { useState } from "react";
import {
  Bars,
  EmptyState,
  Note,
  PageLoader,
  Panel,
  StatCard,
  Table,
  Tabs,
  Td,
  rowCls,
  useAdminFetch,
} from "@/components/admin/ui";

interface Analytics {
  pageviews: number;
  sessions: number;
  byDevice: { device: string; count: number }[];
  byBrowser: { browser: string; count: number }[];
  byOs: { os: string; count: number }[];
  topPages: { path: string; count: number }[];
  referrers: { source: string; count: number }[];
  funnel: { step: string; sessions: number }[];
  byCountry: { country: string; count: number }[];
  recent: { type: string; path: string; device: string; browser: string; sessionId: string; ip: string; createdAt: string }[];
}

export default function AnalyticsPage() {
  const [days, setDays] = useState("7");
  const { data, error, loading } = useAdminFetch<Analytics>(`/admin/analytics?days=${days}`);

  return (
    <div className="space-y-6">
      <Tabs
        tabs={[
          { key: "7", label: "Last 7 days" },
          { key: "30", label: "Last 30 days" },
          { key: "90", label: "Last 90 days" },
        ]}
        active={days}
        onChange={setDays}
      />
      {error && <Note>{error}</Note>}

      {loading ? (
        <PageLoader />
      ) : data ? (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label="Pageviews" value={data.pageviews.toLocaleString("en-IN")} />
            <StatCard label="Sessions" value={data.sessions.toLocaleString("en-IN")} />
            <StatCard
              label="Pages / session"
              value={data.sessions ? (data.pageviews / data.sessions).toFixed(1) : "—"}
            />
            <StatCard label="Top referrer" value={data.referrers[0]?.source ?? "—"} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Top pages">
              <Bars items={data.topPages.map((p) => ({ label: p.path, value: p.count }))} color="bg-gold/70" />
            </Panel>
            <Panel title="Conversion funnel">
              <Bars
                items={data.funnel.map((f) => ({ label: f.step, value: f.sessions, hint: `${f.sessions.toLocaleString("en-IN")} sessions` }))}
                color="bg-copper/70"
              />
            </Panel>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Panel title="Devices">
              <Bars items={data.byDevice.map((d) => ({ label: d.device, value: d.count }))} />
            </Panel>
            <Panel title="Browsers">
              <Bars items={data.byBrowser.map((b) => ({ label: b.browser, value: b.count }))} />
            </Panel>
            <Panel title="Operating systems">
              <Bars items={data.byOs.map((o) => ({ label: o.os, value: o.count }))} />
            </Panel>
            <Panel title="Countries">
              <Bars items={data.byCountry.map((c) => ({ label: c.country, value: c.count }))} />
            </Panel>
          </div>

          <Panel title="Referrers">
            <Bars items={data.referrers.map((r) => ({ label: r.source, value: r.count }))} color="bg-forest-300/70" />
          </Panel>

          <Panel title="Recent events">
            {data.recent.length ? (
              <Table head={["Type", "Path", "Device", "Browser", "Session", "IP", "When"]}>
                {data.recent.map((e, i) => (
                  <tr key={i} className={rowCls}>
                    <Td className="text-forest-300">{e.type}</Td>
                    <Td className="max-w-[240px]">
                      <p className="truncate">{e.path}</p>
                    </Td>
                    <Td className="text-ivory/60">{e.device}</Td>
                    <Td className="text-ivory/60">{e.browser}</Td>
                    <Td className="font-mono text-xs text-ivory/40">{e.sessionId.slice(0, 8)}</Td>
                    <Td className="font-mono text-xs text-ivory/40">{e.ip}</Td>
                    <Td className="text-ivory/50">{new Date(e.createdAt).toLocaleString("en-IN")}</Td>
                  </tr>
                ))}
              </Table>
            ) : (
              <EmptyState label="No events recorded yet" />
            )}
          </Panel>
        </>
      ) : null}
    </div>
  );
}
