import type { Metadata } from "next";
import { api, type Category, type Product } from "@/lib/api";
import { Hero } from "@/components/home/hero";
import {
  BrandIntro,
  FeaturedCategories,
  FeaturedProducts,
  WhyMadhura,
  type BlogCard,
  type Testimonial,
} from "@/components/home/sections";
import { HeritageTeaser, JournalTeaser, TestimonialTeaser } from "@/components/home/teasers";
import { LeadMagnetBand } from "@/components/commerce/lead-magnet-band";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Madhura Naturals — Cold Pressed Oils, A2 Ghee & Organic Millets from South India",
  description:
    "Shop wood-pressed cold pressed oils, bilona A2 desi cow ghee, organic millets, stone-ground flours and traditional staples — grown chemical-free on rain-fed South Indian farms and delivered fresh. Certified organic. Lab tested. Free shipping above ₹999.",
  alternates: { canonical: "/" },
};

async function getData() {
  const empty = { categories: [] as Category[], products: [] as Product[], posts: [] as BlogCard[], testimonials: [] as Testimonial[] };
  try {
    const [cats, feat, blog, home] = await Promise.all([
      api<{ categories: Category[] }>("/categories"),
      api<{ items: Product[] }>("/products/featured"),
      api<{ posts: BlogCard[] }>("/blog"),
      api<{ testimonials: Testimonial[] }>("/content/home"),
    ]);
    return { categories: cats.categories, products: feat.items, posts: blog.posts, testimonials: home.testimonials };
  } catch {
    return empty;
  }
}

export default async function HomePage() {
  const { categories, products, posts, testimonials } = await getData();
  return (
    <>
      <Hero />
      <BrandIntro />
      <WhyMadhura />
      <FeaturedCategories categories={categories} />
      <div className="divider-leaf bg-cream" aria-hidden />
      <FeaturedProducts products={products} />
      <HeritageTeaser />
      <TestimonialTeaser testimonials={testimonials} />
      <LeadMagnetBand />
      <JournalTeaser posts={posts} />
    </>
  );
}
