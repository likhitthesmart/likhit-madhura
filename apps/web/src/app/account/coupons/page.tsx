"use client";
import { useEffect, useState } from "react";
import { Copy, Ticket } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { inr, dateLong } from "@/lib/format";

interface Coupon { code: string; description?: string | null; type: "PERCENT" | "FLAT"; value: number; minCart: number; endsAt?: string | null }

export default function CouponsPage() {
  const { accessToken } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[] | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    api<{ coupons: Coupon[] }>("/account/coupons", { token: accessToken }).then((r) => setCoupons(r.coupons)).catch(() => setCoupons([]));
  }, [accessToken]);

  if (!coupons) return <div className="card-organic p-10 text-center text-sm text-bark/60">Loading coupons…</div>;
  if (!coupons.length) return <div className="card-organic p-10 text-center text-sm text-bark/60">No coupons available right now — subscribers hear first!</div>;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {coupons.map((c) => (
        <div key={c.code} className="card-organic relative overflow-hidden p-6">
          <Ticket className="absolute -right-3 -top-3 h-16 w-16 rotate-12 text-gold/15" />
          <p className="font-display text-2xl font-semibold tracking-wider text-forest-900">{c.code}</p>
          <p className="mt-1 text-sm text-bark/70">{c.description ?? (c.type === "PERCENT" ? `${c.value}% off` : `${inr(c.value)} off`)}</p>
          <p className="mt-2 text-xs text-bark/50">
            {c.minCart > 0 && <>On orders above {inr(c.minCart)} · </>}
            {c.endsAt ? `Valid till ${dateLong(c.endsAt)}` : "No expiry"}
          </p>
          <button
            onClick={() => {
              void navigator.clipboard.writeText(c.code);
              setCopied(c.code);
              setTimeout(() => setCopied(null), 1200);
            }}
            className="btn-secondary mt-4 px-4 py-1.5 text-xs"
          >
            <Copy className="h-3 w-3" /> {copied === c.code ? "Copied!" : "Copy code"}
          </button>
        </div>
      ))}
    </div>
  );
}
