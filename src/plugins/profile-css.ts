import type { Plugin } from "vite";
import { resolve } from "node:path";
import { getProfileDir } from "../shared/profiles";

/** Resolve `./style.css` from main.ts to the active profile's style.css. */
export function profileCssResolver(): Plugin {
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
