"use client";
import { useEffect, type PropsWithChildren } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { useAuth } from "@/store/auth";
import { usePrefs } from "@/store/prefs";

// held so the scroll-to-top below can go through Lenis — a plain window.scrollTo is
// fought by Lenis's rAF loop, which keeps animating toward its own target
let lenisRef: Lenis | null = null;

function useLenis() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // allowNestedScroll: the wheel goes to whatever scrollable element is under the
    // cursor (modal bodies, dropdowns, the admin sidebar) instead of Lenis always
    // driving the page. body{overflow:hidden} alone can't stop Lenis — it scrolls
    // the window itself from raw wheel deltas.
    const lenis = new Lenis({ lerp: 0.12, smoothWheel: true, allowNestedScroll: true });
    lenisRef = lenis;
    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      lenisRef = null;
    };
  }, []);
}

/** Jump to the top of the page. Has to go through Lenis when it is running: Lenis
 *  keeps animating toward its own target, so a bare window.scrollTo gets undone a
 *  frame later. Both are called because Lenis is skipped under reduced-motion. */
export function scrollToTop() {
  lenisRef?.scrollTo(0, { immediate: true });
  window.scrollTo(0, 0);
}

/* The browser restores the previous scroll position before a streamed page has its
   full height, so it clamps somewhere mid-page and stays there. Own the position
   instead: manual restoration, then top on every route.
   Keyed on pathname only — /shop filter changes are query-only pushes with
   { scroll: false } and must not jump the customer back to the top. Multi-step
   flows that never change the URL call scrollToTop() themselves. */
function useScrollTop() {
  const pathname = usePathname();
  useEffect(() => {
    history.scrollRestoration = "manual";
    scrollToTop();
  }, [pathname]);
}

function useSessionBootstrap() {
  const bootstrap = useAuth((s) => s.bootstrap);
  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  // pull this account's search history in on sign-in, wipe it on sign-out
  const userId = useAuth((s) => s.user?.id);
  const ready = useAuth((s) => s.ready);
  useEffect(() => {
    if (ready) void usePrefs.getState().loadSearches();
  }, [userId, ready]);
}

/* crypto.randomUUID() only exists in a secure context — over plain HTTP on anything
   but localhost (a phone hitting the dev server on the LAN, an IP-only staging box)
   it is undefined and throws. getRandomValues has no such restriction; the last
   resort is only an analytics session marker, so Math.random is good enough there. */
function newSessionId() {
  if (typeof crypto !== "undefined") {
    if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
    if (typeof crypto.getRandomValues === "function")
      return Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function usePageviews() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    let sessionId = localStorage.getItem("mn_session");
    if (!sessionId) {
      sessionId = newSessionId();
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
  useScrollTop();
  useSessionBootstrap();
  usePageviews();
  return <>{children}</>;
}
