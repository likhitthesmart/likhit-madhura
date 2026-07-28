/* OpenAPI 3.0 description of the whole /api/v1 surface, served as Swagger UI at /api/docs.
   Hand-written rather than generated: the zod schemas live inside route handlers, so
   deriving this would mean refactoring every route to export them. */
import { env } from "./env";

type Obj = Record<string, unknown>;

/* ------------------------------- small builders ------------------------------- */

const str = (extra: Obj = {}) => ({ type: "string", ...extra });
const int = (extra: Obj = {}) => ({ type: "integer", ...extra });
const bool = (extra: Obj = {}) => ({ type: "boolean", ...extra });
const arr = (items: Obj) => ({ type: "array", items });
const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });

const obj = (properties: Obj, required: string[] = []) => ({
  type: "object",
  properties,
  ...(required.length ? { required } : {}),
});

const json = (schema: Obj) => ({ content: { "application/json": { schema } } });
const body = (schema: Obj, required = true) => ({ required, ...json(schema) });
const ok = (description: string, schema: Obj) => ({ [200]: { description, ...json(schema) } });
const created = (description: string, schema: Obj) => ({ [201]: { description, ...json(schema) } });

const query = (name: string, schema: Obj, description?: string) => ({
  name, in: "query", schema, ...(description ? { description } : {}),
});
const path = (name: string, description?: string) => ({
  name, in: "path", required: true, schema: str(), ...(description ? { description } : {}),
});

const OK_TRUE = obj({ ok: bool() });

/* -------------------------------- shared models -------------------------------- */

const schemas: Obj = {
  Error: obj({ error: str({ description: "Human-readable message, safe to display" }) }, ["error"]),

  User: obj({
    id: str(), email: str({ format: "email" }), name: str(), phone: str({ nullable: true }),
    role: str({ enum: ["CUSTOMER", "STAFF", "ADMIN"] }), emailVerified: bool(),
  }),

  Session: obj({
    user: ref("User"),
    accessToken: str({ description: "JWT, valid 15 minutes. Send as `Authorization: Bearer <token>`." }),
  }),

  Category: obj({
    id: str(), slug: str(), name: str(), description: str({ nullable: true }),
    image: str({ nullable: true }), sortOrder: int(), active: bool(),
  }),

  Product: obj({
    id: str(), slug: str(), name: str(), tagline: str({ nullable: true }), description: str(),
    price: int({ description: "Paise. 52900 = ₹529.00" }),
    mrp: int({ description: "Paise, pre-discount" }),
    unit: str({ example: "500 ml" }), sku: str(), stock: int(), images: arr(str()),
    video: str({ nullable: true }), categoryId: str(), tags: arr(str()),
    bestSeller: bool(), featured: bool(), organicCertified: bool(), active: bool(),
    ratingAvg: { type: "number" }, ratingCount: int(), soldCount: int(),
    ingredients: arr(str()), benefits: arr(str()), uses: arr(str()),
    storage: str({ nullable: true }),
  }),

  Address: obj({
    label: str({ default: "Home" }), name: str(), phone: str(), line1: str(),
    line2: str({ nullable: true }), city: str(), state: str(),
    pincode: str({ pattern: "^\\d{6}$" }), isDefault: bool(),
  }, ["name", "phone", "line1", "city", "state", "pincode"]),

  CartLine: obj({ productId: str(), qty: int({ minimum: 1, maximum: 20 }) }, ["productId", "qty"]),

  CartQuote: obj({
    lines: arr(obj({ productId: str(), name: str(), image: str({ nullable: true }), unit: str(), price: int(), qty: int() })),
    subtotal: int(), discount: int(), shippingFee: int(), tax: int(), total: int(),
    coupon: obj({ code: str(), description: str({ nullable: true }) }, []),
    couponError: str({ nullable: true }),
    zone: str(), etaDays: obj({ min: int(), max: int() }),
  }),

  Order: obj({
    id: str(), orderNo: str({ example: "MN2607276957" }), email: str({ format: "email" }), phone: str(),
    subtotal: int(), discount: int(), shippingFee: int(), tax: int(), total: int(),
    couponCode: str({ nullable: true }),
    status: str({ enum: ["PENDING", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"] }),
    paymentStatus: str({ enum: ["UNPAID", "PAID", "FAILED", "EXPIRED", "REFUNDED"] }),
    paymentProvider: str({ nullable: true }), paymentRef: str({ nullable: true }),
    paymentExpiresAt: str({ format: "date-time", nullable: true, description: "Stock is released and the order cancelled after this instant" }),
    trackingNo: str({ nullable: true }), courier: str({ nullable: true }),
    timeline: arr(obj({ status: str(), note: str(), at: str({ format: "date-time" }) })),
    items: arr(obj({ productId: str(), name: str(), image: str({ nullable: true }), unit: str(), price: int(), qty: int() })),
    createdAt: str({ format: "date-time" }),
  }),

  PaymentIntent: obj({
    provider: str({ enum: ["mock", "razorpay"] }),
    keyId: str({ description: "Razorpay publishable key — pass to Razorpay Checkout" }),
    razorpayOrderId: str(), amount: int({ description: "Paise" }), currency: str({ example: "INR" }),
  }),

  Review: obj({
    id: str(), rating: int({ minimum: 1, maximum: 5 }), title: str({ nullable: true }), body: str(),
    photos: arr(str()), videoUrl: str({ nullable: true }), verified: bool({ description: "Reviewer actually bought the product" }),
    status: str({ enum: ["PENDING", "APPROVED", "REJECTED"] }), createdAt: str({ format: "date-time" }),
  }),

  BlogPost: obj({
    slug: str(), title: str(), excerpt: str(), content: str(), cover: str({ nullable: true }),
    category: str(), tags: arr(str()), authorName: str(), published: bool(),
    publishedAt: str({ format: "date-time", nullable: true }),
  }),

  Coupon: obj({
    id: str(), code: str(), description: str({ nullable: true }),
    type: str({ enum: ["PERCENT", "FLAT"] }),
    value: int({ description: "Percent points for PERCENT, paise for FLAT" }),
    minCart: int(), maxDiscount: int({ nullable: true }),
    startsAt: str({ format: "date-time", nullable: true }), endsAt: str({ format: "date-time", nullable: true }),
    usageLimit: int({ nullable: true }), perUserLimit: int(), usedCount: int(),
    autoApply: bool(), stackable: bool(), active: bool(),
  }),

  ShippingZone: obj({
    id: str(), name: str(), pincodePrefixes: arr(str()), fee: int(),
    freeAbove: int(), etaDaysMin: int(), etaDaysMax: int(), active: bool(),
  }),

  Faq: obj({ id: str(), question: str(), answer: str(), category: str(), sortOrder: int(), active: bool() }),

  Testimonial: obj({
    id: str(), name: str(), location: str({ nullable: true }), quote: str(),
    rating: int({ minimum: 1, maximum: 5 }), image: str({ nullable: true }), active: bool(),
  }),

  Enquiry: obj({
    id: str(), name: str(), email: str({ format: "email" }), phone: str({ nullable: true }),
    subject: str({ nullable: true }), message: str(),
    source: str({ enum: ["CONTACT", "CHAT", "SUPPORT"] }),
    status: str({ enum: ["NEW", "OPEN", "RESOLVED"] }), createdAt: str({ format: "date-time" }),
  }),
};

/* --------------------------------- write bodies -------------------------------- */

const productWrite = obj({
  slug: str({ pattern: "^[a-z0-9-]+$" }), name: str(), tagline: str({ nullable: true }),
  description: str({ minLength: 10 }), price: int({ minimum: 1 }), mrp: int({ minimum: 1 }),
  unit: str(), sku: str(), stock: int({ minimum: 0 }), lowStockAlert: int({ default: 10 }),
  images: arr(str()), video: str({ nullable: true }), categoryId: str(), tags: arr(str()),
  bestSeller: bool({ default: false }), featured: bool({ default: false }),
  organicCertified: bool({ default: true }), active: bool({ default: true }),
  nutrition: { type: "object", additionalProperties: str(), nullable: true },
  ingredients: arr(str()), benefits: arr(str()), storage: str({ nullable: true }), uses: arr(str()),
  faqs: arr(obj({ q: str(), a: str() })),
  seoTitle: str({ nullable: true }), seoDescription: str({ nullable: true }),
}, ["slug", "name", "description", "price", "mrp", "unit", "sku", "stock", "categoryId"]);

const categoryWrite = obj({
  slug: str({ pattern: "^[a-z0-9-]+$" }), name: str(), description: str(), image: str(),
  sortOrder: int({ default: 0 }), active: bool({ default: true }),
}, ["slug", "name"]);

const couponWrite = obj({
  code: str({ minLength: 3, maxLength: 30, description: "Upper-cased on save" }),
  description: str({ nullable: true }), type: str({ enum: ["PERCENT", "FLAT"] }),
  value: int({ minimum: 1 }), minCart: int({ default: 0 }), maxDiscount: int({ nullable: true }),
  categoryId: str({ nullable: true }), userId: str({ nullable: true, description: "Restricts the coupon to one customer" }),
  startsAt: str({ format: "date-time", nullable: true }), endsAt: str({ format: "date-time", nullable: true }),
  usageLimit: int({ nullable: true }), perUserLimit: int({ default: 1 }),
  autoApply: bool({ default: false }), stackable: bool({ default: false }), active: bool({ default: true }),
}, ["code", "type", "value"]);

const blogWrite = obj({
  slug: str({ pattern: "^[a-z0-9-]+$" }), title: str(), excerpt: str(), content: str(),
  cover: str({ nullable: true }), category: str(), tags: arr(str()),
  authorName: str({ default: "Madhura Naturals" }), published: bool({ default: true }),
  seoTitle: str({ nullable: true }), seoDescription: str({ nullable: true }),
}, ["slug", "title", "excerpt", "content", "category"]);

const faqWrite = obj({
  question: str({ minLength: 5 }), answer: str({ minLength: 5 }), category: str({ default: "general" }),
  sortOrder: int({ default: 0 }), active: bool({ default: true }),
}, ["question", "answer"]);

const testimonialWrite = obj({
  name: str({ minLength: 2 }), location: str({ nullable: true }), quote: str({ minLength: 5 }),
  rating: int({ minimum: 1, maximum: 5, default: 5 }), image: str({ nullable: true }), active: bool({ default: true }),
}, ["name", "quote"]);

const zoneWrite = obj({
  name: str({ minLength: 2 }), pincodePrefixes: arr(str({ pattern: "^\\d{1,6}$" })),
  fee: int({ minimum: 0 }), freeAbove: int({ minimum: 0, default: 0 }),
  etaDaysMin: int({ minimum: 0 }), etaDaysMax: int({ minimum: 0 }), active: bool({ default: true }),
}, ["name", "fee", "etaDaysMin", "etaDaysMax"]);

/** The admin resources below are all the same shape: list / create / update / delete.
 *  One builder keeps 40-odd near-identical operations honest and in sync. */
const crud = (opts: {
  base: string; tag: string; singular: string; plural: string;
  listKey: string; itemKey: string; model: Obj; write: Obj; listQuery?: Obj[];
}): Obj => ({
  [`/admin/${opts.base}`]: {
    get: {
      tags: [opts.tag], summary: `List ${opts.plural}`,
      ...(opts.listQuery ? { parameters: opts.listQuery } : {}),
      responses: ok(`All ${opts.plural}`, obj({ [opts.listKey]: arr(opts.model) })),
    },
    post: {
      tags: [opts.tag], summary: `Create a ${opts.singular}`,
      requestBody: body(opts.write),
      responses: { ...created("Created", obj({ [opts.itemKey]: opts.model })), 400: { description: "Validation failed", ...json(ref("Error")) } },
    },
  },
  [`/admin/${opts.base}/{id}`]: {
    parameters: [path("id")],
    patch: {
      tags: [opts.tag], summary: `Update a ${opts.singular}`,
      description: "Partial update — send only the fields you want to change.",
      requestBody: body({ allOf: [opts.write], required: [] }),
      responses: ok("Updated", obj({ [opts.itemKey]: opts.model })),
    },
    delete: {
      tags: [opts.tag], summary: `Delete a ${opts.singular}`,
      responses: ok("Deleted", OK_TRUE),
    },
  },
});

const PAGE = query("page", int({ minimum: 1, default: 1 }));
const SEARCH = query("q", str(), "Free-text search");

/* ----------------------------------- paths ------------------------------------ */

const paths: Obj = {
  "/health": {
    get: { tags: ["System"], summary: "Liveness probe", security: [], responses: ok("API is up", obj({ ok: bool() })) },
  },

  /* -------------------------------- auth -------------------------------- */
  "/auth/signup": {
    post: {
      tags: ["Auth"], summary: "Create an account", security: [],
      description: "Sets an httpOnly `refresh_token` cookie scoped to `/api/v1/auth` and returns a 15-minute access token.",
      requestBody: body(obj({
        name: str({ minLength: 2, maxLength: 80 }), email: str({ format: "email" }),
        password: str({ minLength: 8, maxLength: 100 }), phone: str({ minLength: 10, maxLength: 15 }),
      }, ["name", "email", "password"])),
      responses: { ...created("Account created", ref("Session")), 409: { description: "Email already registered", ...json(ref("Error")) } },
    },
  },
  "/auth/login": {
    post: {
      tags: ["Auth"], summary: "Sign in", security: [],
      requestBody: body(obj({
        email: str({ format: "email" }), password: str(),
        remember: bool({ description: "Extends the refresh cookie lifetime" }),
      }, ["email", "password"])),
      responses: {
        ...ok("Signed in", ref("Session")),
        401: { description: "Invalid email or password", ...json(ref("Error")) },
        403: { description: "Account blocked", ...json(ref("Error")) },
      },
    },
  },
  "/auth/google/start": {
    get: {
      tags: ["Auth"], summary: "Begin Google OAuth", security: [],
      description:
        "Browser entry point — link to it, do not fetch it. Sets a short-lived `g_oauth_state` " +
        "cookie and redirects to Google's consent screen.",
      responses: {
        302: { description: "Redirect to accounts.google.com" },
        503: { description: "Google sign-in is not configured on this deployment", ...json(ref("Error")) },
      },
    },
  },
  "/auth/google/callback": {
    get: {
      tags: ["Auth"], summary: "Google OAuth callback", security: [],
      description:
        "Registered as the Authorised redirect URI. Exchanges the code for an ID token, creates or links " +
        "the account by its Google-verified email, sets the `refresh_token` cookie and redirects into the app. " +
        "Failures redirect to `/login?error=…` rather than returning JSON.",
      parameters: [
        query("code", str(), "Single-use authorization code from Google"),
        query("state", str(), "Must match the `g_oauth_state` cookie"),
        query("error", str(), "Set instead of `code` when the user cancels"),
      ],
      responses: {
        302: { description: "Signed in — redirect to /account or /admin; on failure to /login?error=…" },
      },
    },
  },
  "/auth/refresh": {
    post: {
      tags: ["Auth"], summary: "Rotate the session", security: [],
      description: "Reads the `refresh_token` cookie, rotates it, and issues a fresh access token.",
      responses: { ...ok("New session", ref("Session")), 401: { description: "No session or expired", ...json(ref("Error")) } },
    },
  },
  "/auth/logout": {
    post: { tags: ["Auth"], summary: "Sign out", security: [], responses: ok("Refresh token revoked and cookie cleared", OK_TRUE) },
  },
  "/auth/verify-email": {
    post: {
      tags: ["Auth"], summary: "Confirm an email address", security: [],
      requestBody: body(obj({ token: str({ description: "From the verification email link" }) }, ["token"])),
      responses: { ...ok("Verified", OK_TRUE), 400: { description: "Invalid or already-used link", ...json(ref("Error")) } },
    },
  },
  "/auth/forgot-password": {
    post: {
      tags: ["Auth"], summary: "Request a password reset", security: [],
      description: "Always returns 200 — the response does not reveal whether the address is registered.",
      requestBody: body(obj({ email: str({ format: "email" }) }, ["email"])),
      responses: ok("Reset email sent if the account exists", OK_TRUE),
    },
  },
  "/auth/reset-password": {
    post: {
      tags: ["Auth"], summary: "Set a new password from a reset link", security: [],
      description: "Revokes every existing refresh token for the account.",
      requestBody: body(obj({ token: str(), password: str({ minLength: 8, maxLength: 100 }) }, ["token", "password"])),
      responses: { ...ok("Password changed", OK_TRUE), 400: { description: "Link invalid or expired", ...json(ref("Error")) } },
    },
  },
  "/auth/me": {
    get: { tags: ["Auth"], summary: "The signed-in user", responses: ok("Current user", obj({ user: ref("User") })) },
  },

  /* ------------------------------- catalog ------------------------------- */
  "/categories": {
    get: { tags: ["Catalog"], summary: "Active categories with product counts", security: [], responses: ok("Categories", obj({ categories: arr(ref("Category")) })) },
  },
  "/products": {
    get: {
      tags: ["Catalog"], summary: "Browse and filter products", security: [],
      parameters: [
        query("category", str(), "Category slug"),
        query("q", str({ maxLength: 100 }), "Matches name, tagline, description and tags"),
        query("minPrice", { type: "number" }, "Rupees, not paise"),
        query("maxPrice", { type: "number" }, "Rupees, not paise"),
        query("inStock", bool()), query("minRating", { type: "number" }),
        query("organic", bool()), query("bestSeller", bool()), query("discounted", bool()),
        query("sort", str({ enum: ["newest", "price_asc", "price_desc", "rating", "popular"], default: "popular" })),
        PAGE, query("limit", int({ minimum: 1, maximum: 48, default: 12 })),
      ],
      responses: ok("Matching products", obj({ items: arr(ref("Product")), total: int(), pages: int() })),
    },
  },
  "/products/featured": {
    get: { tags: ["Catalog"], summary: "Homepage picks", security: [], responses: ok("Featured and best-selling products", obj({ featured: arr(ref("Product")), bestSellers: arr(ref("Product")) })) },
  },
  "/products/{slug}": {
    get: {
      tags: ["Catalog"], summary: "One product with reviews and related items", security: [],
      parameters: [path("slug")],
      responses: {
        ...ok("Product detail", obj({ product: ref("Product"), related: arr(ref("Product")), reviews: arr(ref("Review")) })),
        404: { description: "No such product", ...json(ref("Error")) },
      },
    },
  },
  "/search/suggest": {
    get: {
      tags: ["Catalog"], summary: "Type-ahead suggestions", security: [],
      parameters: [query("q", str(), "At least 2 characters")],
      responses: ok("Suggestions plus trending terms", obj({ items: arr(ref("Product")), trending: arr(str()) })),
    },
  },

  /* -------------------------------- cart -------------------------------- */
  "/cart/quote": {
    post: {
      tags: ["Cart"], summary: "Price a cart", security: [],
      description: "Applies coupons, shipping zone and GST. Send the access token to resolve member-only coupons.",
      requestBody: body(obj({
        items: arr(ref("CartLine")), couponCode: str({ nullable: true }),
        pincode: str({ pattern: "^\\d{6}$", nullable: true }),
      }, ["items"])),
      responses: ok("Priced cart", ref("CartQuote")),
    },
  },

  /* ------------------------------- orders ------------------------------- */
  "/orders": {
    post: {
      tags: ["Orders"], summary: "Place an order", security: [],
      description:
        "Decrements stock atomically and opens a 15-minute payment window. Guests may order; send the access token to attach the order to the account.",
      requestBody: body(obj({
        items: arr(ref("CartLine")), couponCode: str({ nullable: true }),
        email: str({ format: "email" }), phone: str({ minLength: 10, maxLength: 15 }),
        shippingAddress: ref("Address"), billingAddress: ref("Address"),
        giftNote: str({ maxLength: 300 }),
      }, ["items", "email", "phone", "shippingAddress"])),
      responses: {
        ...created("Order created, awaiting payment", obj({
          order: obj({ id: str(), orderNo: str(), total: int(), paymentExpiresAt: str({ format: "date-time" }) }),
          payment: ref("PaymentIntent"),
        })),
        409: { description: "An item went out of stock", ...json(ref("Error")) },
      },
    },
  },
  "/orders/{id}/pay": {
    post: {
      tags: ["Orders"], summary: "Confirm payment", security: [],
      description:
        "Verifies the gateway callback before marking the order paid. For Razorpay send the three fields its handler returns; the mock provider accepts an empty body.",
      parameters: [path("id", "Order id, not order number")],
      requestBody: body(obj({ razorpay_order_id: str(), razorpay_payment_id: str(), razorpay_signature: str() }), false),
      responses: {
        ...ok("Paid", obj({ status: str({ example: "PAID" }), orderNo: str() })),
        400: { description: "Signature verification failed", ...json(ref("Error")) },
        410: { description: "Payment window expired; stock was released", ...json(ref("Error")) },
      },
    },
  },
  "/orders/{id}/fail": {
    post: {
      tags: ["Orders"], summary: "Record a failed payment attempt", security: [],
      parameters: [path("id")],
      responses: ok("Marked failed", obj({ status: str({ example: "FAILED" }), retryAllowed: bool({ description: "False once the window has closed" }) })),
    },
  },
  "/orders/{id}/status": {
    get: {
      tags: ["Orders"], summary: "Poll an order's payment state", security: [],
      parameters: [path("id")],
      responses: ok("Current state", obj({
        id: str(), orderNo: str(), status: str(), paymentStatus: str(),
        paymentExpiresAt: str({ format: "date-time", nullable: true }), total: int(),
      })),
    },
  },
  "/orders/razorpay/webhook": {
    post: {
      tags: ["Orders"], summary: "Razorpay webhook", security: [],
      description:
        "Authoritative payment confirmation — fires even if the customer closes the tab. Verifies `x-razorpay-signature` against the raw body using RAZORPAY_WEBHOOK_SECRET. Register it for the `payment.captured` event. Unknown orders return 200 so Razorpay stops retrying.",
      parameters: [{ name: "x-razorpay-signature", in: "header", required: true, schema: str() }],
      requestBody: body(obj({ event: str({ example: "payment.captured" }), payload: { type: "object" } })),
      responses: { ...ok("Processed or deliberately ignored", obj({ ok: bool(), ignored: str() })), 400: { description: "Bad signature", ...json(ref("Error")) } },
    },
  },
  "/orders/track": {
    get: {
      tags: ["Orders"], summary: "Track an order without signing in", security: [],
      parameters: [query("orderNo", str()), query("email", str({ format: "email" }))],
      responses: { ...ok("Order status and timeline", obj({ order: ref("Order") })), 404: { description: "No match for that order number and email", ...json(ref("Error")) } },
    },
  },
  "/orders/mine": {
    get: {
      tags: ["Orders"], summary: "Order history",
      description: "The customer's own orders plus guest orders placed with their account email.",
      responses: ok("Orders, newest first", obj({ orders: arr(ref("Order")) })),
    },
  },
  "/orders/mine/{id}": {
    get: { tags: ["Orders"], summary: "One of the customer's orders", parameters: [path("id")], responses: { ...ok("Order", obj({ order: ref("Order") })), 404: { description: "Not found or not yours", ...json(ref("Error")) } } },
  },

  /* ------------------------------- account ------------------------------ */
  "/account/profile": {
    patch: {
      tags: ["Account"], summary: "Update name or phone",
      requestBody: body(obj({ name: str({ minLength: 2, maxLength: 80 }), phone: str({ nullable: true }) })),
      responses: ok("Updated", obj({ user: ref("User") })),
    },
  },
  "/account/change-password": {
    post: {
      tags: ["Account"], summary: "Change password",
      requestBody: body(obj({ current: str(), password: str({ minLength: 8, maxLength: 100 }) }, ["current", "password"])),
      responses: { ...ok("Changed", OK_TRUE), 400: { description: "Current password incorrect", ...json(ref("Error")) } },
    },
  },
  "/account/addresses": {
    get: { tags: ["Account"], summary: "Saved addresses", responses: ok("Addresses, default first", obj({ addresses: arr(ref("Address")) })) },
    post: { tags: ["Account"], summary: "Add an address", requestBody: body(ref("Address")), responses: created("Added", obj({ address: ref("Address") })) },
  },
  "/account/addresses/{id}": {
    parameters: [path("id")],
    patch: { tags: ["Account"], summary: "Update an address", requestBody: body(ref("Address")), responses: ok("Updated", obj({ address: ref("Address") })) },
    delete: { tags: ["Account"], summary: "Remove an address", responses: ok("Removed", OK_TRUE) },
  },
  "/account/coupons": {
    get: { tags: ["Account"], summary: "Coupons available to this customer", responses: ok("Coupons", obj({ coupons: arr(ref("Coupon")) })) },
  },

  /* ---------------------------- reviews & wishlist ---------------------- */
  "/products/{slug}/reviews": {
    post: {
      tags: ["Reviews"], summary: "Write or replace a product review",
      description: "One review per customer per product; re-posting overwrites and returns it to PENDING. Marked `verified` when the customer has a paid order containing the product.",
      parameters: [path("slug")],
      requestBody: body(obj({
        rating: int({ minimum: 1, maximum: 5 }), title: str({ maxLength: 120 }),
        body: str({ minLength: 5, maxLength: 2000 }), photos: arr(str({ format: "uri" })), videoUrl: str({ format: "uri" }),
      }, ["rating", "body"])),
      responses: created("Submitted, awaiting moderation", obj({ review: ref("Review"), message: str() })),
    },
  },
  "/wishlist": {
    get: { tags: ["Reviews"], summary: "Wishlist contents", responses: ok("Items", obj({ items: arr(obj({ id: str(), product: ref("Product") })) })) },
  },
  "/wishlist/{productId}": {
    parameters: [path("productId")],
    post: { tags: ["Reviews"], summary: "Add to wishlist", description: "Idempotent — adding twice is not an error.", responses: created("Added", OK_TRUE) },
    delete: { tags: ["Reviews"], summary: "Remove from wishlist", responses: ok("Removed", OK_TRUE) },
  },

  /* -------------------------------- content ----------------------------- */
  "/content/home": {
    get: { tags: ["Content"], summary: "Homepage FAQs and testimonials", security: [], responses: ok("Content", obj({ faqs: arr(ref("Faq")), testimonials: arr(ref("Testimonial")) })) },
  },
  "/content/faqs": {
    get: { tags: ["Content"], summary: "All active FAQs", security: [], responses: ok("FAQs", obj({ faqs: arr(ref("Faq")) })) },
  },
  "/content/reviews": {
    get: { tags: ["Content"], summary: "Reviews page payload", security: [], responses: ok("Testimonials, approved reviews and rating aggregates", obj({ testimonials: arr(ref("Testimonial")), reviews: arr(ref("Review")), stats: { type: "object" } })) },
  },
  "/blog": {
    get: {
      tags: ["Content"], summary: "Published posts", security: [],
      parameters: [query("category", str()), PAGE],
      responses: ok("Posts, 9 per page", obj({ posts: arr(ref("BlogPost")), total: int(), pages: int() })),
    },
  },
  "/blog/{slug}": {
    get: { tags: ["Content"], summary: "One post with approved comments", security: [], parameters: [path("slug")], responses: { ...ok("Post", obj({ post: ref("BlogPost"), more: arr(ref("BlogPost")) })), 404: { description: "Not found or unpublished", ...json(ref("Error")) } } },
  },
  "/blog/{slug}/comments": {
    post: { tags: ["Content"], summary: "Comment on a post", security: [], description: "Held for moderation before appearing.", parameters: [path("slug")], requestBody: body(obj({ name: str(), email: str({ format: "email" }), body: str() }, ["name", "email", "body"])), responses: created("Awaiting approval", OK_TRUE) },
  },

  /* ------------------------------- contact ------------------------------ */
  "/enquiries": {
    post: {
      tags: ["Contact"], summary: "Submit the contact form", security: [],
      description: "Rate limited to 20 requests per 15 minutes per IP.",
      requestBody: body(obj({
        name: str({ minLength: 2, maxLength: 80 }), email: str({ format: "email" }),
        phone: str({ maxLength: 15 }), subject: str({ maxLength: 120 }),
        message: str({ minLength: 5, maxLength: 3000 }),
        source: str({ enum: ["CONTACT", "CHAT", "SUPPORT"], default: "CONTACT" }),
      }, ["name", "email", "message"])),
      responses: created("Received", obj({ ok: bool(), id: str() })),
    },
  },
  "/newsletter": {
    post: { tags: ["Contact"], summary: "Subscribe to the newsletter", security: [], requestBody: body(obj({ email: str({ format: "email" }) }, ["email"])), responses: created("Subscribed", obj({ ok: bool(), message: str() })) },
  },
  "/chat": {
    post: {
      tags: ["Contact"], summary: "Ask the store assistant", security: [],
      description: "Rule-based over live catalogue data — no LLM call.",
      requestBody: body(obj({ message: str({ minLength: 1, maxLength: 500 }) }, ["message"])),
      responses: ok("Reply", obj({ text: str(), suggestions: arr(str()), products: arr(ref("Product")) })),
    },
  },
  "/analytics/events": {
    post: {
      tags: ["Contact"], summary: "Record a front-end analytics event", security: [],
      requestBody: body(obj({
        sessionId: str({ maxLength: 64 }), type: str({ maxLength: 40, example: "pageview" }),
        path: str(), referrer: str(), device: str(), browser: str(), os: str(), screen: str(),
        meta: { type: "object" },
      }, ["sessionId", "type"])),
      responses: { 202: { description: "Accepted", ...json(OK_TRUE) } },
    },
  },

  /* -------------------------------- admin ------------------------------- */
  "/admin/dashboard": {
    get: { tags: ["Admin"], summary: "Dashboard metrics", description: "Revenue, order counts, visitors, low stock, top products, sales by day and traffic sources.", responses: ok("Metrics", { type: "object" }) },
  },
  "/admin/products": {
    get: {
      tags: ["Admin"], summary: "List products (including inactive)",
      parameters: [SEARCH, PAGE],
      responses: ok("Products", obj({ items: arr(ref("Product")), total: int(), pages: int() })),
    },
    post: { tags: ["Admin"], summary: "Create a product", requestBody: body(productWrite), responses: created("Created", obj({ product: ref("Product") })) },
  },
  "/admin/products/bulk": {
    post: {
      tags: ["Admin"], summary: "Bulk update products",
      requestBody: body(obj({ ids: arr(str()), data: { type: "object", description: "Fields to apply to every id" } }, ["ids", "data"])),
      responses: ok("Applied", obj({ count: int() })),
    },
  },
  "/admin/products/{id}": {
    parameters: [path("id")],
    patch: { tags: ["Admin"], summary: "Update a product", requestBody: body({ allOf: [productWrite], required: [] }), responses: ok("Updated", obj({ product: ref("Product") })) },
    delete: { tags: ["Admin"], summary: "Delete a product", responses: ok("Deleted", OK_TRUE) },
  },
  "/admin/inventory": {
    get: { tags: ["Admin"], summary: "Stock levels", responses: ok("Products with stock and low-stock thresholds", obj({ items: arr(ref("Product")) })) },
  },
  "/admin/inventory/logs": {
    get: {
      tags: ["Admin"], summary: "Stock movement history",
      parameters: [query("productId", str()), PAGE],
      responses: ok("Logs", obj({ logs: arr(obj({ id: str(), productId: str(), delta: int(), reason: str(), refOrder: str({ nullable: true }), createdAt: str({ format: "date-time" }) })), total: int() })),
    },
  },
  "/admin/inventory/{productId}/adjust": {
    post: {
      tags: ["Admin"], summary: "Adjust stock",
      parameters: [path("productId")],
      requestBody: body(obj({ delta: int({ description: "Negative to decrease" }), reason: str({ default: "adjustment" }) }, ["delta"])),
      responses: ok("Adjusted", obj({ product: ref("Product") })),
    },
  },
  "/admin/orders": {
    get: {
      tags: ["Admin"], summary: "List orders",
      parameters: [query("status", str()), SEARCH, PAGE],
      responses: ok("Orders", obj({ orders: arr(ref("Order")), total: int(), pages: int() })),
    },
  },
  "/admin/orders/export": {
    get: { tags: ["Admin"], summary: "Export orders as CSV", responses: { 200: { description: "CSV file", content: { "text/csv": { schema: str() } } } } },
  },
  "/admin/orders/{id}": {
    get: { tags: ["Admin"], summary: "One order in full", parameters: [path("id")], responses: ok("Order", obj({ order: ref("Order") })) },
  },
  "/admin/orders/{id}/status": {
    patch: {
      tags: ["Admin"], summary: "Move an order through fulfilment",
      description: "Appends to the order timeline and emails the customer on shipment.",
      parameters: [path("id")],
      requestBody: body(obj({
        status: str({ enum: ["PENDING", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"] }),
        note: str(), trackingNo: str(), courier: str(),
      }, ["status"])),
      responses: ok("Updated", obj({ order: ref("Order") })),
    },
  },
  "/admin/users": {
    get: { tags: ["Admin"], summary: "List customers and staff", parameters: [SEARCH, PAGE], responses: ok("Users", obj({ users: arr(ref("User")), total: int() })) },
  },
  "/admin/users/{id}": {
    get: {
      tags: ["Admin"], summary: "One customer with their full order history",
      description:
        "Orders are matched by account id OR by email, so guest checkouts made with the same address are included. " +
        "This can exceed the `_count.orders` shown in the list, which only counts orders linked to the account.",
      parameters: [path("id")],
      responses: {
        ...ok("Customer, orders and lifetime stats", obj({
          user: ref("User"),
          orders: arr(ref("Order")),
          stats: obj({ orders: int(), paidOrders: int(), lifetimeValue: int({ description: "Paise, paid orders only" }), lastOrderAt: str({ nullable: true }) }),
        })),
        404: { description: "Customer not found", ...json(ref("Error")) },
      },
    },
    patch: {
      tags: ["Admin"], summary: "Change a user's role or block them",
      parameters: [path("id")],
      requestBody: body(obj({ role: str({ enum: ["CUSTOMER", "STAFF", "ADMIN"] }), blocked: bool() })),
      responses: ok("Updated", obj({ user: ref("User") })),
    },
  },
  "/admin/coupons/{id}/analytics": {
    get: { tags: ["Admin"], summary: "Redemption history for a coupon", parameters: [path("id")], responses: ok("Redemptions and totals", obj({ redemptions: arr({ type: "object" }), totals: { type: "object" } })) },
  },
  "/admin/reviews": {
    get: {
      tags: ["Admin"], summary: "Moderation queue",
      parameters: [query("status", str({ enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING" }))],
      responses: ok("Reviews", obj({ reviews: arr(ref("Review")) })),
    },
  },
  "/admin/reviews/{id}": {
    patch: { tags: ["Admin"], summary: "Approve or reject a review", parameters: [path("id")], requestBody: body(obj({ status: str({ enum: ["APPROVED", "REJECTED"] }) }, ["status"])), responses: ok("Moderated", obj({ review: ref("Review") })) },
  },
  "/admin/blog-comments": {
    get: { tags: ["Admin"], summary: "Blog comment queue", responses: ok("Comments", obj({ comments: arr({ type: "object" }) })) },
  },
  "/admin/blog-comments/{id}": {
    patch: { tags: ["Admin"], summary: "Approve or hide a comment", parameters: [path("id")], requestBody: body(obj({ approved: bool() }, ["approved"])), responses: ok("Updated", obj({ comment: { type: "object" } })) },
  },
  "/admin/enquiries": {
    get: {
      tags: ["Admin"], summary: "Contact-form enquiries",
      parameters: [query("source", str({ enum: ["CONTACT", "CHAT", "SUPPORT"] })), query("status", str({ enum: ["NEW", "OPEN", "RESOLVED"] }))],
      responses: ok("Enquiries", obj({ enquiries: arr(ref("Enquiry")) })),
    },
  },
  "/admin/enquiries/{id}": {
    patch: { tags: ["Admin"], summary: "Update enquiry status", parameters: [path("id")], requestBody: body(obj({ status: str({ enum: ["NEW", "OPEN", "RESOLVED"] }) }, ["status"])), responses: ok("Updated", obj({ enquiry: ref("Enquiry") })) },
  },
  "/admin/subscribers": {
    get: { tags: ["Admin"], summary: "Newsletter subscribers", responses: ok("Subscribers", obj({ subscribers: arr(obj({ email: str(), active: bool(), createdAt: str({ format: "date-time" }) })) })) },
  },
  "/admin/subscribers/export": {
    get: { tags: ["Admin"], summary: "Export subscribers as CSV", responses: { 200: { description: "CSV file", content: { "text/csv": { schema: str() } } } } },
  },
  "/admin/analytics": {
    get: { tags: ["Admin"], summary: "Traffic and conversion report", responses: ok("Report", { type: "object" }) },
  },
  "/admin/settings": {
    get: { tags: ["Admin"], summary: "Store settings", responses: ok("Settings", obj({ settings: { type: "object" } })) },
  },
  "/admin/settings/{key}": {
    put: { tags: ["Admin"], summary: "Set one setting", parameters: [path("key")], requestBody: body(obj({ value: {} })), responses: ok("Saved", obj({ setting: { type: "object" } })) },
  },
  "/admin/audit-logs": {
    get: { tags: ["Admin"], summary: "Who changed what", parameters: [PAGE], responses: ok("Audit trail", obj({ logs: arr({ type: "object" }), total: int() })) },
  },

  ...crud({ base: "categories", tag: "Admin", singular: "category", plural: "categories", listKey: "categories", itemKey: "category", model: ref("Category"), write: categoryWrite }),
  ...crud({ base: "coupons", tag: "Admin", singular: "coupon", plural: "coupons", listKey: "coupons", itemKey: "coupon", model: ref("Coupon"), write: couponWrite }),
  ...crud({ base: "blog", tag: "Admin", singular: "post", plural: "blog posts", listKey: "posts", itemKey: "post", model: ref("BlogPost"), write: blogWrite }),
  ...crud({ base: "faqs", tag: "Admin", singular: "FAQ", plural: "FAQs", listKey: "faqs", itemKey: "faq", model: ref("Faq"), write: faqWrite }),
  ...crud({ base: "testimonials", tag: "Admin", singular: "testimonial", plural: "testimonials", listKey: "testimonials", itemKey: "testimonial", model: ref("Testimonial"), write: testimonialWrite }),
  ...crud({ base: "shipping-zones", tag: "Admin", singular: "shipping zone", plural: "shipping zones", listKey: "zones", itemKey: "zone", model: ref("ShippingZone"), write: zoneWrite }),
};

export const openapiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Madhura Naturals API",
    version: "1.0.0",
    description: [
      "REST API behind the Madhura Naturals storefront and admin panel.",
      "",
      "**Money is always in paise** — `52900` means ₹529.00.",
      "",
      "**Authentication.** `POST /auth/login` returns a 15-minute `accessToken`; send it as",
      "`Authorization: Bearer <token>` (use the *Authorize* button above). It also sets an",
      "httpOnly `refresh_token` cookie scoped to `/api/v1/auth` — `POST /auth/refresh` rotates it",
      "for a new access token. Endpoints under `/admin` additionally require the ADMIN or STAFF role.",
      "",
      "**Rate limits.** 300 requests/minute per IP globally, 30 per 15 minutes on `/auth`,",
      "and 20 per 15 minutes on the contact endpoints.",
    ].join("\n"),
  },
  // relative first: "Try it out" then hits the API that served this page, same-origin
  servers: [{ url: "/api/v1", description: "This server" }, { url: `${env.siteUrl.replace(/\/$/, "")}/api/v1`, description: "Through the web app" }],
  tags: [
    { name: "System", description: "Health and diagnostics" },
    { name: "Auth", description: "Signup, sign-in, sessions and password reset" },
    { name: "Catalog", description: "Public product browsing" },
    { name: "Cart", description: "Pricing before checkout" },
    { name: "Orders", description: "Checkout, payment and tracking" },
    { name: "Account", description: "The signed-in customer's own data" },
    { name: "Reviews", description: "Product reviews and wishlist" },
    { name: "Content", description: "Blog, FAQs and testimonials" },
    { name: "Contact", description: "Enquiries, newsletter, chatbot and analytics" },
    { name: "Admin", description: "Staff-only. Requires the ADMIN or STAFF role." },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT", description: "Access token from /auth/login" },
    },
    schemas,
  },
  // authenticated by default; public operations opt out with `security: []`
  security: [{ bearerAuth: [] }],
  paths,
};
