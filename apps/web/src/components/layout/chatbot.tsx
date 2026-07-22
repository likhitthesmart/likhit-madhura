"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Leaf, Send, X } from "lucide-react";
import { api } from "@/lib/api";
import { inr, cn } from "@/lib/format";
import { LotusMark } from "../ui/logo";

interface ChatProduct { slug: string; name: string; price: number; unit: string; images: string[] }
interface Msg {
  from: "user" | "bot";
  text: string;
  suggestions?: string[];
  products?: ChatProduct[];
}

const opener: Msg = {
  from: "bot",
  text: "Namaste! 🙏 I am Madhu, your organic living assistant. Ask me about products, orders, delivery, returns or offers.",
  suggestions: ["Show best sellers", "Delivery time", "Current offers", "Talk to support"],
};

export function Chatbot() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([opener]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, open]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    setInput("");
    setMsgs((m) => [...m, { from: "user", text: q }]);
    setBusy(true);
    try {
      const r = await api<{ text: string; suggestions?: string[]; products?: ChatProduct[] }>("/chat", {
        method: "POST",
        body: JSON.stringify({ message: q }),
      });
      setMsgs((m) => [...m, { from: "bot", ...r }]);
    } catch {
      setMsgs((m) => [...m, { from: "bot", text: "I seem to be resting under a banyan tree — please try again in a moment." }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close chat" : "Chat with us"}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-forest-800 text-ivory shadow-lift transition-all duration-300 hover:scale-105 hover:bg-forest-700"
      >
        {open ? <X className="h-6 w-6" /> : <Leaf className="h-6 w-6" />}
      </button>
      <div
        className={cn(
          "fixed bottom-24 right-5 z-50 flex w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-organic border border-sand bg-ivory shadow-lift transition-all duration-300",
          open ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        )}
        role="dialog"
        aria-label="Chat assistant"
      >
        <div className="flex items-center gap-3 bg-forest-900 px-5 py-4 text-ivory">
          <LotusMark className="h-8 w-8 text-gold-light" />
          <div>
            <p className="font-display text-lg leading-none">Madhu</p>
            <p className="mt-1 text-[0.7rem] text-ivory/60">Your organic living assistant</p>
          </div>
        </div>
        <div ref={bodyRef} className="flex max-h-[50vh] min-h-64 flex-col gap-3 overflow-y-auto bg-cream-warm p-4">
          {msgs.map((m, i) => (
            <div key={i} className={cn("max-w-[85%]", m.from === "user" ? "self-end" : "self-start")}>
              <div
                className={cn(
                  "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  m.from === "user" ? "rounded-br-sm bg-forest-800 text-ivory" : "rounded-bl-sm border border-sand bg-ivory text-ink"
                )}
              >
                {m.text}
              </div>
              {m.products && (
                <div className="mt-2 space-y-2">
                  {m.products.map((p) => (
                    <Link key={p.slug} href={`/product/${p.slug}`} className="flex items-center gap-3 rounded-xl border border-sand bg-ivory p-2 transition hover:border-forest-300">
                      {p.images[0] && <img src={p.images[0]} alt="" className="h-10 w-10 rounded-lg object-cover" />}
                      <span className="flex-1 text-xs font-medium text-ink">{p.name}</span>
                      <span className="text-xs font-semibold text-forest-800">{inr(p.price)}</span>
                    </Link>
                  ))}
                </div>
              )}
              {m.suggestions && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => (s === "Open contact form" || s === "Talk to support" ? (window.location.href = "/contact") : s === "Track my order" ? (window.location.href = "/track-order") : s === "Subscribe to newsletter" ? window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }) : send(s))}
                      className="rounded-full border border-forest-200 bg-forest-50 px-3 py-1 text-xs text-forest-800 transition hover:bg-forest-100"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          {busy && <div className="self-start rounded-2xl rounded-bl-sm border border-sand bg-ivory px-4 py-2.5 text-sm text-bark/50">…</div>}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
          className="flex items-center gap-2 border-t border-sand bg-ivory p-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about products, orders…"
            aria-label="Chat message"
            className="flex-1 rounded-full border border-sand-dark bg-cream px-4 py-2.5 text-sm outline-none focus:border-forest-400"
          />
          <button type="submit" aria-label="Send" className="rounded-full bg-forest-800 p-2.5 text-ivory transition hover:bg-forest-700">
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </>
  );
}
