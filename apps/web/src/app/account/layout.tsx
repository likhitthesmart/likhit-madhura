"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, LayoutDashboard, LogOut, MapPin, Package, Settings, Ticket } from "lucide-react";
import { useAuth } from "@/store/auth";
import { cn } from "@/lib/format";
import { useEffect } from "react";

const nav = [
  { href: "/account", label: "Overview", icon: LayoutDashboard },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/coupons", label: "My Coupons", icon: Ticket },
  { href: "/account/settings", label: "Settings", icon: Settings },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user, ready, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  if (!ready)
    return <div className="flex min-h-screen items-center justify-center pt-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-forest-300 border-t-forest-800" /></div>;
  if (!user) return null;

  return (
    <div className="container-page pb-24 pt-28">
      <h1 className="font-display text-4xl font-medium text-forest-900">Namaste, {user.name.split(" ")[0]}</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
        {/* min-w-0: a grid item defaults to min-width:auto and would stretch to fit
            all seven links, pushing the page ~470px wide on a phone. Shrinking it
            is what lets the nav's own overflow-x-auto actually scroll. */}
        <aside className="card-organic h-fit min-w-0 p-3 lg:sticky lg:top-24">
          <nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label="Account">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "flex shrink-0 items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition",
                  pathname === n.href ? "bg-deep-800 text-ivory" : "text-bark hover:bg-cream"
                )}
              >
                <n.icon className="h-4 w-4" /> {n.label}
              </Link>
            ))}
            <button
              onClick={() => logout().then(() => router.push("/"))}
              className="flex shrink-0 items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-copper transition hover:bg-copper/10"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </nav>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
