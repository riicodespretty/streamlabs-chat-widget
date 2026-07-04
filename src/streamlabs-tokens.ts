import type { Plugin } from "vite";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

interface WidgetConfig {
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
function replaceTokens(code: string, config: WidgetConfig): string {
  let result = code;
  result = result.replace(/\{background_color\}/g, config.background_color);
  result = result.replace(/\{font_size\}/g, config.font_size);
  result = result.replace(/\{text_color\}/g, config.text_color);
  result = result.replace(/\{message_hide_delay\}/g, config.message_hide_delay);
  return result;
}

export function streamlabsTokens(): Plugin {
  let config: WidgetConfig | null = null;
  let isDev = false;
  let isBuild = false;

  return {
    name: "streamlabs-tokens",
    enforce: "pre",

    configResolved(resolvedConfig) {
      isDev = resolvedConfig.command === "serve";
      isBuild = resolvedConfig.command === "build";
      try {
        const configPath = resolve(resolvedConfig.root, "widget.config.json");
        const raw = readFileSync(configPath, "utf-8");
        config = JSON.parse(raw) as WidgetConfig;
      } catch {
        config = null;
      }
    },

    transform(code, id) {
      // Dev mode: replace tokens with defaults so the widget renders correctly
      if (isDev && config && (id.endsWith(".html") || id.endsWith(".css"))) {
        return { code: replaceTokens(code, config), map: null };
      }

      // Build mode: escape tokens so PostCSS doesn't choke on {font_size} etc.
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
