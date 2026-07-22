"use client";
import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/store/auth";
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
  Textarea,
  btnGhost,
  btnPrimary,
  rowCls,
  useAdminFetch,
} from "@/components/admin/ui";

interface AdminCategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image: string | null;
  sortOrder: number;
  active: boolean;
  _count: { products: number };
}

interface FormState {
  slug: string;
  name: string;
  description: string;
  image: string;
  sortOrder: string;
  active: boolean;
}

const emptyForm: FormState = { slug: "", name: "", description: "", image: "", sortOrder: "0", active: true };

export default function CategoriesPage() {
  const token = useAuth((s) => s.accessToken);
  const { data, error, loading, reload } = useAdminFetch<{ categories: AdminCategory[] }>("/admin/categories");
  const [editing, setEditing] = useState<AdminCategory | "new" | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const up = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  const openEditor = (c: AdminCategory | "new") => {
    setEditing(c);
    setMsg(null);
    setForm(
      c === "new"
        ? emptyForm
        : { slug: c.slug, name: c.name, description: c.description ?? "", image: c.image ?? "", sortOrder: String(c.sortOrder), active: c.active }
    );
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const body = {
      slug: form.slug,
      name: form.name,
      description: form.description || null,
      image: form.image || null,
      sortOrder: parseInt(form.sortOrder) || 0,
      active: form.active,
    };
    try {
      if (editing === "new") await api("/admin/categories", { method: "POST", body: JSON.stringify(body), token });
      else if (editing) await api(`/admin/categories/${editing.id}`, { method: "PATCH", body: JSON.stringify(body), token });
      setEditing(null);
      reload();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    setMsg(null);
    try {
      await api(`/admin/categories/${id}`, { method: "DELETE", token });
      reload();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className={btnPrimary} onClick={() => openEditor("new")}>
          <Plus className="h-4 w-4" /> New category
        </button>
      </div>
      {error && <Note>{error}</Note>}
      {msg && !editing && <Note>{msg}</Note>}
      <Panel>
        {loading ? (
          <PageLoader />
        ) : data?.categories.length ? (
          <Table head={["Category", "Slug", "Products", "Sort", "Status", ""]}>
            {data.categories.map((c) => (
              <tr key={c.id} className={rowCls}>
                <Td>
                  <button className="font-medium text-ivory transition-colors hover:text-gold" onClick={() => openEditor(c)}>
                    {c.name}
                  </button>
                  {c.description && <p className="max-w-xs truncate text-xs text-ivory/40">{c.description}</p>}
                </Td>
                <Td className="text-ivory/60">{c.slug}</Td>
                <Td className="tabular-nums">{c._count.products}</Td>
                <Td className="tabular-nums text-ivory/50">{c.sortOrder}</Td>
                <Td>
                  <StatusBadge status={c.active ? "ACTIVE" : "INACTIVE"} />
                </Td>
                <Td>
                  <div className="flex justify-end gap-2">
                    <button className={btnGhost} onClick={() => openEditor(c)}>
                      Edit
                    </button>
                    <ConfirmButton onConfirm={() => void remove(c.id)}>Delete</ConfirmButton>
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
        ) : (
          <EmptyState label="No categories yet" />
        )}
      </Panel>

      {editing && (
        <Modal title={editing === "new" ? "New category" : `Edit — ${editing.name}`} onClose={() => setEditing(null)}>
          <form onSubmit={save} className="space-y-4">
            {msg && <Note>{msg}</Note>}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name">
                <Input required value={form.name} onChange={(e) => up({ name: e.target.value })} />
              </Field>
              <Field label="Slug">
                <Input required value={form.slug} onChange={(e) => up({ slug: e.target.value })} />
              </Field>
            </div>
            <Field label="Description">
              <Textarea value={form.description} onChange={(e) => up({ description: e.target.value })} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Image path">
                <Input value={form.image} onChange={(e) => up({ image: e.target.value })} placeholder="/media/categories/oils.jpg" />
              </Field>
              <Field label="Sort order">
                <Input type="number" value={form.sortOrder} onChange={(e) => up({ sortOrder: e.target.value })} />
              </Field>
            </div>
            <Check label="Active" checked={form.active} onChange={(v) => up({ active: v })} />
            <div className="flex justify-end gap-2 border-t border-white/5 pt-4">
              <button type="button" className={btnGhost} onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button className={btnPrimary} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
