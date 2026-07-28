/* Self-check for Google sign-in — the boundary that decides whose Google account
   may claim an email here, plus the CSRF state that stops an attacker from
   landing a victim in the attacker's account. Run: npm run check:google */
import assert from "assert";
import type { AddressInfo } from "net";

const CLIENT_ID = "test-client.apps.googleusercontent.com";

// stub Google's tokeninfo endpoint: the credential string IS the response body
const stubGoogle = () => {
  globalThis.fetch = (async (url: string | URL | Request) => {
    const token = decodeURIComponent(String(url).split("id_token=")[1] ?? "");
    if (token === "expired") return new Response("", { status: 400 });
    return new Response(token, { status: 200 });
  }) as typeof fetch;
};

let verifyGoogle: (c: string) => Promise<{ sub: string; email: string; name?: string }>;
const rejects = async (credential: string, why: string) => assert.rejects(() => verifyGoogle(credential), why);

async function main() {
  // set before importing — env.ts snapshots process.env at module load
  process.env.GOOGLE_CLIENT_ID = CLIENT_ID;
  process.env.GOOGLE_CLIENT_SECRET = "test-secret";
  process.env.SITE_URL = "http://localhost:3100";
  const realFetch = globalThis.fetch;
  stubGoogle();
  ({ verifyGoogle } = await import("./auth"));

  const token = (o: Record<string, unknown>) =>
    JSON.stringify({ aud: CLIENT_ID, sub: "1234", email: "Person@Gmail.com", email_verified: "true", name: "A Person", ...o });

  const ok = await verifyGoogle(token({}));
  assert.equal(ok.email, "person@gmail.com", "email must be lowercased to match our unique index");
  assert.equal(ok.sub, "1234");

  await rejects(token({ aud: "someone-else.apps.googleusercontent.com" }), "token minted for another app must fail");
  await rejects(token({ email_verified: "false" }), "unverified email must fail — it is what lets us link accounts");
  await rejects(token({ email_verified: undefined }), "missing email_verified must fail");
  await rejects(token({ email: undefined }), "missing email must fail");
  await rejects(token({ sub: undefined }), "missing subject must fail");
  await rejects("expired", "token Google rejects must fail");

  /* ---- the OAuth redirect endpoints, driven through the real Express app ---- */
  globalThis.fetch = realFetch; // talk to our own server for real
  const { app } = await import("../app");
  const server = app.listen(0);
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/v1/auth/google`;
  const get = (p: string, headers: Record<string, string> = {}) =>
    fetch(`${base}${p}`, { redirect: "manual", headers });

  const start = await get("/start");
  assert.equal(start.status, 302, "start must redirect to Google");
  const consent = new URL(start.headers.get("location")!);
  assert.equal(consent.origin + consent.pathname, "https://accounts.google.com/o/oauth2/v2/auth");
  assert.equal(consent.searchParams.get("response_type"), "code", "authorization-code flow, not implicit");
  assert.equal(consent.searchParams.get("redirect_uri"), "http://localhost:3100/api/v1/auth/google/callback");
  const state = consent.searchParams.get("state")!;
  assert.ok(state && state.length >= 32, "state must be long and random");
  assert.match(start.headers.get("set-cookie") ?? "", /g_oauth_state=/, "state must be pinned to the browser");
  assert.match(start.headers.get("set-cookie") ?? "", /HttpOnly/, "state cookie must not be script-readable");

  // Every rejection redirects to /login?error=, so the message is what proves
  // *why* it was rejected — matching only on the redirect would pass even if the
  // callback refused everything unconditionally.
  const cookie = { cookie: `g_oauth_state=${state}` };
  const why = async (p: string, headers?: Record<string, string>) =>
    decodeURIComponent(new URL((await get(p, headers)).headers.get("location")!).searchParams.get("error") ?? "");

  // positive control: a well-formed callback gets past state and reaches Google's
  // token endpoint, stubbed here to fail — a distinct message from the CSRF ones
  const realFetchAgain = globalThis.fetch;
  globalThis.fetch = (async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) =>
    String(input instanceof Request ? input.url : input).startsWith("https://oauth2.googleapis.com/token")
      ? new Response("{}", { status: 400 })
      : realFetchAgain(input, init)) as typeof fetch;
  assert.match(await why(`/callback?code=good&state=${state}`, cookie), /failed/, "matching state must reach the token exchange");

  assert.match(await why(`/callback?code=stolen&state=${state}`), /expired/, "callback without the state cookie must be refused");
  assert.match(await why("/callback?code=stolen&state=attacker", cookie), /expired/, "mismatched state must be refused");
  assert.match(await why(`/callback?state=${state}`, cookie), /expired/, "callback without a code must be refused");
  assert.match(await why(`/callback?error=access_denied&state=${state}`, cookie), /declined/, "a declined consent must say so");
  server.close();

  // order mail lives in lib/mailer.check.ts — run `npm run check:mail`
  console.log("google oauth checks passed");
}

main();
