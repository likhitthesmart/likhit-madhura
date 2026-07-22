"use client";
import { useEffect, useRef, type PropsWithChildren } from "react";

/* Progressive-enhancement reveals: server HTML is fully visible; only after
   hydration do elements briefly hide and rise into view. No JS => no blank page. */

const EASE = "cubic-bezier(.22,1,.36,1)";

function useReveal(delay: number, stagger = false) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const extra = stagger && el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) * 0.09 : 0;
    const total = delay + extra;
    el.style.opacity = "0";
    el.style.transform = "translateY(26px)";
    el.style.transition = `opacity .7s ${EASE} ${total}s, transform .7s ${EASE} ${total}s`;
    const show = () => {
      el.style.opacity = "1";
      el.style.transform = "none";
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          show();
          io.disconnect();
        }
      },
      { rootMargin: "-40px 0px" }
    );
    io.observe(el);
    // safety net: never leave content hidden
    const failsafe = setTimeout(show, 2500 + total * 1000);
    return () => {
      io.disconnect();
      clearTimeout(failsafe);
    };
  }, [delay, stagger]);
  return ref;
}

export function Reveal({ children, delay = 0, className }: PropsWithChildren<{ delay?: number; className?: string }>) {
  const ref = useReveal(delay);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

export function Stagger({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <div className={className}>{children}</div>;
}

export function StaggerItem({ children, className }: PropsWithChildren<{ className?: string }>) {
  const ref = useReveal(0, true);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
