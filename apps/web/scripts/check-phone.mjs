/* Address-form phone cleanup. The length-gated +91/0 stripping is the part worth
   pinning: a bare 10-digit number can itself start with "91", and naively removing
   that prefix silently mangles a valid number. Run: npm run check:phone */
import assert from "node:assert/strict";
import { MOBILE_RE, toMobile } from "../src/lib/india.ts";

for (const [raw, want] of [
  ["+91 98765 43210", "9876543210"], // pasted with country code
  ["09876543210", "9876543210"], // pasted with the STD leading zero
  ["9198765432", "9198765432"], // already 10 digits and starts 91 — must survive
  ["98765-43210", "9876543210"],
  ["9876543210999", "9876543210"], // capped, not silently accepted
  ["abcd", ""],
]) {
  assert.equal(toMobile(raw), want, `toMobile(${JSON.stringify(raw)})`);
}

for (const ok of ["9876543210", "6000000000", "9198765432"]) assert.ok(MOBILE_RE.test(ok), ok);
for (const bad of ["1234567890", "5876543210", "987654321", "98765432100", ""])
  assert.ok(!MOBILE_RE.test(bad), `${bad} must be rejected`);

console.log("phone checks passed");
