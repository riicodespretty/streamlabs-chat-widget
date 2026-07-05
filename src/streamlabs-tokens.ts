import type { Plugin } from "vite";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getProfileName } from "./shared/profiles";

interface FieldSettings {
  background_color: string;
  font_size: string;
  text_color: string;
  message_hide_delay: string;
}

const FIELD_TOKENS = ["background_color", "font_size", "text_color", "message_hide_delay"] as const;

/** Escape a {token} placeholder so PostCSS doesn't choke on it during build. */
function escapeTokens(code: string): string {
  let result = code;
  for (const token of FIELD_TOKENS) {
    result = result.replace(new RegExp(`\\{${token}\\}`, "g"), `__TOKEN_${token}__`);
  }
  return result;
}

/** Restore escaped __TOKEN_x__ back to {x} after PostCSS bundling. */
function restoreTokens(code: string): string {
  let result = code;
  for (const token of FIELD_TOKENS) {
    result = result.replace(new RegExp(`__TOKEN_${token}__`, "g"), `{${token}}`);
  }
  return result;
}

/** Replace {token} with defaults from widget.config.json (dev mode only). */
export function replaceTokens(code: string, config: FieldSettings): string {
  let result = code;
  for (const token of FIELD_TOKENS) {
    result = result.replace(new RegExp(`\\{${token}\\}`, "g"), config[token]);
  }
  return result;
}

/** Read the active profile's widget.config.json. Returns null on failure. */
function readActiveConfig(root: string): FieldSettings | null {
  try {
    const activeProfile = getProfileName();
    const configPath = resolve(root, "profiles", activeProfile, "widget.config.json");
    return JSON.parse(readFileSync(configPath, "utf-8")) as FieldSettings;
  } catch {
    return null;
  }
}

export function streamlabsTokens(): Plugin {
  let root = "";
  let isDev = false;
  let isBuild = false;

  return {
    name: "streamlabs-tokens",
    enforce: "pre",

    configResolved(resolvedConfig) {
      root = resolvedConfig.root;
      isDev = resolvedConfig.command === "serve";
      isBuild = resolvedConfig.command === "build";
    },

    transform(code, id) {
      // Re-read config on each transform so profile switches take effect without restart
      const config = readActiveConfig(root);

      if (isDev && config && (id.endsWith(".html") || id.endsWith(".css"))) {
        return { code: replaceTokens(code, config), map: null };
      }

      if (isBuild && id.endsWith(".css")) {
        return { code: escapeTokens(code), map: null };
      }

      return null;
    },

    generateBundle(_, bundle) {
      if (!isBuild) return;

      for (const [, chunk] of Object.entries(bundle)) {
        if (chunk.type === "asset" && chunk.fileName.endsWith(".css")) {
          chunk.source = restoreTokens(chunk.source as string);
          chunk.fileName = "widget.css";
        }
      }
    },
  };
}
