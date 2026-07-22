import { prisma } from "../prisma";
import { HttpError } from "../middleware/error";

export interface CartLine {
  productId: string;
  qty: number;
}

const GST_RATE = 0.05; // prices are GST-inclusive; tax shown as included component

export async function quoteCart(opts: {
  items: CartLine[];
  couponCode?: string | null;
  pincode?: string | null;
  userId?: string | null;
}) {
  if (!opts.items.length) throw new HttpError(400, "Cart is empty");
  const products = await prisma.product.findMany({
    where: { id: { in: opts.items.map((i) => i.productId) }, active: true },
  });
  const lines = opts.items.map((i) => {
    const p = products.find((x) => x.id === i.productId);
    if (!p) throw new HttpError(400, "A product in your cart is no longer available");
    if (p.stock < i.qty) throw new HttpError(400, `Only ${p.stock} left of ${p.name}`);
    const qty = Math.max(1, Math.min(20, i.qty));
    return {
      productId: p.id,
      slug: p.slug,
      name: p.name,
      unit: p.unit,
      image: p.images[0] ?? null,
      price: p.price,
      mrp: p.mrp,
      qty,
      lineTotal: p.price * qty,
      categoryId: p.categoryId,
    };
  });
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);

  // coupon — explicit code wins; otherwise best active auto-apply coupon
  let coupon = null as null | Awaited<ReturnType<typeof prisma.coupon.findFirst>>;
  let discount = 0;
  let couponError: string | null = null;
  const now = new Date();
  const validFor = async (c: NonNullable<typeof coupon>): Promise<string | null> => {
    if (!c.active) return "Coupon is inactive";
    if (c.startsAt && c.startsAt > now) return "Coupon is not active yet";
    if (c.endsAt && c.endsAt < now) return "Coupon has expired";
    if (c.usageLimit && c.usedCount >= c.usageLimit) return "Coupon usage limit reached";
    if (c.minCart && subtotal < c.minCart) return `Add items worth ${(c.minCart - subtotal) / 100} more to use this coupon`;
    if (c.userId && c.userId !== opts.userId) return "Coupon is not valid for this account";
    if (c.categoryId && !lines.some((l) => l.categoryId === c.categoryId)) return "Coupon does not apply to items in your cart";
    if (opts.userId && c.perUserLimit) {
      const used = await prisma.couponRedemption.count({ where: { couponId: c.id, userId: opts.userId } });
      if (used >= c.perUserLimit) return "You have already used this coupon";
    }
    return null;
  };
  const discountOf = (c: NonNullable<typeof coupon>) => {
    const base = c.categoryId
      ? lines.filter((l) => l.categoryId === c.categoryId).reduce((s, l) => s + l.lineTotal, 0)
      : subtotal;
    let d = c.type === "PERCENT" ? Math.floor((base * c.value) / 100) : c.value;
    if (c.maxDiscount) d = Math.min(d, c.maxDiscount);
    return Math.min(d, subtotal);
  };

  if (opts.couponCode) {
    coupon = await prisma.coupon.findUnique({ where: { code: opts.couponCode.toUpperCase() } });
    if (!coupon) couponError = "Invalid coupon code";
    else {
      couponError = await validFor(coupon);
      if (!couponError) discount = discountOf(coupon);
      else coupon = null;
    }
  } else {
    const autos = await prisma.coupon.findMany({ where: { autoApply: true, active: true } });
    for (const c of autos) {
      if ((await validFor(c)) === null) {
        const d = discountOf(c);
        if (d > discount) {
          discount = d;
          coupon = c;
        }
      }
    }
  }

  // shipping by zone (pincode prefix match), free above threshold
  let shippingFee = 0;
  let eta: { min: number; max: number } = { min: 3, max: 7 };
  let zoneName = "Rest of India";
  if (opts.pincode) {
    const zones = await prisma.shippingZone.findMany({ where: { active: true } });
    const zone = zones
      .filter((z) => z.pincodePrefixes.some((p) => opts.pincode!.startsWith(p)))
      .sort((a, b) => b.pincodePrefixes.join("").length - a.pincodePrefixes.join("").length)[0]
      ?? zones.find((z) => z.pincodePrefixes.length === 0);
    if (zone) {
      zoneName = zone.name;
      eta = { min: zone.etaDaysMin, max: zone.etaDaysMax };
      const afterDiscount = subtotal - discount;
      shippingFee = zone.freeAbove > 0 && afterDiscount >= zone.freeAbove ? 0 : zone.fee;
    }
  }

  const total = subtotal - discount + shippingFee;
  const tax = Math.round((total * GST_RATE) / (1 + GST_RATE)); // included GST component

  return {
    lines,
    subtotal,
    discount,
    coupon: coupon ? { code: coupon.code, description: coupon.description } : null,
    couponError,
    shippingFee,
    zone: zoneName,
    etaDays: eta,
    tax,
    taxIncluded: true,
    total,
  };
}
