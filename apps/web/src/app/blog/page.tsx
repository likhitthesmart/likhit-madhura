import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/lib/api";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { dateLong, cn } from "@/lib/format";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Blog & Recipes",
  description: "Recipes, organic living tips, health notes and stories from natural farming country.",
};

interface Post { slug: string; title: string; excerpt: string; cover?: string | null; category: string; publishedAt: string; authorName: string }

const categories = [
  { v: "", l: "All" },
  { v: "recipes", l: "Recipes" },
  { v: "health", l: "Health Benefits" },
  { v: "farming", l: "Traditional Farming" },
  { v: "tips", l: "Organic Tips" },
];

export default async function BlogPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const category = typeof sp.category === "string" ? sp.category : "";
  let posts: Post[] = [];
  try {
    const r = await api<{ posts: Post[] }>(`/blog${category ? `?category=${category}` : ""}`);
    posts = r.posts;
  } catch {
    /* empty */
  }

  return (
    <div className="container-page pb-24 pt-28">
      <Reveal className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-copper">Letters from the farm</p>
        <h1 className="mt-3 font-display text-4xl font-medium text-forest-900 sm:text-6xl">Recipes & wisdom</h1>
      </Reveal>
      <div className="mt-10 flex flex-wrap justify-center gap-2">
        {categories.map((c) => (
          <Link
            key={c.v}
            href={c.v ? `/blog?category=${c.v}` : "/blog"}
            className={cn("rounded-full border px-5 py-2 text-sm font-medium transition", category === c.v ? "border-forest-700 bg-forest-800 text-ivory" : "border-sand-dark text-bark hover:border-forest-400")}
          >
            {c.l}
          </Link>
        ))}
      </div>
      <Stagger className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((p) => (
          <StaggerItem key={p.slug}>
            <Link href={`/blog/${p.slug}`} className="group block overflow-hidden rounded-organic border border-sand bg-ivory shadow-card transition-all duration-500 hover:-translate-y-1 hover:shadow-lift">
              <div className="relative aspect-[16/10] overflow-hidden">
                {p.cover && <Image src={p.cover} alt="" fill sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />}
              </div>
              <div className="p-6">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-copper">{p.category}</p>
                <h2 className="mt-2 font-display text-2xl leading-snug text-forest-900 group-hover:text-forest-700">{p.title}</h2>
                <p className="mt-2 line-clamp-2 text-sm text-bark/60">{p.excerpt}</p>
                <p className="mt-4 text-xs text-bark/50">{p.authorName} · {dateLong(p.publishedAt)}</p>
              </div>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>
      {!posts.length && <p className="mt-14 text-center text-sm text-bark/60">No posts in this category yet.</p>}
    </div>
  );
}
