"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { dateLong } from "@/lib/format";

interface Comment { id: string; name: string; body: string; createdAt: string }

export function CommentSection({ slug, comments }: { slug: string; comments: Comment[] }) {
  const [form, setForm] = useState({ name: "", email: "", body: "" });
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <section className="mt-14 border-t border-sand pt-10" aria-label="Comments">
      <h2 className="font-display text-2xl text-forest-900">Comments {comments.length > 0 && `(${comments.length})`}</h2>
      {comments.length > 0 && (
        <ul className="mt-5 space-y-4">
          {comments.map((c) => (
            <li key={c.id} className="rounded-2xl border border-sand bg-cream-warm p-5">
              <p className="text-sm font-semibold text-forest-900">{c.name} <span className="ml-2 text-xs font-normal text-bark/50">{dateLong(c.createdAt)}</span></p>
              <p className="mt-1.5 text-sm text-bark/80">{c.body}</p>
            </li>
          ))}
        </ul>
      )}
      {msg ? (
        <p className="mt-6 text-sm font-medium text-forest-700">{msg}</p>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await api(`/blog/${slug}/comments`, { method: "POST", body: JSON.stringify(form) });
              setMsg("Thank you! Your comment will appear after moderation.");
            } catch {
              setMsg("Could not submit comment — try again later.");
            }
          }}
          className="mt-6 space-y-3"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <input required minLength={2} placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" aria-label="Name" />
            <input required type="email" placeholder="Email (not published)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" aria-label="Email" />
          </div>
          <textarea required minLength={3} rows={3} placeholder="Share your thoughts or your version of the recipe…" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} className="input-field" aria-label="Comment" />
          <button className="btn-primary">Post comment</button>
        </form>
      )}
    </section>
  );
}
