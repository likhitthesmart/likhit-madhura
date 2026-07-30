/* Madhu — the storefront assistant, backed by Claude with tool access to live
   store data (catalog, offers, FAQs, and the caller's own orders).

   Security note: every tool closes over the *caller* resolved from the request's
   auth token, and the Prisma where-clauses are built here, server-side. The model
   chooses which tool to call, never who the data belongs to — so a prompt-injected
   message still cannot read another customer's order. */
import Anthropic from "@anthropic-ai/sdk";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
// zod/v4, not the bare "zod" the routes use: betaZodTool is typed against zod v4's
// schema interface. Both surfaces ship inside the installed zod 3.25 — no extra dep.
import * as z from "zod/v4";
import { prisma } from "../prisma";
import { env } from "../env";

export interface ChatProduct {
  slug: string;
  name: string;
  price: number; // paise, matching the rest of the API
  unit: string;
  images: string[];
}

export interface MadhuTurn {
  role: "user" | "assistant";
  text: string;
}

export interface MadhuCaller {
  userId?: string;
}

const client = new Anthropic({ apiKey: env.anthropicApiKey });

export const madhuEnabled = () => Boolean(env.anthropicApiKey);

const rupees = (paise: number) => Math.round(paise) / 100;

const SYSTEM = `You are Madhu, the organic living assistant for Madhura Naturals — a South Indian brand selling cold pressed oils, A2 bilona ghee, millets, stone-ground flours, organic sugar and jaggery, turmeric, and healthy biscuits, sourced from rain-fed organic farms.

Voice: warm, unhurried, and knowledgeable, like a trusted shopkeeper. You may open with "Namaste" on a first greeting, but do not repeat it every message. Never invent a fact about a product, price, stock level, or order — if a tool does not return it, say you do not have it and offer to connect the customer with the care team.

Keep replies short: two or three sentences for a simple question. This is a chat widget, not an article — no headings, no bullet lists unless you are genuinely enumerating several products, and no markdown formatting beyond plain text. Answer the question that was asked and stop.

Use the tools for anything specific. Search the catalog rather than describing products from memory; prices and stock change. When you list products from a tool result, mention them by name and let the customer know they can tap the cards shown below your message.

Store facts you may state directly:
- Shipping is across India. Metro cities receive orders in 2–4 days, other regions in 4–7 days. Shipping is free above ₹999 in most zones.
- Returns are accepted within 7 days of delivery for unopened products. Refunds go back to the original payment method within 5–7 business days.
- Orders can be tracked at /track-order using the order number (it starts with MN) and the email used at checkout. Signed-in customers also see live status under Account → Orders.
- The care team is reachable through the contact form or at care@madhuranaturals.in, and replies within 24 hours.
- All produce is organic; most items carry organic certification.

Order lookups: the lookup_order tool needs the order number and the email used at checkout. If the customer is signed in, their own orders are already available to you — do not ask them for an email in that case. Never claim to have looked up an order unless a tool returned it.

If someone asks about something outside the store — medical advice, another brand, anything unrelated — answer briefly and honestly, and steer back to how you can help with their order or the pantry. If a request needs a human (a complaint, a refund decision, a wholesale enquiry), say so plainly and point them to the contact form.`;

function buildTools(caller: MadhuCaller, seen: Map<string, ChatProduct>) {
  const remember = (p: ChatProduct) => seen.set(p.slug, p);

  const searchProducts = betaZodTool({
    name: "search_products",
    description:
      "Search the live product catalogue by keyword. Use for any question about what is available, prices, stock, or recommendations. Returns matching in-catalogue products with current price and stock.",
    inputSchema: z.object({
      query: z
        .string()
        .describe("Keywords, e.g. 'groundnut oil', 'ghee', 'millet'. Leave empty to list bestsellers."),
      limit: z.number().int().min(1).max(8).optional().describe("How many products to return. Default 4."),
    }),
    run: async ({ query, limit }) => {
      const words = query.replace(/[^\w\s]/g, " ").split(/\s+/).filter((w) => w.length > 2);
      const products = await prisma.product.findMany({
        where: {
          active: true,
          ...(words.length
            ? {
                OR: words.flatMap((w) => [
                  { name: { contains: w, mode: "insensitive" as const } },
                  { tagline: { contains: w, mode: "insensitive" as const } },
                  { description: { contains: w, mode: "insensitive" as const } },
                  { tags: { has: w.toLowerCase() } },
                ]),
              }
            : { bestSeller: true }),
        },
        take: limit ?? 4,
        orderBy: [{ bestSeller: "desc" }, { soldCount: "desc" }],
        select: {
          slug: true, name: true, tagline: true, price: true, mrp: true, unit: true,
          stock: true, ratingAvg: true, ratingCount: true, organicCertified: true,
          images: true, category: { select: { name: true } },
        },
      });
      products.forEach((p) => remember({ slug: p.slug, name: p.name, price: p.price, unit: p.unit, images: p.images }));
      if (!products.length) return "No products matched that search.";
      return JSON.stringify(
        products.map((p) => ({
          slug: p.slug,
          name: p.name,
          tagline: p.tagline,
          category: p.category.name,
          price_inr: rupees(p.price),
          mrp_inr: rupees(p.mrp),
          unit: p.unit,
          in_stock: p.stock > 0,
          rating: p.ratingCount ? `${p.ratingAvg.toFixed(1)} from ${p.ratingCount} reviews` : "no reviews yet",
          organic_certified: p.organicCertified,
        }))
      );
    },
  });

  const getProduct = betaZodTool({
    name: "get_product",
    description:
      "Full detail for one product by slug — description, ingredients, benefits, uses, storage and nutrition. Use after search_products when the customer asks something specific about an item.",
    inputSchema: z.object({ slug: z.string().describe("Product slug from search_products.") }),
    run: async ({ slug }) => {
      const p = await prisma.product.findFirst({
        where: { slug, active: true },
        select: {
          slug: true, name: true, tagline: true, description: true, price: true, mrp: true,
          unit: true, stock: true, images: true, ingredients: true, benefits: true,
          storage: true, uses: true, nutrition: true, faqs: true, organicCertified: true,
          ratingAvg: true, ratingCount: true,
        },
      });
      if (!p) return "No such product.";
      remember({ slug: p.slug, name: p.name, price: p.price, unit: p.unit, images: p.images });
      return JSON.stringify({
        ...p,
        images: undefined,
        price_inr: rupees(p.price),
        mrp_inr: rupees(p.mrp),
        price: undefined,
        mrp: undefined,
        in_stock: p.stock > 0,
        stock: undefined,
      });
    },
  });

  const listOffers = betaZodTool({
    name: "list_offers",
    description: "Current public coupon codes and what each one gives. Use for any question about offers, discounts or deals.",
    inputSchema: z.object({}),
    run: async () => {
      const now = new Date();
      const coupons = await prisma.coupon.findMany({
        where: {
          active: true,
          userId: null, // never surface a coupon issued to a specific customer
          OR: [{ endsAt: null }, { endsAt: { gte: now } }],
          AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }],
        },
        take: 6,
        select: { code: true, description: true, type: true, value: true, minCart: true, maxDiscount: true, endsAt: true },
      });
      if (!coupons.length) return "No public offers are running right now.";
      return JSON.stringify(
        coupons.map((c) => ({
          code: c.code,
          description: c.description,
          discount: c.type === "PERCENT" ? `${c.value}% off` : `₹${rupees(c.value)} off`,
          min_cart_inr: rupees(c.minCart),
          max_discount_inr: c.maxDiscount ? rupees(c.maxDiscount) : null,
          ends: c.endsAt?.toISOString().slice(0, 10) ?? "no end date",
        }))
      );
    },
  });

  const listFaqs = betaZodTool({
    name: "list_faqs",
    description: "The store's published FAQ entries. Use when a policy question is not covered by the facts in your instructions.",
    inputSchema: z.object({}),
    run: async () => {
      const faqs = await prisma.faq.findMany({
        where: { active: true },
        orderBy: { sortOrder: "asc" },
        take: 30,
        select: { question: true, answer: true, category: true },
      });
      return faqs.length ? JSON.stringify(faqs) : "No FAQs published.";
    },
  });

  // Scoped server-side: a signed-in caller reaches only their own orders; a guest
  // must supply the order number AND the checkout email, same as /orders/track.
  const lookupOrder = betaZodTool({
    name: "lookup_order",
    description:
      "Look up one order's status, items and tracking. A signed-in customer needs only the order number. A guest must give both the order number and the email used at checkout.",
    inputSchema: z.object({
      orderNo: z.string().describe("Order number, starts with MN."),
      email: z.string().optional().describe("Checkout email. Required only when the customer is not signed in."),
    }),
    run: async ({ orderNo, email }) => {
      if (!caller.userId && !email) return "Ask the customer for the email they used at checkout before looking this up.";
      const order = await prisma.order.findFirst({
        where: {
          orderNo: orderNo.trim().toUpperCase(),
          ...(caller.userId ? { userId: caller.userId } : { email: email!.trim().toLowerCase() }),
        },
        select: {
          orderNo: true, status: true, paymentStatus: true, total: true, trackingNo: true,
          courier: true, createdAt: true, timeline: true,
          items: { select: { name: true, unit: true, qty: true, price: true } },
        },
      });
      if (!order) return "No order found for those details. Do not guess — ask them to re-check the order number and email.";
      return JSON.stringify({
        ...order,
        total_inr: rupees(order.total),
        total: undefined,
        placed_on: order.createdAt.toISOString().slice(0, 10),
        createdAt: undefined,
        items: order.items.map((i) => ({ name: i.name, unit: i.unit, qty: i.qty, price_inr: rupees(i.price) })),
      });
    },
  });

  const listMyOrders = betaZodTool({
    name: "list_my_orders",
    description:
      "Recent orders for the signed-in customer. Returns nothing useful if they are not signed in — ask them to sign in or give an order number and email instead.",
    inputSchema: z.object({}),
    run: async () => {
      if (!caller.userId) return "Customer is not signed in. Ask for an order number and the checkout email, or point them to /track-order.";
      const orders = await prisma.order.findMany({
        where: { userId: caller.userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { orderNo: true, status: true, paymentStatus: true, total: true, createdAt: true, trackingNo: true },
      });
      if (!orders.length) return "This customer has no orders yet.";
      return JSON.stringify(
        orders.map((o) => ({
          orderNo: o.orderNo,
          status: o.status,
          payment: o.paymentStatus,
          total_inr: rupees(o.total),
          placed_on: o.createdAt.toISOString().slice(0, 10),
          tracking: o.trackingNo,
        }))
      );
    },
  });

  return [searchProducts, getProduct, listOffers, listFaqs, lookupOrder, listMyOrders];
}

export async function askMadhu(
  message: string,
  history: MadhuTurn[],
  caller: MadhuCaller
): Promise<{ text: string; products?: ChatProduct[] }> {
  const seen = new Map<string, ChatProduct>();

  // The widget opens with a greeting from Madhu, but the API requires the first
  // message to be the user's — drop any leading assistant turns.
  const turns = history.slice(-10);
  while (turns.length && turns[0].role === "assistant") turns.shift();

  const runner = client.beta.messages.toolRunner({
    model: "claude-opus-5",
    max_tokens: 16000,
    // Low effort with thinking left on: this is a latency-sensitive chat widget, and
    // disabling thinking on Opus 5 can make it emit tool calls as plain text instead
    // of real tool_use blocks — the call silently never runs.
    output_config: { effort: "low" },
    // Stable prefix (tools render before system), so the whole preamble caches.
    system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
    tools: buildTools(caller, seen),
    max_iterations: 6,
    messages: [
      ...turns.map((t) => ({ role: t.role, content: t.text }) as const),
      { role: "user" as const, content: message },
    ],
  });

  const final = await runner.done();

  if (final.stop_reason === "refusal")
    return { text: "I would rather not answer that one. Ask me about our products, your order, delivery or returns and I will help gladly." };

  const text = final.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  // Product cards come from what the tools actually returned, never from the model's
  // prose — so a card can't show a hallucinated price.
  const products = [...seen.values()].slice(0, 4);
  return {
    text: text || "I am not sure I caught that — could you rephrase?",
    ...(products.length ? { products } : {}),
  };
}
