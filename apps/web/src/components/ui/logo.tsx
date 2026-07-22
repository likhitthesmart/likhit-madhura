import { cn } from "@/lib/format";

/* Interlocking six-petal lotus + four cardinal sparkles — a faithful vector
   recreation of the Madhura Naturals brand mark. Petals are stroked vesica
   shapes woven around a central rosette. */
export function LotusMark({ className }: { className?: string }) {
  // one petal pointing up, tip at top, base crossing through the centre so
  // neighbouring petals interlace into an inner six-point rosette
  const petal = "M50 50 C 38 41, 36.5 23, 50 10 C 63.5 23, 62 41, 50 50 Z";
  const angles = [0, 60, 120, 180, 240, 300];
  const spark = (cx: number, cy: number, r: number) =>
    `M${cx} ${cy - r} L${cx + r * 0.28} ${cy - r * 0.28} L${cx + r} ${cy} L${cx + r * 0.28} ${cy + r * 0.28} L${cx} ${cy + r} L${cx - r * 0.28} ${cy + r * 0.28} L${cx - r} ${cy} L${cx - r * 0.28} ${cy - r * 0.28} Z`;
  return (
    <svg viewBox="0 0 100 100" className={cn("text-current", className)} aria-hidden role="img">
      <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
        {angles.map((a) => (
          <path key={a} d={petal} transform={`rotate(${a} 50 50)`} />
        ))}
      </g>
      <g fill="currentColor">
        <path d={spark(50, 7, 4.2)} />
        <path d={spark(50, 93, 4.2)} />
        <path d={spark(9, 50, 4.2)} />
        <path d={spark(91, 50, 4.2)} />
      </g>
    </svg>
  );
}

export function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", light ? "text-ivory" : "text-forest-900", className)}>
      <LotusMark className="h-9 w-9 shrink-0" />
      <span className="leading-none">
        <span className="block font-display text-xl font-semibold tracking-[0.2em]">MADHURA</span>
        <span className={cn("mt-1 block text-[0.58rem] font-medium tracking-[0.52em]", light ? "text-ivory/80" : "text-bark/70")}>
          NATURALS
        </span>
      </span>
    </span>
  );
}
