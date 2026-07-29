"use client";
import { usePathname } from "next/navigation";
import type { PropsWithChildren } from "react";

/* Re-keying on pathname restarts the CSS enter animation on every navigation,
   so route changes fade in instead of snapping. */
export function PageTransition({ children }: PropsWithChildren) {
  const pathname = usePathname();
  return (
    <main key={pathname} className="min-h-screen page-enter">
      {children}
    </main>
  );
}
