import { api, type Category, type Product } from "@/lib/api";
import { Hero } from "@/components/home/hero";
import {
  BlogPreview,
  BrandIntro,
  Certifications,
  FaqSection,
  FarmJourney,
  FeaturedCategories,
  FeaturedProducts,
  InstagramGallery,
  NewsletterBanner,
  Testimonials,
  WhyMadhura,
  type BlogCard,
  type FaqItem,
  type Testimonial,
} from "@/components/home/sections";
import { NewsletterForm } from "@/components/newsletter";

export const revalidate = 300;

async function getData() {
  const empty = { categories: [] as Category[], products: [] as Product[], posts: [] as BlogCard[], faqs: [] as FaqItem[], testimonials: [] as Testimonial[] };
  try {
    const [cats, feat, blog, home] = await Promise.all([
      api<{ categories: Category[] }>("/categories"),
      api<{ items: Product[] }>("/products/featured"),
      api<{ posts: BlogCard[] }>("/blog"),
      api<{ faqs: FaqItem[]; testimonials: Testimonial[] }>("/content/home"),
    ]);
    return { categories: cats.categories, products: feat.items, posts: blog.posts, faqs: home.faqs, testimonials: home.testimonials };
  } catch {
    return empty; // API warming up — page still renders
  }
}

export default async function HomePage() {
  const { categories, products, posts, faqs, testimonials } = await getData();
  return (
    <>
      <Hero />
      <BrandIntro />
      <WhyMadhura />
      <FeaturedCategories categories={categories} />
      <div className="divider-leaf bg-cream" aria-hidden />
      <FeaturedProducts products={products} />
      <FarmJourney />
      <Certifications />
      <Testimonials testimonials={testimonials} />
      <InstagramGallery />
      <BlogPreview posts={posts} />
      <FaqSection faqs={faqs} />
      <NewsletterBanner>
        <NewsletterForm dark />
      </NewsletterBanner>
    </>
  );
}
