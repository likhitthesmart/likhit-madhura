import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";

export const metadata = { title: "Order status" };

export default async function ResultPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const success = sp.status === "success";
  const orderNo = typeof sp.orderNo === "string" ? sp.orderNo : "";
  return (
    <div className="container-page flex min-h-[70vh] flex-col items-center justify-center pt-24 text-center">
      {success ? (
        <>
          <CheckCircle2 className="h-16 w-16 text-forest-600" />
          <h1 className="mt-6 font-display text-4xl text-forest-900 sm:text-5xl">Namaste, and thank you!</h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-bark/70">
            Order <b className="text-forest-900">{orderNo}</b> is confirmed. We've emailed your receipt and our village
            unit will start packing your organic goodness today.
          </p>
          <div className="mt-8 flex gap-3">
            <Link href="/track-order" className="btn-primary">Track order</Link>
            <Link href="/shop" className="btn-secondary">Continue shopping</Link>
          </div>
        </>
      ) : (
        <>
          <XCircle className="h-16 w-16 text-copper" />
          <h1 className="mt-6 font-display text-4xl text-forest-900">Payment didn't go through</h1>
          <p className="mt-4 max-w-md text-sm text-bark/70">
            Don't worry — no money left your account. Your basket is safe, and you can try again.
          </p>
          <div className="mt-8 flex gap-3">
            <Link href="/cart" className="btn-primary">Retry payment</Link>
            <Link href="/contact" className="btn-secondary">Contact support</Link>
          </div>
        </>
      )}
    </div>
  );
}
