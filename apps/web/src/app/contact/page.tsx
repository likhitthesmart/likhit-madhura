import type { Metadata } from "next";
import Image from "next/image";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { Reveal } from "@/components/ui/motion";
import { ContactForm } from "./form";

export const metadata: Metadata = {
  title: "Contact Madhura Naturals — Support, Orders & Bulk Gifting",
  description: "Questions about our cold pressed oils, A2 ghee or millets? Need help with an order or corporate gifting? Write to the Madhura Naturals care team in Zaheerabad, Telangana — we reply within 24 hours.",
  alternates: { canonical: "/contact" },
};

const details = [
  { icon: Phone, label: "Phone", value: "+91 98765 43210", href: "tel:+919876543210" },
  { icon: Mail, label: "Email", value: "care@madhuranaturals.in", href: "mailto:care@madhuranaturals.in" },
  { icon: MapPin, label: "Visit us", value: "Plot 12, Organic Farmers Colony, Zaheerabad, Telangana 502220" },
  { icon: Clock, label: "Hours", value: "Mon–Sat, 9:00 AM – 6:00 PM IST" },
];

export default function ContactPage() {
  return (
    <div className="pb-24">
      <section className="relative flex h-[45vh] min-h-[320px] items-end overflow-hidden">
        <Image src="/media/story/contact-banner.jpg" alt="Traditional South Indian home entrance with kolam" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-950/80 to-forest-950/20" />
        <div className="container-page relative z-10 pb-12 text-ivory">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.45em] text-gold-light">Namaste</p>
            <h1 className="mt-3 font-display text-5xl font-medium">Talk to us</h1>
          </Reveal>
        </div>
      </section>

      <div className="container-page mt-16 grid gap-12 lg:grid-cols-[1fr_400px]">
        <Reveal>
          <div className="card-organic p-8">
            <h2 className="font-display text-3xl text-forest-900">Send a message</h2>
            <p className="mt-2 text-sm text-bark/60">We read every message and reply within 24 hours on working days.</p>
            <div className="mt-6"><ContactForm /></div>
          </div>
        </Reveal>
        <div className="space-y-4">
          {details.map((d) => (
            <Reveal key={d.label}>
              <div className="card-organic flex items-start gap-4 p-6">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-forest-50 text-forest-800"><d.icon className="h-5 w-5" /></div>
                <div>
                  <p className="label-field mb-0.5">{d.label}</p>
                  {d.href ? (
                    <a href={d.href} className="text-sm font-medium text-forest-900 hover:underline">{d.value}</a>
                  ) : (
                    <p className="text-sm font-medium text-forest-900">{d.value}</p>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
          <Reveal>
            <div className="overflow-hidden rounded-organic shadow-card">
              <iframe
                title="Madhura Naturals location map"
                src="https://www.openstreetmap.org/export/embed.html?bbox=77.55%2C17.60%2C77.65%2C17.72&layer=mapnik&marker=17.68%2C77.61"
                className="h-64 w-full border-0"
                loading="lazy"
              />
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
