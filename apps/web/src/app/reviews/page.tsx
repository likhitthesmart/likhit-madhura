import type { Metadata } from "next";
import Link from "next/link";
import { Star } from "lucide-react";
import { api } from "@/lib/api";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/motion";
import { dateLong } from "@/lib/format";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Customer Reviews — What India Says About Madhura Naturals",
  description:
    "Read verified reviews from thousands of homes cooking with Madhura Naturals cold pressed oils, A2 ghee and organic millets. Rated 4.9/5 for purity, aroma and honest quality.",
  alternates: { canonical: "/reviews" },
};

interface Testimonial { id: string; name: string; location?: string | null; quote: string; rating: number }
interface Review { id: string; rating: number; title?: string | null; body: string; createdAt: string; user?: { name: string }; product?: { name: string; slug: string; images: string[] } }
interface Data { testimonials: Testimonial[]; reviews: Review[]; stats: { avgRating: number; reviewCount: number } }

async function getData(): Promise<Data> {
  try {
    return await api<Data>("/content/reviews");
  } catch {
    return { testimonials: [], reviews: [], stats: { avgRating: 4.9, reviewCount: 0 } };
  }
}

function Stars({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5 text-gold" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={i < n ? "h-4 w-4 fill-current" : "h-4 w-4 text-sand-dark"} />
      ))}
    </div>
  );
}

export default async function ReviewsPage() {
  const { testimonials, reviews, stats } = await getData();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Madhura Naturals",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: stats.avgRating,
      reviewCount: Math.max(stats.reviewCount, testimonials.length, 1),
      bestRating: 5,
    },
  };

  return (
    <div className="container-page pb-24 pt-28">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Reveal className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-copper">From our families</p>
        <h1 className="mt-3 font-display text-4xl font-medium text-forest-900 sm:text-6xl">Loved in kitchens across India</h1>
        <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-sand bg-ivory px-6 py-3 shadow-card">
          <span className="font-display text-3xl font-semibold text-forest-900">{stats.avgRating.toFixed(1)}</span>
          <Stars n={Math.round(stats.avgRating)} />
          <span className="text-sm text-bark/60">from {Math.max(stats.reviewCount, testimonials.length)}+ reviews</span>
        </div>
      </Reveal>

      {testimonials.length > 0 && (
        <Stagger className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <StaggerItem key={t.id}>
              <figure className="flex h-full flex-col rounded-organic border border-sand bg-ivory p-7 shadow-card">
                <Stars n={t.rating} />
                <blockquote className="mt-4 flex-1 font-display text-lg italic leading-relaxed text-ink/85">“{t.quote}”</blockquote>
                <figcaption className="mt-5 text-sm">
                  <span className="font-semibold text-forest-900">{t.name}</span>
                  {t.location && <span className="text-bark/60"> · {t.location}</span>}
                </figcaption>
              </figure>
            </StaggerItem>
          ))}
        </Stagger>
      )}

      {reviews.length > 0 && (
        <section className="mt-20">
          <h2 className="font-display text-3xl text-forest-900">Verified product reviews</h2>
          <Stagger className="mt-8 grid gap-6 md:grid-cols-2">
            {reviews.map((r) => (
              <StaggerItem key={r.id}>
                <div className="flex gap-4 rounded-organic border border-sand bg-ivory p-6 shadow-card">
                  {r.product?.images?.[0] && (
                    <Link href={`/product/${r.product.slug}`} className="h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                      <img src={r.product.images[0]} alt="" className="h-full w-full object-cover" />
                    </Link>
                  )}
                  <div>
                    <Stars n={r.rating} />
                    {r.title && <p className="mt-2 font-semibold text-forest-900">{r.title}</p>}
                    <p className="mt-1 text-sm leading-relaxed text-bark/80">{r.body}</p>
                    <p className="mt-2 text-xs text-bark/50">
                      {r.user?.name} on {r.product?.name} · {dateLong(r.createdAt)}
                    </p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      )}

      <Reveal className="mt-20 text-center">
        <h2 className="font-display text-3xl text-forest-900">Join thousands of happy kitchens</h2>
        <Link href="/shop" className="btn-primary mt-6">Shop the harvest</Link>
      </Reveal>
    </div>
  );
}
