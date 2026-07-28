/* Guards the spec against the two ways a hand-written OpenAPI doc rots:
   a dangling $ref, and drifting out of sync with the routes it claims to describe.
   Run: npm run check:openapi */
import assert from "assert";

async function main() {
  const { openapiDocument: doc } = await import("./openapi");
  const { app } = await import("./app");

  /* ---- every $ref resolves ---- */
  const refs = new Set<string>();
  const walk = (node: unknown) => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (node && typeof node === "object") {
      for (const [k, val] of Object.entries(node)) {
        if (k === "$ref" && typeof val === "string") refs.add(val);
        else walk(val);
      }
    }
  };
  walk(doc.paths);
  const defined = new Set(Object.keys(doc.components.schemas).map((n) => `#/components/schemas/${n}`));
  const dangling = [...refs].filter((r) => !defined.has(r));
  assert.deepEqual(dangling, [], `unresolved $ref(s): ${dangling.join(", ")}`);

  /* ---- documented paths exist on the router, and vice versa ---- */
  const documented = new Set<string>();
  for (const [p, item] of Object.entries(doc.paths as Record<string, Record<string, unknown>>))
    for (const method of ["get", "post", "put", "patch", "delete"])
      if (item[method]) documented.add(`${method.toUpperCase()} ${p}`);

  // express path -> openapi path: /orders/:id/pay  ->  /orders/{id}/pay
  const toOpenapi = (p: string) => p.replace(/:([A-Za-z0-9_]+)/g, "{$1}").replace(/\/$/, "") || "/";

  const actual = new Set<string>();
  type Layer = { route?: { path: string; methods: Record<string, boolean> }; handle?: { stack?: Layer[] }; regexp?: RegExp; path?: string };
  const collect = (stack: Layer[], prefix: string) => {
    for (const layer of stack) {
      if (layer.route) {
        for (const m of Object.keys(layer.route.methods))
          actual.add(`${m.toUpperCase()} ${toOpenapi(prefix + layer.route.path)}`);
      } else if (layer.handle?.stack) {
        // recover the mount path from the layer's regexp (express does not expose it directly)
        const src = layer.regexp?.source ?? "";
        const mount = src === "^\\/?(?=\\/|$)" ? "" : src.replace(/^\^\\\//, "/").replace(/\\\/\?\(\?=\\\/\|\$\)\$?$/, "").replace(/\\\//g, "/");
        collect(layer.handle.stack, prefix + (mount.startsWith("/") ? mount : ""));
      }
    }
  };
  const router = (app as unknown as { _router: { stack: Layer[] } })._router;
  collect(router.stack, "");

  const apiRoutes = [...actual].filter((r) => r.includes("/api/v1")).map((r) => r.replace(" /api/v1", " "));
  const undocumented = apiRoutes.filter((r) => !documented.has(r)).sort();
  const phantom = [...documented].filter((r) => !apiRoutes.includes(r)).sort();

  for (const r of undocumented) console.log(`undocumented: ${r}`);
  for (const r of phantom) console.log(`documented but not routed: ${r}`);

  assert.equal(undocumented.length, 0, `${undocumented.length} route(s) missing from the spec`);
  assert.equal(phantom.length, 0, `${phantom.length} documented path(s) do not exist`);

  console.log(`openapi ok — ${documented.size} operations, all routes covered, all $refs resolve`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
