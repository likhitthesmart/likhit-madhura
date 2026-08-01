"use client";
import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { inr } from "@/lib/format";
import {
  ConfirmButton,
  Check,
  EmptyState,
  Field,
  Input,
  SearchInput,
  Modal,
  Note,
  PageLoader,
  Pagination,
  Panel,
  Select,
  StatusBadge,
  Table,
  Td,
  Textarea,
  btnGhost,
  btnPrimary,
  csvToList,
  listToCsv,
  paiseToRupees,
  rowCls,
  rupeesToPaise,
  useAdminFetch,
} from "@/components/admin/ui";

interface AdminProduct {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string;
  price: number;
  mrp: number;
  unit: string;
  sku: string;
  stock: number;
  lowStockAlert: number;
  images: string[];
  categoryId: string;
  category?: { name: string };
  tags: string[];
  bestSeller: boolean;
  featured: boolean;
  organicCertified: boolean;
  active: boolean;
  ingredients: string[];
  benefits: string[];
  storage: string | null;
  uses: string[];
  seoTitle: string | null;
  seoDescription: string | null;
}

interface FormState {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  price: string;
  mrp: string;
  unit: string;
  sku: string;
  stock: string;
  lowStockAlert: string;
  images: string;
  categoryId: string;
  tags: string;
  ingredients: string;
  benefits: string;
  uses: string;
  storage: string;
  seoTitle: string;
  seoDescription: string;
  bestSeller: boolean;
  featured: boolean;
  organicCertified: boolean;
  active: boolean;
}

const emptyForm: FormState = {
  slug: "", name: "", tagline: "", description: "", price: "", mrp: "", unit: "", sku: "",
  stock: "0", lowStockAlert: "5", images: "", categoryId: "", tags: "", ingredients: "",
  benefits: "", uses: "", storage: "", seoTitle: "", seoDescription: "",
  bestSeller: false, featured: false, organicCertified: true, active: true,
};

function toForm(p: AdminProduct): FormState {
  return {
    slug: p.slug, name: p.name, tagline: p.tagline ?? "", description: p.description,
    price: paiseToRupees(p.price), mrp: paiseToRupees(p.mrp), unit: p.unit, sku: p.sku,
    stock: String(p.stock), lowStockAlert: String(p.lowStockAlert),
    images: (p.images ?? []).join(", "), categoryId: p.categoryId,
    tags: listToCsv(p.tags), ingredients: listToCsv(p.ingredients), benefits: listToCsv(p.benefits),
    uses: listToCsv(p.uses), storage: p.storage ?? "", seoTitle: p.seoTitle ?? "",
    seoDescription: p.seoDescription ?? "",
    bestSeller: p.bestSeller, featured: p.featured, organicCertified: p.organicCertified, active: p.active,
  };
}

export default function ProductsPage() {
  const token = useAuth((s) => s.accessToken);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [msg, setMsg] = useState<string | null>(null);

  const { data, error, loading, reload } = useAdminFetch<{ items: AdminProduct[]; total: number; pages: number }>(
    `/admin/products?q=${encodeURIComponent(search)}&page=${page}`
  );
  const { data: catData } = useAdminFetch<{ categories: { id: string; name: string }[] }>("/admin/categories");

  const [editing, setEditing] = useState<AdminProduct | "new" | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const up = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  const openEditor = (p: AdminProduct | "new") => {
    setEditing(p);
    setForm(p === "new" ? emptyForm : toForm(p));
    setFormError(null);
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    const body = {
      slug: form.slug, name: form.name, tagline: form.tagline || null, description: form.description,
      price: rupeesToPaise(form.price), mrp: rupeesToPaise(form.mrp), unit: form.unit, sku: form.sku,
      stock: parseInt(form.stock) || 0, lowStockAlert: parseInt(form.lowStockAlert) || 0,
      images: csvToList(form.images), categoryId: form.categoryId, tags: csvToList(form.tags),
      ingredients: csvToList(form.ingredients), benefits: csvToList(form.benefits), uses: csvToList(form.uses),
      storage: form.storage || null, seoTitle: form.seoTitle || null, seoDescription: form.seoDescription || null,
      bestSeller: form.bestSeller, featured: form.featured, organicCertified: form.organicCertified, active: form.active,
    };
    try {
      if (editing === "new") await api("/admin/products", { method: "POST", body: JSON.stringify(body), token });
      else if (editing) await api(`/admin/products/${editing.id}`, { method: "PATCH", body: JSON.stringify(body), token });
      setEditing(null);
      reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    setMsg(null);
    try {
      await api(`/admin/products/${id}`, { method: "DELETE", token });
      reload();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setSearch(q);
          }}
          className="flex flex-1 gap-2"
        >
          <SearchInput
            placeholder="Search products by name, SKU…"
            value={q}
            onChange={setQ}
            onPick={(v) => {
              setPage(1);
              setSearch(v);
            }}
            suggest={async (term) => {
              const r = await api<{ items: AdminProduct[] }>(`/admin/products?q=${encodeURIComponent(term)}&page=1`, { token });
              return r.items.map((p) => ({ label: `${p.name} · ${p.sku}`, value: p.name }));
            }}
            className="max-w-sm"
          />
          <button className={btnGhost}>Search</button>
        </form>
        <button className={btnPrimary} onClick={() => openEditor("new")}>
          <Plus className="h-4 w-4" /> New product
        </button>
      </div>

      {msg && <Note>{msg}</Note>}
      {error && <Note>{error}</Note>}

      <Panel>
        {loading ? (
          <PageLoader />
        ) : data?.items.length ? (
          <>
            <Table head={["Product", "Category", "SKU", "Price", "MRP", "Stock", "Status", ""]}>
              {data.items.map((p) => (
                <tr key={p.id} className={rowCls}>
                  <Td>
                    <button className="text-left font-medium text-ink transition-colors hover:text-gold" onClick={() => openEditor(p)}>
                      {p.name}
                    </button>
                    <p className="text-xs text-bark/70">{p.unit}</p>
                  </Td>
                  <Td className="text-bark">{p.category?.name ?? "—"}</Td>
                  <Td className="text-bark">{p.sku}</Td>
                  <Td className="tabular-nums">{inr(p.price)}</Td>
                  <Td className="tabular-nums text-bark/80">{inr(p.mrp)}</Td>
                  <Td className={p.stock <= p.lowStockAlert ? "font-medium text-rose-700 dark:text-rose-300" : "tabular-nums"}>{p.stock}</Td>
                  <Td>
                    <StatusBadge status={p.active ? "ACTIVE" : "INACTIVE"} />
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-2">
                      <button className={btnGhost} onClick={() => openEditor(p)}>
                        Edit
                      </button>
                      <ConfirmButton onConfirm={() => void remove(p.id)}>Deactivate</ConfirmButton>
                    </div>
                  </Td>
                </tr>
              ))}
            </Table>
            <Pagination page={page} pages={data.pages} onPage={setPage} />
          </>
        ) : (
          <EmptyState label={search ? `No products matching “${search}”` : "No products yet"} />
        )}
      </Panel>

      {editing && (
        <Modal wide title={editing === "new" ? "New product" : `Edit — ${editing.name}`} onClose={() => setEditing(null)}>
          <form onSubmit={save} className="space-y-4">
            {formError && <Note>{formError}</Note>}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name">
                <Input required value={form.name} onChange={(e) => up({ name: e.target.value })} />
              </Field>
              <Field label="Slug">
                <Input required value={form.slug} onChange={(e) => up({ slug: e.target.value })} />
              </Field>
              <Field label="Tagline">
                <Input value={form.tagline} onChange={(e) => up({ tagline: e.target.value })} />
              </Field>
              <Field label="Category">
                <Select required value={form.categoryId} onChange={(e) => up({ categoryId: e.target.value })}>
                  <option value="">Select category…</option>
                  {catData?.categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Description">
              <Textarea required value={form.description} onChange={(e) => up({ description: e.target.value })} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Price (₹)">
                <Input required type="number" step="0.01" min="0" value={form.price} onChange={(e) => up({ price: e.target.value })} />
              </Field>
              <Field label="MRP (₹)">
                <Input required type="number" step="0.01" min="0" value={form.mrp} onChange={(e) => up({ mrp: e.target.value })} />
              </Field>
              <Field label="Unit (e.g. 500 ml)">
                <Input required value={form.unit} onChange={(e) => up({ unit: e.target.value })} />
              </Field>
              <Field label="SKU">
                <Input required value={form.sku} onChange={(e) => up({ sku: e.target.value })} />
              </Field>
              <Field label="Stock">
                <Input required type="number" value={form.stock} onChange={(e) => up({ stock: e.target.value })} />
              </Field>
              <Field label="Low stock alert at">
                <Input required type="number" value={form.lowStockAlert} onChange={(e) => up({ lowStockAlert: e.target.value })} />
              </Field>
            </div>
            <Field label="Image paths (comma separated)">
              <Textarea value={form.images} onChange={(e) => up({ images: e.target.value })} placeholder="/media/products/oil-1.jpg, /media/products/oil-2.jpg" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tags (comma separated)">
                <Input value={form.tags} onChange={(e) => up({ tags: e.target.value })} />
              </Field>
              <Field label="Ingredients (comma separated)">
                <Input value={form.ingredients} onChange={(e) => up({ ingredients: e.target.value })} />
              </Field>
              <Field label="Benefits (comma separated)">
                <Input value={form.benefits} onChange={(e) => up({ benefits: e.target.value })} />
              </Field>
              <Field label="Uses (comma separated)">
                <Input value={form.uses} onChange={(e) => up({ uses: e.target.value })} />
              </Field>
            </div>
            <Field label="Storage instructions">
              <Input value={form.storage} onChange={(e) => up({ storage: e.target.value })} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="SEO title">
                <Input value={form.seoTitle} onChange={(e) => up({ seoTitle: e.target.value })} />
              </Field>
              <Field label="SEO description">
                <Input value={form.seoDescription} onChange={(e) => up({ seoDescription: e.target.value })} />
              </Field>
            </div>
            <div className="flex flex-wrap gap-5 pt-1">
              <Check label="Active" checked={form.active} onChange={(v) => up({ active: v })} />
              <Check label="Best seller" checked={form.bestSeller} onChange={(v) => up({ bestSeller: v })} />
              <Check label="Featured" checked={form.featured} onChange={(v) => up({ featured: v })} />
              <Check label="Organic certified" checked={form.organicCertified} onChange={(v) => up({ organicCertified: v })} />
            </div>
            <div className="flex justify-end gap-2 border-t border-sand pt-4">
              <button type="button" className={btnGhost} onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button className={btnPrimary} disabled={saving}>
                {saving ? "Saving…" : "Save product"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
