import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/motion";
import { SectionHeading } from "@/components/home/sections";

export const metadata: Metadata = {
  title: "Our Story — Why Madhura Naturals Exists",
  description:
    "Madhura Naturals began in a Telangana village kitchen with one refusal: no refined oils, no chemical-fed grains, no shortcuts. Meet the founders, the 200+ farming families and the values behind India's honest organic pantry.",
  alternates: { canonical: "/about" },
  openGraph: { images: [{ url: "/media/story/heritage.jpg" }] },
};

const values = [
  { title: "Slow over fast", text: "A wooden ghani takes four hours to press what a factory does in minutes. We choose the four hours, every time." },
  { title: "Farmer first", text: "We pay 15–20% above market rate and commit to whole harvests, so our farmers can stay chemical-free with confidence." },
  { title: "Nothing hidden", text: "Batch dates, farm clusters and lab reports for every product. If we can't trace it, we don't sell it." },
  { title: "Tradition, tested", text: "Grandmother's methods, validated by modern labs. Heritage and evidence, together." },
];

export default function AboutPage() {
  return (
    <div className="pb-24">
      <section className="relative flex h-[70vh] min-h-[420px] items-end overflow-hidden">
        <Image src="/media/story/about-banner.jpg" alt="Paddy fields and coconut palms at sunrise" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-deep-950/80 via-deep-950/20 to-deep-950/30" />
        <div className="container-page relative z-10 pb-16 text-ivory">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.45em] text-gold-light">Our story</p>
            <h1 className="mt-3 max-w-2xl font-display text-5xl font-medium leading-tight sm:text-6xl">Rooted in a village kitchen</h1>
          </Reveal>
        </div>
      </section>

      <section className="container-page grid items-center gap-14 py-24 lg:grid-cols-2">
        <Reveal>
          <div className="overflow-hidden rounded-organic shadow-lift">
            <Image src="/media/story/heritage.jpg" alt="Traditional South Indian veranda with brass vessels" width={640} height={800} className="h-auto w-full object-cover" />
          </div>
        </Reveal>
        <div>
          <Reveal>
            <h2 className="font-display text-4xl font-medium leading-tight text-forest-900">It started with a question our grandmother asked</h2>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="mt-6 leading-relaxed text-bark/75">
              “Why does the oil smell of nothing?” In 2018, in a small village near Zaheerabad, that one question sent us
              looking for the wooden ghani her generation trusted — and we found the last one in the district gathering dust.
            </p>
            <p className="mt-4 leading-relaxed text-bark/75">
              We restored it, pressed our first hundred litres of groundnut oil, and sold out in a week. Today Madhura
              Naturals works with over 200 natural-farming families across Telangana, Andhra and Karnataka — but every
              product still answers to that first question. If it doesn't smell like the seed, the churn, the mill — it
              doesn't leave the unit.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="bg-deep-900 py-24">
        <div className="container-page">
          <SectionHeading light eyebrow="What we refuse to compromise" title="The Madhura principles" />
          <Stagger className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <StaggerItem key={v.title}>
                <div className="h-full rounded-organic border border-ivory/10 bg-surface/5 p-7">
                  <h3 className="font-display text-2xl text-gold-light">{v.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-ivory/70">{v.text}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="container-page grid items-center gap-14 py-24 lg:grid-cols-2">
        <div className="order-2 lg:order-1">
          <Reveal>
            <h2 className="font-display text-4xl font-medium text-forest-900">The people behind the pack</h2>
            <p className="mt-6 leading-relaxed text-bark/75">
              Ramulu anna has farmed without urea for eleven years. Lakshmamma garu leads the women's collective that
              stone-mills our flours. Every Madhura pack names its farm cluster because food should come from people,
              not from nowhere.
            </p>
            <Link href="/blog?category=farming" className="btn-primary mt-8">Meet the farms on our blog</Link>
          </Reveal>
        </div>
        <Reveal className="order-1 lg:order-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="overflow-hidden rounded-organic shadow-card"><Image src="/media/story/farm.jpg" alt="Farmer's hands holding soil and seedling" width={400} height={300} className="h-full w-full object-cover" /></div>
            <div className="mt-8 overflow-hidden rounded-organic shadow-card"><Image src="/media/story/process.jpg" alt="Wooden ghani pressing oil" width={400} height={500} className="h-full w-full object-cover" /></div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
