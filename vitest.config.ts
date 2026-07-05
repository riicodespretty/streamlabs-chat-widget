import { defineConfig } from "vite-plus";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname!);
const activeProfile = existsSync(resolve(root, "profiles", ".active"))
  ? readFileSync(resolve(root, "profiles", ".active"), "utf-8").trim()
  : "baseline";
const profileDir = resolve(root, "profiles", activeProfile);
const styleCssPath = resolve(profileDir, "style.css");

export default defineConfig({
  plugins: [
    {
      name: "resolve-profile-css",
      resolveId(source, importer) {
        if (source === "./style.css" && importer) {
          return styleCssPath;
        }
        return null;
      },
    },
  ],
  test: {
    environment: "happy-dom",
    include: ["src/__tests__/**/*.test.ts"],
  },
});
