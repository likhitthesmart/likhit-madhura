"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, ChevronLeft, CreditCard, Gift, Lock, MapPin, ShieldCheck, Timer, Trash2 } from "lucide-react";
import { useCart } from "@/store/cart";
import { useAuth } from "@/store/auth";
import { api, type CartQuote } from "@/lib/api";
import { inr, cn } from "@/lib/format";
import { IN_STATES, MOBILE_RE, toMobile } from "@/lib/india";
import { trackEvent, scrollToTop } from "@/components/layout/providers";

interface AddressForm {
  name: string; phone: string; line1: string; line2: string; city: string; state: string; pincode: string;
}
const emptyAddress: AddressForm = { name: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "" };

interface SavedAddress {
  id: string; label: string; name: string; phone: string; line1: string; line2: string | null;
  city: string; state: string; pincode: string; isDefault: boolean;
}
// line2 is nullable in the database but the form inputs need a string
const toForm = (a: SavedAddress): AddressForm => ({
  name: a.name, phone: a.phone, line1: a.line1, line2: a.line2 ?? "",
  city: a.city, state: a.state, pincode: a.pincode,
});

const steps = ["Address", "Review", "Payment"] as const;

interface RazorpayInstance {
  open(): void;
  on(event: string, handler: (r: unknown) => void): void;
}

interface PaymentIntent {
  provider: string;
  keyId?: string;
  razorpayOrderId?: string;
  amount?: number;
  currency?: string;
}

// Razorpay's widget is script-tag only — no npm package for the browser side.
const RAZORPAY_JS = "https://checkout.razorpay.com/v1/checkout.js";
const loadRazorpay = (): Promise<void> =>
  new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${RAZORPAY_JS}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = RAZORPAY_JS;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Could not reach Razorpay. Check your connection and retry."));
    document.head.appendChild(s);
  });

function AddressFields({ value, onChange, prefix }: { value: AddressForm; onChange: (a: AddressForm) => void; prefix: string }) {
  const set = (k: keyof AddressForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onChange({ ...value, [k]: e.target.value });
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div><label className="label-field" htmlFor={`${prefix}-name`}>Full name</label><input id={`${prefix}-name`} required value={value.name} onChange={set("name")} className="input-field" /></div>
      <div>
        <label className="label-field" htmlFor={`${prefix}-phone`}>Phone</label>
        {/* the courier calls this number — cleaned to 10 digits as it is typed so a
            pasted "+91 98765 43210" lands as 9876543210 rather than failing later */}
        <input
          id={`${prefix}-phone`}
          required
          pattern="[6-9][0-9]{9}"
          title="10-digit Indian mobile number"
          value={value.phone}
          onChange={(e) => onChange({ ...value, phone: toMobile(e.target.value) })}
          className="input-field"
          inputMode="numeric"
          autoComplete="tel-national"
        />
      </div>
      <div className="sm:col-span-2"><label className="label-field" htmlFor={`${prefix}-line1`}>Address line 1</label><input id={`${prefix}-line1`} required value={value.line1} onChange={set("line1")} className="input-field" /></div>
      <div className="sm:col-span-2"><label className="label-field" htmlFor={`${prefix}-line2`}>Address line 2 (optional)</label><input id={`${prefix}-line2`} value={value.line2} onChange={set("line2")} className="input-field" /></div>
      <div><label className="label-field" htmlFor={`${prefix}-city`}>City</label><input id={`${prefix}-city`} required value={value.city} onChange={set("city")} className="input-field" /></div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label-field" htmlFor={`${prefix}-state`}>State</label>
          <select id={`${prefix}-state`} required value={value.state} onChange={set("state")} className="input-field">
            <option value="" disabled>Select</option>
            {IN_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div><label className="label-field" htmlFor={`${prefix}-pin`}>Pincode</label><input id={`${prefix}-pin`} required pattern="\d{6}" value={value.pincode} onChange={(e) => onChange({ ...value, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })} className="input-field" inputMode="numeric" /></div>
      </div>
    </div>
  );
}

function Countdown({ until, onExpire }: { until: string; onExpire: () => void }) {
  const [left, setLeft] = useState(() => Math.max(0, new Date(until).getTime() - Date.now()));
  useEffect(() => {
    const t = setInterval(() => {
      const remaining = Math.max(0, new Date(until).getTime() - Date.now());
      setLeft(remaining);
      if (remaining <= 0) {
        clearInterval(t);
        onExpire();
      }
    }, 1000);
    return () => clearInterval(t);
  }, [until, onExpire]);
  const m = Math.floor(left / 60000);
  const s = Math.floor((left % 60000) / 1000);
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold", left < 120000 ? "bg-copper/10 text-copper" : "bg-forest-50 text-forest-800")}>
      <Timer className="h-4 w-4" /> {m}:{String(s).padStart(2, "0")}
    </span>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, couponCode, clear, remove } = useCart();
  const { user, accessToken } = useAuth();
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [shipping, setShipping] = useState<AddressForm>(emptyAddress);
  const [billingSame, setBillingSame] = useState(true);
  const [billing, setBilling] = useState<AddressForm>(emptyAddress);
  const [giftNote, setGiftNote] = useState("");
  const [quote, setQuote] = useState<CartQuote | null>(null);
  const [order, setOrder] = useState<{ id: string; orderNo: string; total: number; paymentExpiresAt: string } | null>(null);
  const [intent, setIntent] = useState<PaymentIntent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [payState, setPayState] = useState<"idle" | "paying" | "failed" | "expired">("idle");

  const [saved, setSaved] = useState<SavedAddress[]>([]);

  // Address → Review → Payment never changes the URL, so nothing resets the scroll:
  // the customer was partway down a tall form and lands mid-card on the short one.
  useEffect(() => scrollToTop(), [step]);

  useEffect(() => {
    if (user?.email && !email) setEmail(user.email);
  }, [user, email]);

  // Prefill from the customer's saved addresses. The API returns them default-first.
  // Only fills a form the customer has not started typing into, so a late-arriving
  // response can never overwrite what they are entering.
  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    api<{ addresses: SavedAddress[] }>("/account/addresses", { token: accessToken })
      .then(({ addresses }) => {
        if (cancelled || !addresses.length) return;
        setSaved(addresses);
        setShipping((current) => (current.line1 ? current : toForm(addresses[0])));
      })
      .catch(() => undefined); // no saved addresses is not an error worth showing
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  useEffect(() => {
    if (!items.length || !shipping.pincode || shipping.pincode.length !== 6) return;
    api<CartQuote>("/cart/quote", {
      method: "POST",
      // token so member-only coupons resolve for signed-in customers
      token: accessToken,
      body: JSON.stringify({
        items: items.map((i) => ({ productId: i.productId, qty: i.qty })),
        couponCode: couponCode || undefined,
        pincode: shipping.pincode,
      }),
    })
      .then(setQuote)
      .catch(() => undefined);
  }, [items, couponCode, shipping.pincode, accessToken]);

  const canReview = useMemo(
    () => email.includes("@") && !!shipping.name && MOBILE_RE.test(shipping.phone) && !!shipping.line1 && !!shipping.city && IN_STATES.includes(shipping.state as (typeof IN_STATES)[number]) && /^\d{6}$/.test(shipping.pincode),
    [email, shipping]
  );

  if (!items.length && !order)
    return (
      <div className="container-page flex min-h-[60vh] flex-col items-center justify-center pt-24 text-center">
        <h1 className="font-display text-3xl text-forest-900">Nothing to check out</h1>
        <Link href="/shop" className="btn-primary mt-6">Back to the pantry</Link>
      </div>
    );

  const placeOrder = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ order: { id: string; orderNo: string; total: number; paymentExpiresAt: string }; payment: PaymentIntent }>("/orders", {
        method: "POST",
        // without this the order is created as a guest and never appears under Account → Orders
        token: accessToken,
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, qty: i.qty })),
          couponCode: couponCode || undefined,
          email,
          phone: shipping.phone,
          shippingAddress: { ...shipping, line2: shipping.line2 || undefined },
          billingAddress: billingSame ? undefined : { ...billing, line2: billing.line2 || undefined },
          giftNote: giftNote || undefined,
        }),
      });
      setOrder(r.order);
      setIntent(r.payment);
      setStep(2);
      trackEvent("begin_checkout", { orderNo: r.order.orderNo });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not place order");
    } finally {
      setBusy(false);
    }
  };

  // hands the gateway's callback payload to the API, which verifies it before marking the order paid
  const settle = async (gatewayPayload: Record<string, unknown>) => {
    if (!order) return;
    await api(`/orders/${order.id}/pay`, { method: "POST", body: JSON.stringify(gatewayPayload) });
    trackEvent("purchase", { orderNo: order.orderNo, total: order.total });
    clear();
    router.push(`/checkout/result?status=success&orderNo=${order.orderNo}&id=${order.id}`);
  };

  const markFailed = async () => {
    if (!order) return;
    await api(`/orders/${order.id}/fail`, { method: "POST", body: JSON.stringify({}) }).catch(() => undefined);
    setPayState("failed");
  };

  const payWithRazorpay = async () => {
    if (!order || !intent?.razorpayOrderId) return;
    setPayState("paying");
    setError(null);
    try {
      await loadRazorpay();
      const rzp = new (window as unknown as { Razorpay: new (o: unknown) => RazorpayInstance }).Razorpay({
        key: intent.keyId,
        order_id: intent.razorpayOrderId,
        amount: intent.amount,
        currency: intent.currency ?? "INR",
        name: "Madhura Naturals",
        description: `Order ${order.orderNo}`,
        prefill: { name: shipping.name, email, contact: shipping.phone },
        theme: { color: "#2f5d3a" },
        handler: (r: Record<string, unknown>) => {
          settle(r).catch((e) => {
            setPayState("failed");
            setError(e instanceof Error ? e.message : "Payment verification failed");
          });
        },
        // customer closed the widget — back to idle so they can retry within the window
        modal: { ondismiss: () => setPayState("idle") },
      });
      rzp.on("payment.failed", () => void markFailed());
      rzp.open();
    } catch (e) {
      setPayState("failed");
      setError(e instanceof Error ? e.message : "Could not open the payment gateway");
    }
  };

  // sandbox provider only — simulates the gateway response
  const pay = async (succeed: boolean) => {
    if (!order) return;
    setPayState("paying");
    try {
      if (succeed) await settle({});
      else await markFailed();
    } catch (e) {
      setPayState("failed");
      setError(e instanceof Error ? e.message : "Payment failed");
    }
  };

  return (
    <div className="container-page max-w-5xl pb-24 pt-28">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl font-medium text-forest-900">Checkout</h1>
        <p className="hidden items-center gap-1.5 text-xs font-medium text-forest-700 sm:flex"><Lock className="h-3.5 w-3.5" /> Secure checkout</p>
      </div>

      <ol className="mt-8 flex items-center gap-2" aria-label="Checkout steps">
        {steps.map((s, i) => (
          <li key={s} className="flex flex-1 items-center gap-2">
            <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold", i < step ? "bg-deep-700 text-ivory" : i === step ? "border-2 border-forest-700 text-forest-800" : "border border-sand-dark text-bark/40")}>
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </span>
            <span className={cn("text-sm font-medium", i === step ? "text-forest-900" : "text-bark/50")}>{s}</span>
            {i < steps.length - 1 && <span className="h-px flex-1 bg-sand-dark" />}
          </li>
        ))}
      </ol>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          {step === 0 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (canReview) setStep(1);
              }}
              className="card-organic space-y-6 p-7"
            >
              <div>
                <h2 className="flex items-center gap-2 font-display text-2xl text-forest-900"><MapPin className="h-5 w-5 text-gold-dark" /> Shipping address</h2>
                {saved.length > 1 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {saved.map((a) => {
                      const active = shipping.line1 === a.line1 && shipping.pincode === a.pincode;
                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => setShipping(toForm(a))}
                          aria-pressed={active}
                          className={cn(
                            "rounded-full border px-4 py-1.5 text-sm transition",
                            active ? "border-forest-700 bg-forest-700 text-cream" : "border-bark/20 text-bark hover:border-bark/40"
                          )}
                        >
                          {a.label}
                          {a.isDefault && " ·  default"}
                        </button>
                      );
                    })}
                  </div>
                )}
                <div className="mt-5 grid gap-4">
                  <div><label className="label-field" htmlFor="email">Email</label><input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" /></div>
                  <AddressFields value={shipping} onChange={setShipping} prefix="ship" />
                </div>
              </div>
              <label className="flex items-center gap-3 text-sm text-bark">
                <input type="checkbox" checked={billingSame} onChange={(e) => setBillingSame(e.target.checked)} className="h-4 w-4 accent-forest-700" />
                Billing address same as shipping
              </label>
              {!billingSame && (
                <div>
                  <h3 className="font-display text-xl text-forest-900">Billing address</h3>
                  <div className="mt-4"><AddressFields value={billing} onChange={setBilling} prefix="bill" /></div>
                </div>
              )}
              <div>
                <label className="label-field flex items-center gap-1.5" htmlFor="gift"><Gift className="h-3.5 w-3.5" /> Gift note (optional)</label>
                <textarea id="gift" value={giftNote} onChange={(e) => setGiftNote(e.target.value)} rows={2} maxLength={300} placeholder="We'll hand-write this on a card inside the box" className="input-field" />
              </div>
              <button type="submit" disabled={!canReview} className="btn-primary w-full">Review order</button>
            </form>
          )}

          {step === 1 && (
            <div className="card-organic space-y-6 p-7">
              <h2 className="font-display text-2xl text-forest-900">Review your order</h2>
              <ul className="divide-y divide-sand">
                {items.map((i) => (
                  <li key={i.productId} className="flex items-center gap-4 py-3">
                    {i.image && <img src={i.image} alt="" className="h-14 w-14 rounded-xl object-cover" />}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{i.name}</p>
                      <p className="text-xs text-bark/60">{i.unit} × {i.qty}</p>
                    </div>
                    <p className="text-sm font-semibold">{inr(i.price * i.qty)}</p>
                    {/* last chance to drop a line before the order exists — the quote
                        effect refetches off `items`, so the summary follows along */}
                    <button
                      onClick={() => remove(i.productId)}
                      aria-label={`Remove ${i.name} from this order`}
                      className="rounded-full p-2 text-bark/40 transition hover:bg-copper/10 hover:text-copper"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="rounded-2xl bg-cream p-4 text-sm">
                <p className="font-semibold text-forest-900">{shipping.name} · {shipping.phone}</p>
                <p className="mt-1 text-bark/70">{shipping.line1}{shipping.line2 ? `, ${shipping.line2}` : ""}, {shipping.city}, {shipping.state} — {shipping.pincode}</p>
                {giftNote && <p className="mt-2 text-xs italic text-bark/60">🎁 “{giftNote}”</p>}
              </div>
              {error && <p className="text-sm text-copper">{error}</p>}
              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="btn-secondary"><ChevronLeft className="h-4 w-4" /> Edit</button>
                <button onClick={placeOrder} disabled={busy} className="btn-primary flex-1">{busy ? "Placing order…" : "Place order & pay"}</button>
              </div>
            </div>
          )}

          {step === 2 && order && (
            <div className="card-organic space-y-6 p-7">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-display text-2xl text-forest-900"><CreditCard className="h-5 w-5 text-gold-dark" /> Payment</h2>
                {payState !== "expired" && <Countdown until={order.paymentExpiresAt} onExpire={() => setPayState("expired")} />}
              </div>
              <p className="text-sm text-bark/70">Order <b className="text-forest-900">{order.orderNo}</b> · Amount <b className="text-forest-900">{inr(order.total)}</b></p>
              {payState === "expired" ? (
                <div className="rounded-2xl bg-copper/10 p-5 text-sm text-copper">
                  The payment window has expired and your reservation was released.{" "}
                  <Link href="/cart" className="font-semibold underline">Return to cart</Link> to place the order again.
                </div>
              ) : (
                <>
                  {intent?.provider === "razorpay" ? (
                    <>
                      <div className="rounded-2xl border border-dashed border-sand-dark bg-cream p-5 text-sm text-bark/70">
                        Pay securely via <b>Razorpay</b> — UPI, cards, net banking and wallets.
                        {intent.keyId?.startsWith("rzp_test_") && (
                          <> This store is in <b>test mode</b>; use Razorpay&apos;s test instruments — no money moves.</>
                        )}
                      </div>
                      {payState === "failed" && (
                        <div className="rounded-2xl bg-copper/10 p-4 text-sm text-copper">Payment failed. You can retry until the timer runs out.</div>
                      )}
                      <button onClick={payWithRazorpay} disabled={payState === "paying"} className="btn-primary w-full">
                        {payState === "paying" ? "Opening gateway…" : `Pay ${inr(order.total)}`}
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="rounded-2xl border border-dashed border-sand-dark bg-cream p-5 text-sm text-bark/70">
                        This store is running the <b>sandbox payment gateway</b>. Use the buttons below to simulate the
                        gateway response.
                      </div>
                      {payState === "failed" && (
                        <div className="rounded-2xl bg-copper/10 p-4 text-sm text-copper">Payment failed. You can retry until the timer runs out.</div>
                      )}
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <button onClick={() => pay(true)} disabled={payState === "paying"} className="btn-primary flex-1">
                          {payState === "paying" ? "Processing…" : `Pay ${inr(order.total)}`}
                        </button>
                        <button onClick={() => pay(false)} disabled={payState === "paying"} className="btn-secondary">Simulate failure</button>
                      </div>
                    </>
                  )}
                </>
              )}
              <p className="flex items-center justify-center gap-1.5 text-xs text-bark/50"><ShieldCheck className="h-4 w-4 text-forest-600" /> 256-bit encrypted · PCI-DSS ready · No card details stored</p>
            </div>
          )}
        </div>

        <aside className="card-organic h-fit p-6 lg:sticky lg:top-24">
          <h2 className="font-display text-xl text-forest-900">Summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-bark/70">Items ({items.reduce((n, i) => n + i.qty, 0)})</dt><dd>{quote ? inr(quote.subtotal) : "—"}</dd></div>
            {quote && quote.discount > 0 && <div className="flex justify-between text-forest-700"><dt>Discount{quote.coupon ? ` (${quote.coupon.code})` : ""}</dt><dd>−{inr(quote.discount)}</dd></div>}
            <div className="flex justify-between"><dt className="text-bark/70">Shipping</dt><dd>{quote ? (quote.shippingFee === 0 ? "Free" : inr(quote.shippingFee)) : "enter pincode"}</dd></div>
            <div className="flex justify-between text-xs text-bark/50"><dt>GST (included)</dt><dd>{quote ? inr(quote.tax) : "—"}</dd></div>
            <div className="flex justify-between border-t border-sand pt-3 text-base font-bold text-forest-900"><dt>Total</dt><dd>{quote ? inr(quote.total) : "—"}</dd></div>
          </dl>
          {quote && shipping.pincode.length === 6 && (
            <p className="mt-3 rounded-xl bg-forest-50 px-3 py-2 text-xs text-forest-800">
              {quote.zone} · arrives in {quote.etaDays.min}–{quote.etaDays.max} days
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
