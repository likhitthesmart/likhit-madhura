/** 28 states + 8 union territories. Used for the address dropdowns so a state can
 *  never arrive as "AP", "Andra Pradsh" or a blank. */
export const IN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh",
  "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry",
  "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
  "West Bengal",
] as const;

/** Indian mobiles are 10 digits starting 6–9. */
export const MOBILE_RE = /^[6-9]\d{9}$/;

/** Keystroke-level cleanup for a phone input: digits only, capped at 10, with a
 *  pasted +91 or leading 0 dropped. Length-gated, because a bare "91…" is itself a
 *  valid 10-digit number and must not be truncated. */
export const toMobile = (raw: string) => {
  const d = raw.replace(/\D/g, "");
  const n = d.length === 12 && d.startsWith("91") ? d.slice(2) : d.length === 11 && d.startsWith("0") ? d.slice(1) : d;
  return n.slice(0, 10);
};
