import type { Plugin } from "vite";
import { readFileSync, writeFileSync, unlinkSync, existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { getProfileName } from "../shared/profiles";

/**
 * Build-only plugin that:
 * 1. Strips mock feed import from main.ts so it's excluded from the production bundle
 * 2. Strips index.html to body-only content and renames it to widget.html
 */
export function buildWidgetPlugin(): Plugin {
  let isBuild = false;
  let outDir = "";

  return {
    name: "build-widget",
    enforce: "pre",

    configResolved(resolvedConfig) {
      isBuild = resolvedConfig.command === "build";
      outDir = resolvedConfig.build.outDir;
    },

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
      const indexPath = resolve(outDir, "profiles", getProfileName(), "index.html");
      if (!existsSync(indexPath)) return;

      const html = readFileSync(indexPath, "utf-8");
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      const bodyHTML = bodyMatch
        ? bodyMatch[1]
            .replace(/<script[^>]*type="module"[^>]*src="\/src\/main\.ts"[^>]*><\/script>/g, "")
            .trim()
        : html;

      writeFileSync(resolve(outDir, "widget.html"), bodyHTML);

      try {
        const profilesOutputDir = resolve(outDir, "profiles");
        if (existsSync(profilesOutputDir)) {
          unlinkSync(indexPath);
          rmSync(profilesOutputDir, { recursive: true });
        }
      } catch {
        // ignore cleanup failures
      }
    },
  };
}
