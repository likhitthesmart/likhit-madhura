"use client";
import { useEffect, useState } from "react";
import { Gift, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import { LotusMark } from "../ui/logo";

const KEY = "mn_lead_seen";

/* Gentle lead capture: a corner card that slides in once, after the visitor has
   settled (18s or 45% scroll). Dismissible, and never shown again once closed or
   subscribed. Suppressed on checkout/account/admin so it never interrupts a task. */
export function LeadCapture() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");

  const blocked = /^\/(checkout|account|admin|cart|login|signup)/.test(pathname);

  useEffect(() => {
    if (blocked) return;
    if (localStorage.getItem(KEY)) return;
    let done = false;
    const show = () => {
      if (done) return;
      done = true;
      setOpen(true);
    };
    const timer = setTimeout(show, 18000);
    const onScroll = () => {
      const scrolled = (window.scrollY + window.innerHeight) / document.body.scrollHeight;
      if (scrolled > 0.45) show();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, [blocked, pathname]);

  const dismiss = () => {
    localStorage.setItem(KEY, "1");
    setOpen(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("busy");
    try {
      await api("/newsletter", { method: "POST", body: JSON.stringify({ email }) });
    } catch {
      /* subscription is best-effort — still reward the intent */
    }
    localStorage.setItem(KEY, "1");
    setState("done");
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-label="Welcome offer"
      className="fixed bottom-4 left-4 z-40 w-[min(360px,calc(100vw-2rem))] animate-rise overflow-hidden rounded-organic border border-sand bg-surface shadow-lift"
      style={{ animationDuration: "0.5s" }}
    >
      <div className="flex items-center justify-between bg-deep-900 px-5 py-3 text-ivory">
        <span className="inline-flex items-center gap-2 text-sm font-semibold">
          <Gift className="h-4 w-4 text-gold-light" /> A little welcome gift
        </span>
        <button onClick={dismiss} aria-label="Close offer" className="rounded-full p-1 text-ivory/70 hover:text-ivory">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="p-6">
        {state === "done" ? (
          <div className="text-center">
            <LotusMark className="mx-auto h-10 w-10 text-forest-700" />
            <p className="mt-3 font-display text-2xl text-forest-900">Welcome to the family 🌿</p>
            <p className="mt-1 text-sm text-bark/70">
              Use code <b className="font-mono text-forest-800">WELCOME10</b> for 10% off your first order.
            </p>
          </div>
        ) : (
          <>
            <p className="font-display text-2xl leading-snug text-forest-900">Get 10% off your first order</p>
            <p className="mt-1 text-sm text-bark/70">
              Join our farm letters for seasonal recipes and subscriber-only offers. One click to unsubscribe, always.
            </p>
            <form onSubmit={submit} className="mt-4 space-y-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                aria-label="Email address"
                className="input-field"
              />
              <button type="submit" disabled={state === "busy"} className="btn-primary w-full">
                {state === "busy" ? "Sending your code…" : "Claim my 10% off"}
              </button>
            </form>
            <button onClick={dismiss} className="mt-3 w-full text-center text-xs text-bark/50 hover:text-bark">
              No thanks, I'll pay full price
            </button>
          </>
        )}
      </div>
    </div>
  );
}
