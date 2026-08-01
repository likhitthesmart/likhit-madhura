/* Vercel serverless entry. An Express app IS a (req, res) handler, so re-exporting
   the mounted app from src/app.ts is the entire adapter. src/index.ts stays the
   container entry — it calls listen(), which a serverless function must never do. */
import { app } from "../src/app";

export default app;

/* Razorpay signs the exact request bytes. Vercel's default parser drains the
   stream before express.json's verify hook can keep a copy (app.ts:29), which
   would leave rawBody undefined and fail every webhook (orders.ts:209).
   Hand the untouched stream to Express and let it parse. */
export const config = { api: { bodyParser: false } };
