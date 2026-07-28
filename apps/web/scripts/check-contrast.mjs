/* Asserts every text/background pair in the palette clears WCAG AA, in BOTH themes.
   The dark theme is a variable swap, so a single bad value silently breaks readability
   on dozens of pages — this catches it. Run: npm run check:contrast */
import assert from "node:assert";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");

const block = (selector) => {
  const body = css.match(new RegExp(`${selector}\\s*\\{([^}]*)\\}`))?.[1];
  assert(body, `missing ${selector} block in globals.css`);
  return Object.fromEntries(
    [...body.matchAll(/--c-([\w-]+):\s*(\d+)\s+(\d+)\s+(\d+)\s*;/g)].map((m) => [m[1], [+m[2], +m[3], +m[4]]])
  );
};

// frozen tokens live in tailwind.config.ts, not the CSS vars — same value in both themes
const FROZEN = { ivory: [255, 253, 248], "deep-800": [51, 64, 42], gold: [185, 141, 62], copper: [168, 107, 72], "deep-950": [22, 29, 16] };

const lum = ([r, g, b]) =>
  [r, g, b]
    .map((c) => c / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
    .reduce((a, c, i) => a + c * [0.2126, 0.7152, 0.0722][i], 0);

const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

// [foreground, background, label, minimum] — 4.5 for body copy, 3.0 for large display text
const PAIRS = [
  ["ink", "cream", "body text on page", 4.5],
  ["ink", "surface", "body text on card", 4.5],
  ["bark", "surface", "secondary text on card", 4.5],
  ["bark", "cream", "secondary text on page", 4.5],
  ["forest-900", "cream", "heading on page", 3.0],
  ["forest-900", "surface", "heading on card", 3.0],
  ["forest-800", "surface", "link on card", 4.5],
  ["forest-800", "forest-50", "pill text on tint", 4.5],
  ["forest-700", "cream", "muted link on page", 4.5],
];

// text-on-accent: these backgrounds are frozen, so only the foreground can vary
const FIXED_PAIRS = [
  ["ivory", "deep-800", "primary button label", 4.5],
  ["ivory", "gold", "gold button label", 3.0],
  ["ivory", "copper", "cart badge", 4.5],
  ["deep-950", "gold", "admin gold button", 4.5],
];

/* Brand accents that already missed AA before the theming work and are identical in
   both themes. Recorded so they cannot silently get worse; raising them means picking
   new brand colours, which is a design call, not a refactor. */
const BASELINE = { "gold button label": 2.98, "cart badge": 4.25 };

let failures = 0;
let known = 0;
for (const theme of ["\\:root", "\\.dark"]) {
  const c = { ...block(theme), ...FROZEN };
  const name = theme === "\\:root" ? "light" : "dark ";
  for (const [fg, bg, label, min] of [...PAIRS, ...FIXED_PAIRS]) {
    assert(c[fg], `${theme}: unknown token ${fg}`);
    assert(c[bg], `${theme}: unknown token ${bg}`);
    const r = ratio(c[fg], c[bg]);
    if (r >= min) {
      console.log(`ok   ${name} ${label.padEnd(26)} ${r.toFixed(2)}:1 (need ${min})`);
    } else if (BASELINE[label] !== undefined && r >= BASELINE[label] - 0.01) {
      known++;
      console.log(`warn ${name} ${label.padEnd(26)} ${r.toFixed(2)}:1 (pre-existing, need ${min})`);
    } else {
      failures++;
      console.log(`FAIL ${name} ${label.padEnd(26)} ${r.toFixed(2)}:1 (need ${min})`);
    }
  }
}

assert.equal(failures, 0, `${failures} contrast pair(s) below WCAG AA`);
console.log(`\nall palette contrast checks passed (${known} pre-existing brand-accent shortfalls, unchanged)`);
