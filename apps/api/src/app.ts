/* Wires the Express app. Kept separate from index.ts so tooling can import the
   fully-mounted app without opening a port. */
import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import { env } from "./env";
import { openapiDocument } from "./openapi";
import { attachAuth } from "./middleware/auth";
import { errorHandler } from "./middleware/error";
import { authRouter } from "./routes/auth";
import { catalogRouter } from "./routes/catalog";
import { reviewsRouter, wishlistRouter } from "./routes/reviews";
import { accountRouter } from "./routes/account";
import { cartRouter, ordersRouter } from "./routes/orders";
import { blogRouter } from "./routes/blog";
import { contactRouter } from "./routes/contact";
import { analyticsRouter } from "./routes/analytics";
import { contentRouter } from "./routes/content";
import { adminRouter } from "./routes/admin";

export const app = express();
app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({ origin: env.siteUrl, credentials: true }));
// rawBody is kept for gateway webhook signature checks (Razorpay signs the exact bytes)
app.use(express.json({ limit: "2mb", verify: (req, _res, buf) => { (req as { rawBody?: Buffer }).rawBody = buf; } }));
app.use(cookieParser());
app.use(rateLimit({ windowMs: 60_000, limit: 300, standardHeaders: true }));
app.use(attachAuth);

// Swagger UI. Its bundle needs inline script/style, which the global helmet CSP blocks,
// so this route gets a relaxed policy of its own.
app.use(
  "/api/docs",
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "script-src": ["'self'", "'unsafe-inline'"],
        "style-src": ["'self'", "'unsafe-inline'", "https:"],
        "img-src": ["'self'", "data:", "https:"],
      },
    },
  }),
  swaggerUi.serve,
  swaggerUi.setup(openapiDocument, {
    customSiteTitle: "Madhura Naturals API",
    swaggerOptions: { persistAuthorization: true, docExpansion: "none", tagsSorter: "alpha" },
  })
);
app.get("/api/docs.json", (_req, res) => res.json(openapiDocument));

app.get("/api/v1/health", (_req, res) => res.json({ ok: true }));
app.use("/api/v1/auth", authRouter);
app.use("/api/v1", catalogRouter); // /categories /products /search
app.use("/api/v1", reviewsRouter); // /products/:slug/reviews
app.use("/api/v1/wishlist", wishlistRouter);
app.use("/api/v1/account", accountRouter);
app.use("/api/v1/cart", cartRouter);
app.use("/api/v1/orders", ordersRouter);
app.use("/api/v1/blog", blogRouter);
app.use("/api/v1", contactRouter); // /enquiries /newsletter /chat
app.use("/api/v1/analytics", analyticsRouter);
app.use("/api/v1/content", contentRouter);
app.use("/api/v1/admin", adminRouter);

app.use(errorHandler);
