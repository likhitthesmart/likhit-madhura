"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { LotusMark } from "@/components/ui/logo";
import { inr, dateLong } from "@/lib/format";

/* Seller details printed on every invoice. These are legal identifiers — fill in
   the real registered values before issuing invoices to customers. */
const SELLER = {
  legalName: "Madhura Naturals",
  addressLines: ["Zaheerabad, Sangareddy District", "Telangana 502220, India"],
  gstin: "TODO-GSTIN",
  fssai: "13624010000000",
  email: "care@madhuranaturals.in",
};

interface InvoiceOrder {
  orderNo: string;
  createdAt: string;
  paymentStatus: string;
  subtotal: number;
  discount: number;
  couponCode?: string | null;
  shippingFee: number;
  tax: number;
  total: number;
  shippingAddress: { name: string; phone: string; line1: string; line2?: string; city: string; state: string; pincode: string };
  items: { id: string; name: string; unit: string; price: number; qty: number }[];
}

const Party = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-black/50">{title}</p>
    <div className="text-[11px] leading-relaxed">{children}</div>
  </div>
);

/** Print-only tax invoice. Portalled to <body> so the print rules in globals.css
 *  can collapse every sibling — printing the page yields the invoice alone. */
export function Invoice({ order }: { order: InvoiceOrder }) {
  // portals need a DOM target, which does not exist during the server render
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const a = order.shippingAddress;
  const address = (
    <>
      <p className="font-semibold">{a.name}</p>
      <p>{a.line1}{a.line2 ? `, ${a.line2}` : ""}</p>
      <p>{a.city}, {a.state} — {a.pincode}</p>
      <p>Phone: {a.phone}</p>
    </>
  );

  if (!mounted) return null;

  return createPortal(
    <div className="print-sheet hidden bg-white p-0 text-black">
      <header className="flex items-start justify-between border-b-2 border-black/80 pb-4">
        <div className="flex items-center gap-3">
          <LotusMark className="h-11 w-11 text-black" />
          <div>
            <p className="font-display text-2xl font-medium leading-none tracking-wide">MADHURA NATURALS</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-black/60">Premium Organic Goodness</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-display text-xl font-semibold">TAX INVOICE</p>
          <p className="mt-1 text-[11px]">Invoice No: <b>INV-{order.orderNo}</b></p>
          <p className="text-[11px]">Invoice Date: {dateLong(order.createdAt)}</p>
        </div>
      </header>

      <section className="grid grid-cols-3 gap-6 border-b border-black/20 py-4">
        <Party title="Sold by">
          <p className="font-semibold">{SELLER.legalName}</p>
          {SELLER.addressLines.map((l) => <p key={l}>{l}</p>)}
          <p>GSTIN: {SELLER.gstin}</p>
          <p>FSSAI: {SELLER.fssai}</p>
        </Party>
        <Party title="Billing address">{address}</Party>
        <Party title="Shipping address">{address}</Party>
      </section>

      <section className="grid grid-cols-3 gap-6 border-b border-black/20 py-3 text-[11px]">
        <p>Order Number: <b>{order.orderNo}</b></p>
        <p>Order Date: <b>{dateLong(order.createdAt)}</b></p>
        <p>Payment: <b>{order.paymentStatus === "PAID" ? "Paid" : order.paymentStatus}</b></p>
      </section>

      <table className="mt-4 w-full border-collapse text-[11px]">
        <thead>
          <tr className="border-b border-black/40 text-left">
            <th className="w-8 py-2 font-semibold">#</th>
            <th className="py-2 font-semibold">Description</th>
            <th className="py-2 text-center font-semibold">Qty</th>
            <th className="py-2 text-right font-semibold">Unit Price</th>
            <th className="py-2 text-right font-semibold">Amount</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((i, n) => (
            <tr key={i.id} className="border-b border-black/10 align-top">
              <td className="py-2">{n + 1}</td>
              <td className="py-2">
                {i.name}
                <span className="block text-black/50">{i.unit}</span>
              </td>
              <td className="py-2 text-center">{i.qty}</td>
              <td className="py-2 text-right">{inr(i.price)}</td>
              <td className="py-2 text-right">{inr(i.price * i.qty)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 flex justify-end">
        <table className="w-64 text-[11px]">
          <tbody>
            <tr><td className="py-1 text-black/70">Subtotal</td><td className="py-1 text-right">{inr(order.subtotal)}</td></tr>
            {order.discount > 0 && (
              <tr>
                <td className="py-1 text-black/70">Discount{order.couponCode ? ` (${order.couponCode})` : ""}</td>
                <td className="py-1 text-right">− {inr(order.discount)}</td>
              </tr>
            )}
            <tr><td className="py-1 text-black/70">Shipping</td><td className="py-1 text-right">{order.shippingFee ? inr(order.shippingFee) : "Free"}</td></tr>
            <tr><td className="py-1 text-black/60">GST (included in total)</td><td className="py-1 text-right text-black/60">{inr(order.tax)}</td></tr>
            <tr className="border-t-2 border-black/80">
              <td className="py-2 text-sm font-bold">Grand Total</td>
              <td className="py-2 text-right text-sm font-bold">{inr(order.total)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <footer className="mt-8 border-t border-black/20 pt-3 text-[10px] text-black/60">
        <p>Prices are inclusive of GST. This is a computer-generated invoice and does not require a signature.</p>
        <p className="mt-1">Questions about this order? Write to {SELLER.email}</p>
      </footer>
    </div>,
    document.body
  );
}
