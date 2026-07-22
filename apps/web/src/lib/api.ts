// Server-side fetch straight to the API container; client-side goes through the Next rewrite.
const SERVER_API = process.env.API_URL ?? "http://127.0.0.1:4000";

export const apiBase = typeof window === "undefined" ? `${SERVER_API}/api/v1` : "/api/v1";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function api<T>(
  path: string,
  init?: RequestInit & { token?: string | null; revalidate?: number }
): Promise<T> {
  const { token, revalidate, ...rest } = init ?? {};
  const res = await fetch(`${apiBase}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...rest.headers,
    },
    ...(typeof window === "undefined" ? { next: { revalidate: revalidate ?? 60 } } : {}),
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body.error) message = body.error;
    } catch {
      /* non-json error */
    }
    throw new ApiError(res.status, message);
  }
  return res.json() as Promise<T>;
}

/* ---- shared types mirrored from the API ---- */

export interface Category {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  image?: string | null;
  _count?: { products: number };
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  tagline?: string | null;
  description: string;
  price: number;
  mrp: number;
  unit: string;
  stock: number;
  images: string[];
  video?: string | null;
  tags: string[];
  bestSeller: boolean;
  featured: boolean;
  organicCertified: boolean;
  nutrition?: Record<string, string> | null;
  ingredients: string[];
  benefits: string[];
  storage?: string | null;
  uses: string[];
  faqs?: { q: string; a: string }[] | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  ratingAvg: number;
  ratingCount: number;
  category?: { slug: string; name: string };
  reviews?: Review[];
}

export interface Review {
  id: string;
  rating: number;
  title?: string | null;
  body: string;
  photos: string[];
  videoUrl?: string | null;
  verified: boolean;
  createdAt: string;
  user?: { name: string };
}

export interface CartQuote {
  lines: { productId: string; slug: string; name: string; unit: string; image: string | null; price: number; mrp: number; qty: number; lineTotal: number }[];
  subtotal: number;
  discount: number;
  coupon: { code: string; description?: string | null } | null;
  couponError: string | null;
  shippingFee: number;
  zone: string;
  etaDays: { min: number; max: number };
  tax: number;
  total: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: string;
  emailVerified: boolean;
}
