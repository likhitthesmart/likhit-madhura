/* Self-check for order mail: the copy customers actually receive, and the live
   SMTP handshake. Run:
     npm run check:mail                  templates only
     npm run check:mail you@gmail.com    also sends a real test message
*/
import assert from "assert";
import { mailTemplates, verifyTransport, sendMail } from "./mailer";

const ORDER = {
  orderNo: "MN2607281234",
  items: [{ name: '<script>alert(1)</script>Ghee', unit: "500 ml", qty: 2, price: 45000 }],
  subtotal: 90000, discount: 0, shippingFee: 0, tax: 0, total: 90000,
  shippingAddress: { name: "A <b>Person</b>", line1: "1 Farm Rd", city: "Mysuru", state: "KA", pincode: "570001", phone: "9999999999" },
};

async function main() {
  /* ---- confirmation mail ---- */
  const confirmed = mailTemplates.orderConfirmed(ORDER);
  assert.ok(!confirmed.includes("<script>"), "product names must not inject markup into the email");
  assert.ok(confirmed.includes("&lt;b&gt;Person&lt;/b&gt;"), "address fields must be escaped");
  assert.ok(confirmed.includes("₹900") && confirmed.includes("500 ml"), "line items and totals must appear");

  /* ---- order-placed mail (pre-payment) ---- */
  const placed = mailTemplates.orderPlaced({ ...ORDER, paymentExpiresAt: new Date(Date.now() + 15 * 60_000) });
  assert.ok(placed.includes("Total due"), "before payment the total is due, not paid");
  assert.ok(!placed.includes("Total paid"), "an unpaid order must never claim payment was received");
  assert.ok(/within 1[45] minutes/.test(placed), "the payment window must be spelled out");
  assert.ok(!placed.includes("<script>"), "product names must be escaped here too");
  assert.ok(confirmed.includes("Total paid"), "the confirmation mail still reports payment");
  // no expiry set (e.g. cash on delivery) must not print "within null minutes"
  assert.ok(!mailTemplates.orderPlaced(ORDER).includes("minutes"), "no deadline copy without a deadline");

  /* ---- status mail: one per transition the customer sees ---- */
  const at = (status: string, extra: Record<string, unknown> = {}) =>
    mailTemplates.orderStatus({ orderNo: ORDER.orderNo, status, ...extra });

  assert.equal(at("PENDING"), null, "pre-payment status must not mail — the customer is still checking out");
  for (const s of ["PROCESSING", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]) {
    const m = at(s);
    assert.ok(m, `${s} must produce a mail`);
    assert.ok(m.subject.includes(ORDER.orderNo), `${s} subject must name the order`);
    assert.ok(m.html.includes("track-order?orderNo="), `${s} must link to tracking`);
  }
  assert.notEqual(at("SHIPPED")!.subject, at("DELIVERED")!.subject, "each status needs its own subject line");

  // tracking details belong on the shipped mail only, and only once known
  const shipped = at("SHIPPED", { trackingNo: "BD123456789IN", courier: "Bluedart" })!;
  assert.ok(shipped.html.includes("BD123456789IN") && shipped.html.includes("Bluedart"), "shipped mail must carry the tracking number");
  assert.ok(!at("SHIPPED")!.html.includes("Tracking"), "no tracking block before a number is set");
  assert.ok(!at("DELIVERED", { trackingNo: "BD123456789IN" })!.html.includes("BD123456789IN"), "tracking block is for SHIPPED only");

  // admin notes are operator input landing in an HTML email
  assert.ok(!at("PACKED", { note: "<img src=x onerror=alert(1)>" })!.html.includes("<img"), "admin notes must be escaped");

  /* ---- live SMTP ---- */
  console.log("smtp:", await verifyTransport());
  const to = process.argv[2];
  if (to) {
    const sent = await sendMail(to, shipped.subject, shipped.html);
    assert.ok(sent, `sending to ${to} failed — see [mail:error] above`);
    console.log(`test message delivered to ${to}`);
  }

  console.log("order mail checks passed");
}

main();
