import type { Plugin } from "vite-plus";
import { defineConfig } from "vite-plus";
import { streamlabsTokens } from "./src/streamlabs-tokens";
import { readFileSync, writeFileSync, unlinkSync, existsSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Build-only plugin that:
 * 1. Strips mock feed import from main.ts so it'"'"'s excluded from the production bundle
 * 2. Strips index.html to body-only content and renames it to widget.html
 */
function buildWidgetPlugin(): Plugin {
  let isBuild = false;

  return {
    name: "build-widget",
    enforce: "pre",

    configResolved(resolvedConfig) {
      isBuild = resolvedConfig.command === "build";
    },

    /**
     * Strip mock feed import and DEV guard from the production bundle.
     * Token escaping/restoration is handled by streamlabsTokens plugin.
     */
    transform(code, id) {
      if (!isBuild) return null;

      if (id.endsWith("main.ts")) {
        code = code.replace(/import \{ startMockFeed \} from "\.\/mock-feed";\n/, "");
        code = code.replace(/void \(import\.meta\.env\.DEV && startMockFeed\(\)\);/, "");
        return { code, map: null };
      }

      return null;
    },

    closeBundle() {
      const dist = resolve(process.cwd(), "dist");
      const indexPath = resolve(dist, "index.html");
      if (!existsSync(indexPath)) return;

      let html = readFileSync(indexPath, "utf-8");

      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (!bodyMatch) return;

      let body = bodyMatch[1];

      // Strip <script type="module" ...> tags
      body = body.replace(/<script\s+type="module"[^>]*>[\s\S]*?<\/script>/gi, "");

      writeFileSync(resolve(dist, "widget.html"), body.trim());
      unlinkSync(indexPath);
    },
  };
}

export default defineConfig({
  plugins: [buildWidgetPlugin(), streamlabsTokens() as Plugin],
  build: {
    outDir: "dist",
    rollupOptions: {
      output: {
        entryFileNames: "widget.js",
        assetFileNames: "assets/[name].[ext]",
      },
    },
  },
  staged: {
    "*": "vp check --fix",
  },
  fmt: {
    ignorePatterns: ["src/style.css"],
  },
  lint: {
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    options: { typeAware: true, typeCheck: true },
  },
});
