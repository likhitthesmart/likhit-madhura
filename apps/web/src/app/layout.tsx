import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/providers";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Chatbot } from "@/components/layout/chatbot";
import { LeadCapture } from "@/components/layout/lead-capture";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
});
const body = Manrope({ subsets: ["latin"], variable: "--font-body" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Madhura Naturals — Premium Organic Goodness from South India",
    template: "%s | Madhura Naturals",
  },
  description:
    "Cold pressed oils, A2 bilona ghee, millets, stone-ground flours and traditional staples from the organic farms of South India. Premium organic goodness, delivered home.",
  keywords: ["cold pressed oil", "A2 ghee", "organic millets", "ragi", "jowar", "organic food India", "Madhura Naturals"],
  openGraph: {
    type: "website",
    siteName: "Madhura Naturals",
    title: "Madhura Naturals — Premium Organic Goodness",
    description: "From the rain-fed farms and wooden ghanis of South India to your kitchen.",
    images: [{ url: "/media/story/about-banner.jpg", width: 1200, height: 630, alt: "Madhura Naturals organic farms" }],
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Madhura Naturals",
  url: siteUrl,
  logo: `${siteUrl}/icon.svg`,
  sameAs: ["https://instagram.com/madhuranaturals", "https://facebook.com/madhuranaturals"],
  contactPoint: { "@type": "ContactPoint", telephone: "+91-98765-43210", contactType: "customer service" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
        <Providers>
          <Header />
          <main className="min-h-screen">{children}</main>
          <Footer />
          <Chatbot />
          <LeadCapture />
        </Providers>
      </body>
    </html>
  );
}
