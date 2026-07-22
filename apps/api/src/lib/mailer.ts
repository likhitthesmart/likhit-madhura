import nodemailer from "nodemailer";
import { env } from "../env";

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
    return;
  }
  try {
    await transporter.sendMail({ from: env.smtp.from, to, subject, html });
  } catch (e) {
    console.error("[mail:error]", e);
  }
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

export const mailTemplates = {
  verify: (link: string) =>
    shell("Verify your email", `<p>Welcome to Madhura Naturals. Please confirm your email:</p><p><a href="${link}">Verify email</a></p>`),
  reset: (link: string) =>
    shell("Reset your password", `<p>Click below to set a new password. The link expires in 1 hour.</p><p><a href="${link}">Reset password</a></p>`),
  orderConfirmed: (orderNo: string, total: string) =>
    shell(`Order ${orderNo} confirmed`, `<p>Thank you for your order. Total: <b>${total}</b>.</p><p>We are lovingly packing your organic goodness.</p>`),
  enquiryReceived: (name: string) =>
    shell("We received your message", `<p>Namaste ${name}, thank you for reaching out. Our team will reply within 24 hours.</p>`),
};
