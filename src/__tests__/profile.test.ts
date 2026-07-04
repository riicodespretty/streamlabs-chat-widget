import { describe, it, expect } from "vite-plus/test";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const profilesDir = resolve(root, "profiles");

describe("profile resolution", () => {
  it("profiles/.active exists and contains a valid non-empty profile name", () => {
    const activePath = resolve(profilesDir, ".active");
    expect(existsSync(activePath)).toBe(true);

    const activeProfile = readFileSync(activePath, "utf-8").trim();
    expect(activeProfile.length).toBeGreaterThan(0);
    // Must not contain path separators or be ".."
    expect(activeProfile).not.toContain("/");
    expect(activeProfile).not.toContain("\\");
    expect(activeProfile).not.toBe("..");
  });

  it("the active profile directory exists", () => {
    const activeProfile = readFileSync(resolve(profilesDir, ".active"), "utf-8").trim();
    const profileDir = resolve(profilesDir, activeProfile);
    expect(existsSync(profileDir)).toBe(true);
  });

  it("the active profile directory has required files: index.html, style.css, widget.config.json", () => {
    const activeProfile = readFileSync(resolve(profilesDir, ".active"), "utf-8").trim();
    const profileDir = resolve(profilesDir, activeProfile);

    expect(existsSync(resolve(profileDir, "index.html"))).toBe(true);
    expect(existsSync(resolve(profileDir, "style.css"))).toBe(true);
    expect(existsSync(resolve(profileDir, "widget.config.json"))).toBe(true);
  });

  it("profile index.html contains the expected widget template scripts", () => {
    const activeProfile = readFileSync(resolve(profilesDir, ".active"), "utf-8").trim();
    const html = readFileSync(resolve(profilesDir, activeProfile, "index.html"), "utf-8");

    expect(html).toContain('id="log"');
    expect(html).toContain('id="chatlist_item"');
    expect(html).toContain("{from}");
    expect(html).toContain("{message}");
    expect(html).toContain('id="badge_item"');
    expect(html).toContain('src="/src/main.ts"');
  });

  it("profile style.css contains the four token placeholders", () => {
    const activeProfile = readFileSync(resolve(profilesDir, ".active"), "utf-8").trim();
    const css = readFileSync(resolve(profilesDir, activeProfile, "style.css"), "utf-8");

    expect(css).toContain("{background_color}");
    expect(css).toContain("{font_size}");
    expect(css).toContain("{text_color}");
    expect(css).toContain("{message_hide_delay}");
  });

  it("profile widget.config.json contains the four field defaults", () => {
    const activeProfile = readFileSync(resolve(profilesDir, ".active"), "utf-8").trim();
    const raw = readFileSync(resolve(profilesDir, activeProfile, "widget.config.json"), "utf-8");
    const config = JSON.parse(raw) as Record<string, string>;

    expect(config.background_color).toBe("#1a1a2e");
    expect(config.font_size).toBe("16px");
    expect(config.text_color).toBe("#ffffff");
    expect(config.message_hide_delay).toBe("30s");
  });
});
