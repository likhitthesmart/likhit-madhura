"use client";
import {
  useCallback,
  useEffect,
  useRef,
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
          ? "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300"
          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      )}
    >
      {children}
    </div>
  );
}

export function EmptyState({ label }: { label: string }) {
  return <p className="py-10 text-center text-sm text-bark/70">{label}</p>;
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
    <section className={cn("rounded-2xl border border-sand bg-surface p-5 shadow-soft", className)}>
      {(title || actions) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatCard({
  label,
  value,
  hint,
  size = "md",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  /** "lg" for the one or two figures a page is actually about; the rest stay "md" so
   *  a wall of equal-weight tiles doesn't flatten the hierarchy. */
  size?: "md" | "lg";
}) {
  const lg = size === "lg";
  return (
    <div className={cn("rounded-2xl border border-sand bg-surface shadow-soft transition-colors hover:border-gold/40", lg ? "p-5" : "p-4")}>
      <p className="text-[11px] font-medium uppercase tracking-wider text-bark">{label}</p>
      {/* tabular-nums so digits keep their columns as the numbers tick over */}
      <p className={cn("mt-1.5 font-display font-semibold tabular-nums text-ink", lg ? "text-4xl" : "text-2xl")}>{value}</p>
      {hint && <p className="mt-1 text-xs text-forest-600">{hint}</p>}
    </div>
  );
}

/* ---------- table ---------- */

export function Table({ head, children }: { head: ReactNode[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto overscroll-x-contain">
      <table className="w-full min-w-max text-sm">
        <thead>
          <tr className="border-b border-sand text-left text-[11px] uppercase tracking-wider text-bark/70">
            {head.map((h, i) => (
              <th key={i} className="px-3 py-2.5 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-sand">{children}</tbody>
      </table>
    </div>
  );
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cn("px-3 py-2.5 align-middle text-ink/80", className)}>{children}</td>;
}

export const rowCls = "transition-colors hover:bg-forest-50/70";

/* ---------- buttons ---------- */

export const btnPrimary =
  "inline-flex items-center gap-1.5 rounded-lg bg-gold px-3.5 py-2 text-sm font-semibold text-deep-950 transition-colors hover:bg-gold-light disabled:opacity-50";
export const btnGhost =
  "inline-flex items-center gap-1.5 rounded-lg border border-sand px-3 py-1.5 text-sm text-ink/75 transition-colors hover:border-gold/40 hover:text-ink disabled:opacity-50";

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
          ? "border-rose-500/50 bg-rose-500/20 text-rose-700 dark:text-rose-200"
          : "border-sand text-bark hover:border-rose-500/40 hover:text-rose-600 dark:hover:text-rose-300",
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
          "flex max-h-[calc(100vh-2rem)] w-full flex-col rounded-2xl border border-sand bg-surface shadow-lift",
          wide ? "max-w-3xl" : "max-w-lg"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-sand px-6 py-4">
          <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-bark/80 transition-colors hover:bg-forest-50 hover:text-ink"
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

/* ---------- date range ---------- */

/** Shared calendar filter. Uses the browser's own date picker (`input[type=date]`)
 *  rather than a picker library — same control every admin page, no dependency.
 *  Values are plain YYYY-MM-DD; the API reads them as whole IST days. */
export function DateRange({
  from,
  to,
  onChange,
}: {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}) {
  // en-CA formats as YYYY-MM-DD, and uses the admin's own clock — so "Today"
  // means their today, matching the IST day the API filters on.
  const day = (agoDays = 0) => {
    const d = new Date();
    d.setDate(d.getDate() - agoDays);
    return d.toLocaleDateString("en-CA");
  };
  const active = (f: string, t: string) => from === f && to === t;
  const presets: [string, string, string][] = [
    ["Today", day(), day()],
    ["7 days", day(6), day()],
    ["30 days", day(29), day()],
  ];
  // the native date popup follows color-scheme, so it has to track the app theme —
  // hardcoding dark gave a black picker sitting on a cream page in light mode
  const field = cn(inputCls, "w-auto [color-scheme:light] dark:[color-scheme:dark]");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input type="date" aria-label="From date" value={from} max={to || undefined} onChange={(e) => onChange(e.target.value, to)} className={field} />
      <span className="text-bark/50">→</span>
      <input type="date" aria-label="To date" value={to} min={from || undefined} onChange={(e) => onChange(from, e.target.value)} className={field} />
      {presets.map(([label, f, t]) => (
        <button
          key={label}
          type="button"
          onClick={() => onChange(f, t)}
          className={cn(
            "rounded-lg px-2.5 py-1.5 text-xs transition-colors",
            active(f, t) ? "bg-gold/15 font-medium text-gold" : "text-bark/80 hover:bg-forest-50 hover:text-ink"
          )}
        >
          {label}
        </button>
      ))}
      {(from || to) && (
        <button type="button" onClick={() => onChange("", "")} className="rounded-lg px-2.5 py-1.5 text-xs text-bark/70 transition-colors hover:text-ink">
          Clear
        </button>
      )}
    </div>
  );
}

/** `?from=&to=` for an admin list endpoint — empty when no range is picked. */
export const rangeQuery = (from: string, to: string) =>
  `${from ? `&from=${from}` : ""}${to ? `&to=${to}` : ""}`;

/* ---------- form controls ---------- */

export const inputCls =
  "w-full rounded-lg border border-sand bg-cream px-3 py-2 text-sm text-ink placeholder:text-bark/50 outline-none transition-colors focus:border-gold/50";

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block text-xs font-medium text-bark">{label}</span>
      {children}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputCls, props.className)} />;
}

/** Search box with type-ahead. `suggest` runs against the same endpoint the search
 *  itself hits, so a suggestion can never offer a row the search would then miss.
 *  Picking one commits immediately; typing and pressing Enter still submits the
 *  enclosing form as before. */
export function SearchInput({
  value,
  onChange,
  onPick,
  suggest,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  onPick: (v: string) => void;
  /** `label` is what the admin reads; `value` is what actually goes into the query,
   *  so a row can be shown as "Name · email" while searching by the email alone. */
  suggest: (q: string) => Promise<{ label: string; value: string }[]>;
  placeholder?: string;
  className?: string;
}) {
  const [items, setItems] = useState<{ label: string; value: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  // kept in a ref because callers pass an inline arrow: as an effect dependency its
  // new identity every render would re-run the fetch in a loop
  const suggestRef = useRef(suggest);
  suggestRef.current = suggest;

  useEffect(() => {
    const q = value.trim();
    if (q.length < 2) {
      setItems([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(() => {
      suggestRef.current(q)
        .then((s) => {
          if (cancelled) return;
          setItems(s.slice(0, 8));
          setActive(-1);
        })
        .catch(() => undefined); // a failed lookup just means no suggestions
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [value]);

  const pick = (s: string) => {
    onChange(s);
    onPick(s);
    setOpen(false);
  };

  const shown = open && items.length > 0;

  return (
    <div className={cn("relative", className)}>
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (!shown) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => (i + 1) % items.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => (i <= 0 ? items.length - 1 : i - 1));
          } else if (e.key === "Escape") {
            setOpen(false);
          } else if (e.key === "Enter" && active >= 0) {
            // only swallow Enter when a suggestion is highlighted; otherwise the
            // form submits with whatever was typed, as it always did
            e.preventDefault();
            pick(items[active].value);
          }
        }}
        placeholder={placeholder}
        className={inputCls}
        role="combobox"
        aria-expanded={shown}
        aria-autocomplete="list"
        autoComplete="off"
      />
      {shown && (
        <ul role="listbox" className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-sand bg-surface py-1 shadow-lift">
          {items.map((s, i) => (
            <li key={`${s.value}-${i}`} role="option" aria-selected={i === active}>
              <button
                type="button"
                // mousedown, not click: blur fires first and would close the list
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(s.value);
                }}
                onMouseEnter={() => setActive(i)}
                className={cn("block w-full truncate px-3 py-2 text-left text-sm text-ink/80", i === active && "bg-forest-100 text-ink")}
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(inputCls, "[&>option]:bg-surface", props.className)} />;
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
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-ink/75">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-sand bg-cream accent-gold"
      />
      {label}
    </label>
  );
}

/* ---------- status badge ---------- */

/* Status hues sit outside the --c-* token system — they carry meaning, not brand — so
   each needs an explicit light/dark pair: the 300-weights are legible on a dark card
   and wash out on cream, the 700-weights the reverse. Written out in full rather than
   built from a helper because Tailwind only generates classes it can see as literal
   strings in the source; an interpolated `text-${hue}-300` would emit no CSS at all. */
const AMBER = "border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300";
const SKY = "border-sky-500/30 bg-sky-500/15 text-sky-700 dark:text-sky-300";
const EMERALD = "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
const ROSE = "border-rose-500/30 bg-rose-500/15 text-rose-700 dark:text-rose-300";

const badgeColors: Record<string, string> = {
  PENDING: AMBER,
  PROCESSING: SKY,
  PACKED: "border-violet-500/30 bg-violet-500/15 text-violet-700 dark:text-violet-300",
  SHIPPED: "border-indigo-500/30 bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
  DELIVERED: EMERALD,
  CANCELLED: ROSE,
  REFUNDED: "border-slate-500/30 bg-slate-500/15 text-slate-700 dark:text-slate-300",
  PAID: EMERALD,
  FAILED: ROSE,
  APPROVED: EMERALD,
  REJECTED: ROSE,
  NEW: AMBER,
  OPEN: SKY,
  RESOLVED: EMERALD,
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium tracking-wide",
        badgeColors[status] ?? "border-sand bg-forest-50 text-bark"
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
              : "text-bark/80 hover:bg-forest-50 hover:text-ink"
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
    <div className="mt-4 flex items-center justify-between text-sm text-bark">
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
  const fmt = (v: number) => (format ? format(v) : v.toLocaleString("en-IN"));
  const grid = [0, 0.25, 0.5, 0.75, 1]; // quarter lines to measure bar heights against
  return (
    <div className={className}>
      <div className="flex gap-2">
        {/* Value axis lives outside the SVG: preserveAspectRatio="none" stretches the
            viewBox horizontally to fit, which would smear any text drawn inside it. */}
        <div className="flex h-44 shrink-0 flex-col justify-between text-right text-[10px] tabular-nums leading-none text-bark/70">
          {[...grid].reverse().map((g) => (
            <span key={g}>{fmt(Math.round(max * g))}</span>
          ))}
        </div>
        <div className="w-full">
          <svg viewBox="0 0 100 42" preserveAspectRatio="none" className="h-44 w-full">
            {grid.map((g) => (
            <line
              key={g}
              x1="0"
              y1={41 - g * 38}
              x2="100"
              y2={41 - g * 38}
                className={g === 0 ? "stroke-sand-dark" : "stroke-sand"}
                strokeWidth={g === 0 ? 0.4 : 0.25}
              />
            ))}
            {data.map((d, i) => {
              const h = (d.value / max) * 38;
              return (
                <rect
                  key={i}
                  x={i * bw + bw * 0.18}
                  y={41 - h}
                  width={bw * 0.64}
                  height={Math.max(h, 0.4)}
                  className="fill-gold transition-opacity hover:opacity-70"
                >
                  <title>{`${d.label} — ${fmt(d.value)}`}</title>
                </rect>
              );
            })}
          </svg>
          {/* inside the chart column so the ends line up with the first and last bar
              rather than with the value axis */}
          <div className="mt-1 flex justify-between text-[10px] text-bark/70">
            <span>{data[0]?.label}</span>
            <span>{data[data.length - 1]?.label}</span>
          </div>
        </div>
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
  color = "bg-forest-500",
}: {
  /** `color` on an item overrides the shared one — used by the order-status panel so
   *  each status keeps the hue it has on its StatusBadge instead of eight identical bars. */
  items: { label: string; value: number; hint?: string; color?: string }[];
  color?: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (!items.length) return <EmptyState label="No data yet" />;
  return (
    <div className="space-y-3">
      {items.map((it, i) => (
        <div key={i}>
          <div className="mb-1 flex justify-between gap-4 text-xs">
            <span className="truncate font-medium text-ink/80">{it.label}</span>
            <span className="shrink-0 tabular-nums text-bark">{it.hint ?? it.value.toLocaleString("en-IN")}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-sand">
            <div
              className={cn("h-full rounded-full transition-all duration-300", it.color ?? color)}
              style={{ width: `${Math.max((it.value / max) * 100, 2)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
