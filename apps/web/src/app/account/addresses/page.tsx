"use client";
import { useEffect, useState } from "react";
import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { cn } from "@/lib/format";

interface Address { id: string; label: string; name: string; phone: string; line1: string; line2?: string | null; city: string; state: string; pincode: string; isDefault: boolean }
type Draft = Omit<Address, "id"> & { id?: string };

const empty: Draft = { label: "Home", name: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "", isDefault: false };

export default function AddressesPage() {
  const { accessToken } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    if (!accessToken) return;
    api<{ addresses: Address[] }>("/account/addresses", { token: accessToken }).then((r) => setAddresses(r.addresses)).catch(() => undefined);
  };
  useEffect(load, [accessToken]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    setError(null);
    try {
      const { id, ...body } = draft;
      if (id) await api(`/account/addresses/${id}`, { method: "PATCH", token: accessToken, body: JSON.stringify(body) });
      else await api("/account/addresses", { method: "POST", token: accessToken, body: JSON.stringify(body) });
      setDraft(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save address");
    }
  };

  const set = (k: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDraft((d) => (d ? { ...d, [k]: k === "isDefault" ? e.target.checked : e.target.value } : d));

  return (
    <div className="space-y-5">
      {!draft && (
        <button onClick={() => setDraft(empty)} className="btn-primary"><Plus className="h-4 w-4" /> Add address</button>
      )}
      {draft && (
        <form onSubmit={save} className="card-organic space-y-4 p-6">
          <h2 className="font-display text-2xl text-forest-900">{draft.id ? "Edit address" : "New address"}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label-field">Label</label><input value={draft.label} onChange={set("label")} className="input-field" placeholder="Home / Office" /></div>
            <div><label className="label-field">Full name</label><input required value={draft.name} onChange={set("name")} className="input-field" /></div>
            <div><label className="label-field">Phone</label><input required minLength={10} value={draft.phone} onChange={set("phone")} className="input-field" /></div>
            <div><label className="label-field">Pincode</label><input required pattern="\d{6}" value={draft.pincode} onChange={set("pincode")} className="input-field" /></div>
            <div className="sm:col-span-2"><label className="label-field">Line 1</label><input required value={draft.line1} onChange={set("line1")} className="input-field" /></div>
            <div className="sm:col-span-2"><label className="label-field">Line 2</label><input value={draft.line2 ?? ""} onChange={set("line2")} className="input-field" /></div>
            <div><label className="label-field">City</label><input required value={draft.city} onChange={set("city")} className="input-field" /></div>
            <div><label className="label-field">State</label><input required value={draft.state} onChange={set("state")} className="input-field" /></div>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.isDefault} onChange={set("isDefault")} className="h-4 w-4 accent-forest-700" /> Set as default</label>
          {error && <p className="text-sm text-copper">{error}</p>}
          <div className="flex gap-3">
            <button type="submit" className="btn-primary">Save</button>
            <button type="button" onClick={() => setDraft(null)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {addresses.map((a) => (
          <div key={a.id} className={cn("card-organic relative p-5", a.isDefault && "border-forest-400")}>
            {a.isDefault && <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-forest-50 px-2.5 py-1 text-[0.65rem] font-bold text-forest-700"><Star className="h-3 w-3 fill-current" /> DEFAULT</span>}
            <p className="text-xs font-bold uppercase tracking-wider text-bark/50">{a.label}</p>
            <p className="mt-1 text-sm font-semibold text-forest-900">{a.name} · {a.phone}</p>
            <p className="mt-1 text-sm text-bark/70">{a.line1}{a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} — {a.pincode}</p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setDraft(a)} className="btn-secondary px-4 py-1.5 text-xs"><Pencil className="h-3 w-3" /> Edit</button>
              <button
                onClick={async () => {
                  await api(`/account/addresses/${a.id}`, { method: "DELETE", token: accessToken }).catch(() => undefined);
                  load();
                }}
                className="rounded-full p-2 text-bark/40 hover:text-copper"
                aria-label="Delete address"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      {!addresses.length && !draft && <p className="text-sm text-bark/60">No saved addresses yet.</p>}
    </div>
  );
}
