"use client";
import { useState } from "react";
import { api } from "@/lib/api";

export function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  if (state === "done")
    return (
      <div className="rounded-2xl bg-forest-50 p-6 text-center">
        <p className="font-display text-xl text-forest-900">Message received 🌿</p>
        <p className="mt-1 text-sm text-bark/70">Thank you, {form.name.split(" ")[0]}. We'll reply to {form.email} within 24 hours.</p>
      </div>
    );

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setState("busy");
        try {
          await api("/enquiries", {
            method: "POST",
            body: JSON.stringify({ ...form, phone: form.phone || undefined, subject: form.subject || undefined }),
          });
          setState("done");
        } catch {
          setState("error");
        }
      }}
      className="space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label-field" htmlFor="c-name">Name</label><input id="c-name" required minLength={2} value={form.name} onChange={set("name")} className="input-field" /></div>
        <div><label className="label-field" htmlFor="c-email">Email</label><input id="c-email" type="email" required value={form.email} onChange={set("email")} className="input-field" /></div>
        <div><label className="label-field" htmlFor="c-phone">Phone (optional)</label><input id="c-phone" value={form.phone} onChange={set("phone")} className="input-field" /></div>
        <div><label className="label-field" htmlFor="c-subject">Subject</label><input id="c-subject" value={form.subject} onChange={set("subject")} className="input-field" placeholder="Order help / Bulk gifting / Feedback" /></div>
      </div>
      <div><label className="label-field" htmlFor="c-message">Message</label><textarea id="c-message" required minLength={5} rows={5} value={form.message} onChange={set("message")} className="input-field" /></div>
      {state === "error" && <p className="text-sm text-copper">Could not send — please try again or email us directly.</p>}
      <button disabled={state === "busy"} className="btn-primary">{state === "busy" ? "Sending…" : "Send message"}</button>
    </form>
  );
}
