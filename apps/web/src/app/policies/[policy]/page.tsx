import type { Metadata } from "next";
import { notFound } from "next/navigation";

const policies: Record<string, { title: string; body: string[] }> = {
  shipping: {
    title: "Shipping Policy",
    body: [
      "We ship across India from our unit in Zaheerabad, Telangana. Orders are packed within 24–48 hours of payment and handed to our courier partners.",
      "Delivery estimates: Hyderabad & Telangana 1–3 days · South India 2–5 days · Rest of India 4–7 days. Estimates appear at checkout based on your pincode.",
      "Shipping is free above ₹799 within Telangana and above ₹999 for most other zones; otherwise a flat zone-based fee (₹49–₹99) applies and is shown before payment.",
      "Once shipped, you receive the courier name and AWB number by email, and can follow progress on the Track Order page.",
      "Oils and ghee ship in protective glass-safe packaging. If anything arrives damaged, photograph it and write to care@madhuranaturals.in within 48 hours for an immediate replacement.",
    ],
  },
  returns: {
    title: "Returns & Refunds",
    body: [
      "Unopened products in original packaging can be returned within 7 days of delivery for a full refund.",
      "For quality concerns on opened products, share a photo within 7 days — we replace immediately, no questions asked. Food safety means returned edible goods are not restocked, so we simply make it right.",
      "Refunds are processed to the original payment method within 5–7 business days after pickup or photo verification.",
      "To start a return, use the contact form, chat with Madhu, or email care@madhuranaturals.in with your order number.",
    ],
  },
  privacy: {
    title: "Privacy Policy",
    body: [
      "We collect only what we need to fulfil your order: name, contact details, delivery address and order history. Payment card details never touch our servers — they are handled by the payment gateway.",
      "Analytics data (pages visited, device type, approximate location) is collected to improve the store, stored pseudonymously against a random session ID, and never sold to third parties.",
      "Newsletter subscription is opt-in and every email carries a one-click unsubscribe.",
      "You may request a copy or deletion of your personal data anytime by writing to care@madhuranaturals.in.",
      "Cookies: we use a session cookie for sign-in (httpOnly, secure) and localStorage for your cart and preferences.",
    ],
  },
  terms: {
    title: "Terms of Service",
    body: [
      "By placing an order on madhuranaturals.in you agree to these terms. Prices are in Indian Rupees and inclusive of GST.",
      "Product images are generated representations of our packaging and produce; the batch you receive may vary naturally in colour and texture — that is the nature of unrefined food.",
      "Orders unpaid within the payment window are automatically cancelled and reserved stock released.",
      "We may cancel and fully refund orders in case of stock errors, pricing errors, or serviceability issues to your pincode.",
      "Disputes are subject to the jurisdiction of courts in Hyderabad, Telangana.",
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(policies).map((policy) => ({ policy }));
}

export async function generateMetadata({ params }: { params: Promise<{ policy: string }> }): Promise<Metadata> {
  const { policy } = await params;
  const p = policies[policy];
  return { title: p ? p.title : "Policy" };
}

export default async function PolicyPage({ params }: { params: Promise<{ policy: string }> }) {
  const { policy } = await params;
  const p = policies[policy];
  if (!p) notFound();
  return (
    <div className="container-page max-w-3xl pb-24 pt-28">
      <h1 className="font-display text-4xl font-medium text-forest-900 sm:text-5xl">{p.title}</h1>
      <div className="mt-8 space-y-4 text-[0.95rem] leading-relaxed text-bark/80">
        {p.body.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
      <p className="mt-10 text-xs text-bark/50">Last updated: July 2026 · Questions? care@madhuranaturals.in</p>
    </div>
  );
}
