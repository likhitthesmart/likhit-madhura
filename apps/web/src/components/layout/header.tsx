"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Heart, Menu, Mic, Moon, Search, ShoppingBag, Sun, User, X } from "lucide-react";
import { Logo } from "../ui/logo";
import { useCart, cartCount } from "@/store/cart";
import { useAuth } from "@/store/auth";
import { usePrefs } from "@/store/prefs";
import { toggleTheme } from "@/store/theme";
import { api } from "@/lib/api";
import { inr, cn } from "@/lib/format";

const nav = [
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "Our Story" },
  { href: "/our-heritage", label: "Heritage" },
  { href: "/blog", label: "Journal" },
  { href: "/reviews", label: "Reviews" },
  { href: "/contact", label: "Contact" },
];

interface Suggestion { slug: string; name: string; unit: string; price: number; images: string[] }

function SearchOverlay({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Suggestion[]>([]);
  const [trending, setTrending] = useState<string[]>([]);
  const [listening, setListening] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const { recentSearches, addSearch } = usePrefs();

  useEffect(() => inputRef.current?.focus(), []);
  useEffect(() => {
    if (q.trim().length < 2) {
      setItems([]);
      return;
    }
    const t = setTimeout(() => {
      api<{ items: Suggestion[]; trending: string[] }>(`/search/suggest?q=${encodeURIComponent(q.trim())}`)
        .then((d) => {
          setItems(d.items);
          setTrending(d.trending);
        })
        .catch(() => undefined);
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  const go = (query: string) => {
    if (!query.trim()) return;
    addSearch(query.trim());
    onClose();
    router.push(`/shop?q=${encodeURIComponent(query.trim())}`);
  };

  const voice = () => {
    type SR = { new (): { lang: string; onresult: (e: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void; onend: () => void; start: () => void } };
    const w = window as unknown as { webkitSpeechRecognition?: SR; SpeechRecognition?: SR };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = "en-IN";
    setListening(true);
    rec.onresult = (e) => setQ(e.results[0][0].transcript);
    rec.onend = () => setListening(false);
    rec.start();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-deep-950/40 backdrop-blur-sm" onClick={onClose}>
      <div className="mx-auto mt-20 w-[min(640px,92vw)] card-organic overflow-hidden bg-surface p-0" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-sand px-5 py-4">
          <Search className="h-5 w-5 text-forest-600" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && go(q)}
            placeholder="Search oils, millets, ghee…"
            className="flex-1 bg-transparent text-base outline-none placeholder:text-bark/40"
            aria-label="Search products"
          />
          <button onClick={voice} aria-label="Voice search" className={cn("rounded-full p-2 transition", listening ? "bg-copper text-ivory" : "text-bark/50 hover:bg-sand")}>
            <Mic className="h-4 w-4" />
          </button>
          <button onClick={onClose} aria-label="Close search" className="rounded-full p-2 text-bark/50 hover:bg-sand">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto overscroll-contain p-5">
          {items.length > 0 && (
            <ul className="space-y-1">
              {items.map((p) => (
                <li key={p.slug}>
                  <Link href={`/product/${p.slug}`} onClick={onClose} className="flex items-center gap-4 rounded-xl p-2.5 transition hover:bg-cream">
                    {p.images[0] && <img src={p.images[0]} alt="" className="h-12 w-12 rounded-lg object-cover" />}
                    <span className="flex-1">
                      <span className="block text-sm font-medium text-ink">{p.name}</span>
                      <span className="text-xs text-bark/60">{p.unit}</span>
                    </span>
                    <span className="text-sm font-semibold text-forest-800">{inr(p.price)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {q.trim().length >= 2 && items.length === 0 && (
            <p className="py-6 text-center text-sm text-bark/60">No products match “{q}” — try “ragi” or “oil”.</p>
          )}
          {q.trim().length < 2 && (
            <div className="space-y-5">
              {recentSearches.length > 0 && (
                <div>
                  <p className="label-field">Recent searches</p>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((s) => (
                      <button key={s} onClick={() => go(s)} className="rounded-full border border-sand-dark px-4 py-1.5 text-sm text-bark hover:border-forest-400 hover:text-forest-800">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="label-field">Trending</p>
                <div className="flex flex-wrap gap-2">
                  {(trending.length ? trending : ["A2 Ghee", "Sesame Oil", "Ragi", "Turmeric"]).map((s) => (
                    <button key={s} onClick={() => go(s)} className="rounded-full bg-forest-50 px-4 py-1.5 text-sm text-forest-800 hover:bg-forest-100">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const items = useCart((s) => s.items);
  const user = useAuth((s) => s.user);
  const pathname = usePathname();
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [pathname]);

  /* Deliberately does NOT consult the pathname. "Is this a page with a hero?" is
     answered in CSS via body:has(#hero), which the browser resolves on the first
     style pass; usePathname() only exists after hydration, so on a slow connection
     the homepage sat under an opaque cream bar until the JS bundle landed. */
  const solid = scrolled || menuOpen;
  const count = cartCount(items);

  return (
    <>
      <header
        data-solid={solid ? "true" : "false"}
        className="site-header fixed inset-x-0 top-0 z-50 transition-all duration-500"
      >
        <div className="container-page flex h-[4.5rem] items-center justify-between gap-2 sm:gap-4">
          <Link href="/" aria-label="Madhura Naturals home" className="min-w-0">
            <Logo className="scale-[0.78] origin-left sm:scale-100" />
          </Link>
          <nav className="hidden items-center gap-7 lg:flex" aria-label="Main">
            {nav.map((n) => (
              <Link
                key={n.label}
                href={n.href}
                className="hdr-link text-sm font-medium tracking-wide transition-colors"
              >
                {n.label}
              </Link>
            ))}
          </nav>
          {/* phones keep only search + menu — theme moves to a bottom-left FAB, and
              wishlist/account/cart move into the mobile menu */}
          <div className="hdr-icons flex shrink-0 items-center gap-0.5 sm:gap-1">
            <button onClick={() => setSearchOpen(true)} aria-label="Search" className="rounded-full p-2 transition hover:bg-deep-900/10 sm:p-2.5">
              <Search className="h-5 w-5" />
            </button>
            <button onClick={toggleTheme} aria-label="Toggle dark theme" className="hidden rounded-full p-2.5 transition hover:bg-deep-900/10 sm:block">
              <Moon className="h-5 w-5 dark:hidden" />
              <Sun className="hidden h-5 w-5 dark:block" />
            </button>
            <Link href={user ? "/account/wishlist" : "/login"} aria-label="Wishlist" className="hidden rounded-full p-2.5 transition hover:bg-deep-900/10 sm:block">
              <Heart className="h-5 w-5" />
            </Link>
            <Link href={user ? "/account" : "/login"} aria-label={user ? "My account" : "Sign in"} className="hidden rounded-full p-2.5 transition hover:bg-deep-900/10 sm:block">
              <User className="h-5 w-5" />
            </Link>
            <Link href="/cart" aria-label={`Cart, ${count} items`} className="relative hidden rounded-full p-2.5 transition hover:bg-deep-900/10 sm:block">
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-copper px-1 text-[0.65rem] font-bold text-ivory">
                  {count}
                </span>
              )}
            </Link>
            <button onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu" aria-expanded={menuOpen} className="rounded-full p-2 transition hover:bg-deep-900/10 sm:p-2.5 lg:hidden">
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {/* Stays mounted and slides open via grid-rows 0fr→1fr — the one way to
            transition to "however tall the content is" without hardcoding a height.
            Unmounting instead would give an instant pop with no exit animation. */}
        <nav
          className={cn(
            "grid overflow-hidden bg-surface transition-[grid-template-rows,opacity] duration-300 ease-out lg:hidden",
            menuOpen ? "grid-rows-[1fr] border-t border-sand opacity-100" : "grid-rows-[0fr] opacity-0"
          )}
          aria-label="Mobile"
          inert={!menuOpen}
        >
          {/* min-h-0 lets the grid child collapse to 0; max-h + scroll keeps the menu
              usable in landscape, where 4.5rem of header plus nine rows runs past the fold */}
          <div className="min-h-0 max-h-[calc(100vh-4.5rem)] overflow-y-auto overscroll-contain px-6 py-2">
            {nav.map((n) => (
              <Link key={n.label} href={n.href} className="block border-b border-sand/60 py-3.5 text-sm font-medium text-bark">
                {n.label}
              </Link>
            ))}
            {/* shown here because the header drops these icons below sm */}
            <Link href="/cart" className="flex items-center gap-2 border-b border-sand/60 py-3.5 text-sm font-medium text-bark sm:hidden">
              Cart
              {count > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-copper px-1 text-[0.65rem] font-bold text-ivory">{count}</span>}
            </Link>
            <Link href={user ? "/account" : "/login"} className="block border-b border-sand/60 py-3.5 text-sm font-medium text-bark sm:hidden">
              {user ? "My account" : "Sign in"}
            </Link>
            <Link href={user ? "/account/wishlist" : "/login"} className="block py-3.5 text-sm font-medium text-bark sm:hidden">
              Wishlist
            </Link>
          </div>
        </nav>
      </header>
      {/* Tap-anywhere-else close. Starts below the 4.5rem bar so the X stays clickable,
          and sits under the header's z-50 so the open panel draws over it. */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 top-[4.5rem] z-40 bg-deep-950/40 transition-opacity duration-300 lg:hidden",
          menuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setMenuOpen(false)}
        aria-hidden
      />
      {/* mirrors the Madhu FAB on the right — same bottom-5 offset and 14×14 circle */}
      <button
        onClick={toggleTheme}
        aria-label="Toggle dark theme"
        className="fixed bottom-5 left-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-deep-800 text-ivory shadow-lift transition-all duration-300 hover:scale-105 hover:bg-deep-700 sm:hidden"
      >
        <Moon className="h-6 w-6 dark:hidden" />
        <Sun className="hidden h-6 w-6 dark:block" />
      </button>
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </>
  );
}
