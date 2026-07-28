import nodemailer from "nodemailer";
import { env } from "../env";
import { rupees } from "./util";

// product names and addresses are user/admin input landing in an HTML email
const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

const transporter = env.smtp.host
  ? nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
    })
  : null;

export async function sendMail(to: string, subject: string, html: string) {
  if (!transporter) {
    // ponytail: SMTP not configured -> log instead of failing checkout/signup flows
    console.log(`[mail:skipped] to=${to} subject="${subject}"`);
    return false;
  }
  try {
    await transporter.sendMail({ from: env.smtp.from, to, subject, html });
    return true;
  } catch (e) {
    // never rethrow: a bounced receipt must not fail an order that was really placed
    console.error("[mail:error]", e);
    return false;
  }
}

/** Live SMTP handshake. Used by `npm run check:mail` — never on a request path. */
export async function verifyTransport() {
  if (!transporter) return "not configured — SMTP_HOST is empty, so mail is logged instead of sent";
  await transporter.verify();
  return `ready — ${env.smtp.host}:${env.smtp.port} as ${env.smtp.user || "(no auth)"}`;
}

const shell = (title: string, body: string) => `
  <div style="font-family:Georgia,serif;background:#f7f4ee;padding:32px">
    <div style="max-width:560px;margin:auto;background:#fffdf8;border-radius:16px;padding:32px;border:1px solid #e5decf">
      <h2 style="color:#3f4d2e;margin-top:0">Madhura Naturals</h2>
      <h3 style="color:#2f3a22">${title}</h3>
      <div style="color:#4a4a42;font-size:15px;line-height:1.6">${body}</div>
      <p style="color:#8a8a7a;font-size:12px;margin-top:24px">Premium Organic Goodness — from our farms to your home.</p>
    </div>
  </div>`;

/** Customer-facing copy per order status. A status missing here is one we do not
 *  email about (PENDING is pre-payment — the customer is still on the page). */
const STATUS_COPY: Record<string, { subject: string; title: string; body: string }> = {
  PROCESSING: { subject: "confirmed", title: "Order confirmed", body: "We have your order and your payment. Our team is preparing it now." },
  PACKED: { subject: "packed", title: "Packed and ready", body: "Your order is packed and waiting for pickup by our courier partner." },
  SHIPPED: { subject: "shipped", title: "On its way", body: "Your order has left our farm and is on its way to you." },
  DELIVERED: { subject: "delivered", title: "Delivered", body: "Your order has been delivered. We hope you love it — a review would mean a lot to us." },
  CANCELLED: { subject: "cancelled", title: "Order cancelled", body: "This order has been cancelled. Any payment already made will be returned to the original method." },
  REFUNDED: { subject: "refunded", title: "Refund issued", body: "Your refund has been issued. Banks usually take 5–7 working days to post it." },
};

interface OrderMail {
  orderNo: string;
  items: { name: string; unit: string; qty: number; price: number }[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  tax: number;
  total: number;
  shippingAddress: unknown;
}

/** Line items, money breakdown and delivery address — identical in the
 *  order-placed and order-confirmed mails, so it lives in one place. */
const orderDetails = (o: OrderMail, totalLabel: string) => {
  const a = (o.shippingAddress ?? {}) as Record<string, string>;
  const row = (label: string, value: string, strong = false) =>
    `<tr><td style="padding:4px 0;color:#6b6b5e">${label}</td><td style="padding:4px 0;text-align:right${
      strong ? ";font-weight:700;color:#2f3a22;font-size:17px" : ""
    }">${value}</td></tr>`;
  return `<table style="width:100%;border-collapse:collapse;margin:20px 0">
      ${o.items
        .map(
          (i) =>
            `<tr><td style="padding:8px 0;border-bottom:1px solid #ece5d6">${esc(i.name)}
               <span style="color:#8a8a7a">${esc(i.unit)} × ${i.qty}</span></td>
              <td style="padding:8px 0;border-bottom:1px solid #ece5d6;text-align:right;white-space:nowrap">${rupees(i.price * i.qty)}</td></tr>`
        )
        .join("")}
    </table>
    <table style="width:100%;border-collapse:collapse">
      ${row("Subtotal", rupees(o.subtotal))}
      ${o.discount ? row("Discount", `− ${rupees(o.discount)}`) : ""}
      ${row("Shipping", o.shippingFee ? rupees(o.shippingFee) : "Free")}
      ${o.tax ? row("Tax", rupees(o.tax)) : ""}
      ${row(totalLabel, rupees(o.total), true)}
    </table>
    <p style="margin-top:24px"><b style="color:#2f3a22">Delivering to</b><br>
      ${esc(a.name)}<br>${esc(a.line1)}${a.line2 ? `<br>${esc(a.line2)}` : ""}<br>
      ${esc(a.city)}, ${esc(a.state)} ${esc(a.pincode)}<br>${esc(a.phone)}</p>`;
};

export const mailTemplates = {
  verify: (link: string) =>
    shell("Verify your email", `<p>Welcome to Madhura Naturals. Please confirm your email:</p><p><a href="${link}">Verify email</a></p>`),
  reset: (link: string) =>
    shell("Reset your password", `<p>Click below to set a new password. The link expires in 1 hour.</p><p><a href="${link}">Reset password</a></p>`),
  newsletterWelcome: () =>
    shell(
      "Welcome to the Madhura family",
      `<p>Thank you for subscribing. You will hear from us when a fresh batch is pressed, and when members-only offers open.</p>
       <p><a href="${env.siteUrl}/shop">Browse the shop</a></p>`
    ),
  /** Sent the moment an order is created, before payment clears. */
  orderPlaced: (o: OrderMail & { paymentExpiresAt?: Date | null }) => {
    const minutes = o.paymentExpiresAt
      ? Math.max(1, Math.round((o.paymentExpiresAt.getTime() - Date.now()) / 60_000))
      : null;
    return shell(
      `Order ${esc(o.orderNo)} received`,
      `<p>We have your order and are holding your items. It is confirmed once payment completes${
        minutes ? ` — please finish within ${minutes} minutes` : ""
      }.</p>
       ${orderDetails(o, "Total due")}
       <p style="margin-top:20px"><a href="${env.siteUrl}/track-order?orderNo=${encodeURIComponent(o.orderNo)}">Track this order</a></p>`
    );
  },
  orderConfirmed: (o: OrderMail) =>
    shell(
      `Order ${esc(o.orderNo)} confirmed`,
      `<p>Thank you for your order — we are lovingly packing your organic goodness.</p>
       ${orderDetails(o, "Total paid")}
       <p><a href="${env.siteUrl}/track-order?orderNo=${encodeURIComponent(o.orderNo)}">Track this order</a></p>`
    ),
  /** Order lifecycle update. Returns null for statuses the customer is not mailed
   *  about, so callers can fire-and-forget without knowing which those are. */
  orderStatus: (o: { orderNo: string; status: string; trackingNo?: string | null; courier?: string | null; note?: string | null }) => {
    const copy = STATUS_COPY[o.status];
    if (!copy) return null;
    const tracking =
      o.status === "SHIPPED" && o.trackingNo
        ? `<p style="margin-top:20px"><b style="color:#2f3a22">Tracking</b><br>
             ${esc(o.courier ?? "Courier")} — ${esc(o.trackingNo)}</p>`
        : "";
    return {
      subject: `Order ${o.orderNo} ${copy.subject} — Madhura Naturals`,
      html: shell(
        copy.title,
        `<p>${copy.body}</p>
         <p style="margin-top:16px;color:#6b6b5e">Order <b style="color:#2f3a22">${esc(o.orderNo)}</b></p>
         ${o.note ? `<p style="color:#6b6b5e">${esc(o.note)}</p>` : ""}
         ${tracking}
         <p style="margin-top:20px"><a href="${env.siteUrl}/track-order?orderNo=${encodeURIComponent(o.orderNo)}">Track this order</a></p>`
      ),
    };
  },
  enquiryReceived: (name: string) =>
    shell("We received your message", `<p>Namaste ${name}, thank you for reaching out. Our team will reply within 24 hours.</p>`),
};
