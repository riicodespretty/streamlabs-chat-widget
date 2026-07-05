import type { Plugin } from "vite";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { getProfileDir, getProfileName } from "../shared/profiles";

/**
 * Build-only validation plugin that verifies the active profile has all required files.
 * Fails with a clear error message during build instead of silently breaking.
 */
export function profileValidatePlugin(): Plugin {
  return {
    name: "profile-validate",
    enforce: "pre",

    buildStart() {
      const profileDir = getProfileDir();
      const requiredFiles = ["index.html", "style.css", "widget.config.json"];
      const missing: string[] = [];

      for (const file of requiredFiles) {
        if (!existsSync(resolve(profileDir, file))) {
          missing.push(file);
        }
      }

      if (missing.length > 0) {
        const msg =
          `Profile "${getProfileName()}" is missing required files:\n` +
          missing.map((f) => `  - ${f}`).join("\n") +
          `\n\nExpected at: ${profileDir}/`;
        this.error(msg);
      }
    },
  };
}
