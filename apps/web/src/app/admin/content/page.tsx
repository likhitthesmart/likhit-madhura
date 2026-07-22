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
  Tabs,
  Td,
  Textarea,
  btnGhost,
  btnPrimary,
  csvToList,
  listToCsv,
  rowCls,
  useAdminFetch,
} from "@/components/admin/ui";

/* ---------------- Blog ---------------- */

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover: string | null;
  category: string;
  tags: string[];
  authorName: string;
  published: boolean;
  createdAt?: string;
  seoTitle: string | null;
  seoDescription: string | null;
}

interface BlogForm {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover: string;
  category: string;
  tags: string;
  authorName: string;
  seoTitle: string;
  seoDescription: string;
  published: boolean;
}

const emptyBlog: BlogForm = {
  slug: "", title: "", excerpt: "", content: "", cover: "", category: "", tags: "",
  authorName: "", seoTitle: "", seoDescription: "", published: false,
};

function BlogTab() {
  const token = useAuth((s) => s.accessToken);
  const { data, error, loading, reload } = useAdminFetch<{ posts: BlogPost[] }>("/admin/blog");
  const [editing, setEditing] = useState<BlogPost | "new" | null>(null);
  const [form, setForm] = useState<BlogForm>(emptyBlog);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const up = (p: Partial<BlogForm>) => setForm((f) => ({ ...f, ...p }));

  const openEditor = (p: BlogPost | "new") => {
    setEditing(p);
    setMsg(null);
    setForm(
      p === "new"
        ? emptyBlog
        : {
            slug: p.slug, title: p.title, excerpt: p.excerpt, content: p.content, cover: p.cover ?? "",
            category: p.category, tags: listToCsv(p.tags), authorName: p.authorName,
            seoTitle: p.seoTitle ?? "", seoDescription: p.seoDescription ?? "", published: p.published,
          }
    );
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const body = {
      slug: form.slug, title: form.title, excerpt: form.excerpt, content: form.content,
      cover: form.cover || null, category: form.category, tags: csvToList(form.tags),
      authorName: form.authorName, published: form.published,
      seoTitle: form.seoTitle || null, seoDescription: form.seoDescription || null,
    };
    try {
      if (editing === "new") await api("/admin/blog", { method: "POST", body: JSON.stringify(body), token });
      else if (editing) await api(`/admin/blog/${editing.id}`, { method: "PATCH", body: JSON.stringify(body), token });
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
      await api(`/admin/blog/${id}`, { method: "DELETE", token });
      reload();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <Panel
      title="Blog posts"
      actions={
        <button className={btnPrimary} onClick={() => openEditor("new")}>
          <Plus className="h-4 w-4" /> New post
        </button>
      }
    >
      {error && <Note>{error}</Note>}
      {msg && !editing && <Note>{msg}</Note>}
      {loading ? (
        <PageLoader />
      ) : data?.posts.length ? (
        <Table head={["Title", "Category", "Author", "Status", ""]}>
          {data.posts.map((p) => (
            <tr key={p.id} className={rowCls}>
              <Td>
                <button className="text-left font-medium text-ivory transition-colors hover:text-gold" onClick={() => openEditor(p)}>
                  {p.title}
                </button>
                <p className="text-xs text-ivory/40">/{p.slug}</p>
              </Td>
              <Td className="text-ivory/60">{p.category}</Td>
              <Td className="text-ivory/60">{p.authorName}</Td>
              <Td>
                <StatusBadge status={p.published ? "PUBLISHED" : "DRAFT"} />
              </Td>
              <Td>
                <div className="flex justify-end gap-2">
                  <button className={btnGhost} onClick={() => openEditor(p)}>
                    Edit
                  </button>
                  <ConfirmButton onConfirm={() => void remove(p.id)}>Delete</ConfirmButton>
                </div>
              </Td>
            </tr>
          ))}
        </Table>
      ) : (
        <EmptyState label="No posts yet" />
      )}

      {editing && (
        <Modal wide title={editing === "new" ? "New post" : `Edit — ${editing.title}`} onClose={() => setEditing(null)}>
          <form onSubmit={save} className="space-y-4">
            {msg && <Note>{msg}</Note>}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title">
                <Input required value={form.title} onChange={(e) => up({ title: e.target.value })} />
              </Field>
              <Field label="Slug">
                <Input required value={form.slug} onChange={(e) => up({ slug: e.target.value })} />
              </Field>
              <Field label="Category">
                <Input required value={form.category} onChange={(e) => up({ category: e.target.value })} />
              </Field>
              <Field label="Author name">
                <Input required value={form.authorName} onChange={(e) => up({ authorName: e.target.value })} />
              </Field>
            </div>
            <Field label="Excerpt">
              <Textarea required value={form.excerpt} onChange={(e) => up({ excerpt: e.target.value })} className="min-h-[56px]" />
            </Field>
            <Field label="Content (HTML)">
              <Textarea required value={form.content} onChange={(e) => up({ content: e.target.value })} className="min-h-[220px] font-mono text-xs" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Cover image path">
                <Input value={form.cover} onChange={(e) => up({ cover: e.target.value })} />
              </Field>
              <Field label="Tags (comma separated)">
                <Input value={form.tags} onChange={(e) => up({ tags: e.target.value })} />
              </Field>
              <Field label="SEO title">
                <Input value={form.seoTitle} onChange={(e) => up({ seoTitle: e.target.value })} />
              </Field>
              <Field label="SEO description">
                <Input value={form.seoDescription} onChange={(e) => up({ seoDescription: e.target.value })} />
              </Field>
            </div>
            <Check label="Published" checked={form.published} onChange={(v) => up({ published: v })} />
            <div className="flex justify-end gap-2 border-t border-white/5 pt-4">
              <button type="button" className={btnGhost} onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button className={btnPrimary} disabled={saving}>
                {saving ? "Saving…" : "Save post"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </Panel>
  );
}

/* ---------------- Comments ---------------- */

interface BlogComment {
  id: string;
  name: string;
  email: string;
  body: string;
  approved?: boolean;
  createdAt?: string;
  post: { title: string; slug: string };
}

function CommentsTab() {
  const token = useAuth((s) => s.accessToken);
  const { data, error, loading, reload } = useAdminFetch<{ comments: BlogComment[] }>("/admin/blog-comments");
  const [msg, setMsg] = useState<string | null>(null);

  const moderate = async (id: string, approved: boolean) => {
    setMsg(null);
    try {
      await api(`/admin/blog-comments/${id}`, { method: "PATCH", token, body: JSON.stringify({ approved }) });
      reload();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Update failed");
    }
  };

  return (
    <Panel title="Blog comments">
      {error && <Note>{error}</Note>}
      {msg && <Note>{msg}</Note>}
      {loading ? (
        <PageLoader />
      ) : data?.comments.length ? (
        <div className="space-y-3">
          {data.comments.map((c) => (
            <div key={c.id} className="rounded-xl border border-white/5 bg-black/20 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-ivory/80">{c.body}</p>
                  <p className="mt-2 text-xs text-ivory/40">
                    {c.name} ({c.email}) on <span className="text-forest-300">{c.post.title}</span>
                    {c.approved != null && (
                      <span className="ml-2">
                        <StatusBadge status={c.approved ? "APPROVED" : "PENDING"} />
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    className="rounded-lg border border-emerald-500/30 px-3 py-1.5 text-sm text-emerald-300 transition-colors hover:bg-emerald-500/10"
                    onClick={() => void moderate(c.id, true)}
                  >
                    Approve
                  </button>
                  <button
                    className="rounded-lg border border-rose-500/30 px-3 py-1.5 text-sm text-rose-300 transition-colors hover:bg-rose-500/10"
                    onClick={() => void moderate(c.id, false)}
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState label="No comments awaiting moderation" />
      )}
    </Panel>
  );
}

/* ---------------- FAQs ---------------- */

interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
  active: boolean;
}

function FaqsTab() {
  const token = useAuth((s) => s.accessToken);
  const { data, error, loading, reload } = useAdminFetch<{ faqs: Faq[] }>("/admin/faqs");
  const [editing, setEditing] = useState<Faq | "new" | null>(null);
  const [form, setForm] = useState({ question: "", answer: "", category: "", sortOrder: "0", active: true });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const up = (p: Partial<typeof form>) => setForm((f) => ({ ...f, ...p }));

  const openEditor = (f: Faq | "new") => {
    setEditing(f);
    setMsg(null);
    setForm(
      f === "new"
        ? { question: "", answer: "", category: "", sortOrder: "0", active: true }
        : { question: f.question, answer: f.answer, category: f.category, sortOrder: String(f.sortOrder), active: f.active }
    );
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const body = { question: form.question, answer: form.answer, category: form.category, sortOrder: parseInt(form.sortOrder) || 0, active: form.active };
    try {
      if (editing === "new") await api("/admin/faqs", { method: "POST", body: JSON.stringify(body), token });
      else if (editing) await api(`/admin/faqs/${editing.id}`, { method: "PATCH", body: JSON.stringify(body), token });
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
      await api(`/admin/faqs/${id}`, { method: "DELETE", token });
      reload();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <Panel
      title="FAQs"
      actions={
        <button className={btnPrimary} onClick={() => openEditor("new")}>
          <Plus className="h-4 w-4" /> New FAQ
        </button>
      }
    >
      {error && <Note>{error}</Note>}
      {msg && !editing && <Note>{msg}</Note>}
      {loading ? (
        <PageLoader />
      ) : data?.faqs.length ? (
        <Table head={["Question", "Category", "Sort", "Status", ""]}>
          {data.faqs.map((f) => (
            <tr key={f.id} className={rowCls}>
              <Td>
                <button className="text-left font-medium text-ivory transition-colors hover:text-gold" onClick={() => openEditor(f)}>
                  {f.question}
                </button>
                <p className="max-w-md truncate text-xs text-ivory/40">{f.answer}</p>
              </Td>
              <Td className="text-ivory/60">{f.category}</Td>
              <Td className="tabular-nums text-ivory/50">{f.sortOrder}</Td>
              <Td>
                <StatusBadge status={f.active ? "ACTIVE" : "INACTIVE"} />
              </Td>
              <Td>
                <div className="flex justify-end gap-2">
                  <button className={btnGhost} onClick={() => openEditor(f)}>
                    Edit
                  </button>
                  <ConfirmButton onConfirm={() => void remove(f.id)}>Delete</ConfirmButton>
                </div>
              </Td>
            </tr>
          ))}
        </Table>
      ) : (
        <EmptyState label="No FAQs yet" />
      )}

      {editing && (
        <Modal title={editing === "new" ? "New FAQ" : "Edit FAQ"} onClose={() => setEditing(null)}>
          <form onSubmit={save} className="space-y-4">
            {msg && <Note>{msg}</Note>}
            <Field label="Question">
              <Input required value={form.question} onChange={(e) => up({ question: e.target.value })} />
            </Field>
            <Field label="Answer">
              <Textarea required value={form.answer} onChange={(e) => up({ answer: e.target.value })} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Category">
                <Input required value={form.category} onChange={(e) => up({ category: e.target.value })} placeholder="Orders / Shipping / Products…" />
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
    </Panel>
  );
}

/* ---------------- Testimonials ---------------- */

interface Testimonial {
  id: string;
  name: string;
  location: string | null;
  quote: string;
  rating: number;
  image: string | null;
  active: boolean;
}

function TestimonialsTab() {
  const token = useAuth((s) => s.accessToken);
  const { data, error, loading, reload } = useAdminFetch<{ testimonials: Testimonial[] }>("/admin/testimonials");
  const [editing, setEditing] = useState<Testimonial | "new" | null>(null);
  const [form, setForm] = useState({ name: "", location: "", quote: "", rating: "5", image: "", active: true });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const up = (p: Partial<typeof form>) => setForm((f) => ({ ...f, ...p }));

  const openEditor = (t: Testimonial | "new") => {
    setEditing(t);
    setMsg(null);
    setForm(
      t === "new"
        ? { name: "", location: "", quote: "", rating: "5", image: "", active: true }
        : { name: t.name, location: t.location ?? "", quote: t.quote, rating: String(t.rating), image: t.image ?? "", active: t.active }
    );
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const body = {
      name: form.name,
      location: form.location || null,
      quote: form.quote,
      rating: parseInt(form.rating) || 5,
      image: form.image || null,
      active: form.active,
    };
    try {
      if (editing === "new") await api("/admin/testimonials", { method: "POST", body: JSON.stringify(body), token });
      else if (editing) await api(`/admin/testimonials/${editing.id}`, { method: "PATCH", body: JSON.stringify(body), token });
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
      await api(`/admin/testimonials/${id}`, { method: "DELETE", token });
      reload();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <Panel
      title="Testimonials"
      actions={
        <button className={btnPrimary} onClick={() => openEditor("new")}>
          <Plus className="h-4 w-4" /> New testimonial
        </button>
      }
    >
      {error && <Note>{error}</Note>}
      {msg && !editing && <Note>{msg}</Note>}
      {loading ? (
        <PageLoader />
      ) : data?.testimonials.length ? (
        <Table head={["Name", "Quote", "Rating", "Status", ""]}>
          {data.testimonials.map((t) => (
            <tr key={t.id} className={rowCls}>
              <Td>
                <p className="font-medium text-ivory">{t.name}</p>
                {t.location && <p className="text-xs text-ivory/40">{t.location}</p>}
              </Td>
              <Td className="max-w-sm">
                <p className="truncate text-ivory/60">{t.quote}</p>
              </Td>
              <Td className="text-gold">{"★".repeat(t.rating)}</Td>
              <Td>
                <StatusBadge status={t.active ? "ACTIVE" : "INACTIVE"} />
              </Td>
              <Td>
                <div className="flex justify-end gap-2">
                  <button className={btnGhost} onClick={() => openEditor(t)}>
                    Edit
                  </button>
                  <ConfirmButton onConfirm={() => void remove(t.id)}>Delete</ConfirmButton>
                </div>
              </Td>
            </tr>
          ))}
        </Table>
      ) : (
        <EmptyState label="No testimonials yet" />
      )}

      {editing && (
        <Modal title={editing === "new" ? "New testimonial" : `Edit — ${editing.name}`} onClose={() => setEditing(null)}>
          <form onSubmit={save} className="space-y-4">
            {msg && <Note>{msg}</Note>}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name">
                <Input required value={form.name} onChange={(e) => up({ name: e.target.value })} />
              </Field>
              <Field label="Location">
                <Input value={form.location} onChange={(e) => up({ location: e.target.value })} placeholder="Bengaluru" />
              </Field>
            </div>
            <Field label="Quote">
              <Textarea required value={form.quote} onChange={(e) => up({ quote: e.target.value })} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Rating (1–5)">
                <Input type="number" min="1" max="5" value={form.rating} onChange={(e) => up({ rating: e.target.value })} />
              </Field>
              <Field label="Image path">
                <Input value={form.image} onChange={(e) => up({ image: e.target.value })} />
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
    </Panel>
  );
}

/* ---------------- Page ---------------- */

export default function ContentPage() {
  const [tab, setTab] = useState("blog");
  return (
    <div className="space-y-4">
      <Tabs
        tabs={[
          { key: "blog", label: "Blog" },
          { key: "comments", label: "Comments" },
          { key: "faqs", label: "FAQs" },
          { key: "testimonials", label: "Testimonials" },
        ]}
        active={tab}
        onChange={setTab}
      />
      {tab === "blog" && <BlogTab />}
      {tab === "comments" && <CommentsTab />}
      {tab === "faqs" && <FaqsTab />}
      {tab === "testimonials" && <TestimonialsTab />}
    </div>
  );
}
