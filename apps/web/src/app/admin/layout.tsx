"use client";
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  FolderTree,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Newspaper,
  Settings,
  ShoppingCart,
  Star,
  TicketPercent,
  Truck,
  Users,
  Warehouse,
  X,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { useAuth } from "@/store/auth";
import { cn } from "@/lib/format";
import { Spinner } from "@/components/admin/ui";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/inventory", label: "Inventory", icon: Warehouse },
  { href: "/admin/coupons", label: "Coupons", icon: TicketPercent },
  { href: "/admin/users", label: "Customers", icon: Users },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/content", label: "Content", icon: Newspaper },
  { href: "/admin/shipping", label: "Shipping", icon: Truck },
  { href: "/admin/enquiries", label: "Enquiries", icon: Inbox },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

/* The root layout renders the storefront header/footer/chatbot around every route.
   ponytail: we may not edit those files, so hide storefront chrome via :has() while an admin shell is mounted. */
const chromeKiller = `
  body:has(#admin-shell) > header,
  body:has(#admin-shell) > footer,
  body:has(#admin-shell) > button.fixed,
  body:has(#admin-shell) > div[role="dialog"] { display: none !important; }
  body:has(#admin-shell) { background: #141810; }
`;

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, ready, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  if (!ready) {
    return (
      <div id="admin-shell" className="flex min-h-screen items-center justify-center bg-[#141810]">
        <style>{chromeKiller}</style>
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) {
    return (
      <div id="admin-shell" className="flex min-h-screen items-center justify-center bg-[#141810] p-6">
        <style>{chromeKiller}</style>
        <div className="w-full max-w-sm rounded-2xl border border-white/5 bg-[#1c2216] p-8 text-center shadow-lift">
          <Logo light className="mx-auto mb-6 justify-center" />
          <h1 className="font-display text-2xl font-semibold text-ivory">Admin Console</h1>
          <p className="mt-2 text-sm text-ivory/50">
            {user ? "Your account does not have access to this area." : "Please sign in with a staff account to continue."}
          </p>
          <Link
            href="/login?next=/admin"
            className="mt-6 inline-block rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-forest-950 transition-colors hover:bg-gold-light"
          >
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  const active = nav.reduce(
    (best, item) =>
      pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href)) ? item : best,
    nav[0]
  );

  return (
    <div id="admin-shell" className="min-h-screen bg-[#141810] text-ivory">
      <style>{chromeKiller}</style>

      {/* mobile overlay */}
      {open && <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setOpen(false)} />}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/5 bg-[#171c12] transition-transform duration-200 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <Link href="/admin">
            <Logo light className="scale-90 origin-left" />
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="rounded-lg p-1.5 text-ivory/50 hover:bg-white/5 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
          {nav.map((item) => {
            const Icon = item.icon;
            const isActive = item === active;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-gold/10 font-medium text-gold"
                    : "text-ivory/55 hover:bg-white/5 hover:text-ivory"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/5 p-4 text-xs text-ivory/40">
          Storefront:{" "}
          <Link href="/" className="text-forest-300 hover:text-gold">
            madhura naturals →
          </Link>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/5 bg-[#141810]/90 px-4 py-3.5 backdrop-blur lg:px-8">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="rounded-lg p-1.5 text-ivory/60 hover:bg-white/5 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="font-display text-xl font-semibold text-ivory">{active.label}</h1>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm text-ivory/80">{user.name}</p>
              <p className="text-[10px] uppercase tracking-wider text-gold/80">{user.role}</p>
            </div>
            <button
              type="button"
              onClick={() => void logout()}
              title="Sign out"
              className="rounded-lg border border-white/10 p-2 text-ivory/60 transition-colors hover:border-rose-500/40 hover:text-rose-300"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
