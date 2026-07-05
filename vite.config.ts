import type { Plugin } from "vite-plus";
import { defineConfig } from "vite-plus";
import { streamlabsTokens } from "./src/streamlabs-tokens";
import { readFileSync, writeFileSync, unlinkSync, existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = import.meta.dirname!;

export default defineConfig((_env) => {
  /** Read the active profile name from profiles/.active on each call. */
  function getProfileName(): string {
    return (
      process.env.PROFILE ||
      readFileSync(resolve(projectRoot, "profiles", ".active"), "utf-8").trim()
    );
  }

  function getProfileDir(): string {
    return resolve(projectRoot, "profiles", getProfileName());
  }
  const outDir = process.env.PROFILE
    ? resolve(projectRoot, "dist", getProfileName())
    : resolve(projectRoot, "dist");

  /** Resolve `./style.css` from main.ts to the active profile's style.css. */
  function profileCssResolver(): Plugin {
    return {
      name: "profile-css-resolver",
      enforce: "pre",
      resolveId(source, importer) {
        if (source === "./style.css" && importer) {
          return resolve(getProfileDir(), "style.css");
        }
        return null;
      },
    };
  }

  /**
   * During dev, serve the active profile's index.html when the root path is requested.
   * Vite's build pipeline already resolves it via rollupOptions.input.
   */
  function profileHtmlPlugin(): Plugin {
    return {
      name: "profile-html",
      configureServer(server) {
        // Watch profiles/.active for changes and trigger full page reload
        server.watcher.add(resolve(projectRoot, "profiles", ".active"));
        server.watcher.on("change", (path) => {
          if (path.endsWith("profiles/.active")) {
            server.hot.send({ type: "full-reload" });
          }
        });

        server.middlewares.use((req, _res, next) => {
          if (req.url === "/" || req.url === "/index.html") {
            req.url = `/profiles/${getProfileName()}/index.html`;
          }
          next();
        });
      },
    };
  }

  /**
   * Build-only plugin that:
   * 1. Strips mock feed import from main.ts so it's excluded from the production bundle
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
        // Vite preserves directory structure: profiles/<profile>/index.html
        const indexPath = resolve(outDir, "profiles", getProfileName(), "index.html");
        if (!existsSync(indexPath)) return;

        let html = readFileSync(indexPath, "utf-8");

        const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        if (!bodyMatch) return;

        let body = bodyMatch[1];

        // Strip <script type="module" ...> tags
        body = body.replace(/<script\s+type="module"[^>]*>[\s\S]*?<\/script>/gi, "");

        writeFileSync(resolve(outDir, "widget.html"), body.trim());
        unlinkSync(indexPath);

        // Clean up the empty profiles output dir
        try {
          const profilesOutputDir = resolve(outDir, "profiles");
          if (existsSync(profilesOutputDir)) {
            rmSync(profilesOutputDir, { recursive: true });
          }
        } catch {
          // Best-effort cleanup
        }
      },
    };
  }

  /**
   * Build-only validation plugin that verifies the active profile has all required files.
   * Fails with a clear error message during build instead of silently breaking.
   */
  function profileValidatePlugin(): Plugin {
    return {
      name: "profile-validate",
      enforce: "pre",

      buildStart() {
        const requiredFiles = ["index.html", "widget.config.json"];
        const missing: string[] = [];

        for (const file of requiredFiles) {
          if (!existsSync(resolve(getProfileDir(), file))) {
            missing.push(file);
          }
        }

        if (missing.length > 0) {
          const msg =
            `Profile "${getProfileName()}" is missing required files:\n` +
            missing.map((f) => `  - ${f}`).join("\n") +
            `\n\nExpected at: ${getProfileDir()}/`;
          this.error(msg);
        }
      },
    };
  }

  return {
    plugins: [
      profileValidatePlugin(),
      profileCssResolver(),
      buildWidgetPlugin(),
      profileHtmlPlugin(),
      streamlabsTokens() as Plugin,
    ],
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: {
        input: { index: resolve(getProfileDir(), "index.html") },
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
      ignorePatterns: ["profiles/*/style.css"],
    },
    lint: {
      jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
      rules: { "vite-plus/prefer-vite-plus-imports": "error" },
      options: { typeAware: true, typeCheck: true },
    },
  };
});
