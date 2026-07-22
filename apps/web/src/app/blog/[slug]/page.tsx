import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/lib/api";
import { dateLong } from "@/lib/format";
import { CommentSection } from "./comments";
import { ShareRow } from "./share";

export const revalidate = 300;

interface Post {
  id: string; slug: string; title: string; excerpt: string; content: string; cover?: string | null;
  category: string; tags: string[]; authorName: string; publishedAt: string;
  seoTitle?: string | null; seoDescription?: string | null;
  comments: { id: string; name: string; body: string; createdAt: string }[];
}
interface More { slug: string; title: string; cover?: string | null; category: string; publishedAt: string }

async function getPost(slug: string) {
  try {
    return await api<{ post: Post; more: More[] }>(`/blog/${slug}`);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPost(slug);
  if (!data) return { title: "Post not found" };
  return {
    title: data.post.seoTitle ?? data.post.title,
    description: data.post.seoDescription ?? data.post.excerpt,
    openGraph: { images: data.post.cover ? [{ url: data.post.cover }] : [] },
    alternates: { canonical: `/blog/${slug}` },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getPost(slug);
  if (!data) notFound();
  const { post, more } = data;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: post.cover ? [`${siteUrl}${post.cover}`] : [],
    datePublished: post.publishedAt,
    author: { "@type": "Organization", name: post.authorName },
  };

  return (
    <article className="container-page max-w-3xl pb-24 pt-28">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <p className="text-center text-xs font-semibold uppercase tracking-[0.35em] text-copper">{post.category}</p>
      <h1 className="mt-3 text-center font-display text-4xl font-medium leading-tight text-forest-900 sm:text-5xl">{post.title}</h1>
      <p className="mt-4 text-center text-sm text-bark/60">{post.authorName} · {dateLong(post.publishedAt)}</p>
      {post.cover && (
        <div className="relative mt-10 aspect-[16/9] overflow-hidden rounded-organic shadow-lift">
          <Image src={post.cover} alt={post.title} fill priority sizes="(max-width: 768px) 100vw, 768px" className="object-cover" />
        </div>
      )}
      <div
        className="prose-madhura mt-10 space-y-4 text-[0.95rem] leading-relaxed text-bark/85 [&_h3]:font-display [&_h3]:text-2xl [&_h3]:text-forest-900 [&_h3]:mt-8 [&_li]:ml-5 [&_ol]:list-decimal [&_ul]:list-disc [&_b]:text-forest-900"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
      {post.tags.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {post.tags.map((t) => (
            <span key={t} className="rounded-full bg-forest-50 px-3 py-1 text-xs text-forest-800">#{t}</span>
          ))}
        </div>
      )}
      <ShareRow title={post.title} />
      <CommentSection slug={post.slug} comments={post.comments} />
      {more.length > 0 && (
        <div className="mt-16 border-t border-sand pt-10">
          <h2 className="font-display text-2xl text-forest-900">Keep reading</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {more.map((m) => (
              <Link key={m.slug} href={`/blog/${m.slug}`} className="group block overflow-hidden rounded-2xl border border-sand bg-ivory">
                <div className="relative aspect-video overflow-hidden">
                  {m.cover && <Image src={m.cover} alt="" fill sizes="240px" className="object-cover transition-transform duration-500 group-hover:scale-105" />}
                </div>
                <p className="p-3 font-display text-base leading-snug text-forest-900">{m.title}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
