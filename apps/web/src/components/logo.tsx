import { cn } from "@/lib/format";

/* Lotus line-mark + serif wordmark recreated from the supplied brand logo */
export function LotusMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" className={cn("text-current", className)} aria-hidden>
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        {/* central petal */}
        <path d="M50 18 C42 32 42 44 50 54 C58 44 58 32 50 18 Z" />
        {/* side petals */}
        <path d="M50 54 C38 46 26 46 18 52 C26 60 40 62 50 54 Z" />
        <path d="M50 54 C62 46 74 46 82 52 C74 60 60 62 50 54 Z" />
        {/* lower petals */}
        <path d="M50 54 C40 62 36 74 40 84 C50 80 54 66 50 54 Z" />
        <path d="M50 54 C60 62 64 74 60 84 C50 80 46 66 50 54 Z" />
        {/* outer sweeping petals */}
        <path d="M50 54 C34 40 30 26 36 16 C48 24 52 40 50 54 Z" opacity="0.6" />
        <path d="M50 54 C66 40 70 26 64 16 C52 24 48 40 50 54 Z" opacity="0.6" />
      </g>
      {/* sparkles */}
      <g fill="currentColor">
        <path d="M50 6 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6 Z" />
        <path d="M14 38 l1.3 3.2 3.2 1.3 -3.2 1.3 -1.3 3.2 -1.3 -3.2 -3.2 -1.3 3.2 -1.3 Z" />
        <path d="M86 38 l1.3 3.2 3.2 1.3 -3.2 1.3 -1.3 3.2 -1.3 -3.2 -3.2 -1.3 3.2 -1.3 Z" />
        <path d="M50 88 l1.3 3.2 3.2 1.3 -3.2 1.3 -1.3 3.2 -1.3 -3.2 -3.2 -1.3 3.2 -1.3 Z" />
      </g>
    </svg>
  );
}

export function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", light ? "text-ivory" : "text-forest-900", className)}>
      <LotusMark className="h-9 w-9 shrink-0" />
      <span className="leading-none">
        <span className="block font-display text-xl font-semibold tracking-[0.18em]">MADHURA</span>
        <span className={cn("mt-1 block text-[0.6rem] font-medium tracking-[0.5em]", light ? "text-ivory/80" : "text-bark/70")}>
          NATURALS
        </span>
      </span>
    </span>
  );
}
