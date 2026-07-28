// Payment provider abstraction. Swap in Razorpay/PhonePe/Cashfree/Stripe by
// implementing PaymentProvider and switching PAYMENT_PROVIDER env.
import crypto from "crypto";
import { env } from "../env";

export interface PaymentIntent {
  provider: string;
  ref: string;
  // client payload a real gateway would need (order id, key id, etc.)
  clientPayload: Record<string, unknown>;
}

export interface PaymentProvider {
  name: string;
  createIntent(orderId: string, amountPaise: number): Promise<PaymentIntent>;
  // verify a confirmation coming back from the client/webhook
  verify(orderId: string, payload: Record<string, unknown>): Promise<boolean>;
}

const mockProvider: PaymentProvider = {
  name: "mock",
  async createIntent(orderId, amountPaise) {
    const ref = `mockpay_${crypto.randomBytes(8).toString("hex")}`;
    return { provider: "mock", ref, clientPayload: { orderId, amountPaise, ref } };
  },
  async verify() {
    return true; // mock gateway always verifies; real providers check signatures
  },
};

// ponytail: Razorpay's REST API is two endpoints and an HMAC — no SDK dependency.
const rzpAuth = () =>
  "Basic " + Buffer.from(`${env.razorpay.keyId}:${env.razorpay.keySecret}`).toString("base64");

const razorpayProvider: PaymentProvider = {
  name: "razorpay",
  async createIntent(orderId, amountPaise) {
    if (!env.razorpay.keyId || !env.razorpay.keySecret)
      throw new Error("RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are not set");
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { Authorization: rzpAuth(), "Content-Type": "application/json" },
      // receipt is capped at 40 chars by Razorpay; cuids fit
      body: JSON.stringify({ amount: amountPaise, currency: "INR", receipt: orderId.slice(0, 40) }),
    });
    const body = (await res.json()) as { id?: string; error?: { description?: string } };
    if (!res.ok || !body.id)
      throw new Error(`Razorpay order creation failed: ${body.error?.description ?? res.status}`);
    return {
      provider: "razorpay",
      ref: body.id,
      clientPayload: { keyId: env.razorpay.keyId, razorpayOrderId: body.id, amount: amountPaise, currency: "INR" },
    };
  },
  async verify(_orderId, payload) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = payload as Record<string, string>;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) return false;
    const expected = crypto
      .createHmac("sha256", env.razorpay.keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");
    return timingSafeEqual(expected, razorpay_signature);
  },
};

/** Constant-time compare that tolerates length mismatch (Buffer.compare throws on it). */
export const timingSafeEqual = (a: string, b: string): boolean => {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
};

/** Verifies a Razorpay webhook against the raw request body. */
export const verifyWebhook = (rawBody: Buffer | string, signature: string): boolean => {
  if (!env.razorpay.webhookSecret || !signature) return false;
  const expected = crypto.createHmac("sha256", env.razorpay.webhookSecret).update(rawBody).digest("hex");
  return timingSafeEqual(expected, signature);
};

const providers: Record<string, PaymentProvider> = { mock: mockProvider, razorpay: razorpayProvider };

export const paymentProvider = (): PaymentProvider =>
  providers[env.paymentProvider] ?? mockProvider;

export const PAYMENT_WINDOW_MINUTES = 15;
