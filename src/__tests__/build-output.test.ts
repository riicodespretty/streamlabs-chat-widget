import { describe, it, expect, beforeAll } from "vite-plus/test";
import { build } from "vite";
import { readFileSync, existsSync, rmSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const distDir = resolve(root, "dist");

beforeAll(async () => {
  if (existsSync(distDir)) rmSync(distDir, { recursive: true });
  await build({ root });
}, 30000);

describe("build output", () => {
  it("produces widget.html, widget.css, widget.js in dist/", () => {
    expect(existsSync(resolve(distDir, "widget.html"))).toBe(true);
    expect(existsSync(resolve(distDir, "widget.css"))).toBe(true);
    expect(existsSync(resolve(distDir, "widget.js"))).toBe(true);
  });

  it("widget.html contains #log, #chatlist_item template with {from}, {color}, {message}, {messageId}, and #badge_item template", () => {
    const html = readFileSync(resolve(distDir, "widget.html"), "utf-8");
    expect(html).toContain('id="log"');
    expect(html).toContain('id="chatlist_item"');
    expect(html).toContain("{from}");
    expect(html).toContain("{color}");
    expect(html).toContain("{message}");
    expect(html).toContain("{messageId}");
    expect(html).toContain('id="badge_item"');
  });

  it('widget.html does not contain <html>, <head>, or <script type="module" tags', () => {
    const html = readFileSync(resolve(distDir, "widget.html"), "utf-8");
    expect(html).not.toContain("<html");
    expect(html).not.toContain("<head");
    expect(html).not.toContain('<script type="module"');
  });

  it("widget.css contains {background_color}, {font_size}, {text_color}, {message_hide_delay} tokens not replaced with defaults", () => {
    const css = readFileSync(resolve(distDir, "widget.css"), "utf-8");
    expect(css).toContain("{background_color}");
    expect(css).toContain("{font_size}");
    expect(css).toContain("{text_color}");
    expect(css).toContain("{message_hide_delay}");
    // Tokens MUST NOT be replaced with defaults from widget.config.json
    expect(css).not.toContain("#1a1a2e");
    expect(css).not.toContain("30s");
  });

  it("widget.js does not contain mock feed user names or mock-feed import", () => {
    const js = readFileSync(resolve(distDir, "widget.js"), "utf-8");
    expect(js).not.toContain("nightbot");
    expect(js).not.toContain("Nightbot");
    expect(js).not.toContain("chatterbox42");
    expect(js).not.toContain("lurker_pro");
    expect(js).not.toContain("mock-feed");
  });
});

describe("multi-profile build", () => {
  const profilesDir = resolve(root, "profiles");

  beforeAll(async () => {
    // Clean dist
    if (existsSync(distDir)) rmSync(distDir, { recursive: true });

    // Build each profile with PROFILE env var set
    const entries = readdirSync(profilesDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      process.env.PROFILE = entry.name;
      try {
        await build({ root });
      } finally {
        delete process.env.PROFILE;
      }
    }
  }, 60000);

  it("produces per-profile output dirs with widget.html, widget.css, widget.js", () => {
    const entries = readdirSync(profilesDir, { withFileTypes: true });
    let foundAtLeastOne = false;

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      foundAtLeastOne = true;
      const profileDist = resolve(distDir, entry.name);
      expect(existsSync(resolve(profileDist, "widget.html"))).toBe(true);
      expect(existsSync(resolve(profileDist, "widget.css"))).toBe(true);
      expect(existsSync(resolve(profileDist, "widget.js"))).toBe(true);
    }

    expect(foundAtLeastOne).toBe(true);
  });

  it("widget.js files are identical across profiles", () => {
    const entries = readdirSync(profilesDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .filter((n) => existsSync(resolve(distDir, n, "widget.js")));

    if (entries.length > 1) {
      const firstJs = readFileSync(resolve(distDir, entries[0], "widget.js"), "utf-8");
      for (let i = 1; i < entries.length; i++) {
        const otherJs = readFileSync(resolve(distDir, entries[i], "widget.js"), "utf-8");
        expect(otherJs).toBe(firstJs);
      }
    }
  });

  it("each profile widget.css preserves its own token placeholders", () => {
    const entries = readdirSync(profilesDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);

    for (const profile of entries) {
      const cssPath = resolve(distDir, profile, "widget.css");
      if (!existsSync(cssPath)) continue;
      const css = readFileSync(cssPath, "utf-8");
      expect(css).toContain("{background_color}");
      expect(css).toContain("{font_size}");
      expect(css).toContain("{text_color}");
      expect(css).toContain("{message_hide_delay}");
      // Tokens MUST NOT be replaced with defaults
      expect(css).not.toContain("#1a1a2e");
      expect(css).not.toContain("30s");
    }
  });
});
