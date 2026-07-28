"use client";
import { useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/store/auth";
import {
  EmptyState,
  Field,
  Input,
  Note,
  PageLoader,
  Panel,
  Table,
  Td,
  Textarea,
  btnPrimary,
  rowCls,
  useAdminFetch,
} from "@/components/admin/ui";

interface StoreSettings {
  phone: string;
  email: string;
  address: string;
  hours: string;
  instagram: string;
  facebook: string;
  youtube: string;
}

const empty: StoreSettings = { phone: "", email: "", address: "", hours: "", instagram: "", facebook: "", youtube: "" };

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  at: string;
  user: { name: string; email: string };
}

function AuditLogs() {
  const { data, error, loading } = useAdminFetch<{ logs: AuditLog[] }>("/admin/audit-logs");
  return (
    <Panel title="Audit log">
      {error && <Note>{error}</Note>}
      {loading ? (
        <PageLoader />
      ) : data?.logs.length ? (
        <Table head={["Action", "Entity", "By", "When"]}>
          {data.logs.map((l) => (
            <tr key={l.id} className={rowCls}>
              <Td className="font-medium text-sage">{l.action}</Td>
              <Td>
                {l.entity} <span className="font-mono text-xs text-ivory/40">{l.entityId}</span>
              </Td>
              <Td>
                <p>{l.user.name}</p>
                <p className="text-xs text-ivory/40">{l.user.email}</p>
              </Td>
              <Td className="text-ivory/50">{new Date(l.at).toLocaleString("en-IN")}</Td>
            </tr>
          ))}
        </Table>
      ) : (
        <EmptyState label="No audit entries yet" />
      )}
    </Panel>
  );
}

export default function SettingsPage() {
  const { user, accessToken: token } = useAuth();
  const { data, error, loading } = useAdminFetch<{ settings: { store?: Partial<StoreSettings> } }>("/admin/settings");
  const [form, setForm] = useState<StoreSettings>(empty);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const up = (p: Partial<StoreSettings>) => setForm((f) => ({ ...f, ...p }));

  useEffect(() => {
    if (data?.settings.store) setForm({ ...empty, ...data.settings.store });
  }, [data]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      await api("/admin/settings/store", { method: "PUT", token, body: JSON.stringify({ value: form }) });
      setMsg({ kind: "ok", text: "Settings saved" });
    } catch (err) {
      setMsg({ kind: "error", text: err instanceof Error ? err.message : "Save failed" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && <Note>{error}</Note>}
      <Panel title="Store settings">
        {loading ? (
          <PageLoader />
        ) : (
          <form onSubmit={save} className="max-w-2xl space-y-4">
            {msg && <Note kind={msg.kind}>{msg.text}</Note>}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Phone">
                <Input value={form.phone} onChange={(e) => up({ phone: e.target.value })} placeholder="+91 98765 43210" />
              </Field>
              <Field label="Email">
                <Input type="email" value={form.email} onChange={(e) => up({ email: e.target.value })} />
              </Field>
            </div>
            <Field label="Address">
              <Textarea value={form.address} onChange={(e) => up({ address: e.target.value })} className="min-h-[64px]" />
            </Field>
            <Field label="Business hours">
              <Input value={form.hours} onChange={(e) => up({ hours: e.target.value })} placeholder="Mon–Sat, 9am–6pm IST" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Instagram">
                <Input value={form.instagram} onChange={(e) => up({ instagram: e.target.value })} />
              </Field>
              <Field label="Facebook">
                <Input value={form.facebook} onChange={(e) => up({ facebook: e.target.value })} />
              </Field>
              <Field label="YouTube">
                <Input value={form.youtube} onChange={(e) => up({ youtube: e.target.value })} />
              </Field>
            </div>
            <button className={btnPrimary} disabled={saving}>
              {saving ? "Saving…" : "Save settings"}
            </button>
          </form>
        )}
      </Panel>

      {user?.role === "ADMIN" && <AuditLogs />}
    </div>
  );
}
