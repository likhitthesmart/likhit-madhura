"use client";
import { useState } from "react";
import { Download } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/store/auth";
import {
  EmptyState,
  Note,
  PageLoader,
  Panel,
  Select,
  StatusBadge,
  Table,
  Tabs,
  Td,
  btnGhost,
  downloadCsv,
  rowCls,
  useAdminFetch,
} from "@/components/admin/ui";

interface Enquiry {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  source: "CONTACT" | "CHAT" | "SUPPORT";
  status: "NEW" | "OPEN" | "RESOLVED";
  createdAt: string;
}

interface Subscriber {
  id: string;
  email: string;
  active: boolean;
  createdAt: string;
}

function EnquiriesTab() {
  const token = useAuth((s) => s.accessToken);
  const [source, setSource] = useState("");
  const [status, setStatus] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const { data, error, loading, reload } = useAdminFetch<{ enquiries: Enquiry[] }>(
    `/admin/enquiries?source=${source}&status=${status}`
  );

  const setEnquiryStatus = async (id: string, next: string) => {
    setMsg(null);
    try {
      await api(`/admin/enquiries/${id}`, { method: "PATCH", token, body: JSON.stringify({ status: next }) });
      reload();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Update failed");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Select value={source} onChange={(e) => setSource(e.target.value)} className="w-44">
          <option value="">All sources</option>
          <option value="CONTACT">Contact form</option>
          <option value="CHAT">Chatbot</option>
          <option value="SUPPORT">Support</option>
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-44">
          <option value="">All statuses</option>
          <option value="NEW">New</option>
          <option value="OPEN">Open</option>
          <option value="RESOLVED">Resolved</option>
        </Select>
      </div>
      {msg && <Note>{msg}</Note>}
      {error && <Note>{error}</Note>}

      <Panel>
        {loading ? (
          <PageLoader />
        ) : data?.enquiries.length ? (
          <div className="divide-y divide-white/5">
            {data.enquiries.map((e) => (
              <div key={e.id} className="py-3">
                <button
                  className="flex w-full flex-wrap items-center gap-3 text-left"
                  onClick={() => setExpanded(expanded === e.id ? null : e.id)}
                >
                  <span className="font-medium text-ivory">{e.name}</span>
                  <span className="text-sm text-ivory/50">{e.subject ?? e.message.slice(0, 60)}</span>
                  <span className="ml-auto flex items-center gap-2">
                    <StatusBadge status={e.source} />
                    <StatusBadge status={e.status} />
                    <span className="text-xs text-ivory/40">{new Date(e.createdAt).toLocaleDateString("en-IN")}</span>
                  </span>
                </button>
                {expanded === e.id && (
                  <div className="mt-3 rounded-xl border border-white/5 bg-black/20 p-4">
                    <p className="whitespace-pre-wrap text-sm text-ivory/75">{e.message}</p>
                    <p className="mt-3 text-xs text-ivory/40">
                      {e.email}
                      {e.phone && ` · ${e.phone}`} · {new Date(e.createdAt).toLocaleString("en-IN")}
                    </p>
                    <div className="mt-3 flex gap-2">
                      {e.status !== "OPEN" && (
                        <button className={btnGhost} onClick={() => void setEnquiryStatus(e.id, "OPEN")}>
                          Mark open
                        </button>
                      )}
                      {e.status !== "RESOLVED" && (
                        <button
                          className="rounded-lg border border-emerald-500/30 px-3 py-1.5 text-sm text-emerald-300 transition-colors hover:bg-emerald-500/10"
                          onClick={() => void setEnquiryStatus(e.id, "RESOLVED")}
                        >
                          Mark resolved
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState label="No enquiries found" />
        )}
      </Panel>
    </div>
  );
}

function SubscribersTab() {
  const token = useAuth((s) => s.accessToken);
  const { data, error, loading } = useAdminFetch<{ subscribers: Subscriber[] }>("/admin/subscribers");
  const [msg, setMsg] = useState<string | null>(null);

  const exportCsv = async () => {
    setMsg(null);
    try {
      await downloadCsv("/admin/subscribers/export", "subscribers.csv", token);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Export failed");
    }
  };

  return (
    <div className="space-y-4">
      {msg && <Note>{msg}</Note>}
      {error && <Note>{error}</Note>}
      <Panel
        title={`Newsletter subscribers${data ? ` (${data.subscribers.length})` : ""}`}
        actions={
          <button className={btnGhost} onClick={() => void exportCsv()}>
            <Download className="h-4 w-4" /> Export CSV
          </button>
        }
      >
        {loading ? (
          <PageLoader />
        ) : data?.subscribers.length ? (
          <Table head={["Email", "Status", "Subscribed"]}>
            {data.subscribers.map((s) => (
              <tr key={s.id} className={rowCls}>
                <Td>{s.email}</Td>
                <Td>
                  <StatusBadge status={s.active ? "ACTIVE" : "UNSUBSCRIBED"} />
                </Td>
                <Td className="text-ivory/50">{new Date(s.createdAt).toLocaleDateString("en-IN")}</Td>
              </tr>
            ))}
          </Table>
        ) : (
          <EmptyState label="No subscribers yet" />
        )}
      </Panel>
    </div>
  );
}

export default function EnquiriesPage() {
  const [tab, setTab] = useState("enquiries");
  return (
    <div className="space-y-4">
      <Tabs
        tabs={[
          { key: "enquiries", label: "Enquiries" },
          { key: "subscribers", label: "Subscribers" },
        ]}
        active={tab}
        onChange={setTab}
      />
      {tab === "enquiries" ? <EnquiriesTab /> : <SubscribersTab />}
    </div>
  );
}
