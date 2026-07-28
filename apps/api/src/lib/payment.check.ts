/* Self-check for the gateway signature logic — the boundary that stops a forged
   request from marking an order paid. Run: npm run check:payment */
import assert from "assert";
import crypto from "crypto";

const SECRET = "test_webhook_secret";
const sign = (secret: string, payload: string) => crypto.createHmac("sha256", secret).update(payload).digest("hex");

async function main() {
  // set before importing — env.ts snapshots process.env at module load
  process.env.RAZORPAY_WEBHOOK_SECRET = SECRET;
  const { verifyWebhook, timingSafeEqual } = await import("./payment");

  const body = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { order_id: "order_X" } } } });

  assert.equal(verifyWebhook(body, sign(SECRET, body)), true, "valid signature must pass");
  assert.equal(verifyWebhook(body, sign("wrong_secret", body)), false, "wrong secret must fail");
  assert.equal(verifyWebhook(body + " ", sign(SECRET, body)), false, "tampered body must fail");
  assert.equal(verifyWebhook(body, ""), false, "missing signature must fail");
  assert.equal(verifyWebhook(body, "abc"), false, "short signature must not throw");

  assert.equal(timingSafeEqual("abc", "abc"), true);
  assert.equal(timingSafeEqual("abc", "abcd"), false, "length mismatch must not throw");

  console.log("payment signature checks passed");
}

main();
