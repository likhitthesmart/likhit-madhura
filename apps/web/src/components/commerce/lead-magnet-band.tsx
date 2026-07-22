import Image from "next/image";
import { Reveal } from "@/components/ui/motion";
import { NewsletterForm } from "@/components/ui/newsletter";

/* On-page lead magnet — a calm, full-width band offering the first-order
   discount in exchange for an email. Complements (does not duplicate) the
   dismissible corner capture. */
export function LeadMagnetBand() {
  return (
    <section className="relative overflow-hidden py-24">
      <Image src="/media/story/newsletter-bg.jpg" alt="" fill sizes="100vw" className="object-cover" aria-hidden />
      <div className="absolute inset-0 bg-forest-950/75" />
      <Reveal className="container-page relative z-10 flex flex-col items-center text-center">
        <p className="rounded-full border border-gold/40 bg-gold/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-gold-light">
          10% off your first order
        </p>
        <h2 className="mt-5 max-w-2xl font-display text-4xl font-medium leading-tight text-ivory sm:text-5xl">
          Good food news, twice a month
        </h2>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-ivory/75">
          Join 12,000+ home cooks who get our seasonal recipes, harvest updates and subscriber-only offers — starting
          with 10% off your very first Madhura Naturals order. One click to unsubscribe, always.
        </p>
        <div className="mt-8 w-full max-w-md">
          <NewsletterForm dark />
        </div>
        <p className="mt-4 text-xs text-ivory/50">No spam, ever. We send at most two letters a month.</p>
      </Reveal>
    </section>
  );
}
