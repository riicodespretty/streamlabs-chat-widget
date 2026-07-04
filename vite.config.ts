import type { Plugin } from "vite-plus";
import { defineConfig } from "vite-plus";
import { streamlabsTokens } from "./src/streamlabs-tokens";

export default defineConfig({
  plugins: [streamlabsTokens() as Plugin],
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
