"use client";
import { useEffect, type PropsWithChildren } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { useAuth } from "@/store/auth";

function useLenis() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // allowNestedScroll: the wheel goes to whatever scrollable element is under the
    // cursor (modal bodies, dropdowns, the admin sidebar) instead of Lenis always
    // driving the page. body{overflow:hidden} alone can't stop Lenis — it scrolls
    // the window itself from raw wheel deltas.
    const lenis = new Lenis({ lerp: 0.12, smoothWheel: true, allowNestedScroll: true });
    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);
}

function useSessionBootstrap() {
  const bootstrap = useAuth((s) => s.bootstrap);
  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);
}

function usePageviews() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    let sessionId = localStorage.getItem("mn_session");
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem("mn_session", sessionId);
    }
    const ua = navigator.userAgent;
    const device = /Mobi/.test(ua) ? "mobile" : /Tablet|iPad/.test(ua) ? "tablet" : "desktop";
    const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : /Firefox\//.test(ua) ? "Firefox" : "Other";
    const os = /Windows/.test(ua) ? "Windows" : /Mac OS/.test(ua) ? "macOS" : /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Linux/.test(ua) ? "Linux" : "Other";
    void fetch("/api/v1/analytics/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        type: "pageview",
        path: pathname,
        referrer: document.referrer || undefined,
        device,
        browser,
        os,
        screen: `${window.screen.width}x${window.screen.height}`,
      }),
      keepalive: true,
    }).catch(() => undefined);
  }, [pathname]);
}

export function trackEvent(type: string, meta?: Record<string, unknown>) {
  const sessionId = localStorage.getItem("mn_session") ?? "anon";
  void fetch("/api/v1/analytics/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, type, path: location.pathname, meta }),
    keepalive: true,
  }).catch(() => undefined);
}

export function Providers({ children }: PropsWithChildren) {
  useLenis();
  useSessionBootstrap();
  usePageviews();
  return <>{children}</>;
}
