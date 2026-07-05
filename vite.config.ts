import type { Plugin } from "vite-plus";
import { defineConfig } from "vite-plus";
import { streamlabsTokens } from "./src/streamlabs-tokens";
import { build as viteBuild } from "vite-plus";
import { resolve } from "node:path";
import { unlinkSync } from "node:fs";
import { getProfileDir, listProfiles, setProjectRoot } from "./src/shared/profiles";
import { profileCssResolver } from "./src/plugins/profile-css";
import { profileHtmlPlugin } from "./src/plugins/profile-html";
import { profileSwitcherPlugin } from "./src/plugins/profile-api";
import { buildWidgetPlugin } from "./src/plugins/build-widget";
import { profileValidatePlugin } from "./src/plugins/profile-validate";

function multiProfileBuildPlugin(): Plugin {
  let isBuild = false;
  return {
    name: "multi-profile-build",
    configResolved(resolvedConfig) {
      isBuild = resolvedConfig.command === "build";
    },
    async writeBundle() {
      if (!isBuild || process.env.PROFILE) return;
      const profiles = listProfiles();
      if (profiles.length <= 1) return;

      const root = process.cwd();
      for (const profile of profiles) {
        process.env.PROFILE = profile;
        await viteBuild({ root });
      }
      delete process.env.PROFILE;

      // Clean up the initial build output (redundant after per-profile builds)
      for (const f of ["widget.html", "widget.css", "widget.js"]) {
        try {
          unlinkSync(resolve(root, "dist", f));
        } catch {
          /* ok */
        }
      }
    },
  };
}

export default defineConfig((_env) => {
  return {
    plugins: [
      {
        name: "init-project-root",
        configResolved(resolvedConfig) {
          setProjectRoot(resolvedConfig.root);
        },
      },
      profileValidatePlugin(),
      profileCssResolver(),
      buildWidgetPlugin(),
      profileHtmlPlugin(),
      profileSwitcherPlugin(),
      streamlabsTokens() as Plugin,
      multiProfileBuildPlugin(),
    ],
    build: {
      outDir: resolve(process.cwd(), "dist", process.env.PROFILE || "."),
      emptyOutDir: true,
      rollupOptions: {
        input: { index: resolve(getProfileDir(), "index.html") },
        output: {
          entryFileNames: "widget.js",
          assetFileNames: "assets/[name].[ext]",
        },
      },
    },
    staged: { "*": "vp check --fix" },
    fmt: { ignorePatterns: ["profiles/*/style.css"] },
    lint: {
      jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
      rules: { "vite-plus/prefer-vite-plus-imports": "error" },
      options: { typeAware: true, typeCheck: true },
    },
  };
});
