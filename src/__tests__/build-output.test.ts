import { describe, it, expect, beforeAll } from "vite-plus/test";
import { build } from "vite";
import { readFileSync, existsSync, rmSync } from "node:fs";
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

  it("widget.html contains #log and #chatlist_item template with {from}, {color}, {message}, {messageId} tokens intact", () => {
    const html = readFileSync(resolve(distDir, "widget.html"), "utf-8");
    expect(html).toContain('id="log"');
    expect(html).toContain('id="chatlist_item"');
    expect(html).toContain("{from}");
    expect(html).toContain("{color}");
    expect(html).toContain("{message}");
    expect(html).toContain("{messageId}");
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
