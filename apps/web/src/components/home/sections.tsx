"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Award, Droplets, Leaf, MilkOff, Minus, Plus, ShieldCheck, Sprout, Star, Sun, Truck, Wheat } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import type { Category, Product } from "@/lib/api";
import { ProductCard } from "@/components/product-card";
import { dateLong } from "@/lib/format";

export function SectionHeading({ eyebrow, title, sub, light = false }: { eyebrow: string; title: string; sub?: string; light?: boolean }) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      <p className={`text-xs font-semibold uppercase tracking-[0.4em] ${light ? "text-gold-light" : "text-copper"}`}>{eyebrow}</p>
      <h2 className={`mt-3 font-display text-4xl font-medium sm:text-5xl ${light ? "text-ivory" : "text-forest-900"}`}>{title}</h2>
      {sub && <p className={`mt-4 text-base leading-relaxed ${light ? "text-ivory/70" : "text-bark/70"}`}>{sub}</p>}
    </Reveal>
  );
}

/* ---- Brand introduction ---- */
export function BrandIntro() {
  return (
    <section className="container-page py-24">
      <div className="grid items-center gap-14 lg:grid-cols-2">
        <Reveal>
          <div className="relative">
            <div className="overflow-hidden rounded-organic shadow-lift">
              <Image src="/media/story/heritage.jpg" alt="Traditional South Indian home with brass vessels of grains" width={640} height={800} className="h-auto w-full object-cover" />
            </div>
            <div className="absolute -bottom-8 -right-4 hidden w-56 overflow-hidden rounded-organic border-4 border-ivory shadow-lift sm:block">
              <Image src="/media/story/process.jpg" alt="Wooden cold press ghani with oil" width={280} height={350} className="h-auto w-full object-cover" />
            </div>
          </div>
        </Reveal>
        <div>
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-copper">The Madhura way</p>
            <h2 className="mt-3 font-display text-4xl font-medium leading-tight text-forest-900 sm:text-5xl">
              Food the way our <em className="text-gold-dark">grandmothers</em> insisted it be made
            </h2>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="mt-6 text-base leading-relaxed text-bark/75">
              Madhura Naturals began in a village kitchen in Telangana, with a simple refusal: no refined oils, no
              chemical-fed grains, no shortcuts. Today we work with over 200 natural farming families across South
              India — pressing oils on wooden ghanis, churning bilona ghee over wood fires, and stone-milling flours
              in small weekly batches.
            </p>
            <p className="mt-4 text-base leading-relaxed text-bark/75">
              Every product carries the name of its farm cluster and the date it was made. That is not marketing.
              That is accountability.
            </p>
          </Reveal>
          <Reveal delay={0.25}>
            <div className="mt-8 grid grid-cols-3 gap-6 border-t border-sand pt-8">
              {[
                { n: "200+", l: "Farming families" },
                { n: "0", l: "Chemicals, ever" },
                { n: "7 days", l: "Mill to doorstep" },
              ].map((s) => (
                <div key={s.l}>
                  <p className="font-display text-3xl font-semibold text-forest-800">{s.n}</p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-bark/60">{s.l}</p>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.35}>
            <Link href="/about" className="btn-primary mt-9">
              Read our story <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---- Why Madhura ---- */
const whys = [
  { icon: Droplets, title: "Cold pressed, never refined", text: "Wooden ghanis at 40°C keep every nutrient the seed grew." },
  { icon: Sprout, title: "Natural farming only", text: "Jeevamrutham and neem — never urea, never pesticides." },
  { icon: Sun, title: "Small weekly batches", text: "Pressed, churned and milled to order. Freshness you can smell." },
  { icon: ShieldCheck, title: "Lab tested purity", text: "Every batch tested for adulterants. Reports on request." },
  { icon: Award, title: "Certified organic", text: "India Organic / NPOP certified farms, traceable to source." },
  { icon: Truck, title: "Farm to home in days", text: "From our village units straight to your kitchen shelf." },
];

export function WhyMadhura() {
  return (
    <section className="bg-forest-900 py-24">
      <div className="container-page">
        <SectionHeading light eyebrow="Why Madhura" title="Purity is a practice, not a promise" sub="Seven generations of food wisdom, held to modern laboratory standards." />
        <Stagger className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {whys.map((w) => (
            <StaggerItem key={w.title}>
              <div className="group h-full rounded-organic border border-ivory/10 bg-ivory/5 p-7 backdrop-blur transition-all duration-500 hover:border-gold/40 hover:bg-ivory/10">
                <w.icon className="h-8 w-8 text-gold-light transition-transform duration-500 group-hover:scale-110" />
                <h3 className="mt-5 font-display text-2xl text-ivory">{w.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ivory/65">{w.text}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/* ---- Categories ---- */
export function FeaturedCategories({ categories }: { categories: Category[] }) {
  return (
    <section className="container-page py-24">
      <SectionHeading eyebrow="The pantry" title="Shop by tradition" sub="Everything a South Indian kitchen holds sacred — grown clean, made slow." />
      <Stagger className="mt-14 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {categories.map((c) => (
          <StaggerItem key={c.slug}>
            <Link href={`/shop?category=${c.slug}`} className="group relative block overflow-hidden rounded-organic shadow-card transition-all duration-500 hover:shadow-lift">
              <div className="relative aspect-[4/5]">
                {c.image && (
                  <Image src={c.image} alt={c.name} fill sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-forest-950/80 via-forest-950/10 to-transparent" />
              </div>
              <div className="absolute inset-x-0 bottom-0 p-5 text-ivory">
                <h3 className="font-display text-xl sm:text-2xl">{c.name}</h3>
                <p className="mt-1 text-xs text-ivory/70 opacity-0 transition-all duration-500 group-hover:opacity-100">
                  {c._count?.products ?? 0} products <ArrowRight className="ml-1 inline h-3 w-3" />
                </p>
              </div>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}

/* ---- Featured products ---- */
export function FeaturedProducts({ products }: { products: Product[] }) {
  return (
    <section className="bg-cream-warm py-24">
      <div className="container-page">
        <SectionHeading eyebrow="Handpicked" title="The harvest table" sub="Bestsellers and small-batch favourites, straight from this week's pressing." />
        <Stagger className="mt-14 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {products.slice(0, 8).map((p) => (
            <StaggerItem key={p.id}>
              <ProductCard product={p} />
            </StaggerItem>
          ))}
        </Stagger>
        <Reveal className="mt-12 text-center">
          <Link href="/shop" className="btn-secondary">
            View all products <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

/* ---- Farm to home journey ---- */
const journey = [
  { step: "01", title: "Rain-fed farms", text: "Desi seeds, jeevamrutham and patience. Our farmer families grow the old way on chemical-free land.", img: "/media/story/farm.jpg" },
  { step: "02", title: "The village unit", text: "Wooden ghanis press at 40°C. Stone mills turn slowly. Bilona ghee simmers over wood fire.", img: "/media/story/process.jpg" },
  { step: "03", title: "Your kitchen", text: "Packed in glass and kraft within days of making, sealed with the batch date and farm name.", img: "/media/story/journey-home.jpg" },
];

export function FarmJourney() {
  return (
    <section className="container-page py-24">
      <SectionHeading eyebrow="Farm to home" title="A short, honest journey" sub="Three steps. No middlemen, no warehouses full of year-old stock." />
      <div className="mt-14 grid gap-8 lg:grid-cols-3">
        {journey.map((j, i) => (
          <Reveal key={j.step} delay={i * 0.15}>
            <div className="group relative overflow-hidden rounded-organic shadow-card transition-all duration-500 hover:shadow-lift">
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image src={j.img} alt={j.title} fill sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                <span className="absolute left-5 top-5 font-display text-5xl font-semibold text-ivory/90 drop-shadow">{j.step}</span>
              </div>
              <div className="bg-ivory p-6">
                <h3 className="font-display text-2xl text-forest-900">{j.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-bark/70">{j.text}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---- Certifications ---- */
const certs = [
  { icon: Leaf, title: "India Organic", text: "NPOP certified farms" },
  { icon: ShieldCheck, title: "FSSAI Licensed", text: "Lic. No. 13624010000000" },
  { icon: Wheat, title: "Natural Farming", text: "Zero chemical residue" },
  { icon: MilkOff, title: "No Adulterants", text: "Batch-wise lab reports" },
];

export function Certifications() {
  return (
    <section className="border-y border-sand bg-ivory py-16">
      <div className="container-page">
        <Stagger className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {certs.map((c) => (
            <StaggerItem key={c.title}>
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-cream text-gold-dark">
                  <c.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-display text-lg text-forest-900">{c.title}</p>
                  <p className="text-xs text-bark/60">{c.text}</p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/* ---- Testimonials ---- */
export interface Testimonial { id: string; name: string; location?: string | null; quote: string; rating: number }

export function Testimonials({ testimonials }: { testimonials: Testimonial[] }) {
  return (
    <section className="bg-cream-warm py-24">
      <div className="container-page">
        <SectionHeading eyebrow="From our families" title="Words we treasure" />
        <Stagger className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.slice(0, 6).map((t) => (
            <StaggerItem key={t.id}>
              <figure className="flex h-full flex-col rounded-organic border border-sand bg-ivory p-7 shadow-card">
                <div className="flex gap-1 text-gold" aria-label={`${t.rating} out of 5 stars`}>
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <blockquote className="mt-4 flex-1 font-display text-lg italic leading-relaxed text-ink/85">“{t.quote}”</blockquote>
                <figcaption className="mt-5 text-sm">
                  <span className="font-semibold text-forest-900">{t.name}</span>
                  {t.location && <span className="text-bark/60"> · {t.location}</span>}
                </figcaption>
              </figure>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/* ---- Instagram gallery ---- */
const instaShots = [
  { img: "/media/instagram/ragi-dosa.jpg", alt: "Ragi dosa on cast iron griddle" },
  { img: "/media/instagram/filter-coffee.jpg", alt: "South Indian filter coffee in brass dabara" },
  { img: "/media/instagram/turmeric-milk.jpg", alt: "Golden turmeric milk" },
  { img: "/media/instagram/millet-salad.jpg", alt: "Millet salad bowl" },
  { img: "/media/instagram/ghee-rice.jpg", alt: "Ghee melting over hot rice on banana leaf" },
  { img: "/media/instagram/market-basket.jpg", alt: "Cane basket of fresh organic produce" },
];

export function InstagramGallery() {
  return (
    <section className="container-page py-24">
      <SectionHeading eyebrow="@madhuranaturals" title="From our kitchens to yours" sub="Tag us when you cook — the best plates make it to our farm letters." />
      <Stagger className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {instaShots.map((s) => (
          <StaggerItem key={s.img}>
            <a
              href="https://instagram.com/madhuranaturals"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block aspect-square overflow-hidden rounded-2xl"
            >
              <Image src={s.img} alt={s.alt} fill sizes="(max-width: 640px) 50vw, 17vw" className="object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-forest-950/0 transition-colors duration-500 group-hover:bg-forest-950/30" />
            </a>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}

/* ---- Blog preview ---- */
export interface BlogCard { slug: string; title: string; excerpt: string; cover?: string | null; category: string; publishedAt: string }

export function BlogPreview({ posts }: { posts: BlogCard[] }) {
  return (
    <section className="bg-cream-warm py-24">
      <div className="container-page">
        <SectionHeading eyebrow="Recipes & wisdom" title="Letters from the farm" sub="Recipes, health notes and stories from natural farming country." />
        <Stagger className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {posts.slice(0, 4).map((b) => (
            <StaggerItem key={b.slug}>
              <Link href={`/blog/${b.slug}`} className="group block overflow-hidden rounded-organic border border-sand bg-ivory shadow-card transition-all duration-500 hover:-translate-y-1 hover:shadow-lift">
                <div className="relative aspect-[16/10] overflow-hidden">
                  {b.cover && <Image src={b.cover} alt="" fill sizes="(max-width: 1024px) 100vw, 25vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />}
                </div>
                <div className="p-5">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-copper">{b.category}</p>
                  <h3 className="mt-2 font-display text-xl leading-snug text-forest-900 group-hover:text-forest-700">{b.title}</h3>
                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-bark/60">{b.excerpt}</p>
                  <p className="mt-3 text-[0.7rem] text-bark/50">{dateLong(b.publishedAt)}</p>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/* ---- FAQ accordion ---- */
export interface FaqItem { id: string; question: string; answer: string }

export function FaqSection({ faqs }: { faqs: FaqItem[] }) {
  const [open, setOpen] = useState<string | null>(faqs[0]?.id ?? null);
  return (
    <section className="container-page py-24">
      <SectionHeading eyebrow="Good questions" title="Asked, answered" />
      <div className="mx-auto mt-12 max-w-3xl divide-y divide-sand rounded-organic border border-sand bg-ivory shadow-card">
        {faqs.map((f) => {
          const isOpen = open === f.id;
          return (
            <div key={f.id}>
              <button
                onClick={() => setOpen(isOpen ? null : f.id)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 px-7 py-5 text-left"
              >
                <span className="font-display text-lg text-forest-900">{f.question}</span>
                {isOpen ? <Minus className="h-4 w-4 shrink-0 text-gold-dark" /> : <Plus className="h-4 w-4 shrink-0 text-gold-dark" />}
              </button>
              <motion.div
                initial={false}
                animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <p className="px-7 pb-6 text-sm leading-relaxed text-bark/75">{f.answer}</p>
              </motion.div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ---- Newsletter banner ---- */
export function NewsletterBanner({ children }: { children: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden py-24">
      <Image src="/media/story/newsletter-bg.jpg" alt="" fill sizes="100vw" className="object-cover" aria-hidden />
      <div className="absolute inset-0 bg-forest-950/70" />
      <Reveal className="container-page relative z-10 flex flex-col items-center text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-gold-light">Stay close to the harvest</p>
        <h2 className="mt-3 max-w-xl font-display text-4xl font-medium text-ivory sm:text-5xl">Letters from the farm, twice a month</h2>
        <p className="mt-4 max-w-lg text-sm text-ivory/70">Seasonal recipes, harvest updates and subscriber-only offers. No noise, we promise.</p>
        <div className="mt-8 w-full max-w-md">{children}</div>
      </Reveal>
    </section>
  );
}
