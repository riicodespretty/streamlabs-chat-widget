import { describe, it, expect, beforeAll, afterAll } from "vite-plus/test";
import { createServer } from "vite";
import { writeFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname!, "../..");
const activePath = resolve(root, "profiles", ".active");

let server: Awaited<ReturnType<typeof createServer>>;
let savedProfile = "";
let baseUrl = "";

beforeAll(async () => {
  try {
    savedProfile = readFileSync(activePath, "utf-8").trim();
  } catch {
    savedProfile = "baseline";
  }
  writeFileSync(activePath, "baseline");

  server = await createServer({ root });
  await server.listen();
  baseUrl =
    (server.resolvedUrls?.local?.[0] as string | undefined) ??
    `http://localhost:${(server.httpServer?.address() as { port: number })?.port}`;
}, 15000);

afterAll(async () => {
  writeFileSync(activePath, savedProfile + "\n");
  await server?.close();
});

/** Transform a module through Vite's dev pipeline (exercises plugins, not HTTP). */
async function transformModule(path: string): Promise<string> {
  const result = await server.transformRequest(path);
  return result?.code ?? "";
}

/** Fetch a URL from the dev server via HTTP (exercises middleware + full pipeline). */
async function httpGet(path: string): Promise<string> {
  const r = await fetch(new URL(path, baseUrl).toString());
  return r.text();
}

describe("profile switching integration", () => {
  it("serves baseline CSS with token replacement via transform pipeline", async () => {
    const css = await transformModule("/profiles/baseline/style.css");
    // Source content
    expect(css).toContain("Mali");
    expect(css).not.toContain("Courier New");
    // Token replacement (streamlabs-tokens plugin)
    expect(css).toContain("#1a1a2e");
    expect(css).toContain("16px");
    expect(css).not.toContain("{background_color}");
  });

  it("serves neon CSS with token replacement after profile switch", async () => {
    writeFileSync(activePath, "neon");
    server.moduleGraph.invalidateAll();

    const css = await transformModule("/profiles/neon/style.css");
    expect(css).toContain("Courier New");
    expect(css).toContain("text-shadow");
    // Token replacement uses neon's config
    expect(css).toContain("#0a0a0a");
    expect(css).toContain("#39ff14");
    expect(css).not.toContain("#1a1a2e");
  });

  it("switches back to baseline correctly", async () => {
    writeFileSync(activePath, "baseline");
    server.moduleGraph.invalidateAll();

    const css = await transformModule("/profiles/baseline/style.css");
    expect(css).toContain("Mali");
    expect(css).not.toContain("Courier New");
    expect(css).toContain("#1a1a2e");
  });

  it("__profiles API lists profiles with active marker via HTTP", async () => {
    writeFileSync(activePath, "neon");

    const body = await httpGet("/__profiles");
    const profiles = JSON.parse(body) as { name: string; active: boolean }[];

    const baseline = profiles.find((p) => p.name === "baseline");
    const neon = profiles.find((p) => p.name === "neon");
    expect(baseline).toBeDefined();
    expect(neon).toBeDefined();
    expect(baseline!.active).toBe(false);
    expect(neon!.active).toBe(true);
  });

  it("CSS resolution via ./style.css import works", async () => {
    writeFileSync(activePath, "neon");
    server.moduleGraph.invalidateAll();

    // Transform main.ts — its ./style.css import resolves via profileCssResolver
    const js = await transformModule("/src/main.ts");
    // The transformed JS should contain the resolved CSS path
    expect(js).toContain("/profiles/neon/style.css");
  });

  it("HTML routing serves active profile index.html via HTTP middleware", async () => {
    writeFileSync(activePath, "neon");

    // The middleware rewrites "/" → "/profiles/<active>/index.html"
    const html = await httpGet("/");
    // Neon profile's template uses sl__chat__layout--neon
    expect(html).toContain("sl__chat__layout");
    expect(html).toContain("chatlist_item");
  });
});
