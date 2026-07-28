import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Award, Droplets, Flame, Leaf, MilkOff, ShieldCheck, Sprout, Wheat } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/motion";
import { Certifications, FarmJourney, InstagramGallery, SectionHeading } from "@/components/home/sections";

export const metadata: Metadata = {
  title: "Our Heritage — Natural Farming, Wooden Ghanis & Bilona Ghee",
  description:
    "How Madhura Naturals is made: chemical-free natural farming, cold pressing on wooden ghanis at under 40°C, curd-churned bilona A2 ghee and stone-milled flours — from rain-fed farms in Zaheerabad, Telangana. India Organic and FSSAI certified, lab tested every batch.",
  alternates: { canonical: "/our-heritage" },
};

const process = [
  {
    icon: Sprout,
    title: "Natural, rain-fed farming",
    body: "Our 200+ partner families grow with jeevamrutham and neem sprays instead of urea and pesticides. Desi seeds, mixed cropping, and land that has been chemical-free for at least seven years.",
  },
  {
    icon: Droplets,
    title: "Cold pressed on wooden ghanis",
    body: "Oils are pressed on slow-turning wooden ghanis that never let the temperature cross 40°C. Vitamin E, phytosterols and the seed's true aroma stay in the bottle — nothing hexane-extracted, bleached or deodorised.",
  },
  {
    icon: Flame,
    title: "Bilona-churned A2 ghee",
    body: "Whole A2 milk from grass-fed Gir and Sahiwal cows is cultured into curd, hand-churned into butter, and simmered over a wood fire. That is why our ghee is grainy, golden and aromatic — never a shortcut cream ghee.",
  },
  {
    icon: Wheat,
    title: "Stone-milled, small batches",
    body: "Flours and idly ravva are stone-ground in small weekly batches so the germ and bran — and their nutrition — survive. Every pack carries its milling date and farm cluster.",
  },
];

const promises = [
  { icon: Leaf, title: "Chemical-free, always", text: "No pesticides, no chemical fertilisers, no preservatives." },
  { icon: ShieldCheck, title: "Lab tested every batch", text: "Screened for adulterants and heavy metals. Reports on request." },
  { icon: Award, title: "Certified organic", text: "India Organic / NPOP certified farms, fully traceable." },
  { icon: MilkOff, title: "Honest, whole food", text: "Unrefined, unbleached, and exactly what the label says." },
];

export default function HeritagePage() {
  return (
    <div className="pb-8">
      {/* hero */}
      <section className="relative flex h-[68vh] min-h-[440px] items-end overflow-hidden">
        <Image src="/media/story/about-banner.jpg" alt="Rain-fed paddy fields and coconut palms at sunrise in South India" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-deep-950/85 via-deep-950/25 to-deep-950/40" />
        <div className="container-page relative z-10 pb-16 text-ivory">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.45em] text-gold-light">Our heritage</p>
            <h1 className="mt-3 max-w-3xl font-display text-5xl font-medium leading-[1.05] sm:text-6xl">
              The long, slow way — kept alive
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-ivory/80">
              Everything we make answers to one question our grandmother asked: why does the oil smell of nothing?
              Here is how we made sure ours always smells of the seed.
            </p>
          </Reveal>
        </div>
      </section>

      {/* the process */}
      <section className="container-page py-24">
        <SectionHeading eyebrow="How it's made" title="Four traditions we refuse to rush" sub="Modern food is engineered for shelf life. Ours is made for you." />
        <Stagger className="mt-14 grid gap-6 md:grid-cols-2">
          {process.map((p, i) => (
            <StaggerItem key={p.title}>
              <div className="flex h-full gap-5 rounded-organic border border-sand bg-surface p-7 shadow-card">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-forest-50 text-forest-800">
                  <p.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-display text-sm text-gold-dark">Step {String(i + 1).padStart(2, "0")}</p>
                  <h3 className="mt-1 font-display text-2xl text-forest-900">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-bark/70">{p.body}</p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* farm-to-home journey (reused) */}
      <div className="bg-cream-warm">
        <FarmJourney />
      </div>

      {/* our promise */}
      <section className="container-page py-24">
        <SectionHeading eyebrow="Our promise" title="What every pack guarantees" />
        <Stagger className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {promises.map((p) => (
            <StaggerItem key={p.title}>
              <div className="h-full rounded-organic border border-sand bg-surface p-7 text-center shadow-card">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold/40 bg-cream text-gold-dark">
                  <p.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 font-display text-xl text-forest-900">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-bark/70">{p.text}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <Certifications />
      <InstagramGallery />

      <section className="container-page py-20 text-center">
        <Reveal>
          <h2 className="mx-auto max-w-2xl font-display text-4xl font-medium text-forest-900">
            Taste the difference tradition makes
          </h2>
          <Link href="/shop" className="btn-primary mt-8">Shop the harvest</Link>
        </Reveal>
      </section>
    </div>
  );
}
