import { Router } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { prisma } from "../prisma";
import { wrap } from "../middleware/error";
import { sendMail, mailTemplates } from "../lib/mailer";

export const contactRouter = Router();
// this router is mounted on the shared /api/v1 prefix, so the limiter must be
// path-scoped — a bare .use() would count every /api/v1/* request against it
contactRouter.use(["/enquiries", "/newsletter", "/chat"], rateLimit({ windowMs: 15 * 60_000, limit: 20 }));

contactRouter.post(
  "/enquiries",
  wrap(async (req, res) => {
    const body = z
      .object({
        name: z.string().min(2).max(80),
        email: z.string().email(),
        phone: z.string().max(15).optional(),
        subject: z.string().max(120).optional(),
        message: z.string().min(5).max(3000),
        source: z.enum(["CONTACT", "CHAT", "SUPPORT"]).default("CONTACT"),
      })
      .parse(req.body);
    const enquiry = await prisma.enquiry.create({ data: body });
    void sendMail(body.email, "We received your message — Madhura Naturals", mailTemplates.enquiryReceived(body.name));
    res.status(201).json({ ok: true, id: enquiry.id });
  })
);

contactRouter.post(
  "/newsletter",
  wrap(async (req, res) => {
    const { email } = z.object({ email: z.string().email().toLowerCase() }).parse(req.body);
    await prisma.subscriber.upsert({ where: { email }, create: { email }, update: { active: true } });
    void sendMail(email, "Welcome to the Madhura family — Madhura Naturals", mailTemplates.newsletterWelcome());
    res.status(201).json({ ok: true, message: "Welcome to the Madhura family!" });
  })
);

// themed chatbot: rule-based over live store data, escalates to support enquiry
contactRouter.post(
  "/chat",
  wrap(async (req, res) => {
    const { message } = z.object({ message: z.string().min(1).max(500) }).parse(req.body);
    const m = message.toLowerCase();
    const reply = async (): Promise<{ text: string; suggestions?: string[]; products?: unknown[] }> => {
      if (/track|order status|where.*order|delivery status/.test(m))
        return {
          text: "You can track any order from Track Order using your order number (starts with MN) and email. Registered customers also see live status under Account → Orders.",
          suggestions: ["Track my order", "Delivery time", "Talk to support"],
        };
      if (/return|refund|replace/.test(m))
        return {
          text: "We accept returns within 7 days of delivery for unopened products. Refunds are processed to the original payment method in 5–7 business days. Shall I connect you to our care team?",
          suggestions: ["Talk to support", "Shipping policy"],
        };
      if (/deliver|shipping|courier|how long|days/.test(m))
        return {
          text: "We ship across India. Metro cities receive orders in 2–4 days, other regions in 4–7 days. Shipping is free above ₹999 in most zones.",
          suggestions: ["Track my order", "Show best sellers"],
        };
      if (/offer|coupon|discount|deal/.test(m)) {
        const coupons = await prisma.coupon.findMany({
          where: { active: true, userId: null, OR: [{ endsAt: null }, { endsAt: { gte: new Date() } }] },
          take: 3,
          select: { code: true, description: true },
        });
        return coupons.length
          ? { text: `Current offers: ${coupons.map((c) => `${c.code} — ${c.description ?? ""}`).join(" · ")}`, suggestions: ["Show best sellers"] }
          : { text: "No public offers are running right now, but subscribers hear about seasonal offers first!", suggestions: ["Subscribe to newsletter"] };
      }
      if (/oil|ghee|millet|ragi|jowar|sugar|jaggery|turmeric|biscuit|atta|flour|kumkum|inguva|ravva|product|buy/.test(m)) {
        const products = await prisma.product.findMany({
          where: {
            active: true,
            OR: m.replace(/[^\w\s]/g, " ").split(/\s+/).filter((w) => w.length > 3).map((w) => ({ name: { contains: w, mode: "insensitive" as const } })),
          },
          take: 3,
          select: { slug: true, name: true, price: true, unit: true, images: true },
        });
        if (products.length)
          return { text: "Here is what I found in our collection:", products, suggestions: ["Show best sellers", "Current offers"] };
        return { text: "We craft cold-pressed oils, A2 ghee, millets, flours, organic sugar, turmeric and healthy biscuits. What would you like to explore?", suggestions: ["Cold pressed oils", "Millets", "Healthy biscuits"] };
      }
      if (/support|human|agent|help|talk|contact/.test(m))
        return {
          text: "I can connect you with our care team. Please share your query through the contact form and we will reply within 24 hours — or email care@madhuranaturals.in.",
          suggestions: ["Open contact form"],
        };
      if (/faq|question/.test(m)) {
        const faqs = await prisma.faq.findMany({ where: { active: true }, take: 3, orderBy: { sortOrder: "asc" } });
        return { text: faqs.map((f) => `Q: ${f.question}`).join(" · "), suggestions: ["Talk to support"] };
      }
      return {
        text: "Namaste! I am Madhu, your organic living assistant. Ask me about our products, orders, delivery, returns or offers.",
        suggestions: ["Show best sellers", "Delivery time", "Current offers", "Talk to support"],
      };
    };
    res.json(await reply());
  })
);
