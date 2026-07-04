import type { Plugin } from "vite";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

interface WidgetConfig {
  background_color: string;
  font_size: string;
  text_color: string;
  message_hide_delay: string;
}

export function streamlabsTokens(): Plugin {
  let config: WidgetConfig | null = null;

  return {
    name: "streamlabs-tokens",
    enforce: "pre",

    configResolved(resolvedConfig) {
      try {
        const configPath = resolve(resolvedConfig.root, "widget.config.json");
        const raw = readFileSync(configPath, "utf-8");
        config = JSON.parse(raw) as WidgetConfig;
      } catch {
        config = null;
      }
    },

    transform(code, id) {
      if (!config) return null;

      if (!id.endsWith(".html") && !id.endsWith(".css")) return null;

      let result = code;
      result = result.replace(/\{background_color\}/g, config.background_color);
      result = result.replace(/\{font_size\}/g, config.font_size);
      result = result.replace(/\{text_color\}/g, config.text_color);
      result = result.replace(/\{message_hide_delay\}/g, config.message_hide_delay);

      return { code: result, map: null };
    },
  };
}
