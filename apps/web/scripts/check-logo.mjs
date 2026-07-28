/* Proves the inlined brand mark still matches the supplied artwork exactly.
   LotusMark carries the path data inline (so it can take `currentColor`); this
   asserts nobody has hand-edited that geometry. Run: npm run check:logo */
import assert from "node:assert";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const norm = (d) => d.replace(/\s+/g, " ").trim();
const dAttrs = (s) => [...s.matchAll(/\sd="\s*([^"]*)"/g)].map((m) => norm(m[1]));

const source = dAttrs(read("../brand/mark-source.svg"));
const component = [...read("../src/components/ui/logo.tsx").matchAll(/"(M[0-9][^"]*)"/g)].map((m) => norm(m[1]));
const favicon = dAttrs(read("../src/app/icon.svg"));

assert.equal(source.length, 5, "source artwork should have 5 paths");
assert.deepEqual(component, source, "logo.tsx path data has drifted from brand/mark-source.svg");
assert.deepEqual(favicon, source, "icon.svg path data has drifted from brand/mark-source.svg");

const coords = (a) => a.flatMap((d) => d.match(/-?\d+\.?\d*/g).map(Number));
assert.deepEqual(coords(component), coords(source));
console.log(`logo ok — ${source.length} paths, ${coords(source).length} coordinates identical to brand/mark-source.svg`);
