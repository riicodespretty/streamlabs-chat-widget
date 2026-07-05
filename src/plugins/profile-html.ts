import type { Plugin } from "vite";
import { resolve } from "node:path";
import { getProfileName } from "../shared/profiles";

const projectRoot = (import.meta as unknown as { dirname: string }).dirname;

/**
 * Dev-only plugin: middleware for HTML routing, profile-switch HMR full-reload,
 * and profile-switcher UI injection.
 */
export function profileHtmlPlugin(): Plugin {
  let isDev = false;

  return {
    name: "profile-html",
    configResolved(resolvedConfig) {
      isDev = resolvedConfig.command === "serve";
    },
    configureServer(server) {
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
    transformIndexHtml() {
      if (!isDev) return [];
      return [
        {
          tag: "script",
          attrs: { src: "/src/profile-switcher.ts", type: "module" },
          injectTo: "body",
        },
      ];
    },
  };
}
