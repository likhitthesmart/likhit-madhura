"use client";
import { useState } from "react";
import { Star } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { dateLong, cn } from "@/lib/format";
import {
  EmptyState,
  Note,
  PageLoader,
  Panel,
  StatusBadge,
  Tabs,
  btnGhost,
  useAdminFetch,
} from "@/components/admin/ui";

interface AdminReview {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  verified: boolean;
  createdAt: string;
  user: { name: string; email: string };
  product: { name: string; slug: string };
}

export default function ReviewsPage() {
  const token = useAuth((s) => s.accessToken);
  const [status, setStatus] = useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const { data, error, loading, reload } = useAdminFetch<{ reviews: AdminReview[] }>(`/admin/reviews?status=${status}`);
  const [msg, setMsg] = useState<string | null>(null);

  const moderate = async (id: string, next: "APPROVED" | "REJECTED") => {
    setMsg(null);
    try {
      await api(`/admin/reviews/${id}`, { method: "PATCH", token, body: JSON.stringify({ status: next }) });
      reload();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Update failed");
    }
  };

  return (
    <div className="space-y-4">
      <Tabs
        tabs={[
          { key: "PENDING", label: "Pending" },
          { key: "APPROVED", label: "Approved" },
          { key: "REJECTED", label: "Rejected" },
        ]}
        active={status}
        onChange={(k) => setStatus(k as typeof status)}
      />
      {msg && <Note>{msg}</Note>}
      {error && <Note>{error}</Note>}

      {loading ? (
        <PageLoader />
      ) : data?.reviews.length ? (
        <div className="space-y-3">
          {data.reviews.map((r) => (
            <Panel key={r.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} className={cn("h-3.5 w-3.5", i < r.rating ? "fill-gold text-gold" : "text-white/15")} />
                      ))}
                    </span>
                    {r.title && <span className="font-medium text-ivory">{r.title}</span>}
                    {r.verified && <StatusBadge status="VERIFIED" />}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-ivory/70">{r.body}</p>
                  <p className="mt-2 text-xs text-ivory/40">
                    {r.user.name} ({r.user.email}) on <span className="text-forest-300">{r.product.name}</span> · {dateLong(r.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {status !== "APPROVED" && (
                    <button
                      className="rounded-lg border border-emerald-500/30 px-3 py-1.5 text-sm text-emerald-300 transition-colors hover:bg-emerald-500/10"
                      onClick={() => void moderate(r.id, "APPROVED")}
                    >
                      Approve
                    </button>
                  )}
                  {status !== "REJECTED" && (
                    <button
                      className="rounded-lg border border-rose-500/30 px-3 py-1.5 text-sm text-rose-300 transition-colors hover:bg-rose-500/10"
                      onClick={() => void moderate(r.id, "REJECTED")}
                    >
                      Reject
                    </button>
                  )}
                </div>
              </div>
            </Panel>
          ))}
        </div>
      ) : (
        <Panel>
          <EmptyState label={`No ${status.toLowerCase()} reviews`} />
        </Panel>
      )}
    </div>
  );
}
