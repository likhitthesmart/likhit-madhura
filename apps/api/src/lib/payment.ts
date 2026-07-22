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

const providers: Record<string, PaymentProvider> = { mock: mockProvider };

export const paymentProvider = (): PaymentProvider =>
  providers[env.paymentProvider] ?? mockProvider;

export const PAYMENT_WINDOW_MINUTES = 15;
