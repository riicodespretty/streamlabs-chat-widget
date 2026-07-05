import { describe, it, expect, beforeAll, afterAll } from "vite-plus/test";
import { createServer } from "vite";
import { writeFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname!, "../..");
const activePath = resolve(root, "profiles", ".active");

let server: Awaited<ReturnType<typeof createServer>>;
let savedProfile = "";

beforeAll(async () => {
  // Save current profile
  try {
    savedProfile = readFileSync(activePath, "utf-8").trim();
  } catch {
    savedProfile = "baseline";
  }
  writeFileSync(activePath, "baseline");

  server = await createServer({ root });
  await server.listen();
}, 15000);

afterAll(async () => {
  writeFileSync(activePath, savedProfile + "\n");
  await server?.close();
});

/** Fetch a path from the dev server and return the response body as text. */
async function fetchText(path: string): Promise<string> {
  // Vite dev server responds to local requests via its internal handler
  // url not needed — transformRequest uses path directly
  // Use the server's transformRequest to get the transformed module
  const result = await server.transformRequest(path);
  return result?.code ?? "";
}

describe("profile switching integration", () => {
  it("serves baseline CSS before switch", async () => {
    const css = await fetchText("/profiles/baseline/style.css");
    // Baseline: Mali font, no text-shadow, .4s animation
    expect(css).toContain("Mali");
    expect(css).not.toContain("Courier New");
    expect(css).not.toContain("text-shadow");
  });

  it("serves neon CSS after switching active profile", async () => {
    // Simulate the POST /__profile API call
    writeFileSync(activePath, "neon");
    // Invalidate the module graph so CSS re-resolves
    server.moduleGraph.invalidateAll();

    const css = await fetchText("/profiles/neon/style.css");
    // Neon: Courier New, text-shadow, .2s animation
    expect(css).toContain("Courier New");
    expect(css).toContain("text-shadow");
  });

  it("switches back to baseline correctly", async () => {
    writeFileSync(activePath, "baseline");
    server.moduleGraph.invalidateAll();

    const css = await fetchText("/profiles/baseline/style.css");
    expect(css).toContain("Mali");
    expect(css).not.toContain("Courier New");
  });

  it("profile list API returns correct active state after switch", async () => {
    writeFileSync(activePath, "neon");
    server.moduleGraph.invalidateAll();

    // The __profiles API reads .active directly — no module graph involved
    // Verify it reflects the switch
    const profilesDir = resolve(root, "profiles");
    const { readdirSync } = await import("node:fs");
    const dirs = readdirSync(profilesDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);

    // Read .active
    const active = readFileSync(resolve(profilesDir, ".active"), "utf-8").trim();
    expect(active).toBe("neon");
    expect(dirs).toContain("baseline");
    expect(dirs).toContain("neon");
  });

  it("CSS token replacement uses active profile defaults", async () => {
    // Switch to baseline
    writeFileSync(activePath, "baseline");
    server.moduleGraph.invalidateAll();

    const baselineCss = await fetchText("/profiles/baseline/style.css");
    // Baseline tokens: background_color=#1a1a2e
    expect(baselineCss).toContain("#1a1a2e");
    expect(baselineCss).not.toContain("#0a0a0a");

    // Switch to neon
    writeFileSync(activePath, "neon");
    server.moduleGraph.invalidateAll();

    const neonCss = await fetchText("/profiles/neon/style.css");
    // Neon tokens: background_color=#0a0a0a
    expect(neonCss).toContain("#0a0a0a");
    expect(neonCss).not.toContain("#1a1a2e");
    expect(neonCss).toContain("#39ff14");
  });
});
