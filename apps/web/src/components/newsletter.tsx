"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { cn } from "@/lib/format";

export function NewsletterForm({ dark = false }: { dark?: boolean }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("busy");
    try {
      await api("/newsletter", { method: "POST", body: JSON.stringify({ email }) });
      setState("done");
    } catch {
      setState("error");
    }
  };

  if (state === "done")
    return <p className={cn("text-sm font-medium", dark ? "text-gold-light" : "text-forest-700")}>Welcome to the Madhura family! 🌿</p>;

  return (
    <form onSubmit={submit} className="flex w-full max-w-md gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email address"
        aria-label="Email address"
        className={cn(
          "flex-1 rounded-full px-5 py-3 text-sm outline-none transition",
          dark
            ? "border border-ivory/20 bg-ivory/10 text-ivory placeholder:text-ivory/40 focus:border-gold-light"
            : "border border-sand-dark bg-ivory text-ink placeholder:text-bark/40 focus:border-forest-400"
        )}
      />
      <button type="submit" disabled={state === "busy"} className="btn-gold whitespace-nowrap">
        {state === "busy" ? "Joining…" : "Subscribe"}
      </button>
      {state === "error" && <p className="text-xs text-copper">Try again</p>}
    </form>
  );
}
