import Link from "next/link";
import { Facebook, Instagram, Mail, MapPin, Phone, Youtube } from "lucide-react";
import { Logo } from "./logo";
import { NewsletterForm } from "./newsletter";

const cols = [
  {
    title: "Shop",
    links: [
      { href: "/shop?category=cold-pressed-oils", label: "Cold Pressed Oils" },
      { href: "/shop?category=ghee", label: "A2 Ghee" },
      { href: "/shop?category=millets", label: "Millets" },
      { href: "/shop?category=flours-atta", label: "Flours & Atta" },
      { href: "/shop?category=healthy-biscuits", label: "Healthy Biscuits" },
      { href: "/shop", label: "All Products" },
    ],
  },
  {
    title: "Customer Care",
    links: [
      { href: "/track-order", label: "Track Your Order" },
      { href: "/account", label: "My Account" },
      { href: "/contact", label: "Contact Us" },
      { href: "/faq", label: "FAQs" },
      { href: "/policies/shipping", label: "Shipping Policy" },
      { href: "/policies/returns", label: "Returns & Refunds" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "Our Story" },
      { href: "/blog", label: "Blog & Recipes" },
      { href: "/policies/privacy", label: "Privacy Policy" },
      { href: "/policies/terms", label: "Terms of Service" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative mt-24 bg-forest-950 text-ivory/85">
      {/* temple-step top edge */}
      <div aria-hidden className="absolute -top-4 left-0 right-0 flex justify-center gap-0">
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={i} className="h-4 w-8 bg-forest-950 first:rounded-tl-lg last:rounded-tr-lg" style={{ marginTop: i % 2 ? 0 : -6, borderRadius: "6px 6px 0 0" }} />
        ))}
      </div>
      <div className="container-page grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Logo light />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-ivory/70">
            From rain-fed farms and wooden ghanis of South India — cold pressed oils, bilona ghee, millets and
            traditional staples, made the way our grandmothers insisted.
          </p>
          <div className="mt-6 space-y-2.5 text-sm text-ivory/70">
            <p className="flex items-start gap-2.5"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-light" /> Plot 12, Organic Farmers Colony, Zaheerabad, Telangana 502220</p>
            <p className="flex items-center gap-2.5"><Phone className="h-4 w-4 text-gold-light" /> +91 98765 43210</p>
            <p className="flex items-center gap-2.5"><Mail className="h-4 w-4 text-gold-light" /> care@madhuranaturals.in</p>
          </div>
          <div className="mt-6 flex gap-3">
            {[
              { icon: Instagram, href: "https://instagram.com/madhuranaturals", label: "Instagram" },
              { icon: Facebook, href: "https://facebook.com/madhuranaturals", label: "Facebook" },
              { icon: Youtube, href: "https://youtube.com/@madhuranaturals", label: "YouTube" },
            ].map(({ icon: Icon, href, label }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="rounded-full border border-ivory/20 p-2.5 transition hover:border-gold-light hover:text-gold-light">
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
        {cols.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h3 className="font-display text-lg text-gold-light">{col.title}</h3>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-ivory/70 transition hover:text-ivory">{l.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-ivory/10">
        <div className="container-page flex flex-col items-center justify-between gap-6 py-8 md:flex-row">
          <div className="max-w-md">
            <p className="font-display text-lg text-ivory">Letters from the farm</p>
            <p className="mt-1 text-xs text-ivory/60">Recipes, harvest news and subscriber-only offers. Once a fortnight, never spam.</p>
          </div>
          <NewsletterForm dark />
        </div>
      </div>
      <div className="border-t border-ivory/10 py-5 text-center text-xs text-ivory/50">
        © {new Date().getFullYear()} Madhura Naturals · Premium Organic Goodness · Crafted with care in South India
      </div>
    </footer>
  );
}
