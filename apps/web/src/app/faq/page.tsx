import type { Metadata } from "next";
import { api } from "@/lib/api";
import { FaqSection, type FaqItem } from "@/components/home/sections";

export const revalidate = 300;
export const metadata: Metadata = { title: "FAQs", description: "Answers on products, shipping, returns and certification." };

export default async function FaqPage() {
  let faqs: FaqItem[] = [];
  try {
    faqs = (await api<{ faqs: FaqItem[] }>("/content/faqs")).faqs;
  } catch {
    /* empty */
  }
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
  return (
    <div className="pt-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <FaqSection faqs={faqs} />
    </div>
  );
}
