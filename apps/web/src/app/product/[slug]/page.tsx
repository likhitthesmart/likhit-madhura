import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { api, type Product } from "@/lib/api";
import { ProductCard } from "@/components/commerce/product-card";
import { Reveal } from "@/components/ui/motion";
import { ProductDetail } from "./detail";

export const revalidate = 120;

type Params = { params: Promise<{ slug: string }> };

async function getProduct(slug: string) {
  try {
    return await api<{ product: Product; related: Product[] }>(`/products/${slug}`);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const data = await getProduct(slug);
  if (!data) return { title: "Product not found" };
  const p = data.product;
  return {
    title: p.seoTitle ?? p.name,
    description: p.seoDescription ?? p.tagline ?? p.description.slice(0, 155),
    openGraph: { images: p.images[0] ? [{ url: p.images[0] }] : [] },
    alternates: { canonical: `/product/${p.slug}` },
  };
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const data = await getProduct(slug);
  if (!data) notFound();
  const { product, related } = data;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images.map((i) => `${siteUrl}${i}`),
    description: product.tagline ?? product.description.slice(0, 200),
    sku: product.slug,
    brand: { "@type": "Brand", name: "Madhura Naturals" },
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/product/${product.slug}`,
      priceCurrency: "INR",
      price: (product.price / 100).toFixed(2),
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    ...(product.ratingCount > 0 && {
      aggregateRating: { "@type": "AggregateRating", ratingValue: product.ratingAvg.toFixed(1), reviewCount: product.ratingCount },
    }),
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Shop", item: `${siteUrl}/shop` },
      ...(product.category ? [{ "@type": "ListItem", position: 3, name: product.category.name, item: `${siteUrl}/shop?category=${product.category.slug}` }] : []),
      { "@type": "ListItem", position: 4, name: product.name, item: `${siteUrl}/product/${product.slug}` },
    ],
  };

  return (
    <div className="container-page pb-24 pt-28">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <nav className="mb-8 text-xs text-bark/60" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-forest-800">Home</Link> <span aria-hidden>/</span>{" "}
        <Link href="/shop" className="hover:text-forest-800">Shop</Link> <span aria-hidden>/</span>{" "}
        {product.category && (
          <>
            <Link href={`/shop?category=${product.category.slug}`} className="hover:text-forest-800">{product.category.name}</Link>{" "}
            <span aria-hidden>/</span>{" "}
          </>
        )}
        <span className="text-forest-900">{product.name}</span>
      </nav>
      <ProductDetail product={product} />
      {related.length > 0 && (
        <Reveal className="mt-24">
          <h2 className="font-display text-3xl text-forest-900">Pairs well with</h2>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {related.map((r) => (
              <ProductCard key={r.id} product={r} />
            ))}
          </div>
        </Reveal>
      )}
    </div>
  );
}
