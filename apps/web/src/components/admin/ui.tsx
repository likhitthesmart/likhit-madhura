"use client";
import {
  useCallback,
  useEffect,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { Loader2, X } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { cn } from "@/lib/format";

/* ---------- data fetching ---------- */

export function useAdminFetch<T>(path: string | null) {
  const token = useAuth((s) => s.accessToken);
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    if (!token || !path) return;
    setLoading(true);
    api<T>(path, { token })
      .then((d) => {
        setData(d);
        setError(null);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Request failed"))
      .finally(() => setLoading(false));
  }, [path, token]);

  useEffect(() => reload(), [reload]);
  return { data, error, loading, reload };
}

/** Fetch a protected CSV endpoint as a blob and trigger a download (plain links can't carry the Bearer token). */
export async function downloadCsv(path: string, filename: string, token: string | null) {
  const res = await fetch(`/api/v1${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`Export failed (${res.status})`);
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ---------- money / list form helpers (all API money is integer paise) ---------- */

export const paiseToRupees = (p: number | null | undefined) => (p == null ? "" : String(p / 100));
export const rupeesToPaise = (s: string) => Math.round((parseFloat(s) || 0) * 100);
export const csvToList = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);
export const listToCsv = (a: string[] | null | undefined) => (a ?? []).join(", ");
export const toDatetimeLocal = (iso: string | null | undefined) => {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};
export const fromDatetimeLocal = (v: string) => (v ? new Date(v).toISOString() : null);

/* ---------- primitives ---------- */

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-5 w-5 animate-spin text-gold", className)} />;
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center py-24">
      <Spinner className="h-7 w-7" />
    </div>
  );
}

/** Toast-like inline message for fetch/save errors and successes. */
export function Note({ kind = "error", children }: { kind?: "error" | "ok"; children: ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2 text-sm",
        kind === "error"
          ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      )}
    >
      {children}
    </div>
  );
}

export function EmptyState({ label }: { label: string }) {
  return <p className="py-10 text-center text-sm text-ivory/40">{label}</p>;
}

export function Panel({
  title,
  actions,
  children,
  className,
}: {
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-white/5 bg-[#1c2216] p-5 shadow-soft", className)}>
      {(title || actions) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="font-display text-lg font-semibold text-ivory">{title}</h2>}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#1c2216] p-4 shadow-soft transition-colors hover:border-gold/20">
      <p className="text-[11px] font-medium uppercase tracking-wider text-ivory/40">{label}</p>
      <p className="mt-1.5 font-display text-2xl font-semibold text-ivory">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-sage">{hint}</p>}
    </div>
  );
}

/* ---------- table ---------- */

export function Table({ head, children }: { head: ReactNode[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-max text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wider text-ivory/40">
            {head.map((h, i) => (
              <th key={i} className="px-3 py-2.5 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">{children}</tbody>
      </table>
    </div>
  );
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cn("px-3 py-2.5 align-middle text-ivory/80", className)}>{children}</td>;
}

export const rowCls = "transition-colors hover:bg-white/[0.03]";

/* ---------- buttons ---------- */

export const btnPrimary =
  "inline-flex items-center gap-1.5 rounded-lg bg-gold px-3.5 py-2 text-sm font-semibold text-deep-950 transition-colors hover:bg-gold-light disabled:opacity-50";
export const btnGhost =
  "inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-sm text-ivory/70 transition-colors hover:border-gold/40 hover:text-ivory disabled:opacity-50";

export function ConfirmButton({
  onConfirm,
  children,
  className,
}: {
  onConfirm: () => void;
  children: ReactNode;
  className?: string;
}) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <button
      type="button"
      onClick={() => {
        if (armed) {
          setArmed(false);
          onConfirm();
        } else setArmed(true);
      }}
      className={cn(
        "rounded-lg border px-2.5 py-1 text-xs transition-colors",
        armed
          ? "border-rose-500/50 bg-rose-500/20 text-rose-200"
          : "border-white/10 text-ivory/60 hover:border-rose-500/40 hover:text-rose-300",
        className
      )}
    >
      {armed ? "Confirm?" : children}
    </button>
  );
}

/* ---------- modal ---------- */

export function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  // Lock the page behind the dialog: without this the wheel scrolls the admin
  // table under the overlay once the dialog's own content reaches its end.
  // The padding replaces the width the scrollbar gave up, so nothing shifts.
  useEffect(() => {
    const { body } = document;
    const prevOverflow = body.style.overflow;
    const prevPadding = body.style.paddingRight;
    const gap = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (gap > 0) body.style.paddingRight = `${gap}px`;
    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPadding;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* The panel is capped to the viewport and owns the scrolling, rather than
          the overlay doing it — the scrollable element is then the one directly
          under the pointer, and the title bar stays put on long content. */}
      <div
        className={cn(
          "flex max-h-[calc(100vh-2rem)] w-full flex-col rounded-2xl border border-white/10 bg-[#1c2216] shadow-lift",
          wide ? "max-w-3xl" : "max-w-lg"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="font-display text-xl font-semibold text-ivory">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-ivory/50 transition-colors hover:bg-white/5 hover:text-ivory"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {/* min-h-0 lets this flex child shrink below its content height; without
            it the panel grows past the cap and nothing scrolls at all. */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-6">{children}</div>
      </div>
    </div>
  );
}

/* ---------- form controls ---------- */

export const inputCls =
  "w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-ivory placeholder:text-ivory/30 outline-none transition-colors focus:border-gold/50";

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block text-xs font-medium text-ivory/60">{label}</span>
      {children}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputCls, props.className)} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(inputCls, "[&>option]:bg-[#1c2216]", props.className)} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(inputCls, "min-h-[80px]", props.className)} />;
}

export function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-ivory/70">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-white/20 bg-black/30 accent-[#c9a24b]"
      />
      {label}
    </label>
  );
}

/* ---------- status badge ---------- */

const badgeColors: Record<string, string> = {
  PENDING: "border-amber-500/30 bg-amber-500/15 text-amber-300",
  PROCESSING: "border-sky-500/30 bg-sky-500/15 text-sky-300",
  PACKED: "border-violet-500/30 bg-violet-500/15 text-violet-300",
  SHIPPED: "border-indigo-500/30 bg-indigo-500/15 text-indigo-300",
  DELIVERED: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
  CANCELLED: "border-rose-500/30 bg-rose-500/15 text-rose-300",
  REFUNDED: "border-slate-500/30 bg-slate-500/15 text-slate-300",
  PAID: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
  FAILED: "border-rose-500/30 bg-rose-500/15 text-rose-300",
  APPROVED: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
  REJECTED: "border-rose-500/30 bg-rose-500/15 text-rose-300",
  NEW: "border-amber-500/30 bg-amber-500/15 text-amber-300",
  OPEN: "border-sky-500/30 bg-sky-500/15 text-sky-300",
  RESOLVED: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium tracking-wide",
        badgeColors[status] ?? "border-white/10 bg-white/5 text-ivory/60"
      )}
    >
      {status}
    </span>
  );
}

/* ---------- tabs / pagination ---------- */

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: string; label: string; count?: number }[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm transition-colors",
            active === t.key
              ? "bg-gold/15 font-medium text-gold"
              : "text-ivory/50 hover:bg-white/5 hover:text-ivory"
          )}
        >
          {t.label}
          {t.count != null && <span className="ml-1.5 text-xs opacity-60">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Pagination({
  page,
  pages,
  onPage,
}: {
  page: number;
  pages: number;
  onPage: (p: number) => void;
}) {
  if (pages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-ivory/60">
      <button type="button" className={btnGhost} disabled={page <= 1} onClick={() => onPage(page - 1)}>
        Previous
      </button>
      <span>
        Page {page} of {pages}
      </span>
      <button type="button" className={btnGhost} disabled={page >= pages} onClick={() => onPage(page + 1)}>
        Next
      </button>
    </div>
  );
}

/* ---------- SVG charts ---------- */

export function BarChart({
  data,
  format,
  className,
}: {
  data: { label: string; value: number }[];
  format?: (v: number) => string;
  className?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const bw = 100 / Math.max(1, data.length);
  if (!data.length) return <EmptyState label="No data yet" />;
  return (
    <div className={className}>
      <svg viewBox="0 0 100 42" preserveAspectRatio="none" className="h-44 w-full">
        <line x1="0" y1="41" x2="100" y2="41" className="stroke-white/10" strokeWidth="0.4" />
        {data.map((d, i) => {
          const h = (d.value / max) * 38;
          return (
            <rect
              key={i}
              x={i * bw + bw * 0.15}
              y={41 - h}
              width={bw * 0.7}
              height={Math.max(h, 0.4)}
              className="fill-gold opacity-75 transition-opacity hover:opacity-100"
            >
              <title>{`${d.label} — ${format ? format(d.value) : d.value.toLocaleString("en-IN")}`}</title>
            </rect>
          );
        })}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-ivory/40">
        <span>{data[0]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}

export function Sparkline({ values, className }: { values: number[]; className?: string }) {
  if (!values.length) return null;
  const max = Math.max(1, ...values);
  const step = values.length > 1 ? 100 / (values.length - 1) : 100;
  const points = values.map((v, i) => `${i * step},${28 - (v / max) * 26}`).join(" ");
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className={cn("h-8 w-full", className)}>
      <polyline points={points} fill="none" strokeWidth="1.5" className="stroke-sage" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** Horizontal bar breakdown (traffic sources, devices, funnels…). */
export function Bars({
  items,
  color = "bg-sage/70",
}: {
  items: { label: string; value: number; hint?: string }[];
  color?: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (!items.length) return <EmptyState label="No data yet" />;
  return (
    <div className="space-y-3">
      {items.map((it, i) => (
        <div key={i}>
          <div className="mb-1 flex justify-between gap-4 text-xs">
            <span className="truncate text-ivory/70">{it.label}</span>
            <span className="shrink-0 tabular-nums text-ivory/50">{it.hint ?? it.value.toLocaleString("en-IN")}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
            <div className={cn("h-full rounded-full transition-all duration-300", color)} style={{ width: `${(it.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
