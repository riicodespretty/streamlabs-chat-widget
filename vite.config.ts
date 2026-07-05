import type { Plugin } from "vite-plus";
import { defineConfig } from "vite-plus";
import { streamlabsTokens } from "./src/streamlabs-tokens";
import { resolve } from "node:path";
import {
  getProfileDir,
  getProfileOverride,
  setProfileOverride,
  setProjectRoot,
} from "./src/shared/profiles";
import { profileCssResolver } from "./src/plugins/profile-css";
import { profileHtmlPlugin } from "./src/plugins/profile-html";
import { profileSwitcherPlugin } from "./src/plugins/profile-api";
import { buildWidgetPlugin } from "./src/plugins/build-widget";
import { profileValidatePlugin } from "./src/plugins/profile-validate";

export default defineConfig((_env) => {
  return {
    plugins: [
      {
        name: "init-project-root",
        config() {
          const override = getProfileOverride();
          if (override) {
            setProfileOverride(null);
            return {
              build: {
                outDir: resolve(process.cwd(), "dist", override),
              },
            };
          }
        },
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
    ],
    build: {
      emptyOutDir: true,
      rollupOptions: {
        input: {
          index: resolve(getProfileDir(), "index.html"),
        },
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
