import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Star } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/motion";
import { SectionHeading, type BlogCard, type Testimonial } from "./sections";
import { dateLong } from "@/lib/format";

/* Compact homepage teasers — the full content lives on dedicated pages. */

export function HeritageTeaser() {
  return (
    <section className="relative overflow-hidden bg-deep-950 py-0">
      <div className="grid lg:grid-cols-2">
        <div className="relative min-h-[380px] lg:min-h-[560px]">
          <Image src="/media/story/process.jpg" alt="Wooden ghani slowly pressing cold oil into a brass pot" fill sizes="(max-width:1024px) 100vw, 50vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-deep-950/60 lg:to-deep-950" />
        </div>
        <div className="flex items-center bg-deep-950 px-8 py-16 sm:px-14">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-gold-light">Our heritage</p>
            <h2 className="mt-3 font-display text-4xl font-medium leading-tight text-ivory sm:text-5xl">
              Seven generations of food wisdom, in one wooden ghani
            </h2>
            <p className="mt-5 max-w-lg leading-relaxed text-ivory/70">
              From rain-fed farms and bilona churns to the stone mills of Zaheerabad, every Madhura Naturals product
              carries the name of its farm cluster and the date it was made. Meet the families, the methods and the
              certifications behind your food.
            </p>
            <Link href="/our-heritage" className="btn-gold mt-8">
              Explore our heritage <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export function TestimonialTeaser({ testimonials }: { testimonials: Testimonial[] }) {
  return (
    <section className="bg-cream-warm py-24">
      <div className="container-page">
        <SectionHeading eyebrow="From our families" title="Loved in kitchens across India" sub="Real words from the homes that cook with Madhura Naturals every day." />
        <Stagger className="mt-14 grid gap-6 md:grid-cols-3">
          {testimonials.slice(0, 3).map((t) => (
            <StaggerItem key={t.id}>
              <figure className="flex h-full flex-col rounded-organic border border-sand bg-surface p-7 shadow-card">
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
        <Reveal className="mt-10 text-center">
          <Link href="/reviews" className="btn-secondary">
            Read all reviews <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

export function JournalTeaser({ posts }: { posts: BlogCard[] }) {
  if (!posts.length) return null;
  return (
    <section className="container-page py-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-copper">From the journal</p>
          <h2 className="mt-3 font-display text-4xl font-medium text-forest-900 sm:text-5xl">Recipes & farm letters</h2>
        </div>
        <Link href="/blog" className="text-sm font-semibold text-forest-800 hover:underline">
          Read the journal →
        </Link>
      </div>
      <Stagger className="mt-12 grid gap-6 md:grid-cols-3">
        {posts.slice(0, 3).map((b) => (
          <StaggerItem key={b.slug}>
            <Link href={`/blog/${b.slug}`} className="group block overflow-hidden rounded-organic border border-sand bg-surface shadow-card transition-all duration-500 hover:-translate-y-1 hover:shadow-lift">
              <div className="relative aspect-[16/10] overflow-hidden">
                {b.cover && <Image src={b.cover} alt="" fill sizes="(max-width:768px) 100vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />}
              </div>
              <div className="p-6">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-copper">{b.category}</p>
                <h3 className="mt-2 font-display text-2xl leading-snug text-forest-900 group-hover:text-forest-700">{b.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-bark/60">{b.excerpt}</p>
                <p className="mt-3 text-[0.7rem] text-bark/50">{dateLong(b.publishedAt)}</p>
              </div>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}
