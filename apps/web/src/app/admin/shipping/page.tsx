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
  StatusBadge,
  Table,
  Td,
  btnGhost,
  btnPrimary,
  csvToList,
  listToCsv,
  paiseToRupees,
  rowCls,
  rupeesToPaise,
  useAdminFetch,
} from "@/components/admin/ui";

interface Zone {
  id: string;
  name: string;
  pincodePrefixes: string[];
  fee: number;
  freeAbove: number | null;
  etaDaysMin: number;
  etaDaysMax: number;
  active: boolean;
}

interface FormState {
  name: string;
  pincodePrefixes: string;
  fee: string;
  freeAbove: string;
  etaDaysMin: string;
  etaDaysMax: string;
  active: boolean;
}

const emptyForm: FormState = { name: "", pincodePrefixes: "", fee: "", freeAbove: "", etaDaysMin: "2", etaDaysMax: "5", active: true };

export default function ShippingPage() {
  const token = useAuth((s) => s.accessToken);
  const { data, error, loading, reload } = useAdminFetch<{ zones: Zone[] }>("/admin/shipping-zones");
  const [editing, setEditing] = useState<Zone | "new" | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const up = (p: Partial<FormState>) => setForm((f) => ({ ...f, ...p }));

  const openEditor = (z: Zone | "new") => {
    setEditing(z);
    setMsg(null);
    setForm(
      z === "new"
        ? emptyForm
        : {
            name: z.name,
            pincodePrefixes: listToCsv(z.pincodePrefixes),
            fee: paiseToRupees(z.fee),
            freeAbove: paiseToRupees(z.freeAbove),
            etaDaysMin: String(z.etaDaysMin),
            etaDaysMax: String(z.etaDaysMax),
            active: z.active,
          }
    );
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const body = {
      name: form.name,
      pincodePrefixes: csvToList(form.pincodePrefixes),
      fee: rupeesToPaise(form.fee),
      freeAbove: form.freeAbove ? rupeesToPaise(form.freeAbove) : null,
      etaDaysMin: parseInt(form.etaDaysMin) || 1,
      etaDaysMax: parseInt(form.etaDaysMax) || 1,
      active: form.active,
    };
    try {
      if (editing === "new") await api("/admin/shipping-zones", { method: "POST", body: JSON.stringify(body), token });
      else if (editing) await api(`/admin/shipping-zones/${editing.id}`, { method: "PATCH", body: JSON.stringify(body), token });
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
      await api(`/admin/shipping-zones/${id}`, { method: "DELETE", token });
      reload();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className={btnPrimary} onClick={() => openEditor("new")}>
          <Plus className="h-4 w-4" /> New zone
        </button>
      </div>
      {error && <Note>{error}</Note>}
      {msg && !editing && <Note>{msg}</Note>}

      <Panel>
        {loading ? (
          <PageLoader />
        ) : data?.zones.length ? (
          <Table head={["Zone", "Pincode prefixes", "Fee", "Free above", "ETA", "Status", ""]}>
            {data.zones.map((z) => (
              <tr key={z.id} className={rowCls}>
                <Td>
                  <button className="font-medium text-ivory transition-colors hover:text-gold" onClick={() => openEditor(z)}>
                    {z.name}
                  </button>
                </Td>
                <Td className="max-w-[240px]">
                  <p className="truncate text-ivory/60">{z.pincodePrefixes.join(", ")}</p>
                </Td>
                <Td className="tabular-nums">{inr(z.fee)}</Td>
                <Td className="tabular-nums text-ivory/60">{z.freeAbove != null ? inr(z.freeAbove) : "—"}</Td>
                <Td className="text-ivory/60">
                  {z.etaDaysMin}–{z.etaDaysMax} days
                </Td>
                <Td>
                  <StatusBadge status={z.active ? "ACTIVE" : "INACTIVE"} />
                </Td>
                <Td>
                  <div className="flex justify-end gap-2">
                    <button className={btnGhost} onClick={() => openEditor(z)}>
                      Edit
                    </button>
                    <ConfirmButton onConfirm={() => void remove(z.id)}>Delete</ConfirmButton>
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
        ) : (
          <EmptyState label="No shipping zones yet" />
        )}
      </Panel>

      {editing && (
        <Modal title={editing === "new" ? "New shipping zone" : `Edit — ${editing.name}`} onClose={() => setEditing(null)}>
          <form onSubmit={save} className="space-y-4">
            {msg && <Note>{msg}</Note>}
            <Field label="Zone name">
              <Input required value={form.name} onChange={(e) => up({ name: e.target.value })} placeholder="South India" />
            </Field>
            <Field label="Pincode prefixes (comma separated)">
              <Input required value={form.pincodePrefixes} onChange={(e) => up({ pincodePrefixes: e.target.value })} placeholder="56, 57, 60" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Shipping fee (₹)">
                <Input required type="number" step="0.01" min="0" value={form.fee} onChange={(e) => up({ fee: e.target.value })} />
              </Field>
              <Field label="Free above (₹, blank = never)">
                <Input type="number" step="0.01" min="0" value={form.freeAbove} onChange={(e) => up({ freeAbove: e.target.value })} />
              </Field>
              <Field label="ETA min (days)">
                <Input required type="number" min="1" value={form.etaDaysMin} onChange={(e) => up({ etaDaysMin: e.target.value })} />
              </Field>
              <Field label="ETA max (days)">
                <Input required type="number" min="1" value={form.etaDaysMax} onChange={(e) => up({ etaDaysMax: e.target.value })} />
              </Field>
            </div>
            <Check label="Active" checked={form.active} onChange={(v) => up({ active: v })} />
            <div className="flex justify-end gap-2 border-t border-white/5 pt-4">
              <button type="button" className={btnGhost} onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button className={btnPrimary} disabled={saving}>
                {saving ? "Saving…" : "Save zone"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
