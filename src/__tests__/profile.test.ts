import { describe, it, expect } from "vite-plus/test";
import { readFileSync, existsSync, writeFileSync, rmSync, statSync } from "node:fs";
import { execSync } from "node:child_process";
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

  it("switching profiles by writing to .active changes the resolved profile name", () => {
    const activePath = resolve(profilesDir, ".active");
    const original = readFileSync(activePath, "utf-8").trim();

    try {
      writeFileSync(activePath, "baseline\n");
      const updated = readFileSync(activePath, "utf-8").trim();
      expect(updated).toBe("baseline");
    } finally {
      writeFileSync(activePath, original + "\n");
      const restored = readFileSync(activePath, "utf-8").trim();
      expect(restored).toBe(original);
    }
  });
});

describe("profile scripts", () => {
  const scriptsDir = resolve(root, "scripts");

  it("scripts/switch-profile.sh exists and is executable", () => {
    const scriptPath = resolve(scriptsDir, "switch-profile.sh");
    expect(existsSync(scriptPath)).toBe(true);
    const mode = statSync(scriptPath).mode;
    expect(mode & 0o111).not.toBe(0);
  });

  it("scripts/list-profiles.sh exists and is executable", () => {
    const scriptPath = resolve(scriptsDir, "list-profiles.sh");
    expect(existsSync(scriptPath)).toBe(true);
    const mode = statSync(scriptPath).mode;
    expect(mode & 0o111).not.toBe(0);
  });

  it("switch-profile.sh baseline switches .active to baseline", () => {
    const activePath = resolve(profilesDir, ".active");
    const original = readFileSync(activePath, "utf-8").trim();

    try {
      execSync("sh scripts/switch-profile.sh baseline", {
        cwd: root,
        stdio: "pipe",
      });
      const updated = readFileSync(activePath, "utf-8").trim();
      expect(updated).toBe("baseline");
    } finally {
      writeFileSync(activePath, original + "\n");
    }
  });

  it("switch-profile.sh fails for non-existent profile", () => {
    expect(() => {
      execSync("sh scripts/switch-profile.sh __nonexistent__", {
        cwd: root,
        stdio: "pipe",
      });
    }).toThrow();
  });

  it("list-profiles.sh lists baseline with active marker", () => {
    const output = execSync("sh scripts/list-profiles.sh", {
      cwd: root,
      stdio: "pipe",
    }).toString();

    expect(output).toContain("baseline");
    expect(output).toContain("(active)");
  });
});

describe("neon profile", () => {
  it("profiles/neon/ exists with required files: index.html, style.css, widget.config.json", () => {
    const neonDir = resolve(profilesDir, "neon");
    expect(existsSync(neonDir)).toBe(true);
    expect(existsSync(resolve(neonDir, "index.html"))).toBe(true);
    expect(existsSync(resolve(neonDir, "style.css"))).toBe(true);
    expect(existsSync(resolve(neonDir, "widget.config.json"))).toBe(true);
  });

  it("neon profile widget.config.json has valid neon defaults", () => {
    const config = JSON.parse(
      readFileSync(resolve(profilesDir, "neon", "widget.config.json"), "utf-8"),
    ) as Record<string, string>;

    expect(config.background_color).toBe("#0a0a0a");
    expect(config.font_size).toBe("14px");
    expect(config.text_color).toBe("#39ff14");
    expect(config.message_hide_delay).toBe("15s");
  });

  it("neon profile index.html has neon-specific layout class", () => {
    const html = readFileSync(resolve(profilesDir, "neon", "index.html"), "utf-8");

    expect(html).toContain('id="log"');
    expect(html).toContain("sl__chat__layout--neon");
    expect(html).toContain('id="chatlist_item"');
    expect(html).toContain("{from}");
    expect(html).toContain("{message}");
    expect(html).toContain('id="badge_item"');
    expect(html).toContain('src="/src/main.ts"');
  });

  it("neon profile style.css has neon-specific styling", () => {
    const css = readFileSync(resolve(profilesDir, "neon", "style.css"), "utf-8");

    expect(css).toContain("{background_color}");
    expect(css).toContain("{font_size}");
    expect(css).toContain("{text_color}");
    expect(css).toContain("{message_hide_delay}");
    expect(css).toContain("Courier New");
    expect(css).toContain("text-shadow");
  });

  it("switching to neon profile and building produces dist output", () => {
    const activePath = resolve(profilesDir, ".active");
    const originalActive = readFileSync(activePath, "utf-8").trim();
    const distDir = resolve(root, "dist");

    // Clean dist from any prior build
    if (existsSync(distDir)) rmSync(distDir, { recursive: true });

    // Switch to neon profile
    writeFileSync(activePath, "neon\n");

    try {
      // Run build in a subprocess so vite reads .active fresh
      execSync("bun x vp build", { cwd: root, stdio: "pipe", timeout: 30000 });

      // Verify build output exists
      expect(existsSync(resolve(distDir, "widget.html"))).toBe(true);
      expect(existsSync(resolve(distDir, "widget.js"))).toBe(true);
      expect(existsSync(resolve(distDir, "widget.css"))).toBe(true);

      // Verify the built widget.css has neon-specific styling
      const builtCss = readFileSync(resolve(distDir, "widget.css"), "utf-8");
      expect(builtCss).toContain("Courier New");
      expect(builtCss).toContain("text-shadow");
    } finally {
      // Restore original active profile
      writeFileSync(activePath, originalActive + "\n");
      // Clean up dist
      if (existsSync(distDir)) rmSync(distDir, { recursive: true });
    }
  }, 60000);
});
