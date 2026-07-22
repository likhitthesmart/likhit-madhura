import type { MetadataRoute } from "next";
import { api, type Product, type Category } from "@/lib/api";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const staticPages = ["", "/shop", "/about", "/our-heritage", "/reviews", "/contact", "/blog", "/faq", "/track-order", "/policies/shipping", "/policies/returns", "/policies/privacy", "/policies/terms"].map((p) => ({
    url: `${base}${p}`,
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.7,
  }));
  try {
    const [products, categories, blog] = await Promise.all([
      api<{ items: Product[] }>("/products?limit=48"),
      api<{ categories: Category[] }>("/categories"),
      api<{ posts: { slug: string }[] }>("/blog"),
    ]);
    return [
      ...staticPages,
      ...categories.categories.map((c) => ({ url: `${base}/shop?category=${c.slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
      ...products.items.map((p) => ({ url: `${base}/product/${p.slug}`, changeFrequency: "weekly" as const, priority: 0.9 })),
      ...blog.posts.map((b) => ({ url: `${base}/blog/${b.slug}`, changeFrequency: "monthly" as const, priority: 0.6 })),
    ];
  } catch {
    return staticPages;
  }
}
